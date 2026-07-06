import { db, ensureSchema } from "../../lib/db.js";
import { requireAuth } from "../../lib/auth.js";

function slugifyName(s) {
  return String(s || "").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60)
    .replace(/-$/, "");
}

// Ensure a cloaked /go/:slug link exists for the given affiliate URL.
async function ensureLinkFromUrl(db, url, name) {
  let baseSlug = slugifyName(name) || "product";
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const existing = await db.execute({ sql: "SELECT destination FROM links WHERE slug = ?", args: [slug] });
    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO links (slug, destination, label, network, updated_at)
              VALUES (?, ?, ?, ?, datetime('now'))`,
        args: [slug, url, name || slug, "amazon"]
      });
      return slug;
    }
    if (existing.rows[0].destination === url) {
      return slug; // same URL, reuse the slug
    }
    attempt++;
    slug = baseSlug + "-" + attempt;
  }
}

// Generate a unique product slug.
async function uniqueProductSlug(name) {
  let base = slugifyName(name) || "product";
  let slug = base;
  let attempt = 1;
  while (true) {
    const r = await db.execute({ sql: "SELECT 1 FROM products WHERE slug = ?", args: [slug] });
    if (r.rows.length === 0) return slug;
    attempt++;
    slug = base + "-" + attempt;
  }
}

// GET  /api/products         — list all products (admin)
// GET  /api/products/public  — list published products (public)
// POST /api/products         — create a product (admin)
export default async function handler(req, res) {
  await ensureSchema();

  if (req.method === "GET") {
    // Public list: /api/products/public
    if (req.query?.public !== undefined) {
      const r = await db.execute(
        `SELECT p.id, p.slug, p.name, p.image_url, p.category, p.why_html, p.link_slug, p.link_label,
                p.published, p.updated_at
         FROM products p
         WHERE p.published = 1
         ORDER BY datetime(p.updated_at) DESC`
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ products: r.rows }));
    }

    // Admin list
    return requireAuth(async (req, res) => {
      const r = await db.execute(
        `SELECT p.id, p.slug, p.name, p.image_url, p.category, p.why_html, p.link_slug, p.link_label,
                p.published, p.created_at, p.updated_at,
                l.network AS link_network
         FROM products p
         LEFT JOIN links l ON l.slug = p.link_slug
         ORDER BY datetime(p.updated_at) DESC`
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ products: r.rows }));
    })(req, res);
  }

  if (req.method === "POST") {
    return requireAuth(async (req, res) => {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      const { name, image_url, category, link_url, link_slug, link_label, published } = body || {};
      if (!name) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: "name is required" }));
      }
      try {
        const slug = await uniqueProductSlug(name);
        let finalLinkSlug = link_slug || null;
        if (!finalLinkSlug && link_url) {
          finalLinkSlug = await ensureLinkFromUrl(db, link_url, name);
        }
        await db.execute({
          sql: `INSERT INTO products (slug, name, image_url, category, link_slug, link_label, published)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [slug, name, image_url || null, category || null,
                 finalLinkSlug, link_label || null, published === false ? 0 : 1]
        });
        const r2 = await db.execute({ sql: `SELECT * FROM products WHERE slug = ?`, args: [slug] });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, id: r2.rows[0].id, slug }));
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
