import { db, ensureSchema } from "../../lib/db.js";
import { requireAuth } from "../../lib/auth.js";

// GET    /api/links           — list all cloaked links + click counts (admin)
// POST   /api/links           — create/update a cloaked link (admin)
// DELETE /api/links/:slug     — delete a cloaked link (admin)
// (Vercel rewrite: /api/links/:slug → /api/links?slug=:slug)
export default async function handler(req, res) {
  await ensureSchema();
  const slug = req.query?.slug;

  // Individual link: DELETE only
  if (slug && req.method === "DELETE") {
    return requireAuth(async (req, res) => {
      await db.execute({ sql: `DELETE FROM links WHERE slug = ?`, args: [slug] });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    })(req, res);
  }

  if (req.method === "GET") {
    return requireAuth(async (req, res) => {
      const r = await db.execute(
        `SELECT l.slug, l.destination, l.label, l.network, l.post_slug, l.updated_at,
                (SELECT COUNT(*) FROM clicks c WHERE c.slug = l.slug) AS clicks,
                (SELECT title FROM posts p WHERE p.slug = l.post_slug) AS post_title
         FROM links l ORDER BY datetime(l.updated_at) DESC`
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ links: r.rows }));
    })(req, res);
  }

  if (req.method === "POST") {
    return requireAuth(async (req, res) => {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      const { slug, destination, label, network, post_slug } = body || {};
      if (!slug || !destination) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: "slug and destination are required" }));
      }
      await db.execute({
        sql: `INSERT INTO links (slug, destination, label, network, post_slug)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(slug) DO UPDATE SET
                destination=excluded.destination, label=excluded.label,
                network=excluded.network, post_slug=excluded.post_slug,
                updated_at=datetime('now')`,
        args: [slug, destination, label || null, network || null, post_slug || null]
      });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, slug }));
    })(req, res);
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, POST, DELETE");
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
