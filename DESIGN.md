# Eira Journal — Design Direction

## Intent

Build a warm, intelligent editorial home for stories about Self Discovery, Life and Beauty. The experience must feel like a beautifully made independent magazine, never a storefront.

## Reference

Adapt Refero Styles' **Wispr Flow — cream broadsheet, dark velvet chambers** direction for Eira. Keep its editorial scale, warm paper surfaces, strong ink contrast and shadowless bordered cards. Do not copy its software/product patterns or palette literally.

## Foundations

- Canvas: warm cream (`--color-surface-base`)
- Ink: espresso (`--color-text-primary`, `--color-surface-dark`)
- Supporting surfaces: blush and warm sand
- Display type: Fraunces, regular-to-medium weight, with authority coming from scale
- UI/body type: Inter
- Layout: generous editorial rhythm, 24px grid gaps, readable 760px article measure
- Shape: pill controls; 32px Journal category cards; flat surfaces with ink borders instead of decorative shadows

## Information Architecture

- Primary navigation must contain only Home, Journal and About.
- Journal is the single content archive.
- Journal categories are fixed to Self Discovery, Life and Beauty.
- Category controls live inside Journal rather than in the global navigation.
- Products, shopping calls to action, prices and affiliate disclosures must not appear in the public experience.

## Components

### Editorial studio

The private admin uses the same warm paper, blush, espresso and bordered-surface language as the public site, with denser controls suited to publishing work. Its primary sections are Overview, Journal, Subscribers and Newsletter. Products, affiliate links and hero-image controls must not appear in the studio. Post creation accepts only Self Discovery, Life or Beauty and includes a rich-text writer, standfirst, live writing metrics, featured-image alt text, SEO guidance, publish-readiness feedback, draft and preview actions, image upload and local recovery.

### Primary navigation

Use uppercase Inter labels with comfortable spacing. The active destination uses a quiet blush pill. Mobile navigation must remain keyboard accessible and expose `aria-expanded`.

### Static editorial hero

Home and About use centered typographic heroes without imagery.

### Journal category cards

Use three large, shadowless cards with 2px ink borders and 32px corners. Each card needs a short description, a distinct surface treatment and a clear full-card link. Stack cards on tablet and mobile.

### Story cards and lists

Lead with the title and category. Images are optional; empty media must never create a broken layout. Product metadata, pricing and retailer buttons are prohibited.

### Article pages

Keep body copy within the narrow reading container. Preserve generous line height, visible focus states and a clear route back to Journal. Retired legacy product blocks must not render.

## Accessibility

- Meet WCAG 2.2 AA contrast for text and controls.
- Every interactive element must have a visible focus state.
- Category state must not rely on colour alone.
- Keep tap targets at least 44px on mobile.

## Content Tone

Warm, observant and direct. Write for a reader, not a buyer. Avoid retail language such as “shop now,” “featured picks,” “worth your money,” and “best products.”

## QA Checklist

- [ ] Header shows only Home, Journal and About at every public entry point.
- [ ] Journal filters work for All, Self Discovery, Life and Beauty, including query-string links.
- [ ] New posts can only be assigned to Self Discovery, Life or Beauty.
- [ ] No product cards, prices, retailer buttons or affiliate disclosures render publicly.
- [ ] Homepage, Journal, About and article pages work at mobile and desktop widths.
- [ ] Home and About use centered text-only heroes with no image or text overlap.
- [ ] Keyboard navigation, focus states and reduced motion are verified.
