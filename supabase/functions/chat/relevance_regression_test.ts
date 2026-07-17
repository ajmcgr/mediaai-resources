import { matchesSpecificSubjectCoverage, parseSearchIntent, strictFilterDiagnostics, type Row } from "./index.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function journalist(overrides: Partial<Row>): Row {
  return {
    source: "database",
    source_table: "journalist",
    name: "Test Reporter",
    outlet: "Test Desk",
    title: "Reporter",
    category: "technology",
    country: "United States",
    email: null,
    ...overrides,
  };
}

Deno.test("relevance benchmark: broad AI search keeps coverage and rejects unrelated rows", () => {
  const intent = parseSearchIntent("find AI journalists in San Francisco");
  const candidates = [
    journalist({ name: "AI Reporter", title: "Artificial intelligence reporter", category: "technology", city: "San Francisco", topics: "AI machine learning" }),
    journalist({ name: "San Francisco Food Writer", title: "Restaurant critic", category: "food", city: "San Francisco" }),
    journalist({ name: "AI Name Only", title: "Automotive reporter", category: "cars", city: "San Francisco" }),
    journalist({ name: "Remote AI", title: "AI reporter", category: "technology", country: "United Kingdom", city: "London" }),
  ];

  const result = strictFilterDiagnostics(candidates, intent);
  assert(result.afterSubject.length === 1, "only an AI reporter in San Francisco should remain");
  assert(result.afterSubject[0].name === "AI Reporter", "the valid AI match must survive");
});

Deno.test("relevance benchmark: specific company search rejects a matching name without coverage", () => {
  const intent = parseSearchIntent("journalists who cover OpenAI");
  const enrichment = {
    canonical_subject: "OpenAI",
    subject_kind: "org" as const,
    aliases: ["openai", "chatgpt"],
    expanded_topics: ["ai", "artificial intelligence", "technology"],
    related_entities: ["Sam Altman", "Microsoft"],
    strict_subject: true,
  };
  const candidates = [
    journalist({ name: "Openai Smith", title: "Automotive editor", category: "cars", topics: "EVs vehicles" }),
    journalist({ name: "AI Policy Reporter", title: "Reporter covering OpenAI and AI policy", category: "technology", topics: "OpenAI ChatGPT artificial intelligence" }),
  ];

  assert(!matchesSpecificSubjectCoverage(candidates[0], intent, enrichment), "a candidate name is not coverage evidence");
  assert(matchesSpecificSubjectCoverage(candidates[1], intent, enrichment), "OpenAI coverage must survive");
  assert(strictFilterDiagnostics(candidates, intent, enrichment).afterSubject.length === 1, "only the real OpenAI reporter should remain");
});
