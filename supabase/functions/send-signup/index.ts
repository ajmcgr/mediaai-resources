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
const CONFIRM_REDIRECT_URL = "https://trymedia.ai/chat";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, displayName, company } = await req.json();

    if (!email || typeof email !== "string") {
      return response({ error: "email is required" }, 400);
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return response({ error: "password must be at least 8 characters" }, 400);
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!lovableApiKey || !resendApiKey || !supabaseUrl || !serviceRole) {
      return response({ error: "Server not configured" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email: normalizedEmail,
      password,
      options: {
        redirectTo: CONFIRM_REDIRECT_URL,
        data: {
          display_name: typeof displayName === "string" ? displayName : "",
          company: typeof company === "string" ? company : "",
        },
      },
    });

    const tokenHash = data?.properties?.hashed_token;

    if (error || !data?.properties?.action_link || !tokenHash) {
      const message = error?.message ?? "Could not create signup link";
      const status = /already registered|already been registered|user already/i.test(message) ? 409 : 400;
      return response({ error: message }, status);
    }

    const actionLink = `https://trymedia.ai/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=signup&next=%2Fchat`;
    const firstName = typeof displayName === "string" && displayName.trim() ? displayName.trim().split(/\s+/)[0] : "";

    const html = renderBrandedEmail({
      preheader: "Confirm your Media AI account",
      heading: firstName ? `Welcome to Media AI, ${escapeHtml(firstName)}` : "Confirm your account",
      body: `Confirm your email to activate your account and start finding journalists and creators.<br/><br/><span style="font-size:12px;color:#9aa0a6;word-break:break-all;">Or paste this link: ${escapeHtml(actionLink)}</span>`,
      cta: { label: "Confirm email", url: actionLink },
      footerNote: "If you didn't create an account, you can safely ignore this email.",
    });

    const sendRes = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": resendApiKey,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [normalizedEmail],
        subject: "Confirm your Media AI account",
        html,
      }),
    });

    if (!sendRes.ok) {
      const bodyText = await sendRes.text();
      console.error(`signup email send failed [${sendRes.status}]: ${bodyText}`);
      return response({ error: "Could not send confirmation email" }, 502);
    }

    return response({ ok: true });
  } catch (e) {
    console.error("send-signup error:", e);
    return response({ error: "Unexpected error" }, 500);
  }
});

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
