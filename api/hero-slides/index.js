import { db, ensureSchema } from "../../lib/db.js";
import { requireAuth } from "../../lib/auth.js";

// GET  /api/hero-slides         — list all slides (admin)
// GET  /api/hero-slides?public=1 — list active slides in order (public)
// POST /api/hero-slides        — create a slide (admin)
export default async function handler(req, res) {
  await ensureSchema();

  if (req.method === "GET") {
    // Public list: active slides in position order
    if (req.query?.public !== undefined) {
      const r = await db.execute(
        `SELECT id, image_url, position, is_active, focal_position
         FROM hero_slides
         WHERE is_active = 1
         ORDER BY position ASC, id ASC`
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ slides: r.rows }));
    }

    // Admin list: all slides
    return requireAuth(async (req, res) => {
      const r = await db.execute(
        `SELECT id, image_url, position, is_active, focal_position, created_at
         FROM hero_slides
         ORDER BY position ASC, id ASC`
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ slides: r.rows }));
    })(req, res);
  }

  if (req.method === "POST") {
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
        const maxPos = await db.execute(
          `SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM hero_slides`
        );
        const nextPos = maxPos.rows[0]?.next_position ?? 1;
        await db.execute({
          sql: `INSERT INTO hero_slides (image_url, position, is_active, focal_position)
                VALUES (?, ?, ?, ?)`,
          args: [image_url, position ?? nextPos, is_active === false ? 0 : 1, focal_position || "center"]
        });
        const r2 = await db.execute(
          `SELECT * FROM hero_slides WHERE rowid = last_insert_rowid()`
        );
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, slide: r2.rows[0] }));
      } catch (e) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: e.message }));
      }
    })(req, res);
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, POST");
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
