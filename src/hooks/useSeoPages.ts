import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SeoPage = {
  id: string;
  slug: string;
  source: "journalist" | "creator";
  title: string;
  h1: string;
  meta_description: string;
  intro_html: string;
  filters: Record<string, string | number>;
  faq: Array<{ question: string; answer: string }>;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type DiscoverContact = {
  id: number;
  name: string | null;
  outlet: string | null;
  category: string | null;
  topics: string | null;
  titles: string | null;
  country: string | null;
  bio: string | null;
  xhandle: string | null;
  linkedin_url: string | null;
  ig_handle: string | null;
  ig_followers: number | null;
  youtube_url: string | null;
  youtube_subscribers: number | null;
  source: "journalist" | "creator";
};

export function useSeoPage(slug?: string) {
  return useQuery({
    queryKey: ["seo-page", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_pages" as any)
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return (data as SeoPage | null) ?? null;
    },
  });
}

export function useSeoPagesPublic() {
  return useQuery({
    queryKey: ["seo-pages-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_pages" as any)
        .select("slug,title,meta_description,source,updated_at")
        .eq("published", true)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<Pick<SeoPage, "slug" | "title" | "meta_description" | "source" | "updated_at">>;
    },
  });
}

export function useSeoPagesAdmin() {
  return useQuery({
    queryKey: ["seo-pages-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_pages" as any)
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SeoPage[];
    },
  });
}

export function useDiscoverContacts(page: SeoPage | null | undefined) {
  return useQuery({
    queryKey: ["discover-contacts", page?.id],
    enabled: !!page,
    queryFn: async (): Promise<DiscoverContact[]> => {
      if (!page) return [];
      const f = page.filters || {};
      const limit = Math.min(Number(f.limit) || 50, 100);

      if (page.source === "journalist") {
        let q = supabase
          .from("journalist")
          .select("id,name,outlet,category,topics,titles,country,xhandle,linkedin_url")
          .order("id", { ascending: true })
          .limit(limit);
        if (f.topics) q = q.ilike("topics", `%${f.topics}%`);
        if (f.category) q = q.ilike("category", `%${f.category}%`);
        if (f.country) q = q.ilike("country", `%${f.country}%`);
        if (f.outlet) q = q.ilike("outlet", `%${f.outlet}%`);
        const { data, error } = await q;
        if (error) throw error;
        return (data ?? []).map((r: any) => ({
          ...r, bio: null, ig_handle: null, ig_followers: null,
          youtube_url: null, youtube_subscribers: null,
          source: "journalist" as const,
        }));
      } else {
        let q = supabase
          .from("creators")
          .select("id,name,category,bio,country,ig_handle,ig_followers,youtube_url,youtube_subscribers,linkedin_url")
          .order("ig_followers", { ascending: false, nullsFirst: false })
          .limit(limit);
        if (f.category) q = q.ilike("category", `%${f.category}%`);
        if (f.country) q = q.ilike("country", `%${f.country}%`);
        const minF = Number(f.ig_followers_min);
        if (Number.isFinite(minF) && minF > 0) q = q.gte("ig_followers", minF);
        const minY = Number(f.youtube_subs_min);
        if (Number.isFinite(minY) && minY > 0) q = q.gte("youtube_subscribers", minY);
        const { data, error } = await q;
        if (error) throw error;
        return (data ?? []).map((r: any) => ({
          ...r, outlet: null, topics: null, titles: null, xhandle: null,
          source: "creator" as const,
        }));
      }
    },
  });
}
