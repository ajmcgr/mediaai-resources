import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SavedSearch = {
  id: string;
  user_id: string;
  name: string;
  tab: "journalists" | "creators";
  query: { q?: string };
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
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavedSearch[];
    },
  });

export const useCreateSavedSearch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; tab: "journalists" | "creators"; query: { q?: string } }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error, data } = await supabase
        .from("saved_searches")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as SavedSearch;
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
