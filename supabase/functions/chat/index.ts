import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are Media AI's assistant for PR and influencer outreach.
When the user asks to find or filter people, USE the search_journalists or search_creators
tool with the user's natural-language query (just pass the raw query string in "q" — the
backend handles synonym expansion, country normalization, and result broadening). Never
invent contacts. After tool results return, briefly summarize what was found in 1-2
sentences. Be concise.`;

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
        "Search journalists. Pass the user's full natural-language query in `q` — synonyms, countries, and broadening are handled server-side. Returns up to 25 ranked rows.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Natural language query, e.g. 'tech journalist in the united kingdom'" },
        },
        required: ["q"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_creators",
      description: "Search creators/influencers. Pass natural-language query in `q`. Returns up to 25 ranked rows.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string" },
          min_followers: { type: "number" },
        },
        required: ["q"],
      },
    },
  },
];

// ---------- Query normalization ----------

const TOPIC_SYNONYMS: Record<string, string[]> = {
  tech: ["tech", "technology", "tech.", "ai", "software", "saas", "startup", "startups"],
  technology: ["technology", "tech", "ai", "software", "saas"],
  ai: ["ai", "artificial intelligence", "ml", "machine learning"],
  fintech: ["fintech", "finance", "financial", "banking", "crypto", "payments"],
  crypto: ["crypto", "cryptocurrency", "blockchain", "web3", "bitcoin"],
  finance: ["finance", "financial", "fintech", "banking", "investing"],
  health: ["health", "wellness", "fitness", "medical", "healthcare"],
  beauty: ["beauty", "makeup", "skincare", "cosmetics"],
  fashion: ["fashion", "style", "apparel"],
  food: ["food", "cooking", "culinary", "restaurant"],
  travel: ["travel", "tourism", "destination"],
  gaming: ["gaming", "games", "esports", "video games"],
  sports: ["sports", "athletics"],
  music: ["music", "musician", "audio"],
  film: ["film", "movie", "cinema", "entertainment"],
  business: ["business", "enterprise", "b2b", "corporate"],
  marketing: ["marketing", "advertising", "adtech", "branding"],
  realestate: ["real estate", "property", "housing", "realty"],
  cars: ["cars", "automotive", "auto", "vehicle"],
  pets: ["pets", "animals", "dogs", "cats"],
  parenting: ["parenting", "kids", "family"],
};

const COUNTRY_SYNONYMS: Record<string, string[]> = {
  uk: ["united kingdom", "uk", "u.k.", "britain", "british", "england", "scotland", "wales"],
  "united kingdom": ["united kingdom", "uk", "britain", "england"],
  us: ["united states", "usa", "u.s.", "u.s.a.", "america", "american"],
  usa: ["united states", "usa", "america"],
  "united states": ["united states", "usa", "america"],
  canada: ["canada", "canadian"],
  australia: ["australia", "australian", "aus"],
  germany: ["germany", "german", "deutschland"],
  france: ["france", "french"],
  india: ["india", "indian"],
  singapore: ["singapore", "sg"],
  japan: ["japan", "japanese"],
  china: ["china", "chinese"],
  spain: ["spain", "spanish"],
  italy: ["italy", "italian"],
  brazil: ["brazil", "brazilian"],
  mexico: ["mexico", "mexican"],
  netherlands: ["netherlands", "dutch", "holland"],
  ireland: ["ireland", "irish"],
};

const ROLE_WORDS = new Set([
  "journalist", "journalists", "reporter", "reporters", "editor", "editors",
  "writer", "writers", "correspondent", "correspondents", "columnist", "contributor",
  "creator", "creators", "influencer", "influencers", "youtuber", "youtubers",
  "tiktoker", "instagrammer", "blogger",
]);

const STOPWORDS = new Set([
  "a", "an", "the", "in", "at", "on", "of", "for", "to", "with", "from", "by",
  "and", "or", "is", "are", "be", "who", "that", "find", "me", "show", "list",
  "any", "all", "some", "please", "best", "top", "based", "located", "near",
]);

type Normalized = {
  raw: string;
  topics: string[];   // expanded topic terms
  countries: string[]; // expanded country phrases
  freeTerms: string[]; // remaining tokens
  roleHint: "journalist" | "creator" | null;
  minFollowers: number | null;
};

function normalizeQuery(q: string): Normalized {
  const lower = q.toLowerCase().trim();
  const topics = new Set<string>();
  const countries = new Set<string>();
  let roleHint: "journalist" | "creator" | null = null;
  let working = ` ${lower} `;

  // Multi-word country phrases first (longest match)
  const countryKeys = Object.keys(COUNTRY_SYNONYMS).sort((a, b) => b.length - a.length);
  for (const key of countryKeys) {
    const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    if (re.test(working)) {
      for (const v of COUNTRY_SYNONYMS[key]) countries.add(v);
      working = working.replace(re, " ");
    }
  }

  // Topic synonyms
  for (const [key, vals] of Object.entries(TOPIC_SYNONYMS)) {
    const re = new RegExp(`\\b${key}\\b`, "gi");
    if (re.test(working)) {
      for (const v of vals) topics.add(v);
      working = working.replace(re, " ");
    }
  }

  // Tokenize remainder
  const tokens = working
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter(Boolean);

  const freeTerms: string[] = [];
  let minFollowers: number | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (ROLE_WORDS.has(t)) {
      if (["creator", "creators", "influencer", "influencers", "youtuber", "youtubers", "tiktoker", "instagrammer", "blogger"].includes(t)) {
        roleHint = "creator";
      } else {
        roleHint = "journalist";
      }
      continue;
    }
    // Followers like "100k+", "500000"
    const fm = t.match(/^(\d+)(k|m)?\+?$/i);
    if (fm) {
      const n = parseInt(fm[1], 10) * (fm[2]?.toLowerCase() === "m" ? 1_000_000 : fm[2]?.toLowerCase() === "k" ? 1_000 : 1);
      if (n >= 1000) { minFollowers = Math.max(minFollowers ?? 0, n); continue; }
    }
    if (STOPWORDS.has(t)) continue;
    if (t.length < 2) continue;
    freeTerms.push(t);
  }

  return {
    raw: q,
    topics: [...topics],
    countries: [...countries],
    freeTerms,
    roleHint,
    minFollowers,
  };
}

// ---------- Supabase search ----------

type AdminClient = ReturnType<typeof createClient>;

function escapeIlike(v: string): string {
  // PostgREST or-filter values: commas/parens are delimiters. Replace problematic chars.
  return v.replace(/[(),]/g, " ").trim();
}

async function fetchJournalists(admin: AdminClient, n: Normalized, debug: Record<string, unknown>) {
  const cols = ["name", "outlet", "category", "topics", "titles", "country", "email", "xhandle"];
  const orParts: string[] = [];

  const addAcross = (terms: string[], fields: string[]) => {
    for (const term of terms) {
      const safe = escapeIlike(term);
      if (!safe) continue;
      for (const f of fields) orParts.push(`${f}.ilike.%${safe}%`);
    }
  };

  // Topic terms hit category/topics/titles/outlet
  addAcross(n.topics, ["category", "topics", "titles", "outlet"]);
  // Country terms hit country/topics/outlet/titles
  addAcross(n.countries, ["country", "topics", "outlet", "titles"]);
  // Free terms hit broad fields
  addAcross(n.freeTerms, cols);

  let query = admin
    .from("journalist")
    .select("id,name,email,category,titles,topics,xhandle,outlet,country,enrichment_source_url,enriched_at")
    .limit(200);

  if (orParts.length) query = query.or(orParts.join(","));
  const { data, error } = await query;
  if (error) {
    debug.journalist_error = error.message;
    // Retry without enrichment columns if they don't exist
    if (error.message?.includes("enrichment_source_url") || error.message?.includes("enriched_at")) {
      let retry = admin
        .from("journalist")
        .select("id,name,email,category,titles,topics,xhandle,outlet,country")
        .limit(200);
      if (orParts.length) retry = retry.or(orParts.join(","));
      const r = await retry;
      if (r.error) return [];
      return r.data ?? [];
    }
    return [];
  }
  return data ?? [];
}

async function fetchCreators(admin: AdminClient, n: Normalized, debug: Record<string, unknown>) {
  const orParts: string[] = [];
  const addAcross = (terms: string[], fields: string[]) => {
    for (const term of terms) {
      const safe = escapeIlike(term);
      if (!safe) continue;
      for (const f of fields) orParts.push(`${f}.ilike.%${safe}%`);
    }
  };
  addAcross(n.topics, ["category", "bio", "name"]);
  addAcross(n.freeTerms, ["name", "category", "bio", "ig_handle", "youtube_url", "email"]);

  let q = admin
    .from("creators")
    .select("id,name,category,email,bio,ig_handle,ig_followers,ig_engagement_rate,youtube_url,youtube_subscribers,type,enrichment_source_url,enriched_at")
    .limit(200);
  if (orParts.length) q = q.or(orParts.join(","));
  if (n.minFollowers) q = q.gte("ig_followers", n.minFollowers);

  const { data, error } = await q;
  if (error) {
    debug.creators_error = error.message;
    if (error.message?.includes("enrichment") || error.message?.includes("email")) {
      let retry = admin
        .from("creators")
        .select("id,name,category,bio,ig_handle,ig_followers,ig_engagement_rate,youtube_url,youtube_subscribers,type")
        .limit(200);
      if (orParts.length) retry = retry.or(orParts.join(","));
      if (n.minFollowers) retry = retry.gte("ig_followers", n.minFollowers);
      const r = await retry;
      if (r.error) return [];
      return r.data ?? [];
    }
    return [];
  }
  return data ?? [];
}

// ---------- Ranking ----------

function rankJournalists(rows: Array<Record<string, unknown>>, n: Normalized) {
  const score = (r: Record<string, unknown>) => {
    let s = 0;
    const cat = String(r.category ?? "").toLowerCase();
    const topics = String(r.topics ?? "").toLowerCase();
    const country = String(r.country ?? "").toLowerCase();
    const outlet = String(r.outlet ?? "").toLowerCase();
    const titles = String(r.titles ?? "").toLowerCase();

    for (const t of n.topics) {
      if (cat.includes(t)) s += 10;
      if (topics.includes(t)) s += 6;
      if (titles.includes(t)) s += 3;
      if (outlet.includes(t)) s += 2;
    }
    for (const c of n.countries) {
      if (country.includes(c)) s += 8;
      if (topics.includes(c)) s += 2;
      if (outlet.includes(c)) s += 2;
    }
    for (const t of n.freeTerms) {
      if (cat.includes(t)) s += 4;
      if (topics.includes(t)) s += 3;
      if (outlet.includes(t)) s += 3;
      if (titles.includes(t)) s += 2;
      if (String(r.name ?? "").toLowerCase().includes(t)) s += 2;
    }
    if (r.email) s += 2;
    return s;
  };
  return [...rows].sort((a, b) => score(b) - score(a));
}

function rankCreators(rows: Array<Record<string, unknown>>, n: Normalized) {
  const score = (r: Record<string, unknown>) => {
    let s = 0;
    const cat = String(r.category ?? "").toLowerCase();
    const bio = String(r.bio ?? "").toLowerCase();
    for (const t of n.topics) {
      if (cat.includes(t)) s += 10;
      if (bio.includes(t)) s += 4;
    }
    for (const t of n.freeTerms) {
      if (cat.includes(t)) s += 4;
      if (bio.includes(t)) s += 3;
      if (String(r.name ?? "").toLowerCase().includes(t)) s += 2;
    }
    const f = Number(r.ig_followers ?? 0);
    s += Math.min(Math.log10(Math.max(f, 1)), 6);
    if (r.email) s += 2;
    return s;
  };
  return [...rows].sort((a, b) => score(b) - score(a));
}

// ---------- Search orchestration with broadening ----------

async function searchJournalistsBroadened(admin: AdminClient, q: string) {
  const debug: Record<string, unknown> = { original: q };
  const n = normalizeQuery(q);
  debug.normalized = { topics: n.topics, countries: n.countries, freeTerms: n.freeTerms, roleHint: n.roleHint };

  let rows = await fetchJournalists(admin, n, debug);
  let ranked = rankJournalists(rows, n);
  debug.initial_count = ranked.length;

  // Filter to rows touching at least one signal when we have many tokens
  if (n.topics.length || n.countries.length) {
    const strict = ranked.filter((r) => {
      const hay = [r.category, r.topics, r.country, r.outlet, r.titles].map((x) => String(x ?? "").toLowerCase()).join(" | ");
      const topicHit = n.topics.length === 0 || n.topics.some((t) => hay.includes(t));
      const countryHit = n.countries.length === 0 || n.countries.some((c) => hay.includes(c));
      return topicHit && countryHit;
    });
    debug.strict_count = strict.length;
    if (strict.length >= 5) ranked = strict;
  }

  // Broaden if too few: drop country
  if (ranked.length < 5 && n.countries.length) {
    const n2 = { ...n, countries: [] };
    const broaderRows = await fetchJournalists(admin, n2, debug);
    const broaderRanked = rankJournalists(broaderRows, n);
    debug.broadened_no_country = broaderRanked.length;
    // Merge unique by id, preserving best order
    const seen = new Set(ranked.map((r) => r.id));
    for (const r of broaderRanked) {
      if (!seen.has(r.id)) { ranked.push(r); seen.add(r.id); }
      if (ranked.length >= 25) break;
    }
  }

  // Broaden further: free terms only
  if (ranked.length < 5 && n.freeTerms.length) {
    const n3 = { raw: q, topics: [], countries: [], freeTerms: n.freeTerms, roleHint: n.roleHint, minFollowers: null };
    const r3 = await fetchJournalists(admin, n3, debug);
    debug.broadened_free_only = r3.length;
    const seen = new Set(ranked.map((r) => r.id));
    for (const r of rankJournalists(r3, n)) {
      if (!seen.has(r.id)) { ranked.push(r); seen.add(r.id); }
      if (ranked.length >= 25) break;
    }
  }

  const top = ranked.slice(0, 25);
  debug.final_count = top.length;
  console.log("[chat.search.journalists]", JSON.stringify(debug));
  return { rows: top, debug, normalized: n };
}

async function searchCreatorsBroadened(admin: AdminClient, q: string, minFollowers?: number) {
  const debug: Record<string, unknown> = { original: q };
  const n = normalizeQuery(q);
  if (minFollowers && (!n.minFollowers || minFollowers > n.minFollowers)) n.minFollowers = minFollowers;
  debug.normalized = { topics: n.topics, freeTerms: n.freeTerms, minFollowers: n.minFollowers };

  let rows = await fetchCreators(admin, n, debug);
  let ranked = rankCreators(rows, n);
  debug.initial_count = ranked.length;

  if (ranked.length < 5 && (n.topics.length || n.freeTerms.length)) {
    const n2 = { ...n, freeTerms: [] };
    const r2 = await fetchCreators(admin, n2, debug);
    debug.broadened_topic_only = r2.length;
    const seen = new Set(ranked.map((r) => r.id));
    for (const r of rankCreators(r2, n)) {
      if (!seen.has(r.id)) { ranked.push(r); seen.add(r.id); }
      if (ranked.length >= 25) break;
    }
  }

  const top = ranked.slice(0, 25);
  debug.final_count = top.length;
  console.log("[chat.search.creators]", JSON.stringify(debug));
  return { rows: top, debug, normalized: n };
}

// ---------- Exa fallback ----------

type ExaResult = {
  name?: string;
  outlet?: string;
  title?: string;
  url: string;
  reason: string;
};

async function exaSearch(query: string, kind: "journalists" | "creators"): Promise<ExaResult[]> {
  const key = Deno.env.get("EXA_API_KEY");
  if (!key) {
    console.log("[chat.exa] no EXA_API_KEY configured");
    return [];
  }
  const exaQuery = kind === "journalists"
    ? `${query} — journalist or reporter contact page`
    : `${query} — creator or influencer profile`;
  try {
    const r = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        query: exaQuery,
        numResults: 8,
        useAutoprompt: true,
        type: "neural",
        contents: { text: { maxCharacters: 600 }, highlights: { numSentences: 2, highlightsPerUrl: 1 } },
      }),
    });
    if (!r.ok) {
      console.log("[chat.exa] error", r.status, await r.text());
      return [];
    }
    const data = await r.json();
    const results: ExaResult[] = [];
    for (const item of data.results ?? []) {
      results.push({
        name: item.author || item.title?.split(/[-—|·]/)[0]?.trim() || undefined,
        outlet: (() => { try { return new URL(item.url).hostname.replace(/^www\./, ""); } catch { return undefined; } })(),
        title: item.title,
        url: item.url,
        reason: (item.highlights?.[0] || item.text?.slice(0, 200) || "Matched on the open web").trim(),
      });
    }
    console.log("[chat.exa] returned", results.length, "results");
    return results;
  } catch (e) {
    console.log("[chat.exa] exception", (e as Error).message);
    return [];
  }
}

// ---------- Tool runner ----------

async function runTool(
  name: string,
  args: Record<string, unknown>,
  admin: AdminClient,
): Promise<{ kind: "journalists" | "creators"; rows: unknown[]; debug: Record<string, unknown>; query: string }> {
  const q = String(args.q ?? "");
  if (name === "search_journalists") {
    const res = await searchJournalistsBroadened(admin, q);
    return { kind: "journalists", rows: res.rows, debug: res.debug, query: q };
  }
  // creators
  const minF = typeof args.min_followers === "number" ? args.min_followers : undefined;
  const res = await searchCreatorsBroadened(admin, q, minF);
  return { kind: "creators", rows: res.rows, debug: res.debug, query: q };
}

// ---------- Handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

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

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: usageRow } = await admin.rpc("chat_usage_summary");
    const summary = Array.isArray(usageRow) ? usageRow[0] : usageRow;
    const allowance = Number(summary?.allowance ?? 0);
    const usedSoFar = Number(summary?.used ?? 0);
    const remaining = Math.max(allowance - usedSoFar, 0);
    if (remaining <= 0) {
      return new Response(
        JSON.stringify({
          error: "quota_exhausted",
          message: "You've used all of your chat tokens for this month.",
          allowance, used: usedSoFar, remaining: 0,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
    let lastQuery = "";
    let lastDebug: Record<string, unknown> = {};
    let totalTokens = 0;

    for (let i = 0; i < 4; i++) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
      totalTokens += Number(data?.usage?.total_tokens ?? 0);
      const msg = data.choices?.[0]?.message;
      if (!msg) break;

      if (msg.tool_calls?.length) {
        convo.push(msg);
        for (const tc of msg.tool_calls) {
          let parsed: Record<string, unknown> = {};
          try { parsed = JSON.parse(tc.function.arguments || "{}"); } catch { /* ignore */ }
          const result = await runTool(tc.function.name, parsed, admin);
          lastToolKind = result.kind;
          lastToolRows = result.rows;
          lastQuery = result.query;
          lastDebug = result.debug;
          // Send a compact summary back to the model — never the full rows (token cost).
          const compact = result.rows.slice(0, 10).map((r) => {
            const o = r as Record<string, unknown>;
            return result.kind === "journalists"
              ? { name: o.name, outlet: o.outlet, category: o.category, country: o.country, has_email: !!o.email }
              : { name: o.name, category: o.category, ig_followers: o.ig_followers, type: o.type };
          });
          convo.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              count: result.rows.length,
              sample: compact,
            }),
          });
        }
        continue;
      }

      // Exa fallback if internal results are weak
      let exaResults: ExaResult[] = [];
      if (lastToolKind && lastToolRows.length < 5 && lastQuery) {
        exaResults = await exaSearch(lastQuery, lastToolKind);
      }

      let newUsed = usedSoFar + totalTokens;
      try {
        const { data: rec } = await admin.rpc("chat_usage_record", {
          _user: user.id, _tokens: totalTokens,
        });
        if (typeof rec === "number") newUsed = rec;
      } catch (e) { console.error("chat_usage_record failed", e); }

      return new Response(
        JSON.stringify({
          content: msg.content ?? "",
          results: lastToolKind ? { kind: lastToolKind, rows: lastToolRows, query: lastQuery, debug: lastDebug } : null,
          exa: exaResults.length ? { kind: lastToolKind, query: lastQuery, results: exaResults } : null,
          usage: {
            allowance,
            used: newUsed,
            remaining: Math.max(allowance - newUsed, 0),
            tokens_this_request: totalTokens,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try {
      await admin.rpc("chat_usage_record", { _user: user.id, _tokens: totalTokens });
    } catch (e) { console.error("chat_usage_record failed", e); }

    return new Response(
      JSON.stringify({
        content: "(no response)",
        results: lastToolKind ? { kind: lastToolKind, rows: lastToolRows, query: lastQuery, debug: lastDebug } : null,
        usage: {
          allowance,
          used: usedSoFar + totalTokens,
          remaining: Math.max(allowance - (usedSoFar + totalTokens), 0),
          tokens_this_request: totalTokens,
        },
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
