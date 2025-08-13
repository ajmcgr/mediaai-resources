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
      intro: "Stop wasting time on lists that don't convert. Learn how to build targeted media lists that earn opens, replies, and coverage—without the bloat.",
      category: "Pitching",
      readingTime: "8 min read",
      icon: Users,
      sections: [
        {
          heading: "Define Your Story & Audience",
          content: [
            "Before you start building any list, you need clarity on your story and who would care about it. This isn't just about your target market—it's about understanding which journalists cover stories like yours.",
            "Start by analyzing similar announcements in your space. What angles did they take? Which publications covered them? Who wrote the stories? This competitive research forms the foundation of your targeting strategy.",
            "Create a simple story-audience matrix: What's your primary angle? What's your secondary angle? Who are the primary audiences for each? This clarity will guide every list-building decision you make."
          ]
        },
        {
          heading: "Map Beats & Outlets",
          content: [
            "Not all tech reporters cover the same stories. Some focus on enterprise software, others on consumer apps, and others on AI and emerging tech. Understanding these beat differences is crucial for list quality.",
            "Start with tier-1 outlets in your industry, then map the specific beats within each publication. TechCrunch has different writers for startups, enterprise, and AI—pitch the right person for your story.",
            "Don't forget specialized publications and newsletters. Sometimes a targeted industry newsletter with 5,000 subscribers will deliver better results than a broad publication with millions."
          ]
        },
        {
          heading: "Qualify by Recency & Relevance",
          content: [
            "Recency is your best predictor of responsiveness. If a journalist hasn't written about your topic in the past 6 months, they're probably not actively covering that beat anymore.",
            "Look for journalists who have covered similar companies, funding rounds, product launches, or industry trends within the past 3-6 months. This recent activity indicates an active interest in your space.",
            "Quality over quantity always wins. A focused list of 50 highly relevant, recently active journalists will outperform a scattered list of 500 any day."
          ]
        }
      ],
      faqs: [
        {
          question: "How big should a media list be?",
          answer: "Quality trumps quantity. A focused list of 50-100 highly relevant, recently active journalists typically performs better than a scattered list of 500. Start small and expand based on performance."
        },
        {
          question: "Should I focus on beats or topics?",
          answer: "Both matter, but beats are more reliable. A journalist covering the AI beat is more likely to be interested in AI stories than someone who occasionally mentions AI but covers general business news."
        }
      ],
      mediaAIBenefits: [
        "Search 50,000+ journalists by beat, recent coverage, and engagement patterns",
        "Get automatic alerts when journalists change beats or publications",
        "Access verified contact information and social profiles for targeted outreach"
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
      intro: "Generic pitches get deleted. Personal ones get responses. Learn how to research efficiently and personalize at scale without sacrificing authenticity.",
      category: "Pitching",
      readingTime: "6 min read",
      icon: BookOpen,
      sections: [
        {
          heading: "Research Signals That Matter",
          content: [
            "Not all personalization is created equal. Referencing a journalist's recent article shows you're paying attention. Mentioning their beat shows you understand their focus.",
            "Look for recent coverage patterns, not just individual articles. If a journalist has written three stories about AI ethics in the past month, that's a stronger signal.",
            "Social media activity can provide personalization gold, but use it sparingly. A Twitter thread about industry trends is fair game; personal vacation photos are not."
          ]
        }
      ],
      faqs: [
        {
          question: "How much personalization is enough?",
          answer: "One or two specific, relevant details are usually sufficient. The goal is to show you're informed about their work, not to prove you've read everything they've ever written."
        }
      ],
      mediaAIBenefits: [
        "Access recent articles and coverage patterns for any journalist in real-time",
        "Get personalization suggestions based on each journalist's beat and interests",
        "Track which personalization approaches get the best response rates"
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
      intro: "Move beyond vanity metrics. Learn how to measure PR impact using the industry-standard AMEC framework.",
      category: "Measurement",
      readingTime: "9 min read",
      icon: TrendingUp,
      sections: [
        {
          heading: "Objectives & Goal Setting",
          content: [
            "Before measuring anything, establish clear objectives. Are you building brand awareness, driving website traffic, generating leads, or managing reputation?",
            "Use SMART criteria for PR objectives: Specific, Measurable, Achievable, Relevant, Time-bound. 'Increase brand awareness' is vague; 'Increase aided brand recognition by 15% among target audience within 6 months' is actionable.",
            "Align PR objectives with broader business goals. If the company is focused on customer acquisition, your PR should support that with metrics like qualified leads from media coverage."
          ]
        }
      ],
      faqs: [
        {
          question: "Should I still track AVE (Advertising Value Equivalent)?",
          answer: "AVE is widely considered outdated and misleading. Focus on outcomes and business impact instead."
        }
      ],
      mediaAIBenefits: [
        "Track coverage quality and sentiment across all your campaigns automatically",
        "Generate comprehensive reports showing PR's impact on business metrics",
        "Monitor competitor share of voice and benchmark your performance"
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
              <Link to="/resources" className="text-muted-foreground hover:text-primary">
                Resources
              </Link>
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