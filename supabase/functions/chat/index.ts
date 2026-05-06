// redeploy trigger: chat edge function strict-mode-007 2026-05-06
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CHAT_VERSION = "strict-mode-007";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Chat-Version": CHAT_VERSION,
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
  sub_active: boolean;
  plan_identifier: string | null;
  beta_credit_bypass?: boolean;
};

function finiteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

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
  finance: ["finance", "financial", "business", "markets", "economy", "banking", "fintech", "investing", "stocks"],
  health: ["health", "wellness", "fitness", "medical", "healthcare"],
  beauty: ["beauty", "makeup", "skincare", "cosmetics"],
  fashion: ["fashion", "style", "apparel"],
  food: ["food", "restaurant", "restaurants", "dining", "chef", "cooking", "f&b", "hospitality", "beverage", "drink", "grocery", "agriculture"],
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
  germany: { canonical: "Germany", variants: ["germany", "deutschland", "berlin", "frankfurt", "munich", "hamburg", "leipzig"] },
  france: { canonical: "France", variants: ["france", "french"] },
  india: { canonical: "India", variants: ["india", "new delhi", "delhi", "mumbai", "bangalore", "bengaluru", "kolkata", "chennai", "hyderabad", "pune"] },
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

const JOURNALIST_WORDS = [
  "journalist", "journalists", "reporter", "reporters", "editor", "editors",
  "writer", "writers", "correspondent", "correspondents", "columnist", "columnists",
  "contributor", "contributors", "media contact", "press contact",
];
const CREATOR_WORDS = [
  "creator", "creators", "influencer", "influencers", "youtuber", "youtubers",
  "tiktoker", "tiktokers", "instagrammer", "instagrammers", "blogger", "bloggers",
  "podcaster", "podcasters", "streamer", "streamers", "kol", "kols",
];

const PLATFORM_MAP: Record<string, string[]> = {
  youtube: ["youtube", "yt"],
  tiktok: ["tiktok", "tik tok"],
  instagram: ["instagram", "ig"],
  twitter: ["twitter", " x "],
  linkedin: ["linkedin"],
  podcast: ["podcast", "podcaster"],
};

const STOPWORDS = new Set([
  "a", "an", "the", "in", "at", "on", "of", "for", "to", "with", "from", "by",
  "and", "or", "is", "are", "be", "who", "that", "find", "me", "show", "list",
  "any", "all", "some", "please", "best", "top", "based", "located", "near",
  "get", "give", "need", "want", "looking", "search", "covering", "about",
]);

// Extra location keywords with cities
const EXTRA_LOCATIONS: Record<string, { canonical: string; variants: string[] }> = {
  "hong kong": { canonical: "Hong Kong", variants: ["hong kong", "hk", "hong kong sar", "香港"] },
  hk: { canonical: "Hong Kong", variants: ["hong kong", "hk"] },
  thailand: { canonical: "Thailand", variants: ["thailand", "bangkok", "thai"] },
  bangkok: { canonical: "Thailand", variants: ["thailand", "bangkok"] },
  philippines: { canonical: "Philippines", variants: ["philippines", "manila", "filipino"] },
  vietnam: { canonical: "Vietnam", variants: ["vietnam", "hanoi", "ho chi minh"] },
  indonesia: { canonical: "Indonesia", variants: ["indonesia", "jakarta"] },
  malaysia: { canonical: "Malaysia", variants: ["malaysia", "kuala lumpur", "kl"] },
  korea: { canonical: "South Korea", variants: ["korea", "south korea", "seoul"] },
  taiwan: { canonical: "Taiwan", variants: ["taiwan", "taipei"] },
};

export type Intent = {
  raw: string;
  kind: "journalists" | "creators" | "both";
  topic: string | null;
  topics: string[];
  location: string | null;
  countries: string[];
  countryCanonical: string | null;
  locationTerms: string[];
  outlets: string[];
  platforms: string[];
  minFollowers: number | null;
  emailRequired: boolean;
  titles: string[];
  freeTerms: string[];
  count: number;
};

function parseFollowers(lower: string): number | null {
  // 100k+, 1m+, "over 100k", "more than 100,000", "1 million followers"
  let m = lower.match(/(\d+(?:[.,]\d+)?)\s*([km])\s*\+?/);
  if (m) {
    const n = parseFloat(m[1].replace(",", "."));
    const mult = m[2] === "m" ? 1_000_000 : 1_000;
    return Math.floor(n * mult);
  }
  m = lower.match(/(?:over|more than|at least|min(?:imum)?|>=?)\s*([\d,]+)/);
  if (m) return parseInt(m[1].replace(/,/g, ""), 10);
  m = lower.match(/(\d+(?:[.,]\d+)?)\s*million/);
  if (m) return Math.floor(parseFloat(m[1].replace(",", ".")) * 1_000_000);
  return null;
}

export function parseSearchIntent(q: string): Intent {
  return parseIntent(q);
}

