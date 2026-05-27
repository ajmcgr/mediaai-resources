// Frontend permission helpers for team workspace roles.
// Policy: owner/admin = full management + monetized actions; member = view/use only.

export type TeamRole = "owner" | "admin" | "member";

const ADMINISH: TeamRole[] = ["owner", "admin"];

export function canManageWorkspace(role: TeamRole | null | undefined) {
  return role === "owner";
}
export function canInvite(role: TeamRole | null | undefined) {
  return !!role && ADMINISH.includes(role);
}
export function canManageMembers(role: TeamRole | null | undefined) {
  return !!role && ADMINISH.includes(role);
}
// Monetized actions allowed for everyone in the workspace; gate higher if needed.
export function canExport(role: TeamRole | null | undefined) {
  return !!role;
}
export function canRevealContact(role: TeamRole | null | undefined) {
  return !!role;
}
