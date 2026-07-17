import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Bell, Database, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import logoMedia from "@/assets/brand/logo-media-blue.png";
import {
  useTeamWorkspaces,
  useCreateWorkspace,
  useTeamMembers,
  useTeamInvites,
  useInviteMember,
  useRevokeInvite,
  useCurrentWorkspace,
  useWorkspaceRole,
} from "@/hooks/useTeams";
import { canInvite, canManageWorkspace } from "@/lib/teamPermissions";
import { getWorkspaceSeatUsage, canAddSeat } from "@/lib/teamBilling";
import { logWorkspaceEvent } from "@/lib/audit";

const Team = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const { data: workspaces, isLoading: wsLoading } = useTeamWorkspaces(user?.id);
  const { workspace, workspaceId, select } = useCurrentWorkspace(workspaces);

  const createWs = useCreateWorkspace(user?.id);
  const { data: members, isLoading: membersLoading } = useTeamMembers(workspaceId ?? undefined);
  const { data: invites, isLoading: invitesLoading } = useTeamInvites(workspaceId ?? undefined);
  const inviteMember = useInviteMember(workspaceId ?? undefined);
  const revokeInvite = useRevokeInvite(workspaceId ?? undefined);

  const role = useWorkspaceRole(workspace, members, user?.id);
  const seats = getWorkspaceSeatUsage(workspace, members, invites);

  const [name, setName] = useState("");
  const [seatLimit, setSeatLimit] = useState("5");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Workspace name is required");
    const sl = parseInt(seatLimit, 10);
    if (!Number.isFinite(sl) || sl < 1) return toast.error("Seat limit must be at least 1");
    try {
      const ws = await createWs.mutateAsync({ name: name.trim(), seatLimit: sl });
      select(ws.id);
      await logWorkspaceEvent("workspace_created", ws.id, { name: ws.name, seat_limit: ws.seat_limit });
      toast.success("Workspace created");
      setName("");
    } catch (err) {
      toast.error((err as Error).message || "Could not create workspace");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInvite(role)) return toast.error("You don't have permission to invite");
    if (!inviteEmail.trim()) return toast.error("Email is required");
    if (!canAddSeat(seats)) {
      toast.error("Seat limit reached. Upgrade seats to invite more.");
      return;
    }
    try {
      const inv = await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole, invitedBy: user?.id });
      await logWorkspaceEvent("invite_created", workspaceId, { invite_id: inv.id, email: inv.email, role: inv.role });
      const url = `${window.location.origin}/team/invite/${inv.id}`;
      try { await navigator.clipboard.writeText(url); } catch { /* clipboard optional */ }
      toast.success("Invite created — link copied to clipboard");
      setInviteEmail("");
    } catch (err) {
      toast.error((err as Error).message || "Could not invite member");
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await revokeInvite.mutateAsync(inviteId);
      await logWorkspaceEvent("invite_revoked", workspaceId, { invite_id: inviteId });
      toast.success("Invite revoked");
    } catch (err) {
      toast.error((err as Error).message || "Could not revoke invite");
    }
  };

  const pendingInvites = (invites ?? []).filter((i) => i.status === "pending");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Team workspace — Media AI</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 flex-shrink-0">
        <NavLink to="/database" className="flex items-center">
          <img src={logoMedia} alt="Media AI" className="h-5" />
        </NavLink>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/search")}>
            <MessageSquare className="h-3.5 w-3.5" />Search
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/database")}>
            <Database className="h-3.5 w-3.5" />Database
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/monitor")}>
            <Bell className="h-3.5 w-3.5" />Monitor
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="ml-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" aria-label="Account menu">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="text-xs text-muted-foreground">Signed in as</div>
                <div className="text-sm truncate">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/account")}>Account & billing</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/team")}>Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
            <h1 className="text-3xl font-medium" style={{ fontFamily: "var(--font-heading)" }}>
              Team workspace
            </h1>
            {workspaces && workspaces.length > 1 && workspace && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Workspace</Label>
                <Select value={workspace.id} onValueChange={select}>
                  <SelectTrigger className="h-9 w-[220px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {workspaces.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {wsLoading ? (
            <div className="py-12 flex justify-center"><Spinner /></div>
          ) : !workspace ? (
            <section className="rounded-2xl border border-border bg-white p-6 mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Create workspace</h2>
              <p className="text-sm text-muted-foreground mb-4">
                You're not in any team workspace yet. Create one to invite teammates.
              </p>
              <form onSubmit={handleCreate} className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Label htmlFor="ws-name">Workspace name</Label>
                  <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ws-seats">Seat limit</Label>
                  <Input id="ws-seats" type="number" min={1} value={seatLimit} onChange={(e) => setSeatLimit(e.target.value)} required />
                </div>
                <Button type="submit" disabled={createWs.isPending}>
                  {createWs.isPending ? "Creating…" : "Create workspace"}
                </Button>
              </form>
            </section>
          ) : (
            <>
              <section className="rounded-2xl border border-border bg-white p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-muted-foreground">Seats</h2>
                  <div className="text-sm">
                    <span className="font-medium">{seats.total}</span>
                    <span className="text-muted-foreground"> / {seats.limit} used</span>
                    {seats.full && (
                      <span className="ml-2 text-xs text-destructive">Limit reached</span>
                    )}
                  </div>
                </div>
                {seats.full && canManageWorkspace(role) && (
                  <Button variant="outline" size="sm" onClick={() => navigate("/account")}>
                    Upgrade seats
                  </Button>
                )}
              </section>

              <section className="rounded-2xl border border-border bg-white p-6 mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-4">Members</h2>
                {membersLoading ? (
                  <div className="py-4 flex justify-center"><Spinner /></div>
                ) : !members?.length ? (
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {members.map((m) => (
                      <li key={m.id} className="flex justify-between items-center py-2 gap-3">
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          {m.user_id === user?.id ? `${user.email} (you)` : m.user_id}
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            joined {new Date(m.created_at).toLocaleDateString()}
                          </span>
                          <span className="font-medium capitalize">{m.role}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {canInvite(role) && (
                <section className="rounded-2xl border border-border bg-white p-6 mb-6">
                  <h2 className="text-sm font-medium text-muted-foreground mb-4">Invite teammate</h2>
                  <form onSubmit={handleInvite} className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[200px] space-y-2">
                      <Label htmlFor="inv-email">Email</Label>
                      <Input id="inv-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inv-role">Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                        <SelectTrigger id="inv-role" className="w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={inviteMember.isPending || seats.full}>
                      {inviteMember.isPending ? "Inviting…" : "Send invite"}
                    </Button>
                  </form>
                  {seats.full && (
                    <p className="text-xs text-destructive mt-3">
                      Seat limit reached. <button type="button" className="underline" onClick={() => navigate("/account")}>Upgrade seats</button> to invite more.
                    </p>
                  )}
                </section>
              )}

              <section className="rounded-2xl border border-border bg-white p-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-4">Pending invites</h2>
                {invitesLoading ? (
                  <div className="py-4 flex justify-center"><Spinner /></div>
                ) : !pendingInvites.length ? (
                  <p className="text-sm text-muted-foreground">No pending invites.</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {pendingInvites.map((i) => (
                      <li key={i.id} className="flex justify-between items-center py-2 gap-3">
                        <span className="truncate">{i.email}</span>
                        <span className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground capitalize">
                            {i.role} · {new Date(i.created_at).toLocaleDateString()}
                          </span>
                          {canInvite(role) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRevoke(i.id)}
                              disabled={revokeInvite.isPending}
                              title="Revoke invite"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Team;
