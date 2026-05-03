// Stripe Checkout session creator (BYOK).
// Auth: requires the caller's Supabase JWT (Authorization: Bearer ...).
// Body: { plan_identifier: string, success_url?: string, cancel_url?: string }

import Stripe from "https://esm.sh/stripe@17.5.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type PlanIdentifier = "journalist" | "creator" | "both";
type BillingInterval = "monthly" | "yearly";

const PLAN_CHECKOUT: Record<PlanIdentifier, { name: string; monthly: number; yearly: number }> = {
  journalist: { name: "Journalist Database", monthly: 9900, yearly: 99900 },
  creator: { name: "Creators Database", monthly: 9900, yearly: 99900 },
  both: { name: "Full Database", monthly: 14900, yearly: 149900 },
};

const LIVE_PRICE_IDS: Record<PlanIdentifier, Record<BillingInterval, string>> = {
  journalist: {
    monthly: "price_1QodmaPui4jUsxXGqb12D7d6",
    yearly: "price_1QodmaPui4jUsxXGyRpOLqpb",
  },
  creator: {
    monthly: "price_1QodnmPui4jUsxXGiMlK5EGW",
    yearly: "price_1QodnmPui4jUsxXG2pycLHdT",
  },
  both: {
    monthly: "price_1QodoVPui4jUsxXGmQmhv1jI",
    yearly: "price_1QodoVPui4jUsxXGl30lFTtf",
  },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-11-20.acacia",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing auth" }, 401);

    // Verify the user from the JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user?.email) return json({ error: "unauthorized" }, 401);

    const { plan_identifier, interval, success_url, cancel_url } = await req.json();
    if (!isPlanIdentifier(plan_identifier)) return json({ error: "valid plan_identifier required" }, 400);
    const billingInterval: BillingInterval = interval === "yearly" ? "yearly" : "monthly";

    // Service-role client to read plans + profile.stripe_customer_id
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: plan, error: planErr } = await admin
      .from("plans")
      .select("identifier, name, monthly_price_id, testmode_monthly_price_id, testmode_yearly_price_id")
      .eq("identifier", plan_identifier)
      .maybeSingle();

    if (planErr || !plan) {
      console.error("plan lookup error", planErr);
      return json({ error: "plan not found" }, 400);
    }

    // Detect mode from the configured Stripe key
    const isTestMode = (Deno.env.get("STRIPE_SECRET_KEY") ?? "").startsWith("sk_test") ||
      (Deno.env.get("STRIPE_SECRET_KEY") ?? "").startsWith("rk_test");

    let priceId: string | null = null;
    if (isTestMode) {
      priceId = billingInterval === "yearly"
        ? (plan.testmode_yearly_price_id ?? plan.testmode_monthly_price_id)
        : plan.testmode_monthly_price_id;
    } else {
      priceId = LIVE_PRICE_IDS[plan_identifier][billingInterval] ?? plan.monthly_price_id;
    }

    const checkoutConfig = PLAN_CHECKOUT[plan_identifier];
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: checkoutConfig[billingInterval],
          recurring: { interval: billingInterval === "yearly" ? "year" : "month" },
          product_data: {
            name: plan.name ?? checkoutConfig.name,
            metadata: { plan_identifier },
          },
        },
      }];

    // Reuse Stripe customer if profile already has one
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id ?? undefined;
    if (!customerId) {
      // Try to find an existing Stripe customer by email (covers Bubble migrations)
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const created = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        customerId = created.id;
      }
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const origin = req.headers.get("origin") ?? "https://resources.trymedia.ai";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: lineItems,
      allow_promotion_codes: true,
      success_url: success_url ?? `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url ?? `${origin}/pricing?canceled=1`,
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          supabase_user_id: user.id,
          plan_identifier: plan.identifier,
          billing_interval: billingInterval,
        },
      },
      metadata: {
        supabase_user_id: user.id,
        plan_identifier: plan.identifier,
        billing_interval: billingInterval,
      },
    });

    return json({ url: session.url });
  } catch (e) {
    console.error("create-checkout error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isPlanIdentifier(value: unknown): value is PlanIdentifier {
  return value === "journalist" || value === "creator" || value === "both";
}
