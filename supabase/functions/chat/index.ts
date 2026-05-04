import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are Media AI's hybrid search assistant for PR & influencer outreach.
When the user asks to find people, ALWAYS call hybrid_search with their raw natural-language
query. The backend parses intent (topic, location, count, outlet, "with email"), runs Supabase
+ Exa in parallel, dedupes, ranks, and returns a unified result set.

After tool returns, write ONE short sentence:
- "Found N relevant results from your database and web sources." (when N >= asked-for)
- "Found N strong matches. I avoided weak/unverified results." (when N < asked-for but > 0)
- Only say no results if BOTH sources returned nothing.

Never invent contacts. Be concise.`;

type Tool = { type: "function"; function: { name: string; description: string; parameters: unknown } };

const tools: Tool[] = [
  {
    type: "function",
    function: {
      name: "hybrid_search",
      description: "Search journalists/creators across the internal database AND the public web (Exa) in parallel. Pass the user's raw natural-language query.",
      parameters: {
        type: "object",
        properties: { q: { type: "string", description: "Raw user query, verbatim" } },
        required: ["q"],
      },
    },
  },
];

// ---------- Intent parsing ----------

const TOPIC_SYNONYMS: Record<string, string[]> = {
  tech: ["tech", "technology", "ai", "software", "saas", "startup", "startups"],
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
  gaming: ["gaming", "games", "esports"],
  sports: ["sports", "athletics"],
  music: ["music", "musician"],
  film: ["film", "movie", "cinema", "entertainment"],
  business: ["business", "enterprise", "b2b"],
  marketing: ["marketing", "advertising", "adtech", "branding"],
  realestate: ["real estate", "property", "housing", "realty"],
  cars: ["cars", "automotive", "auto"],
  pets: ["pets", "animals", "dogs", "cats"],
  parenting: ["parenting", "kids", "family"],
  startup: ["startup", "startups", "venture", "vc"],
};

const COUNTRY_SYNONYMS: Record<string, { canonical: string; variants: string[] }> = {
  uk: { canonical: "United Kingdom", variants: ["united kingdom", "uk", "britain", "british", "england", "scotland", "wales"] },
  "united kingdom": { canonical: "United Kingdom", variants: ["united kingdom", "uk", "britain", "england"] },
  us: { canonical: "United States", variants: ["united states", "usa", "u.s.", "america", "american"] },
  usa: { canonical: "United States", variants: ["united states", "usa", "america"] },
  "united states": { canonical: "United States", variants: ["united states", "usa", "america"] },
  canada: { canonical: "Canada", variants: ["canada", "canadian"] },
  australia: { canonical: "Australia", variants: ["australia", "australian"] },
  germany: { canonical: "Germany", variants: ["germany", "german", "deutschland"] },
  france: { canonical: "France", variants: ["france", "french"] },
  india: { canonical: "India", variants: ["india", "indian"] },
  singapore: { canonical: "Singapore", variants: ["singapore", "sg"] },
  japan: { canonical: "Japan", variants: ["japan", "japanese"] },
  china: { canonical: "China", variants: ["china", "chinese"] },
  spain: { canonical: "Spain", variants: ["spain", "spanish"] },
  italy: { canonical: "Italy", variants: ["italy", "italian"] },
  brazil: { canonical: "Brazil", variants: ["brazil", "brazilian"] },
  mexico: { canonical: "Mexico", variants: ["mexico", "mexican"] },
  netherlands: { canonical: "Netherlands", variants: ["netherlands", "dutch", "holland"] },
  ireland: { canonical: "Ireland", variants: ["ireland", "irish"] },
  uae: { canonical: "United Arab Emirates", variants: ["uae", "united arab emirates", "dubai", "abu dhabi"] },
  dubai: { canonical: "United Arab Emirates", variants: ["dubai", "uae", "united arab emirates"] },
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
  "get", "give", "need", "want", "looking", "search",
]);

type Intent = {
  raw: string;
  kind: "journalists" | "creators";
  topics: string[];
  countries: string[];        // expanded variants
  countryCanonical: string | null;
  outlets: string[];
  freeTerms: string[];
  count: number;              // requested count
  emailRequired: boolean;
};

function parseIntent(q: string): Intent {
  const lower = ` ${q.toLowerCase()} `;
  let working = lower;

  // Quantity: "50 tech journalists", "100 ai creators", "find 25"
  let count = 25;
  const qMatch = lower.match(/\b(\d{1,4})\b/);
  if (qMatch) {
    const n = parseInt(qMatch[1], 10);
    if (n >= 5 && n <= 1000) count = n;
  }

  // Email requirement
  const emailRequired = /\bwith (an? )?email|verified email|emails?\b/i.test(lower) || /\bcontactable\b/i.test(lower);

  // Country detection
  const countries = new Set<string>();
  let countryCanonical: string | null = null;
  const countryKeys = Object.keys(COUNTRY_SYNONYMS).sort((a, b) => b.length - a.length);
  for (const key of countryKeys) {
    const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    if (re.test(working)) {
      const entry = COUNTRY_SYNONYMS[key];
      for (const v of entry.variants) countries.add(v);
      if (!countryCanonical) countryCanonical = entry.canonical;
      working = working.replace(re, " ");
    }
  }

  // Topic detection
  const topics = new Set<string>();
  for (const [key, vals] of Object.entries(TOPIC_SYNONYMS)) {
    const re = new RegExp(`\\b${key}\\b`, "gi");
    if (re.test(working)) {
      for (const v of vals) topics.add(v);
      working = working.replace(re, " ");
    }
  }

  // Outlet detection - look for capitalized words in original (e.g., Forbes, TechCrunch, Wired)
  const outlets: string[] = [];
  const knownOutlets = ["forbes", "techcrunch", "wired", "bloomberg", "reuters", "guardian", "ft", "wsj", "nyt", "verge", "engadget", "mashable", "vogue", "elle", "espn", "cnn", "bbc"];
  for (const o of knownOutlets) {
    if (new RegExp(`\\b${o}\\b`, "i").test(lower)) outlets.push(o);
  }

  // Tokenize remainder
  const tokens = working.split(/[^a-z0-9]+/i).map((t) => t.trim()).filter(Boolean);
  const freeTerms: string[] = [];
  let kind: "journalists" | "creators" = "journalists";
  let creatorVotes = 0;
  let journalistVotes = 0;

  for (const t of tokens) {
    if (ROLE_WORDS.has(t)) {
      if (["creator", "creators", "influencer", "influencers", "youtuber", "youtubers", "tiktoker", "instagrammer", "blogger"].includes(t)) creatorVotes++;
      else journalistVotes++;
      continue;
    }
    if (/^\d+$/.test(t)) continue;
    if (STOPWORDS.has(t)) continue;
    if (t.length < 2) continue;
    if (t === "email" || t === "emails") continue;
    freeTerms.push(t);
  }
  if (creatorVotes > journalistVotes) kind = "creators";
  // YouTube/Instagram hint
  if (/\b(youtube|instagram|tiktok)\b/i.test(lower)) kind = "creators";

  return {
    raw: q,
    kind,
    topics: [...topics],
    countries: [...countries],
    countryCanonical,
    outlets,
    freeTerms,
    count,
    emailRequired,
  };
}

// ---------- Plan caps ----------

function capForPlan(plan: string | null | undefined): number {
  const p = (plan ?? "").toLowerCase();
  if (["growth", "both", "media-pro", "pro", "enterprise"].includes(p)) return 250;
  if (["starter"].includes(p)) return 50;
  return 10;
}

// ---------- Unified row ----------

type Row = {
  source: "database" | "exa";
  source_id?: string | number;        // db id
  source_url?: string;                // exa url
  source_table?: "journalist" | "creators";
  name: string | null;
  outlet: string | null;
  title: string | null;
  category: string | null;
  country: string | null;
  email: string | null;
  ig_handle?: string | null;
  ig_followers?: number | null;
  youtube_url?: string | null;
  reason?: string;
  score?: number;
};

// ---------- Supabase search ----------

type AdminClient = ReturnType<typeof createClient>;

function safeIlike(v: string): string {
  return v.replace(/[(),]/g, " ").trim();
}

async function searchJournalistsDb(admin: AdminClient, intent: Intent): Promise<Row[]> {
  const orParts: string[] = [];
  const add = (terms: string[], fields: string[]) => {
    for (const t of terms) {
      const s = safeIlike(t); if (!s) continue;
      for (const f of fields) orParts.push(`${f}.ilike.%${s}%`);
    }
  };
  add(intent.topics, ["category", "topics", "titles", "outlet"]);
  add(intent.countries, ["country", "topics", "outlet", "titles"]);
  add(intent.outlets, ["outlet", "titles"]);
  add(intent.freeTerms, ["name", "outlet", "category", "topics", "titles", "country", "email", "xhandle"]);

  let q = admin.from("journalist")
    .select("id,name,email,category,titles,topics,xhandle,outlet,country")
    .limit(400);
  if (orParts.length) q = q.or(orParts.join(","));
  let { data, error } = await q;
  if (error) { console.log("[db.journalist.error]", error.message); return []; }
  if ((data?.length ?? 0) < Math.min(intent.count, 5) && (intent.topics.length || intent.countries.length || intent.freeTerms.length)) {
    const fallback = await admin.from("journalist")
      .select("id,name,email,category,titles,topics,xhandle,outlet,country")
      .limit(400);
    if (!fallback.error && (fallback.data?.length ?? 0) > (data?.length ?? 0)) data = fallback.data;
  }
  return (data ?? []).map((r) => ({
    source: "database" as const,
    source_id: r.id as number,
    source_table: "journalist" as const,
    name: (r.name as string) ?? null,
    outlet: (r.outlet as string) ?? null,
    title: (r.titles as string) ?? null,
    category: (r.category as string) ?? null,
    country: (r.country as string) ?? null,
    email: (r.email as string) ?? null,
  }));
}

async function searchCreatorsDb(admin: AdminClient, intent: Intent): Promise<Row[]> {
  const orParts: string[] = [];
  const add = (terms: string[], fields: string[]) => {
    for (const t of terms) {
      const s = safeIlike(t); if (!s) continue;
      for (const f of fields) orParts.push(`${f}.ilike.%${s}%`);
    }
  };
  add(intent.topics, ["category", "bio", "name"]);
  add(intent.freeTerms, ["name", "category", "bio", "ig_handle", "youtube_url"]);

  let q = admin.from("creators")
    .select("id,name,category,email,bio,ig_handle,ig_followers,youtube_url,type")
    .limit(400);
  if (orParts.length) q = q.or(orParts.join(","));
  let { data, error } = await q;
  if (error) { console.log("[db.creators.error]", error.message); return []; }
  if ((data?.length ?? 0) < Math.min(intent.count, 5) && (intent.topics.length || intent.freeTerms.length)) {
    const fallback = await admin.from("creators")
      .select("id,name,category,email,bio,ig_handle,ig_followers,youtube_url,type")
      .limit(400);
    if (!fallback.error && (fallback.data?.length ?? 0) > (data?.length ?? 0)) data = fallback.data;
  }
  return (data ?? []).map((r) => ({
    source: "database" as const,
    source_id: r.id as number,
    source_table: "creators" as const,
    name: (r.name as string) ?? null,
    outlet: (r.type as string) ?? null,
    title: null,
    category: (r.category as string) ?? null,
    country: null,
    email: (r.email as string) ?? null,
    ig_handle: (r.ig_handle as string) ?? null,
    ig_followers: (r.ig_followers as number) ?? null,
    youtube_url: (r.youtube_url as string) ?? null,
  }));
}

// ---------- Exa search ----------

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function pickEmailFromText(text: string, name?: string | null): string | null {
  const matches = text?.match(new RegExp(EMAIL_RE.source, "gi")) ?? [];
  if (!matches.length) return null;
  if (name) {
    const tokens = name.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    for (const m of matches) {
      if (tokens.some((t) => m.toLowerCase().includes(t))) return m;
    }
  }
  const filtered = matches.filter((m) => !/^(info|hello|contact|support|press|admin|noreply|no-reply|sales|hr|webmaster)@/i.test(m));
  return filtered[0] ?? null;
}

async function exaSearchOnce(query: string, numResults: number): Promise<Array<{ title?: string; url: string; author?: string; text?: string; highlights?: string[] }>> {
  const key = Deno.env.get("EXA_API_KEY");
  if (!key) return [];
  try {
    const r = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        query,
        numResults,
        useAutoprompt: true,
        type: "neural",
        contents: { text: { maxCharacters: 1500 }, highlights: { numSentences: 2, highlightsPerUrl: 1 } },
      }),
    });
    if (!r.ok) { console.log("[exa.error]", r.status, (await r.text()).slice(0, 200)); return []; }
    const data = await r.json();
    return data.results ?? [];
  } catch (e) {
    console.log("[exa.exception]", (e as Error).message);
    return [];
  }
}

function buildExaQueries(intent: Intent): string[] {
  const topic = intent.topics[0] ?? intent.freeTerms[0] ?? "";
  const loc = intent.countryCanonical ?? "";
  const outlet = intent.outlets[0] ?? "";
  const queries: string[] = [];

  if (intent.kind === "journalists") {
    if (topic && loc) queries.push(`${topic} journalist ${loc}`);
    if (topic && loc) queries.push(`${topic} reporter ${loc}`);
    if (topic) queries.push(`${topic} editor ${loc || "byline"}`);
    if (outlet && topic) queries.push(`site:${outlet}.com ${topic} reporter`);
    if (topic && outlet) queries.push(`${topic} writer ${outlet}`);
    if (!topic && loc) queries.push(`${loc} journalist contact`);
    if (!queries.length) queries.push(`${intent.raw} journalist`);
  } else {
    if (topic && loc) queries.push(`${topic} creator ${loc}`);
    if (topic && loc) queries.push(`${topic} youtuber ${loc}`);
    if (topic) queries.push(`${topic} influencer ${loc || ""}`.trim());
    if (!queries.length) queries.push(`${intent.raw} creator`);
  }
  return queries.slice(0, 3);
}

async function searchExa(intent: Intent, target: number): Promise<Row[]> {
  const queries = buildExaQueries(intent);
  if (!queries.length) return [];
  const per = Math.max(8, Math.ceil(target / queries.length) + 4);
  const settled = await Promise.all(queries.map((q) => exaSearchOnce(q, per)));
  const rows: Row[] = [];
  const reasons: string[] = queries;

  settled.forEach((items, qi) => {
    for (const it of items) {
      const url = it.url;
      if (!url) continue;
      let host = "";
      try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
      const titleStr = it.title ?? "";
      // Heuristic name extraction: text before " - ", " | " or " — "
      let nameGuess = it.author ?? null;
      if (!nameGuess && titleStr) {
        const head = titleStr.split(/[-—|·]/)[0]?.trim();
        if (head && head.length < 60 && /^[A-Z]/.test(head)) nameGuess = head;
      }
      const blob = `${it.text ?? ""} ${(it.highlights ?? []).join(" ")}`;
      const email = pickEmailFromText(blob, nameGuess);
      rows.push({
        source: "exa",
        source_url: url,
        name: nameGuess,
        outlet: host || null,
        title: titleStr || null,
        category: intent.topics[0] ?? null,
        country: intent.countryCanonical,
        email,
        reason: (it.highlights?.[0] || it.text?.slice(0, 180) || `Matched on the open web — query: "${reasons[qi]}"`).trim(),
      });
    }
  });
  return rows;
}

// ---------- Dedupe & rank ----------

function dedupe(rows: Row[]): Row[] {
  const seen = new Map<string, Row>();
  for (const r of rows) {
    const keys: string[] = [];
    if (r.email) keys.push(`email:${r.email.toLowerCase()}`);
    if (r.name && r.outlet) keys.push(`no:${r.name.toLowerCase()}|${r.outlet.toLowerCase()}`);
    if (r.source_url) keys.push(`url:${r.source_url}`);
    if (r.ig_handle) keys.push(`ig:${r.ig_handle.toLowerCase()}`);
    if (r.youtube_url) keys.push(`yt:${r.youtube_url}`);
    if (!keys.length && r.name) keys.push(`n:${r.name.toLowerCase()}`);
    if (!keys.length) { seen.set(`raw:${seen.size}`, r); continue; }

    // If any key already seen, merge (prefer database, prefer email present)
    const existing = keys.map((k) => seen.get(k)).find(Boolean) as Row | undefined;
    if (existing) {
      // merge - prefer DB, fill missing fields from this
      const winner = existing.source === "database" ? existing : (r.source === "database" ? r : existing);
      const loser = winner === existing ? r : existing;
      const merged: Row = {
        ...winner,
        email: winner.email ?? loser.email,
        outlet: winner.outlet ?? loser.outlet,
        title: winner.title ?? loser.title,
        category: winner.category ?? loser.category,
        country: winner.country ?? loser.country,
        source_url: winner.source_url ?? loser.source_url,
        reason: winner.reason ?? loser.reason,
      };
      for (const k of keys) seen.set(k, merged);
    } else {
      for (const k of keys) seen.set(k, r);
    }
  }
  // Unique by identity
  return [...new Set(seen.values())];
}

function rankRows(rows: Row[], intent: Intent): Row[] {
  const score = (r: Row): number => {
    let s = 0;
    const cat = (r.category ?? "").toLowerCase();
    const out = (r.outlet ?? "").toLowerCase();
    const ttl = (r.title ?? "").toLowerCase();
    const cnt = (r.country ?? "").toLowerCase();
    for (const t of intent.topics) {
      if (cat.includes(t)) s += 10;
      if (ttl.includes(t)) s += 4;
      if (out.includes(t)) s += 3;
    }
    for (const c of intent.countries) {
      if (cnt.includes(c)) s += 8;
      if (out.includes(c)) s += 2;
    }
    for (const t of intent.freeTerms) {
      if ((r.name ?? "").toLowerCase().includes(t)) s += 3;
      if (cat.includes(t)) s += 3;
      if (out.includes(t)) s += 2;
    }
    if (r.email) s += intent.emailRequired ? 12 : 4;
    if (r.source === "database") s += 3; // slight preference: verified
    return s;
  };
  return [...rows].map((r) => ({ ...r, score: score(r) })).sort((a, b) => (b.score! - a.score!));
}

// ---------- Hybrid orchestrator ----------

async function hybridSearch(admin: AdminClient, q: string, plan: string | null): Promise<{ rows: Row[]; debug: Record<string, unknown>; intent: Intent; cap: number }> {
  const intent = parseIntent(q);
  const cap = capForPlan(plan);
  const target = Math.min(intent.count, cap);

  const debug: Record<string, unknown> = {
    original: q,
    intent: { kind: intent.kind, topics: intent.topics, countries: intent.countries, countryCanonical: intent.countryCanonical, outlets: intent.outlets, freeTerms: intent.freeTerms, count: intent.count, emailRequired: intent.emailRequired },
    plan, cap, target,
  };

  const dbPromise = intent.kind === "journalists" ? searchJournalistsDb(admin, intent) : searchCreatorsDb(admin, intent);
  const exaPromise = searchExa(intent, target);

  const [dbRows, exaRows] = await Promise.all([dbPromise, exaPromise]);
  debug.db_count = dbRows.length;
  debug.exa_count = exaRows.length;

  // Strict filter pass on DB if we have signals
  let dbStrict = dbRows;
  if (intent.topics.length || intent.countries.length) {
    dbStrict = dbRows.filter((r) => {
      const hay = [r.category, r.title, r.outlet, r.country].map((x) => (x ?? "").toLowerCase()).join(" | ");
      const topicHit = intent.topics.length === 0 || intent.topics.some((t) => hay.includes(t));
      const countryHit = intent.countries.length === 0 || intent.countries.some((c) => hay.includes(c));
      return topicHit && countryHit;
    });
  }
  if (dbStrict.length < Math.min(target, 5)) dbStrict = dbRows; // broaden
  debug.db_strict_count = dbStrict.length;

  let combined = [...dbStrict, ...exaRows];
  if (intent.emailRequired) {
    const withEmail = combined.filter((r) => !!r.email);
    if (withEmail.length >= Math.min(target, 5)) combined = withEmail;
  }
  combined = dedupe(combined);
  debug.deduped_count = combined.length;

  const ranked = rankRows(combined, intent).slice(0, target);
  debug.final_count = ranked.length;
  console.log("[chat.hybrid]", JSON.stringify(debug));
  return { rows: ranked, debug, intent, cap };
}

// ---------- Handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user)
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Plan
    const { data: profile } = await admin.from("profiles").select("plan_identifier,sub_active").eq("id", user.id).maybeSingle();
    const plan = profile?.sub_active ? (profile?.plan_identifier as string | null) : null;

    // Usage gate
    const { data: usageRow } = await admin.rpc("chat_usage_summary");
    const summary = Array.isArray(usageRow) ? usageRow[0] : usageRow;
    const allowance = Number(summary?.allowance ?? 0);
    const usedSoFar = Number(summary?.used ?? 0);
    const remaining = Math.max(allowance - usedSoFar, 0);
    if (remaining <= 0) {
      return new Response(
        JSON.stringify({ error: "quota_exhausted", message: "You've used all of your chat tokens for this month.", allowance, used: usedSoFar, remaining: 0 }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { messages, model } = await req.json();
    if (!Array.isArray(messages))
      return new Response(JSON.stringify({ error: "messages required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey)
      return new Response(JSON.stringify({ error: "missing_key", message: "Chat is not configured. Contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const convo = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    let lastKind: "journalists" | "creators" | null = null;
    let lastRows: Row[] = [];
    let lastQuery = "";
    let lastDebug: Record<string, unknown> = {};
    let lastIntent: Intent | null = null;
    let totalTokens = 0;

    for (let i = 0; i < 3; i++) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: model || "gpt-4o-mini", messages: convo, tools, tool_choice: "auto" }),
      });
      if (!r.ok) {
        const text = await r.text();
        return new Response(JSON.stringify({ error: "openai_error", status: r.status, message: text }),
          { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
          const q = String(parsed.q ?? "");
          const result = await hybridSearch(admin, q, plan);
          lastKind = result.intent.kind;
          lastRows = result.rows;
          lastQuery = q;
          lastDebug = result.debug;
          lastIntent = result.intent;
          // Compact summary back to model
          const dbN = result.rows.filter((r) => r.source === "database").length;
          const exaN = result.rows.filter((r) => r.source === "exa").length;
          convo.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              count: result.rows.length,
              requested: result.intent.count,
              from_database: dbN,
              from_web: exaN,
              kind: result.intent.kind,
            }),
          });
        }
        continue;
      }

      let newUsed = usedSoFar + totalTokens;
      try {
        const { data: rec } = await admin.rpc("chat_usage_record", { _user: user.id, _tokens: totalTokens });
        if (typeof rec === "number") newUsed = rec;
      } catch (e) { console.error("chat_usage_record failed", e); }

      return new Response(
        JSON.stringify({
          content: msg.content ?? "",
          results: lastKind ? { kind: lastKind, rows: lastRows, query: lastQuery, debug: lastDebug, intent: lastIntent } : null,
          usage: { allowance, used: newUsed, remaining: Math.max(allowance - newUsed, 0), tokens_this_request: totalTokens },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try { await admin.rpc("chat_usage_record", { _user: user.id, _tokens: totalTokens }); } catch (_) { /* noop */ }
    return new Response(
      JSON.stringify({
        content: "(no response)",
        results: lastKind ? { kind: lastKind, rows: lastRows, query: lastQuery, debug: lastDebug, intent: lastIntent } : null,
        usage: { allowance, used: usedSoFar + totalTokens, remaining: Math.max(allowance - (usedSoFar + totalTokens), 0), tokens_this_request: totalTokens },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
