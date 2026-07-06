// Database client — works for local dev (SQLite file) and prod (Turso/libSQL).
// Env vars (prod): LIBSQL_URL (libsql://...) + LIBSQL_AUTH_TOKEN
// Env vars (dev):  LIBSQL_URL=file:./data/eira.db  (no token)
import { createClient } from "@libsql/client";

const url = process.env.LIBSQL_URL || "file:./data/eira.db";
const authToken = process.env.LIBSQL_AUTH_TOKEN; // undefined in local dev

export const db = createClient({ url, authToken });

// Single source of truth for schema. Idempotent — safe to run on every cold start.
export async function ensureSchema() {
  await db.batch([
    // Cloaked affiliate links — the "go" table.
    // One row per short slug. Editing a destination here updates every post that references it.
    `CREATE TABLE IF NOT EXISTS links (
      slug        TEXT PRIMARY KEY,
      destination TEXT NOT NULL,
      label       TEXT,
      network     TEXT,              -- 'amazon' | 'awin' | 'other'
      post_slug   TEXT,              -- which post (if any) this link belongs to
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Click events — one row per redirect. Aggregate by slug + date for analytics.
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

    // Email subscribers.
    `CREATE TABLE IF NOT EXISTS subscribers (
      email       TEXT PRIMARY KEY,
      source      TEXT,              -- 'home' | 'post' | 'about' | etc.
      subscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // CMS posts. body_html holds the rendered post content (everything between
    // the disclosure and the email-capture block). The SSR route wraps it in the
    // site chrome (header/footer/styles) so posts are SEO-crawlable as full HTML.
    `CREATE TABLE IF NOT EXISTS posts (
      slug        TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      category    TEXT NOT NULL,
      meta_description TEXT,
      eyebrow     TEXT,              -- e.g. "Skincare · Amazon UK Finds"
      read_time   TEXT,              -- e.g. "6 min read"
      intro_html  TEXT,              -- 2-4 sentence intro (no narrator)
      body_html   TEXT NOT NULL,     -- product blocks + sections
      og_image    TEXT,              -- pin image path
      published   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Admin sessions — simple opaque token, single admin.
    `CREATE TABLE IF NOT EXISTS admin_sessions (
      token       TEXT PRIMARY KEY,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at  TEXT NOT NULL
    )`,

    // Standalone products — decoupled from posts. A product can exist,
    // be published, and shown on /shop without any post referencing it.
    `CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,           -- url-safe, admin reference only
      name        TEXT NOT NULL,
      image_url   TEXT,
      category    TEXT,                           -- e.g. Beauty, Skincare, Skincare, Fashion, Fitness
      why_html    TEXT,                           -- "why this works" copy
      link_slug   TEXT,                           -- references links.slug (cloaked /go/:slug)
      link_label  TEXT,                           -- e.g. "Check price on Amazon UK"
      published   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    // Join table: a post references multiple standalone products in order.
    // section_heading and image_text are per-post display overrides.
    `CREATE TABLE IF NOT EXISTS post_products (
      post_slug       TEXT NOT NULL,
      product_id      INTEGER NOT NULL,
      position        INTEGER NOT NULL DEFAULT 0,
      section_heading TEXT,                        -- override, defaults to "The shortlist"
      image_text      TEXT,                        -- override, e.g. "01"
      PRIMARY KEY (post_slug, product_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )`,

    // Hero slideshow images — rotating background images for the homepage.
    `CREATE TABLE IF NOT EXISTS hero_slides (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url      TEXT NOT NULL,                 -- background image URL
      position       INTEGER NOT NULL DEFAULT 0,    -- display order
      is_active      INTEGER NOT NULL DEFAULT 1,     -- 1 = visible, 0 = hidden
      focal_position TEXT NOT NULL DEFAULT 'center', -- CSS background-position: e.g. center, top, bottom
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  ], "write");

  // Migrations — add columns that didn't exist in the original schema.
  // ALTER TABLE ... ADD COLUMN fails if the column already exists, so wrap in try/catch.
  try { await db.execute(`ALTER TABLE posts ADD COLUMN products_json TEXT`); } catch {}
  try { await db.execute(`ALTER TABLE posts ADD COLUMN extra_sections_html TEXT`); } catch {}
  try { await db.execute(`ALTER TABLE products ADD COLUMN category TEXT`); } catch {}
  try { await db.execute(`ALTER TABLE hero_slides ADD COLUMN focal_position TEXT NOT NULL DEFAULT 'center'`); } catch {}
}
