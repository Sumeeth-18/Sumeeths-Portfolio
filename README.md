# SONIX — Sumeeth's Portfolio (Sumeeth Ashok Melkera)

Plain HTML, CSS and JavaScript. No build step, no dependencies (webfonts are loaded from Google Fonts: Bodoni Moda, Cormorant Garamond, Inter, JetBrains Mono, Montserrat).

## Preview
Double-click `index.html`, or serve the folder (`python3 -m http.server`).

## Deploy (Cloudflare Pages)
Push to your Git repo. Build command: none. Output directory: `/`.

## Design system — Noir Editorial
- Core palette: `#171412` warm charcoal · `#8F2438` deep crimson · `#E8D9C3` warm beige
- Supporting tokens: surface `#1D1916` · surface-raised `#241E1A` · muted text `#B8A995` · border `#493B34` · crimson-hover `#A6384C`
- 60-30-10: charcoal dominates (~60%), dark surfaces support (~30%), beige highlights (~10%); crimson is a selective accent and a light source, never a dominant fill
- Type: Montserrat (the SONIX mark and the oversized PORTFOLIO) · Bodoni Moda (the name) · Cormorant Garamond (headings) · Inter (body, navigation, buttons) · JetBrains Mono (small data labels)
- Fixed, centred glass navigation on every viewport, no hamburger, with separate My Works and Get Started CTAs

## Structure
- `index.html`, `css/style.css`, `js/main.js`
- `assets/avatar/sonix-avatar.jpg` — the SONIX portrait used in the hero, intro and About
- `assets/designs/` — Design Showcase artwork (eight originals), unmodified
- Avatar-derived favicon and app icons (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`)

## Notes
- Intro: a black cinematic sequence, roughly six seconds — `</>` → the portrait assembling from particles → “Let’s bring your IDEA live!!” → SONIX → the veil dissolves into the hero. Runs once per session (skipped on repeat visits, deep links and reduced motion; Skip/Escape/Enter bypasses it).
- Hero: oversized Montserrat PORTFOLIO, the SONIX portrait with its technical rings and ambient node field, and the diary beside it. Then “Hii..!! I am”, SUMEETH (Bodoni Moda, metallic glow) + Creative Developer, the Get in Touch CTA, the tagline with its cycling word, and the bottom strip.
- Diary: a paper object beside the portrait, flipping horizontally through Websites → Applications → Designs → Digital Solutions, then stopping on Digital Solutions. It advances on its own while visible, and the Turn page button or a click advances it manually. With reduced motion or no JavaScript it becomes a readable four-item list.
- The word ticker cycles Website → Application → Designs → Digital Solution, one at a time.
- Design Showcase: scroll-pinned exhibition; with reduced motion or no JavaScript it falls back to a normal stacked list.
- To add a design: duplicate one `<figure class="piece">` in `index.html` (set `--ar` = width ÷ height, `data-title`, `data-kind`; the “N” count is automatic).
- Canonical and absolute social-preview URLs point to the deployed Cloudflare Pages URL.
