import { Copy, ExternalLink, FileText, Lightbulb, Mail, RefreshCw, Sparkles, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useProfileIntelligence, type ContactKind } from "@/hooks/useProfileIntelligence";

type ContactIntelligenceProps = {
  kind: ContactKind;
  id: number;
  compact?: boolean;
  contactName?: string | null;
  outlet?: string | null;
};

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md border border-border bg-secondary/40 px-2 py-1 text-xs font-medium text-foreground">{children}</span>;
}

function ListBlock({ title, items }: { title: string; items?: string[] | null }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">{items.map((item) => <Chip key={item}>{item}</Chip>)}</div>
    </div>
  );
}

function EmptyState({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
  return (
    <section className="rounded-xl border border-dashed border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">AI media profile</h3>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Generate a cached outreach brief from verified coverage, topic evidence, and profile data.</p>
        </div>
        <Button onClick={onGenerate} disabled={loading} className="gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate
        </Button>
      </div>
    </section>
  );
}

function buildOutreachDraft({
  contactName,
  outlet,
  angle,
  evidence,
  tone,
}: {
  contactName?: string | null;
  outlet?: string | null;
  angle?: string;
  evidence?: string[];
  tone?: string;
}) {
  const greeting = contactName ? `Hi ${contactName.split(" ")[0]},` : "Hi,";
  const evidenceLine = evidence?.length
    ? `I would lead with: ${evidence.slice(0, 3).join("; ")}.`
    : "I would lead with one specific proof point and a clear reason this matters to their audience.";
  const outletLine = outlet ? `Given your work at ${outlet},` : "Given your recent coverage,";
  return [
    "Subject: Relevant story idea for your beat",
    "",
    greeting,
    "",
    `${outletLine} the strongest angle appears to be: ${angle || "tie the story directly to their current coverage area and audience."}`,
    "",
    evidenceLine,
    tone ? `Suggested tone: ${tone}.` : "Suggested tone: concise, specific, and evidence-led.",
    "",
    "A short pitch should keep this non-promotional, explain why the timing matters, and offer a concrete source, dataset, customer example, or founder perspective.",
  ].join("\n");
}

function PrepareOutreachDialog({
  contactName,
  outlet,
  pitch,
  evidence,
}: {
  contactName?: string | null;
  outlet?: string | null;
  pitch: NonNullable<ReturnType<typeof useProfileIntelligence>["data"]>["pitch_guidance"];
  evidence: NonNullable<ReturnType<typeof useProfileIntelligence>["data"]>["evidence"];
}) {
  const draft = buildOutreachDraft({
    contactName,
    outlet,
    angle: pitch.recommended_angle,
    evidence: pitch.evidence_to_include,
    tone: pitch.suggested_tone,
  });

  const copyDraft = async () => {
    await navigator.clipboard.writeText(draft);
    toast({ title: "Outreach draft copied" });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Mail className="h-4 w-4" />
          Prepare outreach
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Prepare outreach</DialogTitle>
          <DialogDescription>
            Draft guidance based on the cached AI profile. Review the evidence before sending.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea value={draft} readOnly className="min-h-[260px] resize-none font-mono text-xs leading-5" />
          {!!evidence?.length && (
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence to check</p>
              <div className="mt-2 space-y-2">
                {evidence.slice(0, 3).map((source) => (
                  <a key={source.coverage_id ?? source.canonical_url} href={source.canonical_url} target="_blank" rel="noreferrer" className="block text-sm text-primary hover:underline">
                    {source.headline}
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={copyDraft} className="gap-2"><Copy className="h-4 w-4" />Copy draft</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ContactIntelligence({ kind, id, compact = false, contactName, outlet }: ContactIntelligenceProps) {
  const { data, isLoading, isError, generate } = useProfileIntelligence(kind, id);
  const generating = generate.isPending || data?.status === "generating";

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-20 w-full" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      </section>
    );
  }

  if (!data) {
    return <EmptyState onGenerate={() => generate.mutate(false)} loading={generate.isPending} />;
  }

  if (isError || data.status === "failed") {
    return (
      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="font-semibold">AI media profile unavailable</h3><p className="mt-1 text-sm text-muted-foreground">The analysis could not be generated from the current evidence.</p></div>
          <Button variant="outline" onClick={() => generate.mutate(true)} disabled={generate.isPending} className="gap-2"><RefreshCw className={cn("h-4 w-4", generate.isPending && "animate-spin")} />Retry</Button>
        </div>
      </section>
    );
  }

  if (data.status === "insufficient_evidence") {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">AI media profile needs more evidence</h3>
            <p className="mt-1 text-sm text-muted-foreground">No attributable coverage is linked to this contact yet, so Media AI is holding the analysis back instead of guessing.</p>
          </div>
        </div>
      </section>
    );
  }

  const pitch = data.pitch_guidance ?? {};
  const confidenceLabel = data.confidence ? `${data.confidence} confidence` : "evidence-based";

  return (
    <section className="rounded-xl border border-primary/20 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">AI media profile</h3>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{confidenceLabel}</span>
          </div>
          {data.generated_at && <p className="mt-1 text-xs text-muted-foreground">Grounded in {data.evidence?.length ?? 0} source{data.evidence?.length === 1 ? "" : "s"} · Updated {new Date(data.generated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <PrepareOutreachDialog contactName={contactName} outlet={outlet} pitch={pitch} evidence={data.evidence} />
          <Button variant="outline" size="sm" onClick={() => generate.mutate(true)} disabled={generating} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", generating && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {data.profile_summary && <p className="mt-4 text-sm leading-6 text-foreground">{data.profile_summary}</p>}

      <div className={cn("mt-5 grid gap-4", compact ? "grid-cols-1" : "lg:grid-cols-[1.05fr_0.95fr]")}>
        <div className="rounded-lg border border-border bg-secondary/20 p-4">
          <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /><h4 className="text-sm font-semibold">Pitch guidance</h4></div>
          <div className="mt-3 space-y-3 text-sm">
            {pitch.recommended_angle && <p><span className="font-medium">Angle:</span> {pitch.recommended_angle}</p>}
            {pitch.likely_interest && <p><span className="font-medium">Likely interest:</span> {pitch.likely_interest}</p>}
            {pitch.suggested_tone && <p><span className="font-medium">Tone:</span> {pitch.suggested_tone}</p>}
            <ListBlock title="Include" items={pitch.evidence_to_include} />
            <ListBlock title="Avoid" items={pitch.avoid} />
          </div>
        </div>

        <div className="space-y-4">
          <ListBlock title="Primary topics" items={data.primary_topics} />
          <ListBlock title="Recent focus" items={data.recent_coverage_focus} />
          <ListBlock title="Writing signals" items={data.writing_signals} />
          <ListBlock title="Audience signals" items={data.audience_signals} />
        </div>
      </div>

      {!!data.topic_trends?.length && (
        <div className="mt-5 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><h4 className="text-sm font-semibold">Topic trends</h4></div>
          <div className="mt-3 divide-y divide-border">
            {data.topic_trends.map((trend) => (
              <div key={`${trend.topic}-${trend.evidence}`} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium">{trend.topic}{trend.direction ? <span className="font-normal text-muted-foreground"> · {trend.direction}</span> : null}</p>
                {trend.evidence && <p className="mt-1 text-sm text-muted-foreground">{trend.evidence}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!!data.similar_contacts?.length && (
        <div className="mt-5 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><h4 className="text-sm font-semibold">Similar contacts</h4></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.similar_contacts.map((contact) => (
              <div key={`${contact.kind}-${contact.id}`} className="rounded-md border border-border bg-secondary/20 px-3 py-2">
                <p className="text-sm font-medium">{contact.name}</p>
                <p className="text-xs text-muted-foreground">{[contact.outlet, contact.reason].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!data.evidence?.length && (
        <details className="mt-5 rounded-lg border border-border px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground">Sources used</summary>
          <div className="mt-3 divide-y divide-border">
            {data.evidence.map((source) => (
              <a key={source.coverage_id ?? source.canonical_url} href={source.canonical_url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-primary">
                <span>{source.headline}</span>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
              </a>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
