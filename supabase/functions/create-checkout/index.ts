// Stripe Checkout — creates a SUBSCRIPTION session for new plans (starter/growth).
// Uses inline price_data to avoid maintaining Stripe price IDs.
// Body: { user_id, user_email, plan: "starter"|"growth", interval: "monthly"|"yearly" }
// v2 — inline pricing, no plan lookup


import Stripe from "https://esm.sh/stripe@17.5.0?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Interval = "monthly" | "yearly";
type Plan = "starter" | "growth";

// Prices in USD cents. Yearly = ~10x monthly (≈17% discount).
const PLAN_AMOUNTS: Record<Plan, Record<Interval, number>> = {
  starter: { monthly: 2900, yearly: 29000 },
  growth:  { monthly: 9900, yearly: 99000 },
};

const PLAN_NAMES: Record<Plan, string> = {
  starter: "Media AI — Starter",
  growth:  "Media AI — Growth",
};

function normalizePlan(raw: string): Plan {
  const v = String(raw || "").toLowerCase().trim();
  if (v === "growth" || v === "both" || v === "media-pro" || v === "pro") return "growth";
  return "starter";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SITE_URL = Deno.env.get("SITE_URL") ?? "https://trymedia.ai";
    if (!STRIPE_SECRET_KEY) return json({ error: "missing_stripe_key" }, 500);

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    console.log("create-checkout body", body);

    const user_id = String(body.user_id ?? "").trim();
    const user_email = String(body.user_email ?? "").trim();
    const plan = normalizePlan(String(body.plan_identifier ?? body.plan ?? "starter"));
    const interval: Interval = String(body.interval ?? "monthly").toLowerCase() === "yearly"
      ? "yearly" : "monthly";

    if (!user_id || !user_email) return json({ error: "missing_user" }, 400);

    const amount = PLAN_AMOUNTS[plan][interval];
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user_email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amount,
          recurring: { interval: interval === "yearly" ? "year" : "month" },
          product_data: { name: PLAN_NAMES[plan] },
        },
      }],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 30,
        metadata: { supabase_user_id: user_id, plan_identifier: plan, billing_interval: interval },
      },
      metadata: { supabase_user_id: user_id, plan_identifier: plan, billing_interval: interval },
      success_url: `${SITE_URL}/success`,
      cancel_url: `${SITE_URL}/pricing`,
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
