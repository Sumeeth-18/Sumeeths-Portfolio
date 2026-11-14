# Sumeeth's Portfolio — Sumeeth Ashok Melkera

Plain HTML, CSS and JavaScript. No build step, no dependencies (webfonts are loaded from Google Fonts: Bodoni Moda, Cormorant Garamond, Inter, JetBrains Mono).

## Preview
Double-click `index.html`, or serve the folder (`python3 -m http.server`).

## Deploy (Cloudflare Pages)
Push to your Git repo. Build command: none. Output directory: `/`.

## Design system — Noir Editorial
- Core palette: `#171412` warm black · `#8F2438` deep crimson · `#E8D9C3` warm beige
- Supporting tokens: surface `#211C19` · surface-raised `#2B2320` · muted text `#B8A995` · border `#493B34` · crimson-hover `#A6384C`
- 60-30-10: warm black dominates (~60%), dark surfaces support (~30%), beige highlights (~10%); crimson is a selective accent, never a dominant fill
- Type: Bodoni Moda (the name and the word "Creative" only) · Cormorant Garamond (all headings and editorial titles) · Inter (body, navigation, buttons, labels) · JetBrains Mono (code-style intro and numeric data only)
- Fixed top navigation on every viewport, no hamburger

## Structure
- `index.html`, `css/style.css`, `js/main.js`
- `assets/avatar/sumeeth-avatar.jpg` — the supplied avatar, unmodified
- `assets/designs/` — Design Showcase artwork (eight originals), unmodified
- Avatar-based identity: `assets/avatar/sumeeth-avatar.jpg` and avatar-derived favicon/app icons

## Notes
- Intro (per the intro sketch): blank black → typed JetBrains Mono boot ending on the typed "/"; the slash triggers a `/` pendulum loading beat, then `</ Sumeeth's Portfolio />`, then "Let's bring your IDEA live!!", then the veil dissolves into the hero. Runs once per session (skipped on repeat visits, deep links and reduced motion; Escape/Enter/skip button bypasses).
- Hero entry (per the Home Page sketch), strictly in order: ① giant PORTFOLIO typography → ② particle avatar formation (canvas, hands over to the real artwork) → ③ "Hii..!! I am" typed → ④ "SUMEETH" (Bodoni Moda, metallic glow) + "Creative Developer" typed, nav and Get in Touch arrive → ⑤ tagline typed bottom-right, cycling word begins → ⑥ bottom strip "Digital Solutions ← Designs ← Applications ← Websites" typed last.
- The word ticker cycles Website → Application → Designs → Digital Solution, one at a time.
- The diary lives in the Field Notes band below the hero and flips bottom-to-top through the creative areas; the only 3D element on the site.
- Design Showcase: scroll-pinned exhibition; with reduced motion or no JavaScript it falls back to a normal stacked list.
- To add a design: duplicate one `<figure class="piece">` in `index.html` (set `--ar` = width ÷ height, `data-title`, `data-kind`; the "N" count is automatic).
- Canonical and absolute social-preview URLs point to the deployed Cloudflare Pages URL.
