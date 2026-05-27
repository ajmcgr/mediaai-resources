import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CURRENT_WORKSPACE_KEY,
  getCurrentWorkspaceId,
  setCurrentWorkspaceId,
} from "@/lib/workspaceContext";
import type { TeamRole } from "@/lib/teamPermissions";

export type TeamWorkspace = {
  id: string;
  owner_user_id: string;
  name: string;
  seat_limit: number;
  created_at: string;
};

export type TeamMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: TeamRole;
  created_at: string;
};

export type TeamInvite = {
  id: string;
  workspace_id: string;
  email: string;
  role: "admin" | "member";
  invited_by: string | null;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
};

export function useTeamWorkspaces(userId: string | undefined) {
  return useQuery({
    queryKey: ["team_workspaces", userId],
    enabled: !!userId,
    queryFn: async (): Promise<TeamWorkspace[]> => {
      const { data, error } = await (supabase as any)
        .from("team_workspaces")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TeamWorkspace[];
    },
  });
}

export function useCreateWorkspace(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; seatLimit: number }) => {
      if (!userId) throw new Error("Not signed in");
      const { data: ws, error } = await (supabase as any)
        .from("team_workspaces")
        .insert({
          owner_user_id: userId,
          name: input.name,
          seat_limit: input.seatLimit,
        })
        .select()
        .single();
      if (error) throw error;
      return ws as TeamWorkspace;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team_workspaces", userId] });
    },
  });
}

export function useTeamMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["team_members", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await (supabase as any)
        .from("team_workspace_members")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });
}

export function useTeamInvites(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["team_invites", workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<TeamInvite[]> => {
      const { data, error } = await (supabase as any)
        .from("team_workspace_invites")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeamInvite[];
    },
  });
}

export function useInviteMember(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; role: "admin" | "member"; invitedBy?: string }) => {
      if (!workspaceId) throw new Error("No workspace");
      const { data, error } = await (supabase as any)
        .from("team_workspace_invites")
        .insert({
          workspace_id: workspaceId,
          email: input.email.trim().toLowerCase(),
          role: input.role,
          invited_by: input.invitedBy ?? null,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      return data as TeamInvite;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team_invites", workspaceId] });
    },
  });
}

export function useRevokeInvite(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await (supabase as any)
        .from("team_workspace_invites")
        .update({ status: "revoked" })
        .eq("id", inviteId);
      if (error) throw error;
      return inviteId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team_invites", workspaceId] });
    },
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { data, error } = await (supabase as any).rpc("accept_team_invite", {
        _invite_id: inviteId,
      });
      if (error) throw error;
      return data as TeamMember;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team_workspaces"] });
      qc.invalidateQueries({ queryKey: ["team_members"] });
    },
  });
}

/**
 * Returns the currently-selected workspace id, falling back to the first
 * workspace the user belongs to. Persists selection to localStorage.
 */
export function useCurrentWorkspace(workspaces: TeamWorkspace[] | undefined) {
  const [currentId, setCurrentIdState] = useState<string | null>(getCurrentWorkspaceId());

  // Re-sync from storage events / cross-tab changes.
  useEffect(() => {
    const handler = () => setCurrentIdState(getCurrentWorkspaceId());
    window.addEventListener("storage", handler);
    window.addEventListener("mediaai:workspace-changed", handler as EventListener);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("mediaai:workspace-changed", handler as EventListener);
    };
  }, []);

  // Auto-select first workspace if no valid selection.
  useEffect(() => {
    if (!workspaces?.length) return;
    const valid = currentId && workspaces.some((w) => w.id === currentId);
    if (!valid) {
      const first = workspaces[0].id;
      setCurrentWorkspaceId(first);
      setCurrentIdState(first);
    }
  }, [workspaces, currentId]);

  const workspace = useMemo(
    () => workspaces?.find((w) => w.id === currentId) ?? workspaces?.[0] ?? null,
    [workspaces, currentId]
  );

  const select = (id: string) => {
    setCurrentWorkspaceId(id);
    setCurrentIdState(id);
  };

  return { workspace, workspaceId: workspace?.id ?? null, select, key: CURRENT_WORKSPACE_KEY };
}

/** Resolve the signed-in user's role within a workspace. */
export function useWorkspaceRole(
  workspace: TeamWorkspace | null | undefined,
  members: TeamMember[] | undefined,
  userId: string | undefined
): TeamRole | null {
  if (!workspace || !userId) return null;
  if (workspace.owner_user_id === userId) return "owner";
  const m = members?.find((x) => x.user_id === userId);
  return (m?.role as TeamRole) ?? null;
}
