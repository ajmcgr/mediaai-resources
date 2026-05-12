import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ExternalLink, Lock, ArrowRight } from "lucide-react";
import { useSeoPage, useDiscoverContacts } from "@/hooks/useSeoPages";
import { updatePageSEO, addStructuredData } from "@/utils/seo";

function formatNumber(n: number | null) {
  if (n == null) return null;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function DiscoverPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading: pageLoading } = useSeoPage(slug);
  const { data: contacts, isLoading: listLoading } = useDiscoverContacts(page);

  useEffect(() => {
    if (!page) return;
    const url = `https://trymedia.ai/discover/${page.slug}`;
    updatePageSEO(page.title, page.meta_description, undefined, url);
    addStructuredData({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: page.h1,
      description: page.meta_description,
      url,
      numberOfItems: contacts?.length ?? 0,
      itemListElement: (contacts ?? []).slice(0, 25).map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name ?? "",
      })),
    });
    if (page.faq?.length) {
      addStructuredData({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faq.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      });
    }
  }, [page, contacts]);

  if (pageLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-4xl space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  if (!page) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
          <h1 className="text-3xl font-medium mb-4">List not found</h1>
          <p className="text-muted-foreground mb-6">This discover page doesn't exist or isn't published.</p>
          <Button asChild><Link to="/discover">Browse all lists</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article>
        <header className="bg-hero-gradient py-14">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-white/80 text-sm mb-3">
              <Link to="/discover" className="hover:text-white">Discover</Link>
              <span className="mx-2">/</span>
              <span className="capitalize">{page.source === "creator" ? "Creators" : "Journalists"}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-medium text-white mb-3">{page.h1}</h1>
            <p className="text-white/85 text-lg">{page.meta_description}</p>
          </div>
        </header>

        {page.intro_html && (
          <section className="py-12 bg-white">
            <div
              className="container mx-auto px-4 max-w-3xl prose prose-slate prose-headings:font-medium prose-h2:text-2xl prose-h3:text-xl"
              dangerouslySetInnerHTML={{ __html: page.intro_html }}
            />
          </section>
        )}

        <section className="py-12 bg-subtle-gradient">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-medium mb-6">The list</h2>
            {listLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : !contacts?.length ? (
              <Card className="p-8 text-center text-muted-foreground">
                No matching contacts found yet — check back soon.
              </Card>
            ) : (
              <ol className="space-y-3">
                {contacts.map((c, i) => (
                  <li key={`${c.source}-${c.id}`}>
                    <Card className="p-4 flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground truncate">{c.name || "Unnamed"}</h3>
                          {c.country && <Badge variant="secondary" className="text-xs">{c.country}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {c.source === "journalist" ? (
                            <>
                              {[c.titles, c.outlet].filter(Boolean).join(" · ")}
                              {c.topics && <span className="block text-xs mt-1">Beats: {c.topics}</span>}
                            </>
                          ) : (
                            <>
                              {c.category}
                              {c.ig_followers != null && (
                                <span className="ml-2">· {formatNumber(c.ig_followers)} IG followers</span>
                              )}
                              {c.youtube_subscribers != null && (
                                <span className="ml-2">· {formatNumber(c.youtube_subscribers)} YT subs</span>
                              )}
                              {c.bio && <span className="block text-xs mt-1 line-clamp-2">{c.bio}</span>}
                            </>
                          )}
                        </p>
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          {c.linkedin_url && (
                            <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-primary inline-flex items-center gap-1">
                              LinkedIn <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {c.xhandle && (
                            <a href={`https://x.com/${c.xhandle.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-primary">
                              @{c.xhandle.replace(/^@/, "")}
                            </a>
                          )}
                          {c.ig_handle && (
                            <a href={`https://instagram.com/${c.ig_handle.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-primary">
                              IG @{c.ig_handle.replace(/^@/, "")}
                            </a>
                          )}
                          {c.youtube_url && (
                            <a href={c.youtube_url} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-primary inline-flex items-center gap-1">
                              YouTube <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center text-xs text-muted-foreground">
                        <Lock className="h-3 w-3 mr-1" /> Email on Media AI
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        {page.faq?.length > 0 && (
          <section className="py-12 bg-white">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-2xl font-medium mb-6">Frequently asked</h2>
              <div className="space-y-5">
                {page.faq.map((q, i) => (
                  <div key={i}>
                    <h3 className="font-medium text-foreground mb-1">{q.question}</h3>
                    <p className="text-muted-foreground">{q.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-14 bg-subtle-gradient">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-medium mb-3">
              Get verified emails for everyone on this list
            </h2>
            <p className="text-muted-foreground mb-6">
              Media AI gives you direct contact details, beat history, recent coverage and AI-personalized pitches.
            </p>
            <Button asChild size="lg" className="btn-primary">
              <Link to="/signup">
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </article>
    </Layout>
  );
}
