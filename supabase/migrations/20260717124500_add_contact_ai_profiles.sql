create table if not exists public.contact_ai_profiles (
  id uuid primary key default gen_random_uuid(),
  contact_kind text not null check (contact_kind in ('journalist', 'creator')),
  contact_id bigint not null,
  status text not null default 'ready' check (status in ('ready', 'generating', 'insufficient_evidence', 'failed')),
  source_fingerprint text not null default '',
  confidence text check (confidence in ('high', 'medium', 'low')),
  profile_summary text,
  primary_topics text[] not null default '{}',
  secondary_topics text[] not null default '{}',
  recent_coverage_focus text[] not null default '{}',
  typical_content_formats text[] not null default '{}',
  audience_signals text[] not null default '{}',
  writing_signals text[] not null default '{}',
  geographic_relevance text[] not null default '{}',
  publication_focus text[] not null default '{}',
  topic_trends jsonb not null default '[]'::jsonb,
  pitch_guidance jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  similar_contacts jsonb not null default '[]'::jsonb,
  model text,
  generation_version text not null default 'profile-intelligence-v1',
  generated_at timestamptz,
  expires_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contact_kind, contact_id)
);

create index if not exists contact_ai_profiles_contact_idx
  on public.contact_ai_profiles (contact_kind, contact_id);

create index if not exists contact_ai_profiles_status_idx
  on public.contact_ai_profiles (status, expires_at);

create or replace function public.set_contact_ai_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contact_ai_profiles_updated_at on public.contact_ai_profiles;
create trigger contact_ai_profiles_updated_at
before update on public.contact_ai_profiles
for each row
execute function public.set_contact_ai_profiles_updated_at();

alter table public.contact_ai_profiles enable row level security;

drop policy if exists "Authenticated users can read contact AI profiles" on public.contact_ai_profiles;
create policy "Authenticated users can read contact AI profiles"
on public.contact_ai_profiles
for select
to authenticated
using (true);

revoke all on public.contact_ai_profiles from anon;
grant select on public.contact_ai_profiles to authenticated;
grant all on public.contact_ai_profiles to service_role;
