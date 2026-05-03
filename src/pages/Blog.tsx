import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";

type Post = {
  title: string;
  excerpt: string;
  url: string;
  image: string;
  date?: string;
};

const POSTS: Post[] = [
  {
    title: "How To Choose Influencers Using Predictive Analytics",
    excerpt: "Learn how predictive analytics transforms influencer selection, enabling brands to make data-driven decisions for successful campaigns.",
    url: "https://blog.trymedia.ai/how-to-choose-influencers-using-predictive-analytics/",
    image: "https://assets.seobotai.com/cdn-cgi/image/quality=75,w=1536,h=1024/trymedia.ai/6907f29d9cea6427b3145c91-1762136692318.jpg",
  },
  {
    title: "How AI Enhances Influencer Collaboration",
    excerpt: "Explore how AI is revolutionizing influencer marketing by streamlining discovery, enhancing collaboration, and personalizing campaigns for better results.",
    url: "https://blog.trymedia.ai/how-ai-enhances-influencer-collaboration/",
    image: "https://storage.ghost.io/c/dc/51/dc517523-dce5-4e03-ac18-63c2dc714b15/content/images/size/w600/2025/10/image-1761532963454.jpeg",
  },
  {
    title: "Top AI Tools for Influencer Campaigns",
    excerpt: "Explore how AI tools are reshaping influencer marketing by streamlining creator discovery, enhancing campaign management, and improving ROI.",
    url: "https://blog.trymedia.ai/top-ai-tools-for-influencer-campaigns/",
    image: "https://storage.ghost.io/c/dc/51/dc517523-dce5-4e03-ac18-63c2dc714b15/content/images/size/w600/2025/10/image-1761038351304.jpeg",
  },
  {
    title: "Top Multi-Platform Campaigns: Lessons for Brand Stories",
    excerpt: "Learn how to create impactful multi-platform campaigns that engage audiences, boost conversions, and tell consistent brand stories across channels.",
    url: "https://blog.trymedia.ai/top-multi-platform-campaigns-lessons-for-brand-stories/",
    image: "https://storage.ghost.io/c/dc/51/dc517523-dce5-4e03-ac18-63c2dc714b15/content/images/size/w600/2025/10/image-1760332316096.jpeg",
  },
  {
    title: "How Predictive Analytics Improves Journalist Targeting",
    excerpt: "Explore how predictive analytics enhances journalist targeting in PR, boosting engagement through data-driven strategies and personalized outreach.",
    url: "https://blog.trymedia.ai/how-predictive-analytics-improves-journalist-targeting/",
    image: "https://storage.ghost.io/c/dc/51/dc517523-dce5-4e03-ac18-63c2dc714b15/content/images/size/w600/2025/10/image-1759726334649.jpeg",
  },
  {
    title: "Top AI Tools for Unified Campaign Messaging",
    excerpt: "Explore essential AI tools that streamline consistent messaging across various channels for effective campaigns and improved brand alignment.",
    url: "https://blog.trymedia.ai/top-ai-tools-for-unified-campaign-messaging/",
    image: "https://storage.ghost.io/c/dc/51/dc517523-dce5-4e03-ac18-63c2dc714b15/content/images/size/w600/2025/09/image-1759121130250.jpeg",
  },
  {
    title: "AI in Media Relations: Common Challenges Solved",
    excerpt: "Explore how AI is transforming media relations by streamlining tasks, enhancing personalization, and fostering stronger journalist connections.",
    url: "https://blog.trymedia.ai/ai-in-media-relations-common-challenges-solved/",
    image: "https://storage.ghost.io/c/dc/51/dc517523-dce5-4e03-ac18-63c2dc714b15/content/images/size/w600/2025/09/image-1758884526640.jpeg",
  },
  {
    title: "AI vs. Manual Journalist Outreach: Key Differences",
    excerpt: "Explore the pros and cons of AI vs. manual journalist outreach, and discover how a hybrid approach can enhance your PR campaigns.",
    url: "https://blog.trymedia.ai/ai-vs-manual-journalist-outreach-key-differences/",
    image: "https://storage.ghost.io/c/dc/51/dc517523-dce5-4e03-ac18-63c2dc714b15/content/images/size/w600/2025/09/image-1758878406054.jpeg",
  },
  {
    title: "Cross-Platform Metrics: What PR Teams Need to Know",
    excerpt: "Learn how to effectively measure and optimize PR campaigns across multiple platforms for improved insights and better decision-making.",
    url: "https://blog.trymedia.ai/cross-platform-metrics-what-pr-teams-need-to-know/",
    image: "https://assets.seobotai.com/cdn-cgi/image/quality=75,w=1536,h=1024/trymedia.ai/68cc9fa87b5c01ae36893a32-1758247466961.jpg",
  },
  {
    title: "Research: AI Transparency and Media Trust",
    excerpt: "AI transparency in media enhances audience trust, highlighting the importance of clear disclosure and human oversight in journalism.",
    url: "https://blog.trymedia.ai/research-ai-transparency-and-media-trust/",
    image: "https://storage.ghost.io/c/dc/51/dc517523-dce5-4e03-ac18-63c2dc714b15/content/images/size/w600/2025/09/image-1758074764995.jpeg",
  },
  {
    title: "AI Scheduling for Influencer Campaigns: Tips and Tools",
    excerpt: "Explore how AI tools streamline influencer campaign management, enhancing scheduling, compliance, and performance tracking for better results.",
    url: "https://blog.trymedia.ai/ai-scheduling-for-influencer-campaigns-tips-and-tools/",
    image: "https://storage.ghost.io/c/dc/51/dc517523-dce5-4e03-ac18-63c2dc714b15/content/images/size/w600/2025/09/image-1757911757330.jpeg",
  },
  {
    title: "10 Metrics for Measuring Stakeholder Sentiment",
    excerpt: "Explore 10 essential metrics to measure stakeholder sentiment and enhance your brand's communication strategies effectively.",
    url: "https://blog.trymedia.ai/10-metrics-for-measuring-stakeholder-sentiment/",
    image: "https://storage.ghost.io/c/dc/51/dc517523-dce5-4e03-ac18-63c2dc714b15/content/images/size/w600/2025/09/image-1757658594200.jpeg",
  },
];

const Blog = () => {
  return (
    <Layout>
      <Helmet>
        <title>Blog — Media AI</title>
        <meta name="description" content="Insights on PR, AI, influencer marketing and media strategy from the Media AI team." />
      </Helmet>

      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-3">Latest from the blog</h1>
          <p className="text-lg text-muted-foreground">
            Insights on PR, AI, and influencer marketing.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {POSTS.map((post) => (
            <a
              key={post.url}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={post.image}
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                />
              </div>
              <div className="p-5">
                <h2 className="text-lg font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="https://blog.trymedia.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            View all posts on blog.trymedia.ai →
          </a>
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
