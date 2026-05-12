// Generates a programmatic SEO landing page (title/H1/meta/intro/faq + filter
// suggestions) from a topic prompt, then inserts into public.seo_pages.
// Reuses the OPENAI_API_KEY pattern already used by blog-generate.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

async function callAI(body: Record<string, unknown>) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { topic, source: forcedSource, slug: forcedSlug, publish, auto, count } = body || {};

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, serviceKey);

    // ===== AUTO MODE: ask AI to brainstorm N topics, then generate each =====
    if (auto === true) {
      const n = Math.min(Math.max(Number(count) || 10, 1), 20);

      // Pull a small sample of real categories/topics/countries to ground the AI
      const [{ data: jSample }, { data: cSample }, { data: existing }] = await Promise.all([
        supabase.from("journalist").select("category,topics,country,outlet").limit(200),
        supabase.from("creators").select("category,country").limit(200),
        supabase.from("seo_pages").select("title,slug").limit(200),
      ]);
      const cats = Array.from(new Set([...(jSample ?? []).map((r: any) => r.category), ...(cSample ?? []).map((r: any) => r.category)].filter(Boolean))).slice(0, 40);
      const topics = Array.from(new Set((jSample ?? []).flatMap((r: any) => String(r.topics || "").split(/[,;|]/).map((s) => s.trim())).filter(Boolean))).slice(0, 60);
      const countries = Array.from(new Set([...(jSample ?? []).map((r: any) => r.country), ...(cSample ?? []).map((r: any) => r.country)].filter(Boolean))).slice(0, 30);
      const existingTitles = (existing ?? []).map((r: any) => r.title);

      const ideaRes = await callAI({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You generate high-intent, SEO-optimized list-page topic ideas for a media/PR platform. Output JSON only." },
          { role: "user", content: `Generate ${n} distinct SEO landing page topics (e.g. "Top AI journalists in San Francisco", "Best fintech podcasters", "Cybersecurity reporters at major outlets").

Ground them in this real data:
- Categories: ${cats.join(", ")}
- Topics/beats: ${topics.join(", ")}
- Countries: ${countries.join(", ")}

AVOID duplicates of these existing pages: ${existingTitles.join(" | ") || "(none yet)"}

Mix journalists and creators. Mix beat-only, beat+location, and outlet-type angles. Each topic should be a natural search query a PR person would Google.

Return JSON: { "topics": ["...", "..."] }` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
      });
      const ideas: string[] = (() => {
        try { return JSON.parse(ideaRes.choices?.[0]?.message?.content ?? "{}").topics ?? []; }
        catch { return []; }
      })().slice(0, n);

      const results: Array<{ topic: string; ok: boolean; slug?: string; error?: string }> = [];
      for (const t of ideas) {
        try {
          const page = await buildAndUpsert(supabase, t, undefined, undefined, publish === true);
          results.push({ topic: t, ok: true, slug: page.slug });
        } catch (e) {
          results.push({ topic: t, ok: false, error: e instanceof Error ? e.message : "unknown" });
        }
      }
      return new Response(JSON.stringify({ ok: true, generated: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "topic required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await buildAndUpsert(supabase, topic, forcedSource, forcedSlug, publish === true);
    return new Response(JSON.stringify({ ok: true, page: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-page-build error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
