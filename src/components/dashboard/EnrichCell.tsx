import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Props = {
  value: string | number | null | undefined;
  kind: "journalist" | "creator";
  id: number;
  field: string;
};

export const EnrichCell = ({ value, kind, id, field }: Props) => {
  const [loading, setLoading] = useState(false);
  const [localValue, setLocalValue] = useState<string | number | null | undefined>(value);
  const qc = useQueryClient();

  const isEmpty = localValue === null || localValue === undefined || localValue === "";

  const enrich = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("enrich-contact", {
        body: { kind, id, fields: [field] },
      });
      if (error) throw error;
      const updated = (data as { ok?: boolean; updated?: Record<string, string>; message?: string } | null) ?? {};
      const v = updated.updated?.[field];
      if (updated.ok && v) {
        setLocalValue(v);
        toast.success(`Found ${field}`);
        qc.invalidateQueries({ queryKey: [kind === "journalist" ? "journalists-infinite" : "creators-infinite"] });
      } else {
        toast.message(updated.message ?? "Nothing found");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enrichment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-3 text-sm text-foreground truncate flex items-center gap-1.5" title={typeof localValue === "string" ? localValue : undefined}>
      {isEmpty ? (
        <button
          type="button"
          onClick={enrich}
          disabled={loading}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          title={`Find ${field} with Exa`}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          <span>—</span>
        </button>
      ) : (
        <span className="truncate">{localValue}</span>
      )}
    </div>
  );
};
