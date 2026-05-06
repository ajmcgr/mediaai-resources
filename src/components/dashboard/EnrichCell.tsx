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
  name?: string | null;
  outletDomain?: string | null;
};

export const EnrichCell = ({ value, kind, id, field, name, outletDomain }: Props) => {
  const [loading, setLoading] = useState(false);
  const [localValue, setLocalValue] = useState<string | number | null | undefined>(value);
  const qc = useQueryClient();

  const isEmpty = localValue === null || localValue === undefined || localValue === "";
  const nameLetters = (name ?? "").match(/\p{L}/gu)?.length ?? 0;
  const canEnrich = field !== "email" || (nameLetters >= 2 && !!(outletDomain && outletDomain.length));

  const enrich = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const payload = { source_id: id, source_table: kind === "journalist" ? "journalist" : "creators", fields: [field] };
      console.log("ENRICH_CONTACT_PAYLOAD", payload);
      const { data, error } = await supabase.functions.invoke("enrich-contact", {
        body: payload,
      });
      if (error) throw error;
      const updated = (data as { email?: string | null; found?: boolean; error?: string | null } | null) ?? {};
      const v = field === "email" ? updated.email : null;
      if (updated.found && v) {
        setLocalValue(v);
        toast.success(`Found ${field}`);
        qc.invalidateQueries({ queryKey: [kind === "journalist" ? "journalists-infinite" : "creators-infinite"] });
      } else {
        toast.message(updated.error ?? (field === "email" ? "No email found" : "Nothing found"));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enrichment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="px-3 py-3 text-sm text-foreground flex items-center gap-1.5 min-w-0 overflow-hidden"
      title={typeof localValue === "string" ? localValue : undefined}
    >
      {isEmpty ? (
        <button
          type="button"
          onClick={enrich}
          disabled={loading}
          className="inline-flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-primary transition-colors"
          title={`Find ${field} with Exa`}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          <span>{field === "email" ? "Find email" : "—"}</span>
        </button>
      ) : (
        <span className="block min-w-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {localValue}
        </span>
      )}
    </div>
  );
};
