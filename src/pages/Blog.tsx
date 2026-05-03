import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import postsData from "@/data/blog-posts.json";

type Post = {
  slug: string;
  title: string;
  description: string;
  image: string;
  published: string;
  content: string;
};

const POSTS = (postsData as Post[]).slice().sort((a, b) =>
  (b.published || "").localeCompare(a.published || "")
);

const Blog = () => {
  return (
    <Layout>
      <Helmet>
        <title>Blog — Media AI</title>
        <meta
          name="description"
          content="Insights on PR, AI, influencer marketing and media strategy from the Media AI team."
        />
        <link rel="canonical" href="https://trymedia.ai/blog" />
      </Helmet>

      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-3">
            Latest from the blog
          </h1>
          <p className="text-lg text-muted-foreground">
            Insights on PR, AI, and influencer marketing.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
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
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {post.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
