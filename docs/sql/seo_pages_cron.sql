-- Daily auto-generation of SEO discover pages.
-- Run this in the Supabase SQL editor ONCE.
--
-- Prereqs: pg_cron + pg_net extensions (Supabase enables these in the
-- `extensions` schema by default on paid plans).

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

-- Store the service-role key in a Postgres setting so the cron job can
-- authenticate to the edge function. Replace the placeholder below.
-- (Run this line manually with your real service-role key, then delete it.)
--
--   alter database postgres set "app.settings.service_role_key" = 'eyJhbGciOi...';
--
-- And set your project ref / functions URL:
--
--   alter database postgres set "app.settings.functions_url" = 'https://uavbphkhomblzkjfuaot.supabase.co/functions/v1';

-- Remove any prior schedule with this name
select cron.unschedule('seo-pages-daily-autogen')
where exists (select 1 from cron.job where jobname = 'seo-pages-daily-autogen');

-- Schedule: every day at 09:00 UTC, generate 5 pages, published immediately.
select cron.schedule(
  'seo-pages-daily-autogen',
  '0 9 * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.functions_url') || '/seo-page-build',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('auto', true, 'count', 5, 'publish', true),
    timeout_milliseconds := 120000
  );
  $$
);

-- Inspect:
--   select * from cron.job where jobname = 'seo-pages-daily-autogen';
--   select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname='seo-pages-daily-autogen') order by start_time desc limit 5;
--
-- To pause:    select cron.unschedule('seo-pages-daily-autogen');
-- To change cadence: re-run the cron.schedule(...) block with a new cron expression.
