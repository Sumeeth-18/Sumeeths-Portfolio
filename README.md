# Sumeeth's Portfolio — Sumeeth Ashok Melkera

Plain HTML, CSS and JavaScript. No build step, no dependencies (Shrikhand is loaded from Google Fonts for the name only).

## Preview
Double-click `index.html`.

## Deploy (Cloudflare Pages)
Upload this folder with Direct Upload, or push to your Git repo. Build command: none. Output directory: `/`.

## Structure
- `index.html`, `css/style.css`, `js/main.js`
- `assets/avatar/sumeeth-avatar.jpg` — the supplied avatar, unmodified
- `assets/designs/` — Design Showcase artwork, unmodified
- Avatar-based identity: `assets/avatar/sumeeth-avatar.jpg` and avatar-derived favicon/app icons

## Notes
- Intro: CSS-only, ~3s, once per browsing session, skipped under reduced motion.
- Design Showcase: scroll-pinned exhibition; with reduced motion or no JavaScript it falls back to a normal stacked list.
- To add a design: duplicate one `<figure class="piece">` in `index.html` (set `--ar` = width ÷ height, `data-title`, `data-kind`, and update the "N" count is automatic).
- Canonical and absolute social-preview URLs are intentionally unset until the final deployment URL is known.
