# Media AI — High-Intent SEO Pages

System for publishing 2 PR/media-outreach pages per week, ranking for
commercial-intent keywords, and converting into Media AI tools/signup.

## 1. Framework

- **Route:** `/guides/:slug` — single reusable template (`GuidePage.tsx`)
  driven by `src/pages/guides/guides.ts`.
- **Hub:** `/guides` lists all guides, grouped by template type.
- **Four template types** (all share one component, branch by `kind`):
  - `best` — "Best X tools for PR" (with ranked items)
  - `vs` — "A vs B" (with comparison table)
  - `alternative` — "X alternatives" (ranked list incl. Media AI)
  - `templates` — "X templates / examples" (copy-pasteable bodies)
- **Reusable blocks** in template:
  problem framing → main body (items / table / templates)
  → mid-page CTA + trust line → FAQ → final CTA → related module.
- **To publish a new page:** add one object to `GUIDES` in `guides.ts`
  and one `<url>` to `public/sitemap.xml`. No other code changes.

## 2. Keyword clusters

| Cluster | Primary KW | Secondary KWs | Intent | Slug pattern |
|---|---|---|---|---|
| Journalist DB alternatives | `muck rack alternatives` | muck rack competitors, cheaper alternative to muck rack | commercial | `/guides/{tool}-alternatives` |
| PR outreach tools | `pr outreach tools` | best pr software, pr outreach platforms | commercial | `/guides/best-pr-outreach-tools` |
| Media pitch subject line | `media pitch subject line` | pr email subject lines, journalist email subject | informational→trans. | `/guides/media-pitch-subject-lines` |
| Press release distribution alts | `press release distribution alternatives` | cision pr newswire alternative, cheap pr distribution | commercial | `/guides/press-release-distribution-alternatives` |
| Find journalists by beat | `find journalists by beat` | journalist database by topic, how to find journalists | commercial | `/guides/find-journalists-by-beat` |
| AI tools for PR teams | `ai tools for pr teams` | ai pr software, ai pitch writer | commercial | `/guides/best-ai-tools-for-pr-teams` |

## 3. 12 publish-ready page briefs

| # | Slug | Type | Title (≤60) | Meta (≤155) | H1 | Status |
|---|---|---|---|---|---|---|
| 1 | `best-ai-tools-for-pr-teams` | best | Best AI Tools for PR Teams in 2026 (Honest Picks) | The AI tools PR teams actually use in 2026 — for finding journalists, writing pitches, and tracking coverage. Pricing, pros, cons. | The Best AI Tools for PR Teams in 2026 | **Live** |
| 2 | `muck-rack-alternatives` | alternative | 7 Muck Rack Alternatives in 2026 (Cheaper & Modern) | Looking for a Muck Rack alternative? Compare 7 cheaper, AI-first PR tools — pricing, journalist coverage, search, and when to switch. | Muck Rack Alternatives: 7 Modern Options for 2026 | **Live** |
| 3 | `muck-rack-vs-cision` | vs | Muck Rack vs Cision: Honest 2026 Comparison | Muck Rack vs Cision: pricing, journalist coverage, AI features, contracts, and which one PR teams actually pick in 2026. | Muck Rack vs Cision: Which Should PR Teams Pick? | **Live** |
| 4 | `media-pitch-email-templates` | templates | Media Pitch Email Templates (8 That Get Replies) | Eight battle-tested media pitch email templates — funding, product launch, exclusive, expert source, data story, podcast, profile, follow-up. | Media Pitch Email Templates That Actually Get Replies | **Live** |
| 5 | `cision-alternatives` | alternative | Cision Alternatives: 6 Cheaper PR Tools in 2026 | Cision is expensive. Six modern, AI-first alternatives — pricing, wire-distribution swaps, and when to switch contracts. | Cision Alternatives: 6 Cheaper Options for PR Teams | Brief ready |
| 6 | `meltwater-alternatives` | alternative | Meltwater Alternatives: Cheaper Media Tools 2026 | Six Meltwater alternatives for PR + monitoring teams. Side-by-side pricing, AI features, and contract flexibility. | Meltwater Alternatives for Modern PR Teams | Brief ready |
| 7 | `press-release-distribution-alternatives` | alternative | Press Release Distribution Alternatives (2026) | PR Newswire and Business Wire are pricey. 7 distribution alternatives — cost, reach, SEO value, and when wires still matter. | Press Release Distribution Alternatives in 2026 | Brief ready |
| 8 | `best-pr-outreach-tools` | best | Best PR Outreach Tools in 2026 (Picked by Use Case) | The PR outreach tools worth paying for in 2026 — by team size, budget, and workflow. AI-first picks plus enterprise options. | Best PR Outreach Tools for Every Team Size | Brief ready |
| 9 | `media-pitch-subject-lines` | templates | 25 Media Pitch Subject Lines That Get Opened | 25 pitch subject line templates by story type — funding, launch, data, expert source. Plus the rules behind why they work. | 25 Media Pitch Subject Lines That Actually Get Opened | Brief ready |
| 10 | `find-journalists-by-beat` | best | How to Find Journalists by Beat (Free & Paid) | The 5 ways PR teams actually find journalists by beat in 2026 — from free Twitter search to AI-native databases. | How to Find Journalists by Beat in 2026 | Brief ready |
| 11 | `prowly-vs-muck-rack` | vs | Prowly vs Muck Rack: Pricing & Features Compared | Prowly vs Muck Rack: journalist database, AI, pricing, and which PR teams pick each. Plus a cheaper third option. | Prowly vs Muck Rack: Which PR Tool Wins? | Brief ready |
| 12 | `pr-pitch-templates-by-announcement-type` | templates | PR Pitch Templates by Announcement Type | Pitch templates for funding, product launches, partnerships, exclusives, expert sources — and when to use each. | PR Pitch Templates for Every Announcement Type | Brief ready |

