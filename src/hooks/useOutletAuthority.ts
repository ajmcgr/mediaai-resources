import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OutletAuthority = {
  domain: string | null;
  outlet_name: string | null;
  authority_score: number;
  source: string;
};

// Normalize an outlet/domain string to a lowercase apex-ish domain.
export function normalizeDomain(input?: string | null): string | null {
  if (!input) return null;
  let s = String(input).trim().toLowerCase();
  if (!s) return null;
  // strip protocol
  s = s.replace(/^https?:\/\//, "");
  // strip path
  s = s.split("/")[0];
  // strip www.
  s = s.replace(/^www\./, "");
  // bare names like "TechCrunch" => not a domain
  if (!s.includes(".")) return null;
  return s;
}

export function normalizeOutletName(input?: string | null): string | null {
  if (!input) return null;
  return String(input).trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Look up authority scores for a batch of outlets.
 * Tries domain match first, falls back to outlet_name (lowercased) match.
 * Cached client-side; data sourced from public.outlet_authority (monthly cron).
 */
export function useOutletAuthorities(outlets: Array<string | null | undefined>) {
  const norm = Array.from(new Set(outlets.map((o) => o ?? "").filter(Boolean)));
  const domains = Array.from(new Set(norm.map(normalizeDomain).filter((d): d is string => !!d)));
  const names = Array.from(new Set(norm.map(normalizeOutletName).filter((n): n is string => !!n)));

  return useQuery({
    queryKey: ["outlet-authority", domains.sort().join("|"), names.sort().join("|")],
    enabled: domains.length + names.length > 0,
    staleTime: 1000 * 60 * 60, // 1h
    queryFn: async () => {
      console.log("AUTHORITY_LOOKUP_STARTED", { domains: domains.length, names: names.length });
      const map = new Map<string, OutletAuthority>(); // key = domain or name
      try {
        if (domains.length) {
          const { data, error } = await supabase
            .from("outlet_authority")
            .select("domain,outlet_name,authority_score,source")
            .in("domain", domains);
          if (error) throw error;
          for (const row of data ?? []) {
            if (row.domain) map.set(`d:${row.domain.toLowerCase()}`, row as OutletAuthority);
          }
        }
        if (names.length) {
          // case-insensitive name match
          const { data, error } = await supabase
            .from("outlet_authority")
            .select("domain,outlet_name,authority_score,source")
            .or(names.map((n) => `outlet_name.ilike.${n}`).join(","));
          if (error) throw error;
          for (const row of data ?? []) {
            if (row.outlet_name) map.set(`n:${row.outlet_name.toLowerCase()}`, row as OutletAuthority);
          }
        }
        console.log("AUTHORITY_LOOKUP_SUCCESS", { found: map.size });
      } catch (err) {
        console.warn("AUTHORITY_LOOKUP_FAILED", err);
      }
      return map;
    },
  });
}

/** Resolve a single authority score from the map for a given outlet string. */
export function resolveAuthority(
  map: Map<string, OutletAuthority> | undefined,
  outlet?: string | null
): number | null {
  if (!map || !outlet) return null;
  const d = normalizeDomain(outlet);
  if (d) {
    const hit = map.get(`d:${d}`);
    if (hit) return hit.authority_score;
  }
  const n = normalizeOutletName(outlet);
  if (n) {
    const hit = map.get(`n:${n}`);
    if (hit) return hit.authority_score;
  }
  if (outlet) console.debug("AUTHORITY_LOOKUP_MISSING", { outlet });
  return null;
}
