import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOpenAIKey = (userId: string | undefined) =>
  useQuery({
    queryKey: ["openai-key", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_openai_keys")
        .select("api_key,updated_at")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const useSaveOpenAIKey = (userId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (apiKey: string) => {
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase
        .from("user_openai_keys")
        .upsert({ user_id: userId, api_key: apiKey, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["openai-key", userId] }),
  });
};

export const useDeleteOpenAIKey = (userId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase
        .from("user_openai_keys")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["openai-key", userId] }),
  });
};
