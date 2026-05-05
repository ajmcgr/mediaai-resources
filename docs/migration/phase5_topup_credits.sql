-- ============================================================
-- Phase 5: New plans (starter/growth/enterprise) + token top-up credits
-- - profiles.chat_credits: ever-accumulating pool from one-time purchases
-- - chat_token_allowance(): updated for new plan identifiers
-- - chat_usage_summary() now includes credits in remaining
-- - chat_usage_record() drains monthly first, overflow from chat_credits
-- - chat_credit_grant(): service-role RPC, called by webhook on payment
-- ============================================================

alter table public.profiles
  add column if not exists chat_credits bigint not null default 0;

-- Needed because Postgres cannot change OUT-parameter return shapes with create or replace.
drop function if exists public.chat_usage_summary();

-- Updated allowance map for new plans
create or replace function public.chat_token_allowance(_user uuid)
returns bigint
language sql stable security definer set search_path = public as $$
  select case
    when p.sub_active is true and p.plan_identifier in ('growth','both','media-pro','pro')
      then 1000000
    when p.sub_active is true and p.plan_identifier in ('starter','journalist','creator')
      then 200000
    else 20000
  end
  from public.profiles p where p.id = _user
$$;

-- Summary now includes top-up credits in `remaining`
create or replace function public.chat_usage_summary()
returns table(
  allowance bigint, used bigint, remaining bigint,
  credits bigint, period_ym text
)
language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ym  text := to_char(now() at time zone 'utc', 'YYYY-MM');
  alw bigint; usd bigint; cr bigint;
begin
  if uid is null then
    allowance := 0; used := 0; remaining := 0; credits := 0; period_ym := ym;
    return next; return;
  end if;
  alw := public.chat_token_allowance(uid);
  select coalesce(cu.tokens_used, 0) into usd
    from public.chat_usage cu where cu.user_id = uid and cu.period_ym = ym;
  if usd is null then usd := 0; end if;
  select coalesce(chat_credits, 0) into cr from public.profiles where id = uid;
  allowance := alw;
  used := usd;
  credits := cr;
  remaining := greatest(alw - usd, 0) + cr;
  period_ym := ym;
  return next;
end $$;

-- Record usage: drain monthly allowance, then deduct overflow from chat_credits
create or replace function public.chat_usage_record(_user uuid, _tokens bigint)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  ym  text := to_char(now() at time zone 'utc', 'YYYY-MM');
  alw bigint; cur_used bigint; new_used bigint;
  monthly_room bigint; overflow bigint;
  total_remaining bigint;
begin
  if _tokens is null or _tokens <= 0 then
    return 0;
  end if;

  alw := public.chat_token_allowance(_user);

  insert into public.chat_usage (user_id, period_ym, tokens_used, updated_at)
  values (_user, ym, 0, now())
  on conflict (user_id, period_ym) do nothing;

  select cu.tokens_used into cur_used from public.chat_usage cu
    where cu.user_id = _user and cu.period_ym = ym for update;
  if cur_used is null then cur_used := 0; end if;

  monthly_room := greatest(alw - cur_used, 0);
  if _tokens <= monthly_room then
    new_used := cur_used + _tokens;
    overflow := 0;
  else
    new_used := cur_used + monthly_room;
    overflow := _tokens - monthly_room;
  end if;

  update public.chat_usage
    set tokens_used = new_used, updated_at = now()
    where public.chat_usage.user_id = _user and public.chat_usage.period_ym = ym;

  if overflow > 0 then
    update public.profiles
      set chat_credits = greatest(chat_credits - overflow, 0)
      where id = _user;
  end if;

  select greatest(alw - new_used, 0) + coalesce(chat_credits, 0)
    into total_remaining
    from public.profiles where id = _user;
  return total_remaining;
end $$;

-- Grant credits (service-role only; called by stripe-webhook on top-up payment)
create or replace function public.chat_credit_grant(_user uuid, _tokens bigint)
returns bigint
language plpgsql security definer set search_path = public as $$
declare new_total bigint;
begin
  update public.profiles
    set chat_credits = coalesce(chat_credits, 0) + greatest(_tokens, 0)
    where id = _user
    returning chat_credits into new_total;
  return new_total;
end $$;

revoke all on function public.chat_usage_record(uuid, bigint) from public, anon, authenticated;
revoke all on function public.chat_credit_grant(uuid, bigint) from public, anon, authenticated;
grant execute on function public.chat_usage_summary() to authenticated;
