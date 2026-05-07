# Keyword Monitor — Fix & Upgrade Plan

This is a large, multi-layer change. Below is the scoped plan before any code is touched. No chat/database/enrichment work. No full redesign.

## 1. Branding rename: Brand Monitor → Keyword Monitor

Search/replace across:
- `src/pages/app/Monitor.tsx` (title, subtitles, empty states, buttons)
- `src/components/Header.tsx` / sidebar nav links
- `src/pages/Index.tsx` (homepage card if present)
- `src/hooks/useMonitor.ts` (comments only — keep DB table names)
- Edge function email subjects/bodies (`monitor-check`, `monitor-run-all`)

New subtitle: *"Track brands, founders, competitors, products, and keywords across Google News."*

DB table names (`brand_monitors`, `monitor_updates`, `monitor_snapshots`) stay — only UI strings change.

## 2. Database schema additions (migration)

Extend `brand_monitors`:
- `founder_names text[] default '{}'`
- `product_names text[] default '{}'`
- `digest_last_sent_at timestamptz`
- `last_status text` (last run status: ok / error / no_results)
- `last_error text`
- `last_mentions_found int default 0`

Extend `monitor_updates` (additive — keep existing rows):
- `mention_type text` ('brand' | 'competitor' | 'founder' | 'keyword' | 'product')
- `matched_keyword text`
- `source text` ('google_news' | 'blog' | 'news_site' | 'newsletter')
- `title text`
- `publisher text`
- `published_at timestamptz`
- `image_url text`
- `sentiment text` ('positive' | 'neutral' | 'negative')

Existing `summary`, `why_it_matters`, `pr_score` columns stay (still used by AI evaluation path); new schema makes them optional.

## 3. Backend: rewrite `monitor-check` around Google News

Replace the current "fetch & diff brand website" approach with a Google News RSS / search pipeline:

- For each `brand_names + founder_names + competitor_urls (host) + keywords + products`, query Google News RSS:
  `https://news.google.com/rss/search?q=<term>&hl=en-US&gl=US&ceid=US:en`
- Parse items (title, link, pubDate, source, snippet, image enclosure when present).
- Skip items already stored (dedupe by `(monitor_id, url)`).
- Lightweight sentiment (rule-based on title — fast & free; AI optional flag).
- Insert into `monitor_updates` with new columns populated.
- Update `brand_monitors.last_checked_at`, `last_status`, `last_error`, `last_mentions_found`.
- Return `{ ok, inserted, results }`.
- Proper CORS on every response (already OK pattern). Structured `{ error, details }`.

Add log lines: `MONITOR_RUN_CHECK_STARTED/FINISHED`, `MONITOR_SCHEDULED_CHECK_STARTED/FINISHED`, `MONITOR_EMAIL_SENT`.

Keep `monitor-run-all` cron (already wired) — just calls the new `monitor-check` per active monitor.

## 4. Email digests (Resend via gateway)

In `monitor-check`:
- `instant` → email per high-priority mention (founder mention, competitor major coverage, negative sentiment, keyword spike).
- `daily` / `weekly` → only sent by `monitor-run-all` when `digest_last_sent_at` is older than 24h / 7d. Bundle top mentions into branded HTML using existing `_shared/email-template.ts`. CTA button "Open Keyword Monitor".

## 5. Frontend: `src/pages/app/Monitor.tsx`

Keep current layout. Add (compact, not bloated):

- **Header row**: title "Keyword Monitor" + tiny `Powered by Google News` badge with Google logo (asset path: `/google-news.svg` — placeholder until user provides the asset; I'll add a fallback inline SVG).
- **Trust row** (small muted icons): Google News · Daily monitoring · Email alerts · Competitor tracking.
- **KPI cards** (5 small cards): Total · Today · Competitor · Positive · Negative.
- **Charts** (recharts, already in deps): mentions-over-time line + source pie + sentiment bar. 7d / 30d toggle.
- **Updates list**: mention badges (type + source) + publisher + published_at + image thumbnail when available.
- **Per-monitor debug strip** (collapsed): last check time / status / mentions found / last error.
- **Run check** handler: console logs (`MONITOR_RUN_CHECK_CLICKED`, `_PAYLOAD`, `_RESPONSE`), invalidate queries, toast `Found X new mentions` / `No new mentions found.`
- **Form**: add `founder_names` and `product_names` inputs; rename "Brand" form labels to "Keyword Monitor".

## 6. Hook updates: `src/hooks/useMonitor.ts`

- Type extensions for new fields on `BrandMonitor` / `MonitorUpdate`.
- New `useMonitorStats(monitorId?)` returning aggregated counts for KPI cards (client-side reduce over `useUpdates` results — no extra round trip).

## 7. Homepage card (`src/pages/Index.tsx`)

If a "Brand Monitor" card exists, rename to "Keyword Monitor" + small Google badge. Show: mentions today, active keywords, latest mention headline, sentiment trend dot. Skip if no such card exists today (will check).

## 8. Out of scope (explicit)

- No chat / database / enrichment changes.
- No global redesign — only Monitor page + homepage card + nav label.
- No new tables for things that fit existing ones.

## Technical notes

- Google News RSS is free and unauthenticated. Reasonable rate (one request per term, sequential, ~10 max per monitor per run). Timeout 15s per fetch.
- RSS parsing: minimal regex parser inside the edge function (no extra deps).
- Sentiment: simple positive/negative wordlist on the title. Marked clearly as heuristic.
- `recharts` is already installed (used elsewhere) — verify before importing.
- New columns added with `default` values so existing rows remain valid.
- Migration is additive; nothing destructive.

## Deliverables order

1. Migration (extend tables).
2. Edge function rewrite (`monitor-check`) + small `monitor-run-all` tweak for digests.
3. Hook + types update.
4. Monitor page UI (KPIs, charts, badges, debug, run-check logs/toasts, founder/product inputs, Google badge, trust row).
5. Nav + homepage rename + card.
6. QA: run preview, click Run check on existing monitor, confirm network call, confirm rows, confirm UI refresh.

Approve and I'll ship in this order.
