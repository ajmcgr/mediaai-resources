import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Media AI's assistant for PR and influencer outreach.
You help users find journalists and creators in their database, draft pitches, and answer
questions. When the user asks to find or filter people, USE the search_journalists or
search_creators tools — never invent contacts. Be concise.`;

type Tool = {
  type: "function";
  function: { name: string; description: string; parameters: unknown };
};

const tools: Tool[] = [
  {
    type: "function",
    function: {
      name: "search_journalists",
      description:
        "Search the journalist database. Use ILIKE-style fuzzy match. Returns up to 25 rows.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Free text — name, outlet, topic" },
          category: { type: "string" },
          country: { type: "string" },
          outlet: { type: "string" },
          limit: { type: "number", description: "Max 25" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_creators",
      description: "Search the creators database. Returns up to 25 rows.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string" },
          category: { type: "string" },
          min_followers: { type: "number" },
          limit: { type: "number" },
        },
      },
    },
  },
];

async function runTool(
  name: string,
  args: Record<string, unknown>,
  authHeader: string,
) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const limit = Math.min(Number(args.limit) || 25, 25);

  if (name === "search_journalists") {
    let q = supabase
      .from("journalist")
      .select("id,name,email,category,titles,topics,xhandle,outlet,country")
      .limit(limit);
    if (args.q) {
      const v = `%${args.q}%`;
      q = q.or(
        `name.ilike.${v},email.ilike.${v},outlet.ilike.${v},titles.ilike.${v},topics.ilike.${v},xhandle.ilike.${v}`,
      );
    }
    if (args.category) q = q.ilike("category", `%${args.category}%`);
    if (args.country) q = q.ilike("country", `%${args.country}%`);
    if (args.outlet) q = q.ilike("outlet", `%${args.outlet}%`);
    const { data, error } = await q;
    if (error) return { error: error.message };
    return { rows: data };
  }

  if (name === "search_creators") {
    let q = supabase
      .from("creators")
      .select(
        "id,name,category,ig_handle,ig_followers,ig_engagement_rate,youtube_url,youtube_subscribers,type",
      )
      .limit(limit);
    if (args.q) {
      const v = `%${args.q}%`;
      q = q.or(`name.ilike.${v},ig_handle.ilike.${v},bio.ilike.${v}`);
    }
    if (args.category) q = q.ilike("category", `%${args.category}%`);
    if (args.min_followers)
      q = q.gte("ig_followers", Number(args.min_followers));
    const { data, error } = await q;
    if (error) return { error: error.message };
    return { rows: data };
  }

  return { error: `Unknown tool: ${name}` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await userClient.auth.getUser();
    if (!user)
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const { messages, model } = await req.json();
    if (!Array.isArray(messages))
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey)
      return new Response(
        JSON.stringify({ error: "missing_key", message: "Chat is not configured. Contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );

    const convo = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    let lastToolKind: "journalists" | "creators" | null = null;
    let lastToolRows: unknown[] = [];

    // Tool-calling loop (max 4 iterations)
    for (let i = 0; i < 4; i++) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: convo,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!r.ok) {
        const text = await r.text();
        return new Response(
          JSON.stringify({ error: "openai_error", status: r.status, message: text }),
          { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const data = await r.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) break;

      if (msg.tool_calls?.length) {
        convo.push(msg);
        for (const tc of msg.tool_calls) {
          let parsed: Record<string, unknown> = {};
          try { parsed = JSON.parse(tc.function.arguments || "{}"); } catch { /* ignore */ }
          const result = await runTool(tc.function.name, parsed, authHeader);
          if (Array.isArray((result as { rows?: unknown[] })?.rows)) {
            lastToolKind = tc.function.name === "search_creators" ? "creators" : "journalists";
            lastToolRows = (result as { rows: unknown[] }).rows;
          }
          convo.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result).slice(0, 12000),
          });
        }
        continue;
      }

      return new Response(
        JSON.stringify({
          content: msg.content ?? "",
          results: lastToolKind ? { kind: lastToolKind, rows: lastToolRows } : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        content: "(no response)",
        results: lastToolKind ? { kind: lastToolKind, rows: lastToolRows } : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
