import { db, ensureSchema } from "../lib/db.js";

// GET /api/sitemap  (exposed as /sitemap.xml via vercel.json rewrite)
// Dynamic sitemap: static pages + every published post.
const SITE = (process.env.SITE_URL || "https://eira.example").replace(/\/+$/, "");

const STATIC_PAGES = ["/", "/blog.html", "/about.html", "/shop.html", "/privacy.html", "/terms.html", "/contact.html"];

export default async function handler(req, res) {
  await ensureSchema();
  const r = await db.execute(
    `SELECT slug, updated_at FROM posts WHERE published = 1 ORDER BY datetime(updated_at) DESC`
  );
  const urls = [
    ...STATIC_PAGES.map(p => `  <url><loc>${SITE}${p}</loc></url>`),
    ...r.rows.map(p => {
      const lastmod = String(p.updated_at || "").split(" ")[0];
      return `  <url><loc>${SITE}/post/${encodeURIComponent(p.slug)}/</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
    })
  ].join("\n");

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
}
