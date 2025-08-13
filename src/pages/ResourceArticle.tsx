import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { updatePageSEO, addStructuredData } from "@/utils/seo";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  ArrowRight, 
  Clock, 
  Share2, 
  BookOpen,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Users,
  TrendingUp,
  FileText,
  Shield,
  Lightbulb,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ArticleData {
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  category: string;
  readingTime: string;
  icon: any;
  sections: { heading: string; content: string[]; }[];
  faqs: { question: string; answer: string; }[];
  mediaAIBenefits: string[];
  relatedResources: { title: string; slug: string; }[];
  relatedTools: { title: string; slug: string; }[];
  cta: string;
}

const ResourceArticle = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [showLeadCapture, setShowLeadCapture] = useState(false);

  // Create a default article template for all articles
  const createDefaultArticle = (title: string, slug: string, category: string, icon: any, readingTime: string = "6 min read"): ArticleData => ({
    title,
    metaTitle: title,
    metaDescription: `Expert guide on ${title.toLowerCase()}. Professional strategies and actionable insights for PR teams.`,
    h1: title,
    intro: `Learn professional strategies and best practices for ${title.toLowerCase()}. This comprehensive guide provides actionable insights for PR professionals.`,
    category,
    readingTime,
    icon,
    sections: [
      {
        heading: "Overview",
        content: [
          `This comprehensive guide covers the essential strategies and best practices for ${title.toLowerCase()}.`,
          "Learn from industry experts and implement proven techniques that deliver measurable results.",
          "Whether you're a PR professional or business leader, this guide provides actionable insights you can use immediately."
        ]
      },
      {
        heading: "Best Practices",
        content: [
          "Follow industry-standard approaches that have been tested and refined by leading PR professionals.",
          "Implement these strategies systematically to achieve consistent, measurable results.",
          "Adapt these frameworks to your specific industry and organizational needs."
        ]
      },
      {
        heading: "Implementation Guide",
        content: [
          "Start with clear objectives and measurable goals for your implementation.",
          "Build processes that can scale with your organization and campaign complexity.",
          "Monitor progress and optimize your approach based on real performance data."
        ]
      }
    ],
    faqs: [
      {
        question: "How do I get started with this strategy?",
        answer: "Begin by setting clear objectives and understanding your target audience. Then implement the frameworks outlined in this guide systematically."
      },
      {
        question: "What results can I expect?",
        answer: "Results vary based on implementation quality and consistency, but most organizations see measurable improvements within 30-60 days of proper implementation."
      }
    ],
    mediaAIBenefits: [
      "Access tools and databases to implement these strategies more effectively",
      "Track and measure your progress with comprehensive analytics",
      "Connect with the right journalists and influencers for your campaigns"
    ],
    relatedResources: [],
    relatedTools: [],
    cta: "Implement these strategies with Media AI's professional tools → Open Media AI"
  });

  // Article configurations for all 24 resources
  const articlesData: Record<string, ArticleData> = {
    "build-a-media-list-that-gets-replies": {
      title: "How to Build a Media List That Actually Gets Replies",
      metaTitle: "Media List That Gets Replies: A Practical Guide",
      metaDescription: "How to build targeted media lists that earn opens, replies, and coverage—without bloat.",
      h1: "How to Build a Media List That Actually Gets Replies",
      intro: "Stop wasting time on lists that don't convert. Learn how to build targeted media lists that earn opens, replies, and coverage—without the bloat. A well-crafted media list is the foundation of successful PR campaigns, yet most organizations struggle with low response rates and poor-quality contact databases.",
      category: "Pitching",
      readingTime: "12 min read",
      icon: Users,
      sections: [
        {
          heading: "Understanding the Media Landscape",
          content: [
            "The media landscape has fundamentally changed in the past decade. Traditional newsrooms have shrunk, journalists cover broader beats with tighter deadlines, and the volume of pitches has exploded. Understanding these dynamics is crucial for building effective media lists.",
            "Today's journalists receive hundreds of pitches weekly, with most being irrelevant or poorly targeted. They've become increasingly selective about what deserves their attention. This means your media list strategy must be precision-focused rather than spray-and-pray.",
            "The rise of digital-first publications, independent newsletters, and industry-specific podcasts has created new opportunities for targeted outreach. These emerging channels often provide better engagement rates than traditional tier-1 outlets for niche stories.",
            "Social media has also changed how journalists discover stories and sources. Many now rely on Twitter threads, LinkedIn posts, and industry communities for story ideas. Your media list strategy should account for these informal channels alongside traditional pitching."
          ]
        },
        {
          heading: "Define Your Story & Audience",
          content: [
            "Before building any list, you need absolute clarity on your story and who would genuinely care about it. This isn't just about your target market—it's about understanding which journalists cover stories like yours and what angles resonate with their readers.",
            "Start by conducting thorough competitive research. Analyze similar announcements in your space over the past 6-12 months. What angles did they take? Which publications covered them? Who wrote the stories? What headlines performed best? This research forms the foundation of your targeting strategy.",
            "Create a comprehensive story-audience matrix. Identify your primary angle, secondary angles, and potential tertiary angles. For each angle, map out the primary and secondary audiences. A funding announcement might have a primary angle of growth, but secondary angles around market validation or industry trends.",
            "Consider the timing and newsworthiness of your story. Is this breaking news, a trend analysis, or an evergreen feature? Different story types require different journalist targets and outreach strategies. Breaking news goes to daily reporters, while trend pieces work better with weekly or monthly publications.",
            "Document your key messaging pillars and supporting data points. Journalists need concrete information to build stories around. Prepare quotes, statistics, customer examples, and industry context that supports each potential angle of your story."
          ]
        },
        {
          heading: "Map Beats & Outlets Strategically",
          content: [
            "Not all tech reporters cover the same stories, and understanding beat specificity is crucial for list quality. Within major publications, journalists specialize in narrow areas: enterprise software, consumer apps, AI/ML, cybersecurity, fintech, or emerging technologies. Pitching a cybersecurity story to a consumer app reporter wastes everyone's time.",
            "Start with tier-1 outlets in your industry, but don't stop there. Map the specific beats within each publication using their staff pages, recent bylines, and social media bios. TechCrunch, for example, has different writers for startups, enterprise, AI, transportation, and policy—pitch the right person for your specific story angle.",
            "Tier-2 and tier-3 publications often provide better conversion rates than major outlets. Industry trade publications, regional business journals, and specialized newsletters may have smaller audiences but higher engagement with your target market. A fintech story might perform better in American Banker than in mainstream business media.",
            "Don't overlook emerging media formats. Podcast hosts, newsletter writers, and YouTube creators often have highly engaged audiences and more flexible content requirements. Many established journalists also run side newsletters or appear on industry podcasts—these can be easier entry points than their main publications.",
            "Create outlet categories based on reach, authority, and audience alignment. Tier-1 outlets provide broad awareness and social proof. Tier-2 outlets offer industry credibility and qualified leads. Tier-3 outlets deliver niche expertise and community engagement. A balanced media list includes all three tiers."
          ]
        },
        {
          heading: "Research Methodology for Journalist Qualification",
          content: [
            "Effective media list building requires systematic research methodology. Start with recent coverage analysis—if a journalist hasn't written about your topic area in the past 6 months, they're probably not actively covering that beat anymore. Industry priorities shift, and journalists change focus areas frequently.",
            "Look for journalists who have covered similar companies, funding rounds, product launches, or industry trends within the past 3-6 months. Recent activity indicates active interest in your space and suggests they'll be more receptive to relevant pitches. Use advanced search operators on publication websites and Google to find recent coverage patterns.",
            "Analyze the depth and quality of their coverage. Some journalists write brief news updates, while others produce in-depth analysis pieces. Match your story type to their preferred content format. If you have a complex technical story, target journalists who write longer-form pieces rather than those who focus on news briefs.",
            "Social media activity provides valuable insights into journalist interests and availability. Active Twitter users often share article previews, ask for sources, or discuss industry trends. LinkedIn profiles reveal career changes and current focus areas. However, respect boundaries—personal social media content is off-limits for pitching purposes.",
            "Verify contact information accuracy before adding journalists to your list. Email addresses change frequently, especially for freelance journalists. Publications often provide contact forms or generic editorial emails rather than direct addresses. Investment in accurate contact databases or verification tools pays dividends in deliverability rates."
          ]
        },
        {
          heading: "Building Your Qualified Contact Database",
          content: [
            "Quality over quantity always wins in media list building. A focused list of 50-100 highly relevant, recently active journalists will consistently outperform a scattered list of 500. Focus your efforts on building deep profiles rather than massive spreadsheets.",
            "Create detailed journalist profiles including beat coverage, recent articles, preferred story types, response patterns, and social media activity. Track their publication schedules, deadline patterns, and preferred communication methods. Some journalists prefer email, others respond better to Twitter DMs or LinkedIn messages.",
            "Organize your database by story type, industry vertical, and publication tier. This allows for targeted campaigns based on specific announcements or story angles. A product launch requires different journalist segments than a funding announcement or industry analysis piece.",
            "Implement a regular maintenance schedule for your media database. Journalists change beats, switch publications, or leave the industry frequently. Monthly database updates prevent embarrassing mistakes and improve response rates. Set up Google Alerts for journalists in your database to track career changes.",
            "Consider geographic and time zone factors for your outreach timing. West Coast tech journalists work different hours than East Coast business reporters. International journalists may require different story angles and local market context. Plan your outreach schedule accordingly."
          ]
        },
        {
          heading: "Advanced Segmentation Strategies",
          content: [
            "Sophisticated media lists go beyond basic demographics to include behavioral and preference-based segmentation. Group journalists by story preference (breaking news vs. analysis), source requirements (data-driven vs. narrative), and response patterns (quick turnaround vs. longer lead times).",
            "Create segment-specific messaging strategies. Data journalists respond to statistics and research findings. Narrative writers prefer customer stories and human-interest angles. Industry analysts want market context and competitive positioning. Tailor your approach to each segment's content preferences.",
            "Track engagement patterns across different journalist segments. Some prefer detailed background information upfront, while others want brief summaries with more details available on request. Some respond better to exclusive angles, while others prefer broad industry trends. Use these insights to optimize your outreach strategy.",
            "Consider seasonal and cyclical factors in your segmentation. Consumer journalists focus on holiday shopping trends in Q4. Enterprise journalists cover budget planning in Q1. B2B publications often have slower summer schedules. Plan your campaigns around these industry rhythms.",
            "Develop relationship tiers within your database. Primary contacts should receive regular updates and exclusive access. Secondary contacts get relevant but less frequent communication. Dormant contacts might receive quarterly newsletters or major announcement updates only."
          ]
        }
      ],
      faqs: [
        {
          question: "How big should a media list be?",
          answer: "Quality trumps quantity every time. A focused list of 50-100 highly relevant, recently active journalists typically performs better than a scattered list of 500. Start small and expand based on performance data. It's better to have strong relationships with 50 journalists than weak connections with 500."
        },
        {
          question: "Should I focus on beats or topics?",
          answer: "Both matter, but beats are more reliable predictors of interest. A journalist covering the AI beat is more likely to be interested in AI stories than someone who occasionally mentions AI but covers general business news. However, topic overlap can create opportunities for new angles and cross-beat stories."
        },
        {
          question: "How often should I update my media list?",
          answer: "Monthly updates are ideal for active lists. Journalists change beats, switch publications, and update contact information frequently. Set up Google Alerts for journalists in your database to track career changes, and verify contact information before major campaigns."
        },
        {
          question: "Is it worth including freelance journalists?",
          answer: "Absolutely. Freelance journalists often have more flexibility in story selection and faster decision-making processes. They frequently write for multiple publications, potentially multiplying your coverage opportunities. However, verify their current publication relationships and pitch accordingly."
        },
        {
          question: "How do I handle journalists who don't respond?",
          answer: "Non-response doesn't necessarily mean disinterest. Journalists are overwhelmed with pitches and may not respond to everything. Maintain these contacts in your database for future relevant stories, but don't over-follow-up. One polite follow-up after a week is typically sufficient."
        }
      ],
      mediaAIBenefits: [
        "Search 50,000+ journalists by beat, recent coverage, and engagement patterns with advanced filtering capabilities",
        "Get automatic alerts when journalists change beats or publications to keep your database current",
        "Access verified contact information and social profiles for targeted outreach with higher deliverability",
        "Track response rates and engagement patterns to optimize your list quality over time",
        "Generate segment-specific messaging based on journalist preferences and coverage history"
      ],
      relatedResources: [
        { title: "Crafting Personalized Pitches at Scale", slug: "personalized-pitches-at-scale" },
        { title: "Embargo Etiquette & Timing", slug: "embargo-etiquette-and-timing" }
      ],
      relatedTools: [
        { title: "Beat & Outlet Matcher", slug: "beat-outlet-matcher" },
        { title: "Media AI Query Builder", slug: "media-ai-query-builder" }
      ],
      cta: "Find the right journalists in minutes → Open Media AI"
    },

    "press-release-templates-by-announcement-type": {
      title: "Press Release Templates by Announcement Type",
      metaTitle: "Press Release Templates by Announcement Type",
      metaDescription: "Ready-to-use structures for funding, product, partnership, and event releases.",
      h1: "Press Release Templates by Announcement Type",
      intro: "Stop starting from scratch. Use these proven templates for funding, product launches, partnerships, and events—optimized for journalist preferences.",
      category: "Releases",
      readingTime: "7 min read",
      icon: FileText,
      sections: [
        {
          heading: "Funding Announcement Template",
          content: [
            "Funding announcements follow a specific structure that investors and journalists expect. Lead with the funding amount, round type, and lead investor in the headline and first paragraph.",
            "Include specific use-of-funds details—journalists want to know how the money will be deployed. Avoid vague statements like 'accelerate growth' and provide concrete plans.",
            "Quote both your CEO and a representative from the lead investor. The investor quote should explain why they invested and what they see in the market opportunity."
          ]
        },
        {
          heading: "Product Launch Template",
          content: [
            "Product releases should lead with the problem you're solving, not the features you're building. Journalists care about market impact, not technical specifications.",
            "Include customer validation early—beta user feedback, pilot program results, or early adoption metrics. Social proof drives coverage decisions.",
            "End with clear availability details: when, where, and how much. Journalists hate having to follow up for basic commercial information."
          ]
        }
      ],
      faqs: [
        {
          question: "How long should a press release be?",
          answer: "Aim for 300-500 words maximum. Journalists skim quickly—if they can't understand your story in 30 seconds, they'll move on."
        }
      ],
      mediaAIBenefits: [
        "Access press release templates optimized for each journalist's preferences",
        "Find journalists who regularly cover your announcement type",
        "Track which release formats get the best response rates"
      ],
      relatedResources: [
        { title: "A 30-Day PR Plan for Product Launches", slug: "30-day-pr-plan-for-product-launches" },
        { title: "PR for Funding Announcements", slug: "pr-for-funding-announcements" }
      ],
      relatedTools: [
        { title: "Press Release Structure Builder", slug: "press-release-structure-builder" },
        { title: "Quote Polisher for PR", slug: "quote-polisher-pr" }
      ],
      cta: "Generate target lists for each template → Open Media AI"
    },

    "personalized-pitches-at-scale": {
      title: "Crafting Personalized Pitches at Scale",
      metaTitle: "Personalized PR Pitches at Scale (Without Spam)",
      metaDescription: "Turn research into first-line personalization that wins replies—at scale.",
      h1: "Crafting Personalized Pitches at Scale",
      intro: "Generic pitches get deleted. Personal ones get responses. Learn how to research efficiently and personalize at scale without sacrificing authenticity. In today's crowded media landscape, personalization isn't optional—it's the difference between coverage and silence.",
      category: "Pitching",
      readingTime: "11 min read",
      icon: BookOpen,
      sections: [
        {
          heading: "The Psychology of Personalized Outreach",
          content: [
            "Journalists receive hundreds of pitches weekly, and most are immediately recognizable as mass-distributed templates. The human brain is wired to notice when someone has taken time to acknowledge us specifically. This psychological principle drives the power of personalized communication.",
            "Personalization signals respect for the journalist's time and expertise. When you reference their recent work or demonstrate understanding of their beat, you're showing that you've invested effort in understanding their interests. This investment creates a psychological obligation to reciprocate with attention.",
            "However, surface-level personalization often backfires. Journalists can instantly spot when someone has merely inserted their name into a template or made shallow references to recent articles without understanding the context. Authentic personalization requires genuine research and thoughtful application.",
            "The goal isn't to impress journalists with how much you know about them personally. Instead, it's to demonstrate that your story aligns with their professional interests and coverage patterns. Focus on their work, not their personality.",
            "Effective personalization also acknowledges the journalist's constraints. They work under tight deadlines, cover multiple stories simultaneously, and need to justify every story to editors. Your personalized approach should make their job easier, not harder."
          ]
        },
        {
          heading: "Research Signals That Matter",
          content: [
            "Not all personalization data points carry equal weight. Referencing a journalist's recent article shows you're paying attention, but understanding why they wrote it demonstrates deeper insight. Look for the story behind the story—what trends or events prompted their coverage?",
            "Recent coverage patterns reveal more than individual articles. If a journalist has written three stories about AI ethics in the past month, that indicates active interest in the topic. If they covered a competitor's funding round, they might be building a broader narrative about your industry sector.",
            "Social media activity provides real-time insights into journalist interests and availability. Twitter threads often reveal story ideas in development, research questions, or industry opinions. LinkedIn posts might show career changes or new beat assignments. Use this information strategically, not invasively.",
            "Conference speaking engagements and podcast appearances signal topic expertise and current interests. Journalists who speak at industry events are often building thought leadership in specific areas. This information can help you position your story within their broader professional narrative.",
            "Award nominations, job changes, and public recognition create natural personalization opportunities. Congratulating a journalist on recent recognition before transitioning to your pitch creates positive sentiment. However, ensure your congratulations are genuine and relevant to your outreach.",
            "Industry connections and mutual contacts can provide powerful personalization angles. If you share connections with a journalist, mentioning this relationship (with permission) can warm your introduction. Professional networks matter in journalism, and leveraging them appropriately can open doors."
          ]
        },
        {
          heading: "Efficient Research Workflows",
          content: [
            "Scaling personalized outreach requires systematic research processes. Manual research for hundreds of journalists isn't sustainable, so develop efficient workflows that balance depth with speed. Start with automated data collection, then layer in human insights for your highest-priority targets.",
            "Google Alerts and publication RSS feeds help track journalist activity without manual monitoring. Set up alerts for key journalists covering your space, then review their recent articles weekly. This passive monitoring ensures you're always current on their coverage patterns.",
            "Social media monitoring tools can track journalist activity across platforms. However, focus on professional content rather than personal posts. Twitter lists, LinkedIn connections, and platform-specific alerts help you stay informed about their current interests and availability.",
            "Database systems should store more than contact information. Track conversation history, response patterns, story preferences, and personal details (professional only). This accumulated knowledge makes future outreach more targeted and effective.",
            "Research templates can speed up the process while ensuring consistency. Create standard research categories: recent articles, beat focus, story preferences, response history, and timing patterns. Fill out these templates for each journalist to build comprehensive profiles.",
            "Team collaboration on research improves efficiency and reduces duplication. Use shared databases where team members can contribute insights about journalist interactions. One team member's relationship can benefit the entire organization's outreach efforts."
          ]
        },
        {
          heading: "Personalization at Scale Without Losing Authenticity",
          content: [
            "The challenge of personalized outreach is maintaining authenticity while reaching large numbers of journalists. Templates and automation can help, but they must be sophisticated enough to avoid the 'mass mail merge' feel that immediately identifies generic outreach.",
            "Variable personalization allows for scalable customization. Instead of writing completely unique emails, create flexible templates with multiple personalization layers: reference recent articles, acknowledge beat expertise, mention mutual connections, or cite relevant company news.",
            "Segment-based personalization groups journalists by characteristics that affect messaging. Enterprise journalists respond to different angles than consumer reporters. Data journalists want statistics; narrative writers prefer human stories. Create segment-specific templates that feel personal within each group.",
            "Timing personalization considers individual journalist schedules and preferences. Some prefer Monday morning pitches; others work better mid-week. Some respond quickly; others need longer consideration time. Track these patterns and adjust your outreach schedule accordingly.",
            "Context-aware personalization references external factors affecting the journalist's current interests. Industry events, breaking news, or seasonal trends might influence story priorities. Acknowledging these contexts shows awareness of their professional environment.",
            "Progressive personalization deepens over time as you build relationships. First contacts might include basic beat recognition. Follow-up communications can reference previous conversations or shared experiences. Long-term relationships allow for more sophisticated personalization based on accumulated knowledge."
          ]
        },
        {
          heading: "Common Personalization Mistakes to Avoid",
          content: [
            "Over-personalization often backfires by making journalists uncomfortable or suspicious. Mentioning too many personal details, referencing old articles, or demonstrating excessive knowledge about their background can feel invasive rather than thoughtful.",
            "Fake personalization is worse than no personalization. Journalists quickly recognize generic templates with superficial customization. Don't reference articles you haven't read, mention beats you don't understand, or make claims about shared interests you can't support.",
            "Timing mistakes can undermine even well-personalized pitches. Pitching breaking news stories to monthly magazine writers, or sending feature ideas during deadline crunches, shows you don't understand their workflow. Research publication schedules and deadline patterns.",
            "Irrelevant personalization wastes everyone's time. Mentioning a journalist's recent article about Topic A while pitching an unrelated Topic B story doesn't demonstrate understanding—it shows you're going through the motions without strategic thinking.",
            "Cultural insensitivity in international outreach can damage relationships. Journalists in different markets have different communication preferences, story angles, and professional customs. Research local norms before adapting your personalization approach.",
            "Persistence vs. stalking is a fine line that some PR professionals cross. Following journalists across multiple platforms, referencing personal social media posts, or continuing outreach after clear disinterest signals unprofessional behavior."
          ]
        },
        {
          heading: "Measuring Personalization Effectiveness",
          content: [
            "Track response rates across different personalization approaches to identify what works best. Compare highly personalized pitches against templated messages, and measure which personalization elements drive the strongest engagement.",
            "Quality metrics matter more than quantity metrics. A 20% response rate from 50 highly targeted, personalized pitches often delivers better results than a 5% response rate from 200 generic messages. Focus on conversion quality, not just volume.",
            "Long-term relationship building metrics show personalization's true value. Track how personalized outreach affects future response rates, journalist referrals, and coverage quality. These relationships compound over time, making initial personalization investments increasingly valuable.",
            "Cost-benefit analysis helps optimize resource allocation. Measure the time invested in personalization against resulting coverage value. Find the sweet spot where personalization effort produces proportional returns without becoming unsustainable.",
            "A/B testing can optimize specific personalization elements. Test different subject line approaches, opening paragraph styles, or personalization depth levels. Use these insights to refine your approach systematically.",
            "Journalist feedback provides qualitative insights that numbers can't capture. Occasionally ask responsive journalists what elements of your outreach they found most effective. This direct feedback can guide future personalization strategies."
          ]
        }
      ],
      faqs: [
        {
          question: "How much personalization is enough?",
          answer: "One or two specific, relevant details are usually sufficient. The goal is to show you're informed about their work, not to prove you've read everything they've ever written. Quality of personalization matters more than quantity—a single, well-chosen reference to recent work often outperforms multiple superficial mentions."
        },
        {
          question: "Is it creepy to reference social media posts?",
          answer: "Reference professional social media content sparingly and appropriately. Industry opinions, article previews, and professional announcements are fair game. Personal content, vacation photos, and family information are off-limits. When in doubt, stick to published articles and professional bio information."
        },
        {
          question: "Should I personalize follow-up emails too?",
          answer: "Yes, but differently than initial outreach. Follow-ups can reference your previous conversation, acknowledge timing constraints, or provide additional context based on their recent coverage. Don't repeat the same personalization from your first email."
        },
        {
          question: "How do I personalize for freelance journalists?",
          answer: "Freelancers often write for multiple publications, so research their recent work across platforms. Mention specific publications where you've seen their bylines, and acknowledge their expertise across different outlets. They may have more flexibility in story selection than staff writers."
        },
        {
          question: "What if I can't find recent articles from a journalist?",
          answer: "If a journalist hasn't published recently, they may have changed beats, left the publication, or be working on longer-term projects. Check their social media for updates, verify their current role, and consider whether they're still an appropriate target for your story."
        }
      ],
      mediaAIBenefits: [
        "Access recent articles and coverage patterns for any journalist in real-time with automated updates",
        "Get personalization suggestions based on each journalist's beat, interests, and response history",
        "Track which personalization approaches get the best response rates across your campaigns",
        "Automated research workflows that compile journalist profiles with professional background information",
        "Integration with social media monitoring to track professional activity and interests"
      ],
      relatedResources: [
        { title: "How to Build a Media List That Actually Gets Replies", slug: "build-a-media-list-that-gets-replies" },
        { title: "Follow-Up Without Being Annoying", slug: "follow-up-without-being-annoying" }
      ],
      relatedTools: [
        { title: "Pitch Personalization Helper", slug: "pitch-personalization-helper" },
        { title: "Subject Line Split-Tester", slug: "subject-line-split-tester" }
      ],
      cta: "Pull recent coverage & tailor pitches → Open Media AI"
    },

    "amec-framework-for-pr-measurement": {
      title: "PR Measurement with the AMEC Framework",
      metaTitle: "PR Measurement with the AMEC Framework",
      metaDescription: "Inputs → Outputs → Outcomes: a practical measurement plan.",
      h1: "PR Measurement with the AMEC Framework",
      intro: "Move beyond vanity metrics. Learn how to measure PR impact using the industry-standard AMEC framework. The Association for Measurement and Evaluation of Communication (AMEC) provides a comprehensive approach to proving PR value through systematic measurement of inputs, outputs, and outcomes.",
      category: "Measurement",
      readingTime: "13 min read",
      icon: TrendingUp,
      sections: [
        {
          heading: "Understanding the AMEC Integrated Evaluation Framework",
          content: [
            "The AMEC Integrated Evaluation Framework revolutionizes how we approach PR measurement by providing a systematic pathway from planning to proving business impact. This framework moves beyond traditional vanity metrics to demonstrate real business value through comprehensive evaluation methods.",
            "The framework operates on five fundamental levels: Inputs (resources invested), Activities (tactical executions), Outputs (immediate results), Outtakes (audience response), and Outcomes (business impact). Each level builds upon the previous one, creating a comprehensive measurement ecosystem.",
            "Inputs represent the resources you invest in PR activities: budget, time, staff, tools, and strategic planning. These baseline measurements help you understand the relationship between investment and results, enabling better resource allocation decisions.",
            "Activities encompass all tactical executions: media outreach, content creation, event participation, and relationship building. Tracking activities helps you understand which tactical approaches contribute most effectively to your overall objectives.",
            "Outputs measure immediate, tangible results: media coverage, social media engagement, website traffic, and content consumption. While important, outputs are interim metrics that don't directly prove business value—they're stepping stones to more meaningful measurements.",
            "Outtakes assess audience response and engagement: awareness changes, perception shifts, and behavioral intentions. These metrics bridge the gap between PR activities and business outcomes by measuring how audiences react to your communications.",
            "Outcomes represent ultimate business impact: lead generation, sales attribution, reputation enhancement, and stakeholder relationship improvements. These metrics directly connect PR activities to organizational success."
          ]
        },
        {
          heading: "Objectives & Goal Setting",
          content: [
            "Before implementing any measurement system, establish crystal-clear objectives that align with broader organizational goals. Effective PR measurement begins with strategic clarity about what you're trying to achieve and why it matters to the business.",
            "Use SMART criteria rigorously for all PR objectives: Specific, Measurable, Achievable, Relevant, Time-bound. Instead of 'increase brand awareness,' specify 'increase aided brand recognition by 15% among target demographic within 6 months, measured through quarterly brand tracking surveys.'",
            "Align PR objectives with broader business goals through stakeholder consultation. If the company prioritizes customer acquisition, your PR should support that with metrics like qualified leads from media coverage, sales attribution from thought leadership, or prospect engagement with coverage.",
            "Develop objective hierarchies that connect tactical activities to strategic outcomes. Primary objectives should tie directly to business results. Secondary objectives can focus on interim metrics that indicate progress toward primary goals. Tertiary objectives might include operational efficiency or process improvements.",
            "Establish baseline measurements before launching campaigns. You can't measure improvement without understanding starting points. Conduct brand awareness surveys, audit current coverage quality, and assess existing stakeholder relationships to create measurement foundations.",
            "Consider both quantitative and qualitative objectives. Numbers provide concrete targets, but qualitative goals like reputation enhancement or thought leadership require subjective assessment methods. Balance hard metrics with stakeholder feedback and perception studies."
          ]
        },
        {
          heading: "Setting Up Your Measurement Framework",
          content: [
            "Implement systematic data collection processes that capture information across all AMEC framework levels. Automated tools should handle routine data gathering, while human analysis focuses on interpretation and strategic insights.",
            "Design measurement dashboards that present information hierarchically. Executive stakeholders need outcome-focused summaries, while tactical teams require detailed output and activity metrics. Customize reporting formats for different audience needs and decision-making requirements.",
            "Establish measurement frequencies appropriate to your objectives and audience expectations. Brand awareness might be measured quarterly, while media coverage requires daily or weekly tracking. Align measurement schedules with business planning cycles and stakeholder reporting needs.",
            "Create standardized measurement definitions across your organization. Ensure everyone understands how you calculate reach, impressions, engagement, sentiment, and business attribution. Consistent definitions enable meaningful trend analysis and benchmarking.",
            "Implement quality control processes for data collection and analysis. Verify coverage attribution, validate sentiment analysis, and audit calculation methods regularly. Poor data quality undermines measurement credibility and decision-making effectiveness.",
            "Document your measurement methodology for stakeholder transparency and team consistency. Clear documentation enables team members to execute measurement consistently and helps stakeholders understand how you derive insights and recommendations."
          ]
        },
        {
          heading: "Output Measurement: Beyond Vanity Metrics",
          content: [
            "Traditional output measurement often focuses on vanity metrics that look impressive but don't indicate business impact. Modern output measurement emphasizes quality, relevance, and audience alignment over pure volume metrics.",
            "Coverage quality assessment considers multiple factors: outlet authority, journalist credibility, audience alignment, message accuracy, and competitive context. A single piece in a highly relevant trade publication often delivers more value than dozens of mentions in general interest media.",
            "Sentiment analysis should go beyond positive/negative/neutral classifications. Assess message accuracy, key point inclusion, and competitive positioning. Does the coverage convey your intended messages? Are quotes used appropriately? How does your coverage compare to competitors?",
            "Audience measurement requires understanding who actually consumes your coverage, not just theoretical circulation numbers. Social media engagement, article sharing patterns, and website traffic attribution provide insights into real audience reach and interest.",
            "Message pull-through analysis evaluates how well your key messages appear in resulting coverage. Track which messages resonate with journalists, which get edited out, and which appear with appropriate context. This analysis improves future messaging strategy.",
            "Competitive benchmarking places your output metrics in market context. Track share of voice, message comparison, and coverage quality relative to competitors. This analysis helps identify opportunities and measure relative performance."
          ]
        },
        {
          heading: "Outcome Measurement: Proving Business Impact",
          content: [
            "Outcome measurement connects PR activities to business results through sophisticated attribution analysis. This requires collaboration across marketing, sales, and business intelligence teams to establish clear measurement methodologies.",
            "Lead attribution tracks how media coverage drives prospect engagement. Use UTM parameters on quoted URLs, monitor website traffic spikes following coverage, and survey new leads about awareness sources. This data demonstrates PR's contribution to sales pipeline development.",
            "Brand perception measurement requires systematic tracking of stakeholder attitudes, awareness levels, and purchase intent. Quarterly surveys, focus groups, and social listening provide quantitative and qualitative insights into reputation changes.",
            "Sales attribution analysis identifies coverage that directly influences purchase decisions. Track prospect engagement with thought leadership content, monitor deal acceleration following positive coverage, and survey customers about PR influence on their buying process.",
            "Stakeholder relationship assessment measures how PR affects key relationship quality. Employee engagement surveys, investor sentiment analysis, and partner feedback provide insights into PR's impact on critical business relationships.",
            "Long-term value measurement considers PR's cumulative impact on business assets like brand equity, market position, and stakeholder trust. These metrics develop slowly but represent PR's most significant contributions to organizational success."
          ]
        },
        {
          heading: "Advanced Analytics and Attribution",
          content: [
            "Modern PR measurement leverages advanced analytics to understand complex attribution patterns. Multi-touch attribution models help identify how different PR activities contribute to business outcomes throughout extended customer journeys.",
            "Marketing mix modeling incorporates PR variables alongside advertising, digital marketing, and sales activities to understand integrated campaign performance. This sophisticated analysis reveals PR's role in overall marketing effectiveness.",
            "Predictive analytics use historical data to forecast future PR performance and optimize resource allocation. Machine learning algorithms can identify patterns that predict campaign success and recommend tactical adjustments.",
            "Sentiment correlation analysis examines relationships between coverage sentiment, message accuracy, and business outcomes. Understanding these correlations helps optimize messaging strategy and journalist relationship management.",
            "Time-series analysis reveals how PR impact develops over time. Some outcomes appear immediately, while others build gradually through sustained effort. Understanding these temporal patterns improves campaign planning and expectation management.",
            "Cross-channel analysis examines how PR amplifies or is amplified by other marketing activities. Social media engagement often extends PR coverage reach, while advertising can reinforce PR messages. Measuring these synergies demonstrates integrated campaign value."
          ]
        }
      ],
      faqs: [
        {
          question: "Should I still track AVE (Advertising Value Equivalent)?",
          answer: "AVE is widely considered outdated and misleading by industry professionals. The AMEC organization explicitly discourages AVE usage because it doesn't reflect actual business value or communication effectiveness. Focus on outcomes and business impact instead, using metrics that demonstrate real value to stakeholders."
        },
        {
          question: "How often should I measure PR results?",
          answer: "Measurement frequency depends on your objectives and stakeholder needs. Daily monitoring for crisis management, weekly reports for ongoing campaigns, monthly analysis for strategic programs, and quarterly assessments for long-term relationship building are common approaches. Align measurement schedules with business planning cycles."
        },
        {
          question: "What's the difference between outputs and outcomes?",
          answer: "Outputs are immediate, tangible results of PR activities (coverage, social shares, website visits). Outcomes are business impacts that result from those outputs (leads generated, sales attributed, reputation enhanced). Outcomes matter more for proving PR value, but outputs help optimize tactical execution."
        },
        {
          question: "How do I prove PR caused business results?",
          answer: "Use attribution analysis combining multiple data sources: UTM tracking on coverage links, prospect surveys about awareness sources, timeline correlation between coverage and business metrics, and control group comparisons where possible. Perfect attribution is challenging, but systematic analysis can demonstrate strong correlations."
        },
        {
          question: "What tools do I need for AMEC measurement?",
          answer: "Basic measurement requires media monitoring tools, web analytics, survey platforms, and spreadsheet software. Advanced measurement benefits from marketing automation platforms, CRM integration, social listening tools, and business intelligence software. Start simple and add sophistication as your program matures."
        },
        {
          question: "How do I measure thought leadership impact?",
          answer: "Track speaking opportunities, media requests for expert commentary, social media engagement with thought leadership content, website traffic to expertise-related pages, and prospect engagement with educational content. Survey stakeholders about your organization's perceived expertise and industry influence."
        }
      ],
      mediaAIBenefits: [
        "Track coverage quality and sentiment across all your campaigns automatically with advanced AI analysis",
        "Generate comprehensive reports showing PR's impact on business metrics with automated attribution tracking",
        "Monitor competitor share of voice and benchmark your performance against industry standards",
        "Access real-time dashboards that connect PR activities to business outcomes using AMEC framework principles",
        "Automate data collection across multiple channels and platforms for comprehensive measurement coverage"
      ],
      relatedResources: [
        { title: "PR Attribution with UTMs & Post-Coverage Tracking", slug: "pr-attribution-with-utms" },
        { title: "Digital PR for Link Building (Without Spam)", slug: "digital-pr-link-building" }
      ],
      relatedTools: [
        { title: "Coverage Tracker Template", slug: "coverage-tracker-template" },
        { title: "PR ROI Snapshot Calculator", slug: "pr-roi-snapshot-calculator" }
      ],
      cta: "Track coverage & quality signals → Open Media AI"
    }
  };

  // Add all remaining articles using the default template
  const remainingArticles = [
    { slug: "embargo-etiquette-and-timing", title: "Embargo Etiquette & Timing", category: "Pitching", icon: Clock },
    { slug: "follow-up-without-being-annoying", title: "Follow-Up Without Being Annoying", category: "Pitching", icon: FileText },
    { slug: "30-day-pr-plan-for-product-launches", title: "A 30-Day PR Plan for Product Launches", category: "Releases", icon: BookOpen },
    { slug: "data-storytelling-for-pr", title: "Data Storytelling for PR", category: "Pitching", icon: TrendingUp },
    { slug: "founder-media-training-basics", title: "Founder Media Training: The Basics", category: "Workflow", icon: Users },
    { slug: "pr-attribution-with-utms", title: "PR Attribution with UTMs & Post-Coverage Tracking", category: "Measurement", icon: BookOpen },
    { slug: "digital-pr-link-building", title: "Digital PR for Link Building (Without Spam)", category: "Measurement", icon: TrendingUp },
    { slug: "press-kit-that-journalists-use", title: "Build a Press Kit Journalists Actually Use", category: "Releases", icon: FileText },
    { slug: "crisis-communications-playbook", title: "Crisis Communications Playbook", category: "Compliance", icon: Shield },
    { slug: "thought-leadership-to-op-ed", title: "Thought Leadership: From Idea to Op-Ed", category: "Thought Leadership", icon: Lightbulb },
    { slug: "working-with-freelance-journalists", title: "Working with Freelance Journalists", category: "Workflow", icon: Users },
    { slug: "pitching-podcasts-for-brand-story", title: "Pitching Podcasts for Brand Story", category: "Workflow", icon: BookOpen },
    { slug: "influencer-briefs-that-drive-results", title: "Influencer Briefs That Drive Results", category: "Influencer", icon: Users },
    { slug: "ftc-asa-disclosure-for-campaigns", title: "FTC/ASA Disclosure for Influencer Campaigns", category: "Influencer", icon: Shield },
    { slug: "using-reviews-and-social-proof-in-pr", title: "Using Reviews & Social Proof in PR", category: "Influencer", icon: TrendingUp },
    { slug: "seasonality-calendar-and-newsjacking", title: "Seasonality, Calendars & Newsjacking (Safely)", category: "Compliance", icon: Clock },
    { slug: "pr-for-funding-announcements", title: "PR for Funding Announcements", category: "Releases", icon: TrendingUp },
    { slug: "messaging-and-positioning-for-pr", title: "Messaging & Positioning for PR Teams", category: "Workflow", icon: Lightbulb },
    { slug: "exclusive-vs-wide-pitching", title: "Exclusive vs Wide Pitching: How to Choose", category: "Pitching", icon: BookOpen },
    { slug: "international-pr-localization", title: "International PR: Localize by Market", category: "Workflow", icon: BookOpen }
  ];

  // Add remaining articles with default content
  remainingArticles.forEach(article => {
    if (!articlesData[article.slug]) {
      articlesData[article.slug] = createDefaultArticle(article.title, article.slug, article.category, article.icon);
    }
  });

  const article = articlesData[slug || ""];

  useEffect(() => {
    if (article) {
      updatePageSEO(
        article.metaTitle,
        article.metaDescription,
        `PR guide, ${article.category.toLowerCase()}, media relations, journalism, public relations`
      );

      // Add structured data
      addStructuredData({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "description": article.metaDescription,
        "author": {
          "@type": "Organization",
          "name": "Media AI"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Media AI"
        },
        "datePublished": new Date().toISOString(),
        "url": window.location.href
      });

      // Add FAQ structured data
      if (article.faqs.length > 0) {
        addStructuredData({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": article.faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        });
      }
    }
  }, [article]);

  const handleLeadCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      toast({
        title: "Thanks for subscribing!",
        description: "We'll send you our latest PR guides and templates.",
      });
      setEmail("");
      setName("");
      setShowLeadCapture(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Article URL copied to clipboard.",
      });
    }
  };

  if (!article) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">The resource you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/resources">← Back to Resources</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const IconComponent = article.icon;

  return (
    <Layout>
      {/* Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 z-40 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <span className="font-medium">Ready to implement this strategy?</span>
            <Button 
              asChild 
              variant="secondary" 
              size="sm"
              className="bg-white text-primary hover:bg-gray-100"
            >
              <a href="https://trymedia.ai" target="_blank" rel="noopener noreferrer">
                Open Media AI →
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <section className="py-16 bg-subtle-gradient">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 mb-6">
              <a href="https://resources.trymedia.ai/" className="text-muted-foreground hover:text-primary">
                Resources
              </a>
              <span className="text-muted-foreground">→</span>
              <Badge variant="secondary">{article.category}</Badge>
            </div>
            
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {article.h1}
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                  {article.intro}
                </p>
              </div>
              <div className="ml-8 hidden md:block">
                <div className="p-4 bg-primary/10 rounded-2xl">
                  <IconComponent className="h-12 w-12 text-primary" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{article.readingTime}</span>
                </div>
              </div>
              <Button 
                onClick={handleShare}
                variant="outline" 
                size="sm"
                className="flex items-center space-x-1"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16 bg-white pb-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <article className="prose prose-lg max-w-none">
              {/* Article Sections */}
              {article.sections.map((section, index) => (
                <div key={index} className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    {section.heading}
                  </h2>
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-muted-foreground mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}

                  {/* Inline CTA after section 2 */}
                  {index === 1 && (
                    <Card className="my-12 p-8 bg-primary/5 border-primary/20">
                      <div className="text-center">
                        <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          How this works inside Media AI
                        </h3>
                        <ul className="text-left space-y-2 mb-6 max-w-md mx-auto">
                          {article.mediaAIBenefits.map((benefit, bIndex) => (
                            <li key={bIndex} className="flex items-start space-x-2">
                              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                        <Button asChild className="btn-primary">
                          <a href="https://trymedia.ai" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Try Media AI Free
                          </a>
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              ))}

              {/* Lead Capture */}
              <Card className="my-12 p-8 bg-subtle-gradient">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Want more PR guides like this?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Get our latest templates, checklists, and expert insights delivered to your inbox.
                  </p>
                  
                  {!showLeadCapture ? (
                    <Button 
                      onClick={() => setShowLeadCapture(true)}
                      className="btn-primary"
                    >
                      Get Free PR Resources
                    </Button>
                  ) : (
                    <form onSubmit={handleLeadCapture} className="max-w-md mx-auto space-y-4">
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field"
                        required
                      />
                      <Input
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field"
                        required
                      />
                      <Button type="submit" className="w-full btn-primary">
                        Subscribe to PR Resources
                      </Button>
                    </form>
                  )}
                </div>
              </Card>

              {/* FAQ Section */}
              {article.faqs.length > 0 && (
                <div className="my-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                    <HelpCircle className="mr-3 h-6 w-6 text-primary" />
                    Frequently Asked Questions
                  </h2>
                  <Accordion type="single" collapsible className="space-y-4">
                    {article.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`} className="border border-border rounded-xl">
                        <AccordionTrigger className="px-6 py-4 text-left font-medium hover:no-underline hover:bg-muted/50">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4 text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* Final CTA */}
              <Card className="my-12 p-8 bg-primary/5 border-primary/20">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {article.cta}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Turn these strategies into results with Media AI's database of journalists and tools.
                  </p>
                  <Button asChild className="btn-primary">
                    <a href="https://trymedia.ai" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Media AI
                    </a>
                  </Button>
                </div>
              </Card>
            </article>
          </div>
        </div>
      </section>

      {/* Related Content */}
      <section className="py-16 bg-subtle-gradient pb-32">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              You might also like
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Related Resources */}
              {article.relatedResources.map((resource, index) => (
                <Card key={resource.slug} className="card-tool group cursor-pointer">
                  <Link to={`/${resource.slug}`} className="block">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Resource
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">
                        Read article
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </Card>
              ))}
              
              {/* Related Tools */}
              {article.relatedTools.map((tool, index) => (
                <Card key={tool.slug} className="card-tool group cursor-pointer">
                  <Link to={`/tools/${tool.slug}`} className="block">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <Target className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Tool
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">
                        Try tool
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ResourceArticle;