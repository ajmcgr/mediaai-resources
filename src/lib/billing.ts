import { supabase } from "@/integrations/supabase/client";

const FUNCTIONS_BASE =
  "https://uavbphkhomblzkjfuaot.functions.supabase.co";

async function authedPost(path: string, body: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in first.");
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
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<{ url: string }>;
}

export async function startCheckout(
  planIdentifier: "journalist" | "creator" | "both",
  interval: "monthly" | "yearly" = "monthly",
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !user?.email) throw new Error("Please sign in first.");

  const { url } = await authedPost("create-checkout", {
    user_id: user.id,
    user_email: user.email,
    plan_identifier: planIdentifier,
    interval,
  });
  if (!url) throw new Error("Checkout URL missing from response.");

  window.location.href = url;
}

export async function openBillingPortal() {
  const { url } = await authedPost("customer-portal", {});
  window.location.href = url;
}
