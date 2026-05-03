import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_ADDRESS = "Media AI <noreply@trymedia.ai>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, redirectTo } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !RESEND_API_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Always respond success to avoid email enumeration
    const respondOk = () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.action_link) {
      console.warn("generateLink failed:", error?.message);
      return respondOk();
    }

    const actionLink = data.properties.action_link;

    const html = `
      <div style="font-family: -apple-system, system-ui, Helvetica, Arial, sans-serif; color:#22252a; max-width:560px; margin:0 auto; padding:24px;">
        <h1 style="font-size:20px; font-weight:600; margin:0 0 16px;">Reset your password</h1>
        <p style="font-size:15px; line-height:1.5; margin:0 0 20px;">
          We received a request to reset the password for your Media AI account.
          Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <p style="margin:0 0 24px;">
          <a href="${actionLink}" style="display:inline-block; background:#4F8EF8; color:#fff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:500;">
            Reset password
          </a>
        </p>
        <p style="font-size:13px; color:#6b7076; line-height:1.5; margin:0 0 8px;">
          Or paste this link into your browser:
        </p>
        <p style="font-size:12px; color:#6b7076; word-break:break-all; margin:0 0 24px;">
          ${actionLink}
        </p>
        <p style="font-size:12px; color:#6b7076; margin:0;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;

    const sendRes = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject: "Reset your Media AI password",
        html,
      }),
    });

    if (!sendRes.ok) {
      const body = await sendRes.text();
      console.error(`Resend send failed [${sendRes.status}]: ${body}`);
    }

    return respondOk();
  } catch (e) {
    console.error("send-password-reset error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
