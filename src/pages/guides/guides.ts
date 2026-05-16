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
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
