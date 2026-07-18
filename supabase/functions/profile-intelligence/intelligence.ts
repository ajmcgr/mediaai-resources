export type ContactKind = "journalist" | "creator";

export type CoverageFact = {
  id: string;
  headline: string;
  canonical_url: string;
  outlet?: string | null;
  published_at?: string | null;
  summary?: string | null;
  topics?: string[] | null;
};

export type IntelligenceStatus = "ready" | "generating" | "insufficient_evidence" | "failed";
export type Confidence = "high" | "medium" | "low";

export type GeneratedIntelligence = {
  profile_summary?: string;
  primary_topics?: unknown;
  secondary_topics?: unknown;
  recent_coverage_focus?: unknown;
  typical_content_formats?: unknown;
  audience_signals?: unknown;
  writing_signals?: unknown;
  geographic_relevance?: unknown;
  publication_focus?: unknown;
  topic_trends?: unknown;
  pitch_guidance?: unknown;
};

const GENERATION_VERSION = "profile-intelligence-v1";
const MAX_LIST_ITEMS = 8;

function compact(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function sanitizeText(value: unknown, maxLength = 1200) {
  const text = compact(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;
}

export function sanitizeStringArray(value: unknown, maxItems = MAX_LIST_ITEMS, maxLength = 96) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => sanitizeText(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}

export function confidenceFromCoverage(coverage: CoverageFact[]): Confidence {
  const summarized = coverage.filter((item) => sanitizeText(item.summary, 160).length > 0).length;
  if (coverage.length >= 5 && summarized >= 3) return "high";
  if (coverage.length >= 2 || summarized >= 1) return "medium";
  return "low";
}

export function evidenceFromCoverage(coverage: CoverageFact[]) {
  return coverage.slice(0, 8).map((item) => ({
    source_type: "coverage",
    coverage_id: item.id,
    headline: sanitizeText(item.headline, 180),
    canonical_url: item.canonical_url,
    outlet: sanitizeText(item.outlet, 120) || null,
    published_at: item.published_at ?? null,
    has_summary: Boolean(sanitizeText(item.summary, 80)),
  }));
}

export function normalizeGeneratedIntelligence(input: GeneratedIntelligence) {
  const pitch = typeof input.pitch_guidance === "object" && input.pitch_guidance !== null
    ? input.pitch_guidance as Record<string, unknown>
    : {};

  return {
    profile_summary: sanitizeText(input.profile_summary, 900),
    primary_topics: sanitizeStringArray(input.primary_topics, 6),
    secondary_topics: sanitizeStringArray(input.secondary_topics, 8),
    recent_coverage_focus: sanitizeStringArray(input.recent_coverage_focus, 8),
    typical_content_formats: sanitizeStringArray(input.typical_content_formats, 6),
    audience_signals: sanitizeStringArray(input.audience_signals, 6),
    writing_signals: sanitizeStringArray(input.writing_signals, 6),
    geographic_relevance: sanitizeStringArray(input.geographic_relevance, 5),
    publication_focus: sanitizeStringArray(input.publication_focus, 6),
    topic_trends: Array.isArray(input.topic_trends)
      ? input.topic_trends.slice(0, 6).map((trend) => {
        const row = typeof trend === "object" && trend !== null ? trend as Record<string, unknown> : {};
        return {
          topic: sanitizeText(row.topic, 96),
          direction: sanitizeText(row.direction, 80),
          evidence: sanitizeText(row.evidence, 180),
        };
      }).filter((trend) => trend.topic)
      : [],
    pitch_guidance: {
      recommended_angle: sanitizeText(pitch.recommended_angle, 260),
      likely_interest: sanitizeText(pitch.likely_interest, 260),
      suggested_tone: sanitizeText(pitch.suggested_tone, 180),
      evidence_to_include: sanitizeStringArray(pitch.evidence_to_include, 5, 140),
      avoid: sanitizeStringArray(pitch.avoid, 5, 140),
    },
  };
}

export function hasEnoughEvidence(coverage: CoverageFact[]) {
  return coverage.some((item) => sanitizeText(item.headline, 20) && item.canonical_url?.startsWith("http"));
}

export function fingerprintSource(contactKind: ContactKind, contact: Record<string, unknown>, coverage: CoverageFact[]) {
  return JSON.stringify({
    generation_version: GENERATION_VERSION,
    contact_kind: contactKind,
    contact: {
      id: contact.id,
      name: contact.name,
      outlet: contact.outlet,
      titles: contact.titles,
      category: contact.category,
      topics: contact.topics,
      bio: contact.bio,
      country: contact.country,
      type: contact.type,
    },
    coverage: coverage.map((item) => ({
      id: item.id,
      headline: item.headline,
      canonical_url: item.canonical_url,
      outlet: item.outlet,
      published_at: item.published_at,
      summary: item.summary,
      topics: item.topics,
    })),
  });
}

export { GENERATION_VERSION };
