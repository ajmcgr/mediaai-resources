// supabase/functions/blog-generate/index.ts
// Generates a fresh blog post (text + cover image) via Lovable AI Gateway
// and inserts it into public.blog_posts. Triggered by pg_cron every 3 days.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOPICS = [
  "AI tools for PR teams",
  "How to pitch tech journalists in 2026",
  "Building a media list that gets replies",
  "Influencer marketing benchmarks",
  "PR measurement beyond AVE",
  "Crisis communications playbook",
  "Newsjacking ethically",
  "How journalists actually use email",
  "Working with creators vs. journalists",
  "PR for early-stage startups",
  "Press release alternatives that work",
  "Embargoes, exclusives and how to choose",
  "Building relationships with reporters",
  "Podcast PR strategy for founders",
  "Local press vs national: when to pitch which",
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function callAI(body: unknown) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing (env)");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, serviceKey);

    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    // 1. Generate post (JSON: title, description, html content)
    const writeRes = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a senior PR strategist writing for Media AI's blog. Write practical, specific, non-fluffy posts for PR pros, founders and comms leads. Use semantic HTML (h2, h3, p, ul, ol, blockquote, strong). 800-1100 words. No <h1>, no <html>/<body>, no markdown.",
        },
        {
          role: "user",
          content: `Write a blog post about: "${topic}". Return JSON only with keys: title (under 70 chars, compelling), description (under 160 chars, meta description), content (HTML body, no h1).`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = writeRes.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const title: string = String(parsed.title || topic).trim();
    const description: string = String(parsed.description || "").trim().slice(0, 160);
    const content: string = String(parsed.content || "").trim();
    if (!title || !content) throw new Error("AI returned empty post");

    // 2. Generate cover image
    let imageUrl: string | null = null;
    try {
      const imgRes = await callAI({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: `Editorial blog cover image for an article titled "${title}". Minimalist, modern, professional, abstract, soft gradients, no text. 16:9.`,
          },
        ],
      });
      const dataUrl =
        imgRes.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
      if (dataUrl?.startsWith("data:image/")) {
        const base64 = dataUrl.split(",")[1];
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const path = `auto/${Date.now()}-${slugify(title)}.png`;
        // Try upload to "blog" bucket; if it doesn't exist, fall back to data URL
        const { error: upErr } = await supabase.storage
          .from("blog")
          .upload(path, bytes, { contentType: "image/png", upsert: false });
        if (!upErr) {
          const { data: pub } = supabase.storage.from("blog").getPublicUrl(path);
          imageUrl = pub.publicUrl;
        } else {
          imageUrl = dataUrl;
        }
      }
    } catch (e) {
      console.error("image gen failed", e);
    }

    // 3. Ensure unique slug
    let slug = slugify(title);
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const { data: inserted, error } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        title,
        description,
        image: imageUrl,
        content,
        topic,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, post: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("blog-generate error", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
