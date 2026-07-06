# Eira Blog — Build Guide

**Purpose:** Build a WordPress affiliate content hub that Pinterest pins funnel into, replacing the current Pin → Linktree → Amazon flow with Pin → Blog Post → Multiple Affiliate Links (Amazon + AWIN).

This is an original build for Eira's own brand and content — not a clone of any existing site. Any resemblance in structure to standard affiliate-blog conventions (categories, in-post links, email capture) is intentional, since that structure is generic and unowned. All visual identity below is Eira's own.

---

## 1. Brand Identity (fixed — do not deviate)

| Element | Spec |
|---|---|
| Brand name | Eira |
| Positioning | Faceless beauty/fashion affiliate brand |
| Typography | Headings: **Playfair Display** (serif) · Body/UI: **Raleway** (sans) |
| Palette | Pink / cream / brown — confirm exact hex codes before build; do not reuse hex values from any other brand's site |
| Voice | No first-person "I tried this" narrator. Product-forward, styling-context-forward. Trust is built through visual proof (photos, swatches, "why this works") rather than personal anecdote. |

**Agent instruction:** Do not source colors, fonts, or component styling from any external URL, screenshot, or scraped file. Palette and type are defined above; if incomplete, ask for exact hex values before proceeding rather than inferring from a reference site.

---

## 2. Platform & Stack

- **CMS:** WordPress.org (self-hosted) — required for plugin flexibility and SEO control, not WordPress.com
- **Hosting:** Any standard WP host (SiteGround, Bluehost, or similar) — pick based on UK-based traffic priority since Amazon UK + AWIN are primary networks
- **Theme:** A generic, well-supported WordPress theme as the shell — Astra, Kadence, or GeneratePress. These are free/freemium themes built for this exact use case (fast, block-editor compatible, WooCommerce-optional). Do not use a paid theme cloned from another affiliate site.
- **Required plugins:**
  - **Rank Math** or **Yoast SEO** — on-page SEO, schema markup
  - **Pretty Links** or **ThirstyAffiliates** — cloak and centrally manage affiliate links (Amazon Associates + AWIN), so a dead/changed link is edited in one place instead of across every post
  - **WP Rocket** or **LiteSpeed Cache** — page speed (affects both SEO and Pinterest referral bounce rate)
  - **Mailchimp/ConvertKit/MailerLite integration plugin** — for the email capture (see Section 5)
  - **Amazon Associates disclosure plugin or manual disclosure block** — legally required, see Section 6

---

## 3. Site Architecture

### 3.1 Category Structure (the "hub" model)

Six top-level categories, each acting as a content hub with 5–10+ posts over time. Pins link to individual posts; posts cross-link to other categories via internal linking + a "Popular Posts" or "You May Also Like" widget.

1. **Dark Skin Makeup**
2. **Skincare**
3. **Soft Girl Fashion**
4. **Classy Sexy Outfits**
5. **Self-Care**
6. **Amazon UK Finds** (cross-category — can be a tag as well as a category, since it overlaps with the other five)

**Nav bar:** Home · [4 category links] · Amazon UK Finds · Blog (archive) · About (brief, brand-voice, no personal name/face required)

### 3.2 URL / Permalink Structure

`eira[domain]/category/post-title/` — clean, keyword-forward slugs (e.g. `/soft-girl-fashion/amazon-uk-cardigans-under-30/`)

### 3.3 Individual Post Template (standardize this — agent should build a reusable block pattern)

