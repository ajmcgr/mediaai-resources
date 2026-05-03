// Stripe webhook → upserts public.subscriptions (source of truth).
// IMPORTANT: deploy with --no-verify-jwt; auth is via Stripe signature.
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Required secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//                   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import Stripe from "https://esm.sh/stripe@17.5.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-11-20.acacia",
});
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret);
  } catch (e) {
    console.error("signature verification failed", e);
    return new Response("invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await upsertSubscription(sub);
        }
        break;
      }
      default:
        // ignore other events
        break;
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook handler error", e);
    return new Response((e as Error).message, { status: 500 });
  }
});

async function upsertSubscription(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price.id;
  let userId = sub.metadata?.supabase_user_id;
  let planIdentifier = sub.metadata?.plan_identifier;

  // Resolve plan from the price id if metadata is missing
  if (!planIdentifier && priceId) {
    const { data: plan } = await admin
      .from("plans")
      .select("identifier")
      .eq("monthly_price_id", priceId)
      .maybeSingle();
    planIdentifier = plan?.identifier ?? undefined;
  }

  // Resolve user from stripe_customer_id on profiles when metadata absent
  if (!userId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", sub.customer as string)
      .maybeSingle();
    userId = profile?.id ?? undefined;
  }

  if (!userId || !planIdentifier || !priceId) {
    console.warn("skipping sub upsert — missing userId/plan/price", {
      sub: sub.id, userId, planIdentifier, priceId,
    });
    return;
  }

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

  const { error } = await admin
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });
  if (error) throw error;

  // Mirror to profiles so useSubscription (single source of truth) stays in sync
  const isActive = ["active", "trialing", "past_due"].includes(sub.status);
  const { error: profErr } = await admin
    .from("profiles")
    .update({
      sub_active: isActive,
      plan_identifier: planIdentifier,
      sub_period_end: toIso(sub.current_period_end),
      stripe_customer_id: sub.customer as string,
    })
    .eq("id", userId);
  if (profErr) console.error("profile sync error", profErr);
}

function toIso(unix: number | null | undefined) {
  return unix ? new Date(unix * 1000).toISOString() : null;
}
