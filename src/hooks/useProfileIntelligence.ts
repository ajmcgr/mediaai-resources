import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ContactKind = "journalist" | "creator";

export type ContactAiProfile = {
  id: string;
  contact_kind: ContactKind;
  contact_id: number;
  status: "ready" | "generating" | "insufficient_evidence" | "failed";
  confidence: "high" | "medium" | "low" | null;
  profile_summary: string | null;
  primary_topics: string[];
  secondary_topics: string[];
  recent_coverage_focus: string[];
  typical_content_formats: string[];
  audience_signals: string[];
  writing_signals: string[];
  geographic_relevance: string[];
  publication_focus: string[];
  topic_trends: Array<{ topic?: string; direction?: string; evidence?: string }>;
  pitch_guidance: {
    recommended_angle?: string;
    likely_interest?: string;
    suggested_tone?: string;
    evidence_to_include?: string[];
    avoid?: string[];
  };
  evidence: Array<{
    source_type?: string;
    coverage_id?: string;
    headline?: string;
    canonical_url?: string;
    outlet?: string | null;
    published_at?: string | null;
    has_summary?: boolean;
  }>;
  similar_contacts: Array<{
    kind?: ContactKind;
    id?: number;
    name?: string;
    outlet?: string | null;
    reason?: string;
  }>;
  generated_at: string | null;
  expires_at: string | null;
  model: string | null;
};

function key(kind?: ContactKind | null, id?: number | null) {
  return ["contact-ai-profile", kind, id] as const;
}

export function useProfileIntelligence(kind?: ContactKind | null, id?: number | null) {
  const queryClient = useQueryClient();
  const enabled = Boolean(kind && id && Number.isInteger(id));
  const query = useQuery({
    queryKey: key(kind, id),
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_ai_profiles")
        .select("*")
        .eq("contact_kind", kind)
        .eq("contact_id", id)
        .maybeSingle();

      if (error) {
        if ((error as { code?: string }).code === "42P01") return null;
        throw error;
      }
      return data as ContactAiProfile | null;
    },
  });

  const generate = useMutation({
    mutationFn: async (refresh = false) => {
      if (!kind || !id) throw new Error("Missing profile.");
      const { data, error } = await supabase.functions.invoke("profile-intelligence", {
        body: { contact_kind: kind, contact_id: id, refresh },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return (data as { profile: ContactAiProfile }).profile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(key(kind, id), profile);
      void queryClient.invalidateQueries({ queryKey: key(kind, id) });
      toast({ title: profile.status === "ready" ? "AI profile updated" : "More evidence needed" });
    },
    onError: (error) => {
      toast({
        title: "Could not generate AI profile",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  return { ...query, generate };
}
