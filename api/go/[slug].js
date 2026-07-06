import { db, ensureSchema } from "../../lib/db.js";

// GET /api/go/:slug  (exposed as /go/:slug via vercel.json rewrite)
// Looks up the cloaked destination, logs a click, 302-redirects.
// 404 if slug unknown. Click tracking is fire-and-forget — never blocks the redirect.
export default async function handler(req, res) {
  const slug = req.query?.slug || (req.url?.split("/").pop());
  if (!slug) {
    res.statusCode = 404;
    return res.end("Not found");
  }

  await ensureSchema();
  const link = await db.execute({ sql: `SELECT destination FROM links WHERE slug = ?`, args: [slug] });
  if (link.rows.length === 0) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(`<!doctype html><h1>Link not found</h1><p>The short link <code>/go/${slug}</code> is not registered.</p>`);
  }

  const destination = link.rows[0].destination;

  // Fire-and-forget click log. Don't await in a way that delays the redirect.
  const referrer = req.headers?.referer || req.headers?.referrer || null;
  const ua = req.headers?.["user-agent"] || null;
  try {
    await db.execute({
      sql: `INSERT INTO clicks (slug, referrer, ua) VALUES (?, ?, ?)`,
      args: [slug, referrer, ua]
    });
  } catch (e) {
    // Click logging is best-effort. Never block the redirect on analytics failure.
    console.error("click log failed:", e.message);
  }

  res.statusCode = 302;
  res.setHeader("Location", destination);
  res.setHeader("Cache-Control", "no-store");
  res.end();
}
