-- Run this once in the Supabase SQL Editor for project uavbphkhomblzkjfuaot.
-- Idempotency table for Stripe top-up purchases (referenced by create-topup / confirm-topup).
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
