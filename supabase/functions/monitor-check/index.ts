// Check a single brand monitor: fetch URLs, diff against last snapshot,
// run AI evaluation, persist update, optionally send email.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { renderBrandedEmail } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

interface Monitor {
  id: string;
  user_id: string;
  brand_name: string;
  website_url: string;
  competitor_urls: string[];
  keywords: string[];
  email_alerts: boolean;
  alert_frequency: string;
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function htmlToText(html: string): string {
  // strip script/style/nav/footer/header chunks then tags
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "MediaAI-Monitor/1.0 (+https://trymedia.ai)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  const html = await res.text();
  return htmlToText(html).slice(0, 60_000);
}

// crude line-level diff: returns added/changed lines
function computeDiff(prev: string, next: string): string {
  const norm = (s: string) =>
    s.split(/(?<=[\.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  const prevSet = new Set(norm(prev));
  const additions = norm(next).filter((l) => !prevSet.has(l) && l.length > 20);
  return additions.slice(0, 40).join("\n");
}

interface AiResult {
  meaningful: boolean;
  summary: string;
  why_it_matters: string;
  pr_score: number;
  next_action: string;
  pitch_angle: string;
}

async function aiEvaluate(opts: {
  brand: string;
  url: string;
  url_kind: string;
  keywords: string[];
  diff: string;
}): Promise<AiResult | null> {
  const sys =
    "You are a PR analyst. Given a website diff for a tracked brand, decide if the change is a meaningful PR signal (launch, funding, hire, partnership, pricing change, new product, controversy, milestone). Ignore navigation, copy tweaks, footer/legal updates, dynamic counters. Respond ONLY with JSON.";
  const user = `Brand: ${opts.brand}
URL: ${opts.url} (${opts.url_kind})
Keywords: ${opts.keywords.join(", ") || "(none)"}
DIFF (new/changed sentences):
${opts.diff.slice(0, 8000)}

Respond with JSON: {"meaningful": boolean, "summary": string (<=160 chars), "why_it_matters": string (<=240 chars), "pr_score": integer 0-100, "next_action": string (<=180 chars), "pitch_angle": string (<=240 chars)}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    console.error("AI gateway error", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      meaningful: !!parsed.meaningful,
      summary: String(parsed.summary ?? "").slice(0, 240),
      why_it_matters: String(parsed.why_it_matters ?? "").slice(0, 400),
      pr_score: Math.max(0, Math.min(100, Number(parsed.pr_score) || 0)),
      next_action: String(parsed.next_action ?? "").slice(0, 280),
      pitch_angle: String(parsed.pitch_angle ?? "").slice(0, 400),
    };
  } catch {
    return null;
  }
}

async function sendAlertEmail(opts: {
  to: string;
  brand: string;
  url: string;
  result: AiResult;
}) {
  if (!RESEND_API_KEY) return;
  const html = renderBrandedEmail({
    preheader: `PR signal for ${opts.brand}`,
    heading: `New PR signal: ${opts.brand}`,
    body: `
      <p style="margin:0 0 12px"><strong>${opts.result.summary}</strong></p>
      <p style="margin:0 0 12px;color:#4e5052">${opts.result.why_it_matters}</p>
      <p style="margin:0 0 8px"><strong>PR opportunity score:</strong> ${opts.result.pr_score}/100</p>
      <p style="margin:0 0 8px"><strong>Suggested action:</strong> ${opts.result.next_action}</p>
      <p style="margin:0 0 16px"><strong>Pitch angle:</strong> ${opts.result.pitch_angle}</p>
      <p style="margin:0;font-size:13px;color:#9aa0a6">Source: <a href="${opts.url}">${opts.url}</a></p>
    `,
    cta: { label: "Open Monitor", url: "https://trymedia.ai/monitor" },
  });

  const r = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "Media AI <hello@trymedia.ai>",
      to: [opts.to],
      subject: `PR signal — ${opts.brand}`,
      html,
    }),
  });
  if (!r.ok) console.error("alert email failed", r.status, await r.text().catch(() => ""));
}

async function checkOneUrl(
  supa: any,
  monitor: Monitor,
  url: string,
  url_kind: "brand" | "competitor",
  userEmail: string | null,
): Promise<{ url: string; status: string }> {
  let text: string;
  try {
    text = await fetchPage(url);
  } catch (e) {
    return { url, status: `fetch_failed: ${(e as Error).message}` };
  }
  const hash = await sha256(text);

  const { data: prev } = await supa
    .from("monitor_snapshots")
    .select("content_hash, text_content")
    .eq("monitor_id", monitor.id)
    .eq("url", url)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supa.from("monitor_snapshots").insert({
    monitor_id: monitor.id,
    url,
    url_kind,
    content_hash: hash,
    text_content: text,
  });

  if (!prev) return { url, status: "first_snapshot" };
  if (prev.content_hash === hash) return { url, status: "no_change" };

  const diff = computeDiff(prev.text_content ?? "", text);
  if (!diff || diff.length < 60) return { url, status: "trivial_change" };

  const ai = await aiEvaluate({
    brand: monitor.brand_name,
    url,
    url_kind,
    keywords: monitor.keywords,
    diff,
  });
  if (!ai || !ai.meaningful) return { url, status: "not_meaningful" };

  let emailSent = false;
  if (monitor.email_alerts && monitor.alert_frequency === "instant" && userEmail) {
    try {
      await sendAlertEmail({ to: userEmail, brand: monitor.brand_name, url, result: ai });
      emailSent = true;
    } catch (e) {
      console.error("email send failed", e);
    }
  }

  await supa.from("monitor_updates").insert({
    monitor_id: monitor.id,
    user_id: monitor.user_id,
    url,
    url_kind,
    summary: ai.summary,
    why_it_matters: ai.why_it_matters,
    pr_score: ai.pr_score,
    next_action: ai.next_action,
    pitch_angle: ai.pitch_angle,
    diff_excerpt: diff.slice(0, 4000),
    email_sent: emailSent,
  });

  return { url, status: "update_recorded" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { monitor_id } = await req.json().catch(() => ({}));
    if (!monitor_id) {
      return new Response(JSON.stringify({ error: "monitor_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: monitor, error } = await supa
      .from("brand_monitors")
      .select("*")
      .eq("id", monitor_id)
      .maybeSingle();

    if (error || !monitor) {
      return new Response(JSON.stringify({ error: "monitor not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userRow } = await supa.auth.admin.getUserById(monitor.user_id);
    const userEmail = userRow?.user?.email ?? null;

    const targets: Array<{ url: string; kind: "brand" | "competitor" }> = [
      { url: monitor.website_url, kind: "brand" },
      ...(monitor.competitor_urls ?? []).map((u: string) => ({ url: u, kind: "competitor" as const })),
    ];

    const results: Array<{ url: string; status: string }> = [];
    for (const t of targets) {
      try {
        const r = await checkOneUrl(supa, monitor as Monitor, t.url, t.kind, userEmail);
        results.push(r);
      } catch (e) {
        results.push({ url: t.url, status: `error: ${(e as Error).message}` });
      }
    }

    await supa
      .from("brand_monitors")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", monitor.id);

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("monitor-check error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
