import { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Users, Mic } from "lucide-react";
import { useSeoPagesPublic } from "@/hooks/useSeoPages";
import { updatePageSEO } from "@/utils/seo";

export default function Discover() {
  const { data, isLoading } = useSeoPagesPublic();

  useEffect(() => {
    updatePageSEO(
      "Discover Journalists & Creators by Beat | Media AI",
      "Curated lists of top journalists, reporters, podcasters and creators across AI, fintech, cybersecurity, startups and more — pulled live from the Media AI database.",
      "journalist lists, top reporters, media database, AI journalists, fintech journalists, podcasters, creator lists",
      "https://trymedia.ai/discover",
    );
  }, []);

  return (
    <Layout>
      <section className="bg-hero-gradient py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-medium text-white mb-4">
            Discover the right people to pitch
          </h1>
          <p className="text-lg text-white/85">
            Curated lists of journalists, reporters and creators by beat, region and outlet —
            updated from a database of 50,000+ contacts.
          </p>
        </div>
      </section>

      <section className="py-16 bg-subtle-gradient">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : !data?.length ? (
            <div className="text-center text-muted-foreground py-12">
              No discover pages published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map((p) => {
                const Icon = p.source === "creator" ? Mic : Users;
                return (
                  <Link key={p.slug} to={`/discover/${p.slug}`} className="block group">
                    <Card className="card-tool h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {p.source === "creator" ? "Creators" : "Journalists"}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {p.meta_description}
                      </p>
                      <div className="flex items-center text-sm font-medium text-primary">
                        View list
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
