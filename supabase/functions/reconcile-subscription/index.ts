// One-shot admin tool: given a Stripe subscription id + user email,
// look up the sub in Stripe and upsert it into public.subscriptions
// (which mirrors into profiles via trigger).
//
// POST { stripe_subscription_id: "sub_xxx", user_email: "...@..." }
// Requires header: x-admin-key matching RECONCILE_ADMIN_KEY secret.

import Stripe from "https://esm.sh/stripe@17.5.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-admin-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ADMIN_KEY = Deno.env.get("RECONCILE_ADMIN_KEY");
    if (!ADMIN_KEY) return json({ error: "missing_admin_key_secret" }, 500);
    if (req.headers.get("x-admin-key") !== ADMIN_KEY) {
      return json({ error: "forbidden" }, 403);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const subId = String(body.stripe_subscription_id ?? "").trim();
    const email = String(body.user_email ?? "").trim().toLowerCase();
    if (!subId || !email) return json({ error: "missing_params" }, 400);

    // Find user by email
    const { data: prof, error: pErr } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle();
    if (pErr) return json({ error: "profile_lookup_failed", detail: pErr.message }, 500);
    if (!prof) return json({ error: "user_not_found", email }, 404);

    const sub = await stripe.subscriptions.retrieve(subId);
    const priceId = sub.items.data[0]?.price.id;
    if (!priceId) return json({ error: "no_price_on_sub" }, 400);

    const { data: plan } = await admin
      .from("plans")
      .select("identifier")
      .eq("monthly_price_id", priceId)
      .maybeSingle();
    const { data: planY } = plan ? { data: plan } : await admin
      .from("plans")
      .select("identifier")
      .eq("yearly_price_id", priceId)
      .maybeSingle();
    const planIdentifier = (plan ?? planY)?.identifier;
    if (!planIdentifier) return json({ error: "plan_not_found_for_price", priceId }, 400);

    const row = {
      user_id: prof.id,
      plan_identifier: planIdentifier,
      stripe_customer_id: sub.customer as string,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      status: sub.status,
      current_period_start: toIso(sub.current_period_start),
      current_period_end: toIso(sub.current_period_end),
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: toIso(sub.canceled_at),
    };
    const { error: upErr } = await admin
      .from("subscriptions")
      .upsert(row, { onConflict: "stripe_subscription_id" });
    if (upErr) return json({ error: "upsert_failed", detail: upErr.message }, 500);

    // Make sure profile has customer id + active flag (trigger should do it,
    // but set explicitly as backup)
    await admin
      .from("profiles")
      .update({
        stripe_customer_id: sub.customer as string,
        plan_identifier: planIdentifier,
        sub_active: ["active", "trialing", "past_due"].includes(sub.status),
        sub_period_end: toIso(sub.current_period_end),
      })
      .eq("id", prof.id);

    return json({ ok: true, user_id: prof.id, plan_identifier: planIdentifier, status: sub.status });
  } catch (e) {
    console.error("reconcile error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function toIso(unix: number | null | undefined) {
  return unix ? new Date(unix * 1000).toISOString() : null;
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
