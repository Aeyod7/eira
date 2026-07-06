"""Generate Eira Pinterest pin SVGs (1000x1500) into ./pins/. Run once, then delete."""
import os

OUT = os.path.join(os.path.dirname(__file__), "pins")
os.makedirs(OUT, exist_ok=True)

# Eira palette (matches styles.css tokens)
CREAM      = "#FDF8F4"
CREAM_DEEP = "#F2E3D5"
BLUSH      = "#E8C4CE"
PINK       = "#C98B9B"
MAUVE      = "#8B4F5E"
BROWN      = "#4A3528"
ESPRESSO   = "#3D2B24"
WHITE      = "#FFFFFF"

def pin(filename, hook, sub, bg_a, bg_b, text_color, accent, label="Read on Eira"):
    # hook is a list of wrapped line strings; pair with y positions
    start_y = 420
    step = 110
    hook_lines = [(start_y + i*step, line) for i, line in enumerate(hook)]
    sub_y = start_y + len(hook_lines)*step + 60
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500" viewBox="0 0 1000 1500" font-family="'Playfair Display', Georgia, serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{bg_a}"/>
      <stop offset="1" stop-color="{bg_b}"/>
    </linearGradient>
  </defs>
  <rect width="1000" height="1500" fill="url(#bg)"/>
  <!-- top accent bar -->
  <rect x="0" y="0" width="1000" height="14" fill="{accent}"/>
  <!-- brand wordmark -->
  <text x="80" y="150" font-family="'Playfair Display', Georgia, serif" font-size="64" font-weight="700" fill="{text_color}" letter-spacing="2">Eira</text>
  <text x="82" y="190" font-family="'Raleway', system-ui, sans-serif" font-size="22" font-weight="500" fill="{accent}" letter-spacing="6">BEAUTY · FASHION · SELF-CARE</text>
  <!-- decorative divider -->
  <line x1="80" y1="240" x2="220" y2="240" stroke="{accent}" stroke-width="3"/>
  <!-- hook text (wrapped manually) -->
  <g font-family="'Playfair Display', Georgia, serif" font-weight="700" fill="{text_color}">
{chr(10).join(f'    <text x="80" y="{y}" font-size="92">{line}</text>' for y, line in hook_lines)}
  </g>
  <!-- sub line -->
  <text x="80" y="{sub_y}" font-family="'Raleway', system-ui, sans-serif" font-size="30" font-weight="500" fill="{accent}">{sub}</text>
  <!-- bottom CTA -->
  <rect x="0" y="1430" width="1000" height="70" fill="{BROWN}"/>
  <text x="80" y="1475" font-family="'Raleway', system-ui, sans-serif" font-size="28" font-weight="700" fill="{WHITE}" letter-spacing="3">{label.upper()}</text>
  <text x="920" y="1475" text-anchor="end" font-family="'Raleway', system-ui, sans-serif" font-size="28" font-weight="500" fill="{BLUSH}" letter-spacing="2">eira.example</text>
</svg>
"""
    with open(os.path.join(OUT, filename), "w", encoding="utf-8") as f:
        f.write(svg)
    print("wrote", filename)

# Helper to wrap hook into lines of ~26 chars
def wrap(text, width=24):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        if len(cur) + len(w) + 1 <= width:
            cur = (cur + " " + w).strip()
        else:
            lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

# ---- Post 1: Skincare (post.html) ----
pin("post-1-pin-a.svg", wrap("10 Skincare Finds That Work on Dark Skin"), "All Prime-eligible · Amazon UK", CREAM, BLUSH, ESPRESSO, MAUVE)
pin("post-1-pin-b.svg", wrap("Hyperpigmentation? 10 Picks That Help"), "The dark-skin shortlist", CREAM_DEEP, PINK, BROWN, MAUVE)
pin("post-1-pin-c.svg", wrap("The Dark-Skin Skincare Shortlist"), "Glow · barrier repair · SPF", BLUSH, CREAM_DEEP, ESPRESSO, MAUVE)

# ---- Post 2: Fashion (post-2.html) ----
pin("post-2-pin-a.svg", wrap("7 Soft Girl Cardigans Under £30"), "With real sizing notes", CREAM, BLUSH, ESPRESSO, MAUVE)
pin("post-2-pin-b.svg", wrap("Pastel Knits That Don't Pill"), "Amazon UK · soft girl edit", CREAM_DEEP, PINK, BROWN, MAUVE)
pin("post-2-pin-c.svg", wrap("The Soft Girl Cardigan Shortlist"), "What fits curvy, what runs small", BLUSH, CREAM_DEEP, ESPRESSO, MAUVE)

# ---- Post 3: Makeup (post-3.html) ----
pin("post-3-pin-a.svg", wrap("Foundations That Match Deep Undertones"), "Red · golden · neutral", CREAM, BLUSH, ESPRESSO, MAUVE)
pin("post-3-pin-b.svg", wrap("No More Ashy Foundation"), "6 shades that actually work", CREAM_DEEP, PINK, BROWN, MAUVE)
pin("post-3-pin-c.svg", wrap("The Deep-Undertone Foundation Guide"), "With swatch notes", BLUSH, CREAM_DEEP, ESPRESSO, MAUVE)

# ---- Post 4: Outfits (post-4.html) ----
pin("post-4-pin-a.svg", wrap("3 Date-Night Silhouettes, Classy First"), "Slip · blazer · knit column", CREAM, BLUSH, ESPRESSO, MAUVE)
pin("post-4-pin-b.svg", wrap("Classy Before Sexy: 3 Formulas"), "The cuts that read elegant", CREAM_DEEP, PINK, BROWN, MAUVE)
pin("post-4-pin-c.svg", wrap("The Slip, The Blazer, The Column"), "Date-night outfit math", BLUSH, CREAM_DEEP, ESPRESSO, MAUVE)

# ---- Post 5: Self-Care (post-5.html) ----
pin("post-5-pin-a.svg", wrap("A 20-Minute Ritual That Resets"), "Sequenced, not aspirational", CREAM, BLUSH, ESPRESSO, MAUVE)
pin("post-5-pin-b.svg", wrap("Self-Care That Actually Sticks"), "4 timed blocks · 5 props", CREAM_DEEP, PINK, BROWN, MAUVE)
pin("post-5-pin-c.svg", wrap("The Reset Ritual — 20 Minutes"), "Not 90. Twenty.", BLUSH, CREAM_DEEP, ESPRESSO, MAUVE)

# ---- Homepage ----
pin("home-pin.svg", wrap("Eira: Curated Finds, Real Context"), "Beauty · fashion · self-care", BROWN, MAUVE, WHITE, BLUSH, label="Visit Eira")

print("done:", len(os.listdir(OUT)), "files in", OUT)
