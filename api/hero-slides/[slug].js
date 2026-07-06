import { db, ensureSchema } from "../../lib/db.js";
import { requireAuth } from "../../lib/auth.js";

// GET    /api/hero-slides/:id — fetch one slide (admin)
// PUT    /api/hero-slides/:id — update (admin)
// DELETE /api/hero-slides/:id — delete (admin)
// The dynamic segment is named [slug] for dev-server compatibility;
// Vercel sets req.query.slug, so we read that.
export default async function handler(req, res) {
  await ensureSchema();
  const id = req.query?.id || req.query?.slug;

  if (req.method === "GET") {
    return requireAuth(async (req, res) => {
      const r = await db.execute({ sql: `SELECT * FROM hero_slides WHERE id = ?`, args: [id] });
      if (r.rows.length === 0) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: "Not found" }));
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ slide: r.rows[0] }));
    })(req, res);
  }

  if (req.method === "PUT") {
    return requireAuth(async (req, res) => {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      const { image_url, position, is_active, focal_position } = body || {};
      if (!image_url) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: "image_url is required" }));
      }
      try {
        await db.execute({
          sql: `UPDATE hero_slides
                SET image_url = ?, position = ?, is_active = ?, focal_position = ?
                WHERE id = ?`,
          args: [image_url, position ?? 0, is_active === false ? 0 : 1, focal_position || "center", id]
        });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: e.message }));
      }
    })(req, res);
  }

  if (req.method === "DELETE") {
    return requireAuth(async (req, res) => {
      await db.execute({ sql: `DELETE FROM hero_slides WHERE id = ?`, args: [id] });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    })(req, res);
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, PUT, DELETE");
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
