import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChatUsage {
  allowance: number;
  used: number;
  remaining: number;
  credits: number;
  period_ym: string;
}

export const useChatUsage = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<ChatUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) { setUsage(null); setError(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc("chat_usage_summary");
    if (!error && Array.isArray(data) && data[0]) {
      const row = data[0] as Record<string, unknown>;
      setUsage({
        allowance: Number(row.allowance ?? 0),
        used: Number(row.used ?? 0),
        remaining: Number(row.remaining ?? 0),
        credits: Number(row.credits ?? 0),
        period_ym: String(row.period_ym ?? ""),
      });
    } else if (error) {
      console.error("chat_usage_summary failed", error);
      setUsage(null);
      setError(error.message || "Could not load chat credits.");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const applyServerUsage = useCallback((u: Partial<ChatUsage> | null | undefined) => {
    if (!u) return;
    setUsage((prev) => ({
      allowance: Number(u.allowance ?? prev?.allowance ?? 0),
      used: Number(u.used ?? prev?.used ?? 0),
      remaining: Number(u.remaining ?? prev?.remaining ?? 0),
      credits: Number(u.credits ?? prev?.credits ?? 0),
      period_ym: String(u.period_ym ?? prev?.period_ym ?? ""),
    }));
  }, []);

  return { usage, loading, error, refresh, applyServerUsage };
};
