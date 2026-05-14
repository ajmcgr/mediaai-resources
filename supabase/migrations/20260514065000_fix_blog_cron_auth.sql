-- Fix blog auto-posting cron invocation.
-- The deployed Supabase Functions gateway rejects scheduled calls without
-- an Authorization header, even when the edge function has verify_jwt = false.

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
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdmJwaGtob21ibHpramZ1YW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMjU0NDksImV4cCI6MjA1MTgwMTQ0OX0.BpHF9fxNgWWjMupXQ5GCJMj-n_iWJ27xAqm5fLXeudA'
    ),
    body := jsonb_build_object('source', 'pg_cron'),
    timeout_milliseconds := 10000
  );
  $$
);
