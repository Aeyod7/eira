import { verify, getTokenFromRequest } from "../../lib/auth.js";

// GET /api/admin/me — returns whether the current session is valid.
// Used by the admin UI to show login vs. dashboard.
export default async function handler(req, res) {
  const token = getTokenFromRequest(req);
  const ok = await verify(token);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ authenticated: ok }));
}
