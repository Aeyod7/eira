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

// Generate body HTML from structured product data (the products_json column).
// Each product: { name, image_text, why, link_slug, section_heading }
// Products with the same section_heading are grouped under an <h2>.
function renderProductsHtml(products) {
  if (!Array.isArray(products) || products.length === 0) return "";
  const sections = {};
  const sectionOrder = [];
  for (const p of products) {
    const heading = p.section_heading || "The shortlist";
    if (!sections[heading]) { sections[heading] = []; sectionOrder.push(heading); }
    sections[heading].push(p);
  }
  let html = "";
  for (const heading of sectionOrder) {
    html += `<h2>${escapeHtml(heading)}</h2>\n`;
    for (const p of sections[heading]) {
      const num = String(sections[heading].indexOf(p) + 1).padStart(2, "0");
      const link = p.link_slug ? `/go/${encodeURIComponent(p.link_slug)}` : "#";
      const linkAttr = p.link_slug ? 'rel="sponsored nofollow noopener" target="_blank"' : '';
      const linkText = p.link_label || "Check price on Amazon UK";
      const media = p.image_url
        ? `<img class="product-block__media" src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name || "Product image")}" loading="lazy" />`
        : `<div class="product-block__media" role="img" aria-label="Product image">${escapeHtml(p.image_text || num)}</div>`;
      html += `<section class="product-block">
  ${media}
  <div>
    <h3>${escapeHtml(p.name || "Untitled product")}</h3>
    <a class="affiliate-link" href="${link}" ${linkAttr}>${escapeHtml(linkText)}</a>
  </div>
</section>\n`;
    }
  }
  return html;
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
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Raleway:wght@300;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
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
        <p style="margin-top: var(--space-8);"><a class="btn btn--primary" href="/blog.html">Browse all posts</a></p>
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

  const ogImage = p.og_image ? `${SITE}/${p.og_image.replace(/^\/+/, "")}` : `${SITE}/pins/home-pin.svg`;
  const title = escapeHtml(p.title);
  const desc = escapeHtml(p.meta_description || p.title);
  const eyebrow = escapeHtml(p.eyebrow || "");
  const readTime = escapeHtml(p.read_time || "");
  const intro = p.intro_html || "";

  // If products_json exists, generate body_html from it (structured editor source of truth).
  // Otherwise fall back to the stored body_html (legacy/seeded posts).
  let body = p.body_html || "";
  if (p.products_json) {
    try {
      const products = JSON.parse(p.products_json);
      body = renderProductsHtml(products);
    } catch (e) { /* keep stored body_html */ }
  }

  // Also render attached standalone products (post_products join).
  const attached = await db.execute({
    sql: `SELECT p.id, p.slug, p.name, p.image_url, p.why_html, p.link_slug, p.link_label,
                 pp.position, pp.section_heading, pp.image_text
          FROM post_products pp
          JOIN products p ON p.id = pp.product_id
          WHERE pp.post_slug = ?
          ORDER BY pp.position ASC`,
    args: [slug]
  });
  if (attached.rows.length > 0) {
    // Convert attached rows to the same shape renderProductsHtml expects.
    const attachedProducts = attached.rows.map(r => ({
      name: r.name,
      image_url: r.image_url,
      image_text: r.image_text,
      why: r.why_html,
      link_slug: r.link_slug,
      link_label: r.link_label,
      section_heading: r.section_heading || "The shortlist"
    }));
    body += "\n" + renderProductsHtml(attachedProducts);
  }

  if (p.extra_sections_html) body += "\n" + p.extra_sections_html;

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
    "description": ${JSON.stringify(p.meta_description || p.title)},
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
  <meta property="og:image:width" content="1000" />
  <meta property="og:image:height" content="1500" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${ogImage}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Raleway:wght@300;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="/" aria-label="Eira — home">Eira</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">Menu</button>
      <nav id="primary-nav" class="nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/category.html?category=Beauty">Beauty</a>
        <a href="/category.html?category=Skincare">Skincare</a>
        <a href="/category.html?category=Fashion">Fashion</a>
        <a href="/category.html?category=Fitness">Fitness</a>
        <a href="/blog.html">Blog</a>
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
          <p class="post-meta">${readTime}</p>
        </header>

        <p class="disclosure">
          <strong>Affiliate disclosure:</strong> As an Amazon Associate I earn from qualifying purchases. This post contains affiliate links and AWIN links &mdash; if you click through and buy, Eira may earn a commission at no extra cost to you.
        </p>

        ${intro}

        ${body}

        <div class="newsletter-strip">
          <div class="newsletter-strip__text">
            <p class="eyebrow" style="color: var(--color-accent-strong); margin-bottom: var(--space-2);">The weekly shortlist</p>
            <p class="newsletter-strip__title">Weekly finds, straight to your inbox.</p>
          </div>
          <form class="newsletter-strip__form" novalidate>
            <div class="newsletter-strip__inputwrap">
              <label for="email-post" class="sr-only">Email address</label>
              <input class="input" id="email-post" name="email" type="email" placeholder="you@example.com" required autocomplete="email" />
              <button class="btn btn--primary" type="submit">Subscribe</button>
            </div>
            <span class="field__error" aria-live="polite"></span>
          </form>
        </div>
      </div>
    </article>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <p class="footer-brand">Eira</p>
          <p style="color: var(--color-accent-soft); max-width: 38ch;">A beauty, skincare, fashion and fitness affiliate hub. Curated product picks and blog posts, with direct links to the retailers we trust.</p>
          <p style="font-size: var(--font-size-xs); color: var(--color-accent-soft); margin-top: var(--space-6);">
            As an Amazon Associate I earn from qualifying purchases. This site contains affiliate links &mdash; see full disclosure on each post.
          </p>
        </div>
        <div class="footer-col">
          <h4>Categories</h4>
          <ul>
            <li><a href="/category.html?category=Beauty">Beauty</a></li>
            <li><a href="/category.html?category=Skincare">Skincare</a></li>
            <li><a href="/category.html?category=Fashion">Fashion</a></li>
            <li><a href="/category.html?category=Fitness">Fitness</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Site</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/blog.html">Blog</a></li>
            <li><a href="/about.html">About</a></li>
            <li><a href="/privacy.html">Privacy</a></li>
            <li><a href="/terms.html">Terms</a></li>
            <li><a href="/contact.html">Contact</a></li>
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
        if (!input) return;
        var valid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(input.value);
        if (!valid) { input.setAttribute('aria-invalid','true'); if (err) err.textContent = 'Please enter a valid email address.'; return; }
        input.setAttribute('aria-invalid','false'); if (err) err.textContent = '';
        fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: input.value, source: 'post-ssr' })
        }).then(function () {
          if (btn) { btn.setAttribute('aria-busy','true'); btn.textContent = 'Subscribed ✓'; btn.disabled = true; }
        }).catch(function () {
          if (btn) { btn.textContent = 'Try again'; }
        });
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
