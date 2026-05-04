// Enrich a journalist or creator's missing email by searching the public web with Exa.
// POST { kind: "journalist" | "creator", id: number }
// Returns { ok, email?, source_url?, message? }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

async function exaContents(query: string): Promise<Array<{ url: string; text: string }>> {
  const key = Deno.env.get("EXA_API_KEY");
  if (!key) return [];
  const r = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      query,
      numResults: 6,
      useAutoprompt: true,
      type: "neural",
      contents: { text: { maxCharacters: 4000 } },
    }),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.results ?? []).map((x: { url: string; text?: string }) => ({ url: x.url, text: x.text ?? "" }));
}

function pickEmail(text: string, name?: string): string | null {
  const matches = text.match(new RegExp(EMAIL_RE.source, "gi")) ?? [];
  if (!matches.length) return null;
  // Prefer emails matching the name's first/last token
  if (name) {
    const tokens = name.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    for (const m of matches) {
      const lc = m.toLowerCase();
      if (tokens.some((t) => lc.includes(t))) return m;
    }
  }
  // Else avoid generic addresses
  const filtered = matches.filter((m) => !/^(info|hello|contact|support|press|admin|noreply|no-reply|sales|hr)@/i.test(m));
  return filtered[0] ?? matches[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return new Response(JSON.stringify({ error: "auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { kind, id } = await req.json();
    if (!["journalist", "creator"].includes(kind) || !Number.isFinite(Number(id))) {
      return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const table = kind === "journalist" ? "journalist" : "creators";
    const { data: row, error: rowErr } = await admin.from(table).select("*").eq("id", id).maybeSingle();
    if (rowErr || !row) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (row.email) {
      return new Response(JSON.stringify({ ok: true, email: row.email, message: "already had email" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const name = String(row.name ?? "").trim();
    const outlet = String(row.outlet ?? "").trim();
    if (!name) return new Response(JSON.stringify({ error: "no_name" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const queries = [
      kind === "journalist" && outlet ? `"${name}" ${outlet} email contact` : null,
      `"${name}" email contact press`,
      `"${name}" ${outlet || ""} author profile`,
    ].filter(Boolean) as string[];

    let foundEmail: string | null = null;
    let sourceUrl: string | null = null;
    for (const q of queries) {
      const items = await exaContents(q);
      for (const it of items) {
        const e = pickEmail(it.text, name);
        if (e) { foundEmail = e; sourceUrl = it.url; break; }
      }
      if (foundEmail) break;
    }

    if (!foundEmail || !sourceUrl) {
      return new Response(JSON.stringify({ ok: false, message: "No public email found." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Try to persist; gracefully handle missing columns
    const update: Record<string, unknown> = {
      email: foundEmail,
      enrichment_source_url: sourceUrl,
      enriched_at: new Date().toISOString(),
    };
    let { error: upErr } = await admin.from(table).update(update).eq("id", id);
    if (upErr && (upErr.message?.includes("enrichment_source_url") || upErr.message?.includes("enriched_at"))) {
      const r = await admin.from(table).update({ email: foundEmail }).eq("id", id);
      upErr = r.error;
    }
    if (upErr) {
      return new Response(JSON.stringify({ ok: false, message: `Found email but failed to save: ${upErr.message}`, email: foundEmail, source_url: sourceUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, email: foundEmail, source_url: sourceUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
