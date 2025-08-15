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
  const createDefaultArticle = (title: string, slug: string, category: string, icon: any, readingTime: string = "15 min read"): ArticleData => ({
    title,
    metaTitle: title,
    metaDescription: `Expert guide on ${title.toLowerCase()}. Professional strategies and actionable insights for PR teams.`,
    h1: title,
    intro: `Learn professional strategies and best practices for ${title.toLowerCase()}. This comprehensive guide provides actionable insights for PR professionals, covering everything from foundational concepts to advanced implementation strategies.`,
    category,
    readingTime,
    icon,
    sections: [
      {
        heading: "Understanding the Fundamentals",
        content: [
          `This comprehensive guide covers the essential strategies and best practices for ${title.toLowerCase()}. In today's rapidly evolving media landscape, understanding these fundamentals is crucial for PR success.`,
          "The modern approach to this strategy has evolved significantly in recent years. What worked five years ago may not be effective today. This guide provides current, actionable insights based on real-world experience and industry best practices.",
          "Whether you're a PR professional, marketing manager, or business leader, this guide provides frameworks you can implement immediately. The strategies outlined here have been tested across various industries and company sizes.",
          "Understanding the psychology behind this approach is essential for success. When you know why these techniques work, you can adapt them to your specific situation and industry requirements.",
          "The strategic foundation of this approach involves understanding your audience, crafting compelling narratives, and measuring results effectively. These core principles apply regardless of your specific implementation details.",
          "Industry leaders consistently emphasize the importance of this strategy in their overall PR and marketing efforts. Companies that master these techniques often see significant improvements in their media coverage and audience engagement."
        ]
      },
      {
        heading: "Strategic Planning and Preparation",
        content: [
          "Effective planning is the cornerstone of successful implementation. Before diving into tactics, you need a clear understanding of your objectives, target audience, and success metrics.",
          "Research and competitive analysis form the foundation of your strategic approach. Understanding what others in your space are doing—and what's working for them—provides valuable insights for your own strategy.",
          "Resource allocation and timeline planning ensure your efforts are sustainable and effective. Many organizations fail because they don't properly plan for the time and resources required for successful implementation.",
          "Stakeholder alignment is crucial for long-term success. Ensure all team members understand their roles, responsibilities, and how their work contributes to the overall objectives.",
          "Risk assessment and contingency planning help you prepare for potential challenges. Understanding what could go wrong—and having plans to address these issues—prevents small problems from becoming major setbacks.",
          "Documentation of your strategy and processes ensures consistency and makes it easier to scale your efforts as your team grows."
        ]
      },
      {
        heading: "Implementation Best Practices",
        content: [
          "Follow industry-standard approaches that have been tested and refined by leading PR professionals. These best practices represent years of collective experience and learning from both successes and failures.",
          "Start with small-scale pilots to test your approach before rolling out to larger campaigns. This allows you to identify and resolve issues without risking major resources or reputation.",
          "Implement these strategies systematically to achieve consistent, measurable results. Random or inconsistent application of these techniques rarely produces the desired outcomes.",
          "Quality control measures ensure your work meets professional standards. Establish review processes and quality checkpoints throughout your implementation.",
          "Team training and skill development are essential for consistent execution. Ensure all team members understand not just what to do, but why these approaches work.",
          "Technology and tools can significantly improve your efficiency and results. Invest in the right platforms and systems to support your implementation efforts.",
          "Workflow optimization helps you scale your efforts without proportionally increasing your workload. Look for opportunities to automate routine tasks and streamline processes."
        ]
      },
      {
        heading: "Advanced Techniques and Strategies",
        content: [
          "Once you've mastered the fundamentals, these advanced techniques can significantly improve your results. These strategies require more sophistication but deliver proportionally better outcomes.",
          "Segmentation and personalization at scale allow you to maintain authentic relationships while reaching larger audiences. The key is balancing efficiency with genuine personal connection.",
          "Data-driven optimization uses performance metrics to continuously improve your approach. Track what works, identify patterns, and adjust your strategy based on real results.",
          "Cross-channel integration ensures your efforts work together rather than in isolation. Coordinate across different platforms and touchpoints for maximum impact.",
          "Relationship building and long-term thinking distinguish professional PR practitioners from those focused only on short-term gains. Invest in relationships that will pay dividends over time.",
          "Crisis preparedness and reputation management ensure you're ready to handle challenges that may arise from your PR activities.",
          "Innovation and experimentation help you stay ahead of industry trends and discover new opportunities before your competitors."
        ]
      },
      {
        heading: "Measurement and Optimization",
        content: [
          "Establish clear metrics and KPIs before beginning your implementation. Without proper measurement, you can't determine success or identify areas for improvement.",
          "Regular reporting and analysis help you understand what's working and what needs adjustment. Set up systems for consistent data collection and review.",
          "A/B testing and experimentation allow you to optimize specific elements of your approach. Test different variables systematically to identify the most effective approaches.",
          "ROI calculation and business impact measurement demonstrate the value of your PR efforts to leadership and stakeholders. Connect your activities to business outcomes whenever possible.",
          "Continuous improvement processes ensure your strategies evolve with changing market conditions and industry best practices. Regular strategy reviews and updates are essential.",
          "Benchmarking against industry standards and competitors helps you understand your relative performance and identify areas for improvement.",
          "Long-term trend analysis reveals patterns and opportunities that aren't visible in short-term metrics. Track performance over extended periods to identify strategic insights."
        ]
      },
      {
        heading: "Common Challenges and Solutions",
        content: [
          "Resource constraints are a common challenge for PR teams. Learn how to maximize your impact with limited time and budget through strategic prioritization and efficient processes.",
          "Stakeholder management requires balancing different expectations and requirements. Develop strategies for managing up, across, and down within your organization.",
          "Technology adoption and integration can be challenging but is essential for modern PR success. Approach new tools systematically and ensure proper training for your team.",
          "Maintaining quality at scale requires systematic processes and quality control measures. Don't sacrifice quality for quantity—find ways to scale without compromising standards.",
          "Industry changes and adaptation strategies help you stay current with evolving best practices and technologies. Build flexibility into your processes to accommodate change.",
          "Team development and skill building ensure your capabilities grow with your responsibilities. Invest in training and professional development for long-term success."
        ]
      }
    ],
    faqs: [
      {
        question: "How do I get started with this strategy?",
        answer: "Begin by setting clear objectives and understanding your target audience. Then implement the frameworks outlined in this guide systematically, starting with foundational elements before moving to advanced techniques."
      },
      {
        question: "What results can I expect?",
        answer: "Results vary based on implementation quality and consistency, but most organizations see measurable improvements within 30-60 days of proper implementation. Long-term success requires sustained effort and continuous optimization."
      },
      {
        question: "How much time does this require?",
        answer: "Initial setup typically requires 2-4 weeks of focused effort, followed by ongoing maintenance and optimization. The exact time investment depends on your goals, team size, and current capabilities."
      },
      {
        question: "What tools or resources do I need?",
        answer: "While basic implementation can be done with standard tools, specialized platforms often improve efficiency and results. Start with what you have, then invest in additional tools as your program grows."
      },
      {
        question: "How do I measure success?",
        answer: "Establish baseline metrics before implementation, then track relevant KPIs consistently. Focus on both leading indicators (activities) and lagging indicators (outcomes) to get a complete picture of your performance."
      }
    ],
    mediaAIBenefits: [
      "Access comprehensive tools and databases to implement these strategies more effectively",
      "Track and measure your progress with professional-grade analytics and reporting",
      "Connect with the right journalists and influencers for your campaigns",
      "Automate routine tasks to focus on strategic activities",
      "Access expert guidance and best practices from industry professionals"
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
            "Social media research provides additional qualification signals. Follow journalists' Twitter accounts, LinkedIn posts, and newsletter content to understand their current interests and perspectives. Many journalists share story ideas, industry opinions, and coverage preferences through their social channels.",
            "Analyze byline patterns to understand each journalist's coverage frequency and style. Some write daily news pieces, others focus on weekly analysis, and some specialize in monthly deep-dives. Match your story type and timeline to their publication rhythm for better response rates.",
            "Contact verification is essential but often overlooked. Email addresses change frequently in media, and outdated contact information kills outreach campaigns. Use multiple verification methods: publication websites, social media profiles, professional directories, and cross-referencing with recent bylines.",
            "Build journalist profiles that include beat focus, publication frequency, contact preferences, recent coverage themes, and personal interests when relevant. This information enables personalized outreach that demonstrates genuine familiarity with their work."
          ]
        },
        {
          heading: "List Building Tools and Techniques",
          content: [
            "Manual research remains the gold standard for high-quality media lists, but smart tools can accelerate the process. Start with publication mastheads and staff directories, then cross-reference with recent bylines to identify active reporters in your target areas.",
            "Media databases like Cision, Muck Rack, and HARO provide structured journalist information, but require careful filtering and verification. Generic database searches often return outdated or irrelevant contacts. Use specific search criteria and always verify contact information independently.",
            "Google advanced search operators help identify recent coverage patterns. Use site-specific searches (site:techcrunch.com \"artificial intelligence\" after:2023-01-01) to find journalists covering your topic area within specific timeframes. This technique often surfaces writers missed by traditional databases.",
            "Social media intelligence tools can track journalist activity and identify emerging influencers in your space. Tools like BuzzSumo, Followerwonk, and native platform search help identify active voices covering your industry topics.",
            "Networking and referrals often produce the highest-quality contacts. Industry events, PR professional groups, and existing relationships can provide introductions to journalists actively seeking sources in your area. These warm introductions typically achieve much higher response rates than cold outreach.",
            "Systematic documentation ensures list quality over time. Track contact information, interaction history, coverage preferences, and response patterns for each journalist. This data improves targeting accuracy and helps personalize future outreach efforts."
          ]
        },
        {
          heading: "List Segmentation and Optimization",
          content: [
            "Effective segmentation improves both targeting accuracy and campaign performance. Group journalists by publication tier, beat specificity, geographic focus, and content format preferences. This enables tailored messaging that resonates with each segment's unique needs and interests.",
            "Geographic segmentation matters more than many PR teams realize. Local and regional journalists often provide better coverage for location-specific stories, while national outlets focus on broader industry trends. International journalists may have different cultural contexts and story preferences that require adapted messaging.",
            "Timeline-based segmentation helps optimize outreach scheduling. Daily news reporters need immediate access to breaking news, weekly writers plan stories days in advance, and monthly publications work on longer lead times. Match your outreach timing to their editorial calendars.",
            "Format preferences create additional segmentation opportunities. Some journalists prefer detailed press releases, others want brief bullet points, and many value exclusive access or early briefings. Understanding these preferences improves response rates and relationship building.",
            "Relationship depth segmentation helps prioritize outreach efforts. Existing relationships deserve different treatment than cold contacts. Warm contacts may accept phone calls or informal pitches, while new relationships require more formal, well-researched approaches.",
            "Performance tracking enables continuous list optimization. Monitor response rates, coverage quality, and relationship development for each segment. Use this data to refine targeting criteria and improve future list building efforts."
          ]
        }
      ],
      faqs: [
        {
          question: "How many journalists should be on my media list?",
          answer: "Quality trumps quantity. A well-researched list of 25-50 highly relevant journalists typically outperforms a generic list of 500+ contacts. Focus on journalists who actively cover your topic area and have engaged audiences that match your target market."
        },
        {
          question: "How often should I update my media list?",
          answer: "Review and update your media list quarterly at minimum, with ongoing maintenance for major changes. Journalists change beats frequently, contact information becomes outdated, and new voices emerge in every industry. Fresh lists perform significantly better than stale databases."
        },
        {
          question: "Should I buy media lists or build my own?",
          answer: "Build your own for maximum quality and relevance. Purchased lists are often outdated, generic, and lack the specific targeting your stories require. The research process also helps you understand each journalist's interests and coverage style, enabling better personalization."
        },
        {
          question: "How do I find journalists for niche industries?",
          answer: "Start with trade publications, industry newsletters, and specialized podcasts. Many niche industries have dedicated media that mainstream databases miss. LinkedIn and Twitter searches using industry-specific hashtags and keywords often surface relevant journalists and influencers."
        },
        {
          question: "What's the best format for organizing media lists?",
          answer: "Use a spreadsheet or CRM that includes journalist name, outlet, beat, contact information, recent coverage examples, preferred contact method, and interaction history. This structure enables easy filtering, personalization, and performance tracking."
        }
      ],
      mediaAIBenefits: [
        "Access verified contact information for thousands of journalists across all major beats and publications",
        "Search by specific criteria including beat, location, outlet type, and recent coverage topics",
        "Track your outreach performance and relationship building progress over time",
        "Get real-time updates when journalists change roles or contact information",
        "Export targeted lists directly to your preferred email or CRM platform"
      ],
      relatedResources: [
        { title: "Pitch Personalization Strategies That Work", slug: "pitch-personalization-strategies-that-work" },
        { title: "Email Subject Lines That Get Opened", slug: "email-subject-lines-that-get-opened" }
      ],
      relatedTools: [
        { title: "Beat & Outlet Matcher", slug: "beat-outlet-matcher" },
        { title: "Contact Dedupe & Clean Tool", slug: "contact-dedupe-clean-lite" }
      ],
      cta: "Build better media lists with Media AI's journalist database → Open Media AI"
    }
  };

  // Generate default articles for remaining slugs
  const defaultArticles = [
    // From Index.tsx and Resources.tsx
    "build-a-media-list-that-gets-replies",
    "follow-up-strategies-for-pr-coverage",
    "embargo-etiquette-and-timing",
    "follow-up-without-being-annoying",
    "data-storytelling-for-pr",
    "exclusive-vs-wide-pitching",
    "press-release-templates-by-announcement-type",
    "30-day-pr-plan-for-product-launches",
    "pr-for-funding-announcements",
    "press-kit-that-journalists-use",
    "influencer-briefs-that-drive-results",
    "ftc-asa-disclosure-for-campaigns",
    "using-reviews-and-social-proof-in-pr",
    "social-media-roi-measurement-guide",
    "pr-attribution-with-utms",
    "digital-pr-link-building",
    "founder-media-training-basics",
    "working-with-freelance-journalists",
    "pitching-podcasts-for-brand-story",
    "messaging-and-positioning-for-pr",
    "international-pr-localization",
    "crisis-communications-playbook",
    "seasonality-calendar-and-newsjacking",
    "thought-leadership-to-op-ed",
    // Additional default articles
    "pitch-personalization-strategies-that-work",
    "email-subject-lines-that-get-opened",
    "media-relationship-building-guide",
    "pr-measurement-analytics-guide",
    "thought-leadership-content-strategy",
    "influencer-outreach-best-practices",
    "brand-storytelling-framework",
    "competitive-pr-analysis-methods",
    "media-kit-essentials-checklist",
    "pitch-timing-optimization-guide",
    "journalist-interview-preparation",
    "social-media-crisis-management",
    "pr-campaign-planning-template",
    "media-coverage-tracking-system",
    "executive-positioning-strategy",
    "industry-awards-submission-guide",
    "pr-budget-allocation-framework",
    "media-training-best-practices",
    "content-amplification-strategies",
    "stakeholder-communication-plans",
    "pr-roi-measurement-methods"
  ];

  defaultArticles.forEach(articleSlug => {
    if (!articlesData[articleSlug]) {
      const titleWords = articleSlug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      let category = "Strategy";
      let icon = Lightbulb;
      
      if (articleSlug.includes('pitch') || articleSlug.includes('email') || articleSlug.includes('outreach')) {
        category = "Pitching";
        icon = Users;
      } else if (articleSlug.includes('crisis') || articleSlug.includes('communication')) {
        category = "Crisis Management";
        icon = Shield;
      } else if (articleSlug.includes('measurement') || articleSlug.includes('analytics') || articleSlug.includes('tracking')) {
        category = "Analytics";
        icon = TrendingUp;
      } else if (articleSlug.includes('template') || articleSlug.includes('checklist') || articleSlug.includes('framework')) {
        category = "Templates";
        icon = FileText;
      }
      
      articlesData[articleSlug] = createDefaultArticle(titleWords, articleSlug, category, icon, "15 min read");
    }
  });

  const article = slug ? articlesData[slug] : null;

  // SEO and structured data
  useEffect(() => {
    if (article) {
      updatePageSEO(
        article.metaTitle,
        article.metaDescription
      );

      // Add Article structured data
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
        "dateModified": new Date().toISOString()
      });

      // Add FAQ structured data if FAQs exist
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
            <h1 className="text-3xl font-heading font-semibold text-foreground mb-4">Article Not Found</h1>
            <p className="text-gray-600 mb-8">The resource you're looking for doesn't exist.</p>
            <Button asChild className="bg-primary hover:bg-primary-hover text-white">
              <Link to="/resources">← Back to Resources</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Clean Header Section - matching tool pages */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
                <article.icon className="w-4 h-4 mr-2" />
                {article.category}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-heading font-medium mb-6 text-foreground">
                {article.h1}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                {article.intro}
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {article.readingTime}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center gap-2 hover:text-foreground text-gray-500"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content - matching tool page layout */}
        <section className="py-0 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                {/* Article Sections with cleaner styling */}
                {article.sections.map((section, index) => (
                  <div key={index} className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
                    <div className="space-y-6">
                      <h2 className="text-2xl font-heading font-semibold text-foreground flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">{index + 1}</span>
                        </div>
                        {section.heading}
                      </h2>
                      <div className="space-y-4">
                        {section.content.map((paragraph, pIndex) => (
                          <p key={pIndex} className="text-gray-600 leading-relaxed text-base">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Lead Capture Form - matching tool style */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-8">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-heading font-semibold text-foreground">
                        Ready to implement these strategies?
                      </h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        Access Media AI's comprehensive journalist database and professional PR tools to put these insights into action.
                      </p>
                    </div>
                    
                    {!showLeadCapture ? (
                      <Button 
                        onClick={() => setShowLeadCapture(true)}
                        className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-lg font-medium transition-colors"
                        size="lg"
                      >
                        Get Free Access <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    ) : (
                      <div className="space-y-4 max-w-md mx-auto">
                        <Input
                          type="text"
                          placeholder="Your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-white border-gray-200 rounded-lg px-4 py-3"
                        />
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white border-gray-200 rounded-lg px-4 py-3"
                        />
                        <Button 
                          onClick={handleLeadCapture}
                          className="bg-primary hover:bg-primary-hover text-white w-full py-3 rounded-lg font-medium transition-colors"
                          disabled={!name || !email}
                        >
                          Access Media AI Tools
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* FAQs - matching tool page style */}
                <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-heading font-semibold text-foreground flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-primary" />
                      </div>
                      Frequently Asked Questions
                    </h2>
                    <Accordion type="single" collapsible className="space-y-4">
                      {article.faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`faq-${index}`} className="border border-gray-100 rounded-lg px-4 bg-gray-50/50">
                          <AccordionTrigger className="text-left hover:no-underline py-4 text-foreground font-medium">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600 pb-4 leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>

                {/* Final CTA - matching tool page style */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-8">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Target className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-heading font-semibold text-foreground">
                        {article.cta.split(' →')[0]}
                      </h3>
                      <div className="space-y-3 max-w-2xl mx-auto">
                        {article.mediaAIBenefits.map((benefit, index) => (
                          <div key={index} className="flex items-start justify-start gap-3 text-left">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button 
                      onClick={() => window.open('https://app.media.ai', '_blank')}
                      className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-lg font-medium transition-colors"
                      size="lg"
                    >
                      Open Media AI <ExternalLink className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Resources & Tools - matching tool page style */}
        {(article.relatedResources.length > 0 || article.relatedTools.length > 0) && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-heading font-semibold text-foreground mb-4">
                    Continue Learning
                  </h2>
                  <p className="text-gray-600">
                    Explore related resources and tools to enhance your PR strategy
                  </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  {/* Related Articles */}
                  {article.relatedResources.length > 0 && (
                    <div>
                      <h3 className="text-xl font-heading font-semibold text-foreground mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        Related Articles
                      </h3>
                      <div className="space-y-4">
                        {article.relatedResources.map((resource, index) => (
                          <div key={index} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                            <Link 
                              to={`/resources/${resource.slug}`}
                              className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
                            >
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{resource.title}</span>
                              <ArrowRight className="w-4 h-4 ml-auto" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Tools */}
                  {article.relatedTools.length > 0 && (
                    <div>
                      <h3 className="text-xl font-heading font-semibold text-foreground mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        Related Tools
                      </h3>
                      <div className="space-y-4">
                        {article.relatedTools.map((tool, index) => (
                          <div key={index} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                            <a 
                              href={`https://tools.trymedia.ai/${tool.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
                            >
                              <Shield className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{tool.title}</span>
                              <ExternalLink className="w-4 h-4 ml-auto" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ResourceArticle;