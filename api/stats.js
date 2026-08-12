import { db, ensureSchema } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

// Editorial dashboard data. Legacy click/link fields remain in the response so
// older clients do not break while the current studio focuses on the Journal.
export default async function handler(req, res) {
  return requireAuth(async (req, res) => {
    await ensureSchema();

    const [subs, postTotals, categoryCounts, recentPosts, totalClicks, topLinks, recentSubs] = await Promise.all([
      db.execute(`SELECT COUNT(*) AS n FROM subscribers`),
      db.execute(`SELECT COUNT(*) AS total,
                         SUM(CASE WHEN published = 1 THEN 1 ELSE 0 END) AS published,
                         SUM(CASE WHEN published = 0 THEN 1 ELSE 0 END) AS drafts
                  FROM posts`),
      db.execute(`SELECT category, COUNT(*) AS n
                  FROM posts
                  WHERE category IN ('Self Discovery', 'Life', 'Beauty')
                  GROUP BY category`),
      db.execute(`SELECT slug, title, category, published, updated_at
                  FROM posts
                  ORDER BY datetime(updated_at) DESC
                  LIMIT 6`),
      db.execute(`SELECT COUNT(*) AS n FROM clicks`),
      db.execute(`SELECT l.slug, l.destination, l.label, l.post_slug,
                         (SELECT COUNT(*) FROM clicks c WHERE c.slug = l.slug) AS clicks
                  FROM links l
                  ORDER BY clicks DESC
                  LIMIT 10`),
      db.execute(`SELECT email, source, subscribed_at
                  FROM subscribers
                  ORDER BY datetime(subscribed_at) DESC
                  LIMIT 5000`)
    ]);

    const totals = postTotals.rows[0] || {};
    const categories = { "Self Discovery": 0, Life: 0, Beauty: 0 };
    for (const row of categoryCounts.rows) categories[row.category] = Number(row.n || 0);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      subscribers: Number(subs.rows[0]?.n || 0),
      total_posts: Number(totals.total || 0),
      published_posts: Number(totals.published || 0),
      draft_posts: Number(totals.drafts || 0),
      category_counts: categories,
      recent_posts: recentPosts.rows,
      total_clicks: Number(totalClicks.rows[0]?.n || 0),
      top_links: topLinks.rows,
      recent_subscribers: recentSubs.rows
    }));
  })(req, res);
}
