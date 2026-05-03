// Stripe Checkout session creator (BYOK).
// Auth: requires the caller's Supabase JWT (Authorization: Bearer ...).
// Body: { plan_identifier: string, success_url?: string, cancel_url?: string }

import Stripe from "https://esm.sh/stripe@17.5.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    if (!plan_identifier) return json({ error: "plan_identifier required" }, 400);
    const billingInterval: "monthly" | "yearly" = interval === "yearly" ? "yearly" : "monthly";

    // Service-role client to read plans + profile.stripe_customer_id
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: plan, error: planErr } = await admin
      .from("plans")
      .select("identifier, name, monthly_price_id, yearly_price_id")
      .eq("identifier", plan_identifier)
      .maybeSingle();
    if (planErr || !plan) {
      return json({ error: "plan not found" }, 400);
    }
    let priceId = billingInterval === "yearly" ? plan.yearly_price_id : plan.monthly_price_id;
    // Defensive fallback: if yearly missing, fall back to monthly so checkout never breaks
    if (!priceId && billingInterval === "yearly") priceId = plan.monthly_price_id;
    if (!priceId) return json({ error: "plan missing stripe price id" }, 400);

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
      line_items: [{ price: plan.monthly_price_id, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: success_url ?? `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url ?? `${origin}/pricing?canceled=1`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_identifier: plan.identifier,
        },
      },
      metadata: {
        supabase_user_id: user.id,
        plan_identifier: plan.identifier,
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
