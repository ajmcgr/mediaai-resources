import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const _LOGO_URL = "https://trymedia.ai/email-logo-media.png";
const _BRAND_BLUE = "#1675e2";
const _PAGE_BG = "#f4f6f9";
const _CARD_BG = "#ffffff";
const _BORDER = "#e6e8ec";
const _DIVIDER = "#eef0f3";
const _HEADING = "#101214";
const _BODY_TEXT = "#4e5052";
const _MUTED = "#9aa0a6";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderEmail(opts: { heading: string; body: string; cta: { label: string; url: string }; preheader?: string }) {
  const { heading, body, cta, preheader = "" } = opts;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:${_PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#22252a;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${_PAGE_BG};padding:48px 16px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${_CARD_BG};border-radius:14px;overflow:hidden;border:1px solid ${_BORDER};">
<tr><td align="center" style="padding:34px 32px 26px;border-bottom:1px solid ${_DIVIDER};"><img src="${_LOGO_URL}" alt="Media AI" width="180" style="width:180px;max-width:180px;height:auto;display:inline-block;border:0;"/></td></tr>
<tr><td style="padding:36px 40px 32px;">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:700;color:${_HEADING};">${escapeHtml(heading)}</h1>
<div style="font-size:15px;line-height:1.6;color:${_BODY_TEXT};margin:0 0 28px;">${body}</div>
<div><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:${_BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 24px;border-radius:8px;">${escapeHtml(cta.label)}</a></div>
</td></tr></table>
<p style="margin:18px 0 0;font-size:12px;color:${_MUTED};">© ${new Date().getFullYear()} Media AI · trymedia.ai</p>
</td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const token = String(body.token ?? "");
    const recipients = Array.isArray(body.recipients)
      ? body.recipients.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];
    const note = body.note ? String(body.note).slice(0, 1000) : "";
    const senderName = body.senderName ? String(body.senderName).slice(0, 120) : "";
    const shareUrl = String(body.shareUrl ?? "");

    if (!token || !recipients.length || !shareUrl) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (recipients.length > 10) {
      return new Response(JSON.stringify({ error: "Max 10 recipients" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const r of recipients) {
      if (!emailRe.test(r)) {
        return new Response(JSON.stringify({ error: `Invalid email: ${r}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Verify ownership
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: share } = await admin
      .from("shared_list")
      .select("id,owner_user_id,list_id")
      .eq("token", token)
      .maybeSingle();
    if (!share || share.owner_user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Share not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: list } = await admin
      .from("journalist_list").select("name").eq("id", share.list_id).maybeSingle();
    const listName = list?.name ?? "Media list";

    const fromName = senderName || (user.email ?? "Someone");
    const heading = `${fromName} shared a media list with you`;
    const noteHtml = note
      ? `<div style="background:#f7f8fb;border-left:3px solid ${_BRAND_BLUE};padding:12px 14px;border-radius:6px;margin:0 0 18px;font-style:italic;color:#3a3d42;white-space:pre-wrap">${escapeHtml(note)}</div>`
      : "";
    const html = renderEmail({
      heading,
      preheader: `${fromName} shared "${listName}" via Media AI`,
      body: `${noteHtml}<p>You've been sent the list <strong>${escapeHtml(listName)}</strong> via Media AI. Click below to view contacts.</p>`,
      cta: { label: "View shared list", url: shareUrl },
    });

    const replyTo = user.email ?? undefined;
    const subject = `${fromName} shared "${listName}" with you`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Media AI <hello@trymedia.ai>",
        to: recipients,
        reply_to: replyTo,
        subject,
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
    console.error("share-list-email", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
