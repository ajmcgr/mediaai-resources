-- Captures explicit relevance judgements without exposing feedback between users.
create table if not exists public.search_result_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  search_query text not null check (char_length(search_query) between 1 and 2000),
  result_key text not null check (char_length(result_key) between 1 and 2000),
  feedback text not null check (feedback in ('relevant', 'not_relevant')),
  source text,
  source_table text,
  source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, search_query, result_key)
);

create index if not exists search_result_feedback_query_idx
  on public.search_result_feedback (search_query, feedback, created_at desc);
create index if not exists search_result_feedback_user_idx
  on public.search_result_feedback (user_id, created_at desc);

grant select, insert, update on public.search_result_feedback to authenticated;
grant all on public.search_result_feedback to service_role;

alter table public.search_result_feedback enable row level security;

drop policy if exists "search_feedback_select_own" on public.search_result_feedback;
create policy "search_feedback_select_own" on public.search_result_feedback
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "search_feedback_insert_own" on public.search_result_feedback;
create policy "search_feedback_insert_own" on public.search_result_feedback
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "search_feedback_update_own" on public.search_result_feedback;
create policy "search_feedback_update_own" on public.search_result_feedback
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
