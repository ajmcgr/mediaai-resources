import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionState {
  loading: boolean;
  active: boolean;
  planIdentifier: string | null;
  periodEnd: string | null;
  stripeCustomerId: string | null;
  refresh: () => Promise<void>;
}

export const useSubscription = (): SubscriptionState => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [planIdentifier, setPlanIdentifier] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

  const load = async () => {
    if (!user) {
      setActive(false);
      setPlanIdentifier(null);
      setPeriodEnd(null);
      setStripeCustomerId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("sub_active, plan_identifier, sub_period_end, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    setActive(Boolean(data?.sub_active));
    setPlanIdentifier(data?.plan_identifier ?? null);
    setPeriodEnd(data?.sub_period_end ?? null);
    setStripeCustomerId(data?.stripe_customer_id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  return { loading, active, planIdentifier, periodEnd, stripeCustomerId, refresh: load };
};
