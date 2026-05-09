-- Phase 7: Auto-generated blog
-- Run in Supabase SQL editor (project ref: uavbphkhomblzkjfuaot)

create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  image text,
  content text not null,
  topic text,
  published timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published desc);

alter table public.blog_posts enable row level security;

drop policy if exists "blog_posts public read" on public.blog_posts;
create policy "blog_posts public read"
  on public.blog_posts
  for select
  using (true);

-- service role inserts via edge function; no insert policy needed for clients

-- Schedule blog-generate every 3 days at 09:00 UTC
select cron.unschedule('blog-generate-3day') where exists (
  select 1 from cron.job where jobname = 'blog-generate-3day'
);

select cron.schedule(
  'blog-generate-3day',
  '0 9 */3 * *',
  $$
  select net.http_post(
    url := 'https://uavbphkhomblzkjfuaot.supabase.co/functions/v1/blog-generate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdmJwaGtob21ibHpramZ1YW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMjU0NDksImV4cCI6MjA1MTgwMTQ0OX0.BpHF9fxNgWWjMupXQ5GCJMj-n_iWJ27xAqm5fLXeudA',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdmJwaGtob21ibHpramZ1YW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMjU0NDksImV4cCI6MjA1MTgwMTQ0OX0.BpHF9fxNgWWjMupXQ5GCJMj-n_iWJ27xAqm5fLXeudA'
    ),
    body := '{}'::jsonb
  );
  $$
);
