
// ===== Inlined branded email template =====
const _LOGO_URL = "https://trymedia.ai/email-logo-media.png";
const _BRAND_BLUE = "#1675e2";
const _PAGE_BG = "#f4f6f9";
const _CARD_BG = "#ffffff";
const _BORDER = "#e6e8ec";
const _DIVIDER = "#eef0f3";
const _HEADING = "#101214";
const _BODY_TEXT = "#4e5052";
const _MUTED = "#9aa0a6";

interface BrandedEmailOptions {
  preheader?: string;
  heading: string;
  body: string;
  cta?: { label: string; url: string };
  footerNote?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderBrandedEmail(opts: BrandedEmailOptions): string {
  const { preheader = "", heading, body, cta, footerNote } = opts;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${_PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#22252a;-webkit-font-smoothing:antialiased;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${_PAGE_BG};padding:48px 16px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${_CARD_BG};border-radius:14px;overflow:hidden;border:1px solid ${_BORDER};">
<tr><td align="center" style="padding:34px 32px 26px;border-bottom:1px solid ${_DIVIDER};"><img src="${_LOGO_URL}" alt="Media AI" width="180" style="width:180px;max-width:180px;height:auto;display:inline-block;border:0;outline:none;text-decoration:none;" /></td></tr>
<tr><td style="padding:36px 40px ${cta || footerNote ? "32px" : "40px"};">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:700;color:${_HEADING};">${heading}</h1>
<div style="font-size:15px;line-height:1.6;color:${_BODY_TEXT};margin:0 0 ${cta ? "28px" : "0"};">${body}</div>
${cta ? `<div><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:${_BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 24px;border-radius:8px;">${escapeHtml(cta.label)}</a></div>` : ""}
</td></tr>
${footerNote ? `<tr><td align="center" style="padding:20px 32px 28px;border-top:1px solid ${_DIVIDER};"><p style="margin:0;font-size:13px;color:${_MUTED};line-height:1.5;">${footerNote}</p></td></tr>` : ""}
</table>
<p style="margin:18px 0 0;font-size:12px;color:${_MUTED};">© ${new Date().getFullYear()} Media AI · trymedia.ai</p>
</td></tr></table></body></html>`;
}
// ===== End inlined template =====

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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
    const { email } = await req.json();
    // Always use production reset page; ignore client-supplied redirectTo
    const redirectTo = "https://trymedia.ai/reset-password";
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

    const tokenHash = data?.properties?.hashed_token;

    if (error || !tokenHash) {
      console.warn("generateLink failed:", error?.message);
      return respondOk();
    }

    const actionLink = `https://trymedia.ai/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=%2Freset-password`;

    const html = renderBrandedEmail({
      preheader: "Reset your Media AI password",
      heading: "Reset your Media AI password",
      body: `Click the button below to choose a new password for your Media AI account. This link expires in 1 hour.<br/><br/><span style="font-size:12px;color:#9aa0a6;word-break:break-all;">Or paste this link: ${escapeHtml(actionLink)}</span>`,
      cta: { label: "Choose new password", url: actionLink },
      footerNote: "If you didn't request a password reset, you can safely ignore this email.",
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
