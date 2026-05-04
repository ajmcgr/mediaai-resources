import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { startCheckout, startTopup, TOPUP_PACKS, type TopupPack } from "@/lib/billing";
import { toast } from "sonner";

type PlanId = "starter" | "growth" | "enterprise";
type Interval = "monthly" | "yearly";

interface Tier {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number | null;
  yearly: number | null;
  features: string[];
  highlight?: boolean;
  badge?: string;
  cta: string;
}

const TIERS: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "AI chat. No database access.",
    monthly: 29,
    yearly: 290,
    cta: "Start Free Trial",
    features: [
      "Verified journalist and creator contact emails",
      "AI chat assistant",
      "200,000 chat tokens / month",
      "Top-up tokens any time",
      "Email support",
      "1-month free trial",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "AI chat + full journalist & creator database.",
    monthly: 99,
    yearly: 990,
    highlight: true,
    badge: "Most popular",
    cta: "Start Free Trial",
    features: [
      "Verified journalist and creator contact emails",
      "Everything in Starter",
      "1,000,000 chat tokens / month",
      "100% database access — no row limits",
      "Sort, filter, save views, export",
      "Share contacts via link, email, or CSV",
      "1-month free trial",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom API, volume tokens, dedicated support.",
    monthly: null,
    yearly: null,
    cta: "Contact us",
    features: [
      "Verified journalist and creator contact emails",
      "Everything in Growth",
      "Custom API access",
      "Volume token pricing",
      "SSO + dedicated support",
      "Custom contracts",
    ],
  },
];

const Pricing = () => {
  const [interval, setInterval] = useState<Interval>("monthly");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [pendingPack, setPendingPack] = useState<TopupPack | null>(null);

  const handleSubscribe = async (plan: PlanId) => {
    if (plan === "enterprise") {
      navigate("/request-demo");
      return;
    }
    const next = encodeURIComponent(`/pricing?plan=${plan}`);
    if (!user) {
      navigate(`/login?next=${next}`);
      return;
    }
    try {
      setPendingPlan(plan);
      await startCheckout(plan, interval);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "NOT_AUTHENTICATED") {
        toast.error("Please sign in to continue");
        navigate(`/login?next=${next}`);
      } else {
        toast.error(msg ?? "Could not start checkout");
      }
      setPendingPlan(null);
    }
  };

  const handleTopup = async (pack: TopupPack) => {
    if (!user) {
      navigate("/login?next=" + encodeURIComponent("/pricing"));
      return;
    }
    try {
      setPendingPack(pack);
      await startTopup(pack);
    } catch (e) {
      toast.error((e as Error).message ?? "Could not start checkout");
      setPendingPack(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Pricing — Media AI</title>
        <meta
          name="description"
          content="Simple plans for the Media AI chat assistant and journalist/creator database. Monthly or yearly. 1-month free trial."
        />
        <link rel="canonical" href="https://resources.trymedia.ai/pricing" />
      </Helmet>

      <Header />

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-4">
            Flexible pricing plans to suit your needs
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose between monthly and yearly subscriptions. Cancel any time.
          </p>

          <div className="inline-flex items-center mt-8 p-1 rounded-full border border-border bg-secondary">
            {(["monthly", "yearly"] as Interval[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setInterval(opt)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  interval === opt
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt === "monthly" ? "Monthly" : "Yearly"}
                {opt === "yearly" && (
                  <span className="ml-2 text-xs text-primary">Save ~17%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const price = interval === "monthly" ? tier.monthly : tier.yearly;
            const period = interval === "monthly" ? "/mo" : "/yr";
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  tier.highlight
                    ? "bg-foreground text-background border border-foreground"
                    : "bg-white border border-border"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {tier.badge}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-medium mb-1">{tier.name}</h3>
                <p
                  className={`text-sm mb-6 ${
                    tier.highlight ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  {tier.tagline}
                </p>
                <div className="mb-6">
                  {price !== null ? (
                    <>
                      <span className="text-4xl font-medium">${price}</span>
                      <span
                        className={`text-sm ml-1 ${
                          tier.highlight ? "text-background/70" : "text-muted-foreground"
                        }`}
                      >
                        {period}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-medium">Custom</span>
                  )}
                </div>
                <Button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={authLoading || pendingPlan !== null}
                  className={`w-full mb-6 ${
                    tier.highlight ? "bg-white text-foreground hover:bg-white/90" : ""
                  }`}
                  variant={tier.highlight ? "default" : "outline"}
                >
                  {pendingPlan === tier.id
                    ? "Redirecting…"
                    : tier.id === "enterprise"
                      ? tier.cta
                      : user
                        ? tier.cta
                        : "Sign up to start"}
                </Button>
                <ul className="space-y-3 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          tier.highlight ? "text-background/80" : "text-primary"
                        }`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          All prices in USD. Subscriptions renew automatically until canceled.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
