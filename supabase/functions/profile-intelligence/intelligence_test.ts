import {
  confidenceFromCoverage,
  hasEnoughEvidence,
  normalizeGeneratedIntelligence,
  sanitizeStringArray,
} from "./intelligence.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("profile intelligence requires attributable coverage", () => {
  assert(!hasEnoughEvidence([]), "empty coverage must not generate AI analysis");
  assert(!hasEnoughEvidence([{ id: "1", headline: "", canonical_url: "https://example.com" }]), "blank headline is insufficient");
  assert(hasEnoughEvidence([{ id: "1", headline: "Valid article", canonical_url: "https://example.com/a" }]), "valid article evidence should pass");
});

Deno.test("profile intelligence normalizes model output", () => {
  const normalized = normalizeGeneratedIntelligence({
    profile_summary: "  Covers enterprise AI and security.  ",
    primary_topics: ["AI", "Security", "AI"],
    pitch_guidance: {
      recommended_angle: "Tie the pitch to enterprise buyer risk.",
      evidence_to_include: ["customer proof", "credible numbers"],
      avoid: ["consumer-only angles"],
    },
    topic_trends: [{ topic: "AI security", direction: "rising", evidence: "Recent coverage mentions governance." }],
  });

  assert(normalized.profile_summary === "Covers enterprise AI and security.", "summary should be compacted");
  assert(normalized.primary_topics.length === 2, "duplicate topics should be removed");
  assert(normalized.pitch_guidance.evidence_to_include.length === 2, "pitch arrays should survive");
  assert(normalized.topic_trends[0].topic === "AI security", "topic trends should be structured");
});

Deno.test("profile intelligence confidence follows evidence depth", () => {
  assert(confidenceFromCoverage([{ id: "1", headline: "One", canonical_url: "https://example.com" }]) === "low", "single headline-only source is low confidence");
  assert(confidenceFromCoverage([{ id: "1", headline: "One", canonical_url: "https://example.com", summary: "A real summary" }]) === "medium", "summarized source raises confidence");
});

Deno.test("string arrays are compact, unique, and capped", () => {
  const result = sanitizeStringArray([" AI ", "AI", "Media relations", "", null, "Long ".repeat(80)], 3, 30);
  assert(result.length === 3, "array should be capped after sanitization");
  assert(result[0] === "AI", "items should be trimmed");
});
