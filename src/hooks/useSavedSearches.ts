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

/** Auto-save / touch a search. If a row with the same q exists, just bump last_used_at. */
export const useUpsertSavedSearch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tab: "journalists" | "creators"; query: { q?: string } }) => {
      const q = (input.query.q ?? "").trim();
      if (!q) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { data: existing } = await supabase
        .from("saved_searches")
        .select("id")
        .eq("user_id", user.id)
        .eq("tab", input.tab)
        .filter("query->>q", "eq", q)
        .maybeSingle();

      const nowIso = new Date().toISOString();
      if (existing?.id) {
        const { error } = await supabase
          .from("saved_searches")
          .update({ last_used_at: nowIso })
          .eq("id", existing.id);
        if (error) throw error;
        return null;
      }
      const { error } = await supabase.from("saved_searches").insert({
        user_id: user.id,
        tab: input.tab,
        query: { q },
        name: q,
        last_used_at: nowIso,
      });
      if (error) throw error;
      return null;
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
