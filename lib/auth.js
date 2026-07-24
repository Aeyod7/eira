// Admin auth — stateless signed token using HMAC-SHA256.
// Works seamlessly across all serverless Vercel function instances without DB instance mismatch.
import { createHmac } from "node:crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  return createHmac("sha256", "eira-admin-salt-v1").update(ADMIN_PASSWORD).digest("hex");
}

export function createSignedToken() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const data = `${expiresAt}`;
  const hmac = createHmac("sha256", getSecret()).update(data).digest("hex");
  return `${data}.${hmac}`;
}

export function verifySignedToken(token) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [data, hmac] = parts;
  const expiresAt = parseInt(data, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) return false;
  const expectedHmac = createHmac("sha256", getSecret()).update(data).digest("hex");
  return hmac === expectedHmac;
}

export async function login(password) {
  if (process.env.NODE_ENV === "production" && ADMIN_PASSWORD === "changeme") {
    console.error("[auth] Refusing login: ADMIN_PASSWORD is still the default. Set a strong password in your environment.");
    return null;
  }
  if (password !== ADMIN_PASSWORD) return null;
  return createSignedToken();
}

export async function verify(token) {
  return verifySignedToken(token);
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
