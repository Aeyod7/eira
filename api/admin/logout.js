import { db, ensureSchema } from "../../lib/db.js";
import { getTokenFromRequest } from "../../lib/auth.js";

// POST /api/admin/logout — clears the session cookie + deletes the session row.
export default async function handler(req, res) {
  const token = getTokenFromRequest(req);
  if (token) {
    await ensureSchema();
    try { await db.execute({ sql: `DELETE FROM admin_sessions WHERE token = ?`, args: [token] }); } catch {}
  }
  res.setHeader("Set-Cookie", `eira_admin=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
}
