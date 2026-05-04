import { supabase } from "@/integrations/supabase/client";

const FUNCTIONS_BASE =
  "https://uavbphkhomblzkjfuaot.functions.supabase.co";

export type PlanId = "journalist" | "creator" | "both";
export type BillingInterval = "monthly" | "yearly";

async function authedPost(path: string, body: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  console.log(`[billing] ${path} session exists?`, !!session);
  if (!session) throw new Error("NOT_AUTHENTICATED");
  console.log(`[billing] ${path} payload`, body);
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

export async function startCheckout(
  plan: PlanId,
  interval: BillingInterval = "monthly",
) {
  const { data: { session } } = await supabase.auth.getSession();
  console.log("[billing] startCheckout session?", !!session);
  if (!session?.user?.id || !session.user.email) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const payload = {
    user_id: session.user.id,
    user_email: session.user.email,
    plan,
    plan_identifier: plan,
    interval,
  };
  console.log("[billing] create-checkout payload", JSON.stringify(payload));

  const { url } = await authedPost("create-checkout", payload);
  if (!url) throw new Error("Checkout URL missing from response.");

  window.location.href = url;
}

export async function openBillingPortal() {
  const { url } = await authedPost("customer-portal", {});
  window.location.href = url;
}
