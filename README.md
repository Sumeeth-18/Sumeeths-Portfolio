# Sumeeth's Portfolio — Sumeeth Ashok Melkera

Plain HTML, CSS and JavaScript. No build step, no dependencies (webfonts are loaded from Google Fonts: Space Grotesk, Inter, Playfair Display, JetBrains Mono).

## Preview
Double-click `index.html`, or serve the folder (`python3 -m http.server`).

## Deploy (Cloudflare Pages)
Push to your Git repo. Build command: none. Output directory: `/`.

## Design system
- Palette (only six colours): `#1A120E` ink · `#3A2418` cocoa · `#6B4A2E` coffee · `#A88462` bronze · `#D5C4AE` sand · `#4A4A46` slate
- Type: Space Grotesk (headings), Inter (body), Playfair Display (editorial accents), JetBrains Mono (code-like intro)
- Fixed top navigation on every viewport, no hamburger

## Structure
- `index.html`, `css/style.css`, `js/main.js`
- `assets/avatar/sumeeth-avatar.jpg` — the supplied avatar, unmodified
- `assets/designs/` — Design Showcase artwork (eight originals), unmodified
- Avatar-based identity: `assets/avatar/sumeeth-avatar.jpg` and avatar-derived favicon/app icons

## Notes
- Intro: typed JetBrains Mono boot ends on typed "/"; the slash triggers a canvas particle formation of the avatar, then staged identity reveals. Runs once per session (skipped on repeat visits, deep links, reduced motion; Escape/Enter/skip button bypasses).
- The word ticker cycles Website → Application → Designs → Digital Solution, one at a time.
- The diary (hero right) flips through the creative areas and settles on Digital Solutions; the only 3D element on the site.
- Design Showcase: scroll-pinned exhibition; with reduced motion or no JavaScript it falls back to a normal stacked list.
<<<<<<< HEAD
- To add a design: duplicate one `<figure class="piece">` in `index.html` (set `--ar` = width ÷ height, `data-title`, `data-kind`, and update the "N" count is automatic).
- Canonical and absolute social-preview URLs are intentionally unset until the final deployment URL is known.

yes!

Hmm...
=======
- To add a design: duplicate one `<figure class="piece">` in `index.html` (set `--ar` = width ÷ height, `data-title`, `data-kind`; the "N" count is automatic).
- Canonical and absolute social-preview URLs point to the deployed Cloudflare Pages URL.
>>>>>>> ebfe5f7 (Upgrade portfolio design, animations and responsive experience)

yes!

Hmm...
