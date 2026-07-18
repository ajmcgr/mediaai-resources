import { HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { buildMatchExplanation, type MatchContact } from "@/lib/matchExplanation";

function scoreClass(score?: number) {
  if (score == null) return "bg-secondary text-muted-foreground";
  if (score >= 75) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-secondary text-muted-foreground";
}

export function MatchScoreBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-muted-foreground">-</span>;
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums", scoreClass(score))}>
      {Math.round(score)}%
    </span>
  );
}

export function MatchExplanationPopover({ contact, query, score }: { contact: MatchContact; query?: string | null; score?: number }) {
  const explanation = buildMatchExplanation(contact, query, score);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-1.5 text-xs text-muted-foreground hover:text-foreground">
          <MatchScoreBadge score={explanation.score} />
          <HelpCircle className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Why matched?</h4>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{explanation.confidence} confidence based on the available search evidence.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {explanation.reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        {explanation.caution && <p className="mt-3 rounded-md bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">{explanation.caution}</p>}
      </PopoverContent>
    </Popover>
  );
}
