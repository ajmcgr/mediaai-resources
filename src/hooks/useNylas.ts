import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type NylasThread = {
  id: string;
  subject: string | null;
  snippet?: string | null;
  participants?: { email: string; name?: string }[];
  unread?: boolean;
  latest_message_received_date?: number;
};

export type NylasMessage = {
  id: string;
  subject: string | null;
  from: { email: string; name?: string }[];
  to: { email: string; name?: string }[];
  cc?: { email: string; name?: string }[];
  date: number;
  body: string;
  snippet?: string;
};

export function useNylasStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["nylas-status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nylas_grants")
        .select("email, provider, created_at")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useConnectNylas() {
  const qc = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("nylas-auth-start");
      if (error) throw error;
      const url = (data as { url: string }).url;
      const popup = window.open(url, "nylas-auth", "width=520,height=720");
      if (!popup) throw new Error("Popup blocked. Allow popups and try again.");
    } catch (e) {
      setConnecting(false);
      throw e;
    }
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "nylas:connected") {
        setConnecting(false);
        qc.invalidateQueries({ queryKey: ["nylas-status"] });
        qc.invalidateQueries({ queryKey: ["nylas-threads"] });
      } else if (e.data?.type === "nylas:error") {
        setConnecting(false);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [qc]);

  return { connect, connecting };
}

export function useDisconnectNylas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("nylas-inbox", { body: { action: "disconnect" } });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nylas-status"] });
      qc.invalidateQueries({ queryKey: ["nylas-threads"] });
    },
  });
}

export function useNylasThreads(q?: string, enabled = true) {
  return useQuery({
    queryKey: ["nylas-threads", q ?? ""],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("nylas-inbox", {
        body: { action: "list_threads", q, limit: 30 },
      });
      if (error) throw error;
      return data as { email: string; threads: NylasThread[] };
    },
  });
}

export function useNylasThread(threadId: string | null) {
  return useQuery({
    queryKey: ["nylas-thread", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("nylas-inbox", {
        body: { action: "get_thread", thread_id: threadId },
      });
      if (error) throw error;
      return data as { thread: NylasThread; messages: NylasMessage[] };
    },
  });
}

export function useSendEmail() {
  return useMutation({
    mutationFn: async (payload: {
      to: { email: string; name?: string }[];
      subject: string;
      body: string;
      reply_to_message_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("nylas-inbox", {
        body: { action: "send", ...payload },
      });
      if (error) throw error;
      return data;
    },
  });
}
