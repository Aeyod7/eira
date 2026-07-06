import { db, ensureSchema } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

// GET /api/stats — dashboard numbers (admin)
// Returns: subscriber count, total clicks, top links by clicks, recent subscribers.
export default async function handler(req, res) {
  return requireAuth(async (req, res) => {
    await ensureSchema();

    const [subs, totalClicks, topLinks, recentSubs] = await Promise.all([
      db.execute(`SELECT COUNT(*) AS n FROM subscribers`),
      db.execute(`SELECT COUNT(*) AS n FROM clicks`),
      db.execute(
        `SELECT l.slug, l.destination, l.label, l.post_slug,
                (SELECT COUNT(*) FROM clicks c WHERE c.slug = l.slug) AS clicks
         FROM links l
         ORDER BY clicks DESC
         LIMIT 10`
      ),
      db.execute(`SELECT email, source, subscribed_at FROM subscribers ORDER BY datetime(subscribed_at) DESC LIMIT 20`)
    ]);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      subscribers: subs.rows[0]?.n ?? 0,
      total_clicks: totalClicks.rows[0]?.n ?? 0,
      top_links: topLinks.rows,
      recent_subscribers: recentSubs.rows
    }));
  })(req, res);
}
