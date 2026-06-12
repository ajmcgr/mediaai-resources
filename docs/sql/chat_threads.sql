-- Persistent chat history
-- Run this in the Supabase SQL editor for project uavbphkhomblzkjfuaot.

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_threads_user_updated_idx
  on public.chat_threads (user_id, updated_at desc);

grant select, insert, update, delete on public.chat_threads to authenticated;
grant all on public.chat_threads to service_role;

alter table public.chat_threads enable row level security;

drop policy if exists "Users select own chat threads" on public.chat_threads;
create policy "Users select own chat threads"
  on public.chat_threads for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users insert own chat threads" on public.chat_threads;
create policy "Users insert own chat threads"
  on public.chat_threads for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users update own chat threads" on public.chat_threads;
create policy "Users update own chat threads"
  on public.chat_threads for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users delete own chat threads" on public.chat_threads;
create policy "Users delete own chat threads"
  on public.chat_threads for delete to authenticated
  using (user_id = auth.uid());
