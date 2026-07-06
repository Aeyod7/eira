import { db, ensureSchema } from "../../lib/db.js";
import { requireAuth } from "../../lib/auth.js";

// DELETE /api/links/:slug — delete a cloaked link (admin)
export default async function handler(req, res) {
  await ensureSchema();
  const slug = req.query?.slug;

  if (req.method === "DELETE") {
    return requireAuth(async (req, res) => {
      await db.execute({ sql: `DELETE FROM links WHERE slug = ?`, args: [slug] });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    })(req, res);
  }

  res.statusCode = 405;
  res.setHeader("Allow", "DELETE");
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
