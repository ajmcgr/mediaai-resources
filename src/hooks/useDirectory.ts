import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Journalist = {
  id: number;
  name: string | null;
  email: string | null;
  category: string | null;
  titles: string | null;
  topics: string | null;
  xhandle: string | null;
  outlet: string | null;
  country: string | null;
  linkedin_url: string | null;
};

export type Creator = {
  id: number;
  name: string | null;
  category: string | null;
  email: string | null;
  bio: string | null;
  ig_handle: string | null;
  ig_followers: number | null;
  ig_engagement_rate: number | null;
  ig_avg_engagements: number | null;
  youtube_url: string | null;
  youtube_subscribers: number | null;
  youtube_views_per_video: number | null;
  type: string | null;
};

export type DirectoryFilters = {
  q?: string;
  name?: string;
  email?: string;
  category?: string;
  country?: string;
  outlet?: string;
  xhandle?: string;
  title?: string;
  topics?: string;
};

export const PAGE_SIZE = 50;

export const useJournalistsInfinite = (filters: DirectoryFilters) =>
  useInfiniteQuery({
    queryKey: ["journalists-infinite", filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const page = pageParam as number;
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("journalist")
        .select("id,name,email,category,titles,topics,xhandle,outlet,country", { count: "exact" })
        .order("id", { ascending: true })
        .range(from, to);

      if (filters.q) {
        const v = `%${filters.q}%`;
        q = q.or(
          `name.ilike.${v},email.ilike.${v},outlet.ilike.${v},titles.ilike.${v},topics.ilike.${v},xhandle.ilike.${v}`
        );
      }
      if (filters.name) q = q.ilike("name", `%${filters.name}%`);
      if (filters.email) q = q.ilike("email", `%${filters.email}%`);
      if (filters.category) q = q.ilike("category", `%${filters.category}%`);
      if (filters.country) q = q.ilike("country", `%${filters.country}%`);
      if (filters.outlet) q = q.ilike("outlet", `%${filters.outlet}%`);
      if (filters.xhandle) q = q.ilike("xhandle", `%${filters.xhandle}%`);
      if (filters.title) q = q.ilike("titles", `%${filters.title}%`);
      if (filters.topics) q = q.ilike("topics", `%${filters.topics}%`);

      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Journalist[], count: count ?? 0, page };
    },
    getNextPageParam: (last) => {
      const loaded = (last.page + 1) * PAGE_SIZE;
      return loaded < last.count ? last.page + 1 : undefined;
    },
  });

export const useCreatorsInfinite = (filters: DirectoryFilters) =>
  useInfiniteQuery({
    queryKey: ["creators-infinite", filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const page = pageParam as number;
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("creators")
        .select(
          "id,name,category,email,bio,ig_handle,ig_followers,ig_engagement_rate,ig_avg_engagements,youtube_url,youtube_subscribers,youtube_views_per_video,type",
          { count: "exact" }
        )
        .order("id", { ascending: true })
        .range(from, to);

      if (filters.q) {
        const v = `%${filters.q}%`;
        q = q.or(`name.ilike.${v},email.ilike.${v},ig_handle.ilike.${v},bio.ilike.${v}`);
      }
      if (filters.name) q = q.ilike("name", `%${filters.name}%`);
      if (filters.email) q = q.ilike("email", `%${filters.email}%`);
      if (filters.category) q = q.ilike("category", `%${filters.category}%`);

      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Creator[], count: count ?? 0, page };
    },
    getNextPageParam: (last) => {
      const loaded = (last.page + 1) * PAGE_SIZE;
      return loaded < last.count ? last.page + 1 : undefined;
    },
  });

// Legacy paginated hooks (kept for backward compat if referenced elsewhere)
export const useJournalists = (page: number, filters: DirectoryFilters) =>
  useQuery({
    queryKey: ["journalists", page, filters],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("journalist")
        .select("id,name,email,category,titles,topics,xhandle,outlet,country", { count: "exact" })
        .order("id", { ascending: true })
        .range(from, to);
      if (filters.q) {
        const v = `%${filters.q}%`;
        q = q.or(
          `name.ilike.${v},email.ilike.${v},outlet.ilike.${v},titles.ilike.${v},topics.ilike.${v},xhandle.ilike.${v}`
        );
      }
      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Journalist[], count: count ?? 0 };
    },
  });

export const useCreators = (page: number, filters: DirectoryFilters) =>
  useQuery({
    queryKey: ["creators", page, filters],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("creators")
        .select(
          "id,name,category,email,bio,ig_handle,ig_followers,ig_engagement_rate,ig_avg_engagements,youtube_url,youtube_subscribers,youtube_views_per_video,type",
          { count: "exact" }
        )
        .order("id", { ascending: true })
        .range(from, to);
      if (filters.q) {
        const v = `%${filters.q}%`;
        q = q.or(`name.ilike.${v},email.ilike.${v},ig_handle.ilike.${v},bio.ilike.${v}`);
      }
      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Creator[], count: count ?? 0 };
    },
  });
