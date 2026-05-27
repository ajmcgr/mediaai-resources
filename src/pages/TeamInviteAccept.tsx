import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useAcceptInvite } from "@/hooks/useTeams";
import { logWorkspaceEvent } from "@/lib/audit";

type InviteRow = {
  id: string;
  workspace_id: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "revoked";
  created_at: string;
};

const TeamInviteAccept = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const accept = useAcceptInvite();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteRow | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { setError("Invalid invite link."); setLoading(false); return; }
    if (!user) { setLoading(false); return; } // login prompt below

    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("team_workspace_invites")
        .select("*")
        .eq("id", token)
        .maybeSingle();
      if (error || !data) {
        setError("This invite link is invalid or no longer available.");
        setLoading(false);
        return;
      }
      const row = data as InviteRow;
      if ((user.email ?? "").toLowerCase() !== row.email.toLowerCase()) {
        setError(`This invite was sent to ${row.email}. Sign in with that email to accept.`);
        setInvite(row);
        setLoading(false);
        return;
      }
      if (row.status !== "pending") {
        setError(`This invite is ${row.status}.`);
        setInvite(row);
        setLoading(false);
        return;
      }
      setInvite(row);
      const { data: ws } = await (supabase as any)
        .from("team_workspaces")
        .select("name")
        .eq("id", row.workspace_id)
        .maybeSingle();
      setWorkspaceName(ws?.name ?? null);
      setLoading(false);
    })();
  }, [token, user, authLoading]);

  const handleAccept = async () => {
    if (!invite) return;
    try {
      await accept.mutateAsync(invite.id);
      await logWorkspaceEvent("invite_accepted", invite.workspace_id, {
        invite_id: invite.id,
        role: invite.role,
      });
      toast.success("You've joined the workspace");
      navigate("/team", { replace: true });
    } catch (e: any) {
      const msg = (e?.message ?? "").replace(/^invite_/, "");
      toast.error(msg || "Could not accept invite");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Helmet><title>Team invite — Media AI</title><meta name="robots" content="noindex" /></Helmet>
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8">
        <h1 className="text-2xl font-medium mb-4" style={{ fontFamily: "var(--font-heading)" }}>
          Team invitation
        </h1>

        {authLoading || loading ? (
          <div className="py-8 flex justify-center"><Spinner /></div>
        ) : !user ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in or create an account to accept this team invitation.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/login?next=${encodeURIComponent(`/team/invite/${token}`)}`)}>
                Sign in
              </Button>
              <Button variant="outline" onClick={() => navigate(`/signup?next=${encodeURIComponent(`/team/invite/${token}`)}`)}>
                Create account
              </Button>
            </div>
          </>
        ) : error ? (
          <>
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => navigate("/team")}>Go to team</Button>
          </>
        ) : invite ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              You've been invited to join{" "}
              <span className="font-medium text-foreground">{workspaceName ?? "a workspace"}</span>{" "}
              as <span className="font-medium text-foreground">{invite.role}</span>.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleAccept} disabled={accept.isPending}>
                {accept.isPending ? "Joining…" : "Accept invitation"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>Not now</Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default TeamInviteAccept;
