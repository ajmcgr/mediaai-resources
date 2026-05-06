import { parseSearchIntent, strictFilterDiagnostics, type Row } from "./index.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function row(overrides: Partial<Row>): Row {
  return {
    source: "database",
    source_table: "journalist",
    name: "Test Person",
    outlet: "Test Outlet",
    title: "Reporter",
    category: "food",
    country: "India",
    email: null,
    ...overrides,
  };
}

Deno.test("food journalists in india rejects substring and off-topic rows", () => {
  const intent = parseSearchIntent("food journalists in india");
  const candidates = [
    row({ name: "Delhi Food Writer", country: "New Delhi, India", category: "Dining" }),
    row({ name: "Mumbai Chef Reporter", country: null, city: "Mumbai", category: "restaurants" }),
    row({ name: "Northwest Indiana Reporter", country: "Northwest Indiana", category: "food" }),
    row({ name: "ESPN Cars", outlet: "ESPN", country: "India", category: "cars", title: "Automotive reporter" }),
    row({ name: "Blank Business", country: "", location: "", city: "", region: "", bio: "", category: "business" }),
    row({ name: "IndiaSpend Email Only", country: "USA", email: "tips@indiaspend.com", category: "food" }),
    row({ name: "Travel Audio", country: "India", category: "travel", title: "Audio producer" }),
    row({ name: "Bio Confirmed", country: "", bio: "New Delhi based food and hospitality journalist", category: "hospitality" }),
  ];

  const result = strictFilterDiagnostics(candidates, intent);
  assert(intent.kind === "journalists", "journalists query must parse as journalist-only");
  assert(intent.topic === "food", "food query must parse food topic");
  assert(intent.countryCanonical === "India", "India query must parse canonical India");
  assert(result.afterTopic.length === 3, "only exact India-based food rows should survive");
  assert(result.afterTopic.every((r) => ["Delhi Food Writer", "Mumbai Chef Reporter", "Bio Confirmed"].includes(String(r.name))), "unexpected row survived food India filters");
  assert(result.rejectionReason(candidates[2]) === "substring_false_positive", "Indiana must be flagged as a substring false positive");
  assert(result.rejectionReason(candidates[3]) === "topic_mismatch", "ESPN cars must be rejected as topic mismatch");
  assert(result.rejectionReason(candidates[4]) === "location_mismatch", "blank location rows must be rejected");
  assert(result.rejectionReason(candidates[5]) === "location_mismatch", "email/domain alone must not satisfy India location");
  assert(result.rejectionReason(candidates[6]) === "topic_mismatch", "travel/audio/business rows must be rejected unless food-related");
});

Deno.test("finance journalists from germany rejects non-Germany and cars rows", () => {
  const intent = parseSearchIntent("finance journalists from germany");
  const candidates = [
    row({ name: "Frankfurt Markets Reporter", country: "Germany", city: "Frankfurt", category: "markets", title: "Finance journalist" }),
    row({ name: "USA Finance", country: "USA", category: "finance" }),
    row({ name: "India Finance", country: "India", category: "finance" }),
    row({ name: "Germany ESPN Cars", country: "Germany", outlet: "ESPN", category: "cars", title: "Automotive writer" }),
    row({ name: "Blank Location Finance", country: "", location: "", city: "", region: "", bio: "", category: "finance" }),
  ];

  const result = strictFilterDiagnostics(candidates, intent);
  assert(result.afterTopic.length === 1, "only Germany finance journalist should survive");
  assert(result.afterTopic[0].name === "Frankfurt Markets Reporter", "unexpected finance Germany row survived");
  assert(result.rejectionReason(candidates[1]) === "location_mismatch", "USA finance row must be rejected");
  assert(result.rejectionReason(candidates[2]) === "location_mismatch", "India finance row must be rejected");
  assert(result.rejectionReason(candidates[3]) === "topic_mismatch", "Germany ESPN cars row must be rejected");
  assert(result.rejectionReason(candidates[4]) === "location_mismatch", "blank location finance row must be rejected");
});