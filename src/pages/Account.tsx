import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useChatUsage } from "@/hooks/useChatUsage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { openBillingPortal, startTopup, TOPUP_PACKS, type TopupPack } from "@/lib/billing";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Database, MessageSquare, RefreshCw } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InboxSheet } from "@/components/dashboard/InboxSheet";
import { ListsSheet } from "@/components/dashboard/ListsSheet";
import logoMedia from "@/assets/brand/logo-media-blue.png";

const TOKENS_PER_MESSAGE = 400;
const formatMessages = (tokens: number) =>
  new Intl.NumberFormat().format(Math.max(0, Math.round(tokens / TOKENS_PER_MESSAGE)));


const PLAN_LABELS: Record<string, string> = {
  journalist: "Journalist Database",
  creator: "Creators Database",
  both: "Full Database",
};

const Account = () => {
  const { user, signOut } = useAuth();
  const sub = useSubscription();
  const { usage, loading: usageLoading, error: usageError, refresh: refreshUsage } = useChatUsage();
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const [topupLoading, setTopupLoading] = useState<TopupPack | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) {
      toast.error(error.message || "Could not update password");
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  };

  const handleTopup = async (pack: TopupPack) => {
    try {
      setTopupLoading(pack);
      await startTopup(pack);
    } catch (e) {
      toast.error((e as Error).message || "Could not start checkout");
      setTopupLoading(null);
    }
  };

  const handleManage = async () => {
    try {
      setOpening(true);
      await openBillingPortal();
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("no_customer")) {
        toast.message("No Stripe customer yet — choose a plan to get started.");
        navigate("/pricing");
      } else {
        toast.error(msg || "Could not open billing portal");
      }
      setOpening(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Account — Media AI</title>
      </Helmet>

      <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 flex-shrink-0">
        <NavLink to="/database" className="flex items-center">
          <img src={logoMedia} alt="Media AI" className="h-5" />
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
          <InboxSheet />
          <ListsSheet />
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
              <DropdownMenuItem onSelect={() => navigate("/pricing")}>Plans</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-medium mb-8">Account</h1>

        <section className="rounded-2xl border border-border bg-white p-6 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Profile
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user?.email}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Subscription
          </h2>

          {sub.loading ? (
            <div className="py-2"><Spinner /></div>
          ) : sub.active ? (
            <>
              <dl className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd className="font-medium">
                    {sub.planIdentifier
                      ? (PLAN_LABELS[sub.planIdentifier] ?? sub.planIdentifier)
                      : "Active"}
                  </dd>
                </div>
                {sub.periodEnd && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Renews</dt>
                    <dd className="font-medium">
                      {new Date(sub.periodEnd).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
              <Button onClick={handleManage} disabled={opening}>
                {opening ? "Opening…" : "Manage billing"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                You don't have an active subscription.
              </p>
              <Button onClick={() => navigate("/pricing")}>View plans</Button>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 mb-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Chat credits
            </h2>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2" onClick={() => refreshUsage(true)} disabled={usageLoading}>
              <RefreshCw className={`h-3.5 w-3.5 ${usageLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          {usageLoading ? (
            <div className="py-2"><Spinner /></div>
          ) : usageError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Chat credit balance could not load. {usageError}
            </div>
          ) : (
            <>
              <dl className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Monthly messages remaining</dt>
                  <dd className="font-medium">
                    ~{formatMessages(Math.max(0, (usage?.allowance ?? 0) - (usage?.used ?? 0)))} / ~{formatMessages(usage?.allowance ?? 0)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Top-up messages</dt>
                  <dd className="font-medium">~{formatMessages(usage?.credits ?? 0)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-muted-foreground">Total available</dt>
                  <dd className="font-medium">
                    ~{formatMessages(Math.max(0, (usage?.allowance ?? 0) - (usage?.used ?? 0)) + (usage?.credits ?? 0))}
                  </dd>
                </div>
              </dl>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.entries(TOPUP_PACKS) as [TopupPack, typeof TOPUP_PACKS[TopupPack]][]).map(([key, pack]) => (
                  <Button
                    key={key}
                    variant="outline"
                    onClick={() => handleTopup(key)}
                    disabled={topupLoading !== null}
                  >
                    {topupLoading === key ? "Opening…" : `~${formatMessages(pack.tokens)} messages — $${pack.priceUsd}`}
                  </Button>
                ))}
              </div>
            </>
          )}
        </section>


        <section className="rounded-2xl border border-border bg-white p-6 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Change password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={pwSaving}>
              {pwSaving ? "Updating…" : "Update password"}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Session
          </h2>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </section>
        </div>
      </main>
    </div>
  );
};

export default Account;
