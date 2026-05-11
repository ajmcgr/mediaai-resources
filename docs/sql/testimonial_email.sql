-- Tracking table + daily cron for the "30-day testimonial request" email.
-- Run this in the Supabase SQL editor for project uavbphkhomblzkjfuaot.

create table if not exists public.testimonial_email_log (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  sent_at timestamptz not null default now(),
  replied boolean not null default false,
  discount_applied boolean not null default false,
  notes text
);

alter table public.testimonial_email_log enable row level security;

-- No client access. Service role bypasses RLS, which is what the edge function uses.
-- (No policies defined => no anon/authenticated access.)

-- Daily cron: invoke the edge function at 14:00 UTC every day.
-- Requires pg_cron + pg_net extensions, and the service role key stored in vault
-- as `service_role_key`. If that vault entry doesn't exist yet, create it via:
--   select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');

-- Unschedule any prior version first so this script is idempotent.
do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'send-testimonial-request-daily';
exception when others then null;
end $$;

select
  cron.schedule(
    'send-testimonial-request-daily',
    '0 14 * * *',
    $$
    select net.http_post(
      url := 'https://uavbphkhomblzkjfuaot.supabase.co/functions/v1/send-testimonial-request',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1)
      ),
      body := '{}'::jsonb
    ) as request_id;
    $$
  );
