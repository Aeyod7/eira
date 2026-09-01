import { db, ensureSchema } from "../../lib/db.js";
import { verify, getTokenFromRequest } from "../../lib/auth.js";

// GET /api/post/:slug  (exposed as /post/:slug via vercel.json rewrite)
// Server-renders a full HTML page from the DB row. SEO-crawlable.
// Unpublished posts 404 unless the admin cookie is present (preview).
const SITE = process.env.SITE_URL || "https://eira.example";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function imageUrl(value, absolute = false) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (!/^[a-z0-9_./-]+$/i.test(url)) return "";
  const path = `/${url.replace(/^\/+/, "")}`;
  return absolute ? `${SITE}${path}` : path;
}

// Legacy posts may still contain product cards in body_html. Keep their prose
// available while ensuring retired commerce blocks never reach the public page.
function stripLegacyProductSections(html) {
  return String(html || "").replace(
    /<section\b[^>]*class=["'][^"']*\bproduct-block\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi,
    ""
  );
}

// CMS-authored internal post links may omit the leading slash. On a post page,
// `post/example/` would otherwise resolve relative to the current post URL.
function normalizeInternalPostLinks(html) {
  return String(html || "").replace(/(\bhref\s*=\s*["'])post\//gi, "$1/post/");
}

export default async function handler(req, res) {
  await ensureSchema();
  const slug = req.query?.slug;
  if (!slug) {
    res.statusCode = 404;
    return res.end("Not found");
  }

  const notFoundHtml = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Post not found — Eira</title>
  <meta name="robots" content="noindex" />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/theme-warm.css" />
</head>
<body>
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="/" aria-label="Eira — home">Eira</a>
    </div>
  </header>
  <main id="main">
    <section class="section">
      <div class="container container--narrow" style="text-align:center;">
        <p class="eyebrow">404</p>
        <h1>Post not found</h1>
        <p>This post may have been moved or unpublished.</p>
        <p style="margin-top: var(--space-8);"><a class="btn btn--primary" href="/blog.html">Browse the Journal</a></p>
      </div>
    </section>
  </main>
</body>
</html>`;

  const r = await db.execute({ sql: `SELECT * FROM posts WHERE slug = ?`, args: [slug] });
  if (r.rows.length === 0) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(notFoundHtml);
  }
  const p = r.rows[0];
  if (!p.published && !(await verify(getTokenFromRequest(req)))) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(notFoundHtml);
  }

  const displayImage = imageUrl(p.og_image);
  const ogImage = imageUrl(p.og_image, true) || `${SITE}/pins/home-pin.svg`;
  const title = escapeHtml(p.title);
  const descriptionText = p.meta_description || p.summary || p.title;
  const desc = escapeHtml(descriptionText);
  const summary = escapeHtml(p.summary || "");
  const imageAlt = escapeHtml(p.image_alt || p.title);
  const eyebrow = escapeHtml(p.eyebrow || "");
  const readTime = escapeHtml(p.read_time || "");
  const intro = normalizeInternalPostLinks(p.intro_html);

  let body = normalizeInternalPostLinks(stripLegacyProductSections(p.body_html));
  if (p.extra_sections_html) body += "\n" + normalizeInternalPostLinks(stripLegacyProductSections(p.extra_sections_html));

  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Eira</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${SITE}/post/${encodeURIComponent(slug)}/" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": ${JSON.stringify(p.title)},
    "description": ${JSON.stringify(descriptionText)},
    "image": ${JSON.stringify(ogImage)},
    "datePublished": ${JSON.stringify(String(p.created_at || "").replace(" ", "T"))},
    "dateModified": ${JSON.stringify(String(p.updated_at || "").replace(" ", "T"))},
    "mainEntityOfPage": ${JSON.stringify(`${SITE}/post/${encodeURIComponent(slug)}/`)},
    "author": { "@type": "Organization", "name": "Eira" },
    "publisher": { "@type": "Organization", "name": "Eira" }
  }
  </script>
  <meta property="og:site_name" content="Eira" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${SITE}/post/${encodeURIComponent(slug)}/" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:alt" content="${imageAlt}" />
  <meta property="og:image:width" content="1000" />
  <meta property="og:image:height" content="1500" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${ogImage}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/fontawesome.min.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/solid.min.css" />
  <link rel="stylesheet" href="/theme-warm.css?v=20260901-post-newsletter" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="/" aria-label="Eira — home">Eira</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">Menu</button>
      <nav id="primary-nav" class="nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/blog.html">Journal</a>
        <a href="/about.html">About</a>
      </nav>
    </div>
  </header>

  <main id="main">
    <article class="section">
      <div class="container container--narrow">
        <header class="post-header">
          <p class="eyebrow">${eyebrow}</p>
          <h1>${title}</h1>
          ${summary ? `<p class="post-dek">${summary}</p>` : ""}
          <p class="post-meta">${readTime}</p>
        </header>

        ${displayImage ? `<figure class="post-featured-image"><img src="${escapeHtml(displayImage)}" alt="${imageAlt}" /></figure>` : ""}

        ${intro}

        ${body}

      </div>

      <div class="container post-newsletter-wrap">
        <div class="newsletter-strip newsletter-reset">
          <div class="newsletter-reset__content">
            <h2>WE TALK ABOUT<br />THINGS.<br />YOU ARE SCARED<br />TO CONFRONT ALONE.</h2>
            <p class="newsletter-reset__intro">Get our 7-page pdf,<strong>“ The Identity &amp; Routine Reset Guide for Ambitious Women”</strong> + our sunday letter on dark-skin beauty and self trust.</p>
            <form class="newsletter-strip__form" novalidate>
              <div class="newsletter-strip__inputwrap">
                <label for="email-post" class="sr-only">Email address</label>
                <div class="newsletter-reset__field">
                  <i class="fa-solid fa-envelope" aria-hidden="true"></i>
                  <input class="input" id="email-post" name="email" type="email" placeholder="Enter your best email…" required autocomplete="email" />
                </div>
                <button class="btn newsletter-reset__button" type="submit" data-idle-label="Get the free reset guide" data-pending-label="Sending your guide…">Get the free reset guide</button>
              </div>
              <span class="field__error" id="email-post-err" aria-live="polite"></span>
            </form>
            <p class="newsletter-reset__note"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Join 500+ Ambitious Growing women. 3minutes sunday beauty guide boost. 100% free</p>
          </div>
        </div>
      </div>
    </article>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <p class="footer-brand">Eira</p>
          <p style="color: var(--color-accent-soft); max-width: 38ch;">An independent journal about self discovery, life and beauty — made for readers, not algorithms.</p>
        </div>
        <div class="footer-col">
          <h4>Categories</h4>
          <ul>
            <li><a href="/blog.html?category=Self%20Discovery">Self Discovery</a></li>
            <li><a href="/blog.html?category=Life">Life</a></li>
            <li><a href="/blog.html?category=Beauty">Beauty</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; 2026 Eira. All rights reserved.</span>
        <span>Made for readers, not algorithms.</span>
      </div>
    </div>
  </footer>

  <script>
    (function () {
      var toggle = document.querySelector('.nav-toggle');
      var nav = document.getElementById('primary-nav');
      if (!toggle || !nav) return;
      toggle.addEventListener('click', function () {
        var open = nav.getAttribute('data-open') === 'true';
        nav.setAttribute('data-open', String(!open));
        toggle.setAttribute('aria-expanded', String(!open));
      });
    })();
    document.querySelectorAll('.newsletter-strip__form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var err = form.querySelector('.field__error');
        var btn = form.querySelector('button[type="submit"]');
        var idleLabel = btn ? (btn.getAttribute('data-idle-label') || 'Subscribe') : 'Subscribe';
        var pendingLabel = btn ? (btn.getAttribute('data-pending-label') || 'Subscribing…') : 'Subscribing…';
        if (!input) return;
        var valid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(input.value);
        if (!valid) { input.setAttribute('aria-invalid','true'); if (err) err.textContent = 'Please enter a valid email address.'; return; }
        input.setAttribute('aria-invalid','false'); if (err) err.textContent = '';
        if (btn) { btn.setAttribute('aria-busy','true'); btn.textContent = pendingLabel; btn.disabled = true; }
        fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: input.value, source: 'post-ssr' })
        }).then(function (r) { return r.json(); }).then(function (data) {
          if (data.ok) { if (btn) { btn.textContent = 'Guide sent ✓'; } }
          else { if (btn) { btn.textContent = idleLabel; btn.disabled = false; btn.removeAttribute('aria-busy'); } if (err) err.textContent = data.error || 'Something went wrong.'; }
        }).catch(function () { if (btn) { btn.textContent = 'Try again'; btn.disabled = false; btn.removeAttribute('aria-busy'); } });
      });
    });
  </script>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(html);
}
