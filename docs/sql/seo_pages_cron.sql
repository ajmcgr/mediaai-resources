-- Daily auto-generation of SEO discover pages.
-- Run this in the Supabase SQL editor.
-- Do NOT use `alter database ... set app.settings.service_role_key` on Supabase:
-- hosted projects do not allow that. Store the key in Vault instead.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- 1) Store the service-role key in Supabase Vault (encrypted and readable by pg_cron).
--    Get the key from: Project Settings → API → service_role key.
--    Replace <SERVICE_ROLE_KEY> below. If you pasted a service-role key into chat or SQL history,
--    rotate it in Supabase after this is working.
delete from vault.secrets where name = 'seo_cron_service_role_key';

select vault.create_secret(
  '<SERVICE_ROLE_KEY>',
  'seo_cron_service_role_key',
  'Service role key used by seo-pages-daily-autogen cron'
);

-- 2) Remove any prior schedule with this name
select cron.unschedule('seo-pages-daily-autogen')
where exists (select 1 from cron.job where jobname = 'seo-pages-daily-autogen');

-- 3) Schedule: every day at 09:00 UTC, generate 5 pages, published immediately.
select cron.schedule(
  'seo-pages-daily-autogen',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://uavbphkhomblzkjfuaot.supabase.co/functions/v1/seo-page-build',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'seo_cron_service_role_key')
    ),
    body := jsonb_build_object('auto', true, 'count', 5, 'publish', true),
    timeout_milliseconds := 120000
  );
  $$
);

-- Inspect:
--   select * from cron.job where jobname = 'seo-pages-daily-autogen';
--   select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname='seo-pages-daily-autogen') order by start_time desc limit 5;
--   select * from net._http_response order by created desc limit 5;
--
-- Pause:   select cron.unschedule('seo-pages-daily-autogen');
-- Change cadence: re-run the cron.schedule(...) block with a new cron expression.
