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
        },
        {
          heading: "Seniority vs Responsiveness",
          content: [
            "Senior editors and well-known journalists often get hundreds of pitches daily. They have high bars for what they'll cover and limited time to respond to new sources.",
            "Mid-level reporters and staff writers are often more accessible and actively looking for good stories. They're building their portfolios and may be more willing to take risks on interesting angles.",
            "Don't ignore freelancers and contributors. They're often highly specialized in their coverage areas and can be excellent long-term contacts for your industry."
          ]
        },
        {
          heading: "Clean, Dedupe & Segment",
          content: [
            "Before launching any campaign, clean your list ruthlessly. Remove duplicates, verify email addresses, and confirm job titles. One bad email can trigger spam filters for your entire domain.",
            "Segment your lists by story angle, not just by publication. The same journalist might be interested in your funding news but not your product launch—tailor your approach accordingly.",
            "Create separate segments for different outreach strategies: exclusives, embargoed announcements, and general pitches. This segmentation will improve your personalization and response rates."
          ]
        },
        {
          heading: "Refresh Cadence & Maintenance",
          content: [
            "Media lists decay quickly. Journalists change beats, switch publications, or leave the industry. Plan to refresh your core lists every 3-4 months minimum.",
            "Set up Google Alerts for key journalists in your space. When they publish relevant stories, take note—it's both a list update opportunity and a personalization touchpoint.",
            "Track your list performance rigorously. Which segments have the highest open rates? Response rates? Coverage rates? Let data guide your list evolution."
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
        },
        {
          question: "How often should I refresh my lists?",
          answer: "Every 3-4 months minimum for core lists. Set up alerts to track journalist moves and beat changes in real-time. The media landscape changes quickly, and stale lists hurt deliverability."
        }
      ],
      mediaAIBenefits: [
        "Search 50,000+ journalists by beat, recent coverage, and engagement patterns",
        "Get automatic alerts when journalists change beats or publications",
        "Access verified contact information and social profiles for targeted outreach"
      ],
      relatedResources: [
        { title: "Crafting Personalized Pitches at Scale", slug: "personalized-pitches-at-scale" },
        { title: "Embargo Etiquette & Timing", slug: "embargo-etiquette-and-timing" },
        { title: "Follow-Up Without Being Annoying", slug: "follow-up-without-being-annoying" }
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
        },
        {
          heading: "Partnership Announcement Template",
          content: [
            "Partnership announcements need to answer the 'so what?' question immediately. What can the combined companies do together that they couldn't do separately?",
            "Include specific collaboration details and joint customer benefits. Vague 'strategic partnerships' rarely get coverage—specificity drives interest.",
            "Quote executives from both companies, each explaining their perspective on the partnership value. Show alignment and mutual benefit."
          ]
        },
        {
          heading: "Event & Conference Template",
          content: [
            "Event announcements should focus on the value for attendees, not the ego of the organizers. What will attendees learn or gain that they can't get elsewhere?",
            "Include notable speakers, agenda highlights, and registration details. Make it easy for journalists to see the newsworthiness.",
            "For industry events, include relevant statistics or trends that position the event as timely and necessary."
          ]
        },
        {
          heading: "Executive Hiring & Appointments",
          content: [
            "Executive announcements should focus on what the hire signals about company direction and growth plans. Why this person, why now?",
            "Include specific background details that relate to your company's challenges and opportunities. Generic bio information doesn't drive coverage.",
            "Quote the new executive on their vision for the role and the CEO on why this hire matters for company strategy."
          ]
        },
        {
          heading: "Boilerplate Best Practices",
          content: [
            "Your boilerplate should be 2-3 sentences maximum and focus on current company status, not founding story. Update it quarterly to reflect recent achievements.",
            "Include concrete metrics where possible—customer count, revenue growth, or market position. Avoid subjective claims like 'leading' or 'revolutionary.'",
            "End with contact information that journalists will actually use—typically your PR contact, not a generic info@ address."
          ]
        }
      ],
      faqs: [
        {
          question: "How long should a press release be?",
          answer: "Aim for 300-500 words maximum. Journalists skim quickly—if they can't understand your story in 30 seconds, they'll move on. Lead with the most newsworthy information."
        },
        {
          question: "Should I include quotes in every release?",
          answer: "Yes, but make them meaningful. Avoid generic 'we're excited' quotes. Use quotes to provide context, explain strategy, or share customer impact that you can't convey in straight narrative."
        },
        {
          question: "When should I use an embargo vs. exclusive?",
          answer: "Use embargoes for coordinated launches where timing matters. Use exclusives for relationship building with key publications. Never use embargoes as a way to create artificial urgency."
        }
      ],
      mediaAIBenefits: [
        "Access press release templates optimized for each journalist's preferences",
        "Find journalists who regularly cover your announcement type",
        "Track which release formats get the best response rates"
      ],
      relatedResources: [
        { title: "A 30-Day PR Plan for Product Launches", slug: "30-day-pr-plan-for-product-launches" },
        { title: "PR for Funding Announcements", slug: "pr-for-funding-announcements" },
        { title: "Build a Press Kit Journalists Actually Use", slug: "press-kit-that-journalists-use" }
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
            "Not all personalization is created equal. Referencing a journalist's recent article shows you're paying attention. Mentioning their beat shows you understand their focus. Commenting on their specific angle shows you respect their perspective.",
            "Look for recent coverage patterns, not just individual articles. If a journalist has written three stories about AI ethics in the past month, that's a stronger signal than one random mention six months ago.",
            "Social media activity can provide personalization gold, but use it sparingly. A Twitter thread about industry trends is fair game; personal vacation photos are not."
          ]
        },
        {
          heading: "Fast Context Capture Systems",
          content: [
            "Build a simple research template: Recent article (1-2 sentences), Beat focus (1 sentence), Personalization angle (1 sentence). This structure keeps research focused and actionable.",
            "Use Google News alerts and Twitter lists to monitor key journalists in your space. When they publish relevant content, add it to your CRM immediately—don't rely on memory.",
            "Create research 'sprints'—dedicate 30 minutes to researching 10-15 journalists rather than doing ad-hoc research as you write each pitch. Batch processing is more efficient."
          ]
        },
        {
          heading: "First-Line Frameworks That Work",
          content: [
            "The 'Recent + Relevant' framework: 'I saw your piece on [specific article] and thought you'd be interested in [related angle].' Simple, direct, and shows you're current on their work.",
            "The 'Beat + Bridge' approach: 'Given your focus on [specific beat area], I wanted to share [relevant story element].' This shows you understand their editorial priorities.",
            "The 'Contrarian Respectful' angle: 'Your recent analysis of [topic] raised an interesting point about [specific detail]. We're seeing a different trend that might interest you.' Shows engagement with their work while offering new perspective."
          ]
        },
        {
          heading: "Proof Points That Build Credibility",
          content: [
            "Lead with external validation when possible: customer metrics, third-party research, industry recognition. These are harder to dismiss than internal claims.",
            "Use specific numbers over ranges: '47% increase' is more credible than 'significant growth.' Precision signals authenticity.",
            "Include unexpected or counterintuitive data points. These create curiosity and suggest there's a deeper story worth exploring."
          ]
        },
        {
          heading: "Follow-Up Logic & Timing",
          content: [
            "Space follow-ups based on the journalist's publishing frequency. Daily news reporters might appreciate a 48-hour follow-up; feature writers might need a week.",
            "Add value in each follow-up rather than just checking in. Share a related data point, industry development, or customer story that wasn't in your original pitch.",
            "Know when to stop. Three follow-ups maximum, and if there's no response after the third, move on gracefully. Persistence becomes pestering quickly."
          ]
        },
        {
          heading: "Tracking Outcomes & Optimization",
          content: [
            "Track more than just coverage—monitor response rates, engagement quality, and relationship development. A 'no' with feedback is often more valuable than silence.",
            "A/B test your personalization approaches. Do journalists respond better to recent article references or beat-focused angles? Let data guide your strategy.",
            "Keep notes on journalist preferences and communication styles. Some prefer brief, bullet-point pitches; others want full context. Tailor accordingly."
          ]
        }
      ],
      faqs: [
        {
          question: "How much personalization is enough?",
          answer: "One or two specific, relevant details are usually sufficient. The goal is to show you're informed about their work, not to prove you've read everything they've ever written."
        },
        {
          question: "Can I reuse personalization elements?",
          answer: "Reuse research frameworks and approaches, but always customize the specific details. Using the same 'recent article' reference for multiple journalists is obvious and counterproductive."
        },
        {
          question: "What about templated personalizations?",
          answer: "Templates for structure are fine, but personalization details must be unique. Consider using merge tags for names and publications, but write custom personalization lines for each journalist."
        }
      ],
      mediaAIBenefits: [
        "Access recent articles and coverage patterns for any journalist in real-time",
        "Get personalization suggestions based on each journalist's beat and interests",
        "Track which personalization approaches get the best response rates"
      ],
      relatedResources: [
        { title: "How to Build a Media List That Actually Gets Replies", slug: "build-a-media-list-that-gets-replies" },
        { title: "Follow-Up Without Being Annoying", slug: "follow-up-without-being-annoying" },
        { title: "Data Storytelling for PR", slug: "data-storytelling-for-pr" }
      ],
      relatedTools: [
        { title: "Pitch Personalization Helper", slug: "pitch-personalization-helper" },
        { title: "Subject Line Split-Tester", slug: "subject-line-split-tester" }
      ],
      cta: "Pull recent coverage & tailor pitches → Open Media AI"
    }

    // I'll continue creating the remaining 21 articles in the next part to keep this manageable
  };

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
              {/* Cover Image Placeholder */}
              <div className="w-full h-64 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl mb-12 flex items-center justify-center">
                <div className="text-center">
                  <IconComponent className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Cover image placeholder</p>
                </div>
              </div>

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
                  <Link to={`/resources/${resource.slug}`} className="block">
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
