-- Verified article evidence backing journalist and creator profile relevance.
-- Ingestion jobs should upsert on canonical_url and never create coverage from
-- search snippets without an attributable source URL and publication date.
create table if not exists public.contact_coverage (
  id uuid primary key default gen_random_uuid(),
  contact_kind text not null check (contact_kind in ('journalist', 'creator')),
  contact_id bigint not null,
  headline text not null check (char_length(headline) between 1 and 1000),
  canonical_url text not null unique check (canonical_url ~* '^https?://'),
  outlet text,
  published_at timestamptz,
  summary text,
  topics text[] not null default '{}',
  source text not null default 'ingestion',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_coverage_contact_idx
  on public.contact_coverage (contact_kind, contact_id, published_at desc nulls last);
create index if not exists contact_coverage_published_idx
  on public.contact_coverage (published_at desc nulls last);
create index if not exists contact_coverage_topics_idx
  on public.contact_coverage using gin (topics);

grant select on public.contact_coverage to authenticated;
grant all on public.contact_coverage to service_role;

alter table public.contact_coverage enable row level security;

drop policy if exists "coverage_authenticated_read" on public.contact_coverage;
create policy "coverage_authenticated_read" on public.contact_coverage
  for select to authenticated using (true);
