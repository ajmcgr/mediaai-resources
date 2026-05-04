// Stripe Checkout session creator (BYOK).
// Body: { user_id: string, user_email: string, plan_identifier?: string, plan?: string, interval?: "monthly"|"yearly" }

import Stripe from "https://esm.sh/stripe@17.5.0?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type BillingInterval = "monthly" | "yearly";

const MEDIA_PRO_PRICES: Record<BillingInterval, string> = {
  monthly: "price_1QodoVPui4jUsxXGmQmhv1jI",
  yearly: "price_1QodoVPui4jUsxXGl30lFTtf",
};

const PRICE_IDS: Record<string, Record<BillingInterval, string>> = {
  journalist: {
    monthly: "price_1QodmaPui4jUsxXGqb12D7d6",
    yearly: "price_1QodmaPui4jUsxXGyRpOLqpb",
  },
  creator: {
    monthly: "price_1QodnmPui4jUsxXGiMlK5EGW",
    yearly: "price_1QodnmPui4jUsxXG2pycLHdT",
  },
  both: MEDIA_PRO_PRICES,
  "media-pro": MEDIA_PRO_PRICES,
  media_pro: MEDIA_PRO_PRICES,
  pro: MEDIA_PRO_PRICES,
  starter: MEDIA_PRO_PRICES,
  growth: MEDIA_PRO_PRICES,
  monthly: MEDIA_PRO_PRICES,
  yearly: MEDIA_PRO_PRICES,
  basic: MEDIA_PRO_PRICES,
  premium: MEDIA_PRO_PRICES,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SITE_URL = Deno.env.get("SITE_URL") ?? "https://trymedia.ai";

    if (!STRIPE_SECRET_KEY) {
      console.error("create-checkout missing STRIPE_SECRET_KEY");
      return json({ error: "Server configuration error: missing Stripe credentials." }, 500);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch (error) {
      console.error("create-checkout invalid JSON body", error);
      return json({ error: "Invalid JSON body." }, 400);
    }

    console.log("create-checkout raw request body", body);

    const user_id = typeof body.user_id === "string" ? body.user_id.trim() : "";
    const user_email = typeof body.user_email === "string" ? body.user_email.trim() : "";
    const plan = (body.plan_identifier ?? body.plan ?? "") as string;
    const normalizedPlan = String(plan || "").toLowerCase().trim();
    const rawInterval = String(body.interval ?? "monthly").toLowerCase().trim();
    const interval: BillingInterval = rawInterval === "yearly" ? "yearly" : "monthly";

    console.log("create-checkout plan mapping", { plan, normalizedPlan, interval, user_id, user_email });

    if (!user_id || !user_email) {
      console.error("create-checkout missing authenticated user", body);
      return json({ error: "Missing authenticated user" }, 400);
    }
    const priceId = PRICE_IDS[normalizedPlan]?.[interval] || MEDIA_PRO_PRICES[interval];
    if (!priceId) {
      console.error("create-checkout invalid plan", { receivedPlan: plan, normalizedPlan, allowed: Object.keys(PRICE_IDS) });
      return json({ error: "invalid_plan", receivedPlan: plan, normalizedPlan }, 400);
    }

    console.log("create-checkout selected price", { plan, normalizedPlan, interval, priceId });
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user_email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 30,
        metadata: { supabase_user_id: user_id, plan_identifier: normalizedPlan, billing_interval: interval },
      },
      metadata: { supabase_user_id: user_id, plan_identifier: normalizedPlan, billing_interval: interval },
      success_url: `${SITE_URL}/success`,
      cancel_url: `${SITE_URL}/pricing`,
    });

    return json({ url: session.url }, 200);
  } catch (error) {
    console.error("create-checkout Stripe error", error);
    return json({ error: (error as Error).message ?? "Failed to create checkout session." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
