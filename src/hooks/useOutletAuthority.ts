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
  s = s.replace(/^https?:\/\//, "");
  s = s.split("/")[0];
  s = s.replace(/^www\./, "");
  if (!s.includes(".")) return null;
  return s;
}

export function normalizeOutletName(input?: string | null): string | null {
  if (!input) return null;
  return String(input).trim().toLowerCase().replace(/\s+/g, " ");
}

// Strip leading "the " for tolerant matching
function stripThe(s: string): string {
  return s.replace(/^the\s+/i, "").trim();
}

/**
 * Generate candidate outlet-name lookups from a possibly composite outlet string.
 * Examples:
 *   "Sun, Sun - Sports Desk, Sun - Tennis"  -> ["sun"]
 *   "Sports Illustrated, Beaver County Times" -> ["sports illustrated", "beaver county times"]
 *   "The Boston Globe" -> ["the boston globe", "boston globe"]
 */
export function outletNameCandidates(input?: string | null): string[] {
  if (!input) return [];
  const out = new Set<string>();
  // split composites on commas, semicolons, slashes, pipes
  const parts = String(input).split(/[,;|/]+/);
  for (const raw of parts) {
    // also strip section suffixes like " - Sports Desk"
    const base = raw.split(/\s[-–—]\s/)[0];
    const n = normalizeOutletName(base);
    if (!n) continue;
    out.add(n);
    const stripped = normalizeOutletName(stripThe(n));
    if (stripped && stripped !== n) out.add(stripped);
  }
  // also include the whole-string normalized form
  const whole = normalizeOutletName(input);
  if (whole) {
    out.add(whole);
    const w2 = normalizeOutletName(stripThe(whole));
    if (w2) out.add(w2);
  }
  return [...out].filter((s) => s.length >= 3);
}

/**
 * Look up authority scores for a batch of outlets.
 * Tries domain match first, falls back to outlet_name (lowercased) match.
 * Cached client-side; data sourced from public.outlet_authority (monthly cron).
 */
export function useOutletAuthorities(outlets: Array<string | null | undefined>) {
  const norm = Array.from(new Set(outlets.map((o) => o ?? "").filter(Boolean)));
  const domains = Array.from(new Set(norm.map(normalizeDomain).filter((d): d is string => !!d)));
  const nameSet = new Set<string>();
  for (const o of norm) for (const c of outletNameCandidates(o)) nameSet.add(c);
  const names = [...nameSet];

  return useQuery({
    queryKey: ["outlet-authority", domains.sort().join("|"), names.sort().join("|")],
    enabled: domains.length + names.length > 0,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      console.log("AUTHORITY_LOOKUP_STARTED", { domains: domains.length, names: names.length });
      const map = new Map<string, OutletAuthority>();
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
          // batch in chunks to keep URL length sane
          const chunkSize = 60;
          for (let i = 0; i < names.length; i += chunkSize) {
            const chunk = names.slice(i, i + chunkSize);
            const { data, error } = await supabase
              .from("outlet_authority")
              .select("domain,outlet_name,authority_score,source")
              .or(chunk.map((n) => `outlet_name.ilike.${n}`).join(","));
            if (error) throw error;
            for (const row of data ?? []) {
              if (row.outlet_name) {
                const k = row.outlet_name.toLowerCase();
                map.set(`n:${k}`, row as OutletAuthority);
                const k2 = stripThe(k);
                if (k2 !== k) map.set(`n:${k2}`, row as OutletAuthority);
              }
            }
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
  for (const cand of outletNameCandidates(outlet)) {
    const hit = map.get(`n:${cand}`);
    if (hit) return hit.authority_score;
  }
  if (outlet) console.debug("AUTHORITY_LOOKUP_MISSING", { outlet });
  return null;
}
