import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  role: "owner" | "admin" | "member";
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
