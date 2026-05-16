-- Phase 7: Auto-generated blog
-- Run in Supabase SQL editor (project ref: uavbphkhomblzkjfuaot)

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

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

-- Check blog-generate every day at 09:00 UTC; the edge function skips if a post
-- was already created in the last 72 hours.
-- Supabase's functions gateway requires an Authorization header for this project;
-- the anon JWT is enough because the edge function itself remains public.
-- The function returns quickly with { queued: true } and continues generation via EdgeRuntime.waitUntil,
-- so pg_net does not sit open until article/image generation finishes.
select cron.unschedule('blog-generate-3day') where exists (
  select 1 from cron.job where jobname = 'blog-generate-3day'
);

select cron.schedule(
  'blog-generate-3day',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://uavbphkhomblzkjfuaot.supabase.co/functions/v1/blog-generate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdmJwaGtob21ibHpramZ1YW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMjU0NDksImV4cCI6MjA1MTgwMTQ0OX0.BpHF9fxNgWWjMupXQ5GCJMj-n_iWJ27xAqm5fLXeudA'
    ),
    body := jsonb_build_object('source', 'pg_cron', 'sync', true),
    timeout_milliseconds := 120000
  );
  $$
);
