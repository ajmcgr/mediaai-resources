import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  fullscreen?: boolean;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export const Spinner = ({ className, size = "md", label }: SpinnerProps) => (
  <div className={cn("inline-flex items-center gap-2", className)}>
    <span
      className={cn(
        "inline-block rounded-full border-muted-foreground/20 border-t-primary animate-spin",
        sizeMap[size]
      )}
      aria-hidden="true"
    />
    {label && <span className="text-sm text-muted-foreground">{label}</span>}
    <span className="sr-only">Loading</span>
  </div>
);

export const FullscreenSpinner = ({ label }: { label?: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background animate-fade-in">
    <Spinner size="lg" />
    {label && <p className="text-sm text-muted-foreground">{label}</p>}
  </div>
);
