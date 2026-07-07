// Semantic query enrichment + LLM rerank for hybrid search.
// Uses the Lovable AI Gateway (LOVABLE_API_KEY). Every call is best-effort:
// on any failure we return the input unchanged so ranking degrades to the
// existing keyword pipeline rather than erroring.

import type { Intent, Row } from "./index.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type EnrichmentOutput = {
  canonical_subject: string | null;
  subject_kind: "person" | "brand" | "org" | "team" | "topic" | "place" | "product" | "event" | "other" | null;
  aliases: string[];          // ways the subject is written; used to search coverage fields (bio/topics/titles/outlet)
  expanded_topics: string[];  // topical beats the subject falls under (e.g. Messi -> football, soccer, sports)
  related_entities: string[]; // adjacent entities often co-mentioned (Messi -> Inter Miami, Argentina, Barcelona, PSG)
  strict_subject: boolean;    // if true, candidates should ideally mention subject/aliases
};

const STOP_ALIASES = new Set([
  "leo","lee","the","and","or","for","list","find","give","show","me","some","a","an",
  "person","people","team","brand","topic","company","group","kind","name",
]);

function safeJsonParse<T>(s: string): T | null {
  try { return JSON.parse(s) as T; } catch { return null; }
}

function extractJsonBlock(text: string): string | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) return fence[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return null;
}

async function callGateway(body: unknown, timeoutMs = 8000): Promise<string | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[semantic.gateway_error]", res.status, text.slice(0, 200));
      return null;
    }
    const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return j?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.warn("[semantic.gateway_exception]", e instanceof Error ? e.message : String(e));
    return null;
  } finally {
    clearTimeout(to);
  }
}

function cleanTermList(arr: unknown, max: number): string[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    const s = String(v ?? "").trim().toLowerCase();
    if (!s || s.length < 2 || s.length > 60) continue;
    if (STOP_ALIASES.has(s)) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Use an LLM to understand the raw query: identify the actual subject
 * ("Leo Messi" -> Lionel Messi, a footballer), expand topical beats
 * (football, soccer, sports), and list adjacent entities (Inter Miami,
 * Argentina, Barcelona). Returns null if enrichment is unavailable.
 */
export async function enrichIntent(intent: Intent): Promise<EnrichmentOutput | null> {
  const raw = (intent.raw || "").trim();
  if (!raw) return null;

  const sys = `You resolve journalist-search queries to their true subject.
Given a raw query, output JSON with:
- canonical_subject: the real-world entity the user is asking about, in its canonical form ("Lionel Messi", "OpenAI", "Apple Inc.", "Scottish Football", "Premier League"). null if the query is only a generic topic/role (e.g. "tech journalists in the UK").
- subject_kind: one of person, brand, org, team, topic, place, product, event, other. null if none.
- aliases: how the subject is commonly written in article text (surname-only, common misspellings, native-language forms). NEVER a bare first name. Skip aliases shorter than 3 chars.
- expanded_topics: the topical beats a journalist covering this subject would list on their profile (e.g. Messi -> ["football","soccer","sports"], OpenAI -> ["ai","artificial intelligence","technology"], Apple -> ["apple","technology","consumer electronics"], Scottish football -> ["scottish football","football","soccer","spfl","celtic","rangers"]).
- related_entities: nearby entities/orgs commonly co-mentioned (Messi -> ["Inter Miami","Argentina","Barcelona","PSG","MLS"]).
- strict_subject: true if canonical_subject is a specific real-world entity that results must genuinely cover; false if it's a broad topic.

Return ONLY the JSON object. No prose, no code fences.`;

  const raw_intent_hint = {
    kind: intent.kind,
    topics_parsed: intent.topics,
    country: intent.countryCanonical,
  };

  const content = await callGateway({
    model: MODEL,
    temperature: 0.1,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `Query: ${JSON.stringify(raw)}\nParsed hints: ${JSON.stringify(raw_intent_hint)}` },
    ],
  }, 7000);

  if (!content) return null;
  const block = extractJsonBlock(content) ?? content;
  const parsed = safeJsonParse<Partial<EnrichmentOutput>>(block);
  if (!parsed || typeof parsed !== "object") return null;

  return {
    canonical_subject:
      typeof parsed.canonical_subject === "string" && parsed.canonical_subject.trim().length >= 2
        ? parsed.canonical_subject.trim()
        : null,
    subject_kind: (parsed.subject_kind as EnrichmentOutput["subject_kind"]) ?? null,
    aliases: cleanTermList(parsed.aliases, 8).filter((a) => a.length >= 3),
    expanded_topics: cleanTermList(parsed.expanded_topics, 10),
    related_entities: cleanTermList(parsed.related_entities, 10),
    strict_subject: parsed.strict_subject === true,
  };
}

/**
 * Fold enrichment into the intent so downstream keyword search uses the
 * expanded topic vocabulary instead of the raw literal terms.
 */
