-- ============================================================
-- Brand Monitor (PR Signals) — apply in Supabase SQL editor
-- Project: uavbphkhomblzkjfuaot
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ----------------------------------------------------------------
-- brand_monitors
-- ----------------------------------------------------------------
create table if not exists public.brand_monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_name text not null,
  website_url text not null,
  competitor_urls text[] not null default '{}',
  keywords text[] not null default '{}',
  email_alerts boolean not null default true,
  alert_frequency text not null default 'instant'
    check (alert_frequency in ('instant','daily','weekly')),
  is_active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists brand_monitors_user_idx on public.brand_monitors(user_id);
create index if not exists brand_monitors_active_idx on public.brand_monitors(is_active, last_checked_at);

alter table public.brand_monitors enable row level security;
drop policy if exists brand_monitors_select on public.brand_monitors;
create policy brand_monitors_select on public.brand_monitors for select using (auth.uid() = user_id);
drop policy if exists brand_monitors_insert on public.brand_monitors;
create policy brand_monitors_insert on public.brand_monitors for insert with check (auth.uid() = user_id);
drop policy if exists brand_monitors_update on public.brand_monitors;
create policy brand_monitors_update on public.brand_monitors for update using (auth.uid() = user_id);
drop policy if exists brand_monitors_delete on public.brand_monitors;
create policy brand_monitors_delete on public.brand_monitors for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- monitor_snapshots
-- ----------------------------------------------------------------
create table if not exists public.monitor_snapshots (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references public.brand_monitors(id) on delete cascade,
  url text not null,
  url_kind text not null default 'brand' check (url_kind in ('brand','competitor')),
  content_hash text not null,
  text_content text not null,
  fetched_at timestamptz not null default now()
);
create index if not exists monitor_snapshots_monitor_url_idx
  on public.monitor_snapshots(monitor_id, url, fetched_at desc);

alter table public.monitor_snapshots enable row level security;
drop policy if exists monitor_snapshots_select on public.monitor_snapshots;
create policy monitor_snapshots_select on public.monitor_snapshots for select using (
  exists (select 1 from public.brand_monitors b where b.id = monitor_snapshots.monitor_id and b.user_id = auth.uid())
);

-- ----------------------------------------------------------------
-- monitor_updates
-- ----------------------------------------------------------------
create table if not exists public.monitor_updates (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references public.brand_monitors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  url_kind text not null default 'brand',
  summary text not null,
  why_it_matters text,
  pr_score int check (pr_score between 0 and 100),
  next_action text,
  pitch_angle text,
  diff_excerpt text,
  email_sent boolean not null default false,
  detected_at timestamptz not null default now()
);
create index if not exists monitor_updates_user_idx on public.monitor_updates(user_id, detected_at desc);
create index if not exists monitor_updates_monitor_idx on public.monitor_updates(monitor_id, detected_at desc);

alter table public.monitor_updates enable row level security;
drop policy if exists monitor_updates_select on public.monitor_updates;
create policy monitor_updates_select on public.monitor_updates for select using (auth.uid() = user_id);
drop policy if exists monitor_updates_delete on public.monitor_updates;
create policy monitor_updates_delete on public.monitor_updates for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- Daily cron: invoke monitor-run-all edge function (07:00 UTC)
-- ----------------------------------------------------------------
do $$
declare jid int;
begin
  select jobid into jid from cron.job where jobname = 'monitor-run-all-daily';
  if jid is not null then perform cron.unschedule(jid); end if;
end $$;

select cron.schedule(
  'monitor-run-all-daily',
  '0 7 * * *',
  $$
  select net.http_post(
    url := 'https://uavbphkhomblzkjfuaot.supabase.co/functions/v1/monitor-run-all',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('source','cron')
  );
  $$
);
