# CLAUDE.md - Lucky Strike Portfolio

## Project Overview

Personal portfolio website for Mark Jenkins, Senior Design Manager at HackerOne. Static site deployed on Vercel at theluckystrike.co.uk.

## Tech Stack

- **HTML/CSS/JS** - No frameworks, no build step, no package manager
- **Fonts**: Playfair Display (display) + Space Grotesk (body) via Google Fonts
- **Hosting**: Vercel (static deployment)
- **Routing**: `vercel.json` handles rewrites (e.g., `/index` -> `/index.html`)

## Project Structure

```
├── index.html          # Main homepage (hero, about, teaching, clients, philosophy, contact)
├── testimonials.html   # Separate testimonials page with colleague quotes
├── styles.css          # All styles - CSS custom properties, Swiss editorial design system
├── script.js           # All JS - scroll animations, mobile menu, counters, parallax
├── vercel.json         # Vercel routing config (rewrites)
├── images/             # Profile photo + testimonial headshots (JPG)
└── .gitignore          # Ignores .vercel/
```

## Design System

- **Style**: Swiss editorial / minimalist with grain overlay and halftone effects
- **Color palette**: Warm off-white bg (`#f8f6f3`), dark text (`#1a1a1a`), purple accent (`#6b4c9a`)
- **CSS variables**: Defined in `:root` in `styles.css` - use these, don't hardcode values
- **Motion**: Uses CSS cubic-bezier easing variables (`--ease-out`, `--ease-expo`)
- **Layout**: Max container width `1400px`, nav height `80px`

## Key Conventions

- All CSS in a single `styles.css` file - no CSS modules or preprocessors
- All JS in a single `script.js` file - vanilla JS, no dependencies
- Intersection Observer pattern used for scroll-triggered animations
- Navigation links between pages use `.html` extensions (e.g., `testimonials.html`)
- Links from testimonials back to index use `/index` path (handled by Vercel rewrite)

## Common Tasks

- **Preview locally**: `python3 -m http.server 8000`
- **Deploy**: Push to main branch (Vercel auto-deploys) or run `vercel`

## Notes

- No build/lint/test commands exist for this project
