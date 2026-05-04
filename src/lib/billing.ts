import { supabase } from "@/integrations/supabase/client";

const FUNCTIONS_BASE =
  "https://uavbphkhomblzkjfuaot.functions.supabase.co";

export type PlanId = "starter" | "growth";
export type BillingInterval = "monthly" | "yearly";
export type TopupPack = "small" | "medium" | "large";

export const TOPUP_PACKS: Record<TopupPack, { tokens: number; priceUsd: number; label: string }> = {
  small:  { tokens:  100_000, priceUsd: 10, label: "100k tokens" },
  medium: { tokens:  500_000, priceUsd: 40, label: "500k tokens" },
  large:  { tokens: 2_000_000, priceUsd: 120, label: "2M tokens" },
};

async function authedPost(path: string, body: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("NOT_AUTHENTICATED");
  console.log(`[billing] ${path} payload`, JSON.stringify(body));
  const res = await fetch(`${FUNCTIONS_BASE}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[billing] ${path} error ${res.status}`, text);
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<{ url: string }>;
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
  console.log("CHECKOUT_PAYLOAD", payload);
  const { url } = await authedPost("create-checkout", payload);
  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

export async function confirmCheckout(sessionId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("NOT_AUTHENTICATED");
  const res = await fetch(`${FUNCTIONS_BASE}/confirm-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[billing] confirm-checkout error", res.status, text);
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<{ ok: boolean }>;
}

export async function startTopup(pack: TopupPack) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id || !session.user.email) throw new Error("NOT_AUTHENTICATED");
  const { url } = await authedPost("create-topup", {
    user_id: session.user.id,
    user_email: session.user.email,
    pack,
  });
  if (!url) throw new Error("Checkout URL missing.");
  window.location.href = url;
}

export async function openBillingPortal() {
  const { url } = await authedPost("customer-portal", {});
  window.location.href = url;
}
