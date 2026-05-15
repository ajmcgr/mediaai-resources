import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useBlogPosts } from "@/hooks/useBlog";

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const Blog = () => {
  const { data: POSTS = [] } = useBlogPosts();
  const [featured, ...rest] = POSTS;

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

      <section className="container mx-auto px-6 py-20 max-w-5xl">
        {/* Header */}
        <header className="mb-16">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-6">
            The Media AI Blog
          </p>
          <h1 className="text-5xl md:text-6xl font-medium text-foreground leading-[1.05] tracking-tight mb-6 max-w-3xl">
            Playbooks for modern PR and media teams.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Tactics, case studies, and field notes on PR, AI, influencer marketing, and earned media.
          </p>
        </header>

        {/* Featured post */}
        {featured && (
          <Link
            to={`/blog/${featured.slug}`}
            className="group block mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-medium text-foreground leading-tight tracking-tight mb-4 group-hover:text-primary transition-colors max-w-3xl">
              {featured.title}
            </h2>
            <p className="text-base text-muted-foreground mb-4 max-w-2xl">
              {featured.description}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDate(featured.published)}
            </p>
          </Link>
        )}

        <hr className="border-border mb-12" />

        {/* More articles */}
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-10">
          More articles
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-14">
          {rest.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group block"
            >
              <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted mb-5">
                <img
                  src={post.image}
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-medium text-foreground leading-snug tracking-tight mb-3 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {post.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(post.published)}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
