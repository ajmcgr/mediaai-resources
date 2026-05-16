import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Star } from "lucide-react";
import { getGuide, GUIDES } from "./guides";
import NotFound from "@/pages/NotFound";

const SITE = "https://trymedia.ai";

const GuidePage = () => {
  const { slug = "" } = useParams();
  const g = getGuide(slug);
  if (!g) return <NotFound />;

  const url = `${SITE}/guides/${g.slug}`;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: g.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.h1,
    description: g.metaDescription,
    datePublished: g.publishedAt,
    dateModified: g.updatedAt,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Media AI" },
    publisher: {
      "@type": "Organization",
      name: "Media AI",
      url: "https://trymedia.ai",
    },
  };

  // Sibling guides of same kind for related module
  const siblings = GUIDES.filter((x) => x.slug !== g.slug).slice(0, 4);

  return (
    <Layout>
      <Helmet>
        <title>{g.title}</title>
        <meta name="description" content={g.metaDescription} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={g.title} />
        <meta property="og:description" content={g.metaDescription} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={g.title} />
        <meta name="twitter:description" content={g.metaDescription} />
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <article className="container mx-auto px-4 py-16 max-w-4xl">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/guides" className="hover:text-foreground">Guides</Link>
          <span className="mx-2">/</span>
          <span className="capitalize">{g.cluster}</span>
        </nav>

        <header className="mb-10">
          <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
            {labelForKind(g.kind)}
          </p>
          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-4">
            {g.h1}
          </h1>
          <p className="text-lg text-muted-foreground whitespace-pre-line">
            {g.intro}
          </p>
        </header>

        {g.problemFraming && (
          <section className="mb-12 border-l-2 border-primary/40 pl-5">
            <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
              How to read this list
            </h2>
            <p className="text-foreground">{g.problemFraming}</p>
          </section>
        )}

        {/* Items: best / alternative */}
        {g.items && g.items.length > 0 && (
          <section className="mb-12 space-y-6">
            <h2 className="text-2xl font-medium">The options</h2>
            {g.items.map((item, idx) => (
              <div
                key={item.name}
                className="border border-border rounded-xl p-6 bg-card"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-xl font-medium">
                    <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                    {item.link ? (
                      <Link to={item.link} className="hover:text-primary">
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    )}
                  </h3>
                  {item.pricing && (
                    <span className="text-xs text-muted-foreground shrink-0 mt-1">
                      {item.pricing}
                    </span>
                  )}
                </div>
                <p className="text-foreground mb-4">{item.blurb}</p>
                {item.bestFor && (
                  <p className="text-sm text-muted-foreground mb-3">
                    <span className="font-medium text-foreground">Best for:</span>{" "}
                    {item.bestFor}
                  </p>
                )}
                {(item.pros || item.cons) && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
                    {item.pros && (
                      <div>
                        <p className="font-medium mb-2">Pros</p>
                        <ul className="space-y-1.5">
                          {item.pros.map((p) => (
                            <li key={p} className="flex gap-2">
                              <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.cons && (
                      <div>
                        <p className="font-medium mb-2 text-muted-foreground">Cons</p>
                        <ul className="space-y-1.5 text-muted-foreground">
                          {item.cons.map((c) => (
                            <li key={c}>— {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {item.link && (
                  <div className="mt-4">
                    <Link
                      to={item.link}
                      className="text-sm text-primary hover:underline inline-flex items-center"
                    >
                      Learn more <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Comparison: vs */}
        {g.comparison && (
          <section className="mb-12">
            <h2 className="text-2xl font-medium mb-4">Side-by-side</h2>
            <div className="border border-border rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {g.comparison.headers.map((h) => (
                      <th key={h} className="text-left p-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.comparison.rows.map((row) => (
                    <tr key={row.feature} className="border-t border-border">
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4">{row.a}</td>
                      <td className="p-4 text-muted-foreground">{row.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Mid-page CTA (after main content, before examples/FAQ) */}
        {g.ctaPrimary && (
          <section className="mb-12 border border-border rounded-xl p-6 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium mb-1">Skip the research — try the tool.</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                Used by 1,000+ PR teams • Cancel anytime
              </p>
            </div>
            <Button asChild>
              <Link to={g.ctaPrimary.to}>
                {g.ctaPrimary.label} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>
        )}

        {/* Templates / examples */}
        {g.examples && g.examples.length > 0 && (
          <section className="mb-12 space-y-6">
            <h2 className="text-2xl font-medium">Templates</h2>
            {g.examples.map((ex) => (
              <div
                key={ex.label}
                className="border border-border rounded-xl p-6 bg-card"
              >
                <h3 className="text-lg font-medium mb-2">{ex.label}</h3>
                {ex.whenToUse && (
                  <p className="text-sm text-muted-foreground mb-3">
                    <span className="font-medium text-foreground">When to use:</span>{" "}
                    {ex.whenToUse}
                  </p>
                )}
                <pre className="text-sm bg-muted/40 rounded-lg p-4 whitespace-pre-wrap font-mono leading-relaxed">
                  {ex.body}
                </pre>
              </div>
            ))}
          </section>
        )}

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-medium mb-4">FAQ</h2>
          <div className="space-y-5">
            {g.faq.map((f) => (
              <div key={f.q}>
                <h3 className="font-medium mb-1">{f.q}</h3>
                <p className="text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        {g.ctaPrimary && (
          <section className="border border-border rounded-xl p-8 text-center bg-card mb-12">
            <h2 className="text-2xl font-medium mb-2">Ready when you are</h2>
            <p className="text-muted-foreground mb-6">
              Find journalists in seconds, draft personalized pitches, and track replies — in one tool.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to={g.ctaPrimary.to}>
                  {g.ctaPrimary.label} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {g.ctaSecondary && (
                <Button asChild variant="secondary">
                  <Link to={g.ctaSecondary.to}>{g.ctaSecondary.label}</Link>
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Related */}
        <section>
          <h2 className="text-xl font-medium mb-4">Related</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[...g.related, ...siblings.map((s) => ({ label: s.h1, to: `/guides/${s.slug}` }))].slice(0, 6).map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="border border-border rounded-lg p-4 hover:border-foreground/30 transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-sm">{r.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      </article>
    </Layout>
  );
};

const labelForKind = (k: string) => {
  switch (k) {
    case "best": return "Best-of guide";
    case "vs": return "Comparison";
    case "alternative": return "Alternatives";
    case "templates": return "Templates";
    default: return "Guide";
  }
};

export default GuidePage;
