const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const EXA_API_KEY = Deno.env.get("EXA_API_KEY");
    if (!EXA_API_KEY) {
      return new Response(JSON.stringify({ error: "EXA_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim().slice(0, 500) : "";
    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const exaQuery = `
      site:linkedin.com/in OR site:twitter.com
      ("journalist" OR "reporter" OR "editor")
      ${query}
    `.trim();

    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${EXA_API_KEY}`,
      },
      body: JSON.stringify({
        query: exaQuery,
        numResults: 20,
        contents: { text: { maxCharacters: 400 } },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Exa API error", res.status, data);
      return new Response(JSON.stringify({ error: "exa_failed", status: res.status, details: data }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = (data.results || []).map((r: any) => ({
      name: r.title || "",
      url: r.url,
      snippet: (r.text || "").slice(0, 200),
      source: "web",
    }));

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("exa-search error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
