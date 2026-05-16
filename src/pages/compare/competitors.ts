export type Competitor = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  summary: string;
  bestFor: string;
  pricing: string;
  weaknesses: string[];
  mediaAdvantages: string[];
  comparison: { feature: string; mediaAi: string; competitor: string }[];
  faq: { q: string; a: string }[];
};

const baseMediaRow = (mediaAi: string, competitor: string, feature: string) => ({ feature, mediaAi, competitor });

export const COMPETITORS: Competitor[] = [
  {
    slug: "muck-rack",
    name: "Muck Rack",
    tagline: "PR software for media monitoring and journalist outreach",
    category: "PR & Media Database",
    summary:
      "Muck Rack is a well-known PR platform with a large journalist database, social listening, and reporting. It is popular with mid-market and enterprise comms teams but locks core features behind annual contracts and opaque pricing.",
    bestFor: "Enterprise comms teams that need procurement-friendly contracts and prefer a traditional Boolean search workflow.",
    pricing: "Custom annual contracts, typically $5,000–$30,000+/year. No public pricing or self-serve plan.",
    weaknesses: [
      "Annual contracts with sales-led pricing — no self-serve trial",
      "Search is Boolean-first; natural-language queries are limited",
      "Coverage of international journalists and creators is uneven",
      "AI features are bolted on top of a legacy product",
    ],
    mediaAdvantages: [
      "Describe who you want to reach in plain English — no Boolean strings",
      "Transparent monthly pricing starting at a fraction of Muck Rack",
      "50,000+ verified journalists and creators across PR, social, and YouTube",
      "Cancel anytime, no annual lock-in",
    ],
    comparison: [
      baseMediaRow("Natural-language AI search", "Boolean-first search", "Search experience"),
      baseMediaRow("Transparent monthly pricing", "Custom annual contracts", "Pricing"),
      baseMediaRow("Self-serve trial", "Sales call required", "Onboarding"),
      baseMediaRow("Journalists + creators in one DB", "Mostly journalists", "Coverage"),
      baseMediaRow("Built AI-first in 2024", "Legacy platform with AI bolted on", "Architecture"),
      baseMediaRow("Cancel anytime", "Annual lock-in", "Commitment"),
    ],
    faq: [
      {
        q: "Is Media AI cheaper than Muck Rack?",
        a: "Yes. Media AI starts at transparent monthly pricing — no annual contract, no sales call. Most Muck Rack contracts start in the five figures per year.",
      },
      {
        q: "Does Media AI have the same journalist coverage as Muck Rack?",
        a: "Media AI maintains a database of 50,000+ verified journalists and creators that is continually refreshed. Coverage is competitive in the US, EU, and APAC, and stronger for creator-led media.",
      },
      {
        q: "Can I import my Muck Rack lists?",
        a: "Yes. Export your existing lists as CSV and import them directly into Media AI in seconds.",
      },
    ],
  },
  {
    slug: "cision",
    name: "Cision",
    tagline: "Legacy PR suite for media outreach, monitoring, and distribution",
    category: "Enterprise PR Suite",
    summary:
      "Cision is one of the largest PR suites with a deep database, PR Newswire distribution, and broad monitoring. It is also one of the most expensive and complex tools on the market, with a reputation for outdated contact data and aggressive sales motions.",
    bestFor: "Large enterprises that need wire distribution bundled with media database and monitoring.",
    pricing: "Custom annual contracts, often $7,000–$50,000+/year per seat-bundle.",
    weaknesses: [
      "Notoriously high pricing and multi-year contracts",
      "Database accuracy has long been a customer complaint",
      "Dense, feature-bloated UI with a steep learning curve",
      "Slow to adopt modern AI workflows",
    ],
    mediaAdvantages: [
      "AI-first interface — pitch in plain English",
      "Fresh, verified contacts updated continuously",
      "A fraction of Cision's cost, billed monthly",
      "No procurement, no annual lock-in",
    ],
    comparison: [
      baseMediaRow("AI-native chat search", "Legacy database UI", "Search experience"),
      baseMediaRow("From <$100/mo", "$7K–$50K+/year contracts", "Pricing"),
      baseMediaRow("Continuously refreshed contacts", "Often-outdated records", "Data freshness"),
      baseMediaRow("Lean, focused product", "Feature-bloated suite", "Product design"),
      baseMediaRow("Self-serve, instant access", "Sales-led, long procurement", "Onboarding"),
    ],
    faq: [
      {
        q: "Does Media AI replace Cision?",
        a: "For most PR teams under 50 people, yes. Media AI covers media database, AI pitching, and list management. Teams that need PR Newswire distribution can pair Media AI with a standalone wire service for far less than a Cision contract.",
      },
      {
        q: "How does pricing compare to Cision?",
        a: "Media AI is typically 80–95% cheaper than a Cision contract and is billed monthly with no annual commitment.",
      },
    ],
  },
  {
    slug: "meltwater",
    name: "Meltwater",
    tagline: "Media intelligence and social listening platform",
    category: "Media Monitoring & PR Database",
    summary:
      "Meltwater is a large media intelligence suite covering monitoring, social listening, and a journalist database. It serves enterprise PR and marketing teams but is known for long contracts, high prices, and a UI that requires significant training.",
    bestFor: "Enterprises that need monitoring + social listening + journalist database under one contract.",
    pricing: "Custom annual contracts, typically $6,000–$25,000+/year.",
    weaknesses: [
      "Long annual contracts and aggressive renewal terms",
      "Heavy UI with many modules most teams never use",
      "Database freshness varies by region",
      "Limited creator/influencer coverage",
    ],
    mediaAdvantages: [
      "Built for modern PR — pitching, not just monitoring",
      "Includes creator coverage out of the box",
      "Transparent monthly pricing",
      "Lightweight UI that ships value in minutes",
    ],
    comparison: [
      baseMediaRow("Plain-English contact search", "Boolean + filters", "Search"),
      baseMediaRow("Monthly, transparent pricing", "Custom annual contracts", "Pricing"),
      baseMediaRow("Journalists + creators", "Journalists, light on creators", "Coverage"),
      baseMediaRow("Lean focused product", "Multi-module suite", "Product design"),
    ],
    faq: [
      {
        q: "Is Media AI a media monitoring tool like Meltwater?",
        a: "Media AI focuses on finding the right journalists and creators and helping you pitch them. We include keyword monitoring for your brand, but we are not a full social-listening replacement.",
      },
      {
        q: "Can I get out of my Meltwater contract early?",
        a: "Most Meltwater contracts auto-renew and require a written notice period (usually 60–90 days). Media AI has no annual commitment — cancel anytime in one click.",
      },
    ],
  },
  {
    slug: "grin",
    name: "GRIN",
    tagline: "Creator management platform for ecommerce brands",
    category: "Influencer Marketing Platform",
    summary:
      "GRIN is a creator management platform popular with DTC ecommerce brands. It focuses on relationship management, product seeding, and payments — but the contract floor is high and the workflow assumes you already know which creators you want to work with.",
    bestFor: "DTC brands running large, ongoing creator gifting and affiliate programs.",
    pricing: "Custom annual contracts starting around $20,000/year.",
    weaknesses: [
      "High contract floor — overkill for early-stage brands",
      "Discovery is weaker than dedicated databases",
      "Heavy onboarding and CSM-driven workflow",
      "Mostly Instagram/TikTok focus, weaker on YouTube and traditional press",
    ],
    mediaAdvantages: [
      "Combined journalist + creator discovery in one place",
      "Self-serve, no annual contract",
      "Strong on Instagram, TikTok, YouTube, and earned media",
      "AI search to find creators by audience and topic, not just handle",
    ],
    comparison: [
      baseMediaRow("From <$100/mo, monthly billing", "$20K+/year annual contracts", "Pricing"),
      baseMediaRow("Discovery + journalists + creators", "Creator workflow / weaker discovery", "Scope"),
      baseMediaRow("AI search by audience and topic", "Manual filters", "Discovery"),
      baseMediaRow("Self-serve in minutes", "Sales call + onboarding", "Onboarding"),
    ],
    faq: [
      {
        q: "Does Media AI handle creator payments like GRIN?",
        a: "No — Media AI focuses on discovery, outreach, and list management. Most teams that switch from GRIN pair Media AI with a lightweight payments tool or pay creators directly.",
      },
      {
        q: "Is Media AI good for ecommerce brands?",
        a: "Yes. Ecommerce teams use Media AI to find both press and creators for product launches, with one tool instead of two.",
      },
    ],
  },
  {
    slug: "hypeauditor",
    name: "HypeAuditor",
    tagline: "Influencer analytics and audience quality scoring",
    category: "Influencer Analytics",
    summary:
      "HypeAuditor is best known for audience-quality analytics and fraud detection on Instagram, TikTok, and YouTube. It is a strong vetting tool but a weaker end-to-end PR/creator platform — you still need a separate tool for outreach and journalist coverage.",
    bestFor: "Brands and agencies that need deep audience analytics before paying a creator.",
    pricing: "Paid plans from ~$399/month and up; enterprise tiers run much higher.",
    weaknesses: [
      "Analytics-focused; not a true outreach or PR tool",
      "No journalist coverage",
      "Workflow gaps — exports needed to use elsewhere",
      "Pricing escalates quickly for full feature access",
    ],
    mediaAdvantages: [
      "Journalists + creators in one searchable database",
      "Full pitching and list workflow built in",
      "Transparent monthly pricing with generous discovery",
      "AI search beats manual filter-stacking",
    ],
    comparison: [
      baseMediaRow("Discovery + outreach + lists", "Analytics only", "Scope"),
      baseMediaRow("Journalists + creators", "Creators only", "Coverage"),
      baseMediaRow("From <$100/mo", "From ~$399/mo", "Pricing"),
      baseMediaRow("AI plain-English search", "Filter-based discovery", "Search"),
    ],
    faq: [
      {
        q: "Does Media AI vet creator audience quality?",
        a: "Media AI surfaces follower counts, engagement signals, and topic relevance for creators. For deep audience-fraud analysis, some teams pair Media AI with a vetting tool — but most find Media AI sufficient for outreach decisions.",
      },
    ],
  },
  {
    slug: "later",
    name: "Later",
    tagline: "Social media scheduling and influencer marketing platform",
    category: "Social Scheduling + Influencer",
    summary:
      "Later started as a social-media scheduling tool and has expanded into influencer marketing. It is strong for content planning and visual calendars but is not a media database — there is no journalist coverage, and creator discovery is limited compared with dedicated tools.",
    bestFor: "Brands that need a single tool for social scheduling plus light influencer marketing.",
    pricing: "Influencer plans start in the low thousands per month; scheduling plans are cheaper.",
    weaknesses: [
      "No journalist or earned-media coverage",
      "Influencer discovery is limited vs. dedicated databases",
      "Two products in one — neither is best-in-class",
      "Expensive once you turn on the influencer module",
    ],
    mediaAdvantages: [
      "Built specifically for PR + influencer outreach, not scheduling",
      "Journalists + creators in one place",
      "Far deeper discovery and AI search",
      "Transparent monthly pricing",
    ],
    comparison: [
      baseMediaRow("Discovery + outreach for PR + creators", "Scheduling + light influencer", "Scope"),
      baseMediaRow("50K+ journalists and creators", "Limited creator DB", "Coverage"),
      baseMediaRow("AI plain-English search", "Manual filters", "Discovery"),
      baseMediaRow("From <$100/mo", "Influencer plans start $1K+/mo", "Pricing"),
    ],
    faq: [
      {
        q: "Does Media AI schedule social posts like Later?",
        a: "No. Media AI focuses on finding and pitching journalists and creators. Most teams keep their scheduling tool and add Media AI for outreach.",
      },
    ],
  },
  {
    slug: "impact-com",
    name: "Impact.com",
    tagline: "Partnership and affiliate management platform",
    category: "Partnership / Affiliate Platform",
    summary:
      "Impact.com is a partnership automation platform focused on affiliates, publishers, and large creator programs. It is built for tracking, contracts, and payouts at scale — not for discovery or pitching journalists.",
    bestFor: "Brands running large affiliate and partnerships programs with payouts at scale.",
    pricing: "Enterprise contracts, typically high five figures and up annually.",
    weaknesses: [
      "Built for tracking and payouts, not discovery",
      "No journalist database",
      "Complex onboarding and configuration",
      "Overkill for teams that need media outreach",
    ],
    mediaAdvantages: [
      "Built for discovery + pitching, not affiliate tracking",
      "Journalists + creators in one searchable DB",
      "Self-serve, monthly pricing",
      "AI-first search and pitch workflow",
    ],
    comparison: [
      baseMediaRow("Discovery + outreach", "Tracking + payouts", "Core focus"),
      baseMediaRow("Journalists + creators", "Affiliates + partners", "Audience"),
      baseMediaRow("Monthly, transparent", "Enterprise annual", "Pricing"),
      baseMediaRow("Self-serve onboarding", "Sales-led implementation", "Onboarding"),
    ],
    faq: [
      {
        q: "Does Media AI track affiliate sales?",
        a: "No. Media AI is for finding and pitching journalists and creators. Teams running affiliate programs typically keep Impact.com (or similar) for tracking and use Media AI for outreach.",
      },
    ],
  },
];

export const getCompetitor = (slug: string) =>
  COMPETITORS.find((c) => c.slug === slug);
