// Iterate all active monitors and invoke monitor-check for each.
// Triggered by pg_cron daily.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);
    // monitors not checked in last 23h
    const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
    const { data: monitors, error } = await supa
      .from("brand_monitors")
      .select("id, last_checked_at")
      .eq("is_active", true)
      .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff}`)
      .limit(500);

    if (error) throw error;

    const results: Array<{ id: string; ok: boolean }> = [];
    for (const m of monitors ?? []) {
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/monitor-check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify({ monitor_id: m.id }),
        });
        results.push({ id: m.id, ok: r.ok });
      } catch (e) {
        console.error("invoke failed", m.id, e);
        results.push({ id: m.id, ok: false });
      }
    }

    return new Response(JSON.stringify({ ok: true, count: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("monitor-run-all error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
