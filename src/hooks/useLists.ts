import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type JournalistList = {
  id: string;
  name: string;
  created_at: string;
  is_disabled: boolean | null;
  user_id: string | null;
};

export type ListItem = {
  id: number;
  connected_journalist_list: string;
  connected_journalist: number | null;
  connected_creator: number | null;
  created_at: string;
};

export const useLists = (userId: string | undefined) =>
  useQuery({
    queryKey: ["lists", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journalist_list")
        .select("id,name,created_at,is_disabled,user_id")
        .eq("user_id", userId!)
        .or("is_disabled.is.null,is_disabled.eq.false")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as JournalistList[];
    },
  });

export const useListItems = (listId: string | undefined) =>
  useQuery({
    queryKey: ["list-items", listId],
    enabled: !!listId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journalist_list_items")
        .select("id,connected_journalist_list,connected_journalist,connected_creator,created_at")
        .eq("connected_journalist_list", listId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ListItem[];
    },
  });

export const useCreateList = (userId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!userId) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("journalist_list")
        .insert({ name, user_id: userId, is_disabled: false })
        .select()
        .single();
      if (error) throw error;
      return data as JournalistList;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lists", userId] }),
  });
};

export const useAddToList = (userId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { listId: string; journalistId?: number; creatorId?: number }) => {
      const row: Record<string, unknown> = { connected_journalist_list: args.listId };
      if (args.journalistId) row.connected_journalist = args.journalistId;
      if (args.creatorId) row.connected_creator = args.creatorId;
      const { error } = await supabase.from("journalist_list_items").insert(row);
      if (error) throw error;

      // Auto-trigger email enrichment if the journalist has no email yet.
      if (args.journalistId) {
        try {
          const { data: j } = await supabase
            .from("journalist")
            .select("id,name,outlet,email")
            .eq("id", args.journalistId)
            .maybeSingle();
          if (j && !j.email && j.name && j.outlet) {
            // Fire and forget — don't block list-add UX on enrichment latency.
            supabase.functions.invoke("enrich-contact", {
              body: {
                source_table: "journalist",
                source_id: j.id,
                name: j.name,
                outlet: j.outlet,
                fields: ["email"],
              },
            }).catch(() => {});
          }
        } catch {
          // Non-fatal — list membership already succeeded.
        }
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["list-items", vars.listId] });
      qc.invalidateQueries({ queryKey: ["lists", userId] });
    },
  });
};

export const useRemoveFromList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) => {
      const { error } = await supabase.from("journalist_list_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["list-items"] }),
  });
};

export const useDeleteList = (userId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from("journalist_list")
        .update({ is_disabled: true })
        .eq("id", listId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lists", userId] }),
  });
};
