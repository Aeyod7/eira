// Email sending via Resend's REST API (https://resend.com).
// No SDK dependency — Node 18+ has global fetch, so we call the HTTP API directly.
//
// Env vars:
//   RESEND_API_KEY  — your Resend API key (re_...). Required to send.
//   FROM_EMAIL      — sender, e.g. "Eira <hello@yourdomain.com>". Must be a
//                     verified domain in Resend for real sends. Defaults to the
//                     Resend test sender, which only delivers to your own account email.
//   SITE_URL        — used in the email footer / unsubscribe line.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "Eira <onboarding@resend.dev>";
const SITE_URL = process.env.SITE_URL || "https://eira.example";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RESEND_BATCH_ENDPOINT = "https://api.resend.com/emails/batch";

export function isConfigured() {
  return Boolean(RESEND_API_KEY);
}

// Wrap body content in a simple branded, mobile-friendly HTML layout.
export function renderEmail({ heading, bodyHtml }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0; padding:0; background:#f7f3ef; font-family: Georgia, 'Times New Roman', serif; color:#4a3528;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ef; padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:8px; overflow:hidden;">
        <tr><td style="background:#4a3528; padding:28px 32px; text-align:center;">
          <span style="font-size:26px; letter-spacing:6px; color:#ffffff; font-weight:normal;">EIRA</span>
        </td></tr>
        ${heading ? `<tr><td style="padding:32px 32px 0 32px;"><h1 style="margin:0; font-size:22px; color:#4a3528;">${heading}</h1></td></tr>` : ""}
        <tr><td style="padding:20px 32px 32px 32px; font-size:16px; line-height:1.6; color:#4a3528;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px; background:#f7f3ef; font-size:12px; line-height:1.5; color:#8a7a6d; text-align:center;">
          You're receiving this because you subscribed at <a href="${SITE_URL}" style="color:#8a7a6d;">${SITE_URL.replace(/^https?:\/\//, "")}</a>.<br>
          To unsubscribe, reply to this email with "unsubscribe".<br>
          &copy; ${year} Eira. This email may contain affiliate links.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Send a single email. Returns { ok, id? , error? }.
export async function sendEmail({ to, subject, html, replyTo }) {
  if (!isConfigured()) return { ok: false, error: "RESEND_API_KEY not set" };
  const payload = { from: FROM_EMAIL, to: Array.isArray(to) ? to : [to], subject, html };
  if (replyTo) payload.reply_to = replyTo;
  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: data?.message || `Resend error ${r.status}` };
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Send the same email to many recipients — one distinct email each (no shared To/CC).
// Resend's batch endpoint accepts up to 100 messages per call, so we chunk.
// Returns { ok, sent, failed, errors }.
export async function sendBroadcast({ recipients, subject, html }) {
  if (!isConfigured()) return { ok: false, sent: 0, failed: 0, error: "RESEND_API_KEY not set" };
  const list = (recipients || []).filter(Boolean);
  let sent = 0, failed = 0;
  const errors = [];

  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    const messages = chunk.map((to) => ({ from: FROM_EMAIL, to: [to], subject, html }));
    try {
      const r = await fetch(RESEND_BATCH_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(messages)
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { failed += chunk.length; errors.push(data?.message || `Resend error ${r.status}`); }
      else { sent += chunk.length; }
    } catch (e) {
      failed += chunk.length;
      errors.push(e.message);
    }
  }
  return { ok: failed === 0, sent, failed, errors };
}