function parseIntent(q: string): Intent {
  const lower = ` ${q.toLowerCase()} `;
  let working = lower;

  let count = 0;
  const qMatch = lower.match(/\b(\d{1,4})\b(?!\s*[km])/);
  if (qMatch) {
    const n = parseInt(qMatch[1], 10);
    if (n >= 5 && n <= 1000) count = n;
  }

  const emailRequired =
    /\bwith (an? )?email\b|\bhas email\b|\bemail only\b|\bcontactable\b|\bverified email\b|\bwith emails?\b/i.test(lower);

  // Kind detection
  const hasJournalist = JOURNALIST_WORDS.some((w) => new RegExp(`\\b${w}\\b`, "i").test(lower));
  const hasCreator = CREATOR_WORDS.some((w) => new RegExp(`\\b${w}\\b`, "i").test(lower));
  let kind: Intent["kind"];
  if (hasJournalist && hasCreator) kind = "both";
  else if (hasJournalist) kind = "journalists";
  else if (hasCreator) kind = "creators";
  else kind = "both";

  // Locations - merge country synonyms + extras
  const allLocs: Record<string, { canonical: string; variants: string[] }> = { ...COUNTRY_SYNONYMS, ...EXTRA_LOCATIONS };
  const countries = new Set<string>();
  const locationTerms = new Set<string>();
  let countryCanonical: string | null = null;
  const locKeys = Object.keys(allLocs).sort((a, b) => b.length - a.length);
  for (const key of locKeys) {
    const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(working)) {
      const entry = allLocs[key];
      for (const v of entry.variants) { countries.add(v); locationTerms.add(v); }
      if (!countryCanonical) countryCanonical = entry.canonical;
      working = working.replace(new RegExp(re.source, "gi"), " ");
    }
  }

  // Free-form city/state catch (e.g. "New York", "San Francisco", "Yorkshire", "Palm Beach").
  // We only add to locationTerms if the user used "in <City>", "from <City>", "based in <City>".
  const cityMatch = lower.match(/\b(?:in|from|based in|located in|near)\s+([a-z][a-z\s]{1,30}?)(?:\s+(?:with|who|that|covering|from|for|and|or)\b|[,.?!]|\s*$)/i);
  if (cityMatch && cityMatch[1]) {
    const city = cityMatch[1].trim().toLowerCase().replace(/\s+/g, " ");
    if (city.length >= 2 && city.length <= 40 && !["the","a","an","email","emails","followers"].includes(city)) {
      locationTerms.add(city);
      // Common US state aliases to broaden
      if (city === "new york") { locationTerms.add("ny"); locationTerms.add("new york city"); locationTerms.add("nyc"); }
      if (city === "los angeles") { locationTerms.add("la"); locationTerms.add("california"); }
      if (city === "san francisco") { locationTerms.add("sf"); locationTerms.add("california"); }
    }
  }


  // Topics
  const topics = new Set<string>();
  for (const [key, vals] of Object.entries(TOPIC_SYNONYMS)) {
    const re = new RegExp(`\\b${key}\\b`, "i");
    if (re.test(working)) {
      for (const v of vals) topics.add(v);
      working = working.replace(new RegExp(re.source, "gi"), " ");
    }
  }

  // Outlets
  const outlets: string[] = [];
  const knownOutlets = ["forbes", "techcrunch", "wired", "bloomberg", "reuters", "guardian", "ft", "wsj", "nyt", "verge", "engadget", "mashable", "vogue", "elle", "espn", "cnn", "bbc", "business insider", "fast company", "axios"];
  for (const o of knownOutlets) {
    if (new RegExp(`\\b${o}\\b`, "i").test(lower)) outlets.push(o);
  }

  // Platforms (creators)
  const platforms: string[] = [];
  for (const [p, variants] of Object.entries(PLATFORM_MAP)) {
    if (variants.some((v) => new RegExp(`\\b${v.trim()}\\b`, "i").test(lower))) platforms.push(p);
  }

  const minFollowers = parseFollowers(lower);

  // Free terms
  const tokens = working.split(/[^a-z0-9]+/i).map((t) => t.trim()).filter(Boolean);
  const freeTerms: string[] = [];
  const allRoleWords = new Set([...JOURNALIST_WORDS, ...CREATOR_WORDS]);
  for (const t of tokens) {
    if (allRoleWords.has(t)) continue;
    if (/^\d+$/.test(t)) continue;
    if (STOPWORDS.has(t)) continue;
    if (t.length < 2) continue;
    if (t === "email" || t === "emails" || t === "followers") continue;
    freeTerms.push(t);
  }

  return {
    raw: q,
    kind,
    topic: topics.has("finance") ? "finance" : ([...topics][0] ?? null),
    topics: [...topics],
    location: countryCanonical,
    countries: [...countries],
    countryCanonical,
    locationTerms: [...locationTerms],
    outlets,
    platforms,
    minFollowers,
    emailRequired,
    titles: [],
    freeTerms,
    count,
  };
}

// ---------- Plan caps ----------

function capForPlan(plan: string | null | undefined): number {
  const p = (plan ?? "").toLowerCase();
  if (["growth", "both", "media-pro", "pro", "enterprise", "admin"].includes(p)) return 500;
  if (["starter"].includes(p)) return 100;
  return 50;
}

// ---------- Unified row ----------

export type Row = {
  source: "database" | "exa";
  source_id?: string | number;
  source_url?: string;
  source_table?: "journalist" | "creators";
  name: string | null;
  outlet: string | null;
  title: string | null;
  category: string | null;
  country: string | null;
  location?: string | null;
  city?: string | null;
  region?: string | null;
  bio?: string | null;
  topics?: string | string[] | null;
  email: string | null;
  ig_handle?: string | null;
  ig_followers?: number | null;
  youtube_url?: string | null;
  reason?: string;
  score?: number;
};

// ---------- Supabase search ----------

type AdminClient = ReturnType<typeof createClient<any>>;

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

