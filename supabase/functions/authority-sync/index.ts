// authority-sync — monthly DR cache refresh
// Deno edge function. Reads journalist outlets, normalizes to domains,
// upserts into public.outlet_authority. Uses Ahrefs if AHREFS_API_TOKEN
// is set, otherwise leaves existing rows untouched and logs misses.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = String(input).trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
  if (!s.includes(".")) return null;
  return s;
}

async function ahrefsDR(domain: string, token: string): Promise<number | null> {
  try {
    // Ahrefs API v3: domain_rating
    const url = `https://api.ahrefs.com/v3/site-explorer/domain-rating?target=${encodeURIComponent(domain)}&date=${new Date().toISOString().slice(0,10)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    if (!res.ok) return null;
    const j = await res.json();
    const dr = j?.domain_rating?.domain_rating ?? j?.domain_rating ?? null;
    return typeof dr === "number" ? Math.round(dr) : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const AHREFS = Deno.env.get("AHREFS_API_TOKEN") || "";
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  console.log("AUTHORITY_SYNC_STARTED", { hasAhrefs: !!AHREFS });

  // 1. Pull distinct outlets
  const domainSet = new Set<string>();
  let from = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await admin
      .from("journalist")
      .select("outlet")
      .not("outlet", "is", null)
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("AUTHORITY_SYNC_QUERY_FAILED", error);
      break;
    }
    if (!data?.length) break;
    for (const r of data) {
      const d = normalizeDomain((r as { outlet: string | null }).outlet);
      if (d) domainSet.add(d);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  const domains = Array.from(domainSet);
  console.log("AUTHORITY_SYNC_DOMAINS", { count: domains.length });

  let updated = 0;
  let failed = 0;

  if (AHREFS) {
    for (const domain of domains) {
      const dr = await ahrefsDR(domain, AHREFS);
      if (dr == null) {
        failed++;
        console.warn("AUTHORITY_SYNC_MISS", { domain });
        continue;
      }
      const { error } = await admin.from("outlet_authority").upsert(
        { domain, authority_score: dr, source: "ahrefs", updated_at: new Date().toISOString() },
        { onConflict: "domain" }
      );
      if (error) { failed++; console.warn("AUTHORITY_SYNC_UPSERT_FAILED", { domain, error }); }
      else updated++;
    }
  } else {
    console.log("AUTHORITY_SYNC_SKIPPED_NO_TOKEN");
  }

  console.log("AUTHORITY_SYNC_FINISHED", { domains: domains.length, updated, failed });

  return new Response(
    JSON.stringify({ ok: true, domains: domains.length, updated, failed, hasAhrefs: !!AHREFS }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
