// Enrich missing fields on a journalist or creator row using Exa + Lovable AI Gateway.
// POST { kind: "journalist" | "creator", id: number, fields?: string[] }
// If `fields` is omitted, enriches all empty/null fields the row supports.
// Returns { ok, updated: Record<string, unknown>, source_urls: string[], message? }
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "X-Enrich-Version": "cors-fix-001",
};

const JOURNALIST_FIELDS = ["email", "category", "titles", "xhandle", "outlet", "country"] as const;
const CREATOR_FIELDS = ["email", "category", "bio", "ig_handle", "youtube_url", "type"] as const;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BAD_EMAIL_RE = /^(info|hello|contact|support|press|admin|noreply|no-reply|sales|hr|webmaster|privacy|legal|advertising|subscribe|newsletter|tips)@/i;

const FIELD_DESCRIPTIONS: Record<string, string> = {
  email: "Direct professional email address (avoid generic info@/press@).",
  category: "Primary beat or topic category (e.g. Technology, Finance, Health).",
  titles: "Current job title(s) at their outlet (e.g. Senior Reporter).",
  xhandle: "X/Twitter handle starting with @.",
  outlet: "Name of the publication or outlet they write for.",
  country: "Country they are based in.",
  bio: "Short professional bio (1-2 sentences).",
  ig_handle: "Instagram handle starting with @.",
  youtube_url: "Full YouTube channel URL.",
  type: "Creator type (e.g. Influencer, Educator, Vlogger).",
};

async function exaSearch(query: string, numResults = 5): Promise<Array<{ url: string; text: string }>> {
  const key = Deno.env.get("EXA_API_KEY");
  if (!key) return [];
  const r = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      query, numResults, useAutoprompt: true, type: "neural",
      contents: { text: { maxCharacters: 4000 } },
    }),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return (data.results ?? []).map((x: { url: string; text?: string }) => ({ url: x.url, text: x.text ?? "" }));
}

function hostFrom(value: string): string | null {
  try { return new URL(value.startsWith("http") ? value : `https://${value}`).hostname.replace(/^www\./, ""); } catch { return null; }
}

function pickEmail(snippets: Array<{ url: string; text: string }>, name: string): { email: string; source_url: string } | null {
  const nameParts = name.toLowerCase().split(/\s+/).filter((p) => p.length > 2);
  const matches = snippets.flatMap((s) => (`${s.url}\n${s.text}`.match(EMAIL_RE) ?? []).map((raw) => ({
    email: raw.trim().replace(/[),.;:]+$/, ""),
    source_url: s.url,
  }))).filter((m) => !BAD_EMAIL_RE.test(m.email) && !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(m.email));
  if (!matches.length) return null;
  return matches.find((m) => nameParts.some((p) => m.email.toLowerCase().includes(p))) ?? matches[0];
}

async function extractFields(
  name: string,
  context: string,
  snippets: Array<{ url: string; text: string }>,
  fields: string[],
): Promise<Record<string, string>> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key || !snippets.length) return {};
  const fieldList = fields.map((f) => `- ${f}: ${FIELD_DESCRIPTIONS[f] ?? f}`).join("\n");
  const corpus = snippets
    .slice(0, 6)
    .map((s, i) => `[Source ${i + 1}] ${s.url}\n${s.text.slice(0, 1500)}`)
    .join("\n\n");
  const prompt = `You are extracting verified contact details for "${name}"${context ? ` (${context})` : ""}.
Only return values explicitly supported by the sources. If unsure, omit the field.
Return JSON with these fields (omit any you cannot verify):
${fieldList}

Sources:
${corpus}`;

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Return only a single JSON object. No markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!r.ok) return {};
    const j = await r.json();
    const txt = j.choices?.[0]?.message?.content ?? "";
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return {};
    const parsed = JSON.parse(m[0]);
    const out: Record<string, string> = {};
    for (const f of fields) {
      const v = parsed[f];
      if (typeof v === "string" && v.trim()) out[f] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return new Response(JSON.stringify({ error: "auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { kind, id, fields: requestedFields, contact } = await req.json();
    if (!["journalist", "creator"].includes(kind) || !Number.isFinite(Number(id))) {
      return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const table = kind === "journalist" ? "journalist" : "creators";
    const { data: row, error: rowErr } = await admin.from(table).select("*").eq("id", id).maybeSingle();
    if (rowErr || !row) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const allFields = (kind === "journalist" ? JOURNALIST_FIELDS : CREATOR_FIELDS) as readonly string[];
    const targetFields = (Array.isArray(requestedFields) && requestedFields.length
      ? requestedFields.filter((f: string) => allFields.includes(f))
      : allFields.filter((f) => row[f] === null || row[f] === undefined || row[f] === ""));

    if (!targetFields.length) {
      return new Response(JSON.stringify({ ok: true, updated: {}, source_urls: [], message: "Nothing to enrich." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const name = String(row.name ?? "").trim();
    if (!name) return new Response(JSON.stringify({ error: "no_name" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const outlet = String(row.outlet ?? contact?.outlet ?? "").trim();
    const sourceUrl = String(contact?.source_url ?? row.enrichment_source_url ?? "").trim();
    const outletDomain = hostFrom(sourceUrl) ?? hostFrom(outlet) ?? "";
    const context = [outlet, row.category, row.country].filter(Boolean).join(" · ");

    const queries = [
      `"${name}" ${outlet} email contact`,
      kind === "journalist" && outletDomain ? `"${name}" journalist contact site:${outletDomain}` : null,
      kind === "journalist" && outlet ? `"${name}" ${outlet} journalist contact profile` : null,
      kind === "creator" ? `"${name}" creator instagram youtube profile` : null,
      `"${name}" email address journalist`,
      `"${name}" author profile bio`,
    ].filter(Boolean) as string[];

    const settled = await Promise.all(queries.map((q) => exaSearch(q, 10)));
    const allSnippets = settled.flat().filter((s, i, arr) => s.url && arr.findIndex((x) => x.url === s.url) === i).slice(0, 30);

    if (!allSnippets.length) {
      return new Response(JSON.stringify({ ok: false, message: "No sources found." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const extracted = await extractFields(name, context, allSnippets, targetFields);
    if (extracted.email) {
      const cleaned = extracted.email.trim().replace(/[),.;:]+$/, "");
      if (!cleaned.includes("@") || BAD_EMAIL_RE.test(cleaned)) delete extracted.email;
      else extracted.email = cleaned;
    }
    let emailSourceUrl = allSnippets[0]?.url ?? null;
    if (targetFields.includes("email") && !extracted.email) {
      const directEmail = pickEmail(allSnippets, name);
      if (directEmail) {
        extracted.email = directEmail.email;
        emailSourceUrl = directEmail.source_url;
      }
    }
    if (!Object.keys(extracted).length) {
      return new Response(JSON.stringify({ ok: false, message: targetFields.includes("email") ? "Email not publicly found" : "No verifiable details found.", source_urls: allSnippets.map((s) => s.url) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const update: Record<string, unknown> = { ...extracted };
    update.enrichment_source_url = emailSourceUrl;
    update.enriched_at = new Date().toISOString();

    let { error: upErr } = await admin.from(table).update(update).eq("id", id);
    if (upErr && /enrichment_source_url|enriched_at/.test(upErr.message ?? "")) {
      const r = await admin.from(table).update(extracted).eq("id", id);
      upErr = r.error;
    }
    if (upErr) {
      return new Response(JSON.stringify({ ok: false, message: `Found data but failed to save: ${upErr.message}`, updated: extracted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ ok: true, updated: extracted, source_urls: allSnippets.slice(0, 3).map((s) => s.url) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
