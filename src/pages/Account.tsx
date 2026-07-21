import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useChatUsage } from "@/hooks/useChatUsage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { openBillingPortal, startTopup, TOPUP_PACKS, type TopupPack } from "@/lib/billing";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { InboxSheet } from "@/components/dashboard/InboxSheet";
import { useTeamWorkspaces, useTeamMembers, useTeamInvites, useCurrentWorkspace } from "@/hooks/useTeams";
import { getWorkspaceSeatUsage } from "@/lib/teamBilling";
import { startProductTour } from "@/components/ProductTour";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "team" | "integrations" | "notifications" | "account" | "billing";

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "team", label: "Team" },
  { id: "integrations", label: "Integrations" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
  { id: "billing", label: "Billing" },
];

const TOKENS_PER_MESSAGE = 400;
const formatMessages = (tokens: number) =>
  new Intl.NumberFormat().format(Math.max(0, Math.round(tokens / TOKENS_PER_MESSAGE)));

const PLAN_LABELS: Record<string, string> = {
  journalist: "Journalist Database",
  creator: "Creators Database",
  both: "Full Database",
};

const getInitialTab = (): SettingsTab => {
  if (typeof window === "undefined") return "profile";
  return window.location.hash === "#credits" ? "billing" : "profile";
};

const SettingsCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <section {...props} className={cn("rounded-2xl border border-border bg-white p-6 shadow-sm md:p-7", className)}>
    {children}
  </section>
);

const AccountTeamSection = ({ onOpen }: { onOpen: () => void }) => {
  const { user } = useAuth();
  const { data: workspaces, isLoading } = useTeamWorkspaces(user?.id);
  const { workspace } = useCurrentWorkspace(workspaces);
  const { data: members } = useTeamMembers(workspace?.id);
  const { data: invites } = useTeamInvites(workspace?.id);
  const seats = getWorkspaceSeatUsage(workspace, members, invites);

  return (
    <SettingsCard>
      <h2 className="text-lg font-semibold text-slate-950">Team</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage shared access for your Media AI workspace.
      </p>
      {isLoading ? (
        <div className="py-8"><Spinner /></div>
      ) : !workspace ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-slate-50 p-5">
          <p className="text-sm text-muted-foreground">
            You don't have a team workspace yet.
          </p>
          <Button className="mt-4" onClick={onOpen}>Create team workspace</Button>
        </div>
      ) : (
        <>
          <dl className="mt-8 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-6">
              <dt className="text-muted-foreground">Workspace</dt>
              <dd className="font-medium text-slate-950">{workspace.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-6">
              <dt className="text-muted-foreground">Seats used</dt>
              <dd className="font-medium text-slate-950">
                {seats.used} active + {seats.pending} pending / {seats.limit}
              </dd>
            </div>
          </dl>
          <Button className="mt-8" onClick={onOpen}>Manage team</Button>
        </>
      )}
    </SettingsCard>
  );
};

