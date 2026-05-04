-- ============================================================
-- Phase 4: Chat token usage metering
-- Conservative monthly allowances per plan:
--   journalist  =>   200,000 tokens
--   creator     =>   500,000 tokens
--   both / pro  => 1,000,000 tokens
--   no plan     =>    20,000 tokens (free trial)
-- Period key = YYYY-MM (UTC).
-- ============================================================

create table if not exists public.chat_usage (
  user_id     uuid not null references auth.users(id) on delete cascade,
  period_ym   text not null,
  tokens_used bigint not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, period_ym)
);

alter table public.chat_usage enable row level security;

drop policy if exists "Users read own chat usage" on public.chat_usage;
create policy "Users read own chat usage"
  on public.chat_usage for select to authenticated
  using (user_id = auth.uid());

-- Allowance lookup based on profiles.plan_identifier + sub_active
create or replace function public.chat_token_allowance(_user uuid)
returns bigint
language sql stable security definer set search_path = public as $$
  select case
    when p.sub_active is true and p.plan_identifier = 'both'       then 1000000
    when p.sub_active is true and p.plan_identifier = 'media-pro'  then 1000000
    when p.sub_active is true and p.plan_identifier = 'pro'        then 1000000
    when p.sub_active is true and p.plan_identifier = 'creator'    then  500000
    when p.sub_active is true and p.plan_identifier = 'journalist' then  200000
    else 20000
  end
  from public.profiles p where p.id = _user
$$;

-- Returns { allowance, used, remaining, period_ym } for caller
create or replace function public.chat_usage_summary()
returns table(allowance bigint, used bigint, remaining bigint, period_ym text)
language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ym  text := to_char(now() at time zone 'utc', 'YYYY-MM');
  alw bigint;
  usd bigint;
begin
  if uid is null then
    allowance := 0; used := 0; remaining := 0; period_ym := ym; return next; return;
  end if;
  alw := public.chat_token_allowance(uid);
  select coalesce(tokens_used, 0) into usd
    from public.chat_usage where user_id = uid and period_ym = ym;
  if usd is null then usd := 0; end if;
  allowance := alw;
  used := usd;
  remaining := greatest(alw - usd, 0);
  period_ym := ym;
  return next;
end $$;

-- Increment usage; returns new total. Service role only.
create or replace function public.chat_usage_record(_user uuid, _tokens bigint)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  ym  text := to_char(now() at time zone 'utc', 'YYYY-MM');
  total bigint;
begin
  insert into public.chat_usage (user_id, period_ym, tokens_used, updated_at)
  values (_user, ym, greatest(_tokens, 0), now())
  on conflict (user_id, period_ym)
  do update set tokens_used = public.chat_usage.tokens_used + greatest(_tokens, 0),
                updated_at  = now()
  returning tokens_used into total;
  return total;
end $$;

revoke all on function public.chat_usage_record(uuid, bigint) from public, anon, authenticated;
grant execute on function public.chat_usage_summary() to authenticated;
grant execute on function public.chat_token_allowance(uuid) to authenticated;
