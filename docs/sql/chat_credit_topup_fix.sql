-- Run this once in Supabase SQL Editor for project uavbphkhomblzkjfuaot.
-- Fixes chat credit display + Stripe top-up grants end-to-end.

alter table public.profiles
  add column if not exists chat_credits bigint not null default 0;

create table if not exists public.topup_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_session_id text not null unique,
  tokens bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists topup_transactions_user_idx
  on public.topup_transactions (user_id, created_at desc);

alter table public.topup_transactions enable row level security;

drop policy if exists "topup_select_own" on public.topup_transactions;
create policy "topup_select_own" on public.topup_transactions
  for select to authenticated
  using (auth.uid() = user_id);

drop function if exists public.chat_usage_summary();

create or replace function public.chat_token_allowance(_user uuid)
returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce((
    select case
      when p.sub_active is true and p.plan_identifier in ('growth','both','media-pro','pro','enterprise') then 1000000
      when p.sub_active is true and p.plan_identifier in ('starter','journalist','creator') then 200000
      else 20000
    end
    from public.profiles p
    where p.id = _user
  ), 0)
$$;

create or replace function public.chat_usage_summary()
returns table(
  allowance bigint,
  used bigint,
  remaining bigint,
  credits bigint,
  period_ym text
)
language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ym text := to_char(now() at time zone 'utc', 'YYYY-MM');
  alw bigint := 0;
  usd bigint := 0;
  cr bigint := 0;
begin
  if uid is not null then
    alw := coalesce(public.chat_token_allowance(uid), 0);
    select coalesce(cu.tokens_used, 0) into usd
      from public.chat_usage cu
      where cu.user_id = uid and cu.period_ym = ym;
    usd := coalesce(usd, 0);
    select coalesce(chat_credits, 0) into cr
      from public.profiles
      where id = uid;
    cr := coalesce(cr, 0);
  end if;

  allowance := alw;
  used := usd;
  credits := cr;
  remaining := greatest(alw - usd, 0) + cr;
  period_ym := ym;
  return next;
end $$;

create or replace function public.chat_usage_record(_user uuid, _tokens bigint)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  ym text := to_char(now() at time zone 'utc', 'YYYY-MM');
  alw bigint := 0;
  cur_used bigint := 0;
  new_used bigint := 0;
  monthly_room bigint := 0;
  overflow bigint := 0;
  total_remaining bigint := 0;
begin
  if _tokens is null or _tokens <= 0 then
    return 0;
  end if;

  alw := coalesce(public.chat_token_allowance(_user), 0);

  insert into public.chat_usage (user_id, period_ym, tokens_used, updated_at)
  values (_user, ym, 0, now())
  on conflict (user_id, period_ym) do nothing;

  select coalesce(cu.tokens_used, 0) into cur_used
    from public.chat_usage cu
    where cu.user_id = _user and cu.period_ym = ym
    for update;

  monthly_room := greatest(alw - cur_used, 0);
  if _tokens <= monthly_room then
    new_used := cur_used + _tokens;
  else
    new_used := cur_used + monthly_room;
    overflow := _tokens - monthly_room;
  end if;

  update public.chat_usage
    set tokens_used = new_used, updated_at = now()
    where public.chat_usage.user_id = _user and public.chat_usage.period_ym = ym;

  if overflow > 0 then
    update public.profiles
      set chat_credits = greatest(coalesce(chat_credits, 0) - overflow, 0)
      where id = _user;
  end if;

  select greatest(alw - new_used, 0) + coalesce(chat_credits, 0)
    into total_remaining
    from public.profiles
    where id = _user;

  return coalesce(total_remaining, 0);
end $$;

create or replace function public.chat_credit_grant(_user uuid, _tokens bigint)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  new_total bigint := 0;
begin
  update public.profiles
    set chat_credits = coalesce(chat_credits, 0) + greatest(coalesce(_tokens, 0), 0)
    where id = _user
    returning chat_credits into new_total;

  if new_total is null then
    raise exception 'profile_not_found';
  end if;

  return new_total;
end $$;

revoke all on function public.chat_usage_record(uuid, bigint) from public, anon, authenticated;
revoke all on function public.chat_credit_grant(uuid, bigint) from public, anon, authenticated;
grant execute on function public.chat_usage_summary() to authenticated;
grant execute on function public.chat_token_allowance(uuid) to authenticated;
