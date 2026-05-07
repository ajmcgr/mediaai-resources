-- ============================================================
-- Keyword Monitor — additive schema upgrade
-- Apply in Supabase SQL editor (project uavbphkhomblzkjfuaot)
-- Safe / additive: no destructive changes.
-- ============================================================

-- brand_monitors: founders, products, run-status fields
alter table public.brand_monitors
  add column if not exists founder_names text[] not null default '{}',
  add column if not exists product_names text[] not null default '{}',
  add column if not exists digest_last_sent_at timestamptz,
  add column if not exists last_status text,
  add column if not exists last_error text,
  add column if not exists last_mentions_found int not null default 0;

-- monitor_updates: news mention fields
alter table public.monitor_updates
  add column if not exists mention_type text,        -- brand | competitor | founder | keyword | product
  add column if not exists matched_keyword text,
  add column if not exists source text,              -- google_news | blog | news_site | newsletter
  add column if not exists title text,
  add column if not exists publisher text,
  add column if not exists published_at timestamptz,
  add column if not exists image_url text,
  add column if not exists sentiment text;           -- positive | neutral | negative

-- existing AI columns become optional (no-op if already nullable)
alter table public.monitor_updates
  alter column summary drop not null;

-- dedupe new mentions per (monitor, url)
create unique index if not exists monitor_updates_monitor_url_uidx
  on public.monitor_updates(monitor_id, url);

create index if not exists monitor_updates_published_idx
  on public.monitor_updates(monitor_id, published_at desc);
