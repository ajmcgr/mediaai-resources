// Programmatic SEO content for /guides/:slug.
// One reusable shape covers all 4 template types:
//  - best        ("Best [X] tools for PR")
//  - vs          ("[A] vs [B]")
//  - alternative ("[X] alternatives")
//  - templates   ("[X] templates / examples")
//
// Pages render via src/pages/guides/GuidePage.tsx using only the blocks
// they define. Add new objects here to publish — no other code changes needed.

export type GuideKind = "best" | "vs" | "alternative" | "templates";

export type GuideItem = {
  name: string;
  blurb: string;
  bestFor?: string;
  pricing?: string;
  pros?: string[];
  cons?: string[];
  link?: string; // internal link to /tools/... /compare/... or external
};

export type GuideExample = {
  label: string;
  body: string;          // the actual template / example text
  whenToUse?: string;
};

export type GuideFAQ = { q: string; a: string };

export type GuideRelated = { label: string; to: string };

export type Guide = {
  slug: string;
  kind: GuideKind;
  cluster: string;             // keyword cluster the page belongs to
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: "commercial" | "transactional" | "informational";

  // SEO
  title: string;                // <=60 chars
  metaDescription: string;      // <=155 chars
  h1: string;
  publishedAt: string;          // ISO date
  updatedAt: string;            // ISO date

  // Page content
  intro: string;                // 2-3 short paragraphs
  problemFraming?: string;      // why this matters / decision criteria
  items?: GuideItem[];          // for kind = best | alternative
  comparison?: {
    headers: [string, string, string];
    rows: { feature: string; a: string; b: string }[];
  };                            // for kind = vs
  examples?: GuideExample[];    // for kind = templates
  faq: GuideFAQ[];
  related: GuideRelated[];
  ctaPrimary?: { label: string; to: string };
  ctaSecondary?: { label: string; to: string };
};

const today = "2026-05-16";

