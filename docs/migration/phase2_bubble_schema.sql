-- ============================================================
-- Phase 2: Bubble migration schema
-- Adds: plans, legacy_bubble_users (staging), profile linkage
-- IDEMPOTENT. Run in Supabase SQL Editor.
-- Run AFTER phase1_auth.sql, then run bubble_seed.sql.
-- ============================================================

-- 1. plans (the 3 Stripe-linked tiers from Bubble)
create table if not exists public.plans (
  identifier text primary key,            -- 'journalist' | 'creator' | 'both'
  sort_index int not null,
  name text not null,                     -- 'Journalist Pro', etc.
  monthly_price_cents int not null,
  monthly_price_id text,                  -- live Stripe price id
  testmode_monthly_price_id text,
  testmode_yearly_price_id text,
  created_at timestamptz not null default now()
);

alter table public.plans enable row level security;

drop policy if exists "Plans are public" on public.plans;
create policy "Plans are public"
  on public.plans for select
  to anon, authenticated using (true);

-- 2. legacy_bubble_users — staging table for the 214 imported Bubble users
-- Used to (a) recognize returning users at signup and (b) restore their plan/Stripe customer.
create table if not exists public.legacy_bubble_users (
  email text primary key,
  first_name text,
  last_name text,
  company text,
  bubble_created_at timestamptz,
  stripe_customer_id text,
  sub_active boolean not null default false,
  sub_interval text,                       -- 'month' | 'year' | NULL
  sub_period_start timestamptz,
  sub_period_end timestamptz,
  free_trial_end timestamptz,
  cancellation_scheduled boolean not null default false,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.legacy_bubble_users enable row level security;

-- Only admins read this directly. Self-claim happens via the trigger below.
drop policy if exists "Admins read legacy users" on public.legacy_bubble_users;
create policy "Admins read legacy users"
  on public.legacy_bubble_users for select
  to authenticated using (public.has_role(auth.uid(), 'admin'));

-- 3. Extend profiles with Stripe + plan linkage
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists plan_identifier text references public.plans(identifier),
  add column if not exists sub_active boolean not null default false,
  add column if not exists sub_period_end timestamptz,
  add column if not exists migrated_from_bubble boolean not null default false;

create index if not exists idx_profiles_stripe_customer on public.profiles(stripe_customer_id);

-- 4. Update handle_new_user() to auto-claim a legacy Bubble row when emails match
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  legacy public.legacy_bubble_users%rowtype;
  resolved_plan text;
begin
  -- Look up legacy Bubble user by email (case-insensitive)
  select * into legacy
  from public.legacy_bubble_users
  where email = lower(new.email)
  limit 1;

  -- Map Bubble plan if active. Without explicit plan FK in the export we fall back to 'both' (Media Pro)
  -- when the subscription is active. Admins can correct individual rows later.
  if legacy.email is not null and legacy.sub_active then
    resolved_plan := 'both';
  end if;

  insert into public.profiles (
    id, display_name, company, avatar_url,
    stripe_customer_id, plan_identifier, sub_active, sub_period_end, migrated_from_bubble
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      nullif(trim(coalesce(legacy.first_name,'') || ' ' || coalesce(legacy.last_name,'')), '')
    ),
    coalesce(new.raw_user_meta_data->>'company', legacy.company),
    new.raw_user_meta_data->>'avatar_url',
    legacy.stripe_customer_id,
    resolved_plan,
    coalesce(legacy.sub_active, false),
    legacy.sub_period_end,
    legacy.email is not null
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  -- Mark legacy row as claimed
  if legacy.email is not null then
    update public.legacy_bubble_users
       set claimed_by = new.id, claimed_at = now()
     where email = legacy.email;
  end if;

  return new;
end;
$$;
