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

async function ensureLinkFromUrl(db, url, name, postSlug, index) {
  let baseSlug = slugifyName(name) || "product";
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const existing = await db.execute({ sql: "SELECT destination FROM links WHERE slug = ?", args: [slug] });
    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO links (slug, destination, label, network, post_slug, updated_at)
              VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        args: [slug, url, name || slug, "amazon", postSlug]
      });
      return slug;
    }
    if (existing.rows[0].destination === url) return slug;
    attempt++;
    slug = baseSlug + "-" + attempt;
  }
}

// GET    /api/posts        — list all posts (admin sees unpublished; ?published=1 for public)
// POST   /api/posts        — create a post (admin)
// GET    /api/posts/:slug  — fetch one post (public; unpublished 404s for non-admin)
// PUT    /api/posts/:slug  — update (admin)
// DELETE /api/posts/:slug  — delete (admin)
// (Vercel rewrite: /api/posts/:slug → /api/posts?slug=:slug)
export default async function handler(req, res) {
  await ensureSchema();
  const slug = req.query?.slug;

  // Individual post operations
  if (slug) {
    if (req.method === "GET") {
      const r = await db.execute({ sql: `SELECT * FROM posts WHERE slug = ?`, args: [slug] });
      if (r.rows.length === 0) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: "Not found" }));
      }
      const post = r.rows[0];
      if (!post.published) {
        const { verify, getTokenFromRequest } = await import("../../lib/auth.js");
        const ok = await verify(getTokenFromRequest(req));
        if (!ok) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ error: "Not found" }));
        }
      }
      const attached = await db.execute({
        sql: `SELECT p.id, p.slug, p.name, p.image_url, p.why_html, p.link_slug, p.link_label,
                     pp.position, pp.section_heading, pp.image_text
              FROM post_products pp
              JOIN products p ON p.id = pp.product_id
              WHERE pp.post_slug = ?
              ORDER BY pp.position ASC`,
        args: [slug]
      });
      post.attached_products = attached.rows;
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ post }));
    }

    if (req.method === "PUT") {
      return requireAuth(async (req, res) => {
        let body = req.body;
        if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
        const { title, category, meta_description, eyebrow, read_time, intro_html, body_html, products_json, extra_sections_html, og_image, published, attached_product_ids } = body || {};
        try {
          let normalizedProducts = [];
          if (products_json) {
            try { normalizedProducts = JSON.parse(products_json); } catch {}
            if (Array.isArray(normalizedProducts)) {
              for (let i = 0; i < normalizedProducts.length; i++) {
                const prod = normalizedProducts[i];
                if (prod.link_url) {
                  const linkSlug = await ensureLinkFromUrl(db, prod.link_url, prod.name, slug, i);
                  prod.link_slug = linkSlug;
                  prod.link_url = undefined;
                }
              }
            }
          }
          const finalProductsJson = JSON.stringify(normalizedProducts);

          await db.execute({
            sql: `UPDATE posts SET
                    title=?, category=?, meta_description=?, eyebrow=?, read_time=?, intro_html=?, body_html=?, products_json=?, extra_sections_html=?, og_image=?, published=?, updated_at=datetime('now')
                  WHERE slug=?`,
            args: [title, category, meta_description || null, eyebrow || null, read_time || null,
                   intro_html || null, body_html || "", finalProductsJson, extra_sections_html || null,
                   og_image || null, published === false ? 0 : 1, slug]
          });

          if (Array.isArray(attached_product_ids)) {
            await db.execute({ sql: `DELETE FROM post_products WHERE post_slug = ?`, args: [slug] });
            for (let i = 0; i < attached_product_ids.length; i++) {
              const entry = attached_product_ids[i];
              const pid = typeof entry === "object" ? entry.product_id : entry;
              const sectionHeading = typeof entry === "object" ? (entry.section_heading || null) : null;
              const imageText = typeof entry === "object" ? (entry.image_text || null) : null;
              if (!pid) continue;
              await db.execute({
                sql: `INSERT OR IGNORE INTO post_products (post_slug, product_id, position, section_heading, image_text)
                      VALUES (?, ?, ?, ?, ?)`,
                args: [slug, pid, i, sectionHeading, imageText]
              });
            }
          }

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
        await db.execute({ sql: `DELETE FROM posts WHERE slug = ?`, args: [slug] });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true }));
      })(req, res);
    }

    res.statusCode = 405;
    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  // Collection operations
  if (req.method === "GET") {
    const onlyPublished = req.query?.published === "1";
    const sql = onlyPublished
      ? `SELECT slug, title, category, eyebrow, read_time, og_image, published, updated_at
         FROM posts WHERE published = 1 ORDER BY datetime(updated_at) DESC`
      : `SELECT slug, title, category, eyebrow, read_time, og_image, published, updated_at
         FROM posts ORDER BY datetime(updated_at) DESC`;
    const r = await db.execute(sql);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ posts: r.rows }));
  }

  if (req.method === "POST") {
    return requireAuth(async (req, res) => {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      if (process.env.DEBUG_POST) console.error("[posts POST] body keys:", Object.keys(body || {}), "slug:", body?.slug);
      const { slug, title, category, meta_description, eyebrow, read_time, intro_html, body_html, products_json, extra_sections_html, og_image, published, attached_product_ids } = body || {};
      if (!slug || !title || !category) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ error: "slug, title, category are required" }));
      }
      try {
        let normalizedProducts = [];
        if (products_json) {
          try { normalizedProducts = JSON.parse(products_json); } catch {}
          if (Array.isArray(normalizedProducts)) {
            for (let i = 0; i < normalizedProducts.length; i++) {
              const prod = normalizedProducts[i];
              if (prod.link_url) {
                const linkSlug = await ensureLinkFromUrl(db, prod.link_url, prod.name, slug, i);
                prod.link_slug = linkSlug;
                prod.link_url = undefined;
              }
            }
          }
        }
        const finalProductsJson = JSON.stringify(normalizedProducts);

        await db.execute({
          sql: `INSERT INTO posts (slug, title, category, meta_description, eyebrow, read_time, intro_html, body_html, products_json, extra_sections_html, og_image, published)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(slug) DO UPDATE SET
                  title=excluded.title, category=excluded.category, meta_description=excluded.meta_description,
                  eyebrow=excluded.eyebrow, read_time=excluded.read_time, intro_html=excluded.intro_html,
                  body_html=excluded.body_html, products_json=excluded.products_json,
                  extra_sections_html=excluded.extra_sections_html, og_image=excluded.og_image, published=excluded.published,
                  updated_at=datetime('now')`,
          args: [slug, title, category, meta_description || null, eyebrow || null, read_time || null,
                 intro_html || null, body_html || "", finalProductsJson, extra_sections_html || null,
                 og_image || null, published === false ? 0 : 1]
        });

        if (Array.isArray(attached_product_ids)) {
          await db.execute({ sql: `DELETE FROM post_products WHERE post_slug = ?`, args: [slug] });
          for (let i = 0; i < attached_product_ids.length; i++) {
            const entry = attached_product_ids[i];
            const pid = typeof entry === "object" ? entry.product_id : entry;
            const sectionHeading = typeof entry === "object" ? (entry.section_heading || null) : null;
            const imageText = typeof entry === "object" ? (entry.image_text || null) : null;
            if (!pid) continue;
            await db.execute({
              sql: `INSERT OR IGNORE INTO post_products (post_slug, product_id, position, section_heading, image_text)
                    VALUES (?, ?, ?, ?, ?)`,
              args: [slug, pid, i, sectionHeading, imageText]
            });
          }
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, slug }));
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
