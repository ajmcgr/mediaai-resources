-- Phase 8: add linkedin_url to journalist + creators
-- Apply in Supabase SQL editor.

alter table public.journalist
  add column if not exists linkedin_url text;

alter table public.creators
  add column if not exists linkedin_url text;

create index if not exists journalist_linkedin_url_idx
  on public.journalist (linkedin_url)
  where linkedin_url is not null;
