-- Admin role infrastructure + lock down /admin write surfaces.
-- Run this in the Supabase SQL editor.

-- 1) Enum + table
do $$ begin
  create type public.app_role as enum ('admin', 'moderator', 'user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- 2) Security-definer role check (avoids RLS recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- 3) RLS on user_roles
drop policy if exists user_roles_self_read on public.user_roles;
create policy user_roles_self_read on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 4) Seed initial admin
insert into public.user_roles (user_id, role)
values ('261f407c-8f87-42b8-9c07-55ebee34b0bd', 'admin')
on conflict (user_id, role) do nothing;

-- 5) Tighten seo_pages writes to admins only (replaces the open auth policy)
drop policy if exists seo_pages_auth_write on public.seo_pages;
drop policy if exists seo_pages_admin_write on public.seo_pages;
create policy seo_pages_admin_write on public.seo_pages
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
