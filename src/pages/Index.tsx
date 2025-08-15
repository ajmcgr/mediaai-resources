import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  ArrowRight,
  Clock,
  BookOpen,
  TrendingUp,
  Users,
  FileText,
  Shield,
  Lightbulb,
  RefreshCw,
  BarChart3
} from "lucide-react";

const Index = () => {
  const allResources = [
    // Pitching Resources
    { 
      title: "How to Build a Media List That Actually Gets Replies", 
      description: "Define your audience, map beats, and create targeted lists that earn coverage.", 
      icon: Users,
      slug: "build-a-media-list-that-gets-replies", 
      category: "Pitching"
    },
    { 
      title: "The Art of Follow-Up: Converting No-Responses to Coverage", 
      description: "Strategic follow-up sequences that turn silence into story placements without being pushy.", 
      icon: RefreshCw,
      slug: "follow-up-strategies-for-pr-coverage", 
      category: "Pitching"
    },
    { 
      title: "Embargo Etiquette & Timing", 
      description: "When to pitch, who to brief, and how to set fair embargoes.", 
      icon: Clock,
      slug: "embargo-etiquette-and-timing", 
      category: "Pitching"
    },
    { 
      title: "Follow-Up Without Being Annoying", 
      description: "Timing, tone, and templates to follow up like a pro.", 
      icon: FileText,
      slug: "follow-up-without-being-annoying", 
      category: "Pitching"
    },
    { 
      title: "Data Storytelling for PR", 
      description: "Turn product or survey data into defensible, newsworthy angles.", 
      icon: TrendingUp,
      slug: "data-storytelling-for-pr", 
      category: "Pitching"
    },
    { 
      title: "Exclusive vs Wide Pitching: How to Choose", 
      description: "A decision framework for coverage quality and speed.", 
      icon: BookOpen,
      slug: "exclusive-vs-wide-pitching", 
      category: "Pitching"
    },

    // Releases Resources
    { 
      title: "Press Release Templates by Announcement Type", 
      description: "Ready-to-use structures for funding, product, partnership, and event releases.", 
      icon: FileText,
      slug: "press-release-templates-by-announcement-type", 
      category: "Releases"
    },
    { 
      title: "A 30-Day PR Plan for Product Launches", 
      description: "Day-by-day checklist from pre-brief to post-coverage.", 
      icon: BookOpen,
      slug: "30-day-pr-plan-for-product-launches", 
      category: "Releases"
    },
    { 
      title: "PR for Funding Announcements", 
      description: "Exclusives, syndication, and investor quotes done right.", 
      icon: TrendingUp,
      slug: "pr-for-funding-announcements", 
      category: "Releases"
    },
    { 
      title: "Build a Press Kit Journalists Actually Use", 
      description: "Files, formats, and structure that remove friction.", 
      icon: FileText,
      slug: "press-kit-that-journalists-use", 
      category: "Releases"
    },

    // Influencer Resources
    { 
      title: "Influencer Briefs That Drive Results", 
      description: "Clear deliverables, usage rights, and creative freedom.", 
      icon: Users,
      slug: "influencer-briefs-that-drive-results", 
      category: "Influencer"
    },
    { 
      title: "FTC/ASA Disclosure for Influencer Campaigns", 
      description: "Simple rules, clear captions, and platform nuances.", 
      icon: Shield,
      slug: "ftc-asa-disclosure-for-campaigns", 
      category: "Influencer"
    },
    { 
      title: "Using Reviews & Social Proof in PR", 
      description: "Turn G2/Capterra and UGC into media-worthy angles.", 
      icon: TrendingUp,
      slug: "using-reviews-and-social-proof-in-pr", 
      category: "Influencer"
    },

    // Measurement Resources
    { 
      title: "Social Media ROI: Proving PR Value in the Digital Age", 
      description: "Track engagement, conversions, and brand lift to demonstrate clear PR ROI.", 
      icon: BarChart3,
      slug: "social-media-roi-measurement-guide", 
      category: "Measurement"
    },
    { 
      title: "PR Attribution with UTMs & Post-Coverage Tracking", 
      description: "Set UTM standards and measure coverage effects properly.", 
      icon: BookOpen,
      slug: "pr-attribution-with-utms", 
      category: "Measurement"
    },
    { 
      title: "Digital PR for Link Building (Without Spam)", 
      description: "Earn high-quality links through stories, not schemes.", 
      icon: TrendingUp,
      slug: "digital-pr-link-building", 
      category: "Measurement"
    },

    // Workflow Resources
    { 
      title: "Founder Media Training: The Basics", 
      description: "Message maps, bridging, and quote-worthy soundbites.", 
      icon: Users,
      slug: "founder-media-training-basics", 
      category: "Workflow"
    },
    { 
      title: "Working with Freelance Journalists", 
      description: "Why freelancers matter and how to collaborate well.", 
      icon: Users,
      slug: "working-with-freelance-journalists", 
      category: "Workflow"
    },
    { 
      title: "Pitching Podcasts for Brand Story", 
      description: "Find, pitch, and prep for high-fit podcasts.", 
      icon: BookOpen,
      slug: "pitching-podcasts-for-brand-story", 
      category: "Workflow"
    },
    { 
      title: "Messaging & Positioning for PR Teams", 
      description: "Craft narratives editors—and customers—remember.", 
      icon: Lightbulb,
      slug: "messaging-and-positioning-for-pr", 
      category: "Workflow"
    },
    { 
      title: "International PR: Localize by Market", 
      description: "Angles, assets, and timing that respect each region.", 
      icon: BookOpen,
      slug: "international-pr-localization", 
      category: "Workflow"
    },

    // Compliance Resources
    { 
      title: "Crisis Communications Playbook", 
      description: "Holding statements, approvals, and rapid triage.", 
      icon: Shield,
      slug: "crisis-communications-playbook", 
      category: "Compliance"
    },
    { 
      title: "Seasonality, Calendars & Newsjacking (Safely)", 
      description: "Plan content around moments without being tone-deaf.", 
      icon: Clock,
      slug: "seasonality-calendar-and-newsjacking", 
      category: "Compliance"
    },

    // Thought Leadership Resources
    { 
      title: "Thought Leadership: From Idea to Op-Ed", 
      description: "Turn founder POVs into publishable bylines.", 
      icon: Lightbulb,
      slug: "thought-leadership-to-op-ed", 
      category: "Thought Leadership"
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal text-foreground mb-8 text-center">
            Free PR & Social Media Resources
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allResources.map((resource) => {
              const IconComponent = resource.icon;
              const isExternalLink = resource.slug.startsWith('http');
              
              const cardContent = (
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-normal text-foreground mb-2 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {resource.category}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              );

              return (
                <Card key={resource.slug} className="p-6 hover:shadow-lg transition-all duration-300 group">
                  {isExternalLink ? (
                    <a href={resource.slug} target="_blank" rel="noopener noreferrer" className="block">
                      {cardContent}
                    </a>
                  ) : (
                    <Link to={`/${resource.slug}`} className="block">
                      {cardContent}
                    </Link>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
