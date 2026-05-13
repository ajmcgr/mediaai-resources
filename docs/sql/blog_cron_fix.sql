-- Fix blog auto-posting cron reliability.
-- Run in Supabase SQL editor for project ref: uavbphkhomblzkjfuaot

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('blog-generate-3day')
where exists (select 1 from cron.job where jobname = 'blog-generate-3day');

select cron.schedule(
  'blog-generate-3day',
  '0 9 */3 * *',
  $$
  select net.http_post(
    url := 'https://uavbphkhomblzkjfuaot.supabase.co/functions/v1/blog-generate',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('source', 'pg_cron'),
    timeout_milliseconds := 10000
  );
  $$
);

-- Optional one-off test after scheduling:
-- select net.http_post(
--   url := 'https://uavbphkhomblzkjfuaot.supabase.co/functions/v1/blog-generate',
--   headers := jsonb_build_object('Content-Type', 'application/json'),
--   body := jsonb_build_object('source', 'manual_sql_test'),
--   timeout_milliseconds := 10000
-- );

-- Inspect cron and HTTP results:
-- select * from cron.job where jobname = 'blog-generate-3day';
-- select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'blog-generate-3day') order by start_time desc limit 10;
-- select * from net._http_response order by created desc limit 10;