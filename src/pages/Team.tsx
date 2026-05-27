import { Helmet } from "react-helmet-async";
import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Bell, Database, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import logoMedia from "@/assets/brand/logo-media-blue.png";
import {
  useTeamWorkspaces,
  useCreateWorkspace,
  useTeamMembers,
  useTeamInvites,
  useInviteMember,
} from "@/hooks/useTeams";

const Team = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const { data: workspaces, isLoading: wsLoading } = useTeamWorkspaces(user?.id);
  const current = useMemo(() => workspaces?.[0], [workspaces]);

  const createWs = useCreateWorkspace(user?.id);
  const { data: members } = useTeamMembers(current?.id);
  const { data: invites } = useTeamInvites(current?.id);
  const inviteMember = useInviteMember(current?.id);

  const [name, setName] = useState("");
  const [seatLimit, setSeatLimit] = useState("5");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Workspace name is required");
    const seats = parseInt(seatLimit, 10);
    if (!Number.isFinite(seats) || seats < 1) return toast.error("Seat limit must be at least 1");
    try {
      await createWs.mutateAsync({ name: name.trim(), seatLimit: seats });
      toast.success("Workspace created");
      setName("");
    } catch (err) {
      toast.error((err as Error).message || "Could not create workspace");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return toast.error("Email is required");
    try {
      await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole, invitedBy: user?.id });
      toast.success("Invite sent");
      setInviteEmail("");
    } catch (err) {
      toast.error((err as Error).message || "Could not invite member");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Team workspace — Media</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-white">
        <NavLink to="/" className="flex items-center gap-2">
          <img src={logoMedia} alt="Media" className="h-7 w-auto" />
        </NavLink>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/chat")}>
            <MessageSquare className="h-3.5 w-3.5" />Chat
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
          <h1 className="text-3xl font-medium mb-8">Team workspace</h1>

          {wsLoading ? (
            <div className="py-12 flex justify-center"><Spinner /></div>
          ) : !current ? (
            <section className="rounded-2xl border border-border bg-white p-6 mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">Create workspace</h2>
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
                <h2 className="text-sm font-medium text-muted-foreground mb-4">Current workspace</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{current.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Seat limit</dt>
                    <dd className="font-medium">{current.seat_limit}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Members</dt>
                    <dd className="font-medium">{members?.length ?? 0}</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border border-border bg-white p-6 mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-4">Invite teammates</h2>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <select
                      id="invite-role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={inviteMember.isPending}>
                    {inviteMember.isPending ? "Sending…" : "Send invite"}
                  </Button>
                </form>
              </section>

              <section className="rounded-2xl border border-border bg-white p-6 mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-4">Members</h2>
                {!members?.length ? (
                  <p className="text-sm text-muted-foreground">No members yet.</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {members.map((m) => (
                      <li key={m.id} className="flex justify-between py-2">
                        <span className="font-mono text-xs text-muted-foreground truncate">{m.user_id}</span>
                        <span className="font-medium capitalize">{m.role}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-border bg-white p-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-4">Pending invites</h2>
                {!invites?.length ? (
                  <p className="text-sm text-muted-foreground">No invites yet.</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {invites.map((i) => (
                      <li key={i.id} className="flex justify-between py-2">
                        <span className="truncate">{i.email}</span>
                        <span className="text-muted-foreground capitalize">{i.role} · {i.status}</span>
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
