import { cn } from "@/lib/utils";

type Props = {
  score: number | null | undefined;
  className?: string;
};

/**
 * Subtle rounded badge showing Domain Rating (DR) authority.
 * Pulled from the cached `outlet_authority` table — no live API calls.
 */
export function AuthorityBadge({ score, className }: Props) {
  if (score == null) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-secondary/60",
        "px-1.5 py-0.5 text-[11px] font-medium text-foreground tabular-nums leading-none",
        className,
      )}
      title={`Domain Rating (Ahrefs, cached monthly): ${score}`}
    >
      <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden className="text-muted-foreground" fill="currentColor">
        <path d="M3 12L7 4l3 5 1.5-2.5L13 12H3z" />
      </svg>
      <span>DR {score}</span>
    </span>
  );
}
