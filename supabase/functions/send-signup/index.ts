import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { renderBrandedEmail, escapeHtml } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_ADDRESS = "Media <hello@trymedia.ai>";
const APP_URL = "https://trymedia.ai";

function getSafeRedirectTo(value: unknown): string {
  if (typeof value !== "string") return `${APP_URL}/chat`;

  try {
    const url = new URL(value);
    return url.origin === APP_URL ? url.toString() : `${APP_URL}/chat`;
  } catch {
    return `${APP_URL}/chat`;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, displayName, company, redirectTo } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email and password are required" }), {
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

    // Create unconfirmed user (no auto email from Supabase)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { display_name: displayName, company },
    });

    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeRedirectTo = getSafeRedirectTo(redirectTo);

    // Generate confirmation link
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { redirectTo: safeRedirectTo },
    });

    if (linkErr || (!linkData?.properties?.hashed_token && !linkData?.properties?.action_link)) {
      console.warn("generateLink signup failed:", linkErr?.message);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hashedToken = linkData.properties.hashed_token;
    const actionLink = hashedToken
      ? `${APP_URL}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=signup&next=${encodeURIComponent("/chat")}`
      : linkData.properties.action_link;
    const name = displayName ? String(displayName).split(" ")[0] : "there";

    const html = renderBrandedEmail({
      preheader: "Confirm your Media AI account",
      heading: `Welcome to Media AI, ${escapeHtml(name)}`,
      body: `Confirm your email to activate your account and start finding journalists and creators.<br/><br/><span style="font-size:12px;color:#9aa0a6;word-break:break-all;">Or paste this link: ${escapeHtml(actionLink)}</span>`,
      cta: { label: "Confirm email", url: actionLink },
      footerNote: "If you didn't create an account, you can safely ignore this email.",
    });

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
        subject: "Confirm your Media AI account",
        html,
      }),
    });

    if (!sendRes.ok) {
      const body = await sendRes.text();
      console.error(`Resend signup send failed [${sendRes.status}]: ${body}`);
    }

    return new Response(JSON.stringify({ ok: true, userId: created.user?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-signup error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
