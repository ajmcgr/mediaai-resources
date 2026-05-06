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

  const numericEmptyFields = new Set(["ig_followers", "ig_engagement_rate", "youtube_subscribers"]);
  const isEmpty = localValue === null || localValue === undefined || localValue === "" || (numericEmptyFields.has(field) && (localValue === 0 || localValue === "0"));
  const effectiveName = name ?? row?.name ?? null;
  const nameLetters = (effectiveName ?? "").match(/\p{L}/gu)?.length ?? 0;
  const effectiveDomain = outletDomain ?? row?.domain ?? row?.outlet ?? null;
  const emailNeedsDomain = field === "email" && kind === "journalist";
  const canEnrich = nameLetters >= 2 && (!emailNeedsDomain || !!(effectiveDomain && String(effectiveDomain).length));
  const findLabel: Record<string, string> = {
    email: "Find email",
    linkedin_url: "Find LinkedIn",
    ig_handle: "Find IG",
    ig_followers: "Find followers",
    ig_engagement_rate: "Find engagement",
    youtube_url: "Find YouTube",
    youtube_subscribers: "Find subs",
    category: "Find category",
    country: "Find country",
  };

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
        youtube_url: r.youtube_url ?? null,
        youtube_subscribers: r.youtube_subscribers ?? null,
        ig_handle: r.ig_handle ?? null,
        ig_followers: r.ig_followers ?? null,
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
      const updated = (data as Record<string, any> | null) ?? {};
      const v = updated[field] ?? (field === "email" ? updated.email : field === "linkedin_url" ? updated.linkedin_url : null);
      if ((updated.found || v != null) && v !== null && v !== "") {
        let display: string | number = v;
        if (field === "ig_engagement_rate" && typeof v === "number") display = `${(v * 100).toFixed(2)}%`;
        else if ((field === "ig_followers" || field === "youtube_subscribers") && typeof v === "number") display = v.toLocaleString();
        setLocalValue(display);
        toast.success(`Found ${findLabel[field]?.replace(/^Find /, "") ?? field}`);
        qc.invalidateQueries({ queryKey: [kind === "journalist" ? "journalists-infinite" : "creators-infinite"] });
      } else if (updated.error === "insufficient_identity") {
        toast.error("Insufficient identity: name required");
      } else {
        toast.message(updated.error ?? "Nothing found");
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
            title={emailNeedsDomain ? "Find email with Hunter + Exa" : "Discover with Exa + AI"}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            <span>{findLabel[field] ?? "Find"}</span>
          </button>
        ) : (
          <span
            className="inline-flex items-center gap-1 whitespace-nowrap text-muted-foreground/60 cursor-not-allowed"
            title={emailNeedsDomain ? "Need a person name + outlet domain to enrich email." : "Need a name to enrich."}
          >
            <Sparkles className="h-3 w-3" />
            <span>—</span>
          </span>
        )
      ) : (field === "linkedin_url" || field === "youtube_url") && typeof localValue === "string" && /^https?:\/\//.test(localValue) ? (
        <a
          href={localValue}
          target="_blank"
          rel="noreferrer"
          className="block min-w-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis text-primary hover:underline"
        >
          {field === "linkedin_url" ? "LinkedIn" : "YouTube"}
        </a>
      ) : (
        <span className="block min-w-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {localValue}
        </span>
      )}
    </div>
  );
};
