# Eira

Faceless beauty / fashion / self-care affiliate blog. Static frontend + Vercel serverless backend with link cloaking, click tracking, email capture, and a light CMS.

## Stack

- **Frontend:** static HTML/CSS in `public/` (Playfair Display + Raleway, pink/cream/brown palette)
- **Backend:** Vercel serverless functions in `api/` (Node, no framework)
- **Database:** Turso (libSQL) — SQLite locally, network-attached SQLite in prod
- **CMS:** single-page admin at `/admin.html` (login, structured post editor with product blocks + affiliate link selector, link manager, subscriber export, click stats)

## Project structure

```
public/              static site (served as-is)
  index.html         homepage
  blog.html          post archive
  category.html      category hub
  about.html         about page
  admin.html         CMS UI (noindex)
  styles.css         design tokens + components
  pins/              Pinterest pin SVGs (1000×1500)
api/                 serverless functions
  subscribe.js       POST  /api/subscribe       — email capture
  go/[slug].js       GET   /api/go/:slug        — cloaked redirect + click log
  post/[slug].js     GET   /api/post/:slug      — SSR post from DB (SEO)
  posts/index.js     GET/POST /api/posts        — list / create
  posts/[slug].js    GET/PUT/DELETE /api/posts/:slug
  links/index.js     GET/POST /api/links        — list / create cloaked links
  links/[slug].js    DELETE /api/links/:slug
  admin/login.js     POST  /api/admin/login
  admin/logout.js    POST  /api/admin/logout
  admin/me.js        GET   /api/admin/me
  stats.js           GET   /api/stats           — dashboard numbers
lib/
  db.js              Turso client + schema (idempotent)
  auth.js            session-token auth (single admin)
scripts/
  dev.js             local dev server (no Vercel CLI needed)
  seed.js            import the 5 starter posts + 31 affiliate links into the DB
  migrate.js         just runs ensureSchema()
vercel.json          rewrites: /go/:slug → /api/go/:slug, /post/:slug → /api/post/:slug
```

## Quick start (local)

```bash
npm install
cp .env.example .env       # edit ADMIN_PASSWORD
npm run seed               # creates data/eira.db + seeds starter content
npm run dev                # http://localhost:3000
```

Then:
- Site: http://localhost:3000
- CMS:  http://localhost:3000/admin.html (sign in with your `ADMIN_PASSWORD`)
- Sample post (SSR from DB): http://localhost:3000/post/10-best-amazon-uk-skincare-finds-dark-skin/
- Sample cloaked link: http://localhost:3000/go/vitamin-c-serum

## Deploy to Vercel + Turso

### 1. Create the Turso database
```bash
npm i -g @turso/cli
turso auth login
turso db create eira --location lhr     # London — UK traffic priority
turso db tokens create eira             # prints your auth token
turso db show eira --url                # prints your libsql:// URL
```

### 2. Push the schema + seed
Set the env vars locally just for the seed run:
```bash
$env:LIBSQL_URL="libsql://eira-XXXX.turso.io"
$env:LIBSQL_AUTH_TOKEN="eyJhbGciOi..."
npm run seed
```

### 3. Deploy to Vercel
```bash
npm i -g vercel
vercel              # follow prompts; link the project
```

In the Vercel dashboard → Project → Settings → Environment Variables, add:
| Key | Value |
|---|---|
| `LIBSQL_URL` | `libsql://eira-XXXX.turso.io` |
| `LIBSQL_AUTH_TOKEN` | (token from step 1) |
| `ADMIN_PASSWORD` | (a strong password — NOT `changeme`) |
| `SITE_URL` | `https://your-domain.com` |
| `RESEND_API_KEY` | (from https://resend.com — enables welcome + newsletter emails) |
| `FROM_EMAIL` | `Eira <hello@your-domain.com>` (domain must be verified in Resend) |

Then `vercel --prod`.

### 4. Wire your real affiliate links
Sign in at `/admin.html` → **Links** tab. Replace each placeholder destination with your real Amazon Associates / AWIN tracking URL. Every post that references `/go/<slug>` updates instantly — no post edits needed.

## How the pieces fit

- **Posts** live in the `posts` table and are rendered server-side at `/post/:slug` — SEO-crawlable, full OG/Pinterest meta.
- **Affiliate links** are stored once in the `links` table. Posts reference `/go/<slug>`; the redirect logs a click and 302s to the real destination. Edit a destination in the CMS → every post updates.
- **Email signups** POST to `/api/subscribe` and land in the `subscribers` table. Export to CSV from the admin Subscribers tab.
- **Click stats** appear in the admin Stats tab. Each `/go/:slug` hit inserts a row in `clicks` with referrer + UA.
- **Admin auth** is a single shared password (`ADMIN_PASSWORD`) → opaque session token in an `HttpOnly` cookie. 7-day TTL. Fine for a solo blog; upgrade to OAuth if you ever add users.

## CMS UI (`/admin.html`)

**Stats tab** — subscriber count, total clicks, top links by clicks, recent subscribers.

**Posts tab** — structured post editor, not raw HTML:
- Category dropdown (the 6 categories from the build guide)
- Post title, eyebrow, read time, meta description, OG image path
- Intro paragraph field
- **Product blocks**: add/remove/reorder, each with:
  - Product name
  - Section heading (group products under different H2s)
  - Image placeholder text
  - "Why this works" text
  - Affiliate link dropdown (picks from cloaked `/go/` links)
- Extra sections HTML (closing tips, styling combos, etc.)
- Live preview pane (renders exactly how the SSR post will look)
- Published/Draft toggle
- When opening an existing seeded post, the editor auto-parses the legacy HTML into structured product blocks

**Links tab** — create/edit/delete cloaked affiliate links. Shows which post each link is attached to (by title), click counts, and network (Amazon/AWIN/Other). Create links here first, then attach them to products in the post editor.

**Subscribers tab** — recent signups + CSV export.

## Before you go live

1. **Change `ADMIN_PASSWORD`** — the default is `changeme`.
2. **Swap affiliate link destinations** in the CMS Links tab (placeholders point at `amazon.co.uk/?tag=eira-21`).
3. **Replace `eira.example`** in `og:url` / `twitter:image` meta with your real domain (set `SITE_URL` env var for SSR posts).
4. **Export pin SVGs to PNG** — Pinterest/Twitter don't reliably render SVG `og:image`. Open each `public/pins/*.svg` in a browser and export 1000×1500 PNG with the same basename, then update `og:image` URLs from `.svg` to `.png`.
5. **Set up Resend** (email) — create a free account at [resend.com](https://resend.com), verify your sending domain (add the SPF/DKIM DNS records), then set `RESEND_API_KEY` + `FROM_EMAIL`. You can send newsletters to the whole list from the admin **Newsletter** tab (compose + "Send test" to yourself first, then "Send to all subscribers"). Without `RESEND_API_KEY`, signups are still stored — just no email is sent. The **automatic welcome email** on signup is disabled by default; set `WELCOME_EMAIL_ENABLED=true` to turn it on.

## Legal

Affiliate disclosure is rendered automatically on every SSR post (directly under the title, ASA/CAP compliant). The static homepage and about page carry a site-wide disclosure in the footer. Don't remove either.
