// Seat usage + billing-sync helpers. Stripe seat integration goes here later.
import type { TeamInvite, TeamMember, TeamWorkspace } from "@/hooks/useTeams";

export type SeatUsage = {
  used: number;       // active members
  pending: number;    // pending invites
  total: number;      // used + pending
  limit: number;
  remaining: number;
  full: boolean;
};

export function getWorkspaceSeatUsage(
  workspace: TeamWorkspace | null | undefined,
  members: TeamMember[] | undefined,
  invites: TeamInvite[] | undefined
): SeatUsage {
  const limit = workspace?.seat_limit ?? 0;
  const used = members?.length ?? 0;
  const pending = (invites ?? []).filter((i) => i.status === "pending").length;
  const total = used + pending;
  const remaining = Math.max(0, limit - total);
  return { used, pending, total, limit, remaining, full: total >= limit };
}

export function canAddSeat(usage: SeatUsage) {
  return !usage.full;
}
