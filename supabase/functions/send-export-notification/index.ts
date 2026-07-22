import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOGO_URL = "https://trymedia.ai/email-logo-media.png";
const BRAND_BLUE = "#1675e2";
const PAGE_BG = "#f4f6f9";
const CARD_BG = "#ffffff";
const BORDER = "#e6e8ec";
const DIVIDER = "#eef0f3";
const HEADING = "#101214";
const BODY_TEXT = "#4e5052";
const MUTED = "#9aa0a6";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderEmail(opts: { heading: string; body: string; cta: { label: string; url: string }; preheader?: string }) {
  const { heading, body, cta, preheader = "" } = opts;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#22252a;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:48px 16px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${CARD_BG};border-radius:14px;overflow:hidden;border:1px solid ${BORDER};">
<tr><td align="center" style="padding:34px 32px 26px;border-bottom:1px solid ${DIVIDER};"><img src="${LOGO_URL}" alt="Media AI" width="180" style="width:180px;max-width:180px;height:auto;display:inline-block;border:0;"/></td></tr>
<tr><td style="padding:36px 40px 32px;">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:700;color:${HEADING};">${escapeHtml(heading)}</h1>
<div style="font-size:15px;line-height:1.6;color:${BODY_TEXT};margin:0 0 28px;">${body}</div>
<div><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 24px;border-radius:8px;">${escapeHtml(cta.label)}</a></div>
</td></tr></table>
<p style="margin:18px 0 0;font-size:12px;color:${MUTED};">© ${new Date().getFullYear()} Media AI · trymedia.ai</p>
</td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const filename = String(body.filename ?? "export.csv").slice(0, 200);
    const rowCount = Number.isFinite(Number(body.rowCount)) ? Number(body.rowCount) : null;
    const source = body.source ? String(body.source).slice(0, 100) : "";

    const firstName = (user.user_metadata?.full_name || user.email || "").split(" ")[0] || "there";
    const heading = "Your media list export is ready";
    const details = [
      `<p>Hi ${escapeHtml(firstName)},</p>`,
      `<p>Your export <strong>${escapeHtml(filename)}</strong> was downloaded successfully${rowCount !== null ? ` with <strong>${rowCount}</strong> ${rowCount === 1 ? "contact" : "contacts"}` : ""}${source ? ` from ${escapeHtml(source)}` : ""}.</p>`,
      `<p>You can find and re-export your saved lists any time from your workspace.</p>`,
      `<p style="color:${MUTED};font-size:13px;">If you didn't perform this export, please reply to this email so we can look into it.</p>`,
    ].join("");

    const html = renderEmail({
      heading,
      preheader: `Your export ${filename} is ready`,
      body: details,
      cta: { label: "Open Media AI", url: "https://trymedia.ai/chat" },
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Media AI <hello@trymedia.ai>",
        to: [user.email],
        subject: heading,
        html,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Resend error", response.status, data);
      throw new Error(`Resend failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("send-export-notification", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
