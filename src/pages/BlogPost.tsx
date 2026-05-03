import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import postsData from "@/data/blog-posts.json";
import NotFound from "./NotFound";

type Post = {
  slug: string;
  title: string;
  description: string;
  image: string;
  published: string;
  content: string;
};

const POSTS = postsData as Post[];

const formatDate = (iso?: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const BlogPost = () => {
  const { slug } = useParams();
  const post = POSTS.find((p) => p.slug === slug);

  if (!post) return <NotFound />;

  const url = `https://trymedia.ai/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.published,
    author: { "@type": "Organization", name: "Media AI" },
    publisher: {
      "@type": "Organization",
      name: "Media AI",
      url: "https://trymedia.ai",
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <Layout>
      <Helmet>
        <title>{`${post.title} — Media AI`}</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:image" content={post.image} />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <nav className="mb-8 text-sm">
          <Link to="/blog" className="text-muted-foreground hover:text-foreground">
            ← Back to blog
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl md:text-5xl font-medium text-foreground mb-4 leading-tight">
            {post.title}
          </h1>
          {post.published && (
            <p className="text-sm text-muted-foreground">
              {formatDate(post.published)}
            </p>
          )}
        </header>

        {post.image && (
          <div className="mb-10 rounded-xl overflow-hidden bg-muted">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        <div
          className="blog-content prose prose-neutral max-w-none prose-headings:font-medium prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </Layout>
  );
};

export default BlogPost;