export function applyEnrichmentToIntent(intent: Intent, e: EnrichmentOutput): Intent {
  const mergedTopics = Array.from(new Set([
    ...intent.topics,
    ...e.expanded_topics,
  ]));

  // freeTerms drive DB phrase-matching on subject/topic fields.
  // Replace ambiguous first-name tokens with the strong aliases + related entities
  // when we have a real canonical subject; otherwise leave freeTerms alone.
  let mergedFree = intent.freeTerms;
  if (e.canonical_subject && (e.aliases.length || e.related_entities.length)) {
    const primary = e.aliases[0] ?? e.canonical_subject.toLowerCase();
    mergedFree = Array.from(new Set([
      primary,
      ...e.aliases.slice(1, 4),
    ]));
  }

  return {
    ...intent,
    topics: mergedTopics,
    freeTerms: mergedFree,
    // topic (singular) drives some downstream label logic; keep if present.
    topic: intent.topic ?? mergedTopics[0] ?? null,
  };
}

/**
 * LLM-based semantic rerank of the top candidate pool.
 * Scores each candidate 0-100 for how well their coverage matches the
 * canonical intent. We add that score into row.score so the existing
 * downstream ranker respects it (higher = better).
 *
 * Only reranks the top `poolSize` rows by current score. On any failure
 * the pool is returned unchanged.
 */
export async function semanticRerank(
  rows: Row[],
  intent: Intent,
  enrichment: EnrichmentOutput | null,
  poolSize = 80,
): Promise<{ rows: Row[]; ok: boolean }> {
  if (!rows.length) return { rows, ok: false };

  const sorted = [...rows].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const pool = sorted.slice(0, poolSize);
  const rest = sorted.slice(poolSize);

  const candidates = pool.map((r, i) => ({
    i,
    name: r.name ?? "",
    outlet: r.outlet ?? "",
    title: r.title ?? "",
    category: r.category ?? "",
    topics: Array.isArray(r.topics) ? r.topics.join(", ") : (r.topics ?? ""),
    bio: (r.bio ?? "").slice(0, 400),
  }));

  const subjectLine = enrichment?.canonical_subject
    ? `Canonical subject: ${enrichment.canonical_subject} (${enrichment.subject_kind ?? "unknown"})`
    : `No specific subject — generic topical search.`;
  const topicsLine = `Topics to cover: ${(enrichment?.expanded_topics ?? intent.topics).join(", ") || "(none)"}`;
  const relatedLine = enrichment?.related_entities?.length
    ? `Related entities often co-mentioned: ${enrichment.related_entities.join(", ")}`
    : "";
  const aliasLine = enrichment?.aliases?.length
    ? `Subject aliases in article text: ${enrichment.aliases.join(", ")}`
    : "";

  const sys = `You are a relevance judge for a journalist-contact database.
Score each candidate 0-100 for how likely they are to actually cover the requested subject/topic based on their bio, outlet, title, category, topic tags.

Hard rules:
- A candidate's NAME containing a query word (e.g. "Leo" in "Leo Schwartz") is NOT evidence of relevance. Score based on what they COVER, not what they are called.
- Coverage evidence lives in: bio, category, topics, title, outlet. Reward matches there.
- If nothing in coverage matches the subject or its topical area, score < 20.
- If bio/topics clearly cover the canonical subject or an obviously adjacent beat, score 70-95.
- Generic tech/entertainment reporters get low scores for specific-subject queries unless their beat aligns.

Return ONLY compact JSON: {"scores":[{"i":0,"s":83},{"i":1,"s":12},...]} covering every candidate index. No prose.`;

  const user = [
    `Original query: ${JSON.stringify(intent.raw)}`,
    subjectLine,
    aliasLine,
    topicsLine,
    relatedLine,
    `Candidates (${candidates.length}):`,
    JSON.stringify(candidates),
  ].filter(Boolean).join("\n");

  const content = await callGateway({
    model: MODEL,
    temperature: 0,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
  }, 15000);

  if (!content) return { rows: sorted, ok: false };
  const block = extractJsonBlock(content) ?? content;
  const parsed = safeJsonParse<{ scores?: Array<{ i: number; s: number }> }>(block);
  const scores = parsed?.scores;
  if (!Array.isArray(scores) || !scores.length) return { rows: sorted, ok: false };

  const map = new Map<number, number>();
  for (const s of scores) {
    if (typeof s?.i !== "number") continue;
    const v = Number(s.s);
    if (Number.isFinite(v)) map.set(s.i, Math.max(0, Math.min(100, v)));
  }

  // Blend: multiply-friendly boost. Semantic score dominates while keeping the
  // existing signal (email presence, source, country) as a secondary tie-break.
  const reranked: Row[] = pool.map((r, i) => {
    const sem = map.get(i);
    const base = r.score ?? 0;
    if (sem == null) return { ...r, score: base - 200 }; // unrated -> deprioritise
    // Semantic gets weight 10 -> up to +1000; base still contributes.
    return { ...r, score: sem * 10 + base * 0.25, semantic_score: sem };
  });

  reranked.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return { rows: [...reranked, ...rest], ok: true };
}
