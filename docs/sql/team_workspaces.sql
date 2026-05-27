-- Team workspaces schema. Run manually against the Supabase project (uavbphkhomblzkjfuaot).
-- Tables, grants, RLS, and policies for the /team frontend.

create table if not exists public.team_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  seat_limit integer not null default 5 check (seat_limit > 0),
  created_at timestamptz not null default now()
);
create index if not exists team_workspaces_owner_idx on public.team_workspaces (owner_user_id, created_at desc);

create table if not exists public.team_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.team_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index if not exists team_workspace_members_user_idx on public.team_workspace_members (user_id);

create table if not exists public.team_workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.team_workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin','member')),
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);
create index if not exists team_workspace_invites_workspace_idx on public.team_workspace_invites (workspace_id, created_at desc);

grant select, insert, update, delete on public.team_workspaces to authenticated;
grant all on public.team_workspaces to service_role;
grant select, insert, update, delete on public.team_workspace_members to authenticated;
grant all on public.team_workspace_members to service_role;
grant select, insert, update, delete on public.team_workspace_invites to authenticated;
grant all on public.team_workspace_invites to service_role;

alter table public.team_workspaces enable row level security;
alter table public.team_workspace_members enable row level security;
alter table public.team_workspace_invites enable row level security;

create or replace function public.is_team_member(_workspace_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_workspace_members where workspace_id = _workspace_id and user_id = _user_id)
$$;

drop policy if exists "team_workspaces_select" on public.team_workspaces;
create policy "team_workspaces_select" on public.team_workspaces for select to authenticated
  using (owner_user_id = auth.uid() or public.is_team_member(id, auth.uid()));
drop policy if exists "team_workspaces_insert" on public.team_workspaces;
create policy "team_workspaces_insert" on public.team_workspaces for insert to authenticated
  with check (owner_user_id = auth.uid());
drop policy if exists "team_workspaces_update" on public.team_workspaces;
create policy "team_workspaces_update" on public.team_workspaces for update to authenticated
  using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
drop policy if exists "team_workspaces_delete" on public.team_workspaces;
create policy "team_workspaces_delete" on public.team_workspaces for delete to authenticated
  using (owner_user_id = auth.uid());

drop policy if exists "team_members_select" on public.team_workspace_members;
create policy "team_members_select" on public.team_workspace_members for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_team_member(workspace_id, auth.uid())
    or exists (select 1 from public.team_workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid())
  );
drop policy if exists "team_members_insert" on public.team_workspace_members;
create policy "team_members_insert" on public.team_workspace_members for insert to authenticated
  with check (
    exists (select 1 from public.team_workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid())
    or user_id = auth.uid()
  );
drop policy if exists "team_members_delete" on public.team_workspace_members;
create policy "team_members_delete" on public.team_workspace_members for delete to authenticated
  using (exists (select 1 from public.team_workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid()));

drop policy if exists "team_invites_select" on public.team_workspace_invites;
create policy "team_invites_select" on public.team_workspace_invites for select to authenticated
  using (
    public.is_team_member(workspace_id, auth.uid())
    or exists (select 1 from public.team_workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid())
  );
drop policy if exists "team_invites_insert" on public.team_workspace_invites;
create policy "team_invites_insert" on public.team_workspace_invites for insert to authenticated
  with check (
    exists (select 1 from public.team_workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid())
    or exists (select 1 from public.team_workspace_members m where m.workspace_id = workspace_id and m.user_id = auth.uid() and m.role in ('owner','admin'))
  );
drop policy if exists "team_invites_delete" on public.team_workspace_invites;
create policy "team_invites_delete" on public.team_workspace_invites for delete to authenticated
  using (exists (select 1 from public.team_workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid()));