export const GUIDES: Guide[] = [
  // ─────────────────────────── KIND: best ───────────────────────────
  {
    slug: "best-ai-tools-for-pr-teams",
    kind: "best",
    cluster: "AI tools for PR teams",
    primaryKeyword: "ai tools for pr teams",
    secondaryKeywords: [
      "ai pr software",
      "best ai tools for public relations",
      "ai pitch writer",
    ],
    intent: "commercial",
    title: "Best AI Tools for PR Teams in 2026 (Honest Picks)",
    metaDescription:
      "The AI tools PR teams actually use in 2026 — for finding journalists, writing pitches, and tracking coverage. Pricing, pros, cons, and when to use each.",
    h1: "The Best AI Tools for PR Teams in 2026",
    publishedAt: today,
    updatedAt: today,
    intro:
      "Most PR teams don't need 12 AI tools. They need 3 that actually save hours each week: one to find the right journalists, one to draft a credible pitch, and one to track what landed. This list is opinionated. We left out every tool that's mostly marketing copy with an AI label on the homepage.",
    problemFraming:
      "Decision criteria: (1) does it replace a real step in your weekly workflow, (2) can you trial it without a sales call, (3) does the output need heavy editing before you'd send it to a journalist. If a tool fails two of those, skip it.",
    items: [
      {
        name: "Media AI",
        blurb:
          "AI-native journalist + creator database. Describe who you want to reach in plain English, get a vetted list, and draft personalized pitches in the same screen.",
        bestFor: "Founders and PR teams who want one tool from discovery to send.",
        pricing: "From <$100/mo, monthly billing, no annual contract.",
        pros: [
          "Plain-English search across 50K+ journalists and creators",
          "Pitch drafting + personalization in the same workflow",
          "Self-serve trial in under 2 minutes",
        ],
        cons: ["Not a full media-monitoring suite"],
        link: "/signup",
      },
      {
        name: "Free PR tool suite",
        blurb:
          "24 single-purpose tools (subject line tester, pitch fit score, beat matcher, etc.) — useful when you don't need a full platform yet.",
        bestFor: "Solo founders or in-house teams prepping a single campaign.",
        pricing: "Free.",
        pros: ["No signup", "Each tool does one thing well"],
        link: "/tools",
      },
      {
        name: "ChatGPT / Claude (with a real workflow)",
        blurb:
          "Great for first-draft pitches and quote polishing — only if you wrap them in a repeatable prompt and feed them context about each journalist.",
        bestFor: "Teams already comfortable building their own prompts.",
        pricing: "$20/mo per user.",
        pros: ["Cheap", "Flexible"],
        cons: ["No journalist data", "No tracking, no lists"],
      },
      {
        name: "Muck Rack / Cision (AI add-ons)",
        blurb:
          "Legacy PR suites layering AI features on top. Useful if you already have a contract — overkill if you don't.",
        bestFor: "Enterprise teams with existing contracts.",
        pricing: "$7K–$50K+/year, annual contract.",
        cons: ["Sales-led", "Annual lock-in", "Legacy UI"],
        link: "/compare/muck-rack",
      },
    ],
    faq: [
      {
        q: "What's the smallest AI stack a PR team actually needs?",
        a: "One discovery + outreach tool (e.g. Media AI) and one LLM (ChatGPT or Claude) for editing. Everything else is optional until you scale past ~20 campaigns/month.",
      },
      {
        q: "Will journalists notice if my pitch is AI-generated?",
        a: "Yes — if it's a raw LLM output with no personalization. No — if the AI is pulling from real recent coverage and you've edited the final draft. The discovery step matters more than the draft.",
      },
      {
        q: "Do I need an enterprise PR platform?",
        a: "Under ~50 active campaigns per month, no. A modern AI-first tool plus your inbox is faster, cheaper, and easier to onboard.",
      },
    ],
    related: [
      { label: "Media AI vs Muck Rack", to: "/compare/muck-rack" },
      { label: "Media AI vs Cision", to: "/compare/cision" },
      { label: "Free PR tools", to: "/tools" },
      { label: "Pitch templates by announcement type", to: "/guides/media-pitch-email-templates" },
    ],
    ctaPrimary: { label: "Try Media AI free", to: "/signup" },
    ctaSecondary: { label: "Browse free PR tools", to: "/tools" },
  },

  // ─────────────────────────── KIND: alternative ───────────────────────────
  {
    slug: "muck-rack-alternatives",
    kind: "alternative",
    cluster: "journalist database alternatives",
    primaryKeyword: "muck rack alternatives",
    secondaryKeywords: [
      "muck rack competitors",
      "cheaper alternative to muck rack",
      "muck rack vs",
    ],
    intent: "commercial",
    title: "7 Muck Rack Alternatives in 2026 (Cheaper & Modern)",
    metaDescription:
      "Looking for a Muck Rack alternative? Compare 7 cheaper, AI-first PR tools — pricing, journalist coverage, search, and when to switch.",
    h1: "Muck Rack Alternatives: 7 Modern Options for 2026",
    publishedAt: today,
    updatedAt: today,
    intro:
      "Muck Rack is a solid product, but the annual contract, opaque pricing, and Boolean-first search push a lot of teams to look elsewhere — especially smaller PR teams and founders who don't want a sales call before they can try the product.",
    problemFraming:
      "Switching is usually triggered by one of three things: (1) contract renewal coming up and the price jumped, (2) you want self-serve AI search, not Boolean strings, (3) you need creator coverage Muck Rack doesn't have. Match the alternative to the trigger.",
    items: [
      {
        name: "Media AI",
        blurb:
          "AI-native journalist + creator database with plain-English search and monthly pricing. The most common replacement for teams under 50 seats.",
        bestFor: "Teams that want self-serve, monthly billing, and AI search.",
        pricing: "From <$100/mo, no annual contract.",
        pros: ["50K+ journalists + creators", "Pitch in same screen", "Cancel anytime"],
        link: "/compare/muck-rack",
      },
      {
        name: "Cision",
        blurb: "If you need wire distribution bundled with the database.",
        bestFor: "Large enterprises bundling PR Newswire.",
        pricing: "$7K–$50K+/year.",
        cons: ["Even more expensive", "Sales-led"],
        link: "/compare/cision",
      },
      {
        name: "Meltwater",
        blurb: "Heavier on monitoring and social listening than pure outreach.",
        bestFor: "Teams that need monitoring + DB in one suite.",
        pricing: "$6K–$25K+/year.",
        link: "/compare/meltwater",
      },
      {
        name: "Prowly",
        blurb: "Mid-market PR CRM, simpler than Muck Rack but with a smaller DB.",
        bestFor: "Agencies with light database needs.",
        pricing: "From ~$258/mo.",
      },
      {
        name: "Roxhill",
        blurb: "Strong UK / EMEA journalist coverage.",
        bestFor: "UK-focused PR teams.",
        pricing: "Custom annual.",
      },
      {
        name: "Prezly",
        blurb: "PR CRM + newsroom hosting, useful for in-house comms.",
        bestFor: "In-house comms with a newsroom.",
        pricing: "From ~$70/mo + add-ons.",
      },
      {
        name: "Manual research + ChatGPT",
        blurb:
          "Free, painful, surprisingly common. Works for 1–2 pitches a month.",
        bestFor: "Pre-product founders.",
        pricing: "Free.",
        cons: ["Doesn't scale", "Stale contact data"],
      },
    ],
    faq: [
      {
        q: "Which Muck Rack alternative is cheapest?",
        a: "Among real database tools (not free research), Media AI is the cheapest mainstream alternative — transparent monthly pricing under $100/mo to start, vs $5K+/year on Muck Rack.",
      },
      {
        q: "Can I migrate my Muck Rack lists?",
        a: "Yes — export your lists as CSV from Muck Rack and import to most modern tools, including Media AI, in seconds.",
      },
      {
        q: "Is the journalist coverage as good as Muck Rack?",
        a: "For US, EU, and APAC general PR, Media AI's 50K+ database is competitive. For deep UK regional coverage, Roxhill is stronger. For wire distribution, you'll still want Cision or a standalone wire.",
      },
    ],
    related: [
      { label: "Media AI vs Muck Rack — full comparison", to: "/compare/muck-rack" },
      { label: "Cision alternatives", to: "/guides/cision-alternatives" },
      { label: "Best AI tools for PR teams", to: "/guides/best-ai-tools-for-pr-teams" },
    ],
    ctaPrimary: { label: "Compare Media AI vs Muck Rack", to: "/compare/muck-rack" },
    ctaSecondary: { label: "Start free", to: "/signup" },
  },

  // ─────────────────────────── KIND: vs ───────────────────────────
  {
    slug: "muck-rack-vs-cision",
    kind: "vs",
    cluster: "journalist database comparisons",
    primaryKeyword: "muck rack vs cision",
    secondaryKeywords: [
      "cision vs muck rack",
      "muck rack or cision",
      "muck rack vs cision pricing",
    ],
    intent: "commercial",
    title: "Muck Rack vs Cision: Honest 2026 Comparison",
    metaDescription:
      "Muck Rack vs Cision: pricing, journalist coverage, AI features, contracts, and which one PR teams actually pick in 2026.",
    h1: "Muck Rack vs Cision: Which Should PR Teams Pick?",
    publishedAt: today,
    updatedAt: today,
    intro:
      "Muck Rack and Cision both sell the same core promise — a media database plus monitoring — but they target different buyers. Muck Rack is leaner and used heavily by mid-market PR. Cision is the legacy enterprise suite with wire distribution baked in.",
    problemFraming:
      "Most teams realize halfway through the demo cycle that neither fits — both want annual contracts in the five figures. If you're under ~50 seats, look at a modern AI-first alternative before signing either.",
    comparison: {
      headers: ["Feature", "Muck Rack", "Cision"],
      rows: [
        { feature: "Starting price", a: "~$5K/year", b: "~$7K–$50K+/year" },
        { feature: "Contract", a: "Annual", b: "Annual, often multi-year" },
        { feature: "Self-serve trial", a: "No", b: "No" },
        { feature: "Database size", a: "~1M+ journalists", b: "~1M+ journalists" },
        { feature: "Wire distribution", a: "No (integrations)", b: "Yes (PR Newswire)" },
        { feature: "AI features", a: "Bolted on", b: "Bolted on" },
        { feature: "Search style", a: "Boolean-first", b: "Boolean + filters" },
        { feature: "Creator coverage", a: "Limited", b: "Limited" },
        { feature: "UI", a: "Modern-ish", b: "Legacy / dense" },
      ],
    },
    faq: [
      {
        q: "Is Muck Rack cheaper than Cision?",
        a: "Usually yes — Muck Rack starts around $5K/year vs Cision's $7K–$50K+. But Cision bundles wire distribution, which can be a meaningful saving if you'd buy a wire anyway.",
      },
      {
        q: "Is there a cheaper alternative to both?",
        a: "Yes. AI-first tools like Media AI start under $100/mo with monthly billing and cover the discovery + pitching workflow most PR teams actually use day-to-day.",
      },
      {
        q: "Which has better AI features?",
        a: "Both have AI add-ons that feel bolted onto legacy products. Neither was built AI-first. If AI search is the reason you're shopping, look at modern tools.",
      },
    ],
    related: [
      { label: "Media AI vs Muck Rack", to: "/compare/muck-rack" },
      { label: "Media AI vs Cision", to: "/compare/cision" },
      { label: "Muck Rack alternatives", to: "/guides/muck-rack-alternatives" },
    ],
    ctaPrimary: { label: "See a modern alternative", to: "/compare/muck-rack" },
    ctaSecondary: { label: "Try Media AI free", to: "/signup" },
  },

  // ─────────────────────────── KIND: templates ───────────────────────────
  {
    slug: "media-pitch-email-templates",
    kind: "templates",
    cluster: "media pitch templates",
    primaryKeyword: "media pitch email template",
    secondaryKeywords: [
      "pr pitch template",
      "pitch email examples",
      "press release pitch template",
      "journalist outreach template",
    ],
    intent: "informational",
    title: "Media Pitch Email Templates (8 That Get Replies)",
    metaDescription:
      "Eight battle-tested media pitch email templates — funding, product launch, exclusive, expert source, data story, podcast, founder profile, follow-up.",
    h1: "Media Pitch Email Templates That Actually Get Replies",
    publishedAt: today,
    updatedAt: today,
    intro:
      "These are the pitch shapes that actually land coverage. Each one is short on purpose. The mistake most pitches make isn't bad writing — it's burying the news in paragraph three. Pick the template that matches your story, swap in the specifics, and cut anything that doesn't survive a second read.",
    problemFraming:
      "Use one template per story. Don't mix the funding pitch with the expert-source pitch — journalists can tell. And always personalize the first line with a specific piece of the journalist's recent coverage. Generic intros are the #1 reason pitches get archived.",
    examples: [
      {
        label: "1. Funding announcement (exclusive)",
        whenToUse: "Series A–C, single tier-1 outlet, you have 5 working days lead time.",
        body: `Subject: Exclusive — [Company] raises $[X]M Series [A/B] to [one-line vision]

Hi [First name],

Loved your [Month] piece on [specific story]. Wanted to offer you the exclusive on our Series [X]:

• Round: $[X]M led by [Lead], with [Notable]
• What we do: [one sentence, no jargon]
• Why now: [the wedge — usage growth, regulatory shift, market timing]
• Embargo: [day, time, timezone]

Happy to set up a 20-min call with [Founder] this week. Materials attached.

[Signature]`,
      },
      {
        label: "2. Product launch (broad pitch)",
        whenToUse: "Net-new product or major feature, no exclusive, 7–10 day window.",
        body: `Subject: New: [Product] — [the one specific outcome it delivers]

Hi [First name],

Quick one given your beat on [topic]. We just launched [Product], which [does specific thing] for [specific user].

The angle that matches your coverage: [specific angle, e.g. "shifts where workflow X happens, similar to your piece on Y"].

Launch is [date]. Happy to send early access, demo, or a custom screenshot if useful.

[Signature]`,
      },
      {
        label: "3. Expert source / commentary",
        whenToUse: "Breaking news in your space, you can offer a quote within 2 hours.",
        body: `Subject: Source on [topic] — [credibility marker] available today

Hi [First name],

Saw your [outlet] thread on [news]. [Founder/Exec], who [credibility line — "ran X at Y", "advised Z", etc.], can offer a quote on [specific angle] today.

Two sample angles:
1. [Sharp, contrarian POV]
2. [Specific data point or anecdote]

Reply with deadline and I'll turn around in <1 hour.

[Signature]`,
      },
      {
        label: "4. Data story / proprietary report",
        whenToUse: "You've analyzed unique data worth publishing.",
        body: `Subject: New data — [headline finding in <8 words]

Hi [First name],

We analyzed [N] [data points] across [scope]. Three findings I think fit your beat:

1. [Counter-intuitive finding with number]
2. [Trend with year-over-year delta]
3. [Surprising segment cut]

Full dataset + charts attached. Happy to do an exclusive if you want first look — otherwise wide release [date].

[Signature]`,
      },
      {
        label: "5. Founder / origin story profile",
        whenToUse: "Long-lead features, when the founder is the story.",
        body: `Subject: Profile idea — [Founder name], [one-line identity]

Hi [First name],

Following your work on [topic]. Wanted to flag [Founder name] as a possible profile subject:

• Background: [unusual path]
• Why now: [stage milestone — funding, IPO, scale moment]
• Hook journalists usually like: [specific tension or contradiction]

Happy to set up a no-strings background call if there's interest.

[Signature]`,
      },
      {
        label: "6. Podcast guest pitch",
        whenToUse: "You want your founder on a specific show.",
        body: `Subject: Guest idea for [Podcast name] — [Founder], on [topic]

Hi [First name],

Listener of [Podcast]. Loved the [Guest] episode on [topic].

[Founder name] would be a strong fit for an episode on [angle]. Background: [2 lines]. Recent talks: [1–2 links].

Three angles your audience would care about:
1. [Specific]
2. [Specific]
3. [Specific]

Open to recording any week in [month]. Reply and I'll send full bio + headshots.

[Signature]`,
      },
      {
        label: "7. Trend / newsjack",
        whenToUse: "Big news broke in the last 24h and you have a real angle.",
        body: `Subject: [Today's news] — [the angle nobody's covering yet]

Hi [First name],

Re: [today's news]. Most coverage is focused on [obvious angle]. The angle worth writing:

[2-sentence sharp take with a specific reason it matters.]

[Founder/Exec] can talk on the record today. [Optional: link to internal data or product context.]

[Signature]`,
      },
      {
        label: "8. Follow-up (3–5 days after first pitch)",
        whenToUse: "First pitch got no reply. Send once. Then move on.",
        body: `Subject: Re: [original subject]

Hi [First name],

Bumping this in case it got buried. One thing that's changed since I first wrote: [genuine new development — usage milestone, new data point, customer name].

If it's not a fit, no worries — happy to take a no and stop pinging.

[Signature]`,
      },
    ],
    faq: [
      {
        q: "How long should a pitch email be?",
        a: "Under 150 words for the body. Journalists scan on mobile — if your news isn't in the first two lines, it won't get read.",
      },
      {
        q: "Should I attach a press release?",
        a: "Yes, but the pitch itself should be self-contained. Treat the attachment as 'more info if you want it,' not 'please open this PDF to understand what I'm pitching.'",
      },
      {
        q: "What time should I send pitches?",
        a: "Tuesday–Thursday, 7–10am in the journalist's local timezone. Monday is buried under weekend backlog. Friday is dead.",
      },
      {
        q: "How do I personalize at scale?",
        a: "Use a tool that lets you reference recent coverage automatically. The first line should always quote a specific article, not 'I loved your work.'",
      },
    ],
    related: [
      { label: "Subject line split-tester", to: "/tools/subject-line-split-tester" },
      { label: "Pitch personalization helper", to: "/tools/pitch-personalization-helper" },
      { label: "Follow-up cadence builder", to: "/tools/follow-up-cadence-builder" },
      { label: "Press release templates", to: "/resources/press-release-templates-by-announcement-type" },
    ],
    ctaPrimary: { label: "Find the right journalists in Media AI", to: "/signup" },
    ctaSecondary: { label: "Score your pitch (free)", to: "/tools/pitch-fit-score-calculator" },
  },

  // ─────────────────────────── #5 cision-alternatives ───────────────────────────
  {
    slug: "cision-alternatives",
    kind: "alternative",
    cluster: "journalist database alternatives",
    primaryKeyword: "cision alternatives",
    secondaryKeywords: ["cision competitors", "cheaper than cision", "cision vs"],
    intent: "commercial",
    title: "Cision Alternatives: 6 Cheaper PR Tools in 2026",
    metaDescription:
      "Cision is expensive. Six modern, AI-first alternatives — pricing, wire-distribution swaps, and when to switch contracts.",
    h1: "Cision Alternatives: 6 Cheaper Options for PR Teams",
    publishedAt: today,
    updatedAt: today,
    intro:
      "Cision bundles a journalist database, monitoring, and PR Newswire distribution into a single five- or six-figure contract. That works for global enterprises. For everyone else, the bundle is the problem — you pay for capabilities you don't use, locked in for a year.",
    problemFraming:
      "Most teams leave Cision for one of three reasons: the renewal jumped 20%+, the AI features feel bolted on, or distribution is the only piece they actually need. Match your alternative to the reason — there's no one-size-fits-all swap.",
    items: [
      {
        name: "Media AI",
        blurb:
          "AI-native journalist + creator database. Replaces the discovery + pitching half of Cision at a fraction of the cost.",
        bestFor: "Teams that need discovery + outreach, not wire distribution.",
        pricing: "From <$100/mo, monthly billing.",
        pros: ["Plain-English search", "50K+ journalists + creators", "Self-serve trial"],
        cons: ["No wire distribution"],
        link: "/compare/cision",
      },
      {
        name: "Muck Rack",
        blurb: "The closest direct competitor — leaner, mid-market focused.",
        bestFor: "Mid-market PR teams that still want a legacy-style DB.",
        pricing: "~$5K+/year, annual.",
        link: "/compare/muck-rack",
      },
      {
        name: "Meltwater",
        blurb: "Heavier on monitoring + social listening than pure outreach.",
        bestFor: "Teams replacing Cision primarily for monitoring.",
        pricing: "$6K–$25K+/year.",
        link: "/compare/meltwater",
      },
      {
        name: "Prowly",
        blurb: "PR CRM and newsroom hosting with a lighter database.",
        bestFor: "Agencies and in-house comms that need newsroom + CRM.",
        pricing: "From ~$258/mo.",
      },
      {
        name: "EZ Newswire / Newswire.com",
        blurb: "Standalone wire distribution at a fraction of PR Newswire pricing.",
        bestFor: "Teams who only kept Cision for the wire.",
        pricing: "From ~$300 per release.",
      },
      {
        name: "Notified",
        blurb: "Cision spinoff for IR/PR teams with similar UI but separate pricing.",
        bestFor: "Public companies needing IR + PR in one tool.",
        pricing: "Custom annual.",
      },
    ],
    faq: [
      {
        q: "What's the cheapest Cision alternative?",
        a: "For discovery + outreach, Media AI starts under $100/mo with monthly billing — vs Cision's $7K–$50K+/year. For wire-only, EZ Newswire or Newswire.com are the cheapest credible swaps.",
      },
      {
        q: "Can I keep PR Newswire without keeping the rest of Cision?",
        a: "Sometimes. PR Newswire sells standalone packages, but the unit price is higher without the bundle. Compare against EZ Newswire / Newswire.com before renewing.",
      },
      {
        q: "How disruptive is the switch?",
        a: "Discovery + outreach swap is low-friction (export contacts to CSV, import elsewhere). Switching wire providers requires re-uploading boilerplate and a one-week parallel-run to verify pickup.",
      },
    ],
    related: [
      { label: "Media AI vs Cision", to: "/compare/cision" },
      { label: "Muck Rack alternatives", to: "/guides/muck-rack-alternatives" },
      { label: "Press release distribution alternatives", to: "/guides/press-release-distribution-alternatives" },
      { label: "Best AI tools for PR teams", to: "/guides/best-ai-tools-for-pr-teams" },
    ],
    ctaPrimary: { label: "Compare Media AI vs Cision", to: "/compare/cision" },
    ctaSecondary: { label: "Try Media AI free", to: "/signup" },
  },

  // ─────────────────────────── #6 meltwater-alternatives ───────────────────────────
  {
    slug: "meltwater-alternatives",
    kind: "alternative",
    cluster: "journalist database alternatives",
    primaryKeyword: "meltwater alternatives",
    secondaryKeywords: ["meltwater competitors", "cheaper than meltwater", "meltwater vs"],
    intent: "commercial",
    title: "Meltwater Alternatives: Cheaper Media Tools 2026",
    metaDescription:
      "Six Meltwater alternatives for PR + monitoring teams. Side-by-side pricing, AI features, and contract flexibility.",
    h1: "Meltwater Alternatives for Modern PR Teams",
    publishedAt: today,
    updatedAt: today,
    intro:
      "Meltwater grew up as a media-monitoring suite and has slowly added outreach features on top. For teams whose job is mostly listening — brand mentions, share of voice, competitor coverage — it's solid. For teams whose job is pitching, it's usually overpowered and overpriced.",
    problemFraming:
      "Decide what you actually do day-to-day. If 80% of your week is outreach, you want a discovery-first tool. If 80% is monitoring + reporting, look at monitoring-first tools. Few teams need both in one suite.",
    items: [
      {
        name: "Media AI",
        blurb:
          "AI-native discovery + outreach. Pair with a lightweight monitoring tool to fully replace Meltwater for outreach-heavy teams.",
        bestFor: "Teams whose primary job is pitching, not monitoring.",
        pricing: "From <$100/mo.",
        pros: ["AI search", "Pitch in the same screen", "Monthly billing"],
        cons: ["Not a monitoring suite"],
        link: "/compare/meltwater",
      },
      {
        name: "Brand24",
        blurb: "Affordable social + web monitoring with sentiment.",
        bestFor: "Teams that just need monitoring + alerts.",
        pricing: "From ~$99/mo.",
      },
      {
        name: "Mention",
        blurb: "Real-time brand and competitor monitoring across the web and social.",
        bestFor: "Small teams wanting an alerts dashboard.",
        pricing: "From ~$41/mo.",
      },
      {
        name: "Muck Rack",
        blurb: "Stronger on journalist DB than monitoring.",
        bestFor: "Teams replacing Meltwater primarily for outreach.",
        pricing: "~$5K+/year.",
        link: "/compare/muck-rack",
      },
      {
        name: "Cision",
        blurb: "Equivalent enterprise suite with wire bundled.",
        bestFor: "Enterprise teams that want to stay legacy.",
        pricing: "$7K–$50K+/year.",
        link: "/compare/cision",
      },
      {
        name: "Determ",
        blurb: "Modern media monitoring with AI insights, popular in EU.",
        bestFor: "EU-focused PR teams.",
        pricing: "Custom monthly.",
      },
    ],
    faq: [
      {
        q: "Is there a single tool that replaces Meltwater entirely?",
        a: "Rarely. Most teams replace Meltwater with two cheaper tools — a discovery/outreach platform plus a focused monitoring tool — and still come out ahead on cost.",
      },
      {
        q: "Can Media AI do media monitoring?",
        a: "Media AI focuses on discovery and outreach. For monitoring, pair it with Brand24, Mention, or Determ depending on budget.",
      },
      {
        q: "How much can I save vs Meltwater?",
        a: "A typical Meltwater contract is $6K–$25K/year. Media AI + Brand24 can deliver 80% of the workflow for under $2.5K/year.",
      },
    ],
    related: [
      { label: "Media AI vs Meltwater", to: "/compare/meltwater" },
      { label: "Cision alternatives", to: "/guides/cision-alternatives" },
      { label: "Muck Rack alternatives", to: "/guides/muck-rack-alternatives" },
      { label: "Best AI tools for PR teams", to: "/guides/best-ai-tools-for-pr-teams" },
    ],
    ctaPrimary: { label: "Compare Media AI vs Meltwater", to: "/compare/meltwater" },
    ctaSecondary: { label: "Start free", to: "/signup" },
  },

  // ─────────────────────────── #7 press-release-distribution-alternatives ───────────────────────────
  {
    slug: "press-release-distribution-alternatives",
    kind: "alternative",
    cluster: "press release distribution alternatives",
    primaryKeyword: "press release distribution alternatives",
    secondaryKeywords: [
      "cision pr newswire alternative",
      "cheap pr distribution",
      "business wire alternatives",
    ],
    intent: "commercial",
    title: "Press Release Distribution Alternatives (2026)",
    metaDescription:
      "PR Newswire and Business Wire are pricey. 7 distribution alternatives — cost, reach, SEO value, and when wires still matter.",
    h1: "Press Release Distribution Alternatives in 2026",
    publishedAt: today,
    updatedAt: today,
    intro:
      "Paid wire distribution used to be the default. In 2026, most coverage comes from direct journalist outreach, not from wire pickup. But wires still matter for regulatory disclosure, SEO syndication, and IR — so the question isn't 'wire or no wire,' it's 'which wire and how often.'",
    problemFraming:
      "Three questions decide it: (1) are you required to publish on a wire for compliance, (2) is wide syndication worth $300–$1,000 per release, (3) would direct pitching to 20 journalists outperform a wire blast. For most early-stage companies, the answer to #3 is yes.",
    items: [
      {
        name: "Direct outreach (Media AI)",
        blurb:
          "Skip the wire entirely. Pitch the 20 journalists who actually cover your beat — usually a higher pickup rate than a wire blast.",
        bestFor: "Startups, scale-ups, and any company where wire isn't a legal requirement.",
        pricing: "From <$100/mo.",
        link: "/signup",
      },
      {
        name: "EZ Newswire",
        blurb: "Low-cost wire with reasonable syndication network.",
        bestFor: "Teams that need a cheap wire for occasional releases.",
        pricing: "From ~$300 per release.",
      },
      {
        name: "Newswire.com",
        blurb: "Mid-tier wire with optional media outreach add-ons.",
        bestFor: "Teams wanting wire + light outreach in one bill.",
        pricing: "From ~$300 per release.",
      },
      {
        name: "PR Newswire",
        blurb: "The enterprise default. Strong syndication, expensive per release.",
        bestFor: "Public companies and regulatory disclosure.",
        pricing: "From ~$800 per release.",
      },
      {
        name: "Business Wire",
        blurb: "PR Newswire's main competitor, often used for IR releases.",
        bestFor: "Public companies needing IR-grade distribution.",
        pricing: "From ~$800 per release.",
      },
      {
        name: "GlobeNewswire",
        blurb: "Solid mid-market wire with Nasdaq-backed distribution.",
        bestFor: "Mid-cap public companies.",
        pricing: "From ~$500 per release.",
      },
      {
        name: "Press Release Jet / OpenPR",
        blurb: "Cheapest distribution. Mostly SEO value, low pickup.",
        bestFor: "Teams that only need a published URL.",
        pricing: "Free–$100.",
      },
    ],
    faq: [
      {
        q: "Do press releases still get coverage?",
        a: "Wires rarely generate top-tier coverage on their own. The story gets picked up because a journalist already cares — and they care because someone pitched them. Use wires for syndication and SEO, not for primary outreach.",
      },
      {
        q: "What's the cheapest credible wire?",
        a: "EZ Newswire and Newswire.com start around $300 per release with reasonable syndication. Avoid sub-$100 services unless you only need a published URL.",
      },
      {
        q: "Can I skip wire distribution entirely?",
        a: "If you're not required to publish for regulatory reasons, yes. Direct outreach to 20–50 journalists typically outperforms a wire blast for early-stage companies.",
      },
    ],
    related: [
      { label: "Cision alternatives", to: "/guides/cision-alternatives" },
      { label: "Best AI tools for PR teams", to: "/guides/best-ai-tools-for-pr-teams" },
      { label: "Press release structure builder", to: "/tools/press-release-structure-builder" },
      { label: "Press release templates", to: "/resources/press-release-templates-by-announcement-type" },
    ],
    ctaPrimary: { label: "Skip the wire — pitch journalists directly", to: "/signup" },
    ctaSecondary: { label: "Build a press release", to: "/tools/press-release-structure-builder" },
  },

  // ─────────────────────────── #8 best-pr-outreach-tools ───────────────────────────
  {
    slug: "best-pr-outreach-tools",
    kind: "best",
    cluster: "PR outreach tools",
    primaryKeyword: "pr outreach tools",
    secondaryKeywords: ["best pr software", "pr outreach platforms", "media outreach tools"],
    intent: "commercial",
    title: "Best PR Outreach Tools in 2026 (Picked by Use Case)",
    metaDescription:
      "The PR outreach tools worth paying for in 2026 — by team size, budget, and workflow. AI-first picks plus enterprise options.",
    h1: "Best PR Outreach Tools for Every Team Size",
    publishedAt: today,
    updatedAt: today,
    intro:
      "Every PR tool claims to do outreach. Most are just databases with a mail-merge bolted on. The ones worth paying for handle the hard parts: surfacing the right journalist, drafting a credible first pitch, and tracking what replied.",
    problemFraming:
      "Buy for the workflow, not the feature list. A solo founder doesn't need an enterprise CRM. An agency with 12 clients doesn't need a single-seat tool. Pick the tool whose primary use case matches your team's actual day.",
    items: [
      {
        name: "Media AI",
        blurb:
          "AI-native discovery + drafting + outreach. Plain-English search, pitch personalization, and monthly pricing.",
        bestFor: "Founders, startup PR teams, and agencies under 50 seats.",
        pricing: "From <$100/mo.",
        pros: ["Self-serve", "AI search + drafting", "Monthly billing"],
        cons: ["Not a full monitoring suite"],
        link: "/signup",
      },
      {
        name: "Muck Rack",
        blurb: "Mid-market PR CRM with a strong DB.",
        bestFor: "Mid-market PR teams comfortable with annual contracts.",
        pricing: "~$5K+/year.",
        link: "/compare/muck-rack",
      },
      {
        name: "Prowly",
        blurb: "PR CRM with newsroom hosting, lighter DB.",
        bestFor: "Agencies + in-house comms needing a branded newsroom.",
        pricing: "From ~$258/mo.",
      },
      {
        name: "Prezly",
        blurb: "Comms CRM focused on storytelling and newsroom workflows.",
        bestFor: "In-house comms teams.",
        pricing: "From ~$70/mo + add-ons.",
      },
      {
        name: "Cision",
        blurb: "Enterprise suite with wire distribution.",
        bestFor: "Enterprise teams that need wire + DB in one contract.",
        pricing: "$7K–$50K+/year.",
        link: "/compare/cision",
      },
      {
        name: "Free PR tool suite",
        blurb: "24 single-purpose tools for the specific steps in your workflow.",
        bestFor: "Solo founders who want free leverage before paying.",
        pricing: "Free.",
        link: "/tools",
      },
    ],
    faq: [
      {
        q: "Do I need a PR outreach tool or just a CRM?",
        a: "A general CRM (HubSpot, Pipedrive) lacks journalist data and beat targeting. A PR outreach tool brings the database, the personalization signals, and the workflow into one place. Use both — the PR tool for outreach, the CRM for downstream tracking.",
      },
      {
        q: "What's the smallest team that benefits from a paid tool?",
        a: "One person, if they're doing 3+ pitches a week. Below that, the free tool suite plus ChatGPT covers it.",
      },
      {
        q: "How do I evaluate before buying?",
        a: "Insist on self-serve trial. If a vendor refuses to let you try the product without a sales call, you're paying for the sales process — not the software.",
      },
    ],
    related: [
      { label: "Best AI tools for PR teams", to: "/guides/best-ai-tools-for-pr-teams" },
      { label: "Muck Rack alternatives", to: "/guides/muck-rack-alternatives" },
      { label: "Media AI vs Muck Rack", to: "/compare/muck-rack" },
      { label: "Free PR tools", to: "/tools" },
    ],
    ctaPrimary: { label: "Try Media AI free", to: "/signup" },
    ctaSecondary: { label: "Browse free PR tools", to: "/tools" },
  },

  // ─────────────────────────── #9 media-pitch-subject-lines ───────────────────────────
  {
    slug: "media-pitch-subject-lines",
    kind: "templates",
    cluster: "media pitch templates",
    primaryKeyword: "media pitch subject line",
    secondaryKeywords: ["pr email subject lines", "journalist email subject", "pitch subject line examples"],
    intent: "informational",
    title: "25 Media Pitch Subject Lines That Get Opened",
    metaDescription:
      "25 pitch subject line templates by story type — funding, launch, data, expert source. Plus the rules behind why they work.",
    h1: "25 Media Pitch Subject Lines That Actually Get Opened",
    publishedAt: today,
    updatedAt: today,
    intro:
      "The subject line decides whether your pitch gets opened. Journalists triage hundreds of emails a day on mobile — you have about six words to convince them this one is worth a tap. The templates below all follow the same three rules: be specific, lead with the news, and never use the word 'exciting.'",
    problemFraming:
      "Three rules: (1) ≤ 60 characters so it doesn't truncate on mobile, (2) lead with the strongest concrete noun (company name, dollar figure, surprising number) — never 'Pitch:' or 'Hi,' (3) match the subject to the body. A clickbait subject with a weak pitch underneath burns your reputation with that journalist.",
    examples: [
      {
        label: "Funding (4)",
        whenToUse: "Series A–C announcements, exclusive or wide.",
        body: `Exclusive — [Company] raises $[X]M Series [A/B]
[Company] raises $[X]M led by [Lead] — exclusive?
$[X]M to fix [problem] — [Company] Series [A/B]
[Company] hits Series [A/B]: $[X]M for [vision]`,
      },
      {
        label: "Product launch (4)",
        whenToUse: "Net-new product or major feature launch.",
        body: `New: [Product] — [the one specific outcome]
[Company] launches [Product] for [audience]
[Product]: [the thing it kills, e.g. "the end of X"]
First look — [Product] ships [date]`,
      },
      {
        label: "Data story (4)",
        whenToUse: "You have a unique dataset and a sharp finding.",
        body: `New data: [headline finding in ≤8 words]
We analyzed [N] [thing]. Here's what broke.
[Surprising stat] — full report inside
Exclusive data — [counterintuitive finding]`,
      },
      {
        label: "Expert source / commentary (4)",
        whenToUse: "Breaking news, you can offer a quote fast.",
        body: `Source on [topic] — available today
[Founder], [credibility line], on [news]
Quote available — [news] from [Company]'s POV
Re: [news] — sharp take from [Founder]`,
      },
      {
        label: "Partnership / customer announcement (3)",
        whenToUse: "Major customer or partner reveal.",
        body: `[Company] + [Big customer]: [outcome]
[Big customer] picks [Company] for [use case]
Why [Big customer] moved to [Company]`,
      },
      {
        label: "Newsjack (3)",
        whenToUse: "Big news broke in last 24h and you have a real angle.",
        body: `Re: [today's news] — the angle nobody's covering
[Today's news] from the [your category] side
[Founder] on [today's news] — fresh take`,
      },
      {
        label: "Follow-up (3)",
        whenToUse: "First pitch got no reply. Send once.",
        body: `Re: [original subject]
Quick bump — [one new development]
[Original subject] — one more thing`,
      },
    ],
    faq: [
      {
        q: "What's the ideal subject line length?",
        a: "Under 60 characters. Past 60, most mobile clients truncate — and the front half is what gets read.",
      },
      {
        q: "Should I use the journalist's name in the subject line?",
        a: "Almost never. It feels like a mail-merge tell. Save the personalization for the first line of the body where it can be specific.",
      },
      {
        q: "What words kill open rates?",
        a: "'Exciting,' 'thrilled,' 'innovative,' 'disruptive,' 'game-changing,' and anything that sounds like a press release adjective. Concrete nouns and numbers beat adjectives every time.",
      },
    ],
    related: [
      { label: "Media pitch email templates", to: "/guides/media-pitch-email-templates" },
      { label: "Subject line split-tester", to: "/tools/subject-line-split-tester" },
      { label: "Pitch fit score calculator", to: "/tools/pitch-fit-score-calculator" },
      { label: "Pitch personalization helper", to: "/tools/pitch-personalization-helper" },
    ],
    ctaPrimary: { label: "Find the right journalists in Media AI", to: "/signup" },
    ctaSecondary: { label: "Test your subject line (free)", to: "/tools/subject-line-split-tester" },
  },

  // ─────────────────────────── #10 find-journalists-by-beat ───────────────────────────
  {
    slug: "find-journalists-by-beat",
    kind: "best",
    cluster: "find journalists by beat",
    primaryKeyword: "find journalists by beat",
    secondaryKeywords: ["journalist database by topic", "how to find journalists", "find reporters by beat"],
    intent: "commercial",
    title: "How to Find Journalists by Beat (Free & Paid)",
    metaDescription:
      "The 5 ways PR teams actually find journalists by beat in 2026 — from free Twitter search to AI-native databases.",
    h1: "How to Find Journalists by Beat in 2026",
    publishedAt: today,
    updatedAt: today,
    intro:
      "A 'beat' is the topic a journalist actually writes about — not their job title, not the outlet they work for. The mistake most PR people make is pitching reporters whose title sounds right but whose last 10 stories had nothing to do with your news.",
    problemFraming:
      "Start from recent bylines, not the masthead. A journalist who 'covers tech' might have written about consumer hardware for the last year. Always verify with their last 5–10 pieces before adding to a list. Below: 5 ways to do this, ranked from free-and-slow to paid-and-fast.",
    items: [
      {
        name: "Method 1 — Google + 'site:' search (free)",
        blurb:
          "Search `site:outlet.com [your topic]` to find every recent piece on your beat at that outlet. The recurring bylines are your shortlist.",
        bestFor: "Pre-product founders sending 1–5 pitches per quarter.",
        pricing: "Free.",
        cons: ["Manual", "No email", "Slow"],
      },
      {
        name: "Method 2 — Twitter/X advanced search (free)",
        blurb:
          "Search journalists' tweets for keywords. Bonus: you see their current obsessions, not just published work.",
        bestFor: "Real-time newsjacking and finding writers between staff jobs.",
        pricing: "Free.",
        cons: ["No structured contact info"],
      },
      {
        name: "Method 3 — Newsletter scraping (free–cheap)",
        blurb:
          "Many beat reporters write newsletters (Substack, Beehiiv). The 'about' page often has direct contact and beat focus.",
        bestFor: "Niche beats where the writer has gone independent.",
        pricing: "Free.",
      },
      {
        name: "Method 4 — Legacy DB (Muck Rack, Cision)",
        blurb:
          "Boolean-first search across structured journalist records. Good coverage, dated UX, annual contracts.",
        bestFor: "Mid-market and enterprise teams.",
        pricing: "$5K–$50K+/year.",
        link: "/compare/muck-rack",
      },
      {
        name: "Method 5 — AI-native DB (Media AI)",
        blurb:
          "Describe the journalist in plain English ('reporters covering AI infrastructure at top-5 US outlets, last story <30 days ago'). The DB does the Boolean for you.",
        bestFor: "Anyone who values their hours.",
        pricing: "From <$100/mo.",
        pros: ["Plain-English search", "50K+ journalists", "Filter by recent coverage"],
        link: "/signup",
      },
    ],
    faq: [
      {
        q: "How do I verify a journalist still covers a beat?",
        a: "Check their last 5 bylines. If 3+ are off-topic, they've moved on. Beats shift faster than masthead pages update.",
      },
      {
        q: "Are free methods enough?",
        a: "For 1–5 pitches a quarter, yes. Past that, the time cost outweighs the subscription cost — most teams hit the breakeven at around 10 pitches per month.",
      },
      {
        q: "What's the best way to find freelance journalists?",
        a: "Twitter/X bios and newsletters beat traditional databases for freelancers. Many AI-native tools (including Media AI) also index recent bylines regardless of staff status.",
      },
    ],
    related: [
      { label: "Best AI tools for PR teams", to: "/guides/best-ai-tools-for-pr-teams" },
      { label: "Beat + outlet matcher", to: "/tools/beat-outlet-matcher" },
      { label: "Media AI vs Muck Rack", to: "/compare/muck-rack" },
      { label: "Build a media list that gets replies", to: "/resources/build-a-media-list-that-gets-replies" },
    ],
    ctaPrimary: { label: "Search journalists by beat in Media AI", to: "/signup" },
    ctaSecondary: { label: "Match beats free", to: "/tools/beat-outlet-matcher" },
  },

  // ─────────────────────────── #11 prowly-vs-muck-rack ───────────────────────────
  {
    slug: "prowly-vs-muck-rack",
    kind: "vs",
    cluster: "journalist database comparisons",
    primaryKeyword: "prowly vs muck rack",
    secondaryKeywords: ["muck rack vs prowly", "prowly or muck rack", "prowly muck rack comparison"],
    intent: "commercial",
    title: "Prowly vs Muck Rack: Pricing & Features Compared",
    metaDescription:
      "Prowly vs Muck Rack: journalist database, AI, pricing, and which PR teams pick each. Plus a cheaper third option.",
    h1: "Prowly vs Muck Rack: Which PR Tool Wins?",
    publishedAt: today,
    updatedAt: today,
    intro:
      "Prowly and Muck Rack target a similar buyer — mid-market PR teams that want one tool for discovery, outreach, and reporting — but they're built around different bets. Prowly leans CRM + newsroom hosting. Muck Rack leans database depth.",
    problemFraming:
      "Pick Prowly if you publish releases on a branded newsroom and want CRM workflows for journalists. Pick Muck Rack if database coverage and search depth matter more than newsroom hosting. If you want neither legacy UI, look at a modern AI-first option.",
    comparison: {
      headers: ["Feature", "Prowly", "Muck Rack"],
      rows: [
        { feature: "Starting price", a: "~$258/mo", b: "~$5K/year" },
        { feature: "Contract", a: "Monthly or annual", b: "Annual" },
        { feature: "Self-serve trial", a: "Yes", b: "No" },
        { feature: "Database size", a: "~1M+ contacts", b: "~1M+ journalists" },
        { feature: "Newsroom hosting", a: "Yes", b: "No" },
        { feature: "AI features", a: "Light", b: "Bolted on" },
        { feature: "Search style", a: "Filters + Boolean", b: "Boolean-first" },
        { feature: "Reporting", a: "Built-in", b: "Built-in" },
        { feature: "Best for", a: "Comms teams w/ newsroom", b: "Outreach-heavy PR" },
      ],
    },
    faq: [
      {
        q: "Is Prowly cheaper than Muck Rack?",
        a: "On entry pricing, yes — Prowly starts at $258/mo (~$3K/year) vs Muck Rack's ~$5K+/year. But Prowly's higher tiers catch up quickly once you add seats and the larger contact tiers.",
      },
      {
        q: "Which has the bigger journalist database?",
        a: "Both claim ~1M+ contacts. In practice, Muck Rack tends to have richer journalist-specific metadata; Prowly's database is broader but lighter on per-journalist signals like recent bylines.",
      },
      {
        q: "Is there a cheaper alternative to both?",
        a: "Yes. AI-first tools like Media AI start under $100/mo with monthly billing and cover the discovery + pitching workflow most teams use day-to-day.",
      },
    ],
    related: [
      { label: "Muck Rack vs Cision", to: "/guides/muck-rack-vs-cision" },
      { label: "Muck Rack alternatives", to: "/guides/muck-rack-alternatives" },
      { label: "Media AI vs Muck Rack", to: "/compare/muck-rack" },
      { label: "Best PR outreach tools", to: "/guides/best-pr-outreach-tools" },
    ],
    ctaPrimary: { label: "See a modern alternative", to: "/compare/muck-rack" },
    ctaSecondary: { label: "Try Media AI free", to: "/signup" },
  },

  // ─────────────────────────── #12 pr-pitch-templates-by-announcement-type ───────────────────────────
  {
    slug: "pr-pitch-templates-by-announcement-type",
    kind: "templates",
    cluster: "media pitch templates",
    primaryKeyword: "pr pitch templates",
    secondaryKeywords: ["pitch templates by announcement type", "pr templates", "press pitch examples"],
    intent: "informational",
    title: "PR Pitch Templates by Announcement Type",
    metaDescription:
      "Pitch templates for funding, product launches, partnerships, exclusives, expert sources — and when to use each.",
    h1: "PR Pitch Templates for Every Announcement Type",
    publishedAt: today,
    updatedAt: today,
    intro:
      "Different announcements need different pitch shapes. A funding pitch that reads like a product launch loses both stories. The templates below are organized by announcement type — pick the one that matches your news, then swap in the specifics.",
    problemFraming:
      "Three rules: (1) one template per story — never blend, (2) the first line must reference the journalist's actual recent work, (3) cut anything that doesn't survive a second read. If the news isn't in the first three lines, journalists won't get to it.",
    examples: [
      {
        label: "Funding round",
        whenToUse: "Seed–Series C announcements, single outlet exclusive or wide.",
        body: `Subject: [Company] raises $[X]M Series [A/B] to [vision]

Hi [First name],

Loved your [Month] piece on [specific story]. Wanted to flag our Series [X]:

• $[X]M led by [Lead], with [Notable]
• What we do: [one sentence, no jargon]
• Why now: [the wedge — growth, regulatory, market timing]
• Embargo: [day, time, tz]

Happy to set up a 20-min with [Founder] this week.

[Signature]`,
      },
      {
        label: "Product launch",
        whenToUse: "Net-new product or major feature ship.",
        body: `Subject: New: [Product] — [the one specific outcome]

Hi [First name],

Quick one given your beat on [topic]. [Product] launches [date] and [does specific thing] for [user].

The angle that matches your coverage: [specific angle].

Happy to send early access or a custom demo.

[Signature]`,
      },
      {
        label: "Partnership / customer win",
        whenToUse: "Major partner or marquee customer reveal.",
        body: `Subject: [Company] + [Partner/Customer]: [the outcome]

Hi [First name],

Following your work on [topic]. We just signed [Partner] for [use case]. Three things that make this newsworthy:

1. [Scale stat]
2. [Why it matters to the category]
3. [What it unlocks next]

Quote + assets ready. Embargo [date].

[Signature]`,
      },
      {
        label: "Exclusive offer",
        whenToUse: "You want one outlet first, then a wider release.",
        body: `Subject: Exclusive — [Company] [news in ≤8 words]

Hi [First name],

You're the first journalist I'm bringing this to. [News in one sentence.]

Why I think it fits [Outlet]: [specific angle].

Exclusive window: [day, time]. After that, we go wide.

Full materials ready. Reply and I'll send.

[Signature]`,
      },
      {
        label: "Expert source",
        whenToUse: "Breaking news, you can offer a quote within 2 hours.",
        body: `Subject: Source on [topic] — [credibility marker] available today

Hi [First name],

Saw your [outlet] piece on [news]. [Founder], who [credibility line], can offer a quote on [angle] today.

Two sample takes:
1. [Sharp POV]
2. [Specific data point]

Reply with deadline — I'll turn around in <1 hour.

[Signature]`,
      },
      {
        label: "Milestone / scale moment",
        whenToUse: "1M users, $100M ARR, anniversary — when the number is the story.",
        body: `Subject: [Company] hits [milestone] — [the lesson behind it]

Hi [First name],

We just crossed [milestone]. The interesting story isn't the number — it's [the surprising thing that drove it].

Three angles your readers would care about:
1. [Specific]
2. [Specific]
3. [Specific]

[Founder] available to talk on the record this week.

[Signature]`,
      },
    ],
    faq: [
      {
        q: "Should I send the same pitch to multiple journalists?",
        a: "Same template, different personalization. The first line and the angle should change for every recipient — everything else can stay.",
      },
      {
        q: "When should I offer an exclusive?",
        a: "When you have one outlet that genuinely moves the needle for your audience, and you can give them 3–5 days lead time. Otherwise, a wide pitch with strong personalization beats a bad exclusive.",
      },
      {
        q: "Do I need a press release for every announcement?",
        a: "No. A press release is a reference doc, not a pitch. Send the pitch first; the release is the attachment if they want details.",
      },
    ],
    related: [
      { label: "Media pitch email templates", to: "/guides/media-pitch-email-templates" },
      { label: "25 media pitch subject lines", to: "/guides/media-pitch-subject-lines" },
      { label: "Press release structure builder", to: "/tools/press-release-structure-builder" },
      { label: "Pitch fit score calculator", to: "/tools/pitch-fit-score-calculator" },
    ],
    ctaPrimary: { label: "Find the right journalists in Media AI", to: "/signup" },
    ctaSecondary: { label: "Score your pitch (free)", to: "/tools/pitch-fit-score-calculator" },
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
