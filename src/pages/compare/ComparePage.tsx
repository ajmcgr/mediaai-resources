import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight } from "lucide-react";
import { getCompetitor, COMPETITORS } from "./competitors";
import NotFound from "@/pages/NotFound";

const ComparePage = () => {
  const { slug = "" } = useParams();
  const c = getCompetitor(slug);
  if (!c) return <NotFound />;

  const title = `Media AI vs ${c.name} — Pricing, Features & Best Alternative`;
  const description = `Compare Media AI with ${c.name}. See pricing, features, coverage, and why teams switch. ${c.tagline}.`;
  const url = `https://trymedia.ai/compare/${c.slug}`;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const others = COMPETITORS.filter((x) => x.slug !== c.slug).slice(0, 4);

  return (
    <Layout>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <article className="container mx-auto px-4 py-16 max-w-4xl">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/compare" className="hover:text-foreground">Compare</Link>
          <span className="mx-2">/</span>
          <span>Media AI vs {c.name}</span>
        </nav>

        <header className="mb-12">
          <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
            {c.category}
          </p>
          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-4">
            Media AI vs {c.name}
          </h1>
          <p className="text-lg text-muted-foreground">{c.summary}</p>
        </header>

        {/* Quick verdict */}
        <section className="grid md:grid-cols-2 gap-4 mb-12">
          <div className="border border-border rounded-xl p-6 bg-card">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Media AI</p>
            <h2 className="text-lg font-medium mb-3">Modern, AI-first PR & creator outreach</h2>
            <ul className="space-y-2 text-sm">
              {c.mediaAdvantages.map((a) => (
                <li key={a} className="flex gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-border rounded-xl p-6 bg-card">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{c.name}</p>
            <h2 className="text-lg font-medium mb-3">{c.tagline}</h2>
            <ul className="space-y-2 text-sm">
              {c.weaknesses.map((w) => (
                <li key={w} className="flex gap-2">
                  <X className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Comparison table */}
        <section className="mb-12">
          <h2 className="text-2xl font-medium mb-4">Side-by-side comparison</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-4 font-medium">Feature</th>
                  <th className="text-left p-4 font-medium">Media AI</th>
                  <th className="text-left p-4 font-medium">{c.name}</th>
                </tr>
              </thead>
              <tbody>
                {c.comparison.map((row) => (
                  <tr key={row.feature} className="border-t border-border">
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4">{row.mediaAi}</td>
                    <td className="p-4 text-muted-foreground">{row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-12">
          <h2 className="text-2xl font-medium mb-2">Pricing</h2>
          <p className="text-muted-foreground mb-4">{c.pricing}</p>
          <p className="text-foreground">
            Media AI is billed monthly with transparent pricing and no annual lock-in.{" "}
            <Link to="/pricing" className="text-primary hover:underline">See plans →</Link>
          </p>
        </section>

        {/* Best for */}
        <section className="mb-12">
          <h2 className="text-2xl font-medium mb-2">When {c.name} still makes sense</h2>
          <p className="text-muted-foreground">{c.bestFor}</p>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-medium mb-4">FAQ</h2>
          <div className="space-y-5">
            {c.faq.map((f) => (
              <div key={f.q}>
                <h3 className="font-medium mb-1">{f.q}</h3>
                <p className="text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border border-border rounded-xl p-8 text-center bg-card mb-12">
          <h2 className="text-2xl font-medium mb-2">Try Media AI free</h2>
          <p className="text-muted-foreground mb-6">
            See why teams are switching from {c.name}. No annual contract, cancel anytime.
          </p>
          <Button asChild>
            <Link to="/signup">
              Start free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* Other comparisons */}
        <section>
          <h2 className="text-xl font-medium mb-4">Other comparisons</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                to={`/compare/${o.slug}`}
                className="border border-border rounded-lg p-4 hover:border-foreground/30 transition-colors flex items-center justify-between"
              >
                <span className="font-medium">Media AI vs {o.name}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      </article>
    </Layout>
  );
};

export default ComparePage;
