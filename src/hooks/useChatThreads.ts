import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChatThreadMessage = { role: "user" | "assistant"; content: string };

export type ChatThread = {
  id: string;
  user_id: string;
  title: string;
  messages: ChatThreadMessage[];
  created_at: string;
  updated_at: string;
};

const KEY = ["chat-threads"] as const;

export function useChatThreads(enabled: boolean) {
  return useQuery({
    queryKey: KEY,
    enabled,
    queryFn: async (): Promise<ChatThread[]> => {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("id,user_id,title,messages,created_at,updated_at")
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as ChatThread[];
    },
  });
}

export async function fetchChatThread(id: string): Promise<ChatThread | null> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("id,user_id,title,messages,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as ChatThread) ?? null;
}

export function useCreateChatThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (initial?: { title?: string; messages?: ChatThreadMessage[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");
      const { data, error } = await supabase
        .from("chat_threads")
        .insert({
          user_id: user.id,
          title: initial?.title ?? "New search",
          messages: initial?.messages ?? [],
        })
        .select("id,user_id,title,messages,created_at,updated_at")
        .single();
      if (error) throw error;
      return data as ChatThread;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateChatThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; title?: string; messages?: ChatThreadMessage[] }) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (args.title !== undefined) patch.title = args.title;
      if (args.messages !== undefined) patch.messages = args.messages;
      const { error } = await supabase.from("chat_threads").update(patch).eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteChatThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_threads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function deriveThreadTitle(messages: ChatThreadMessage[]): string {
  const first = messages.find((m) => m.role === "user")?.content?.trim();
  if (!first) return "New search";
  return first.length > 60 ? first.slice(0, 57) + "…" : first;
}
