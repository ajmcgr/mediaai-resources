// Save an Exa-discovered contact into the journalist or creators table.
// POST { kind: "journalists" | "creators", row: { name, outlet, title?, category?, country?, email?, source_url, ig_handle?, youtube_url? } }
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AdminClient = ReturnType<typeof createClient>;

type SaveRow = {
  name?: string;
  outlet?: string | null;
  title?: string | null;
  category?: string | null;
  country?: string | null;
  email?: string | null;
  source_url?: string | null;
  ig_handle?: string | null;
  youtube_url?: string | null;
};

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function findExistingJournalist(admin: AdminClient, row: SaveRow): Promise<number | null> {
  const email = clean(row.email);
  if (email) {
    const { data } = await admin
      .from("journalist")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (typeof data?.id === "number") return data.id;
  }

  const name = clean(row.name);
  const outlet = clean(row.outlet);
  if (name && outlet) {
    const { data } = await admin
      .from("journalist")
      .select("id")
      .eq("name", name)
      .eq("outlet", outlet)
      .limit(1)
      .maybeSingle();
    if (typeof data?.id === "number") return data.id;
  }

  return null;
}

async function findExistingCreator(admin: AdminClient, row: SaveRow): Promise<number | null> {
  const email = clean(row.email);
  if (email) {
    const { data } = await admin
      .from("creators")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (typeof data?.id === "number") return data.id;
  }

  const igHandle = clean(row.ig_handle);
  if (igHandle) {
    const { data } = await admin
      .from("creators")
      .select("id")
      .eq("ig_handle", igHandle)
      .limit(1)
      .maybeSingle();
    if (typeof data?.id === "number") return data.id;
  }

  const youtubeUrl = clean(row.youtube_url);
  if (youtubeUrl) {
    const { data } = await admin
      .from("creators")
      .select("id")
      .eq("youtube_url", youtubeUrl)
      .limit(1)
      .maybeSingle();
    if (typeof data?.id === "number") return data.id;
  }

  const name = clean(row.name);
  const type = clean(row.outlet);
  if (name && type) {
    const { data } = await admin
      .from("creators")
      .select("id")
      .eq("name", name)
      .eq("type", type)
      .limit(1)
      .maybeSingle();
    if (typeof data?.id === "number") return data.id;
  }

  return null;
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

    const body = await req.json();
    const kind: "journalists" | "creators" = body?.kind;
    const row: SaveRow = body?.row ?? {};
    if (!["journalists", "creators"].includes(kind)) {
      return new Response(JSON.stringify({ error: "invalid_kind" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!clean(row.name)) {
      return new Response(JSON.stringify({ error: "name_required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const now = new Date().toISOString();

    if (kind === "journalists") {
      const existingId = await findExistingJournalist(admin, row);
      if (existingId !== null) {
        return new Response(JSON.stringify({ ok: true, id: existingId, existing: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const insert: Record<string, unknown> = {
        name: clean(row.name),
        outlet: clean(row.outlet),
        category: clean(row.category),
        titles: clean(row.title),
        country: clean(row.country),
        email: clean(row.email),
      };
      let { data, error } = await admin.from("journalist").insert({
        ...insert,
        enrichment_source_url: clean(row.source_url),
        enriched_at: now,
      }).select("id").maybeSingle();
      if (error && /enrichment|enriched_at/.test(error.message)) {
        const r = await admin.from("journalist").insert(insert).select("id").maybeSingle();
        data = r.data; error = r.error;
      }
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ ok: true, id: data?.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const existingId = await findExistingCreator(admin, row);
    if (existingId !== null) {
      return new Response(JSON.stringify({ ok: true, id: existingId, existing: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const insert: Record<string, unknown> = {
      name: clean(row.name),
      category: clean(row.category),
      email: clean(row.email),
      ig_handle: clean(row.ig_handle),
      youtube_url: clean(row.youtube_url),
      type: clean(row.outlet),
      bio: clean(row.title),
    };
    let { data, error } = await admin.from("creators").insert({
      ...insert,
      enrichment_source_url: clean(row.source_url),
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
