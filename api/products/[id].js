import { db, ensureSchema } from "../../lib/db.js";
import { requireAuth } from "../../lib/auth.js";

// GET    /api/products/:id — fetch one product (admin)
// PUT    /api/products/:id — update (admin)
// DELETE /api/products/:id — delete (admin; blocked if referenced by post_products)
export default async function handler(req, res) {
  await ensureSchema();
  // The dev server resolver sets query.slug for dynamic segments;
  // Vercel sets query.id (matching the filename). Handle both.
  const id = req.query?.id || req.query?.slug;

  if (req.method === "GET") {
    return requireAuth(async (req, res) => {
      const r = await db.execute({ sql: `SELECT * FROM products WHERE id = ?`, args: [id] });
      if (r.rows.length === 0) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: "Not found" }));
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ product: r.rows[0] }));
    })(req, res);
  }

  if (req.method === "PUT") {
    return requireAuth(async (req, res) => {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      const { name, image_url, why_html, link_slug, link_label, published } = body || {};
      try {
        await db.execute({
          sql: `UPDATE products SET
                  name=?, image_url=?, why_html=?, link_slug=?, link_label=?, published=?, updated_at=datetime('now')
                WHERE id=?`,
          args: [name, image_url || null, why_html || null,
                 link_slug || null, link_label || null, published === false ? 0 : 1, id]
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
      // Block delete if any post references this product.
      const refs = await db.execute({
        sql: `SELECT pp.post_slug, p.title
              FROM post_products pp
              LEFT JOIN posts p ON p.slug = pp.post_slug
              WHERE pp.product_id = ?`,
        args: [id]
      });
      if (refs.rows.length > 0) {
        const titles = refs.rows.map(r => r.title || r.post_slug).join(", ");
        res.statusCode = 409;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({
          error: `Cannot delete: product is attached to post(s): ${titles}. Remove it from those posts first.`
        }));
      }
      await db.execute({ sql: `DELETE FROM products WHERE id = ?`, args: [id] });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    })(req, res);
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, PUT, DELETE");
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
