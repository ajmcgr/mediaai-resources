-- ============================================================
-- Phase 3: Subscriptions table (Stripe BYOK source of truth)
-- Webhook writes here. Trigger mirrors active state to profiles
-- so RLS / UI feature gates can read profiles.sub_active fast.
-- IDEMPOTENT. Run in Supabase SQL Editor.
-- ============================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_identifier text not null references public.plans(identifier),
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null,                       -- active | trialing | past_due | canceled | incomplete | unpaid | paused
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_customer on public.subscriptions(stripe_customer_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);

alter table public.subscriptions enable row level security;

drop policy if exists "Users read own subscriptions" on public.subscriptions;
create policy "Users read own subscriptions"
  on public.subscriptions for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins read all subscriptions" on public.subscriptions;
create policy "Admins read all subscriptions"
  on public.subscriptions for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policies for clients — only the service-role webhook writes.

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_subscriptions_touch on public.subscriptions;
create trigger trg_subscriptions_touch
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- Mirror active subscription state into profiles for fast UI checks.
create or replace function public.sync_subscription_to_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  active_sub public.subscriptions%rowtype;
  target_user uuid;
begin
  target_user := coalesce(new.user_id, old.user_id);

  -- Pick the most recent active/trialing sub for this user
  select * into active_sub
  from public.subscriptions
  where user_id = target_user
    and status in ('active', 'trialing')
  order by current_period_end desc nulls last
  limit 1;

  if active_sub.id is not null then
    update public.profiles
       set plan_identifier   = active_sub.plan_identifier,
           sub_active        = true,
           sub_period_end    = active_sub.current_period_end,
           stripe_customer_id = active_sub.stripe_customer_id
     where id = target_user;
  else
    update public.profiles
       set sub_active        = false,
           sub_period_end    = null
     where id = target_user;
  end if;

  return null;
end $$;

drop trigger if exists trg_subscriptions_sync on public.subscriptions;
create trigger trg_subscriptions_sync
  after insert or update or delete on public.subscriptions
  for each row execute function public.sync_subscription_to_profile();

-- Helper: does the current user have an active subscription on a given plan (or any)?
create or replace function public.current_user_has_active_plan(_plan text default null)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = auth.uid()
      and status in ('active','trialing')
      and (_plan is null or plan_identifier = _plan)
  )
$$;
