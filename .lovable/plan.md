# Fix /chat result limits, infinite scroll, and under-retrieval

This is a substantive refactor of the chat search pipeline (`supabase/functions/chat/index.ts`) and the Chat page (`src/pages/app/Chat.tsx`). Enrichment, credits, billing, and UI styling are explicitly out of scope.

## 1. Edge function: pagination contract

`supabase/functions/chat/index.ts`

- Accept new request fields: `limit` (default 100, max 100), `offset` (default 0).
- Resolve plan (free/starter/growth) using existing subscription helper.
- Compute `maxTotal`:
  - free → 50
  - starter → 100
  - growth → unlimited (Number.POSITIVE_INFINITY)
- Cap effective `limit` against `maxTotal - offset`.
- Build the full ranked candidate pool once per request (current pipeline already does this), then slice `[offset, offset + limit)`.
- Return:
  ```
  { results, pagination: { limit, offset, returned, has_more, next_offset }, debug }
  ```
- `has_more = (offset + returned) < totalRanked && (offset + returned) < maxTotal`.
- `next_offset = has_more ? offset + returned : null`.
- Preserve existing `reason`, error envelope, and `X-...` headers.

## 2. Edge function: looser, multi-tier retrieval

Goal: return many more relevant rows for queries like "tech journalists in the united states" without dropping rows that have blank country/city.

Pipeline (replace current strict gate):

1. **Parse intent** — reuse existing parser; expose `kind` (journalist|creator|any), `topic`, `locationCountry`, `locationCity`.
2. **Kind filter (hard)** — journalist queries query only `journalist`; creator queries only `creators`. Never mix.
3. **Topic filter (soft)** — semantic synonym groups (tech, finance, food, crypto, sports, entertainment, politics, health, travel, fashion). Match against `topic`, `category`, `titles/title`, `outlet`, `bio`, `tags`. Reject only rows whose populated category/topic clearly contradicts (e.g. "cars" for finance).
4. **Location matching (tiered, never rejecting on blanks)**:
   - Tier 1 explicit: word-boundary match on `country`, `city`, `location`, `region`, `bio`. Use `\b` regex; "india" must not match "indiana"/"indianapolis". Also handle aliases (US ↔ United States ↔ USA, UK ↔ United Kingdom ↔ Britain, etc.).
   - Tier 2 inferred: per-country outlet/domain map (US: TechCrunch, Wired, Bloomberg, CNBC, WSJ, NYTimes, Business Insider, The Verge, VentureBeat, Ars Technica, Forbes, Axios, Fast Company, CNET, ZDNet, Gizmodo, Mashable; Japan: Nikkei, CoinPost, bitcoinmagazine.jp, coindesk.jp; India: Indian Express, Times of India, Business Standard, NDTV, Moneycontrol; UK, Germany, France basic sets). Match outlet name OR publication domain.
   - Tier 3 augmentation: existing Exa path remains, used to top up when DB pool is thin.
   - Rows with blank location fields are NOT rejected — they fall through to Tier 2/3 scoring.
   - Rows with explicit *wrong* country are rejected (-100 in scoring → cut).
5. **Ranking** (new scoring function):
   - +100 explicit location
   - +70 inferred outlet/domain location
   - +50 topic match
   - +25 exact title match
   - +20 has verified email
   - +15 recent activity (e.g. `enriched_at`/`updated_at` within 180 days)
   - -100 explicit wrong country
   - -100 obvious topic mismatch (populated category in unrelated bucket)
   - Keep rows with score ≥ threshold (e.g. 50).
6. **Pagination** — slice ranked pool per Section 1.

## 3. Edge function: candidate breadth

- Raise initial DB candidate pull when a topic/location is detected (e.g. fetch up to 2000 journalist rows matching topic synonyms across `category/topic/outlet/titles`, then rank/filter in-memory). Current cap at ~150–500 is the main reason for under-retrieval.
- Keep existing Exa breadth caps as-is.

## 4. Edge function: debug payload

Return `debug` with: `strictMode, parsedIntent, kindFilterApplied, topicFilterApplied, locationFilterApplied, explicitLocationMatches, inferredLocationMatches, webMatches, rawCandidateCount, afterKindFilter, afterTopicFilter, afterLocationFilter, finalCount, has_more, rejectedExamples` (first 5).

## 5. Empty-state messaging

If `finalCount === 0` after ranking, response includes `reason: "no_matches"` and a user-facing `message: "No exact matches found. Try broadening topic or location."`. Do not pad with irrelevant rows.

## 6. Frontend: infinite scroll on `/chat`

`src/pages/app/Chat.tsx`

- Track per-message: `results`, `pagination`, `loadingMore`.
- On initial send: invoke chat with `{ query, limit: 100, offset: 0 }`.
- Add an `IntersectionObserver` sentinel below the results table for the latest assistant message.
- When sentinel intersects and `pagination.has_more && !loadingMore`:
  - call chat with `{ query, limit: 100, offset: pagination.next_offset }`
  - append rows (dedupe by `source_table+source_id` and by `email`)
  - update `pagination`
- Plan-based behavior is enforced server-side; the client loads until `has_more` is false.
- Show a small "Loading more…" spinner near the sentinel; hide when no more.
- No styling changes beyond minimal spinner + sentinel.

## Out of scope
- Enrichment (`enrich-contact`), Hunter, Snov, save-contact
- Credits / chat token metering math (existing usage tracking still wraps the call)
- Billing, Stripe
- UI redesign, fonts, colors, layout

## Verification
- Manual: run "tech journalists in the united states" and confirm result count grows past prior ~17, and that scrolling triggers a second batch on growth.
- Manual: "india tech journalists" must not return Indiana/Indianapolis rows.
- Manual: a creator query returns no journalist rows and vice versa.
- Build passes (typecheck handled by harness).
