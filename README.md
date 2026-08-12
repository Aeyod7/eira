# Eira

Eira is an independent editorial journal about Self Discovery, Life and Beauty. The project uses a static HTML/CSS frontend, a small serverless API, a libSQL database and a private editorial studio.

## Current structure

- `public/index.html` — Home
- `public/blog.html` — Journal archive and category filters
- `public/about.html` — About
- `public/admin.html` — private editorial studio
- `api/posts/index.js` — Journal post CRUD
- `api/post/[slug].js` — server-rendered article pages
- `api/subscribe.js` — reader subscriptions
- `api/newsletter.js` — newsletter status and sends
- `api/stats.js` — editorial dashboard and subscriber data
- `api/uploads.js` — authenticated story-image uploads
- `lib/db.js` — database client and idempotent schema

Legacy affiliate and hero tables/routes remain available for data compatibility, but they are not part of the public site or editorial studio.

## Editorial model

Every new story belongs to exactly one category:

- Self Discovery
- Life
- Beauty

Stories can be saved as drafts or published. Only published stories in those three categories appear on the public site. The studio includes a rich-text writer, standfirsts, featured images and image descriptions, live writing metrics, SEO guidance, a publish-readiness checklist, local draft recovery, search and filters, subscriber export and newsletter sending.

## Local development

```powershell
npm install
npm run migrate
npm run dev
```

- Site: `http://localhost:3000/`
- Journal: `http://localhost:3000/blog.html`
- Studio: `http://localhost:3000/admin.html`

Local configuration is read from `.env`. Set at least:

```text
ADMIN_PASSWORD=use-a-strong-password
LIBSQL_URL=file:./data/eira.db
```

The development fallback password is `changeme`; production login refuses that default.

## Production configuration

Set these environment variables in Vercel:

- `LIBSQL_URL`
- `LIBSQL_AUTH_TOKEN`
- `ADMIN_PASSWORD`
- `SITE_URL`
- `BLOB_READ_WRITE_TOKEN` for persistent image uploads
- `RESEND_API_KEY` and `FROM_EMAIL` for newsletters

Run `npm run migrate` against the production database before first use, then deploy normally.

## Admin workflow

1. Sign in to `/admin.html`.
2. Open Journal and create a story.
3. Choose Self Discovery, Life or Beauty.
4. Add the title, standfirst, story, search description and optional featured image with accessible description.
5. Save as a draft or publish.
6. Use Preview to review a saved story in the public article layout.

Subscribers and newsletter tools live in their own studio sections. Always send a test email before a full newsletter broadcast.