### Per-brief detail (H2/H3 + internal links + CTA placement)

All 12 briefs use the same structure (enforced by the template):

```
H1
  Intro (2-3 paragraphs)
  → Sets up the problem the searcher actually has

H2: How to read this list (problem framing)
  → 2-3 sentences, decision criteria

H2: Main body — branches by template type:
  • best         → H3 per tool (5-8 tools), with Best for / Pricing / Pros / Cons
  • alternative  → H3 per tool (6-8 alternatives, Media AI first)
  • vs           → 2-column comparison table (8-10 rows)
  • templates    → H3 per template (5-8 templates) with "When to use" + body

H2: Mid-page CTA card (trust line + primary CTA)
  → "Skip the research — try the tool" → /signup or /compare/{x}

H2: FAQ (3-5 questions)
  → FAQPage schema auto-injected

H2: Final CTA section (primary + secondary CTA)
  → primary: /signup
  → secondary: /tools/{relevant} or /compare/{x}

H2: Related
  → 4-6 internal links (mix of /tools, /compare, sibling /guides)
```

#### Internal links required per brief (CTA placement)

| Section | Link target |
|---|---|
| Intro (1st link) | `/tools` OR `/compare/{closest competitor}` |
| Items / table (per row when relevant) | `/compare/{tool}` |
| Mid-page CTA | `/signup` or `/compare/{competitor}` |
| Final CTA primary | `/signup` |
| Final CTA secondary | `/tools/{most-relevant}` or `/pricing` |
| Related module | 2× `/guides/*`, 2× `/tools/*`, 1× `/compare/*`, 1× `/resources/*` |

## 4. Internal linking map

```
                    /  (home)
                    │
       ┌────────────┼─────────────────┐
       │            │                 │
   /guides       /compare           /tools
       │            │                 │
   ┌───┼───┐    ┌───┴───┐         (24 tool pages)
   │   │   │    │       │              │
 best  vs  alt comp/mr  comp/cision    │
   └───┬───┘    └───┬───┘               │
       │            │                  │
       └─── cross-link both ways ──────┘
              │
              ↓
        /pricing → /signup
              ↑
        /resources (existing articles link to /guides)
```

