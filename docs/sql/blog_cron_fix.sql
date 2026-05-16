-- Fix blog auto-posting cron reliability.
-- Run in Supabase SQL editor for project ref: uavbphkhomblzkjfuaot.
-- Runs daily; the edge function skips creation if a post was created in the
-- last 72 hours, so it won't miss an exact */3 calendar slot.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('blog-generate-3day')
where exists (select 1 from cron.job where jobname = 'blog-generate-3day');

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

-- Optional one-off test after scheduling:
-- select net.http_post(
--   url := 'https://uavbphkhomblzkjfuaot.supabase.co/functions/v1/blog-generate',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdmJwaGtob21ibHpramZ1YW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMjU0NDksImV4cCI6MjA1MTgwMTQ0OX0.BpHF9fxNgWWjMupXQ5GCJMj-n_iWJ27xAqm5fLXeudA'
--   ),
--   body := jsonb_build_object('source', 'manual_sql_test', 'sync', true),
--   timeout_milliseconds := 120000
-- );

-- Inspect cron and HTTP results:
-- select * from cron.job where jobname = 'blog-generate-3day';
-- select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'blog-generate-3day') order by start_time desc limit 10;
-- select status_code, error_msg, content, created from net._http_response order by created desc limit 10;
-- select slug, title, topic, published from public.blog_posts order by created_at desc limit 5;