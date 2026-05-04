// Stripe Checkout — Starter & Growth subscriptions only.
// Body: { user_id, user_email, plan: "starter"|"growth", interval: "monthly"|"yearly" }
// v4 — Starter & Growth only, no plan_identifier required

import Stripe from "https://esm.sh/stripe@17.5.0?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRICE_MAP: Record<string, Record<string, string>> = {
  starter: {
    monthly: "price_1TTEvQPui4jUsxXGlj2mWXOA",
    yearly: "price_1TTEvpPui4jUsxXGBdZ6P2AQ",
  },
  growth: {
    monthly: "price_1TTEw2Pui4jUsxXGzpUsxVNX",
    yearly: "price_1TTEwJPui4jUsxXGQ54RExLH",
  },
};

const SITE_URL = "https://trymedia.ai";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) return json({ error: "missing_stripe_key" }, 500);

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const plan = String(body.plan || "").toLowerCase().trim();
    const interval = String(body.interval || "monthly").toLowerCase().trim();

    console.log("plan:", plan);
    console.log("interval:", interval);

    if (!["starter", "growth"].includes(plan)) {
      return json({ error: "invalid_plan", receivedPlan: plan }, 400);
    }
    if (!["monthly", "yearly"].includes(interval)) {
      return json({ error: "invalid_interval", receivedInterval: interval }, 400);
    }

    const user_id = String(body.user_id ?? "").trim();
    const user_email = String(body.user_email ?? "").trim();
    if (!user_id || !user_email) return json({ error: "missing_user" }, 400);

    const priceId = PRICE_MAP[plan][interval];
    console.log("priceId:", priceId);

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user_email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${SITE_URL}/success`,
      cancel_url: `${SITE_URL}/pricing`,
      metadata: { user_id, plan, interval },
      subscription_data: {
        metadata: { user_id, plan, interval },
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
