import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { CheckCircle2 } from "lucide-react";

const BillingSuccess = () => {
  const navigate = useNavigate();
  const sub = useSubscription();

  // Webhook may take a moment to land — poll a few times
  useEffect(() => {
    if (sub.active) return;
    const interval = window.setInterval(() => {
      sub.refresh();
    }, 2500);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 30000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.active]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Welcome — Media AI</title>
      </Helmet>
      <Header />
      <main className="max-w-xl mx-auto px-6 py-24 text-center">
        <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-medium mb-3">You're in.</h1>
        <p className="text-muted-foreground mb-8">
          {sub.active
            ? "Your subscription is active. Jump into the database to start finding contacts."
            : "Payment received. We're activating your subscription — this usually takes a few seconds."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate("/dashboard")} disabled={!sub.active}>
            {sub.active ? "Open dashboard" : "Activating…"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/account")}>
            Account
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BillingSuccess;
