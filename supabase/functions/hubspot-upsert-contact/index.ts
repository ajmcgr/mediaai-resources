const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const HUBSPOT_BASE = "https://api.hubapi.com";
const HUBSPOT_GATEWAY_BASE = "https://connector-gateway.lovable.dev/hubspot";

interface Body {
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  company?: string;
  source?: string;
}

const validate = (b: any): { ok: true; data: Body } | { ok: false; error: string } => {
  if (!b || typeof b !== "object") return { ok: false, error: "Invalid body" };
  if (typeof b.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) {
    return { ok: false, error: "Invalid email" };
  }
  return {
    ok: true,
    data: {
      email: b.email.toLowerCase().slice(0, 200),
      firstName: b.firstName ? String(b.firstName).slice(0, 100) : undefined,
      lastName: b.lastName ? String(b.lastName).slice(0, 100) : undefined,
      fullName: b.fullName ? String(b.fullName).slice(0, 200) : undefined,
      company: b.company ? String(b.company).slice(0, 200) : undefined,
      source: b.source ? String(b.source).slice(0, 100) : undefined,
    },
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const HUBSPOT_API_KEY = Deno.env.get("HUBSPOT_API_KEY");
    const HUBSPOT_ACCESS_TOKEN = Deno.env.get("HUBSPOT_ACCESS_TOKEN");
    if (!HUBSPOT_ACCESS_TOKEN && (!LOVABLE_API_KEY || !HUBSPOT_API_KEY)) {
      throw new Error("HubSpot is not configured");
    }

    const parsed = validate(await req.json().catch(() => null));
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: parsed.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, firstName, lastName, fullName, company, source } = parsed.data;

    let first = firstName;
    let last = lastName;
    if ((!first || !last) && fullName) {
      const parts = fullName.trim().split(/\s+/);
      first = first || parts[0];
      last = last || parts.slice(1).join(" ") || undefined;
    }

    const properties: Record<string, string> = { email };
    if (first) properties.firstname = first;
    if (last) properties.lastname = last;
    if (company) properties.company = company;
    if (source) properties.hs_lead_source = source;

    const useGateway = Boolean(LOVABLE_API_KEY && HUBSPOT_API_KEY);
    const baseUrl = useGateway ? HUBSPOT_GATEWAY_BASE : HUBSPOT_BASE;
    const headers: Record<string, string> = useGateway
      ? {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": HUBSPOT_API_KEY!,
          "Content-Type": "application/json",
        }
      : {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        };

    // Try to create the contact
    let res = await fetch(`${baseUrl}/crm/v3/objects/contacts`, {
      method: "POST",
      headers,
      body: JSON.stringify({ properties }),
    });
    let data = await res.json();

    // If contact already exists (409), update it instead
    if (res.status === 409) {
      const existingId =
        data?.message?.match(/Existing ID:\s*(\d+)/i)?.[1] ||
        data?.context?.id?.[0];
      if (existingId) {
        res = await fetch(`${baseUrl}/crm/v3/objects/contacts/${existingId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ properties }),
        });
        data = await res.json();
      }
    }

    if (!res.ok) {
      console.error("HubSpot error", res.status, data);
      throw new Error(`HubSpot API failed [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("hubspot-upsert-contact error:", errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
