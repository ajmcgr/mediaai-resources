export type MatchContact = {
  name?: string | null;
  outlet?: string | null;
  title?: string | null;
  titles?: string | null;
  category?: string | null;
  topics?: string | null;
  display_topic?: string | null;
  country?: string | null;
  bio?: string | null;
  type?: string | null;
  reason?: string | null;
};

export type MatchExplanation = {
  score?: number;
  confidence: "High" | "Medium" | "Low";
  reasons: string[];
  caution?: string;
};

const STOP_WORDS = new Set([
  "a", "about", "and", "are", "based", "can", "cover", "covering", "covers", "creator",
  "creators", "find", "for", "from", "give", "help", "in", "journalist", "journalists",
  "list", "looking", "me", "need", "of", "on", "please", "reporter", "reporters", "search",
  "show", "that", "the", "to", "want", "who", "with", "write", "writes", "writing",
]);

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function queryTerms(query?: string | null) {
  const normalized = normalize(query);
  if (!normalized) return [];

  const terms = normalized
    .split(" ")
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));

  const phrases: string[] = [];
  if (normalized.includes("san francisco")) phrases.push("san francisco");
  if (normalized.includes("new york")) phrases.push("new york");
  if (normalized.includes("los angeles")) phrases.push("los angeles");
  if (normalized.includes("ai")) phrases.push("ai", "artificial intelligence");
  if (normalized.includes("fintech")) phrases.push("fintech", "finance");

  return [...new Set([...phrases, ...terms])].slice(0, 10);
}

function fieldMatches(field: string, terms: string[]) {
  const haystack = normalize(field);
  return terms.filter((term) => {
    const cleaned = normalize(term);
    if (!cleaned) return false;
    return haystack.includes(cleaned);
  });
}

function pushReason(reasons: string[], label: string, value: string, terms: string[]) {
  const matches = fieldMatches(value, terms).slice(0, 3);
  if (!matches.length) return;
  reasons.push(`${label}: ${matches.join(", ")}`);
}

export function buildMatchExplanation(contact: MatchContact, query?: string | null, score?: number): MatchExplanation {
  const terms = queryTerms(query);
  const reasons: string[] = [];

  if (contact.reason) reasons.push(contact.reason);
  pushReason(reasons, "Topic match", [contact.display_topic, contact.topics, contact.category, contact.bio].filter(Boolean).join(" "), terms);
  pushReason(reasons, "Role match", [contact.title, contact.titles, contact.type].filter(Boolean).join(" "), terms);
  pushReason(reasons, "Publication match", contact.outlet ?? "", terms);
  pushReason(reasons, "Location match", contact.country ?? "", terms);

  const uniqueReasons = [...new Set(reasons.map((reason) => reason.trim()).filter(Boolean))].slice(0, 5);
  const numericScore = typeof score === "number" && Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : undefined;
  const confidence = numericScore != null
    ? numericScore >= 75 && uniqueReasons.length >= 2 ? "High" : numericScore >= 50 || uniqueReasons.length >= 1 ? "Medium" : "Low"
    : uniqueReasons.length >= 2 ? "Medium" : "Low";

  return {
    score: numericScore,
    confidence,
    reasons: uniqueReasons.length ? uniqueReasons : ["Opened from this search result. Review the profile and recent coverage before outreach."],
    caution: confidence === "Low" ? "Limited evidence is available for this match." : undefined,
  };
}
