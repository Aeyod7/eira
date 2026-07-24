// Database client — works for local dev (SQLite file) and prod (Turso/libSQL).
// Env vars (prod): LIBSQL_URL (libsql://...) + LIBSQL_AUTH_TOKEN
// Env vars (dev):  LIBSQL_URL=file:./data/eira.db  (no token)
import { createClient } from "@libsql/client";

let url = process.env.LIBSQL_URL || "file:./data/eira.db";
if (process.env.VERCEL && (url.startsWith("file:.") || url.startsWith("file:data") || url.indexOf("libsql://") === -1)) {
  url = "file:/tmp/eira.db";
}
const authToken = process.env.LIBSQL_AUTH_TOKEN; // undefined in local dev

export const db = createClient({ url, authToken });

const starterPosts = [
  {
    slug: "10-best-amazon-uk-skincare-finds-dark-skin",
    title: "10 Best Amazon UK Skincare Finds for Dark Skin",
    category: "Skincare",
    meta_description: "The shortlist of Amazon UK skincare picks for dark skin — hyperpigmentation, glow, and barrier repair. All Prime-eligible, with skin-tone context.",
    eyebrow: "Skincare · Amazon UK Finds",
    read_time: "6 min read · Updated July 2026",
    og_image: "pins/post-1-pin-a.svg",
    intro_html: `<p>Finding skincare on Amazon UK that actually works for dark skin means filtering for three things: actives that target hyperpigmentation without irritation, formulas that don&rsquo;t leave a grey cast, and brands that ship fast on Prime. The shortlist below covers barrier repair, glow, and tone-evening &mdash; each with the context a pin image can&rsquo;t hold.</p>`,
    body_html: `<h2>The shortlist</h2>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">01</div><div><h3>Glow-boosting vitamin C serum</h3><p class="why">Why this works: a 15% L-ascorbic formula that brightens post-acne marks on deep complexions without the stinging that higher concentrations cause. Layer under SPF in the morning.</p><a class="affiliate-link" href="/go/vitamin-c-serum" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">02</div><div><h3>Barrier-repair ceramide cream</h3><p class="why">Why this works: ceramides plus niacinamide at 4% — the sweet spot for evening tone on melanin-rich skin without flushing. Thick enough for overnight, no grey residue.</p><a class="affiliate-link" href="/go/ceramide-cream" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>`
  },
  {
    slug: "7-soft-girl-cardigans-amazon-uk-under-30",
    title: "7 Soft Girl Cardigans on Amazon UK Under £30",
    category: "Soft Girl Fashion",
    meta_description: "Pastel knits with real sizing notes — what fits curvy, what runs small. Seven Amazon UK cardigans under £30 for the soft girl wardrobe.",
    eyebrow: "Soft Girl Fashion · Amazon UK Finds",
    read_time: "5 min read · Updated July 2026",
    og_image: "pins/post-2-pin-a.svg",
    intro_html: `<p>The soft girl wardrobe lives or dies on the cardigan. Below are seven Amazon UK picks under &pound;30 &mdash; each with the sizing context Pinterest won&rsquo;t tell you.</p>`,
    body_html: `<h2>The shortlist</h2>`
  }
];

const starterLinks = [
  ["vitamin-c-serum", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  ["ceramide-cream", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  ["blush-cropped-cardigan", "amazon", "7-soft-girl-cardigans-amazon-uk-under-30"]
];

// Single source of truth for schema. Idempotent — safe to run on every cold start.
export async function ensureSchema() {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS links (
      slug        TEXT PRIMARY KEY,
      destination TEXT NOT NULL,
      label       TEXT,
      network     TEXT,
      post_slug   TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS clicks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      slug       TEXT NOT NULL,
      referrer   TEXT,
      ua         TEXT,
      clicked_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (slug) REFERENCES links(slug) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_clicks_slug ON clicks(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_clicks_date ON clicks(clicked_at)`,
    `CREATE TABLE IF NOT EXISTS subscribers (
      email       TEXT PRIMARY KEY,
      source      TEXT,
      subscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS posts (
      slug        TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      category    TEXT NOT NULL,
      meta_description TEXT,
      eyebrow     TEXT,
      read_time   TEXT,
      intro_html  TEXT,
      body_html   TEXT NOT NULL,
      og_image    TEXT,
      published   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS admin_sessions (
      token       TEXT PRIMARY KEY,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at  TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      image_url   TEXT,
      category    TEXT,
      why_html    TEXT,
      link_slug   TEXT,
      link_label  TEXT,
      published   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS post_products (
      post_slug       TEXT NOT NULL,
      product_id      INTEGER NOT NULL,
      position        INTEGER NOT NULL DEFAULT 0,
      section_heading TEXT,
      image_text      TEXT,
      PRIMARY KEY (post_slug, product_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )`,
    `CREATE TABLE IF NOT EXISTS hero_slides (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url      TEXT NOT NULL,
      position       INTEGER NOT NULL DEFAULT 0,
      is_active      INTEGER NOT NULL DEFAULT 1,
      focal_position TEXT NOT NULL DEFAULT 'center',
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  ], "write");

  try { await db.execute(`ALTER TABLE posts ADD COLUMN products_json TEXT`); } catch {}
  try { await db.execute(`ALTER TABLE posts ADD COLUMN extra_sections_html TEXT`); } catch {}
  try { await db.execute(`ALTER TABLE products ADD COLUMN category TEXT`); } catch {}
  try { await db.execute(`ALTER TABLE products ADD COLUMN price TEXT`); } catch {}
  try { await db.execute(`ALTER TABLE hero_slides ADD COLUMN focal_position TEXT NOT NULL DEFAULT 'center'`); } catch {}

  // Auto-seed if posts table is empty
  try {
    const postCount = await db.execute("SELECT COUNT(*) as cnt FROM posts");
    if (postCount.rows[0].cnt === 0) {
      for (const p of starterPosts) {
        await db.execute({
          sql: `INSERT INTO posts (slug, title, category, meta_description, eyebrow, read_time, intro_html, body_html, og_image, published)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1) ON CONFLICT(slug) DO NOTHING`,
          args: [p.slug, p.title, p.category, p.meta_description, p.eyebrow, p.read_time, p.intro_html, p.body_html, p.og_image]
        });
      }
      for (const [slug, network, post_slug] of starterLinks) {
        await db.execute({
          sql: `INSERT INTO links (slug, destination, network, post_slug) VALUES (?, ?, ?, ?) ON CONFLICT(slug) DO NOTHING`,
          args: [slug, "https://www.amazon.co.uk/?tag=eira-21", network, post_slug]
        });
      }
    }
  } catch (e) {
    console.error("[db] Auto-seed error:", e.message);
  }
}
