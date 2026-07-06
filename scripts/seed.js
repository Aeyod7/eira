// Seed the DB with the 5 existing posts + their cloaked affiliate links.
// Run:  node scripts/seed.js   (uses local SQLite by default; set LIBSQL_URL for Turso)
import { db, ensureSchema } from "../lib/db.js";

const posts = [
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
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">02</div><div><h3>Barrier-repair ceramide cream</h3><p class="why">Why this works: ceramides plus niacinamide at 4% — the sweet spot for evening tone on melanin-rich skin without flushing. Thick enough for overnight, no grey residue.</p><a class="affiliate-link" href="/go/ceramide-cream" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">03</div><div><h3>Gentle glycolic toner</h3><p class="why">Why this works: 4% glycolic at a low pH for cell turnover that fades dark spots gradually. Use 2–3 nights a week — over-exfoliation triggers more pigmentation on dark skin.</p><a class="affiliate-link" href="/go/glycolic-toner" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">04</div><div><h3>Mineral SPF 50, no white cast</h3><p class="why">Why this works: a tinted mineral SPF blended for medium-to-deep undertones. SPF is non-negotiable for hyperpigmentation — this one disappears without the chalky film.</p><a class="affiliate-link" href="/go/tinted-spf" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">05</div><div><h3>Tranexamic acid dark-spot treatment</h3><p class="why">Why this works: tranexamic acid is the active of choice for stubborn melasma and post-inflammatory marks on dark skin. Pair with the ceramide cream at night.</p><a class="affiliate-link" href="/go/tranexamic" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">06</div><div><h3>Hydrating hyaluronic cleanser</h3><p class="why">Why this works: a non-stripping gel cleanser that keeps the barrier intact — the foundation every brightening routine depends on. Fragrance-free.</p><a class="affiliate-link" href="/go/hyaluronic-cleanser" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">07</div><div><h3>Overnight retinal serum</h3><p class="why">Why this works: retinal (not retinol) at 0.05% — faster results, less irritation. Start twice a week; dark skin is prone to PIH if you push too hard.</p><a class="affiliate-link" href="/go/retinal-serum" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">08</div><div><h3>Squalane facial oil</h3><p class="why">Why this works: a dry-touch oil that seals in actives overnight without clogging. Particularly good over the retinal serum on cooler UK nights.</p><a class="affiliate-link" href="/go/squalane-oil" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">09</div><div><h3>Silk-feel chemical exfoliant mask</h3><p class="why">Why this works: a 10-minute AHA/BHA mask for weekly reset. The combo lifts dullness while keeping pores clear — use the night before an event for visible glow.</p><a class="affiliate-link" href="/go/exfoliant-mask" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">10</div><div><h3>Reusable hydrogel eye patches</h3><p class="why">Why this works: cooling patches that depuff morning eyes — a small ritual that makes a 6am start feel intentional. Reusable, so the cost-per-wear is negligible.</p><a class="affiliate-link" href="/go/eye-patches" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<h2>How to layer these</h2>
<p>Morning: cleanser &rarr; vitamin C &rarr; tinted SPF. Night: cleanser &rarr; treatment (alternate glycolic, tranexamic, retinal) &rarr; ceramide cream &rarr; squalane. Two nights a week, swap the treatment for the exfoliant mask. The order matters more than the brand — keep the barrier ahead of the actives.</p>`
  },
  {
    slug: "7-soft-girl-cardigans-amazon-uk-under-30",
    title: "7 Soft Girl Cardigans on Amazon UK Under £30",
    category: "Soft Girl Fashion",
    meta_description: "Pastel knits with real sizing notes — what fits curvy, what runs small. Seven Amazon UK cardigans under £30 for the soft girl wardrobe.",
    eyebrow: "Soft Girl Fashion · Amazon UK Finds",
    read_time: "5 min read · Updated July 2026",
    og_image: "pins/post-2-pin-a.svg",
    intro_html: `<p>The soft girl wardrobe lives or dies on the cardigan. The right one is pastel, slightly oversized, and drapes rather than clings. The wrong one pills after one wash and runs two sizes small. Below are seven Amazon UK picks under &pound;30 &mdash; each with the sizing context Pinterest won&rsquo;t tell you.</p>`,
    body_html: `<h2>The shortlist</h2>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">01</div><div><h3>Blush cropped button-front knit</h3><p class="why">Why this works: a true blush, not peach. Runs small &mdash; size up one for the slouchy fit, two if you&rsquo;re busty. Pairs over a satin slip for the canonical soft-girl silhouette.</p><a class="affiliate-link" href="/go/blush-cropped-cardigan" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">02</div><div><h3>Lilac oversized grandpa cardigan</h3><p class="why">Why this works: the grandpa fit is the backbone of the aesthetic &mdash; boxy, buttoned, mid-thigh. True to size; the lilac reads cooler in person, which suits warm undertones.</p><a class="affiliate-link" href="/go/lilac-grandpa-cardigan" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">03</div><div><h3>Cream ribbed longline duster</h3><p class="why">Why this works: a longline duster reads elegant over jeans or a midi. Ribbed knit holds shape after washing. Curvy-friendly through the hips &mdash; the rare budget knit that doesn&rsquo;t gap at the bust.</p><a class="affiliate-link" href="/go/cream-duster-cardigan" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">04</div><div><h3>Pastel pink bouclé cropped jacket</h3><p class="why">Why this works: bouclé elevates a cardigan into jacket territory &mdash; wear it buttoned as a top. Runs small in shoulders; fine for petite frames, size up if broad.</p><a class="affiliate-link" href="/go/pink-boucle-cardigan" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">05</div><div><h3>Sage open-front drape cardigan</h3><p class="why">Why this works: sage is the muted alternative to pastel pink &mdash; reads softer in real life than on screen. Open-front, no buttons, true to size. The everyday layer.</p><a class="affiliate-link" href="/go/sage-drape-cardigan" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">06</div><div><h3>Dusty rose cable-knit boyfriend cardi</h3><p class="why">Why this works: the cable knit reads cosy without looking juvenile. Boyfriend fit is forgiving through the midsection; dusty rose flatters deep complexions where baby pink can wash out.</p><a class="affiliate-link" href="/go/dusty-rose-cable-cardigan" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">07</div><div><h3>Ivory pointelle knit with pearl buttons</h3><p class="why">Why this works: pointelle is the dainty detail that signals the aesthetic without leaning costume. Pearl buttons are sewn on securely (rare at this price). True to size, hand-wash cold.</p><a class="affiliate-link" href="/go/ivory-pointelle-cardigan" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<h2>Styling combos to pin from this post</h2>
<ul><li><strong>Blush cropped cardi</strong> + satin slip + pearl barrette.</li><li><strong>Lilac grandpa cardi</strong> buttoned alone + wide-leg jeans + white trainers.</li><li><strong>Cream duster</strong> + midi dress + ankle boots for the elegant-leaning soft girl.</li></ul>`
  },
  {
    slug: "foundations-deep-undertones",
    title: "Foundations That Actually Match Deep Undertones",
    category: "Dark Skin Makeup",
    meta_description: "Shade-by-shade foundation picks for red, golden, and neutral deep undertones — with swatch notes. Amazon UK and AWIN finds.",
    eyebrow: "Dark Skin Makeup · Amazon UK Finds",
    read_time: "7 min read · Updated July 2026",
    og_image: "pins/post-3-pin-a.svg",
    intro_html: `<p>Most foundation ranges stop at &ldquo;deep&rdquo; and call it done. The result: a shade that&rsquo;s technically dark enough but reads grey, red, or ashy on real undertones. The picks below are sorted by undertone &mdash; red, golden, neutral &mdash; so you&rsquo;re matching temperature first, depth second. Every entry has a swatch note describing how it reads in daylight.</p>`,
    body_html: `<h2>For red undertones</h2>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">01</div><div><h3>Warm-red full-coverage liquid</h3><p class="why">Why this works: a true red-base deep that doesn&rsquo;t pull orange. Reads warm-rather-than-ashy in daylight. Buildable to full coverage without caking on melanin-rich skin.</p><a class="affiliate-link" href="/go/red-undertone-foundation" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">02</div><div><h3>Satin-finish dewy stick</h3><p class="why">Why this works: stick format means you can spot-conceal and sheer out across the face. The deepest red shade is rare at this price &mdash; true warmth, no grey cast.</p><a class="affiliate-link" href="/go/satin-stick-foundation" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<h2>For golden undertones</h2>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">03</div><div><h3>Golden-yellow matte liquid</h3><p class="why">Why this works: the yellow base counters the ashiness most &ldquo;deep golden&rdquo; shades leave behind. Matte without looking flat &mdash; pair with a liquid highlighter on the high points.</p><a class="affiliate-link" href="/go/golden-matte-foundation" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">04</div><div><h3>Luminous golden serum foundation</h3><p class="why">Why this works: serum foundations sit closer to skin and read more natural on golden undertones than heavy mattes. The deepest golden shade runs slightly light &mdash; size up one if between shades.</p><a class="affiliate-link" href="/go/golden-serum-foundation" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<h2>For neutral undertones</h2>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">05</div><div><h3>Neutral-deep powder foundation</h3><p class="why">Why this works: powders are unforgiving on texture but ideal for neutral undertones that don&rsquo;t need warmth correction. Buildable, sets itself, no separate powder step.</p><a class="affiliate-link" href="/go/neutral-powder-foundation" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">06</div><div><h3>Cool-neutral cream-to-powder</h3><p class="why">Why this works: a rare cool-neutral deep &mdash; for undertones that read slightly blue rather than red or yellow. Cream-to-powder finish works on normal-to-dry skin.</p><a class="affiliate-link" href="/go/cool-neutral-cream-foundation" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<h2>The undertone test (no white paper needed)</h2>
<p>Look at the inside of your wrist in natural light. If veins read green-dominant, you&rsquo;re warm (red or golden). If they read blue-dominant, you&rsquo;re cool (cool-neutral). If you genuinely can&rsquo;t tell, you&rsquo;re neutral &mdash; and the neutral picks above will save you the trial-and-error most deep shades force.</p>`
  },
  {
    slug: "date-night-silhouettes-classy-first",
    title: "3 Date-Night Silhouettes That Read Classy First",
    category: "Classy Sexy Outfits",
    meta_description: "Three date-night outfit silhouettes that say elegant before they say anything else — with styling combos and sizing notes. Amazon UK and AWIN finds.",
    eyebrow: "Classy Sexy Outfits · Amazon UK Finds",
    read_time: "5 min read · Updated July 2026",
    og_image: "pins/post-4-pin-a.svg",
    intro_html: `<p>The line between classy and try-hard is a silhouette, not a hem length. The three shapes below read elegant in the first glance &mdash; the skin or stretch that comes after is what makes them date-night. Each comes with a styling combo and a sizing note, because the cut only works if it fits.</p>`,
    body_html: `<h2>01 — The bias-cut slip midi</h2>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">01</div><div><h3>Bias-cut satin slip midi</h3><p class="why">Why this works: bias cut skims instead of clings &mdash; the most forgiving sexy silhouette on curvy frames. The midi length is what keeps it classy; mini reads club, floor reads formal. Runs true to size, but size up if between &mdash; bias pulls tighter across the hip.</p><a class="affiliate-link" href="/go/bias-slip-midi" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<p><strong>Styling combo:</strong> slip + barely-there heel + single gold pendant. Add the cropped cardigan from the soft girl post for the &ldquo;dinner after&rdquo; layer.</p>
<h2>02 — The structured blazer + nothing underneath</h2>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">02</div><div><h3>Tailored double-breasted blazer</h3><p class="why">Why this works: a structured blazer worn buttoned with nothing underneath is the canonical classy-sexy move &mdash; the tailoring does the work, the skin is the surprise. Needs a blazer that actually fits the shoulders; everything else can be tweaked. Curvy-friendly if you size for the bust and take in the waist.</p><a class="affiliate-link" href="/go/tailored-blazer" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<p><strong>Styling combo:</strong> blazer + wide-leg trouser + pointed-toe mule. Monochrome reads more expensive than it is.</p>
<h2>03 — The knit column dress</h2>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">03</div><div><h3>Ribbed knit column dress</h3><p class="why">Why this works: a ribbed knit column hugs without exposing &mdash; the shape does the talking. Long sleeves + midi hem is the classy anchor; the knit stretch is the sexy. Size down if you want the hug, true to size for a skimming fit. Avoid if you don&rsquo;t want cling through the midsection.</p><a class="affiliate-link" href="/go/knit-column-dress" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<p><strong>Styling combo:</strong> knit column + knee-high boot + structured bag. The boot grounds it; a stiletto tips it into a different category.</p>
<h2>The one rule across all three</h2>
<p>Pick one point of reveal and stop. A slip shows the neckline &mdash; keep the rest covered. A blazer shows the d&eacute;colletage &mdash; close the leg. A knit column shows the shape &mdash; cover the skin. Two reveals reads costume; one reads intention.</p>`
  },
  {
    slug: "20-minute-evening-ritual-resets",
    title: "A 20-Minute Evening Ritual That Actually Resets",
    category: "Self-Care",
    meta_description: "A sequenced 20-minute evening ritual — small luxuries that make a slow night feel intentional. Amazon UK and AWIN self-care picks.",
    eyebrow: "Self-Care · Amazon UK Finds",
    read_time: "4 min read · Updated July 2026",
    og_image: "pins/post-5-pin-a.svg",
    intro_html: `<p>Self-care rituals fail when they&rsquo;re aspirational rather than sequenced. A 90-minute soak with candles sounds lovely and happens never. The version below is 20 minutes, broken into four timed blocks, using five small luxuries that make a slow evening feel intentional rather than scrolled-through.</p>`,
    body_html: `<h2>The ritual, block by block</h2>
<h3>Minutes 0&ndash;5 &mdash; Warm the body</h3>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">01</div><div><h3>Soy-wax candle, fig &amp; cedar</h3><p class="why">Why this works: scent is the fastest sensory cue that the day is over. Fig and cedar is warm without being sweet &mdash; reads adult, not spa-chain. Soy wax burns clean so it won&rsquo;t soot the ceiling. Light it first; everything else happens in its glow.</p><a class="affiliate-link" href="/go/fig-cedar-candle" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<h3>Minutes 5&ndash;12 &mdash; Soak and exfoliate</h3>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">02</div><div><h3>Mineral soak with magnesium</h3><p class="why">Why this works: magnesium flakes ease muscle tension better than plain Epsom salts &mdash; the difference between &ldquo;relaxed&rdquo; and &ldquo;actually loose.&rdquo; A seven-minute soak is enough; longer dries the skin.</p><a class="affiliate-link" href="/go/magnesium-soak" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">03</div><div><h3>Dry brush, long-handle</h3><p class="why">Why this works: two minutes of dry brushing before the soak lifts dead skin and stimulates lymph &mdash; the reason your skin looks lit-from-within after. Long handle reaches the back without contortion.</p><a class="affiliate-link" href="/go/dry-brush" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<h3>Minutes 12&ndash;17 &mdash; Seal the skin</h3>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">04</div><div><h3>Body oil, neroli &amp; marula</h3><p class="why">Why this works: applied to damp skin, an oil seals in the soak better than lotion sits on top of it. Neroli and marula is the scent that reads expensive &mdash; a small luxury that lasts months because a little covers the whole body.</p><a class="affiliate-link" href="/go/neroli-marula-oil" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<h3>Minutes 17&ndash;20 &mdash; Cool the mind</h3>
<section class="product-block"><div class="product-block__media" role="img" aria-label="Product image placeholder">05</div><div><h3>Silk eye mask, weighted</h3><p class="why">Why this works: a weighted silk mask signals the eyes (and the brain) that input is over. The silk is gentler on lashes and the delicate eye skin than cotton &mdash; a quiet anti-ageing move that costs less than one serum.</p><a class="affiliate-link" href="/go/silk-eye-mask" rel="sponsored nofollow noopener" target="_blank">Check price on Amazon UK</a></div></section>
<h2>Why this version sticks</h2>
<p>It&rsquo;s timed, it&rsquo;s short, and each block has a single product doing one job. No &ldquo;light a candle and journal&rdquo; vagueness &mdash; the sequence is the ritual, the products are the props. Run it three nights a week and the candle alone becomes the cue that resets the nervous system before the soak even starts.</p>`
  }
];

// All affiliate link slugs used above, with placeholder destinations.
// Replace the destinations with your real Amazon Associates / AWIN tracking URLs.
const PLACEHOLDER = "https://www.amazon.co.uk/?tag=eira-21";
const links = [
  // Skincare post
  ["vitamin-c-serum", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  ["ceramide-cream", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  ["glycolic-toner", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  ["tinted-spf", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  ["tranexamic", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  ["hyaluronic-cleanser", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  ["retinal-serum", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  ["squalane-oil", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  ["exfoliant-mask", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  ["eye-patches", "amazon", "10-best-amazon-uk-skincare-finds-dark-skin"],
  // Fashion post
  ["blush-cropped-cardigan", "amazon", "7-soft-girl-cardigans-amazon-uk-under-30"],
  ["lilac-grandpa-cardigan", "amazon", "7-soft-girl-cardigans-amazon-uk-under-30"],
  ["cream-duster-cardigan", "amazon", "7-soft-girl-cardigans-amazon-uk-under-30"],
  ["pink-boucle-cardigan", "amazon", "7-soft-girl-cardigans-amazon-uk-under-30"],
  ["sage-drape-cardigan", "amazon", "7-soft-girl-cardigans-amazon-uk-under-30"],
  ["dusty-rose-cable-cardigan", "amazon", "7-soft-girl-cardigans-amazon-uk-under-30"],
  ["ivory-pointelle-cardigan", "amazon", "7-soft-girl-cardigans-amazon-uk-under-30"],
  // Makeup post
  ["red-undertone-foundation", "amazon", "foundations-deep-undertones"],
  ["satin-stick-foundation", "amazon", "foundations-deep-undertones"],
  ["golden-matte-foundation", "amazon", "foundations-deep-undertones"],
  ["golden-serum-foundation", "amazon", "foundations-deep-undertones"],
  ["neutral-powder-foundation", "amazon", "foundations-deep-undertones"],
  ["cool-neutral-cream-foundation", "amazon", "foundations-deep-undertones"],
  // Outfits post
  ["bias-slip-midi", "amazon", "date-night-silhouettes-classy-first"],
  ["tailored-blazer", "awin", "date-night-silhouettes-classy-first"],
  ["knit-column-dress", "amazon", "date-night-silhouettes-classy-first"],
  // Self-care post
  ["fig-cedar-candle", "amazon", "20-minute-evening-ritual-resets"],
  ["magnesium-soak", "amazon", "20-minute-evening-ritual-resets"],
  ["dry-brush", "amazon", "20-minute-evening-ritual-resets"],
  ["neroli-marula-oil", "awin", "20-minute-evening-ritual-resets"],
  ["silk-eye-mask", "amazon", "20-minute-evening-ritual-resets"]
];

async function seed() {
  await ensureSchema();
  console.log("Seeding posts...");
  for (const p of posts) {
    await db.execute({
      sql: `INSERT INTO posts (slug, title, category, meta_description, eyebrow, read_time, intro_html, body_html, og_image, published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON CONFLICT(slug) DO UPDATE SET
              title=excluded.title, category=excluded.category, meta_description=excluded.meta_description,
              eyebrow=excluded.eyebrow, read_time=excluded.read_time, intro_html=excluded.intro_html,
              body_html=excluded.body_html, og_image=excluded.og_image, published=1, updated_at=datetime('now')`,
      args: [p.slug, p.title, p.category, p.meta_description, p.eyebrow, p.read_time, p.intro_html, p.body_html, p.og_image]
    });
    console.log("  ✓", p.slug);
  }
  console.log("Seeding links...");
  for (const [slug, network, post_slug] of links) {
    await db.execute({
      sql: `INSERT INTO links (slug, destination, network, post_slug) VALUES (?, ?, ?, ?)
            ON CONFLICT(slug) DO UPDATE SET destination=excluded.destination, network=excluded.network, post_slug=excluded.post_slug, updated_at=datetime('now')`,
      args: [slug, PLACEHOLDER, network, post_slug]
    });
    console.log("  ✓ /go/" + slug);
  }
  console.log("\nDone. " + posts.length + " posts, " + links.length + " links seeded.");
  console.log("⚠️  Link destinations are placeholders. Edit them in the admin UI (/admin) with your real Amazon/AWIN URLs.");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
