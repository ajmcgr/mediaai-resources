// Shared branded email template for ALL Resend sends from Media AI.
// Style mirrors the "Launch" Resend shared template:
//   light gray page bg, single white card with rounded corners,
//   centered logo header with subtle divider, heading + body text,
//   primary blue CTA button, optional footer note above the card divider.

const LOGO_URL = "https://trymedia.ai/email-logo.png";
const BRAND_BLUE = "#1675e2";
const PAGE_BG = "#f4f6f9";
const CARD_BG = "#ffffff";
const BORDER = "#e6e8ec";
const DIVIDER = "#eef0f3";
const HEADING = "#101214";
const BODY_TEXT = "#4e5052";
const MUTED = "#9aa0a6";

export interface BrandedEmailOptions {
  preheader?: string;
  heading: string;
  body: string; // HTML allowed (already-escaped where needed)
  cta?: { label: string; url: string };
  footerNote?: string; // small gray text inside the card, under a divider
}

export function renderBrandedEmail(opts: BrandedEmailOptions): string {
  const { preheader = "", heading, body, cta, footerNote } = opts;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeAttr(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#22252a;-webkit-font-smoothing:antialiased;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${CARD_BG};border-radius:14px;overflow:hidden;border:1px solid ${BORDER};">
            <!-- Centered logo header -->
            <tr>
              <td align="center" style="padding:36px 32px 28px;border-bottom:1px solid ${DIVIDER};">
                <img src="${LOGO_URL}" alt="Media AI" height="34" style="height:34px;width:auto;display:inline-block;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px 40px ${cta || footerNote ? "32px" : "40px"};">
                <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:700;color:${HEADING};">${heading}</h1>
                <div style="font-size:15px;line-height:1.6;color:${BODY_TEXT};margin:0 0 ${cta ? "28px" : "0"};">
                  ${body}
                </div>
                ${
                  cta
                    ? `<div>
                        <a href="${escapeAttr(cta.url)}" style="display:inline-block;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 24px;border-radius:8px;">${escapeHtml(cta.label)}</a>
                      </div>`
                    : ""
                }
              </td>
            </tr>
            ${
              footerNote
                ? `<tr>
                    <td align="center" style="padding:20px 32px 28px;border-top:1px solid ${DIVIDER};">
                      <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">${footerNote}</p>
                    </td>
                  </tr>`
                : ""
            }
          </table>
          <p style="margin:18px 0 0;font-size:12px;color:${MUTED};">© ${new Date().getFullYear()} Media AI · trymedia.ai</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
