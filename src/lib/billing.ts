import { supabase } from "@/integrations/supabase/client";

export type PlanId = "starter" | "growth";
export type BillingInterval = "monthly" | "yearly";
export type TopupPack = "small" | "medium" | "large";

export const TOPUP_PACKS: Record<TopupPack, { tokens: number; priceUsd: number; label: string }> = {
  small:  { tokens:  100_000, priceUsd: 10, label: "100k credits" },
  medium: { tokens:  500_000, priceUsd: 40, label: "500k credits" },
  large:  { tokens: 2_000_000, priceUsd: 120, label: "2M credits" },
};

type InvokeResponse = { url?: string; ok?: boolean; active?: boolean; tokens?: number; granted?: number; already?: boolean; recovered?: boolean };

async function authedInvoke(path: string, body: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("NOT_AUTHENTICATED");

  const { data, error } = await supabase.functions.invoke(path, {
    body,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    const ctx = (error as { context?: Response }).context;
    let detail = "";
    try { detail = ctx ? await ctx.clone().text() : ""; } catch { /* ignore */ }
    throw new Error(detail || error.message || `Request failed: ${path}`);
  }

  return (data ?? {}) as InvokeResponse;
}

export async function startCheckout(plan: PlanId, interval: BillingInterval = "monthly") {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id || !session.user.email) throw new Error("NOT_AUTHENTICATED");
  const payload = {
    user_id: session.user.id,
    user_email: session.user.email,
    plan_identifier: plan.toLowerCase() as PlanId,
    interval,
  };
  const { url } = await authedInvoke("create-checkout", payload);
  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

export async function confirmCheckout(sessionId: string) {
  const data = await authedInvoke("confirm-checkout", { session_id: sessionId });
  return { ok: Boolean(data.ok) };
}

export async function confirmTopup(sessionId: string | null) {
  if (!sessionId) {
    // Recover old Stripe success redirects that did not include CHECKOUT_SESSION_ID.
    const data = await authedInvoke("create-topup", { action: "confirm" });
    return {
      ok: Boolean(data.ok),
      tokens: Number(data.tokens ?? data.granted ?? 0),
      already: Boolean(data.already),
      recovered: Boolean(data.recovered),
    };
  }
  const data = await authedInvoke("confirm-topup", { session_id: sessionId });
  return {
    ok: Boolean(data.ok),
    tokens: Number(data.tokens ?? data.granted ?? 0),
    already: Boolean(data.already),
    recovered: Boolean(data.recovered),
  };
}

export async function syncSubscription() {
  const data = await authedInvoke("sync-subscription", {});
  return { ok: Boolean(data.ok), active: Boolean(data.active) };
}

export async function startTopup(pack: TopupPack) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id || !session.user.email) throw new Error("NOT_AUTHENTICATED");
  const { url } = await authedInvoke("create-topup", {
    user_id: session.user.id,
    user_email: session.user.email,
    pack,
  });
  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

export async function openBillingPortal() {
  const { url } = await authedInvoke("customer-portal", {});
  if (!url) throw new Error("Billing portal URL missing.");
  window.location.href = url;
}
