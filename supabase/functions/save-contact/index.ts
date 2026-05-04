// Save an Exa-discovered contact into the journalist or creators table.
// POST { kind: "journalists" | "creators", row: { name, outlet, title?, category?, country?, email?, source_url, ig_handle?, youtube_url? } }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    const body = await req.json();
    const kind: "journalists" | "creators" = body?.kind;
    const row = body?.row ?? {};
    if (!["journalists", "creators"].includes(kind)) {
      return new Response(JSON.stringify({ error: "invalid_kind" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!row.name || typeof row.name !== "string") {
      return new Response(JSON.stringify({ error: "name_required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const now = new Date().toISOString();

    if (kind === "journalists") {
      const insert: Record<string, unknown> = {
        name: row.name,
        outlet: row.outlet ?? null,
        category: row.category ?? null,
        titles: row.title ?? null,
        country: row.country ?? null,
        email: row.email ?? null,
      };
      // Try with enrichment columns first
      let { data, error } = await admin.from("journalist").insert({
        ...insert,
        enrichment_source_url: row.source_url ?? null,
        enriched_at: now,
      }).select("id").maybeSingle();
      if (error && /enrichment|enriched_at/.test(error.message)) {
        const r = await admin.from("journalist").insert(insert).select("id").maybeSingle();
        data = r.data; error = r.error;
      }
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ ok: true, id: data?.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // creators
    const insert: Record<string, unknown> = {
      name: row.name,
      category: row.category ?? null,
      email: row.email ?? null,
      ig_handle: row.ig_handle ?? null,
      youtube_url: row.youtube_url ?? null,
      type: row.outlet ?? null,
      bio: row.title ?? null,
    };
    let { data, error } = await admin.from("creators").insert({
      ...insert,
      enrichment_source_url: row.source_url ?? null,
      enriched_at: now,
    }).select("id").maybeSingle();
    if (error && /enrichment|enriched_at/.test(error.message)) {
      const r = await admin.from("creators").insert(insert).select("id").maybeSingle();
      data = r.data; error = r.error;
    }
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ ok: true, id: data?.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