const Account = () => {
  const { user, signOut } = useAuth();
  const sub = useSubscription();
  const { usage, loading: usageLoading, error: usageError, refresh: refreshUsage } = useChatUsage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>(getInitialTab);
  const [opening, setOpening] = useState(false);
  const [topupLoading, setTopupLoading] = useState<TopupPack | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#credits") setActiveTab("billing");
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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

  return (
    <div className="flex min-h-screen bg-[#f7f8fb]">
      <Helmet>
        <title>Settings — Media AI</title>
      </Helmet>

      <AppSidebar active="settings" />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="md:hidden">
          <AppHeader />
        </div>

        <main className="flex-1 overflow-auto px-5 py-10 md:px-10 md:py-16">
          <div className="mx-auto w-full max-w-[850px]">
            <h1 className="text-4xl font-medium tracking-tight text-slate-950 md:text-5xl">Settings</h1>

            <div className="mt-8 flex overflow-x-auto">
              <div className="inline-flex min-w-max items-center gap-1 rounded-full bg-slate-100 p-1">
                {SETTINGS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-950",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              {activeTab === "profile" && (
                <SettingsCard>
                  <h2 className="text-lg font-semibold text-slate-950">Profile</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Your signed-in Media AI profile.</p>

                  <div className="mt-7 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-slate-100 text-sm font-semibold text-slate-700">
                      {user?.email?.slice(0, 2).toUpperCase() || "AI"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-950">{user?.email}</div>
                      <div className="text-sm text-muted-foreground">Account email</div>
                    </div>
                  </div>

                  <div className="mt-9 border-t border-border pt-7">
                    <h3 className="text-sm font-semibold text-slate-950">Change password</h3>
                    <form onSubmit={handlePasswordChange} className="mt-4 max-w-xl space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          minLength={8}
                          placeholder="Leave blank to keep current"
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
                      <Button type="submit" disabled={pwSaving} className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800">
                        {pwSaving ? "Updating…" : "Save profile"}
                      </Button>
                    </form>
                  </div>
                </SettingsCard>
              )}

              {activeTab === "team" && <AccountTeamSection onOpen={() => navigate("/team")} />}

              {activeTab === "integrations" && (
                <SettingsCard>
                  <h2 className="text-lg font-semibold text-slate-950">Integrations</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Connect your email account so Media AI can support inbox workflows.
                  </p>
                  <div className="mt-8 rounded-xl border border-border p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-slate-950">Email inbox</div>
                        <div className="mt-1 text-sm text-muted-foreground">Gmail and Outlook connections are managed in Inbox.</div>
                      </div>
                      <InboxSheet
                        triggerClassName="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                        triggerChildren="Open inbox settings"
                      />
                    </div>
                  </div>
                </SettingsCard>
              )}

              {activeTab === "notifications" && (
                <SettingsCard>
                  <h2 className="text-lg font-semibold text-slate-950">Notifications</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Product and account notifications are currently sent to your account email.
                  </p>
                  <div className="mt-8 rounded-xl border border-dashed border-border bg-slate-50 p-5 text-sm text-muted-foreground">
                    More granular notification controls will appear here when they are available.
                  </div>
                </SettingsCard>
              )}

              {activeTab === "account" && (
                <SettingsCard>
                  <h2 className="text-lg font-semibold text-slate-950">Account</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Manage account-level actions and onboarding.</p>

                  <div className="mt-8 space-y-6">
                    <div className="flex flex-col gap-4 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-slate-950">Product tour</div>
                        <p className="mt-1 text-sm text-muted-foreground">Replay the guided walkthrough of Media AI.</p>
                      </div>
                      <Button variant="outline" className="rounded-full" onClick={() => startProductTour()}>
                        Replay tour
                      </Button>
                    </div>
                    <div className="flex flex-col gap-4 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-slate-950">Session</div>
                        <p className="mt-1 text-sm text-muted-foreground">Sign out of this browser.</p>
                      </div>
                      <Button variant="outline" className="rounded-full" onClick={handleSignOut}>
                        Sign out
                      </Button>
                    </div>
                  </div>
                </SettingsCard>
              )}

              {activeTab === "billing" && (
                <SettingsCard id="credits" className="scroll-mt-8">
                  <h2 className="text-lg font-semibold text-slate-950">Billing</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Manage subscription and search credit usage.</p>

                  <div className="mt-8 border-b border-border pb-8">
                    <h3 className="text-sm font-semibold text-slate-950">Subscription</h3>
                    {sub.loading ? (
                      <div className="py-8"><Spinner /></div>
                    ) : sub.active ? (
                      <>
                        <dl className="mt-5 space-y-4 text-sm">
                          <div className="flex items-center justify-between gap-6">
                            <dt className="text-muted-foreground">Plan</dt>
                            <dd className="font-medium text-slate-950">
                              {sub.planIdentifier
                                ? (PLAN_LABELS[sub.planIdentifier] ?? sub.planIdentifier)
                                : "Active"}
                            </dd>
                          </div>
                          {sub.periodEnd && (
                            <div className="flex items-center justify-between gap-6">
                              <dt className="text-muted-foreground">Renews</dt>
                              <dd className="font-medium text-slate-950">
                                {new Date(sub.periodEnd).toLocaleDateString()}
                              </dd>
                            </div>
                          )}
                        </dl>
                        <Button className="mt-7 rounded-full px-6" onClick={handleManage} disabled={opening}>
                          {opening ? "Opening…" : "Manage billing"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="mt-4 text-sm text-muted-foreground">You don't have an active subscription.</p>
                        <Button className="mt-5 rounded-full px-6" onClick={() => navigate("/pricing")}>View plans</Button>
                      </>
                    )}
                  </div>

                  <div className="pt-8">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-950">Search credits</h3>
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2" onClick={() => refreshUsage(true)} disabled={usageLoading}>
                        <RefreshCw className={`h-3.5 w-3.5 ${usageLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                    {usageLoading ? (
                      <div className="py-8"><Spinner /></div>
                    ) : usageError ? (
                      <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        Search credit balance could not load. {usageError}
                      </div>
                    ) : (
                      <>
                        <dl className="mt-5 space-y-4 text-sm">
                          <div className="flex items-center justify-between gap-6">
                            <dt className="text-muted-foreground">Monthly messages remaining</dt>
                            <dd className="font-medium text-slate-950">
                              ~{formatMessages(Math.max(0, (usage?.allowance ?? 0) - (usage?.used ?? 0)))} / ~{formatMessages(usage?.allowance ?? 0)}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <dt className="text-muted-foreground">Top-up messages</dt>
                            <dd className="font-medium text-slate-950">~{formatMessages(usage?.credits ?? 0)}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-6 border-t border-border pt-4">
                            <dt className="text-muted-foreground">Total available</dt>
                            <dd className="font-medium text-slate-950">
                              ~{formatMessages(Math.max(0, (usage?.allowance ?? 0) - (usage?.used ?? 0)) + (usage?.credits ?? 0))}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-7 grid gap-3 sm:grid-cols-3">
                          {(Object.entries(TOPUP_PACKS) as [TopupPack, typeof TOPUP_PACKS[TopupPack]][]).map(([key, pack]) => (
                            <Button
                              key={key}
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => handleTopup(key)}
                              disabled={topupLoading !== null}
                            >
                              {topupLoading === key ? "Opening…" : `~${formatMessages(pack.tokens)} messages — $${pack.priceUsd}`}
                            </Button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </SettingsCard>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Account;
