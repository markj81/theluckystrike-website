# theluckystrike.co.uk

Personal portfolio site for Mark Jenkins — design leader, product designer, and AI enthusiast with 25+ years of experience.

**Live**: [theluckystrike.co.uk](https://www.theluckystrike.co.uk)

## What's in It

A static portfolio site with no build step — just HTML, CSS, and vanilla JS, deployed on Vercel.

- **Homepage** — Hero, about, client logos, teaching history, design philosophy, and contact
- **Testimonials** — Full-page testimonial wall from colleagues at HackerOne, IKEA, Google, and others
- **Spotify carousel** — Live "what's on the turntable" section powered by a serverless API
- **Mo' Modals** — Nested modal easter egg (press M on the homepage)
- **Hero glass object** — Interactive WebGL glass vinyl record (drag to orbit), a nod to "Currently listening" below, refracting the headshot behind it; replaces the flat portrait and falls back to the plain photo if WebGL is unavailable
- **llms.txt** — AI-readable profile for LLM discovery
- **yt-mpc** — DJ sample pad app (vendored from [UncleWob/YT2TW](https://github.com/UncleWob/YT2TW)), deployed separately — see [`yt-mpc/README.md`](yt-mpc/README.md)

## Tech

| Layer | Stack |
|-------|-------|
| Markup | Semantic HTML5 with ARIA, skip links, scroll-spy navigation |
| Styling | Custom CSS with design tokens, Instrument Serif + DM Sans |
| Scripts | Vanilla JS — scroll animations, carousels, easter eggs |
| Hero 3D | Three.js (vendored, no CDN) — `js/glass-object.js` is a build-step-free port of [CanvasUI's glass-object](https://canvasui.dev/docs/components/glass-object) |
| API | Vercel serverless function (`/api/spotify.js`) |
| Hosting | Vercel with custom domain, rewrites, and redirects |
| Analytics | Vercel Analytics + Speed Insights |

## Pages

| Path | File | Description |
|------|------|-------------|
| `/` | `index.html` | Main portfolio page |
| `/testimonials` | `testimonials.html` | Full testimonial collection |
| `/llms.txt` | `llms.txt` | Machine-readable profile |

## Run Locally

```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

No build step. Three.js is vendored under `vendor/three/` (self-hosted, no CDN or package manager needed at runtime) for the hero glass effect.

## Deploy

Deployed to Vercel with clean URLs via `vercel.json` rewrites:

```bash
vercel          # Preview deploy
vercel --prod   # Production deploy
```

## Project Structure

```
├── index.html           # Homepage
├── testimonials.html    # Testimonials page
├── styles.css           # All styles with CSS custom properties
├── script.js            # Scroll animations, carousels, easter eggs
├── api/
│   └── spotify.js       # Vercel serverless — Spotify recently played
├── images/              # Headshots and profile photo
├── js/
│   ├── glass-object.js  # Vanilla-JS port of CanvasUI's glass-object renderer
│   └── hero-glass.js    # Wires the glass object to the hero portrait, with a flat-photo fallback
├── vendor/three/        # Self-hosted Three.js + addons (loaded via an import map, no CDN)
├── llms.txt             # LLM-readable profile
├── vercel.json          # Rewrites, redirects, and deploy config
└── yt-mpc/              # DJ sample pad app — separate Docker deploy, not part of the Vercel build
```

## License

MIT
