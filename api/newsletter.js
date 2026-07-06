import { db, ensureSchema } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";
import { sendEmail, sendBroadcast, renderEmail, isConfigured } from "../lib/email.js";

// GET  /api/newsletter — status: is Resend configured + subscriber count (admin)
// POST /api/newsletter — send a newsletter (admin)
//   Body: { subject, body_html, test_email? }
//   - test_email set → send only to that address (a preview to yourself)
//   - otherwise      → send to every subscriber
export default async function handler(req, res) {
  return requireAuth(async (req, res) => {
    await ensureSchema();

    if (req.method === "GET") {
      const c = await db.execute(`SELECT COUNT(*) AS n FROM subscribers`);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ configured: isConfigured(), subscribers: c.rows[0]?.n ?? 0 }));
    }

    if (req.method === "POST") {
      if (!isConfigured()) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: "Email isn't configured. Set RESEND_API_KEY (and FROM_EMAIL) in your environment." }));
      }

      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      const subject = (body?.subject || "").trim();
      const bodyHtml = (body?.body_html || "").trim();
      const testEmail = (body?.test_email || "").trim().toLowerCase();

      if (!subject || !bodyHtml) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: "Subject and body are both required." }));
      }

      const html = renderEmail({ heading: subject, bodyHtml });

      // Preview send to a single address.
      if (testEmail) {
        const r = await sendEmail({ to: testEmail, subject: subject + " (test)", html });
        res.statusCode = r.ok ? 200 : 500;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(r.ok ? { ok: true, test: true, sent: 1 } : { error: r.error }));
      }

      // Full broadcast.
      const subs = await db.execute(`SELECT email FROM subscribers`);
      const recipients = subs.rows.map((r) => r.email);
      if (recipients.length === 0) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: "No subscribers to send to yet." }));
      }

      const result = await sendBroadcast({ recipients, subject, html });
      res.statusCode = result.ok ? 200 : 207; // 207: partial success
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(result));
    }

    res.statusCode = 405;
    res.setHeader("Allow", "GET, POST");
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
  })(req, res);
}