Linking rules:
- Every `/guides/*alternatives` page links to its matching `/compare/{tool}`.
- Every `/compare/{tool}` page should add a link to its `/guides/{tool}-alternatives` companion in the related module (next iteration).
- Every `/guides/templates` page links to at least 2 `/tools/*` (subject-line tester, pitch personalization, pitch fit score).
- All `/guides/*` pages have at least one CTA into `/signup` and one into `/tools` or `/pricing`.

## 5. 4-week publishing cadence (2/week)

| Week | Mon | Thu |
|---|---|---|
| 1 | ✅ #1 best-ai-tools-for-pr-teams | ✅ #2 muck-rack-alternatives |
| 2 | ✅ #3 muck-rack-vs-cision | ✅ #4 media-pitch-email-templates |
| 3 | #5 cision-alternatives | #6 meltwater-alternatives |
| 4 | #7 press-release-distribution-alternatives | #8 best-pr-outreach-tools |

Next cycle (weeks 5-6): #9 media-pitch-subject-lines, #10 find-journalists-by-beat, #11 prowly-vs-muck-rack, #12 pr-pitch-templates-by-announcement-type.

## 6. On-page technical SEO (enforced by template)

Every `/guides/*` page automatically ships:

- [x] Unique `<title>` ≤ 60 chars
- [x] Unique `<meta name="description">` ≤ 155 chars
- [x] `<link rel="canonical">` to `https://trymedia.ai/guides/{slug}`
- [x] Open Graph: `og:type=article`, `og:url`, `og:title`, `og:description`
- [x] Twitter Card: `summary_large_image`, title, description
- [x] FAQ JSON-LD (`FAQPage`)
- [x] Article JSON-LD (`Article` with publisher, datePublished, dateModified)
- [x] Single `<h1>`
- [x] Semantic H2/H3 hierarchy
- [x] Crawlable by default — `robots.txt` does not disallow `/guides`
- [x] Listed in `public/sitemap.xml`

## 7. Conversion guardrails

Every page must contain:

1. **Mid-page CTA card** with trust line ("Used by 1,000+ PR teams • Cancel anytime")
2. **Final CTA section** with primary (`/signup`) + secondary (`/tools/*` or `/pricing`)
3. **At least one `/tools/*` link** so visitors can get free value without signing up
4. **Internal link to `/pricing`** when discussing cost
5. **Media AI listed first** in any `alternative` or `best` list (with a clear "why" — not a sales pitch)

## 8. Content quality guardrails

Do **not** publish a page that:

- Reads like a paraphrase of competitor marketing pages
- Recommends Media AI without stating the trade-off (what it's not good for)
- Has fewer than 800 words of substantive body content
- Skips the "Problem framing" section
- Skips actionable specifics (numbers, decision criteria, when-to-use lines)
- Uses generic intros like "In today's fast-paced PR world…"

## 9. QA checklist before publish

```
[ ] guides.ts entry added with all required fields
[ ] Title ≤ 60 chars, meta ≤ 155 chars (run a length check)
[ ] H1 present and matches search intent
[ ] At least one /signup link
[ ] At least one /tools/* link
[ ] At least one /compare/* link (for best / vs / alternative)
[ ] FAQ has 3-5 questions
[ ] Related module has 4-6 links, mixing /guides, /tools, /compare
[ ] sitemap.xml entry added with today's lastmod
[ ] Preview at /guides/{slug} renders without console errors
[ ] View source: og:*, twitter:*, canonical, both JSON-LD blocks present
[ ] Mobile viewport check (table scrolls, CTA stacks)
[ ] Spell-check + read intro aloud — cut filler
```

## 10. Files created / modified

**Added**
- `src/pages/guides/guides.ts` — content data + types
- `src/pages/guides/GuidePage.tsx` — reusable per-page template
- `src/pages/guides/GuidesHub.tsx` — `/guides` hub
- `docs/seo/high-intent-pages.md` — this document

**Modified (non-invasive)**
- `src/App.tsx` — added 2 routes + added `guides` to `RESERVED_ROOT`
- `public/sitemap.xml` — added 5 new URLs (hub + 4 live guides)

**Untouched** (per safety constraint): all product flows, existing
templates, headers, footers, auth, billing, search, tools, compare,
resources, discover.
