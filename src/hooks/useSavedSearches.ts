import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SavedSearch = {
  id: string;
  user_id: string;
  name: string;
  tab: "journalists" | "creators";
  query: { q?: string };
  pinned: boolean;
  last_used_at: string;
  created_at: string;
};

export const useSavedSearches = (enabled = true) =>
  useQuery({
    queryKey: ["saved-searches"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .order("pinned", { ascending: false })
        .order("last_used_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavedSearch[];
    },
  });

/** Upsert a search (auto-save). Updates last_used_at on collisions. */
export const useUpsertSavedSearch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tab: "journalists" | "creators"; query: { q?: string } }) => {
      const q = (input.query.q ?? "").trim();
      if (!q) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error, data } = await supabase
        .from("saved_searches")
        .upsert(
          {
            user_id: user.id,
            tab: input.tab,
            query: { q },
            name: q,
            last_used_at: new Date().toISOString(),
          },
          { onConflict: "user_id,tab,(query->>'q')", ignoreDuplicates: false },
        )
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as SavedSearch | null;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-searches"] }),
  });
};

export const useTogglePinSavedSearch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from("saved_searches")
        .update({ pinned: input.pinned })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-searches"] }),
  });
};

export const useDeleteSavedSearch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_searches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-searches"] }),
  });
};
