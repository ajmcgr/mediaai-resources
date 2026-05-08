import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const normalizeNylasApiUri = (value: string | undefined) => {
  let uri = (value?.trim() || "https://api.us.nylas.com").replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(uri)) uri = `https://${uri}`;
  return uri.replace(/\/v3$/i, "");
};

const html = (msg: string, ok: boolean) => `<!doctype html><html><body style="font-family:system-ui;padding:40px;text-align:center">
<h2>${ok ? "Inbox connected" : "Connection failed"}</h2>
<p>${msg}</p>
<script>
  try { window.opener && window.opener.postMessage({ type: "nylas:${ok ? "connected" : "error"}", message: ${JSON.stringify(msg)} }, "*"); } catch(e){}
  setTimeout(() => window.close(), 1500);
</script>
</body></html>`;

serve(async (req) => {
  try {
    const NYLAS_CLIENT_ID = Deno.env.get("NYLAS_CLIENT_ID")!;
    const NYLAS_CLIENT_SECRET = Deno.env.get("NYLAS_CLIENT_SECRET")!;
    const NYLAS_API_URI = normalizeNylasApiUri(Deno.env.get("NYLAS_API_URI"));
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const u = new URL(req.url);
    const code = u.searchParams.get("code");
    const state = u.searchParams.get("state"); // user_id
    const err = u.searchParams.get("error");
    if (err) return new Response(html(err, false), { headers: { "Content-Type": "text/html" } });
    if (!code || !state) return new Response(html("Missing code/state", false), { headers: { "Content-Type": "text/html" } });

    const tokenRes = await fetch(`${NYLAS_API_URI}/v3/connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: NYLAS_CLIENT_ID,
        client_secret: NYLAS_CLIENT_SECRET,
        code,
        redirect_uri: `${SUPABASE_URL}/functions/v1/nylas-auth-callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return new Response(html(JSON.stringify(tokenData), false), { headers: { "Content-Type": "text/html" } });

    const grantId = tokenData.grant_id;
    const email = tokenData.email;
    const provider = tokenData.provider;

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { error } = await sb.from("nylas_grants").upsert({
      user_id: state, grant_id: grantId, email, provider, updated_at: new Date().toISOString(),
    });
    if (error) return new Response(html(error.message, false), { headers: { "Content-Type": "text/html" } });

    return new Response(html(`Connected ${email}`, true), { headers: { "Content-Type": "text/html" } });
  } catch (e) {
    return new Response(html(e instanceof Error ? e.message : "error", false), { headers: { "Content-Type": "text/html" } });
  }
});
