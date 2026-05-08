import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { renderBrandedEmail, escapeHtml } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

const FROM_ADDRESS = "Media <hello@trymedia.ai>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { email, redirectTo } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const missing = [
      ["RESEND_API_KEY", RESEND_API_KEY],
      ["SUPABASE_URL", SUPABASE_URL],
      ["SUPABASE_SERVICE_ROLE_KEY", SERVICE_ROLE],
    ].filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) {
      console.error("send-password-reset missing config:", missing);
      return new Response(JSON.stringify({ error: "Server not configured", missing }), {
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

    const html = renderBrandedEmail({
      preheader: "Reset your Media password",
      heading: "Reset your password",
      body: `Thanks for using Media. Click the button below to choose a new password. This link expires in 1 hour.<br/><br/><span style="font-size:12px;color:#9aa0a6;word-break:break-all;">Or paste this link: ${escapeHtml(actionLink)}</span>`,
      cta: { label: "Reset password", url: actionLink },
      footerNote: "If you didn't request this email, you can safely ignore it.",
    });

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
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
