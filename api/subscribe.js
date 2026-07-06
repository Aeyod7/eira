import { db, ensureSchema } from "../lib/db.js";
import { sendEmail, renderEmail, isConfigured } from "../lib/email.js";

// POST /api/subscribe
// Body: { email: string, source?: string }
// Stores a subscriber. Idempotent on email (re-subscribe updates source, keeps date).
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const email = (body?.email || "").trim().toLowerCase();
  const source = (body?.source || "site").trim().slice(0, 40);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ ok: false, error: "Please enter a valid email address." }));
  }

  await ensureSchema();
  // Insert or ignore — keep original subscribed_at if already exists.
  // `changes` tells us whether this was a brand-new subscriber (so we only
  // send the welcome email once, not on every re-subscribe).
  const result = await db.execute({
    sql: `INSERT INTO subscribers (email, source) VALUES (?, ?)
          ON CONFLICT(email) DO UPDATE SET source = excluded.source`,
    args: [email, source]
  });
  const isNew = result.rowsAffected > 0;

  // Fire the welcome email for new subscribers. Never let an email failure
  // break the signup — we log and still return ok.
  // Auto-send is OFF by default — set WELCOME_EMAIL_ENABLED=true to turn it on.
  const welcomeEnabled = process.env.WELCOME_EMAIL_ENABLED === "true";
  if (isNew && welcomeEnabled && isConfigured()) {
    const html = renderEmail({
      heading: "Welcome to Eira",
      bodyHtml: `
        <p>Thanks for joining — you're in.</p>
        <p>Eira is curated feminine lifestyle: beauty, skincare, fashion and self-care finds worth your time. Expect a weekly roundup of the pieces we're loving (and the ones worth skipping).</p>
        <p>Nothing to do right now — the good stuff lands in your inbox soon.</p>
        <p style="margin-top:24px;">— The Eira team</p>`
    });
    try {
      const r = await sendEmail({ to: email, subject: "Welcome to Eira", html });
      if (!r.ok) console.error("[subscribe] welcome email failed:", r.error);
    } catch (e) {
      console.error("[subscribe] welcome email threw:", e.message);
    }
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
}
