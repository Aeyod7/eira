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
      summary     TEXT,
      meta_description TEXT,
      eyebrow     TEXT,
      read_time   TEXT,
      intro_html  TEXT,
      body_html   TEXT NOT NULL,
      og_image    TEXT,
      image_alt   TEXT,
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
  try { await db.execute(`ALTER TABLE posts ADD COLUMN summary TEXT`); } catch {}
  try { await db.execute(`ALTER TABLE posts ADD COLUMN image_alt TEXT`); } catch {}
  try { await db.execute(`ALTER TABLE products ADD COLUMN category TEXT`); } catch {}
  try { await db.execute(`ALTER TABLE products ADD COLUMN price TEXT`); } catch {}
  try { await db.execute(`ALTER TABLE hero_slides ADD COLUMN focal_position TEXT NOT NULL DEFAULT 'center'`); } catch {}

}
