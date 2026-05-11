// Sends a one-time testimonial request email to users ~30 days after signup.
// Designed to be called daily via pg_cron (or manually with ?dry_run=1).
// Auth: requires the SUPABASE_SERVICE_ROLE_KEY as a Bearer token (cron uses it).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_ADDRESS = "Media <hello@trymedia.ai>";
const TESTIMONIAL_URL = "https://senja.io/p/works/r/zsoofv";
const REPLY_TO = "hello@trymedia.ai";

// Branding (matches other transactional emails)
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

function renderEmail(firstName: string): string {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Share your Media AI experience</title></head>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#22252a;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Leave a quick testimonial and get 10% off your future billing — forever.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:48px 16px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${CARD_BG};border-radius:14px;overflow:hidden;border:1px solid ${BORDER};">
<tr><td align="center" style="padding:34px 32px 26px;border-bottom:1px solid ${DIVIDER};">
<img src="${LOGO_URL}" alt="Media AI" width="180" style="width:180px;max-width:180px;height:auto;display:inline-block;border:0;outline:none;text-decoration:none;"/></td></tr>
<tr><td style="padding:36px 40px 32px;">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:700;color:${HEADING};">Get 10% off — forever — for a quick testimonial</h1>
<div style="font-size:15px;line-height:1.6;color:${BODY_TEXT};margin:0 0 24px;">
<p style="margin:0 0 14px;">${greeting}</p>
<p style="margin:0 0 14px;">You've been using Media AI for about a month now — we'd love to hear how it's going. If you've got 60 seconds, would you leave us a short testimonial?</p>
<p style="margin:0 0 14px;"><strong>Here's the deal:</strong> once you submit it, just <strong>reply to this email</strong> to let us know, and we'll apply <strong>10% off all your future billing</strong>.</p>
</div>
<div style="margin:0 0 28px;"><a href="${TESTIMONIAL_URL}" style="display:inline-block;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 24px;border-radius:8px;">Leave a testimonial</a></div>
<div style="font-size:13px;line-height:1.6;color:${MUTED};">Or paste this link into your browser:<br/><span style="word-break:break-all;">${TESTIMONIAL_URL}</span></div>
</td></tr>
<tr><td align="center" style="padding:20px 32px 28px;border-top:1px solid ${DIVIDER};">
<p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">Thanks for being an early Media AI user. — The team</p>
</td></tr>
</table>
<p style="margin:18px 0 0;font-size:12px;color:${MUTED};">© ${new Date().getFullYear()} Media AI · trymedia.ai</p>
</td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "1";

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!resendKey || !supabaseUrl || !serviceRole) {
    return json({ error: "Server not configured" }, 500);
  }

  // Require service-role bearer token to invoke (cron sends this).
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== serviceRole) {
    return json({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find users who signed up between 30 and 60 days ago and haven't been emailed yet.
  // We use a window (not exactly "30 days ago") so we still catch users if cron skips a day.
  const now = Date.now();
  const minAgeMs = 30 * 24 * 60 * 60 * 1000;
  const maxAgeMs = 60 * 24 * 60 * 60 * 1000;
  const upperBound = new Date(now - minAgeMs).toISOString(); // created_at <= 30 days ago
  const lowerBound = new Date(now - maxAgeMs).toISOString(); // created_at >= 60 days ago

  // Pull recent users via admin API. Page through up to ~1000 users.
  const candidates: { id: string; email: string; first_name: string }[] = [];
  let page = 1;
  const perPage = 200;
  while (page <= 5) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return json({ error: error.message }, 500);
    const users = data?.users ?? [];
    for (const u of users) {
      if (!u.email || !u.created_at) continue;
      if (u.created_at > upperBound) continue; // too new
      if (u.created_at < lowerBound) continue; // too old, skip (avoids spamming history)
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      const display = typeof meta.display_name === "string" ? meta.display_name : "";
      const firstName = display.trim().split(/\s+/)[0] ?? "";
      candidates.push({ id: u.id, email: u.email.toLowerCase(), first_name: firstName });
    }
    if (users.length < perPage) break;
    page++;
  }

  if (candidates.length === 0) {
    return json({ ok: true, considered: 0, sent: 0, dry_run: dryRun });
  }

  // Filter out anyone already in the log.
  const ids = candidates.map((c) => c.id);
  const { data: existing, error: logErr } = await admin
    .from("testimonial_email_log")
    .select("user_id")
    .in("user_id", ids);
  if (logErr) return json({ error: logErr.message }, 500);
  const sentSet = new Set((existing ?? []).map((r) => r.user_id as string));
  const toSend = candidates.filter((c) => !sentSet.has(c.id));

  if (dryRun) {
    return json({ ok: true, considered: candidates.length, would_send: toSend.length, dry_run: true });
  }

  let sent = 0;
  const failures: { email: string; error: string }[] = [];

  for (const u of toSend) {
    const html = renderEmail(u.first_name);
    const textBody = `Hi${u.first_name ? " " + u.first_name : ""},\n\n` +
      `You've been using Media AI for about a month now — we'd love to hear how it's going.\n` +
      `If you've got 60 seconds, would you leave us a short testimonial?\n\n` +
      `Here's the deal: once you submit it, just reply to this email to let us know, ` +
      `and we'll apply 10% off all your future billing.\n\n` +
      `Leave a testimonial: ${TESTIMONIAL_URL}\n\n` +
      `Thanks for being an early Media AI user. — The team`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [u.email],
        reply_to: REPLY_TO,
        subject: "Get 10% off forever for a quick Media AI testimonial",
        html,
        text: textBody,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      failures.push({ email: u.email, error: `${res.status}: ${detail.slice(0, 200)}` });
      continue;
    }

    const { error: insErr } = await admin
      .from("testimonial_email_log")
      .insert({ user_id: u.id, email: u.email });
    if (insErr) {
      // Email already sent but log failed — record the failure but don't double-send next time
      // because the unique index on user_id will prevent dupes if the row eventually lands.
      failures.push({ email: u.email, error: `log_insert: ${insErr.message}` });
    }
    sent++;
  }

  return json({ ok: true, considered: candidates.length, sent, failures });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