1. **Title** — keyword-forward, matches Pinterest pin's hook (e.g. "10 Best Amazon UK Skincare Finds for Dark Skin")
2. **Affiliate disclosure** — short, standard line, placed immediately under the title (legally required — see Section 6)
3. **Intro** — 2–4 sentences, no personal narrator, sets up the problem the post solves
4. **Body** — organized in scannable sections (H2/H3 per product or sub-topic), each with:
   - Product image
   - 1–2 sentence why-this-works note (skin tone match, sizing note, styling combo — the context Pinterest can't hold)
   - Cloaked affiliate link (via Pretty Links/ThirstyAffiliates) — Amazon Associates or AWIN depending on merchant
5. **Email capture block** — mid-post or end-of-post (see Section 5)
6. **Related posts / internal links** — auto-generated or manually curated, linking to 2–3 other posts across categories to keep sessions going
7. **Footer nav** — repeat of category links

---

## 4. Affiliate Link Mechanics

- Affiliate links are plain hyperlinks pointed at your Amazon Associates tracking URL or AWIN merchant tracking link — no special integration required beyond the cloaking plugin.
- Use Pretty Links/ThirstyAffiliates to create branded short-links (e.g. `eira.com/go/product-name`) instead of raw Amazon/AWIN URLs — cleaner in-post, and centrally editable if a product goes out of stock.
- Each post should carry **multiple** affiliate links (this is the entire point of the blog vs. a single-link pin) — aim for 5–10 per "listicle"-style post, fewer for single-product review posts.
- Track click-through by UTM-tagging or via the cloaking plugin's built-in analytics, so you know which posts/pins are actually converting.

---

## 5. Email Capture

- Yes — this is a legitimate second channel. A footer or mid-post signup field ("Get weekly Amazon UK finds") captures emails independent of Pinterest's algorithm.
- Start lightweight: a simple footer/end-of-post field is enough to start (no need for an aggressive popup on day one — popups can hurt bounce rate on organic/Pinterest traffic if overused).
- Connect it to an email tool (Mailchimp, ConvertKit, or MailerLite — free tiers exist under 500–1,000 subscribers).
- Use the list for: weekly roundup newsletters, new post announcements, occasional freebie delivery (see Section 7).

---

## 6. Legal / Disclosure Requirements

- **Amazon Associates** requires a visible affiliate disclosure on any page containing Amazon links — standard line: *"As an Amazon Associate I earn from qualifying purchases."* Place directly under the post title, not buried in a footer.
- **AWIN** merchants typically require similar disclosure — check individual merchant terms, but a general "This post contains affiliate links" statement covers most.
- **UK-specific:** ASA/CAP guidance requires affiliate links to be clearly and prominently disclosed (not just in a footer or About page) — the under-title placement satisfies this.

---

## 7. Monetization Beyond Affiliate Links

Realistic list of what actually adds revenue on top of Amazon/AWIN commissions:

- **AWIN discount code blocks** — a standing "current codes" section drives repeat visits and clicks
- **Display ads** (Mediavine, Ezoic, AdThrive) — only viable once traffic hits their minimum session thresholds (typically 25k–50k sessions/month for Mediavine); not a day-one strategy
- **Sponsored posts** — once traffic/following is established, brands pay directly for inclusion
- **Freebies are a list-building tool, not a revenue source themselves** — a free styling guide or checklist exists to grow the email list, which then drives repeat affiliate clicks via newsletter, not sold directly (unless later turned into a paid digital product, which is a separate monetization layer entirely)

---

## 8. Publishing Cadence (sustainable, not draining)

- Start at **1 post per week** — sustainable and enough to seed each of the 6 categories over ~6 weeks
- Each post should be reusable across **multiple pins** — one blog post can generate 3–5 different Pinterest pins over time (different pin images/hooks, same destination post), so content creation and pin creation are decoupled — you're not writing a new post for every pin
- Batch content: write/plan 2–3 posts in one sitting per month rather than trying to post fresh every few days — reduces the "draining" feeling significantly
- Re-promote old posts with new pins regularly — Pinterest rewards fresh pins even to old content, so the blog's value compounds without constant new writing

---

## 9. Build Order (for the agent)

1. Scaffold WordPress install + theme (Astra/Kadence/GeneratePress) with Eira's palette/typography applied globally
2. Set up category structure (Section 3.1) and nav
3. Build reusable post template/block pattern (Section 3.3)
4. Install and configure: SEO plugin, link-cloaking plugin, caching plugin, email plugin
5. Build homepage: hero (brand name/tagline, no personal face), category grid, "Popular Posts" widget, footer email capture
6. Build About page (brand voice, faceless, no name/face required)
7. Publish 2–3 seed posts (one per priority category) using the post template, each with 5+ cloaked affiliate links and a disclosure line
8. QA: confirm affiliate disclosure appears on every post with links, confirm cloaked links redirect correctly, confirm email capture submits successfully, confirm mobile responsiveness (majority of Pinterest traffic is mobile)

---

**Fill in before handing to agent:** exact hex codes for the pink/cream/brown palette, domain name, hosting provider, and which email tool you're using — the guide above references them generically so the agent doesn't infer wrong defaults.
