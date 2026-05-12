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
    const { topic, source: forcedSource, slug: forcedSlug, publish } = await req.json().catch(() => ({}));
    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "topic required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, serviceKey);

    const sys =
      "You are an SEO expert building landing pages for Media AI, a platform with a database of journalists and creators. " +
      "Given a topic phrase, return JSON describing a SEO landing page that lists matching contacts. " +
      "Be specific, useful, non-fluffy. No fluff filler. Use semantic HTML for intro_html (p, h2, h3, ul, strong). 250-400 words intro. " +
      "Output JSON only.";

    const user = `Topic: "${topic}"

Return JSON with these keys:
- source: "journalist" or "creator" (journalists = reporters/editors at outlets; creators = influencers/podcasters/youtubers)
- slug: short URL slug, lowercase-kebab, max 60 chars
- title: SEO title under 60 chars including the topic keyword
- h1: page H1 (can be longer/more descriptive than title)
- meta_description: under 155 chars, compelling, includes keyword
- intro_html: 250-400 word intro in semantic HTML (no <h1>). Explain who's on the list, why they matter, how to pitch them. Reference that the list is updated from Media AI's database.
- filters: object with optional keys to query the database. Use ONLY these keys:
    topics (string, ilike match against journalist.topics) — e.g. "AI", "fintech", "cybersecurity"
    category (string, ilike against category) — e.g. "Tech", "Business"
    country (string, ilike against country) — e.g. "United States", "United Kingdom"
    outlet (string, ilike against outlet) — only if topic mentions a specific outlet
    ig_followers_min (number) — for creators with follower threshold
    youtube_subs_min (number) — for youtuber lists
    limit (number, default 50, max 100)
  Pick filters that match the topic. Prefer 1-2 filters max for broader matches.
- faq: array of 3-5 {question, answer} objects relevant to the topic (e.g. "How do I pitch AI journalists?")`;

    const aiRes = await callAI({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const raw = aiRes.choices?.[0]?.message?.content ?? "{}";
    const p = JSON.parse(raw);

    const source: string = forcedSource || (p.source === "creator" ? "creator" : "journalist");
    const slug = slugify(forcedSlug || p.slug || topic);
    const title = String(p.title || topic).slice(0, 70).trim();
    const h1 = String(p.h1 || title).trim();
    const meta_description = String(p.meta_description || "").slice(0, 160).trim();
    const intro_html = String(p.intro_html || "").trim();
    const filters = (p.filters && typeof p.filters === "object") ? p.filters : {};
    const faq = Array.isArray(p.faq) ? p.faq : [];

    // upsert by slug
    const { data, error } = await supabase
      .from("seo_pages")
      .upsert({
        slug, source, title, h1, meta_description, intro_html, filters, faq,
        published: publish === true,
      }, { onConflict: "slug" })
      .select()
      .single();

    if (error) throw error;

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
