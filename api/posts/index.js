import { db, ensureSchema } from "../../lib/db.js";
import { getTokenFromRequest, requireAuth, verify } from "../../lib/auth.js";

const JOURNAL_CATEGORIES = new Set(["Self Discovery", "Life", "Beauty"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  if (typeof req.body !== "string") return req.body || {};
  try { return JSON.parse(req.body); } catch { return {}; }
}

function publishedValue(value) {
  return value === false || value === 0 || value === "0" || value === "false" ? 0 : 1;
}

function validatePost(body, requireSlug) {
  const title = String(body.title || "").trim();
  const category = String(body.category || "").trim();
  const slug = String(body.slug || "").trim();
  if (!title) return "A title is required.";
  if (title.length > 120) return "The title must be 120 characters or fewer.";
  if (!JOURNAL_CATEGORIES.has(category)) return "Category must be Self Discovery, Life, or Beauty.";
  if (requireSlug && (!slug || !SLUG_PATTERN.test(slug))) return "Use a lowercase URL slug containing only letters, numbers, and hyphens.";
  if (String(body.summary || "").trim().length > 300) return "The standfirst must be 300 characters or fewer.";
  if (String(body.meta_description || "").trim().length > 200) return "The meta description must be 200 characters or fewer.";
  if (String(body.image_alt || "").trim().length > 180) return "The image description must be 180 characters or fewer.";
  return null;
}

function editorialValues(body) {
  return [
    String(body.title || "").trim(),
    String(body.category || "").trim(),
    body.summary ? String(body.summary).trim() : null,
    body.meta_description ? String(body.meta_description).trim() : null,
    body.eyebrow ? String(body.eyebrow).trim() : null,
    body.read_time ? String(body.read_time).trim() : null,
    body.intro_html ? String(body.intro_html) : "",
    body.body_html ? String(body.body_html) : "",
    body.og_image ? String(body.og_image).trim() : null,
    body.image_alt ? String(body.image_alt).trim() : null,
    publishedValue(body.published)
  ];
}

export default async function handler(req, res) {
  await ensureSchema();
  const slug = req.query?.slug ? String(req.query.slug) : "";

  if (slug) {
    if (req.method === "GET") {
      const result = await db.execute({ sql: `SELECT * FROM posts WHERE slug = ?`, args: [slug] });
      if (!result.rows.length) return json(res, 404, { error: "Story not found." });
      const post = result.rows[0];
      if (!post.published && !(await verify(getTokenFromRequest(req)))) return json(res, 404, { error: "Story not found." });
      return json(res, 200, { post });
    }

    if (req.method === "PUT") {
      return requireAuth(async (req, res) => {
        const body = parseBody(req);
        const error = validatePost(body, false);
        if (error) return json(res, 400, { error });
        const exists = await db.execute({ sql: `SELECT 1 FROM posts WHERE slug = ?`, args: [slug] });
        if (!exists.rows.length) return json(res, 404, { error: "Story not found." });
        const values = editorialValues(body);
        await db.execute({
          sql: `UPDATE posts SET
                  title = ?, category = ?, summary = ?, meta_description = ?, eyebrow = ?, read_time = ?,
                  intro_html = ?, body_html = ?, og_image = ?, image_alt = ?, published = ?,
                  products_json = '[]', extra_sections_html = NULL,
                  updated_at = datetime('now')
                WHERE slug = ?`,
          args: values.concat(slug)
        });
        // Product associations are retired from the editorial model. Preserve
        // standalone legacy product records, but remove them from edited posts.
        await db.execute({ sql: `DELETE FROM post_products WHERE post_slug = ?`, args: [slug] });
        return json(res, 200, { ok: true, slug });
      })(req, res);
    }

    if (req.method === "DELETE") {
      return requireAuth(async (req, res) => {
        await db.execute({ sql: `DELETE FROM post_products WHERE post_slug = ?`, args: [slug] });
        const result = await db.execute({ sql: `DELETE FROM posts WHERE slug = ?`, args: [slug] });
        if (!result.rowsAffected) return json(res, 404, { error: "Story not found." });
        return json(res, 200, { ok: true });
      })(req, res);
    }

    res.setHeader("Allow", "GET, PUT, DELETE");
    return json(res, 405, { error: "Method not allowed." });
  }

  if (req.method === "GET") {
    const publicOnly = req.query?.published === "1";
    if (!publicOnly && !(await verify(getTokenFromRequest(req)))) return json(res, 401, { error: "Unauthorized" });
    const result = await db.execute(publicOnly
      ? `SELECT slug, title, category, summary, eyebrow, read_time, og_image, image_alt, published, updated_at
         FROM posts
         WHERE published = 1 AND category IN ('Self Discovery', 'Life', 'Beauty')
         ORDER BY datetime(updated_at) DESC`
      : `SELECT slug, title, category, summary, eyebrow, read_time, og_image, image_alt, published, updated_at
         FROM posts
         ORDER BY datetime(updated_at) DESC`);
    return json(res, 200, { posts: result.rows });
  }

  if (req.method === "POST") {
    return requireAuth(async (req, res) => {
      const body = parseBody(req);
      const error = validatePost(body, true);
      if (error) return json(res, 400, { error });
      const slug = String(body.slug).trim();
      const exists = await db.execute({ sql: `SELECT 1 FROM posts WHERE slug = ?`, args: [slug] });
      if (exists.rows.length) return json(res, 409, { error: "That URL slug is already used by another story." });
      const values = editorialValues(body);
      await db.execute({
        sql: `INSERT INTO posts
                (slug, title, category, summary, meta_description, eyebrow, read_time, intro_html, body_html,
                 products_json, extra_sections_html, og_image, image_alt, published)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', NULL, ?, ?, ?)`,
        args: [slug].concat(values)
      });
      return json(res, 201, { ok: true, slug });
    })(req, res);
  }

  res.setHeader("Allow", "GET, POST");
  return json(res, 405, { error: "Method not allowed." });
}
