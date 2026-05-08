import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-supabase-api-version",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version",
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
].join(", ");

const corsHeaders = (req: Request) => ({
  "Access-Control-Allow-Origin": req.headers.get("Origin") ?? "*",
  "Access-Control-Allow-Headers": req.headers.get("Access-Control-Request-Headers") ?? DEFAULT_ALLOWED_HEADERS,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin, Access-Control-Request-Headers",
});

const json = (req: Request, body: Record<string, unknown>, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
};

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Server is missing required secret: ${name}`);
  return value;
};

const normalizeNylasApiUri = (value: string | undefined) => {
  let uri = (value?.trim() || "https://api.us.nylas.com").replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(uri)) uri = `https://${uri}`;
  return uri.replace(/\/v3$/i, "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders(req) });

  try {
    const NYLAS_CLIENT_ID = requiredEnv("NYLAS_CLIENT_ID");
    const NYLAS_API_URI = normalizeNylasApiUri(Deno.env.get("NYLAS_API_URI"));
    const SUPABASE_URL = requiredEnv("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")?.trim() || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")?.trim();
    if (!SUPABASE_ANON_KEY) throw new Error("Server is missing required secret: SUPABASE_ANON_KEY");

    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json(req, { error: "unauthorized" }, 401);

    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const token = auth.replace(/^Bearer\s+/i, "");
    const { data, error } = await sb.auth.getClaims(token);
    if (error || !data?.claims?.sub) return json(req, { error: "unauthorized" }, 401);

    const redirectUri = `${SUPABASE_URL}/functions/v1/nylas-auth-callback`;
    const url = new URL(`${NYLAS_API_URI}/v3/connect/auth`);
    url.searchParams.set("client_id", NYLAS_CLIENT_ID);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("state", data.claims.sub);
    url.searchParams.set("scope", "email.read_only email.send email.modify");

    return json(req, { url: url.toString() });
  } catch (e) {
    console.error("nylas-auth-start error", e);
    const message = e instanceof Error ? e.message : "error";
    const status = message.startsWith("Server is missing required secret:") ? 503 : 500;
    return json(req, { error: message }, status);
  }
});
