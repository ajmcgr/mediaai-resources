// Iterate all active monitors and invoke monitor-check for each.
// Triggered by pg_cron daily. Also sends daily/weekly digest emails.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const APP_URL = "https://trymedia.ai/monitor";

async function sendDigest(opts: {
  to: string;
  brand: string;
  frequency: "daily" | "weekly";
  mentions: Array<{ title: string; url: string; publisher: string | null; mention_type: string | null; sentiment: string | null }>;
}) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim() ?? "";
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")?.trim() ?? "";
  if (!resendApiKey || !lovableApiKey) return false;

  const { renderBrandedEmail } = await import("../_shared/email-template.ts");
  const items = opts.mentions.slice(0, 8).map((m) => `
    <p style="margin:0 0 10px;font-size:14px;line-height:1.45">
      <a href="${m.url}" style="color:#1675e2;text-decoration:none;font-weight:600">${m.title}</a><br/>
      <span style="color:#9aa0a6;font-size:12px">${m.publisher ?? ""} · ${m.mention_type ?? ""} · ${m.sentiment ?? ""}</span>
    </p>
  `).join("");

  const html = renderBrandedEmail({
    preheader: `${opts.frequency === "daily" ? "Daily" : "Weekly"} digest for ${opts.brand}`,
    heading: `${opts.frequency === "daily" ? "Today's" : "This week's"} mentions for ${opts.brand}`,
    body: `
      <p style="margin:0 0 16px">${opts.mentions.length} new mention${opts.mentions.length === 1 ? "" : "s"} from Google News.</p>
      ${items}
    `,
    cta: { label: "Open Keyword Monitor", url: APP_URL },
  });

  const r = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": resendApiKey,
    },
    body: JSON.stringify({
      from: "Media AI <hello@trymedia.ai>",
      to: [opts.to],
      subject: `${opts.frequency === "daily" ? "Daily" : "Weekly"} mentions — ${opts.brand}`,
      html,
    }),
  });
  if (r.ok) {
    console.log("MONITOR_EMAIL_SENT", opts.brand, opts.frequency, opts.to);
    return true;
  }
  console.error("digest send failed", r.status, await r.text().catch(() => ""));
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    console.log("MONITOR_SCHEDULED_CHECK_STARTED");
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);
    const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
    const { data: monitors, error } = await supa
      .from("brand_monitors")
      .select("*")
      .eq("is_active", true)
      .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff}`)
      .limit(500);
    if (error) throw error;

    const results: Array<{ id: string; ok: boolean; digest?: boolean }> = [];

    for (const m of monitors ?? []) {
      let ok = false;
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/monitor-check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify({ monitor_id: m.id }),
        });
        ok = r.ok;
      } catch (e) {
        console.error("invoke failed", m.id, e);
      }

      // digest emails (daily/weekly)
      let digestSent = false;
      if (ok && m.email_alerts && (m.alert_frequency === "daily" || m.alert_frequency === "weekly")) {
        const windowH = m.alert_frequency === "daily" ? 24 : 24 * 7;
        const lastSent = m.digest_last_sent_at ? new Date(m.digest_last_sent_at).getTime() : 0;
        const dueAfter = Date.now() - windowH * 60 * 60 * 1000;
        if (lastSent < dueAfter) {
          const since = new Date(Math.max(lastSent, dueAfter)).toISOString();
          const { data: mentions } = await supa
            .from("monitor_updates")
            .select("title, url, publisher, mention_type, sentiment")
            .eq("monitor_id", m.id)
            .gte("detected_at", since)
            .order("detected_at", { ascending: false })
            .limit(20);
          if ((mentions?.length ?? 0) > 0) {
            const { data: userRow } = await supa.auth.admin.getUserById(m.user_id);
            const userEmail = userRow?.user?.email;
            if (userEmail) {
              digestSent = await sendDigest({
                to: userEmail,
                brand: m.brand_name,
                frequency: m.alert_frequency as "daily" | "weekly",
                mentions: (mentions as Array<{ title: string; url: string; publisher: string | null; mention_type: string | null; sentiment: string | null }>).map((x) => ({ ...x, title: x.title ?? "Mention" })),
              });
              if (digestSent) {
                await supa.from("brand_monitors")
                  .update({ digest_last_sent_at: new Date().toISOString() } as never)
                  .eq("id", m.id);
              }
            }
          }
        }
      }

      results.push({ id: m.id, ok, digest: digestSent });
    }

    console.log("MONITOR_SCHEDULED_CHECK_FINISHED", results.length);
    return new Response(JSON.stringify({ ok: true, count: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("monitor-run-all error", e);
    return new Response(JSON.stringify({ error: "internal_error", details: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
