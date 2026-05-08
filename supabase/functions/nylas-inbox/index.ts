import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const normalizeNylasApiUri = (value: string | undefined) => {
  let uri = (value?.trim() || "https://api.us.nylas.com").replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(uri)) uri = `https://${uri}`;
  return uri.replace(/\/v3$/i, "");
};

const NYLAS_API_URI = normalizeNylasApiUri(Deno.env.get("NYLAS_API_URI"));
const NYLAS_CLIENT_SECRET = Deno.env.get("NYLAS_CLIENT_SECRET")!;

async function nylas(path: string, init: RequestInit = {}) {
  const res = await fetch(`${NYLAS_API_URI}/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${NYLAS_CLIENT_SECRET}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Nylas ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: grant } = await sb.from("nylas_grants").select("grant_id,email").eq("user_id", user.id).maybeSingle();
    if (!grant) return new Response(JSON.stringify({ error: "no_grant" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;
    const g = grant.grant_id;

    if (action === "list_threads") {
      const limit = Math.min(Number(body.limit) || 25, 50);
      const params = new URLSearchParams({ limit: String(limit) });
      if (body.q) params.set("search_query_native", body.q);
      const data = await nylas(`/grants/${g}/threads?${params}`);
      return new Response(JSON.stringify({ email: grant.email, threads: data.data ?? [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get_thread") {
      const id = String(body.thread_id);
      const thread = await nylas(`/grants/${g}/threads/${id}`);
      const msgs = await nylas(`/grants/${g}/messages?thread_id=${id}&limit=50`);
      return new Response(JSON.stringify({ thread: thread.data, messages: msgs.data ?? [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "send") {
      const payload: Record<string, unknown> = {
        to: body.to, // [{email,name}]
        subject: body.subject ?? "",
        body: body.body ?? "",
      };
      if (body.cc) payload.cc = body.cc;
      if (body.reply_to_message_id) payload.reply_to_message_id = body.reply_to_message_id;
      const data = await nylas(`/grants/${g}/messages/send`, { method: "POST", body: JSON.stringify(payload) });
      return new Response(JSON.stringify({ ok: true, message: data.data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "disconnect") {
      try { await nylas(`/grants/${g}`, { method: "DELETE" }); } catch (_) { /* ignore */ }
      await sb.from("nylas_grants").delete().eq("user_id", user.id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "status") {
      return new Response(JSON.stringify({ connected: true, email: grant.email }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
