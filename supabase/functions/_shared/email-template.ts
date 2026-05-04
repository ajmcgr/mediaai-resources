// Shared branded email template for all Resend sends.
// Style mirrors the Resend "shared" preview: white card on light gray bg,
// centered logo header, heading + body text, primary CTA button.

const LOGO_URL = "https://trymedia.ai/email-logo.png";
const BRAND_BLUE = "#1675e2";

export interface BrandedEmailOptions {
  preheader?: string;
  heading: string;
  body: string; // HTML allowed (already-escaped where needed)
  cta?: { label: string; url: string };
  footerNote?: string; // small gray text under the card
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
  <body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#22252a;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e8ec;">
            <!-- Logo header -->
            <tr>
              <td style="padding:32px 32px 0;border-bottom:1px solid #eef0f3;">
                <div style="text-align:left;padding-bottom:24px;">
                  <img src="${LOGO_URL}" alt="Media" height="28" style="height:28px;width:auto;display:inline-block;border:0;outline:none;text-decoration:none;" />
                </div>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;font-weight:600;color:#101214;">${heading}</h1>
                <div style="font-size:15px;line-height:1.55;color:#4e5052;margin:0 0 ${cta ? "28px" : "0"};">
                  ${body}
                </div>
                ${
                  cta
                    ? `<div>
                        <a href="${escapeAttr(cta.url)}" style="display:inline-block;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">${escapeHtml(cta.label)}</a>
                      </div>`
                    : ""
                }
              </td>
            </tr>
            ${
              footerNote
                ? `<tr>
                    <td style="padding:20px 32px 28px;border-top:1px solid #eef0f3;text-align:center;">
                      <p style="margin:0;font-size:13px;color:#9aa0a6;line-height:1.5;">${footerNote}</p>
                    </td>
                  </tr>`
                : ""
            }
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#9aa0a6;">© ${new Date().getFullYear()} Media · trymedia.ai</p>
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