function stringifyTopics(value: unknown): string | null {
  if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean).join(" ") || null;
  if (typeof value === "string") return value.trim() || null;
  if (value == null) return null;
  return String(value);
}

function journalistRow(r: Record<string, unknown>): Row {
  const bio = (r.bio as string) ?? null;
  return {
    source: "database" as const,
    source_id: r.id as number,
    source_table: "journalist" as const,
    name: (r.name as string) ?? null,
    outlet: (r.outlet as string) ?? null,
    title: (r.titles as string) ?? null,
    category: (r.category as string) ?? null,
    country: (r.country as string) ?? null,
    location: (r.location as string) ?? null,
    city: (r.city as string) ?? null,
    region: (r.region as string) ?? null,
    bio,
    topics: stringifyTopics(r.topics),
    email: (r.email as string) ?? null,
    reason: bio ?? undefined,
  };
}

function creatorRow(r: Record<string, unknown>): Row {
  const bio = (r.bio as string) ?? null;
  return {
    source: "database" as const,
    source_id: r.id as number,
    source_table: "creators" as const,
    name: (r.name as string) ?? null,
    outlet: (r.type as string) ?? null,
    title: null,
    category: (r.category as string) ?? null,
    country: (r.country as string) ?? null,
    location: (r.location as string) ?? null,
    city: (r.city as string) ?? null,
    region: (r.region as string) ?? null,
    bio,
    topics: stringifyTopics(r.topics),
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

function missingFieldFromError(error: unknown, fields: string[]): string | null {
  const msg = String((error as { message?: string })?.message ?? error ?? "").toLowerCase();
  return fields.find((field) => missingColumn(msg, field)) ?? null;
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
    const missingField = missingFieldFromError(error, currentFields);
    if (missingField) {
      currentFields = currentFields.filter((field) => field !== missingField);
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
    const missingField = missingFieldFromError(error, currentFields);
    if (missingField) {
      currentFields = currentFields.filter((field) => field !== missingField);
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
  const fields = ["name", "email", "outlet", "titles", "topics", "country", "location", "city", "region", "category", "xhandle", "bio"];

  const primary = await runJournalistQuery(
    admin,
    primaryTerms.length ? primaryTerms : allTerms,
    fields,
    limit,
  );
  const secondary = primaryTerms.join("|") === allTerms.join("|")
    ? []
    : await runJournalistQuery(admin, allTerms, fields, limit);

  // No silent broad fallback — strict-filters-004 requires the table to be filtered, not flooded with random rows.
  return dedupe([...primary, ...secondary]);
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
  const fields = ["name", "category", "topics", "country", "location", "city", "region", "email", "bio", "ig_handle", "youtube_url", "type"];

  const primary = await runCreatorQuery(
    admin,
    primaryTerms.length ? primaryTerms : allTerms,
    fields,
    limit,
  );
  const secondary = primaryTerms.join("|") === allTerms.join("|")
    ? []
    : await runCreatorQuery(admin, allTerms, fields, limit);

  return dedupe([...primary, ...secondary]);
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
  const topic = intent.topics[0] ? cleanTopicForQuery(intent) : "";
  const loc = intent.countryCanonical ?? "";
  const outlet = intent.outlets[0] ?? "";
  const platform = intent.platforms[0] ?? "";
  const followers = intent.minFollowers
    ? `${intent.minFollowers >= 1_000_000 ? `${intent.minFollowers / 1_000_000}m` : `${Math.round(intent.minFollowers / 1000)}k`} followers`
    : "";
  const wantJ = intent.kind === "journalists" || intent.kind === "both";
  const wantC = intent.kind === "creators" || intent.kind === "both";
  const queries: string[] = [];

  // Strict: every query must include location if user asked for one.
  if (wantJ) {
    const role = "journalist";
    const parts = [topic, role, loc, outlet].filter(Boolean).join(" ").trim();
    if (parts) queries.push(parts);
    if (topic && loc) queries.push(`${topic} reporter ${loc}`.trim());
    if (outlet && loc) queries.push(`${topic} ${outlet} ${loc}`.trim());
  }
  if (wantC) {
    const parts = [topic, "creator", loc, platform, followers].filter(Boolean).join(" ").trim();
    if (parts) queries.push(parts);
    if (topic && loc) queries.push(`${topic} influencer ${loc} ${followers}`.trim().replace(/\s+/g, " "));
  }
  if (!queries.length) queries.push(intent.raw.trim());
  return [...new Set(queries.filter(Boolean))].slice(0, 6);
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
      const webText = (it.highlights?.[0] || it.text?.slice(0, 180) || `Matched on the open web — query: "${reasons[qi]}"`).trim();
      rows.push({
        source: "exa",
        source_table: intent.kind === "creators" ? "creators" : "journalist",
        source_url: url,
        name: nameGuess,
        outlet: host || null,
        title: titleStr || null,
        category: intent.topics[0] ?? null,
        country: null,
        bio: webText,
        topics: intent.topics,
        email,
        reason: webText,
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

const EXCLUDED_TOPIC_TERMS = ["cars", "automotive", "auto", "tv", "television", "sports", "sport", "espn", "entertainment", "movies", "music", "gaming", "crypto", "cryptocurrency", "blockchain", "web3"];
const STRICT_FINANCE_TERMS = ["finance", "financial", "business", "markets", "economy", "banking", "fintech", "investing", "stocks"];
const STRICT_FOOD_TERMS = ["food", "restaurant", "restaurants", "dining", "chef", "cooking", "f&b", "hospitality", "beverage", "drink", "grocery", "agriculture"];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripContactNoise(value: unknown): string {
  return String(value ?? "")
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, " ")
    .replace(/https?:\/\/\S+|www\.\S+/gi, " ");
}

function matchesAnyTerm(hay: string, terms: string[]): boolean {
  return terms.some((term) => {
    const cleaned = normalizeSearchText(term);
    if (!cleaned) return false;
    return new RegExp(`(?:^|[^a-z0-9])${escapeRegex(cleaned)}(?:$|[^a-z0-9])`, "i").test(normalizeSearchText(hay));
  });
}

export function strictFilterDiagnostics(rows: Row[], intent: Intent) {
  const fieldHay = (values: unknown[]) => values.map(normalizeSearchText).filter(Boolean).join(" | ");
  const locationFieldHay = (values: unknown[]) => values.map(stripContactNoise).map(normalizeSearchText).filter(Boolean).join(" | ");
  const rowTopicsText = (r: Row) => Array.isArray(r.topics) ? r.topics.join(" ") : (r.topics ?? "");
  const locationHayOf = (r: Row) => locationFieldHay([r.country, r.location, r.city, r.region, r.bio]);
  const topicHayOf = (r: Row) => fieldHay([r.category, r.title, r.outlet, r.bio, rowTopicsText(r)]);
  const categoryTopicHayOf = (r: Row) => fieldHay([r.category, rowTopicsText(r)]);
  const topicTerms = (intent.topic === "food" || intent.topics.includes("food")) ? STRICT_FOOD_TERMS : intent.topics;
  const matchKind = (r: Row) => intent.kind === "journalists" ? r.source_table === "journalist" : intent.kind === "creators" ? r.source_table === "creators" : true;
  const matchLocation = (r: Row) => !intent.locationTerms.length || matchesAnyTerm(locationHayOf(r), intent.locationTerms);
  const matchTopic = (r: Row) => {
    if (!intent.topics.length) return true;
    if (intent.topic === "finance" || intent.topics.includes("finance")) {
      if (matchesAnyTerm(categoryTopicHayOf(r), EXCLUDED_TOPIC_TERMS)) return false;
      return matchesAnyTerm(topicHayOf(r), STRICT_FINANCE_TERMS);
    }
    return matchesAnyTerm(topicHayOf(r), topicTerms);
  };
  const hasSubstringFalsePositive = (r: Row) => intent.locationTerms.some((term) => {
    const cleaned = normalizeSearchText(term);
    return cleaned && locationHayOf(r).includes(cleaned) && !matchesAnyTerm(locationHayOf(r), [cleaned]);
  });
  const afterKind = rows.filter(matchKind);
  const afterLocation = afterKind.filter(matchLocation);
  const afterTopic = afterLocation.filter(matchTopic);
  const rejectionReason = (row: Row): string | null => {
    if (!matchKind(row)) return "kind_mismatch";
    if (!matchLocation(row)) return hasSubstringFalsePositive(row) ? "substring_false_positive" : "location_mismatch";
    if (!matchTopic(row)) return "topic_mismatch";
    return null;
  };
  return { topicTerms, afterKind, afterLocation, afterTopic, rejectionReason };
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

async function hybridSearch(
  admin: AdminClient,
  q: string,
  plan: string | null,
  limitOverride: number | null = null,
  offset = 0,
): Promise<{ rows: Row[]; debug: Record<string, unknown>; intent: Intent; cap: number; pagination: { limit: number; offset: number; total_estimated: number; has_more: boolean }; sources: { database: number; web: number } }> {
  const intent = parseIntent(q);
  const planLimit = capForPlan(plan);
  const exaLimit = 50;
  const userExplicit = intent.count > 0;
  // If user did not explicitly request a count, use the plan's database cap as target.
  // If they did, honor it but still cap to plan.
  if (!userExplicit) intent.count = planLimit;
  else intent.count = Math.min(intent.count, planLimit);
  const target = intent.count;

  const maxTotal = target + exaLimit;
  const requestedLimit = limitOverride && limitOverride > 0 ? Math.min(Math.max(limitOverride, target), maxTotal) : maxTotal;
  const safeOffset = Math.max(0, offset);

  const debug: Record<string, unknown> = {
    version: CHAT_VERSION,
    original: q,
    intent: { kind: intent.kind, topic: intent.topic, topics: intent.topics, location: intent.location, countries: intent.countries, countryCanonical: intent.countryCanonical, locationTerms: intent.locationTerms, outlets: intent.outlets, freeTerms: intent.freeTerms, count: intent.count, emailRequired: intent.emailRequired },
    plan,
    cap: planLimit,
    target,
    plan_limit: planLimit,
    exa_limit: exaLimit,
    maxTotal,
    requestedLimit,
    offset: safeOffset,
  };

  // ----- Fetch DB rows per kind -----
  const wantJ = intent.kind === "journalists" || intent.kind === "both";
  const wantC = intent.kind === "creators" || intent.kind === "both";

  const [jRows, cRows] = await Promise.all([
    wantJ ? searchJournalistsDb(admin, intent) : Promise.resolve([] as Row[]),
    wantC ? searchCreatorsDb(admin, intent) : Promise.resolve([] as Row[]),
  ]);
  for (const r of jRows) r.source_table = "journalist";
  for (const r of cRows) r.source_table = "creators";

  // ----- Hard filters (strict) -----
  const filterRules = strictFilterDiagnostics([], intent);
  const matchKind = (r: Row) => !filterRules.rejectionReason(r) || filterRules.rejectionReason(r) !== "kind_mismatch";
  const matchLocation = (r: Row) => {
    const reason = filterRules.rejectionReason(r);
    return reason !== "location_mismatch" && reason !== "substring_false_positive";
  };
  const matchOutlet = (r: Row) => {
    if (!intent.outlets.length) return true;
    const hay = normalizeSearchText([r.outlet, r.source_url].filter(Boolean).join(" | "));
    return intent.outlets.some((o) => matchesAnyTerm(hay, [o]));
  };
  const matchEmail = (r: Row) => {
    if (!intent.emailRequired) return true;
    const e = (r.email ?? "").trim().toLowerCase();
    return !!e && !["null", "undefined", "-", "n/a"].includes(e);
  };
  const matchPlatform = (r: Row) => {
    if (!intent.platforms.length) return true;
    return intent.platforms.some((p) => {
      if (p === "youtube") return !!r.youtube_url;
      if (p === "instagram") return !!r.ig_handle;
      const hay = normalizeSearchText([r.category, r.title, r.outlet, r.bio].filter(Boolean).join(" | "));
      return matchesAnyTerm(hay, [p]);
    });
  };
  const matchFollowers = (r: Row) => {
    if (intent.minFollowers == null) return true;
    return (r.ig_followers ?? 0) >= intent.minFollowers;
  };
  const matchTopic = (r: Row) => filterRules.rejectionReason(r) !== "topic_mismatch";
  const matchSupplementalFilters = (r: Row) =>
    matchOutlet(r) && matchEmail(r) && matchPlatform(r) && matchFollowers(r);

  const dbRawCandidates = dedupe([...jRows, ...cRows]);
  const dbAfterKind = dbRawCandidates.filter(matchKind);
  const dbAfterLocation = dbAfterKind.filter(matchLocation);
  const dbAfterTopic = dbAfterLocation.filter(matchTopic).filter(matchSupplementalFilters);
  const strictDbCount = dbAfterTopic.length;

  // ----- Run Exa in parallel with strict DB filter (do not skip on high db count) -----
  let exaRows: Row[] = [];
  debug.search_order = "raw_candidates_then_strict_filters_then_rank";
  try {
    exaRows = await searchExa(intent, exaLimit);
  } catch (error) {
    console.warn("[chat.exa_failed_continuing_with_db]", error instanceof Error ? error.message : String(error));
    debug.exa_error = error instanceof Error ? error.message : String(error);
  }
  debug.exa_skipped_reason = null;
  debug.strict_db_count_pre_exa = strictDbCount;

  const rawCandidates = dedupe([...dbRawCandidates, ...exaRows]);
  const afterKindFilterRows = rawCandidates.filter(matchKind);
  const afterLocationFilterRows = afterKindFilterRows.filter(matchLocation);
  const afterTopicFilterRows = afterLocationFilterRows.filter(matchTopic);
  const strictRows = afterTopicFilterRows.filter(matchSupplementalFilters);

  const rejectionReason = (row: Row): string | null => {
    const strictReason = filterRules.rejectionReason(row);
    if (strictReason) return strictReason;
    if (!matchOutlet(row)) return "outlet";
    if (!matchEmail(row)) return "email";
    if (!matchPlatform(row)) return "platform";
    if (!matchFollowers(row)) return "followers";
    return null;
  };

  debug.db_count = jRows.length + cRows.length;
  debug.exa_count = exaRows.length;
  debug.web_count = exaRows.length;

  const fallbackUsed = false;
  debug.parsed_intent = intent;
  debug.parsedIntent = intent;
  debug.strictMode = true;
  debug.hardFiltersApplied = true;
  debug.kind_used = intent.kind;
  debug.kindFilterApplied = intent.kind !== "both";
  debug.kind_filter_applied = intent.kind !== "both";
  debug.locationFilterApplied = intent.locationTerms.length > 0;
  debug.location_filter_applied = intent.locationTerms.length > 0;
  debug.topicFilterApplied = intent.topics.length > 0;
  debug.topic_filter_applied = intent.topics.length > 0;
  debug.locationTerms = intent.locationTerms;
  debug.topicTerms = filterRules.topicTerms;
  debug.email_filter_applied = intent.emailRequired;
  debug.platform_filter_applied = intent.platforms.length > 0;
  debug.follower_filter_applied = intent.minFollowers != null;
  debug.rawCandidateCount = rawCandidates.length;
  debug.afterKindFilter = afterKindFilterRows.length;
  debug.afterLocationFilter = afterLocationFilterRows.length;
  debug.afterTopicFilter = afterTopicFilterRows.length;
  debug.strictCount = strictRows.length;
  debug.strict_location_count = afterLocationFilterRows.length;
  debug.strict_topic_count = afterTopicFilterRows.length;
  debug.fallback_used = fallbackUsed;
  debug.fallbackUsed = fallbackUsed;
  debug.journalists_count = strictRows.filter((r) => r.source_table === "journalist").length;
  debug.creators_count = strictRows.filter((r) => r.source_table === "creators").length;
  debug.rejectedExamples = rawCandidates
    .map((row) => ({ row, reason: rejectionReason(row) }))
    .filter((item) => !!item.reason)
    .slice(0, 20)
    .map(({ row, reason }) => ({
      name: row.name,
      country: row.country,
      category: row.category,
      reason,
    }));

  const rankedStrictRows = rankRows(strictRows, intent);
  const dbRanked = rankedStrictRows.filter((r) => r.source === "database").slice(0, target);
  const exaRanked = rankedStrictRows.filter((r) => r.source === "exa").slice(0, exaLimit);

  // Normalize emails before merge
  const cleanEmail = (e: string | null | undefined): string | null => {
    if (!e) return null;
    const v = String(e).trim().toLowerCase();
    if (!v || ["null", "undefined", "-", "n/a"].includes(v)) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
    return v;
  };
  for (const r of [...dbRanked, ...exaRanked]) r.email = cleanEmail(r.email);

  let combined = dedupe([...dbRanked, ...exaRanked]);
  if (intent.emailRequired) combined = combined.filter((r) => !!r.email);
  debug.deduped_count = combined.length;

  const dbEmailsFound = dbRanked.filter((r) => !!r.email).length;
  const exaEmailsFound = exaRanked.filter((r) => !!r.email).length;
  debug.db_emails_found = dbEmailsFound;
  debug.exa_emails_found = exaEmailsFound;
  debug.enriched_emails_found = 0;

  const ranked = rankRows(combined, intent);
  const paged = ranked.slice(safeOffset, safeOffset + requestedLimit);
  const dbReturned = paged.filter((r) => r.source === "database").length;
  const webReturned = paged.filter((r) => r.source === "exa").length;
  const totalEstimated = ranked.length;
  const hasMore = (safeOffset + requestedLimit) < totalEstimated;

  debug.db_returned = dbReturned;
  debug.web_returned = webReturned;
  debug.final_count = paged.length;
  debug.finalCount = paged.length;
  debug.has_more = hasMore;
  if ((intent.topic === "finance" || intent.topics.includes("finance")) && intent.countryCanonical === "Germany" && intent.kind === "journalists") {
    debug.response_message = paged.length === 0
      ? "No exact finance journalists in Germany found."
      : `Found ${paged.length} finance journalists in Germany.`;
  }
  if (paged.length === 0) {
    if ((intent.topic === "food" || intent.topics.includes("food")) && intent.countryCanonical === "India" && intent.kind === "journalists") {
      debug.empty_state_message = "No exact food journalists in India found.";
    } else if ((intent.topic === "finance" || intent.topics.includes("finance")) && intent.countryCanonical === "Germany" && intent.kind === "journalists") {
      debug.empty_state_message = "No exact finance journalists in Germany found.";
    } else {
      const filterParts: string[] = [];
      if (intent.locationTerms.length) filterParts.push(intent.countryCanonical || intent.locationTerms[0]);
      if (intent.topics.length) filterParts.push(intent.topics[0]);
      if (intent.outlets.length) filterParts.push(intent.outlets[0]);
      if (intent.emailRequired) filterParts.push("with email");
      debug.empty_state_message = filterParts.length
        ? `No exact matches found for ${filterParts.join(", ")}. Try removing location or topic.`
        : `No exact matches found. Try broadening your query.`;
    }
  }

  try {
    if (intent.kind === "both") {
      const jPaged = paged.filter((r) => r.source_table === "journalist" || (r.source === "exa" && wantJ));
      const cPaged = paged.filter((r) => r.source_table === "creators");
      const persistedJ = await persistWebRows(admin, "journalists", jPaged);
      const persistedC = await persistWebRows(admin, "creators", cPaged);
      debug.persisted = { journalists: persistedJ, creators: persistedC };
    } else {
      debug.persisted = await persistWebRows(admin, intent.kind, paged);
    }
  } catch (error) {
    console.log("[chat.persist.error]", error instanceof Error ? error.message : String(error));
    debug.persisted = { considered: 0, saved: 0, error: error instanceof Error ? error.message : String(error) };
  }

  console.log("[chat.hybrid]", JSON.stringify(debug));
  return {
    rows: paged,
    debug,
    intent,
    cap: planLimit,
    pagination: { limit: requestedLimit, offset: safeOffset, total_estimated: totalEstimated, has_more: hasMore },
    sources: { database: dbReturned, web: webReturned },
  };
}

async function loadUsageSummary(
  admin: AdminClient,
  userId: string,
  userClient?: AdminClient,
): Promise<UsageSummary & { ledger_purchased: number; profile_credits: number; rpc_remaining: number | null; rpc_credits: number | null }> {
  const period = new Date().toISOString().slice(0, 7);
  const [profileResult, usageResult, topupResult, summaryResult] = await Promise.all([
    admin.from("profiles").select("chat_credits, sub_active, plan_identifier").eq("id", userId).maybeSingle(),
    admin.from("chat_usage").select("tokens_used").eq("user_id", userId).eq("period_ym", period).maybeSingle(),
    admin.from("topup_transactions").select("tokens").eq("user_id", userId),
    userClient ? userClient.rpc("chat_usage_summary") : Promise.resolve({ data: null, error: null }),
  ]);

  if (profileResult.error) throw new Error(`profile_usage_failed: ${profileResult.error.message}`);
  if (usageResult.error) throw new Error(`chat_usage_failed: ${usageResult.error.message}`);
  if (topupResult.error) console.warn("[chat.topup_lookup_failed]", topupResult.error.message);
  if (summaryResult.error) console.warn("[chat.usage_summary_rpc_failed]", summaryResult.error.message);

  const profile = profileResult.data as { chat_credits?: number | string | null; sub_active?: boolean | null; plan_identifier?: string | null } | null;
  const plan = String(profile?.plan_identifier ?? "").toLowerCase();
  const subActive = profile?.sub_active === true;
  const allowance = subActive
    ? (["growth", "both", "media-pro", "pro", "enterprise"].includes(plan) ? 1_000_000 : 200_000)
    : 20_000;
  const used = finiteNumber((usageResult.data as { tokens_used?: number | string } | null)?.tokens_used ?? 0);
  const profileCredits = finiteNumber(profile?.chat_credits ?? 0);

  // Ledger fallback: if profiles.chat_credits is missing/zero but the user actually
  // paid for top-ups, trust the ledger so we don't block paying users.
  const ledgerPurchased = Array.isArray(topupResult.data)
    ? (topupResult.data as Array<{ tokens?: number | string }>).reduce((sum, r) => sum + finiteNumber(r.tokens ?? 0), 0)
    : 0;
  const overflowUsed = Math.max(used - allowance, 0);
  const ledgerCredits = Math.max(ledgerPurchased - overflowUsed, 0);
  const rpcRow = !summaryResult.error && Array.isArray(summaryResult.data) && summaryResult.data[0]
    ? summaryResult.data[0] as Record<string, unknown>
    : null;
  const rpcRemaining = rpcRow ? finiteNumber(rpcRow.remaining ?? 0) : null;
  const rpcCredits = rpcRow ? finiteNumber(rpcRow.credits ?? 0) : null;
  const credits = Math.max(profileCredits, ledgerCredits, rpcCredits ?? 0);

  const monthlyRemaining = Math.max(allowance - used, 0);
  const remaining = Math.max(monthlyRemaining + Math.max(credits, 0), rpcRemaining ?? 0);

  return {
    allowance, used, credits, remaining,
    period_ym: period, sub_active: subActive, plan_identifier: profile?.plan_identifier ?? null,
    ledger_purchased: ledgerPurchased, profile_credits: profileCredits,
    rpc_remaining: rpcRemaining, rpc_credits: rpcCredits,
  };
}

function latestUserQuery(messages: unknown): string {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i] as { role?: unknown; content?: unknown };
    if (msg?.role === "user" && typeof msg.content === "string" && msg.content.trim()) return msg.content.trim();
  }
  return "";
}

async function recordUsage(admin: AdminClient, userId: string, tokens: number, fallbackRemaining: number): Promise<number> {
  try {
    const { data: rec } = await admin.rpc("chat_usage_record", { _user: userId, _tokens: tokens });
    if (typeof rec === "number") return rec;
  } catch (e) {
    console.error("chat_usage_record failed", e);
  }
  return fallbackRemaining;
}

async function databaseOnlyResponse(
  admin: AdminClient,
  userId: string,
  q: string,
  plan: string | null,
  summary: UsageSummary,
  reason: string,
  extraDebug: Record<string, unknown> = {},
  limit: number | null = null,
  offset = 0,
) {
  const result = await hybridSearch(admin, q || "journalist", plan, limit, offset);
  const rows = result.rows;
  const tokens = Math.max(1, Math.ceil((q || "").length / 4));
  const remainingAfter = await recordUsage(admin, userId, tokens, Math.max(summary.remaining - tokens, 0));
  const kind = result.intent.kind;

  return new Response(
    JSON.stringify({
      warning: summary.beta_credit_bypass ? "Credit check bypassed during beta" : undefined,
      content: typeof result.debug.response_message === "string"
        ? result.debug.response_message
        : rows.length === 0
          ? (typeof result.debug.empty_state_message === "string" ? result.debug.empty_state_message : "No exact matches found. Try removing location or topic.")
          : `Found ${rows.length} relevant results: ${result.sources.database} from your database and ${result.sources.web} from the web.`,
      results: {
        kind,
        rows,
        query: q,
        debug: { ...result.debug, fallback_reason: reason, database_only: false, ...extraDebug },
        intent: result.intent,
      },
      pagination: result.pagination,
      sources: result.sources,
      usage: {
        allowance: summary.allowance,
        used: Math.min(summary.allowance, summary.used + tokens),
        credits: summary.credits,
        period_ym: summary.period_ym,
        remaining: remainingAfter,
        tokens_this_request: tokens,
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

// ---------- Handler ----------

if (Deno.env.get("DENO_TESTING") !== "true") Deno.serve(async (req) => {
  console.log("CHAT_FN_REQUEST_START", {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.get("Authorization"),
  });
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
    console.log("CHAT_FN_AUTH", { userId: user?.id, email: user?.email });
    if (!user)
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: profile } = await admin.from("profiles").select("plan_identifier,sub_active").eq("id", user.id).maybeSingle();
    const plan = profile?.sub_active ? (profile?.plan_identifier as string | null) : null;

    const body = await req.json();
    const { messages, model } = body;
    const reqLimit = Number.isFinite(Number(body?.limit)) ? Math.max(1, Math.floor(Number(body.limit))) : null;
    const reqOffset = Number.isFinite(Number(body?.offset)) ? Math.max(0, Math.floor(Number(body.offset))) : 0;
    if (!Array.isArray(messages))
      return new Response(JSON.stringify({ error: "messages required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userQuery = latestUserQuery(messages);

    let summary: Awaited<ReturnType<typeof loadUsageSummary>>;
    try {
      summary = await loadUsageSummary(admin, user.id, userClient);
    } catch (error) {
      console.warn("[chat.usage_fallback_beta_allowance]", error instanceof Error ? error.message : String(error));
      summary = {
        allowance: 20_000,
        used: 0,
        remaining: 20_000,
        credits: 0,
        period_ym: new Date().toISOString().slice(0, 7),
        sub_active: false,
        plan_identifier: null,
        beta_credit_bypass: true,
        ledger_purchased: 0,
        profile_credits: 0,
        rpc_remaining: null,
        rpc_credits: null,
      };
    }
    const allowance = summary.allowance;
    const usedSoFar = summary.used;
    const creditsRemaining = allowance - usedSoFar;
    const remaining = Math.max(creditsRemaining, 0);
    const creditDebug = {
      user_id: user.id,
      plan,
      monthly_allowance: allowance,
      credits_used: usedSoFar,
      credits_remaining: creditsRemaining,
      profile_credits: summary.profile_credits,
      ledger_purchased: summary.ledger_purchased,
      rpc_remaining: summary.rpc_remaining,
      rpc_credits: summary.rpc_credits,
      sub_active: summary.sub_active,
    };
    const monthlyAllowance = allowance;
    const monthlyUsed = usedSoFar;
    const monthlyRemaining = monthlyAllowance - monthlyUsed;
    const topupCredits = Math.max(
      Number(summary.credits ?? 0),
      Number(summary.profile_credits ?? 0),
      Number(summary.ledger_purchased ?? 0),
    );
    const totalAvailable =
      Math.max(0, monthlyRemaining || 0) +
      Math.max(0, topupCredits || 0);

    console.log("CREDIT_VALUES", {
      monthlyAllowance,
      monthlyUsed,
      monthlyRemaining,
      topupCredits,
      totalAvailable,
    });
    console.log("[chat.credit_check]", creditDebug);

    if (totalAvailable <= 0) {
      return new Response(
        JSON.stringify({
          error: "No chat credits remaining",
          debug: { monthlyRemaining, topupCredits, totalAvailable },
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    summary.remaining = remaining;

    // Self-heal: if ledger has more credits than profile column, sync it.
    if (summary.ledger_purchased > summary.profile_credits && summary.credits > summary.profile_credits) {
      try {
        await admin.from("profiles").update({ chat_credits: summary.credits }).eq("id", user.id);
      } catch (e) { console.warn("[chat.profile_credit_sync_failed]", e); }
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.warn("[chat.provider_fallback] missing_openai_key");
      return databaseOnlyResponse(admin, user.id, userQuery, plan, summary, "missing_openai_key", {}, reqLimit, reqOffset);
    }

    const convo = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    let lastKind: Intent["kind"] | null = null;
    let lastRows: Row[] = [];
    let lastQuery = "";
    let lastDebug: Record<string, unknown> = {};
    let lastIntent: Intent | null = null;
    let lastPagination: { limit: number; offset: number; total_estimated: number; has_more: boolean } | null = null;
    let lastSources: { database: number; web: number } = { database: 0, web: 0 };
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
        return databaseOnlyResponse(admin, user.id, userQuery, plan, summary, "model_provider_error", {
          provider_status: r.status,
          provider_error: text.slice(0, 500),
        }, reqLimit, reqOffset);
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
          const q = userQuery || String(parsed.q ?? "");
          const result = await hybridSearch(admin, q, plan, reqLimit, reqOffset);
          lastKind = result.intent.kind;
          lastRows = result.rows;
          lastQuery = q;
          lastDebug = result.debug;
          lastIntent = result.intent;
          lastPagination = result.pagination;
          lastSources = result.sources;
          convo.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              count: result.rows.length,
              requested: result.intent.count,
              from_database: result.sources.database,
              from_web: result.sources.web,
              kind: result.intent.kind,
              has_more: result.pagination.has_more,
            }),
          });
        }
        continue;
      }

      let remainingAfter = Math.max(remaining - totalTokens, 0);
      try {
        remainingAfter = await recordUsage(admin, user.id, totalTokens, remainingAfter);
      } catch (_) { /* handled in recordUsage */ }

      const responseContent = typeof lastDebug.response_message === "string"
        ? lastDebug.response_message
        : lastRows.length === 0 && typeof lastDebug.empty_state_message === "string"
          ? lastDebug.empty_state_message
          : (msg.content ?? "");

      return new Response(
        JSON.stringify({
          warning: summary.beta_credit_bypass ? "Credit check bypassed during beta" : undefined,
          content: responseContent,
          results: lastKind ? { kind: lastKind, rows: lastRows, query: lastQuery, debug: lastDebug, intent: lastIntent } : null,
          pagination: lastPagination,
          sources: lastSources,
          usage: { allowance, used: Math.min(allowance, usedSoFar + totalTokens), credits: summary.credits, period_ym: summary.period_ym, remaining: remainingAfter, tokens_this_request: totalTokens },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const finalRemaining = await recordUsage(admin, user.id, totalTokens, Math.max(remaining - totalTokens, 0));
    return new Response(
      JSON.stringify({
        warning: summary.beta_credit_bypass ? "Credit check bypassed during beta" : undefined,
        content: typeof lastDebug.response_message === "string" ? lastDebug.response_message : "(no response)",
        results: lastKind ? { kind: lastKind, rows: lastRows, query: lastQuery, debug: lastDebug, intent: lastIntent } : null,
        pagination: lastPagination,
        sources: lastSources,
        usage: { allowance, used: Math.min(allowance, usedSoFar + totalTokens), credits: summary.credits, period_ym: summary.period_ym, remaining: finalRemaining, tokens_this_request: totalTokens },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
