import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AlertFrequency = "instant" | "daily" | "weekly";

export type BrandMonitor = {
  id: string;
  user_id: string;
  brand_name: string;
  website_url: string;
  competitor_urls: string[];
  keywords: string[];
  founder_names: string[];
  product_names: string[];
  email_alerts: boolean;
  alert_frequency: AlertFrequency;
  is_active: boolean;
  last_checked_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_mentions_found: number | null;
  created_at: string;
};

export type MentionType = "brand" | "competitor" | "founder" | "keyword" | "product";

export type MonitorUpdate = {
  id: string;
  monitor_id: string;
  url: string;
  url_kind: string;
  summary: string | null;
  why_it_matters: string | null;
  pr_score: number | null;
  next_action: string | null;
  pitch_angle: string | null;
  email_sent: boolean;
  detected_at: string;
  // new Google News fields
  mention_type: MentionType | null;
  matched_keyword: string | null;
  source: string | null;
  title: string | null;
  publisher: string | null;
  published_at: string | null;
  image_url: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
};

export const useMonitors = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["brand-monitors", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_monitors" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BrandMonitor[];
    },
  });
};

export const useUpdates = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["monitor-updates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitor_updates" as never)
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as MonitorUpdate[];
    },
  });
};

export const useCreateMonitor = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      brand_name: string;
      website_url: string;
      competitor_urls: string[];
      keywords: string[];
      email_alerts: boolean;
      alert_frequency: AlertFrequency;
    }) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("brand_monitors" as never)
        .insert({ ...input, user_id: user.id } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-monitors"] }),
  });
};

export const useUpdateMonitor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<BrandMonitor> }) => {
      const { error } = await supabase
        .from("brand_monitors" as never)
        .update(patch as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-monitors"] }),
  });
};

export const useDeleteMonitor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brand_monitors" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-monitors"] });
      qc.invalidateQueries({ queryKey: ["monitor-updates"] });
    },
  });
};

export const useRunMonitorCheck = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (monitor_id: string) => {
      const { data, error } = await supabase.functions.invoke("monitor-check", {
        body: { monitor_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-monitors"] });
      qc.invalidateQueries({ queryKey: ["monitor-updates"] });
    },
  });
};
