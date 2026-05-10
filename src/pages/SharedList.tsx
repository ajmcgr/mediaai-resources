import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import logoMedia from "@/assets/brand/logo-media-color-official.png";

type Journalist = {
  id: number; name: string | null; email?: string | null;
  outlet: string | null; titles?: string | null; topics?: string | null;
  xhandle?: string | null; country?: string | null;
};
type Creator = {
  id: number; name: string | null; email?: string | null; category?: string | null;
  ig_handle?: string | null; ig_followers?: number | null;
  youtube_url?: string | null; youtube_subscribers?: number | null; type?: string | null;
};
type FetchResult = {
  share: { senderName: string | null; note: string | null; includeEmails: boolean; createdAt: string };
  list: { name: string; createdAt: string } | null;
  journalists: Journalist[];
  creators: Creator[];
};

const SharedList = () => {
  const { token } = useParams();
  const [data, setData] = useState<FetchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    supabase.functions
      .invoke("share-list-fetch", { body: { token } })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message || "Unable to load shared list");
        } else if ((data as any)?.error) {
          setError((data as any).error);
        } else {
          setData(data as FetchResult);
        }
      })
      .catch((e) => setError(e?.message || "Unable to load"))
      .finally(() => setLoading(false));
  }, [token]);

  const listName = data?.list?.name ?? "Shared media list";

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Helmet>
        <title>{listName} — shared via Media AI</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="https://trymedia.ai/" className="flex items-center" aria-label="Media AI">
            <img src={logoMedia} alt="Media AI" className="h-7 w-auto" />
          </a>
          <Button asChild size="sm" variant="outline">
            <Link to="/signup">Try Media AI</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading shared list…</div>
        )}

        {error && (
          <div className="rounded-lg border border-border bg-white p-8 text-center">
            <h1 className="text-xl font-medium mb-2">Link unavailable</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {data && (
          <>
            <div className="mb-8">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                {data.share.senderName ? `${data.share.senderName} shared a media list with you` : "A media list shared with you"}
              </p>
              <h1 className="text-3xl font-medium tracking-tight text-foreground">{listName}</h1>
              {data.share.note && (
                <div className="mt-5 rounded-md border border-border bg-white p-4 text-[15px] text-foreground whitespace-pre-wrap italic">
                  "{data.share.note}"
                </div>
              )}
            </div>

            {data.journalists.length > 0 && (
              <Section title={`Journalists (${data.journalists.length})`}>
                <Table
                  columns={[
                    "Name", "Outlet",
                    ...(data.share.includeEmails ? ["Email"] : []),
                    "Beats / topics", "X / Twitter", "Country",
                  ]}
                  rows={data.journalists.map((j) => [
                    j.name ?? "—",
                    j.outlet ?? "—",
                    ...(data.share.includeEmails ? [j.email ?? "—"] : []),
                    [j.titles, j.topics].filter(Boolean).join(" · ") || "—",
                    j.xhandle ? <a key="x" className="text-primary hover:underline" href={`https://x.com/${String(j.xhandle).replace(/^@/, "")}`} target="_blank" rel="noreferrer">@{String(j.xhandle).replace(/^@/, "")}</a> : "—",
                    j.country ?? "—",
                  ])}
                />
              </Section>
            )}

            {data.creators.length > 0 && (
              <Section title={`Creators (${data.creators.length})`}>
                <Table
                  columns={[
                    "Name", "Category",
                    ...(data.share.includeEmails ? ["Email"] : []),
                    "Instagram", "YouTube",
                  ]}
                  rows={data.creators.map((c) => [
                    c.name ?? "—",
                    c.category ?? c.type ?? "—",
                    ...(data.share.includeEmails ? [c.email ?? "—"] : []),
                    c.ig_handle ? (
                      <a key="ig" className="text-primary hover:underline" href={`https://instagram.com/${String(c.ig_handle).replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                        @{String(c.ig_handle).replace(/^@/, "")}{c.ig_followers ? ` · ${formatNum(c.ig_followers)}` : ""}
                      </a>
                    ) : "—",
                    c.youtube_url ? (
                      <a key="yt" className="text-primary hover:underline inline-flex items-center gap-1" href={c.youtube_url} target="_blank" rel="noreferrer">
                        Channel <ExternalLink className="h-3 w-3" />{c.youtube_subscribers ? ` · ${formatNum(c.youtube_subscribers)}` : ""}
                      </a>
                    ) : "—",
                  ])}
                />
              </Section>
            )}

            {data.journalists.length === 0 && data.creators.length === 0 && (
              <div className="rounded-lg border border-border bg-white p-8 text-center text-sm text-muted-foreground">
                This list is empty.
              </div>
            )}

            <div className="mt-12 rounded-xl border border-border bg-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-base font-medium">Want to build lists like this?</div>
                <div className="text-sm text-muted-foreground">Find any journalist or creator email — instantly.</div>
              </div>
              <Button asChild>
                <Link to="/signup">Try Media AI free</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">{title}</h2>
    <div className="rounded-lg border border-border bg-white overflow-hidden">{children}</div>
  </section>
);

const Table = ({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-secondary/40">
        <tr>
          {columns.map((c) => (
            <th key={c} className="text-left font-medium text-xs uppercase tracking-wide text-muted-foreground px-4 py-2.5">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-secondary/20">
            {row.map((cell, j) => (
              <td key={j} className="px-4 py-3 align-top">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const formatNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export default SharedList;
