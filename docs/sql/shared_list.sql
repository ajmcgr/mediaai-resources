-- Run once in the Supabase SQL Editor for project uavbphkhomblzkjfuaot.
-- Backs the "Share list" feature (link + email + socials).

create table if not exists public.shared_list (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  list_id uuid not null references public.journalist_list(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text,
  note text,
  include_emails boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists shared_list_owner_idx on public.shared_list(owner_user_id);
create index if not exists shared_list_list_idx on public.shared_list(list_id);

alter table public.shared_list enable row level security;

-- Owners can manage their own share links.
-- Public reads happen via the share-list-fetch edge function (service role), not RLS.
drop policy if exists "Owners can view their share links" on public.shared_list;
create policy "Owners can view their share links"
  on public.shared_list for select to authenticated
  using (owner_user_id = auth.uid());

drop policy if exists "Owners can create share links" on public.shared_list;
create policy "Owners can create share links"
  on public.shared_list for insert to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists "Owners can update their share links" on public.shared_list;
create policy "Owners can update their share links"
  on public.shared_list for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "Owners can delete their share links" on public.shared_list;
create policy "Owners can delete their share links"
  on public.shared_list for delete to authenticated
  using (owner_user_id = auth.uid());
