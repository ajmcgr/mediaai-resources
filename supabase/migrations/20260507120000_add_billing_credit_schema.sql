-- Billing/chat credit support used by Stripe top-ups and account usage display.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  chat_credits bigint not null default 0,
  sub_active boolean not null default false,
  plan_identifier text,
  sub_period_end timestamptz,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists public.topup_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_session_id text not null unique,
  tokens bigint not null check (tokens > 0),
  created_at timestamptz not null default now()
);

create index if not exists topup_transactions_user_id_created_at_idx
  on public.topup_transactions (user_id, created_at desc);

create table if not exists public.chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_ym text not null,
  tokens_used bigint not null default 0 check (tokens_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_ym)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_identifier text not null,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_status_idx
  on public.subscriptions (user_id, status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists chat_usage_touch_updated_at on public.chat_usage;
create trigger chat_usage_touch_updated_at
before update on public.chat_usage
for each row execute function public.touch_updated_at();

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
before update on public.subscriptions
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.profiles (id, email)
select id, email
from auth.users
on conflict (id) do update set email = excluded.email;

create or replace function public.chat_credit_grant(_user uuid, _tokens bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if _user is null or coalesce(_tokens, 0) <= 0 then
    raise exception 'invalid credit grant';
  end if;

  insert into public.profiles (id, chat_credits)
  values (_user, _tokens)
  on conflict (id) do update
    set chat_credits = coalesce(public.profiles.chat_credits, 0) + excluded.chat_credits;
end;
$$;

create or replace function public.chat_usage_summary()
returns table (
  allowance bigint,
  used bigint,
  remaining bigint,
  credits bigint,
  period_ym text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  profile_row public.profiles%rowtype;
  period text := to_char(now(), 'YYYY-MM');
  monthly_allowance bigint := 20000;
  used_tokens bigint := 0;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.profiles (id)
  values (uid)
  on conflict (id) do nothing;

  select * into profile_row from public.profiles where id = uid;

  if profile_row.sub_active then
    monthly_allowance := case
      when lower(coalesce(profile_row.plan_identifier, '')) in ('growth', 'both', 'media-pro', 'pro', 'enterprise') then 1000000
      else 200000
    end;
  end if;

  select coalesce(tokens_used, 0) into used_tokens
  from public.chat_usage
  where user_id = uid and period_ym = period;

  allowance := monthly_allowance;
  used := coalesce(used_tokens, 0);
  credits := coalesce(profile_row.chat_credits, 0);
  remaining := greatest(monthly_allowance - used, 0) + credits;
  period_ym := period;
  return next;
end;
$$;

create or replace function public.chat_usage_record(_user uuid, _tokens bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  period text := to_char(now(), 'YYYY-MM');
  token_count bigint := greatest(coalesce(_tokens, 0), 0);
  profile_row public.profiles%rowtype;
  monthly_allowance bigint := 20000;
  used_tokens bigint := 0;
begin
  if _user is null then
    raise exception 'missing user';
  end if;

  insert into public.profiles (id)
  values (_user)
  on conflict (id) do nothing;

  insert into public.chat_usage (user_id, period_ym, tokens_used)
  values (_user, period, token_count)
  on conflict (user_id, period_ym) do update
    set tokens_used = public.chat_usage.tokens_used + excluded.tokens_used;

  select * into profile_row from public.profiles where id = _user;
  if profile_row.sub_active then
    monthly_allowance := case
      when lower(coalesce(profile_row.plan_identifier, '')) in ('growth', 'both', 'media-pro', 'pro', 'enterprise') then 1000000
      else 200000
    end;
  end if;

  select coalesce(tokens_used, 0) into used_tokens
  from public.chat_usage
  where user_id = _user and period_ym = period;

  return greatest(monthly_allowance - coalesce(used_tokens, 0), 0) + coalesce(profile_row.chat_credits, 0);
end;
$$;

alter table public.profiles enable row level security;
alter table public.topup_transactions enable row level security;
alter table public.chat_usage enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Users can read own topups" on public.topup_transactions;
create policy "Users can read own topups"
on public.topup_transactions for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read own chat usage" on public.chat_usage;
create policy "Users can read own chat usage"
on public.chat_usage for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read own subscriptions" on public.subscriptions;
create policy "Users can read own subscriptions"
on public.subscriptions for select
to authenticated
using (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.topup_transactions to authenticated;
grant select on public.chat_usage to authenticated;
grant select on public.subscriptions to authenticated;
grant execute on function public.chat_credit_grant(uuid, bigint) to service_role;
grant execute on function public.chat_usage_summary() to authenticated;
grant execute on function public.chat_usage_record(uuid, bigint) to service_role;
