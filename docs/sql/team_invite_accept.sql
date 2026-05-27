-- Team invite acceptance: lets an invitee see their own pending invite
-- by email and accept it via a security-definer RPC. Idempotent.
-- Run manually on Supabase project uavbphkhomblzkjfuaot.

drop policy if exists "team_invites_select_by_invitee_email" on public.team_workspace_invites;
create policy "team_invites_select_by_invitee_email"
on public.team_workspace_invites
for select
to authenticated
using (
  status = 'pending'
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create or replace function public.accept_team_invite(_invite_id uuid)
returns public.team_workspace_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.team_workspace_invites;
  v_email  text;
  v_member public.team_workspace_members;
  v_seat_limit integer;
  v_active_members integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  select * into v_invite from public.team_workspace_invites where id = _invite_id;
  if not found then raise exception 'invite_not_found'; end if;
  if v_invite.status <> 'pending' then raise exception 'invite_%', v_invite.status; end if;
  if lower(v_invite.email) <> v_email then raise exception 'invite_email_mismatch'; end if;

  select seat_limit into v_seat_limit from public.team_workspaces where id = v_invite.workspace_id;
  select count(*) into v_active_members from public.team_workspace_members where workspace_id = v_invite.workspace_id;
  if v_active_members >= coalesce(v_seat_limit, 0) then
    raise exception 'seat_limit_reached';
  end if;

  insert into public.team_workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, auth.uid(), v_invite.role)
  on conflict (workspace_id, user_id) do update set role = excluded.role
  returning * into v_member;

  update public.team_workspace_invites set status = 'accepted' where id = v_invite.id;
  return v_member;
end;
$$;

grant execute on function public.accept_team_invite(uuid) to authenticated;
