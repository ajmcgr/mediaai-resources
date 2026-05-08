import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { renderBrandedEmail, escapeHtml } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

const FROM_ADDRESS = "Media <hello@trymedia.ai>";
const CONFIRM_REDIRECT_URL = "https://trymedia.ai/chat";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, displayName, company } = await req.json();

    if (!email || typeof email !== "string") {
      return response({ error: "email is required" }, 400);
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return response({ error: "password must be at least 8 characters" }, 400);
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!lovableApiKey || !resendApiKey || !supabaseUrl || !serviceRole) {
      return response({ error: "Server not configured" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email: normalizedEmail,
      password,
      options: {
        redirectTo: CONFIRM_REDIRECT_URL,
        data: {
          display_name: typeof displayName === "string" ? displayName : "",
          company: typeof company === "string" ? company : "",
        },
      },
    });

    if (error || !data?.properties?.action_link) {
      const message = error?.message ?? "Could not create signup link";
      const status = /already registered|already been registered|user already/i.test(message) ? 409 : 400;
      return response({ error: message }, status);
    }

    const actionLink = data.properties.action_link;
    const firstName = typeof displayName === "string" && displayName.trim() ? displayName.trim().split(/\s+/)[0] : "";

    const html = renderBrandedEmail({
      preheader: "Confirm your Media AI account",
      heading: firstName ? `Welcome to Media AI, ${escapeHtml(firstName)}` : "Confirm your account",
      body: `Confirm your email to activate your account and start finding journalists and creators.<br/><br/><span style="font-size:12px;color:#9aa0a6;word-break:break-all;">Or paste this link: ${escapeHtml(actionLink)}</span>`,
      cta: { label: "Confirm email", url: actionLink },
      footerNote: "If you didn't create an account, you can safely ignore this email.",
    });

    const sendRes = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": resendApiKey,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [normalizedEmail],
        subject: "Confirm your Media AI account",
        html,
      }),
    });

    if (!sendRes.ok) {
      const bodyText = await sendRes.text();
      console.error(`signup email send failed [${sendRes.status}]: ${bodyText}`);
      return response({ error: "Could not send confirmation email" }, 502);
    }

    return response({ ok: true });
  } catch (e) {
    console.error("send-signup error:", e);
    return response({ error: "Unexpected error" }, 500);
  }
});

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBrandedEmail({
  preheader,
  heading,
  body,
  cta,
  footerNote,
}: {
  preheader: string;
  heading: string;
  body: string;
  cta?: { label: string; url: string };
  footerNote?: string;
}) {
  const logoBlock = `
    <div style="margin-bottom:24px;">
      <img
        src="${LOGO_URL}"
        alt="Media AI"
        style="display:block;height:48px;max-width:260px;width:auto;"
      />
    </div>
  `;

  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${escapeHtml(heading)}</title>
    </head>
    <body style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        ${escapeHtml(preheader)}
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
              <tr>
                <td style="padding:32px;">
                  ${logoBlock}
                  <h1 style="margin:0 0 16px 0;font-size:28px;line-height:1.2;font-weight:700;color:#111827;">
                    ${escapeHtml(heading)}
                  </h1>
                  <div style="font-size:15px;line-height:1.7;color:#4b5563;margin-bottom:24px;">
                    ${body}
                  </div>
                  ${
                    cta
                      ? `
                    <div style="margin-bottom:28px;">
                      <a
                        href="${cta.url}"
                        style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 18px;border-radius:10px;"
                      >
                        ${escapeHtml(cta.label)}
                      </a>
                    </div>
                  `
                      : ""
                  }
                  <div style="font-size:13px;line-height:1.6;color:#6b7280;">
                    ${footerNote ? escapeHtml(footerNote) : ""}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
