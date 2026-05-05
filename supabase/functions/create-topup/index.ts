// One-time Stripe Checkout for token top-up packs.
// Body: { user_id, user_email, pack: "small"|"medium"|"large" }
// Uses inline price_data — no Stripe dashboard setup required.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type Pack = "small" | "medium" | "large";

export const PACKS: Record<Pack, { tokens: number; amount: number; name: string }> = {
  small:  { tokens:  100_000, amount:  1000, name: "100k chat tokens" },
  medium: { tokens:  500_000, amount:  4000, name: "500k chat tokens" },
  large:  { tokens: 2_000_000, amount: 12000, name: "2M chat tokens" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://trymedia.ai";
    if (!stripeSecretKey) return json({ error: "missing_stripe_key" }, 500);

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const user_id = String(body.user_id ?? "").trim();
    const user_email = String(body.user_email ?? "").trim();
    const packKey = String(body.pack ?? "").toLowerCase().trim() as Pack;
    const pack = PACKS[packKey];

    if (!user_id || !user_email) return json({ error: "missing_user" }, 400);
    if (!pack) return json({ error: "invalid_pack", receivedPack: packKey }, 400);

    const Stripe = (await import("npm:stripe@17.5.0")).default;
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user_email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pack.amount,
          product_data: { name: `Media AI — ${pack.name}` },
        },
      }],
      allow_promotion_codes: true,
      metadata: {
        supabase_user_id: user_id,
        kind: "topup",
        pack: packKey,
        tokens: String(pack.tokens),
      },
      success_url: `${siteUrl}/success?topup=1`,
      cancel_url: `${siteUrl}/chat`,
    });

    return json({ url: session.url });
  } catch (e) {
    console.error("create-topup error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
