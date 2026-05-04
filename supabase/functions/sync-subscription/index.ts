// sync-subscription — authenticated Stripe → Supabase repair for users whose
// checkout/webhook did not populate profile subscription fields.

import Stripe from "https://esm.sh/stripe@17.5.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-11-20.acacia" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user?.email) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const customerIds = new Set<string>();
    if (profile?.stripe_customer_id) customerIds.add(profile.stripe_customer_id);
    const customers = await stripe.customers.list({ email: user.email, limit: 10 });
    customers.data.forEach((customer) => customerIds.add(customer.id));

    for (const customerId of customerIds) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
      const sub = subs.data.find((item) => ACTIVE_STATUSES.has(item.status));
      if (sub) {
        const result = await upsertSubscription(admin, sub, user.id);
        return json({ ok: true, active: true, ...result });
      }
    }

    return json({ ok: true, active: false });
  } catch (e) {
    console.error("sync-subscription error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function upsertSubscription(admin: ReturnType<typeof createClient>, sub: Stripe.Subscription, userId: string) {
  const priceId = sub.items.data[0]?.price.id;
  let planIdentifier = sub.metadata?.plan_identifier;
  if (!planIdentifier && priceId) {
    const { data: monthlyPlan } = await admin.from("plans").select("identifier").eq("monthly_price_id", priceId).maybeSingle();
    const { data: yearlyPlan } = monthlyPlan ? { data: monthlyPlan } : await admin.from("plans").select("identifier").eq("yearly_price_id", priceId).maybeSingle();
    planIdentifier = (monthlyPlan ?? yearlyPlan)?.identifier;
  }
  if (!planIdentifier || !priceId) throw new Error("plan_not_found_for_subscription");

  const row = {
    user_id: userId,
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
  const { error } = await admin.from("subscriptions").upsert(row, { onConflict: "stripe_subscription_id" });
  if (error) throw error;

  const { error: profileError } = await admin.from("profiles").update({
    sub_active: ACTIVE_STATUSES.has(sub.status),
    plan_identifier: planIdentifier,
    sub_period_end: toIso(sub.current_period_end),
    stripe_customer_id: sub.customer as string,
  }).eq("id", userId);
  if (profileError) throw profileError;
  return { plan_identifier: planIdentifier, status: sub.status };
}

function toIso(unix: number | null | undefined) {
  return unix ? new Date(unix * 1000).toISOString() : null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}