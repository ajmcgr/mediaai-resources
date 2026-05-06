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
  row?: Record<string, any> | null;
};

export const EnrichCell = ({ value, kind, id, field, name, outletDomain, row }: Props) => {
  const [loading, setLoading] = useState(false);
  const [localValue, setLocalValue] = useState<string | number | null | undefined>(value);
  const qc = useQueryClient();

  const isEmpty = localValue === null || localValue === undefined || localValue === "";
  const effectiveName = name ?? row?.name ?? null;
  const nameLetters = (effectiveName ?? "").match(/\p{L}/gu)?.length ?? 0;
  const effectiveDomain = outletDomain ?? row?.domain ?? row?.outlet ?? null;
  const canEnrich = field !== "email" || (nameLetters >= 2 && !!(effectiveDomain && String(effectiveDomain).length));

  const enrich = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const sourceTable = kind === "journalist" ? "journalist" : "creators";
      const r = row ?? {};
      const basePayload: Record<string, any> = {
        source: "database",
        source_id: id,
        source_table: sourceTable,
        name: effectiveName,
        outlet: r.outlet ?? null,
        title: r.title ?? r.titles ?? null,
        url: r.url ?? r.website ?? null,
        domain: r.domain ?? null,
        country: r.country ?? null,
        email: r.email ?? null,
        fields: [field],
      };
      if (kind === "creator") {
        basePayload.platform = r.platform ?? null;
        basePayload.handle = r.handle ?? r.xHandle ?? r.xhandle ?? r.ig_handle ?? r.username ?? null;
        basePayload.followers = r.followers ?? r.ig_followers ?? r.youtube_subscribers ?? null;
      }
      console.log("DATABASE_ENRICH_CONTACT_PAYLOAD", basePayload);
      const { data, error } = await supabase.functions.invoke("enrich-contact", {
        body: basePayload,
      });
      if (error) throw error;
      const updated = (data as { email?: string | null; found?: boolean; error?: string | null } | null) ?? {};
      const v = field === "email" ? updated.email : null;
      if (updated.found && v) {
        setLocalValue(v);
        toast.success(`Found ${field}`);
        if (field === "email") {
          await supabase.from(sourceTable as any).update({ email: v }).eq("id", id);
        }
        qc.invalidateQueries({ queryKey: [kind === "journalist" ? "journalists-infinite" : "creators-infinite"] });
      } else if (updated.error === "insufficient_identity") {
        toast.error("Insufficient identity: name + outlet/domain required");
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
        canEnrich ? (
          <button
            type="button"
            onClick={enrich}
            disabled={loading}
            className="inline-flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-primary transition-colors"
            title={`Find ${field} with Hunter + Exa`}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            <span>{field === "email" ? "Find email" : field === "linkedin_url" ? "Find LinkedIn" : "—"}</span>
          </button>
        ) : (
          <span
            className="inline-flex items-center gap-1 whitespace-nowrap text-muted-foreground/60 cursor-not-allowed"
            title="Need a person name + outlet domain to enrich email."
          >
            <Sparkles className="h-3 w-3" />
            <span>—</span>
          </span>
        )
      ) : (
        <span className="block min-w-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {localValue}
        </span>
      )}
    </div>
  );
};
