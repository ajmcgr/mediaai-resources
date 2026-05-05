import { Helmet } from "react-helmet-async";
import { useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useChatUsage } from "@/hooks/useChatUsage";
import { Button } from "@/components/ui/button";
import { openBillingPortal, startTopup, TOPUP_PACKS, type TopupPack } from "@/lib/billing";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const formatTokens = (n: number) => new Intl.NumberFormat().format(Math.max(0, Math.round(n)));


const PLAN_LABELS: Record<string, string> = {
  journalist: "Journalist Database",
  creator: "Creators Database",
  both: "Full Database",
};

const Account = () => {
  const { user, signOut } = useAuth();
  const sub = useSubscription();
  const { usage, loading: usageLoading } = useChatUsage();
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const [topupLoading, setTopupLoading] = useState<TopupPack | null>(null);

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
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Account — Media AI</title>
      </Helmet>
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-16">
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
                You don't have an active subscription. Choose a plan to access the
                journalist and creator database.
              </p>
              <Button onClick={() => navigate("/pricing")}>View plans</Button>
            </>
          )}
        </section>

        

        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Session
          </h2>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Account;
