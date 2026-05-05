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

type UsageSummary = {
  allowance: number;
  used: number;
  remaining: number;
  credits: number;
  period_ym: string;
};

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
  tech: ["tech", "technology", "artificial intelligence", "ai", "software", "saas", "startup", "startups", "innovation"],
  technology: ["technology", "tech", "artificial intelligence", "ai", "software", "saas", "innovation"],
  ai: ["ai", "artificial intelligence", "ml", "machine learning", "technology", "tech"],
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
  uk: { canonical: "United Kingdom", variants: ["united kingdom", "uk", "u.k.", "great britain", "britain", "british", "england", "scotland", "wales", "london"] },
  "united kingdom": { canonical: "United Kingdom", variants: ["united kingdom", "uk", "u.k.", "great britain", "britain", "england", "london"] },
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
  countries: string[];
  countryCanonical: string | null;
  outlets: string[];
  freeTerms: string[];
  count: number;
  emailRequired: boolean;
};

function parseIntent(q: string): Intent {
  const lower = ` ${q.toLowerCase()} `;
  let working = lower;

  let count = 50;
  const qMatch = lower.match(/\b(\d{1,4})\b/);
  if (qMatch) {
    const n = parseInt(qMatch[1], 10);
    if (n >= 5 && n <= 1000) count = n;
  }

  const emailRequired = /\bwith (an? )?email|verified email|emails?\b/i.test(lower) || /\bcontactable\b/i.test(lower);

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

  const topics = new Set<string>();
  for (const [key, vals] of Object.entries(TOPIC_SYNONYMS)) {
    const re = new RegExp(`\\b${key}\\b`, "gi");
    if (re.test(working)) {
      for (const v of vals) topics.add(v);
      working = working.replace(re, " ");
    }
  }

  const outlets: string[] = [];
  const knownOutlets = ["forbes", "techcrunch", "wired", "bloomberg", "reuters", "guardian", "ft", "wsj", "nyt", "verge", "engadget", "mashable", "vogue", "elle", "espn", "cnn", "bbc"];
  for (const o of knownOutlets) {
    if (new RegExp(`\\b${o}\\b`, "i").test(lower)) outlets.push(o);
  }

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
  if (["growth", "both", "media-pro", "pro", "enterprise"].includes(p)) return 500;
  if (["starter"].includes(p)) return 100;
  return 50;
}

// ---------- Unified row ----------

