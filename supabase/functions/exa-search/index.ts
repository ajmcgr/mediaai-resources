const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const EXA_API_KEY = Deno.env.get("EXA_API_KEY");
    console.log("EXA_API_KEY exists:", !!EXA_API_KEY);
    if (!EXA_API_KEY) {
      return json({ results: [], error: "EXA_API_KEY not configured", status: 500 }, 200);
    }

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim().slice(0, 500) : "";
    console.log("EXA_QUERY", query);
    if (!query) {
      return json({ results: [], error: "query is required", status: 400 }, 200);
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

    console.log("EXA_STATUS_CODE", res.status);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("EXA_API_ERROR", res.status, data);
      return json({
        results: [],
        error: typeof data?.error === "string" ? data.error : `Exa API returned status ${res.status}`,
        status: res.status,
        details: data,
      }, 200);
    }

    const rawCount = Array.isArray(data?.results) ? data.results.length : 0;
    console.log("EXA_RAW_RESULTS", rawCount);

    const results = (data.results || []).map((r: { title?: string; url?: string; text?: string }) => ({
      name: r.title || "",
      url: r.url,
      snippet: (r.text || "").slice(0, 200),
      source: "web",
    }));

    return json({ results, error: null, status: 200 }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("exa-search error:", message);
    return json({ results: [], error: message, status: 500 }, 200);
  }
});
