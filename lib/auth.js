// Simple admin auth — single shared password, opaque session token in a cookie.
// Not enterprise-grade; appropriate for a solo affiliate blog. Upgrade to
// proper OAuth/JWT if you ever add multi-user.
import { randomBytes } from "node:crypto";
import { db, ensureSchema } from "./db.js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function login(password) {
  if (password !== ADMIN_PASSWORD) return null;
  await ensureSchema();
  const token = randomBytes(32).toString("hex");
  // Use SQLite's datetime('now', modifier) so the format matches datetime('now') in verify().
  const res = await db.execute(`SELECT datetime('now', '+7 days') AS expires`);
  const expires = res.rows[0].expires;
  await db.execute({
    sql: `INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)`,
    args: [token, expires]
  });
  return token;
}

export async function verify(token) {
  if (!token) return false;
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT 1 FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')`,
    args: [token]
  });
  return res.rows.length > 0;
}

export function getTokenFromRequest(req) {
  const cookie = req.headers?.cookie || "";
  const m = cookie.match(/eira_admin=([^;]+)/);
  const token = m ? m[1] : null;
  if (process.env.DEBUG_AUTH) console.log("[auth] cookie:", cookie.slice(0, 80), "→ token:", token ? token.slice(0, 12) + "…" : "none");
  return token;
}

export function requireAuth(handler) {
  return async (req, res) => {
    const token = getTokenFromRequest(req);
    if (!(await verify(token))) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }
    return handler(req, res);
  };
}
