import { useState, useEffect } from "react";
import { updatePageSEO, addStructuredData } from "@/utils/seo";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter,
  ArrowRight,
  Clock,
  BookOpen,
  TrendingUp,
  Users,
  FileText,
  Shield,
  Lightbulb,
  Star
} from "lucide-react";

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Pitching", "Releases", "Influencer", "Measurement", "Workflow", "Compliance", "Thought Leadership"];

  const allResources = [
    // Pitching Resources
    { 
      title: "How to Build a Media List That Actually Gets Replies", 
      summary: "Define your audience, map beats, and create targeted lists that earn coverage.", 
      readingTime: "8 min read",
      slug: "build-a-media-list-that-gets-replies", 
      category: "Pitching",
      icon: Users,
      popular: true
    },
    { 
      title: "Crafting Personalized Pitches at Scale", 
      summary: "Turn research into first-line personalization that wins replies—at scale.", 
      readingTime: "6 min read",
      slug: "personalized-pitches-at-scale", 
      category: "Pitching",
      icon: BookOpen,
      popular: true
    },
    { 
      title: "Embargo Etiquette & Timing", 
      summary: "When to pitch, who to brief, and how to set fair embargoes.", 
      readingTime: "5 min read",
      slug: "embargo-etiquette-and-timing", 
      category: "Pitching",
      icon: Clock,
      popular: false
    },
    { 
      title: "Follow-Up Without Being Annoying", 
      summary: "Timing, tone, and templates to follow up like a pro.", 
      readingTime: "4 min read",
      slug: "follow-up-without-being-annoying", 
      category: "Pitching",
      icon: FileText,
      popular: false
    },
    { 
      title: "Data Storytelling for PR", 
      summary: "Turn product or survey data into defensible, newsworthy angles.", 
      readingTime: "9 min read",
      slug: "data-storytelling-for-pr", 
      category: "Pitching",
      icon: TrendingUp,
      popular: false
    },
    { 
      title: "Exclusive vs Wide Pitching: How to Choose", 
      summary: "A decision framework for coverage quality and speed.", 
      readingTime: "6 min read",
      slug: "exclusive-vs-wide-pitching", 
      category: "Pitching",
      icon: BookOpen,
      popular: false
    },

    // Releases Resources
    { 
      title: "Press Release Templates by Announcement Type", 
      summary: "Ready-to-use structures for funding, product, partnership, and event releases.", 
      readingTime: "7 min read",
      slug: "press-release-templates-by-announcement-type", 
      category: "Releases",
      icon: FileText,
      popular: true
    },
    { 
      title: "A 30-Day PR Plan for Product Launches", 
      summary: "Day-by-day checklist from pre-brief to post-coverage.", 
      readingTime: "10 min read",
      slug: "30-day-pr-plan-for-product-launches", 
      category: "Releases",
      icon: BookOpen,
      popular: false
    },
    { 
      title: "PR for Funding Announcements", 
      summary: "Exclusives, syndication, and investor quotes done right.", 
      readingTime: "8 min read",
      slug: "pr-for-funding-announcements", 
      category: "Releases",
      icon: TrendingUp,
      popular: false
    },
    { 
      title: "Build a Press Kit Journalists Actually Use", 
      summary: "Files, formats, and structure that remove friction.", 
      readingTime: "5 min read",
      slug: "press-kit-that-journalists-use", 
      category: "Releases",
      icon: FileText,
      popular: false
    },

    // Influencer Resources
    { 
      title: "Influencer Briefs That Drive Results", 
      summary: "Clear deliverables, usage rights, and creative freedom.", 
      readingTime: "6 min read",
      slug: "influencer-briefs-that-drive-results", 
      category: "Influencer",
      icon: Users,
      popular: false
    },
    { 
      title: "FTC/ASA Disclosure for Influencer Campaigns", 
      summary: "Simple rules, clear captions, and platform nuances.", 
      readingTime: "4 min read",
      slug: "ftc-asa-disclosure-for-campaigns", 
      category: "Influencer",
      icon: Shield,
      popular: false
    },
    { 
      title: "Using Reviews & Social Proof in PR", 
      summary: "Turn G2/Capterra and UGC into media-worthy angles.", 
      readingTime: "5 min read",
      slug: "using-reviews-and-social-proof-in-pr", 
      category: "Influencer",
      icon: TrendingUp,
      popular: false
    },

    // Measurement Resources
    { 
      title: "PR Measurement with the AMEC Framework", 
      summary: "Inputs → Outputs → Outcomes: a practical measurement plan.", 
      readingTime: "9 min read",
      slug: "amec-framework-for-pr-measurement", 
      category: "Measurement",
      icon: TrendingUp,
      popular: true
    },
    { 
      title: "PR Attribution with UTMs & Post-Coverage Tracking", 
      summary: "Set UTM standards and measure coverage effects properly.", 
      readingTime: "7 min read",
      slug: "pr-attribution-with-utms", 
      category: "Measurement",
      icon: BookOpen,
      popular: false
    },
    { 
      title: "Digital PR for Link Building (Without Spam)", 
      summary: "Earn high-quality links through stories, not schemes.", 
      readingTime: "8 min read",
      slug: "digital-pr-link-building", 
      category: "Measurement",
      icon: TrendingUp,
      popular: false
    },

    // Workflow Resources
    { 
      title: "Founder Media Training: The Basics", 
      summary: "Message maps, bridging, and quote-worthy soundbites.", 
      readingTime: "6 min read",
      slug: "founder-media-training-basics", 
      category: "Workflow",
      icon: Users,
      popular: false
    },
    { 
      title: "Working with Freelance Journalists", 
      summary: "Why freelancers matter and how to collaborate well.", 
      readingTime: "5 min read",
      slug: "working-with-freelance-journalists", 
      category: "Workflow",
      icon: Users,
      popular: false
    },
    { 
      title: "Pitching Podcasts for Brand Story", 
      summary: "Find, pitch, and prep for high-fit podcasts.", 
      readingTime: "7 min read",
      slug: "pitching-podcasts-for-brand-story", 
      category: "Workflow",
      icon: BookOpen,
      popular: false
    },
    { 
      title: "Messaging & Positioning for PR Teams", 
      summary: "Craft narratives editors—and customers—remember.", 
      readingTime: "8 min read",
      slug: "messaging-and-positioning-for-pr", 
      category: "Workflow",
      icon: Lightbulb,
      popular: false
    },
    { 
      title: "International PR: Localize by Market", 
      summary: "Angles, assets, and timing that respect each region.", 
      readingTime: "9 min read",
      slug: "international-pr-localization", 
      category: "Workflow",
      icon: BookOpen,
      popular: false
    },

    // Compliance Resources
    { 
      title: "Crisis Communications Playbook", 
      summary: "Holding statements, approvals, and rapid triage.", 
      readingTime: "10 min read",
      slug: "crisis-communications-playbook", 
      category: "Compliance",
      icon: Shield,
      popular: false
    },
    { 
      title: "Seasonality, Calendars & Newsjacking (Safely)", 
      summary: "Plan content around moments without being tone-deaf.", 
      readingTime: "6 min read",
      slug: "seasonality-calendar-and-newsjacking", 
      category: "Compliance",
      icon: Clock,
      popular: false
    },

    // Thought Leadership Resources
    { 
      title: "Thought Leadership: From Idea to Op-Ed", 
      summary: "Turn founder POVs into publishable bylines.", 
      readingTime: "8 min read",
      slug: "thought-leadership-to-op-ed", 
      category: "Thought Leadership",
      icon: Lightbulb,
      popular: false
    }
  ];

  const filteredResources = allResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    updatePageSEO(
      "Free PR & Social Media Resources Hub | Media AI",
      "Expert guides and templates for PR professionals. Build media lists, craft pitches, measure coverage, and scale your PR strategy.",
      "PR resources, media list building, pitch templates, PR measurement, crisis communications, influencer marketing, press releases"
    );

    // Add structured data
    addStructuredData({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "PR & Social Media Resources Hub",
      "description": "Expert guides and templates for PR professionals",
      "url": window.location.href,
      "publisher": {
        "@type": "Organization",
        "name": "Media AI"
      }
    });
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-hero-gradient py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Expert PR & Social Media Resources
            </h1>
            <p className="text-xl text-white/90 mb-8">
              24 evergreen guides, templates, and playbooks to master your PR strategy. 
              From building media lists to measuring impact.
            </p>
            <div className="flex items-center justify-center space-x-2 text-white/80">
              <Star className="h-5 w-5 text-yellow-300 fill-current" />
              <span>Always free • No signup required • Expert insights</span>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-16 bg-subtle-gradient">
        <div className="container mx-auto px-4">
          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-field"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? "btn-primary" : "btn-secondary"}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => {
              const IconComponent = resource.icon;
              return (
                <Card key={resource.slug} className="card-tool group cursor-pointer">
                  <Link to={`/resources/${resource.slug}`} className="block">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {resource.popular && (
                          <Badge className="bg-primary text-primary-foreground">
                            Popular
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {resource.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                      {resource.summary}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{resource.readingTime}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                  
                  {/* CTA Section */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">
                      Ready for the full experience?
                    </p>
                    <Button asChild size="sm" variant="outline" className="w-full text-xs">
                      <a 
                        href="https://trymedia.ai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Try Media AI Platform
                      </a>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No resources found matching your criteria.</p>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                variant="secondary"
                className="mt-4"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to put these strategies into action?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              These guides work even better with Media AI's database of 50,000+ journalists, 
              influencers, and podcasters.
            </p>
            <Button asChild className="btn-primary">
              <a 
                href="https://trymedia.ai" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Start Free Trial
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Resources;