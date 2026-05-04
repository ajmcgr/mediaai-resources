// Stripe Checkout session creator (BYOK).
// Body: { user_id: string, user_email: string }

import Stripe from "https://esm.sh/stripe@17.5.0?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CheckoutRequestBody = {
  user_id?: unknown;
  user_email?: unknown;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_PRICE_ID = Deno.env.get("STRIPE_PRICE_ID");
    const SITE_URL = Deno.env.get("SITE_URL");

    if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID || !SITE_URL) {
      console.error("create-checkout missing env variables", {
        hasStripeSecretKey: Boolean(STRIPE_SECRET_KEY),
        hasStripePriceId: Boolean(STRIPE_PRICE_ID),
        hasSiteUrl: Boolean(SITE_URL),
      });
      return json({ error: "Server configuration error: missing Stripe checkout settings." }, 500);
    }

    let body: CheckoutRequestBody;
    try {
      body = await req.json();
    } catch (error) {
      console.error("create-checkout invalid JSON body", error);
      return json({ error: "Invalid JSON body." }, 400);
    }

    console.log("create-checkout request body", body);

    const user = {
      id: typeof body.user_id === "string" ? body.user_id.trim() : "",
      email: typeof body.user_email === "string" ? body.user_email.trim() : "",
    };

    if (!user.id || !user.email) {
      console.error("create-checkout missing required request fields", body);
      return json({ error: "Bad request: user_id and user_email are required." }, 400);
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${SITE_URL}/success`,
      cancel_url: `${SITE_URL}/pricing`,
    });

    return json({ url: session.url }, 200);
  } catch (error) {
    console.error("create-checkout Stripe error", error);
    return json({ error: "Failed to create checkout session." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}