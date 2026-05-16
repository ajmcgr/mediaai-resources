import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowRight } from "lucide-react";
import { GUIDES } from "./guides";

const GuidesHub = () => {
  const groups: Record<string, typeof GUIDES> = {
    "Best-of guides": GUIDES.filter((g) => g.kind === "best"),
    "Comparisons": GUIDES.filter((g) => g.kind === "vs"),
    "Alternatives": GUIDES.filter((g) => g.kind === "alternative"),
    "Templates": GUIDES.filter((g) => g.kind === "templates"),
  };

  return (
    <Layout>
      <Helmet>
        <title>PR Guides, Comparisons & Templates — Media AI</title>
        <meta
          name="description"
          content="In-depth PR guides: best AI tools for PR teams, comparisons, alternatives, and battle-tested pitch templates."
        />
        <link rel="canonical" href="https://trymedia.ai/guides" />
        <meta property="og:url" content="https://trymedia.ai/guides" />
        <meta property="og:title" content="PR Guides, Comparisons & Templates" />
        <meta
          property="og:description"
          content="In-depth PR guides, tool comparisons, alternatives, and pitch templates."
        />
      </Helmet>

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <header className="mb-12">
          <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
            Guides
          </p>
          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-4">
            PR Guides, Comparisons & Templates
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Opinionated, no-fluff guides for PR teams, founders, and comms managers.
          </p>
        </header>

        <div className="space-y-12">
          {Object.entries(groups).map(([title, items]) =>
            items.length === 0 ? null : (
              <div key={title}>
                <h2 className="text-xl font-medium mb-4">{title}</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {items.map((g) => (
                    <Link
                      key={g.slug}
                      to={`/guides/${g.slug}`}
                      className="border border-border rounded-xl p-5 bg-card hover:border-foreground/30 transition-colors"
                    >
                      <h3 className="font-medium mb-1 flex items-center justify-between gap-2">
                        <span>{g.h1}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </h3>
                      <p className="text-sm text-muted-foreground">{g.metaDescription}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </Layout>
  );
};

export default GuidesHub;
