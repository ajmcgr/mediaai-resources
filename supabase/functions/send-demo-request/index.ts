import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

interface DemoRequest {
  name: string;
  email: string;
  company: string;
  role?: string;
  teamSize?: string;
  message?: string;
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const validate = (body: any): { ok: true; data: DemoRequest } | { ok: false; error: string } => {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const required = ["name", "email", "company"] as const;
  for (const k of required) {
    if (typeof body[k] !== "string" || !body[k].trim()) {
      return { ok: false, error: `Missing field: ${k}` };
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return { ok: false, error: "Invalid email" };
  }
  const data: DemoRequest = {
    name: String(body.name).slice(0, 200),
    email: String(body.email).slice(0, 200),
    company: String(body.company).slice(0, 200),
    role: body.role ? String(body.role).slice(0, 200) : "",
    teamSize: body.teamSize ? String(body.teamSize).slice(0, 50) : "",
    message: body.message ? String(body.message).slice(0, 5000) : "",
  };
  return { ok: true, data };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const body = await req.json().catch(() => null);
    const parsed = validate(body);
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: parsed.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { name, email, company, role, teamSize, message } = parsed.data;

    const html = `
      <h2>New demo request</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Company:</strong> ${escapeHtml(company)}</p>
      <p><strong>Role:</strong> ${escapeHtml(role || "—")}</p>
      <p><strong>Team size:</strong> ${escapeHtml(teamSize || "—")}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(message || "—")}</p>
    `;

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Media AI <onboarding@resend.dev>",
        to: ["alex@trylaunch.ai"],
        reply_to: email,
        subject: `Demo request — ${company}`,
        html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Resend error", response.status, data);
      throw new Error(`Resend API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("send-demo-request error:", errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
