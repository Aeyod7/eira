import { db, ensureSchema } from "../../lib/db.js";
import { login, verify, getTokenFromRequest } from "../../lib/auth.js";

// Consolidated admin auth routes (single Vercel function):
//   POST /api/admin/login  — body { password }, sets session cookie
//   POST /api/admin/logout — clears the session cookie + deletes the session row
//   GET  /api/admin/me     — returns whether the current session is valid
// (Vercel rewrite: /api/admin/:slug → /api/admin?slug=:slug)

// Basic in-memory rate limit for login attempts. Resets on cold start, which is
// acceptable — it exists to slow brute-force, not to be a perfect counter.
// Stored on globalThis so it survives module re-imports (dev server) and
// warm serverless invocations (Vercel).
const attempts = globalThis.__eiraLoginAttempts ??= new Map(); // ip → { count, firstAt }
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  const action = req.query?.slug;

  if (action === "me") {
    const ok = await verify(getTokenFromRequest(req));
    return json(res, 200, { authenticated: ok });
  }

  if (action === "login") {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return json(res, 405, { error: "Method not allowed" });
    }
    const ip = req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
    if (rateLimited(ip)) {
      return json(res, 429, { ok: false, error: "Too many attempts. Try again in a few minutes." });
    }
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const token = await login(body?.password || "");
    if (!token) return json(res, 401, { ok: false, error: "Wrong password" });
    attempts.delete(ip);
    res.setHeader("Set-Cookie", `eira_admin=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    return json(res, 200, { ok: true });
  }

  if (action === "logout") {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return json(res, 405, { error: "Method not allowed" });
    }
    const token = getTokenFromRequest(req);
    if (token) {
      await ensureSchema();
      try { await db.execute({ sql: `DELETE FROM admin_sessions WHERE token = ?`, args: [token] }); }
      catch (e) { console.error("logout session delete failed:", e.message); }
    }
    res.setHeader("Set-Cookie", `eira_admin=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`);
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: "Not found" });
}
