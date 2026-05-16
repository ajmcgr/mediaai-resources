import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowRight } from "lucide-react";
import { COMPETITORS } from "./competitors";

const CompareHub = () => {
  return (
    <Layout>
      <Helmet>
        <title>Compare Media AI vs Alternatives — Muck Rack, Cision, Meltwater & more</title>
        <meta
          name="description"
          content="See how Media AI compares to Muck Rack, Cision, Meltwater, GRIN, HypeAuditor, Later, and Impact.com. Modern, AI-first PR and creator outreach at a fraction of the cost."
        />
        <link rel="canonical" href="https://trymedia.ai/compare" />
        <meta property="og:url" content="https://trymedia.ai/compare" />
        <meta property="og:title" content="Compare Media AI vs Alternatives" />
        <meta
          property="og:description"
          content="Side-by-side comparisons of Media AI vs the leading PR, media monitoring, and influencer platforms."
        />
      </Helmet>

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <header className="mb-12 text-center">
          <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
            Compare
          </p>
          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-4">
            Media AI vs the alternatives
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Honest, side-by-side comparisons against the leading PR, media
            monitoring, and creator-marketing platforms.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {COMPETITORS.map((c) => (
            <Link
              key={c.slug}
              to={`/compare/${c.slug}`}
              className="group border border-border rounded-xl p-6 hover:border-foreground/30 transition-colors bg-card"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                {c.category}
              </p>
              <h2 className="text-xl font-medium text-foreground mb-2">
                Media AI vs {c.name}
              </h2>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {c.tagline}
              </p>
              <span className="inline-flex items-center text-sm text-primary font-medium">
                See comparison
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default CompareHub;
