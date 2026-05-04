console.log("CHECKOUT_V6_RUNNING - redeploy", new Date().toISOString());

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  console.log("CHECKOUT_V6_RUNNING");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));

  console.log("CHECKOUT_BODY", JSON.stringify(body));

  return new Response(
    JSON.stringify({
      debug: "CHECKOUT_V6_RUNNING",
      body,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