type Row = {
  source: "database" | "exa";
  source_id?: string | number;
  source_url?: string;
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

function uniqueTerms(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const cleaned = safeIlike(String(value ?? "").toLowerCase()).trim();
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
  }
  return out;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function buildSearchTerms(intent: Intent): string[] {
  return uniqueTerms([
    intent.raw,
    intent.countryCanonical,
    ...intent.topics,
    ...intent.freeTerms,
    ...intent.outlets,
    ...intent.countries.slice(0, 6),
  ]);
}

async function fetchBroadJournalists(admin: AdminClient, limit: number): Promise<Row[]> {
  const { data, error } = await admin.from("journalist")
    .select("id,name,email,category,titles,topics,xhandle,outlet,country")
    .order("id", { ascending: true })
    .limit(limit);
  if (error) {
    console.log("[db.journalist.fallback.error]", error.message);
    return [];
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

async function fetchBroadCreators(admin: AdminClient, limit: number): Promise<Row[]> {
  const { data, error } = await admin.from("creators")
    .select("id,name,category,email,bio,ig_handle,ig_followers,youtube_url,type")
    .order("id", { ascending: true })
    .limit(limit);
  if (error) {
    console.log("[db.creators.fallback.error]", error.message);
    return [];
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

function journalistRow(r: Record<string, unknown>): Row {
  return {
    source: "database" as const,
    source_id: r.id as number,
    source_table: "journalist" as const,
    name: (r.name as string) ?? null,
    outlet: (r.outlet as string) ?? null,
    title: (r.titles as string) ?? null,
    category: (r.category as string) ?? null,
    country: (r.country as string) ?? null,
    email: (r.email as string) ?? null,
    reason: (r.bio as string) ?? undefined,
  };
}

function creatorRow(r: Record<string, unknown>): Row {
  return {
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
  };
}

function ilikeOr(terms: string[], fields: string[]): string {
  const parts: string[] = [];
  for (const t of terms) {
    const s = safeIlike(t);
    if (!s) continue;
    for (const f of fields) parts.push(`${f}.ilike.%${s}%`);
  }
  return parts.join(",");
}

function missingColumn(error: unknown, column: string): boolean {
  const msg = String((error as { message?: string })?.message ?? error ?? "").toLowerCase();
  return msg.includes(column.toLowerCase()) && (msg.includes("column") || msg.includes("schema cache"));
}

async function runJournalistQuery(
  admin: AdminClient,
  terms: string[],
  fields: string[],
  limit: number,
): Promise<Row[]> {
  const cleanedTerms = uniqueTerms(terms);
  if (!cleanedTerms.length) return [];

  let currentFields = [...fields];
  while (currentFields.length) {
    const expr = ilikeOr(cleanedTerms, currentFields);
    if (!expr) return [];
    const { data, error } = await admin.from("journalist").select("*").limit(limit).or(expr);
    if (!error) return (data ?? []).map((r) => journalistRow(r as Record<string, unknown>));
    if (currentFields.includes("bio") && missingColumn(error, "bio")) {
      currentFields = currentFields.filter((field) => field !== "bio");
      continue;
    }
    console.log("[db.journalist.query.error]", error.message, { terms: cleanedTerms, fields: currentFields });
    return [];
  }
  return [];
}

async function runCreatorQuery(
  admin: AdminClient,
  terms: string[],
  fields: string[],
  limit: number,
): Promise<Row[]> {
  const cleanedTerms = uniqueTerms(terms);
  if (!cleanedTerms.length) return [];

  let currentFields = [...fields];
  while (currentFields.length) {
    const expr = ilikeOr(cleanedTerms, currentFields);
    if (!expr) return [];
    const { data, error } = await admin.from("creators").select("*").limit(limit).or(expr);
    if (!error) return (data ?? []).map((r) => creatorRow(r as Record<string, unknown>));
    if (currentFields.includes("bio") && missingColumn(error, "bio")) {
      currentFields = currentFields.filter((field) => field !== "bio");
      continue;
    }
    console.log("[db.creators.query.error]", error.message, { terms: cleanedTerms, fields: currentFields });
    return [];
  }
  return [];
}

async function searchJournalistsDb(admin: AdminClient, intent: Intent): Promise<Row[]> {
  const limit = Math.max(1500, Math.min(8000, intent.count * 60));
  const primaryTerms = uniqueTerms([
    ...intent.topics,
    ...intent.freeTerms,
    ...intent.outlets,
    intent.countryCanonical,
    ...intent.countries.slice(0, 4),
  ]);
  const allTerms = buildSearchTerms(intent);
  const fields = ["name", "email", "outlet", "titles", "topics", "country", "category", "xhandle", "bio"];

  const primary = await runJournalistQuery(
    admin,
    primaryTerms.length ? primaryTerms : allTerms,
    fields,
    limit,
  );
  const secondary = primaryTerms.join("|") === allTerms.join("|")
    ? []
    : await runJournalistQuery(admin, allTerms, fields, limit);

  let rows = dedupe([...primary, ...secondary]);
  if (rows.length < Math.min(intent.count, 50)) {
    rows = dedupe([...rows, ...(await fetchBroadJournalists(admin, limit))]);
  }
  return rows;
}

async function searchCreatorsDb(admin: AdminClient, intent: Intent): Promise<Row[]> {
  const limit = Math.max(1000, Math.min(6000, intent.count * 50));
  const primaryTerms = uniqueTerms([
    ...intent.topics,
    ...intent.freeTerms,
    ...intent.outlets,
    intent.countryCanonical,
  ]);
  const allTerms = buildSearchTerms(intent);
  const fields = ["name", "category", "email", "bio", "ig_handle", "youtube_url", "type"];

  const primary = await runCreatorQuery(
    admin,
    primaryTerms.length ? primaryTerms : allTerms,
    fields,
    limit,
  );
  const secondary = primaryTerms.join("|") === allTerms.join("|")
    ? []
    : await runCreatorQuery(admin, allTerms, fields, limit);

  let rows = dedupe([...primary, ...secondary]);
  if (rows.length < Math.min(intent.count, 50)) {
    rows = dedupe([...rows, ...(await fetchBroadCreators(admin, limit))]);
  }
  return rows;
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

function cleanTopicForQuery(intent: Intent): string {
  const raw = intent.topics[0] ?? intent.freeTerms[0] ?? "journalist";
  if (["tech", "technology", "ai", "artificial intelligence", "software", "saas"].includes(raw)) return "technology";
  return raw;
}

function extractNameGuess(title: string, text: string, author?: string): string | null {
  const a = author?.trim();
  if (a && a.length < 80 && !/^(staff|editorial|news desk|admin)$/i.test(a)) return a;
  const by = text.match(/\bby\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/);
  if (by?.[1]) return by[1];
  const head = title.split(/[-—|·:]/)[0]?.trim();
  if (head && head.length < 60 && /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(head)) return head;
  return null;
}

function isJunkWebResult(r: { title?: string; url?: string; text?: string }, intent: Intent): boolean {
  const blob = `${r.title ?? ""} ${r.url ?? ""} ${r.text ?? ""}`.toLowerCase();
  if (/neural runner|runner game|github\.com|npmjs\.com|chromewebstore|app store|play\.google\.com/.test(blob)) return true;
  const hasTopic = !intent.topics.length || intent.topics.some((t) => blob.includes(t));
  const hasRole = /journalist|reporter|editor|writer|correspondent|columnist|contributor|author|byline/.test(blob);
  const hasOutletSignal = /bbc|guardian|wired|techcrunch|verge|forbes|bloomberg|reuters|financial times|ft\.com|muckrack|pressgazette|journalism|publication|news/.test(blob);
  const hasProfileSignal = /author|profile|staff|contributors|substack|linkedin\.com|muckrack/.test(blob);
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(blob);
  return !(hasTopic || hasRole || hasOutletSignal || hasProfileSignal || hasEmail);
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
    if (!r.ok) {
      console.log("[exa.error]", r.status, (await r.text()).slice(0, 200));
      return [];
    }
    const data = await r.json();
    return data.results ?? [];
  } catch (e) {
    console.log("[exa.exception]", (e as Error).message);
    return [];
  }
}

function buildExaQueries(intent: Intent): string[] {
  const topic = cleanTopicForQuery(intent);
  const loc = intent.countryCanonical ?? "";
  const outlet = intent.outlets[0] ?? "";
  const queries: string[] = [];

  if (intent.raw.trim()) queries.push(intent.raw.trim());

  if (intent.kind === "journalists") {
    if (topic && loc) queries.push(`${topic} journalists ${loc}`);
    if (topic && loc) queries.push(`${topic === "technology" ? "tech" : topic} reporters ${loc === "United Kingdom" ? "UK" : loc}`);
    if ((topic === "technology" || topic === "ai") && loc) queries.push(`AI journalists ${loc === "United Kingdom" ? "London" : loc}`);
    if (topic && loc) queries.push(`${topic} writers ${loc === "United Kingdom" ? "UK" : loc} publication`);
    if (topic) queries.push(`${topic} journalist bylines`);
    if (topic) queries.push(`${topic} reporter contact`);
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
  return [...new Set(queries)].slice(0, 8);
}

async function searchExa(intent: Intent, target: number): Promise<Row[]> {
  const queries = buildExaQueries(intent);
  if (!queries.length) return [];
  const desired = Math.max(60, Math.min(150, target * 3));
  const per = Math.max(12, Math.ceil(desired / queries.length) + 6);
  const settled = await Promise.all(queries.map((q) => exaSearchOnce(q, per)));
  const rows: Row[] = [];
  const reasons: string[] = queries;

  settled.forEach((items, qi) => {
    for (const it of items) {
      const url = it.url;
      if (!url) continue;
      if (isJunkWebResult(it, intent)) continue;
      let host = "";
      try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
      const titleStr = it.title ?? "";
      const blob = `${it.text ?? ""} ${(it.highlights ?? []).join(" ")}`;
      const nameGuess = extractNameGuess(titleStr, blob, it.author);
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

async function searchExaBroadened(intent: Intent, target: number): Promise<Row[]> {
  const broad: Intent = {
    ...intent,
    countries: [],
    countryCanonical: null,
    topics: intent.topics.length ? intent.topics : [...new Set([...intent.freeTerms, "technology", "tech", "ai"])],
  };
  return searchExa(broad, Math.max(target, 75));
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
    if (!keys.length) {
      seen.set(`raw:${seen.size}`, r);
      continue;
    }

    const existing = keys.map((k) => seen.get(k)).find(Boolean) as Row | undefined;
    if (existing) {
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
  return [...new Set(seen.values())];
}

function rankRows(rows: Row[], intent: Intent): Row[] {
  const score = (r: Row): number => {
    let s = 0;
    const name = (r.name ?? "").toLowerCase();
    const cat = (r.category ?? "").toLowerCase();
    const out = (r.outlet ?? "").toLowerCase();
    const ttl = (r.title ?? "").toLowerCase();
    const cnt = (r.country ?? "").toLowerCase();
    const hay = [name, cat, out, ttl, cnt, r.reason].map((x) => (x ?? "").toLowerCase()).join(" | ");
    for (const t of intent.topics) {
      if (cat.includes(t)) s += 10;
      if (ttl.includes(t)) s += 4;
      if (out.includes(t)) s += 3;
      if (hay.includes(t)) s += 2;
    }
    for (const c of intent.countries) {
      if (cnt.includes(c)) s += 8;
      if (out.includes(c)) s += 2;
      if (hay.includes(c)) s += 1;
    }
    for (const t of intent.freeTerms) {
      if (name.includes(t)) s += 3;
      if (cat.includes(t)) s += 3;
      if (out.includes(t)) s += 2;
      if (hay.includes(t)) s += 1;
    }
    if (/journalist|reporter|editor|writer|correspondent|columnist|contributor|author/.test(ttl)) s += 7;
    if (r.name && /\s/.test(r.name) && r.name.length <= 70) s += 5;
    if (r.outlet && !/linkedin\.com|x\.com|twitter\.com|facebook\.com|instagram\.com/.test(out)) s += 4;
    if (intent.countryCanonical === "United Kingdom" && /london|uk|united kingdom|britain|england|bbc|guardian|wired\.co\.uk|ft\.com|telegraph|independent/.test(hay)) s += 5;
    if (r.email) s += intent.emailRequired ? 12 : 4;
    if (r.source === "database") s += 20;
    if (!r.name && r.source === "exa") s -= 8;
    if (/neural runner|generic|directory|job|salary|course/.test(hay)) s -= 20;
    return s;
  };
  return [...rows].map((r) => ({ ...r, score: score(r) })).sort((a, b) => (b.score! - a.score!));
}

function blendedResults(rows: Row[], intent: Intent, target: number): Row[] {
  const rankedAll = rankRows(rows, intent);
  const dbRanked = rankedAll.filter((r) => r.source === "database");
  const exaRanked = rankedAll.filter((r) => r.source === "exa");
  const minDb = Math.min(dbRanked.length, Math.min(40, Math.max(15, Math.floor(target * 0.35))));
  const minExa = Math.min(exaRanked.length, Math.min(80, Math.max(25, Math.floor(target * 0.5))));
  const picked: Row[] = [...dbRanked.slice(0, minDb), ...exaRanked.slice(0, minExa)];
  const keys = new Set(picked.map((r) => `${r.source}:${r.source_id ?? r.source_url ?? r.name}`));
  for (const r of rankedAll) {
    if (picked.length >= target) break;
    const key = `${r.source}:${r.source_id ?? r.source_url ?? r.name}`;
    if (keys.has(key)) continue;
    keys.add(key);
    picked.push(r);
  }
  return rankRows(picked, intent).slice(0, target);
}

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function journalistKeys(row: Row): string[] {
  const keys: string[] = [];
  if (row.email) keys.push(`email:${norm(row.email)}`);
  if (row.name && row.outlet) keys.push(`name_outlet:${norm(row.name)}|${norm(row.outlet)}`);
  return keys;
}

function creatorKeys(row: Row): string[] {
  const keys: string[] = [];
  if (row.email) keys.push(`email:${norm(row.email)}`);
  if (row.ig_handle) keys.push(`ig:${norm(row.ig_handle)}`);
  if (row.youtube_url) keys.push(`yt:${norm(row.youtube_url)}`);
  if (row.name && row.outlet) keys.push(`name_outlet:${norm(row.name)}|${norm(row.outlet)}`);
  return keys;
}

async function loadExistingJournalistKeys(admin: AdminClient, rows: Row[]): Promise<Set<string>> {
  const existing = new Set<string>();
  const emails = uniqueTerms(rows.map((row) => row.email));
  const names = uniqueTerms(rows.map((row) => row.name));

  for (const batch of chunkArray(emails, 100)) {
    const { data, error } = await admin.from("journalist").select("email").in("email", batch);
    if (error) {
      console.log("[persist.journalists.email.error]", error.message);
      continue;
    }
    for (const row of data ?? []) {
      const email = norm(row.email as string | null);
      if (email) existing.add(`email:${email}`);
    }
  }

  for (const batch of chunkArray(names, 100)) {
    const { data, error } = await admin.from("journalist").select("name,outlet").in("name", batch);
    if (error) {
      console.log("[persist.journalists.name.error]", error.message);
      continue;
    }
    for (const row of data ?? []) {
      const name = norm(row.name as string | null);
      const outlet = norm(row.outlet as string | null);
      if (name && outlet) existing.add(`name_outlet:${name}|${outlet}`);
    }
  }

  return existing;
}

async function loadExistingCreatorKeys(admin: AdminClient, rows: Row[]): Promise<Set<string>> {
  const existing = new Set<string>();
  const emails = uniqueTerms(rows.map((row) => row.email));
  const handles = uniqueTerms(rows.map((row) => row.ig_handle));
  const youtube = uniqueTerms(rows.map((row) => row.youtube_url));
  const names = uniqueTerms(rows.map((row) => row.name));

  for (const batch of chunkArray(emails, 100)) {
    const { data, error } = await admin.from("creators").select("email").in("email", batch);
    if (error) {
      console.log("[persist.creators.email.error]", error.message);
      continue;
    }
    for (const row of data ?? []) {
      const email = norm(row.email as string | null);
      if (email) existing.add(`email:${email}`);
    }
  }

  for (const batch of chunkArray(handles, 100)) {
    const { data, error } = await admin.from("creators").select("ig_handle").in("ig_handle", batch);
    if (error) {
      console.log("[persist.creators.ig.error]", error.message);
      continue;
    }
    for (const row of data ?? []) {
      const handle = norm(row.ig_handle as string | null);
      if (handle) existing.add(`ig:${handle}`);
    }
  }

  for (const batch of chunkArray(youtube, 100)) {
    const { data, error } = await admin.from("creators").select("youtube_url").in("youtube_url", batch);
    if (error) {
      console.log("[persist.creators.youtube.error]", error.message);
      continue;
    }
    for (const row of data ?? []) {
      const url = norm(row.youtube_url as string | null);
      if (url) existing.add(`yt:${url}`);
    }
  }

  for (const batch of chunkArray(names, 100)) {
    const { data, error } = await admin.from("creators").select("name,type").in("name", batch);
    if (error) {
      console.log("[persist.creators.name.error]", error.message);
      continue;
    }
    for (const row of data ?? []) {
      const name = norm(row.name as string | null);
      const outlet = norm(row.type as string | null);
      if (name && outlet) existing.add(`name_outlet:${name}|${outlet}`);
    }
  }

  return existing;
}

async function insertJournalistRows(admin: AdminClient, rows: Row[]): Promise<number> {
  if (!rows.length) return 0;
  const now = new Date().toISOString();
  const payload = rows.map((row) => ({
    name: row.name,
    outlet: row.outlet,
    category: row.category,
    titles: row.title,
    country: row.country,
    email: row.email,
    enrichment_source_url: row.source_url ?? null,
    enriched_at: now,
  }));

  let { error } = await admin.from("journalist").insert(payload);
  if (error && /enrichment_source_url|enriched_at/.test(error.message ?? "")) {
    const fallback = payload.map(({ enrichment_source_url: _source, enriched_at: _enrichedAt, ...base }) => base);
    const retry = await admin.from("journalist").insert(fallback);
    error = retry.error;
  }
  if (error) {
    console.log("[persist.journalists.insert.error]", error.message);
    return 0;
  }
  return payload.length;
}

async function insertCreatorRows(admin: AdminClient, rows: Row[]): Promise<number> {
  if (!rows.length) return 0;
  const now = new Date().toISOString();
  const payload = rows.map((row) => ({
    name: row.name,
    category: row.category,
    email: row.email,
    ig_handle: row.ig_handle ?? null,
    youtube_url: row.youtube_url ?? null,
    type: row.outlet ?? null,
    bio: row.title ?? row.reason ?? null,
    enrichment_source_url: row.source_url ?? null,
    enriched_at: now,
  }));

  let { error } = await admin.from("creators").insert(payload);
  if (error && /enrichment_source_url|enriched_at/.test(error.message ?? "")) {
    const fallback = payload.map(({ enrichment_source_url: _source, enriched_at: _enrichedAt, ...base }) => base);
    const retry = await admin.from("creators").insert(fallback);
    error = retry.error;
  }
  if (error) {
    console.log("[persist.creators.insert.error]", error.message);
    return 0;
  }
  return payload.length;
}

async function persistWebRows(
  admin: AdminClient,
  kind: "journalists" | "creators",
  rows: Row[],
): Promise<{ considered: number; saved: number }> {
  const webRows = rows.filter((row) => row.source === "exa");
  if (!webRows.length) return { considered: 0, saved: 0 };

  const candidates = (kind === "journalists"
    ? webRows.filter((row) => row.name && (row.email || row.outlet || row.title) && ((row.score ?? 0) >= 8 || !!row.email))
    : webRows.filter((row) => row.name && (row.email || row.ig_handle || row.youtube_url || row.outlet) && ((row.score ?? 0) >= 8 || !!row.email)))
    .slice(0, 75);

  if (!candidates.length) return { considered: 0, saved: 0 };

  const existingKeys = kind === "journalists"
    ? await loadExistingJournalistKeys(admin, candidates)
    : await loadExistingCreatorKeys(admin, candidates);

  const localKeys = new Set<string>();
  const insertable: Row[] = [];

  for (const row of candidates) {
    const keys = kind === "journalists" ? journalistKeys(row) : creatorKeys(row);
    if (!keys.length) continue;
    if (keys.some((key) => existingKeys.has(key) || localKeys.has(key))) continue;
    keys.forEach((key) => localKeys.add(key));
    insertable.push(row);
  }

  const saved = kind === "journalists"
    ? await insertJournalistRows(admin, insertable)
    : await insertCreatorRows(admin, insertable);

  return { considered: candidates.length, saved };
}

// ---------- Hybrid orchestrator ----------

async function hybridSearch(admin: AdminClient, q: string, plan: string | null): Promise<{ rows: Row[]; debug: Record<string, unknown>; intent: Intent; cap: number }> {
  const intent = parseIntent(q);
  const cap = capForPlan(plan);
  const target = Math.min(intent.count, cap);

  const debug: Record<string, unknown> = {
    original: q,
    intent: { kind: intent.kind, topics: intent.topics, countries: intent.countries, countryCanonical: intent.countryCanonical, outlets: intent.outlets, freeTerms: intent.freeTerms, count: intent.count, emailRequired: intent.emailRequired },
    plan,
    cap,
    target,
  };

  const dbPromise = intent.kind === "journalists" ? searchJournalistsDb(admin, intent) : searchCreatorsDb(admin, intent);
  const exaPromise = searchExa(intent, target);

  const [dbRows, exaRowsInitial] = await Promise.all([dbPromise, exaPromise]);
  let exaRows = exaRowsInitial;
  if (exaRows.length < 20 || dbRows.length + exaRows.length < 20) {
    exaRows = dedupe([...exaRows, ...(await searchExaBroadened(intent, target))]).filter((r) => r.source === "exa");
  }
  debug.db_count = dbRows.length;
  debug.exa_count = exaRows.length;

  let dbStrict = dbRows;
  if (intent.topics.length || intent.countries.length) {
    dbStrict = dbRows.filter((r) => {
      const hay = [r.name, r.category, r.title, r.outlet, r.country, r.reason].map((x) => (x ?? "").toLowerCase()).join(" | ");
      const topicHit = intent.topics.length === 0 || intent.topics.some((t) => hay.includes(t));
      const countryHit = intent.countries.length === 0 || intent.countries.some((c) => hay.includes(c));
      return topicHit || countryHit;
    });
  }
  if (dbStrict.length < Math.min(target, 25)) dbStrict = dbRows;
  debug.db_strict_count = dbStrict.length;

  let combined = [...dbStrict, ...exaRows];
  if (intent.emailRequired) {
    const withEmail = combined.filter((r) => !!r.email);
    if (withEmail.length >= Math.min(target, 5)) combined = withEmail;
  }
  combined = dedupe(combined);
  if (combined.length < Math.min(target, 25)) {
    const fallbackRows = intent.kind === "journalists"
      ? await fetchBroadJournalists(admin, Math.max(1500, target * 40))
      : await fetchBroadCreators(admin, Math.max(1500, target * 40));
    combined = dedupe([...combined, ...fallbackRows]);
  }
  debug.deduped_count = combined.length;

  const ranked = blendedResults(combined, intent, target);
  debug.final_count = ranked.length;

  try {
    const persisted = await persistWebRows(admin, intent.kind, ranked);
    debug.persisted = persisted;
  } catch (error) {
    console.log("[chat.persist.error]", error instanceof Error ? error.message : String(error));
    debug.persisted = { considered: 0, saved: 0, error: error instanceof Error ? error.message : String(error) };
  }

  console.log("[chat.hybrid]", JSON.stringify(debug));
  return { rows: ranked, debug, intent, cap };
}

async function loadUsageSummary(admin: ReturnType<typeof createClient>, userId: string): Promise<UsageSummary> {
  const period = new Date().toISOString().slice(0, 7);
  const [profileResult, usageResult] = await Promise.all([
    admin.from("profiles").select("chat_credits, sub_active, plan_identifier").eq("id", userId).maybeSingle(),
    admin.from("chat_usage").select("tokens_used").eq("user_id", userId).eq("period_ym", period).maybeSingle(),
  ]);

  if (profileResult.error) throw new Error(`profile_usage_failed: ${profileResult.error.message}`);
  if (usageResult.error) throw new Error(`chat_usage_failed: ${usageResult.error.message}`);

  const profile = profileResult.data as { chat_credits?: number | string | null; sub_active?: boolean | null; plan_identifier?: string | null } | null;
  const plan = String(profile?.plan_identifier ?? "").toLowerCase();
  const allowance = profile?.sub_active
    ? (["growth", "both", "media-pro", "pro", "enterprise"].includes(plan) ? 1_000_000 : 200_000)
    : 20_000;
  const used = Number((usageResult.data as { tokens_used?: number | string } | null)?.tokens_used ?? 0);
  const credits = Number(profile?.chat_credits ?? 0);

  return { allowance, used, credits, remaining: Math.max(allowance - used, 0) + credits, period_ym: period };
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

    const { data: profile } = await admin.from("profiles").select("plan_identifier,sub_active").eq("id", user.id).maybeSingle();
    const plan = profile?.sub_active ? (profile?.plan_identifier as string | null) : null;

    const summary = await loadUsageSummary(admin, user.id);
    const allowance = summary.allowance;
    const usedSoFar = summary.used;
    const remaining = summary.remaining;
    if (remaining <= 0) {
      return new Response(
        JSON.stringify({ error: "quota_exhausted", message: "You've used all of your chat tokens for this month.", ...summary }),
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
        console.error("openai_error", { status: r.status, body: text.slice(0, 500) });
        return new Response(JSON.stringify({ error: "model_provider_error", provider_status: r.status, message: text, usage: summary }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

      let remainingAfter = Math.max(remaining - totalTokens, 0);
      try {
        const { data: rec } = await admin.rpc("chat_usage_record", { _user: user.id, _tokens: totalTokens });
        if (typeof rec === "number") remainingAfter = rec;
      } catch (e) {
        console.error("chat_usage_record failed", e);
      }

      return new Response(
        JSON.stringify({
          content: msg.content ?? "",
          results: lastKind ? { kind: lastKind, rows: lastRows, query: lastQuery, debug: lastDebug, intent: lastIntent } : null,
          usage: { allowance, used: Math.min(allowance, usedSoFar + totalTokens), credits: summary.credits, period_ym: summary.period_ym, remaining: remainingAfter, tokens_this_request: totalTokens },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try { await admin.rpc("chat_usage_record", { _user: user.id, _tokens: totalTokens }); } catch (_) { /* noop */ }
    return new Response(
      JSON.stringify({
        content: "(no response)",
        results: lastKind ? { kind: lastKind, rows: lastRows, query: lastQuery, debug: lastDebug, intent: lastIntent } : null,
        usage: { allowance, used: Math.min(allowance, usedSoFar + totalTokens), credits: summary.credits, period_ym: summary.period_ym, remaining: Math.max(remaining - totalTokens, 0), tokens_this_request: totalTokens },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
