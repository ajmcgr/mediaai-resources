import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { BarChart3, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Feedback = {
  id: string;
  search_query: string;
  feedback: "relevant" | "not_relevant";
  source: string | null;
  source_table: string | null;
  created_at: string;
};

type Summary = { label: string; votes: number; relevant: number; notRelevant: number };

function rate(relevant: number, votes: number) {
  return votes ? Math.round((relevant / votes) * 100) : 0;
}

function summarize(rows: Feedback[], getLabel: (row: Feedback) => string): Summary[] {
  const groups = new Map<string, Summary>();
  for (const row of rows) {
    const label = getLabel(row);
    const current = groups.get(label) ?? { label, votes: 0, relevant: 0, notRelevant: 0 };
    current.votes += 1;
    if (row.feedback === "relevant") current.relevant += 1;
    else current.notRelevant += 1;
    groups.set(label, current);
  }
  return [...groups.values()].sort((a, b) => b.notRelevant - a.notRelevant || b.votes - a.votes);
}

export default function Relevance() {
  const [rows, setRows] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await (supabase as any)
      .from("search_result_feedback")
      .select("id,search_query,feedback,source,source_table,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (queryError) setError(queryError.message);
    else setRows((data ?? []) as Feedback[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => {
    const relevant = rows.filter((row) => row.feedback === "relevant").length;
    return { votes: rows.length, relevant, notRelevant: rows.length - relevant };
  }, [rows]);
  const querySummary = useMemo(() => summarize(rows, (row) => row.search_query), [rows]);
  const sourceSummary = useMemo(() => summarize(rows, (row) => row.source ?? "unknown source"), [rows]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Search Quality — Media AI</title></Helmet>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary"><BarChart3 className="h-5 w-5" /><span className="text-sm font-semibold">Search quality</span></div>
            <h1 className="text-3xl font-semibold tracking-tight">Your relevance review</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Use these signals to spot weak queries and sources. Feedback is private to your account.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Could not load feedback: {error}</div>
        ) : loading ? (
          <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">Loading feedback…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <BarChart3 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h2 className="font-medium">No feedback yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Mark results relevant or not relevant in Search to start measuring search quality.</p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <Metric label="Votes recorded" value={totals.votes.toLocaleString()} />
              <Metric label="Relevant" value={`${rate(totals.relevant, totals.votes)}%`} detail={`${totals.relevant} positive`} tone="good" />
              <Metric label="Needs attention" value={`${totals.notRelevant.toLocaleString()}`} detail="negative votes" tone="bad" />
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <SummaryPanel title="Queries needing attention" rows={querySummary.slice(0, 8)} />
              <SummaryPanel title="Source quality" rows={sourceSummary.slice(0, 8)} />
            </section>

            <section className="mt-8 overflow-hidden rounded-xl border bg-card">
              <div className="border-b px-5 py-4"><h2 className="font-semibold">Recent feedback</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-secondary/40 text-left text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Query</th><th className="px-5 py-3 font-medium">Verdict</th><th className="px-5 py-3 font-medium">Source</th><th className="px-5 py-3 font-medium">When</th></tr></thead>
                  <tbody>
                    {rows.slice(0, 30).map((row) => (
                      <tr key={row.id} className="border-t"><td className="max-w-[420px] px-5 py-3 font-medium">{row.search_query}</td><td className="px-5 py-3"><Verdict feedback={row.feedback} /></td><td className="px-5 py-3 text-muted-foreground">{row.source ?? "—"}</td><td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone?: "good" | "bad" }) {
  return <div className="rounded-xl border bg-card p-5"><div className="text-sm text-muted-foreground">{label}</div><div className={`mt-2 text-3xl font-semibold ${tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-rose-700" : ""}`}>{value}</div>{detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}</div>;
}

function Verdict({ feedback }: { feedback: Feedback["feedback"] }) {
  const good = feedback === "relevant";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${good ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{good ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}{good ? "Relevant" : "Not relevant"}</span>;
}

function SummaryPanel({ title, rows }: { title: string; rows: Summary[] }) {
  return <section className="rounded-xl border bg-card"><div className="border-b px-5 py-4"><h2 className="font-semibold">{title}</h2></div><div className="divide-y">{rows.length ? rows.map((row) => <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3"><div className="min-w-0"><div className="truncate text-sm font-medium">{row.label}</div><div className="mt-0.5 text-xs text-muted-foreground">{row.votes} votes · {row.notRelevant} negative</div></div><div className={`shrink-0 text-sm font-semibold ${rate(row.relevant, row.votes) >= 70 ? "text-emerald-700" : "text-rose-700"}`}>{rate(row.relevant, row.votes)}%</div></div>) : <div className="px-5 py-8 text-sm text-muted-foreground">No feedback yet.</div>}</div></section>;
}
