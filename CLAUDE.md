# CLAUDE.md — AI Assistant Guide for theluckystrike-website

## Project Overview

This is a **static portfolio website** for Mark Jenkins, a Design Leader with 20+ years of experience. It uses vanilla HTML, CSS, and JavaScript with no build tooling or frameworks. Deployed on Vercel at [theluckystrike.co.uk](https://theluckystrike.co.uk).

---

## Repository Structure

```
theluckystrike-website/
├── index.html          # Main homepage (hero, about, experience, Spotify, testimonials, contact)
├── testimonials.html   # Dedicated testimonials page (35+ cards)
├── styles.css          # Global stylesheet (~29KB, single file)
├── script.js           # All client-side JavaScript (~15KB, single file)
├── cube.js             # WebGL 3D cube — currently UNUSED, kept for reference
├── vercel.json         # Vercel routing and redirect rules
├── README.md           # Brief deployment instructions
├── api/
│   └── spotify.js      # Vercel serverless function: GET /api/spotify
└── images/             # All images (35 files: portraits, testimonial headshots)
```

---

## Technology Stack

| Layer        | Technology                            |
|--------------|---------------------------------------|
| Markup       | HTML5 (semantic elements)             |
| Styling      | CSS3 (variables, flexbox, grid, keyframes) |
| Scripting    | Vanilla JavaScript ES6+ (no frameworks) |
| Fonts        | Google Fonts — Instrument Serif + DM Sans |
| Backend      | Vercel Serverless Functions (Node.js) |
| API          | Spotify Web API (recently played tracks) |
| Analytics    | Vercel Web Analytics + Speed Insights |
| Hosting      | Vercel (git-push auto-deploy)         |
| Build system | None — no bundler, no transpiler      |
| Tests        | None — manual testing only            |

---

## Key Files In Detail

### `index.html`
The single homepage. Sections in order:
- Navigation (with mobile hamburger menu)
- Hero (portrait image, tagline)
- About (stats: 20+ years, 400+ mentored)
- Experience (client logos and names)
- Teaching (General Assembly, The Guardian)
- Spotify "Currently Listening" carousel (async, from `/api/spotify`)
- Philosophy (4 core principles)
- Testimonials carousel (9 cards, infinite scroll)
- Contact (email + LinkedIn)
- Footer

### `testimonials.html`
Full-page testimonials grid. 35+ cards with headshot, quote, name, role, company.
Layout: 3 columns on desktop → responsive down to 1 column on mobile.

### `styles.css`
**Design tokens (CSS variables):**
```css
/* Colors */
--bg-primary:    #0D0D0D   /* near-black background */
--text-primary:  #F5F5F5   /* light gray text */
--accent:        #7E57C2   /* purple accent */
--card-bg:       #1A1A1A   /* dark card background */
--border-color:  #2A2A2A   /* subtle border */

/* Spacing scale */
--spacing-xs: 0.5rem
--spacing-sm: 1rem
--spacing-md: 2rem
--spacing-lg: 4rem
--spacing-xl: 6rem
--spacing-2xl: 10rem
```

**Responsive breakpoints:**
- `max-width: 1024px` — tablet
- `max-width: 768px` — mobile
- `prefers-reduced-motion: reduce` — accessibility

**Named animations:** `fadeUp`, `carousel-scroll`, `float`, `drift`, `skeleton-pulse`

### `script.js`
All JS is modular functions called on `DOMContentLoaded`. Functions:

| Function | Purpose |
|----------|---------|
| `initMobileMenu()` | Hamburger toggle, ARIA states, body scroll lock |
| `initScrollAnimations()` | Intersection Observer fade-ins with stagger |
| `initScrollSpy()` | Highlights active nav link on scroll |
| `initTestimonialCarousel()` | Infinite CSS carousel with 9 shuffled testimonials |
| `initSpotifyCarousel()` | Fetches `/api/spotify`, renders album cards, skeleton loader |
| `buildAlbumCard()` | Factory: creates accessible Spotify album `<a>` cards |
| `initMackerelEasterEgg()` | Press 'M' → cascading "Mo' Modals" easter egg |
| `initModalHandlers()` | Modal open/close, keyboard escape, ARIA, focus trap |

### `api/spotify.js`
Vercel serverless function (Node.js runtime). Route: `GET /api/spotify`

**Flow:**
1. Reads `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` from environment
2. Exchanges refresh token for access token (OAuth 2.0), caches for 50 minutes
3. Fetches 20 recently played tracks from `api.spotify.com`
4. Deduplicates by album ID
5. Returns JSON array: `{ id, name, artist, image, url }`
6. Sets edge cache: 5 min (`stale-while-revalidate=600`)

**Required environment variables (set in Vercel dashboard, not in repo):**
```
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REFRESH_TOKEN
ALLOWED_ORIGIN   # optional — restricts CORS origin
```

---

## Development Workflow

### Local Development
No build step required. Serve the files with any static server:
```bash
python3 -m http.server 8000
# → http://localhost:8000
```

> Note: The Spotify carousel will fail locally unless you proxy `/api/spotify` or mock it. The section gracefully hides on error.

### Deployment
Every push to the connected git branch triggers a Vercel auto-deploy.

Manual deploy:
```bash
npm i -g vercel
vercel
```

**DNS (custom domain):**
- A record: `76.76.21.21`
- or CNAME: `cname.vercel-dns.com`

### URL Routing (`vercel.json`)
```
/index        → /index.html     (rewrite)
/testimonials → /testimonials.html (rewrite)
/index.html   → /              (301 redirect)
/testimonials.html → /testimonials (301 redirect)
```
Always link to clean URLs (`/testimonials`, not `/testimonials.html`).

---

## Coding Conventions

### HTML
- Use semantic elements: `<main>`, `<section>`, `<nav>`, `<header>`, `<footer>`, `<article>`
- Every image needs a descriptive `alt` attribute
- Use `loading="lazy"` on non-hero images
- Include ARIA attributes where interactivity is added (buttons, carousels, modals)
- Maintain heading hierarchy (`h1` → `h2` → `h3`)
- Keep the skip-to-content link at the top of `<body>`

### CSS
- Use CSS variables from the design token set — **do not hardcode colors or spacing**
- Add new utility classes at the bottom of `styles.css`
- Respect `prefers-reduced-motion` — wrap animations in the existing media query block
- Mobile-first for new responsive rules
- Follow the existing naming pattern: BEM-lite with descriptive class names (`.section-title`, `.card-grid`, `.carousel-track`)

### JavaScript
- All feature logic goes in its own named `init*()` function
- Call new `init*()` functions inside the `DOMContentLoaded` listener at the bottom of `script.js`
- No external libraries — keep it vanilla
- Use `const`/`let`, arrow functions, template literals
- Async functions should always have try/catch with graceful fallback
- Avoid `document.write()`, `eval()`, or inline event handlers in HTML

### Images
- Store all images in `/images/`
- Use descriptive filenames: `mark-jenkins.jpg`, `kate.jpeg`
- Preferred formats: JPEG for photos, PNG for logos/icons with transparency
- Do not commit large unoptimised images

---

## Accessibility Requirements

This site has explicit a11y investment. When making changes:
- Preserve all existing `aria-*` attributes
- Interactive elements (buttons, links) must be keyboard-reachable
- Modal dialogs must trap focus while open and restore focus on close
- Carousels must pause on `focus` and `hover`; include `prefers-reduced-motion` fallback
- Colour contrast: text on `#0D0D0D` background must meet WCAG AA (4.5:1 minimum)
- The purple accent `#7E57C2` is used for interactive highlights — do not use it as body text colour

---

## Content Guidelines

When adding or editing copy:
- **Tone**: Confident, human, slightly informal — not corporate
- **Testimonials**: Always include name, role, and company. Use a real headshot from `/images/`
- **Client list**: Only add verified clients from Mark's actual work history
- **Stats** (e.g. "20+ years", "400+ mentored") — confirm with Mark before changing

---

## Common Tasks

### Add a testimonial to `testimonials.html`
1. Add headshot to `/images/` (square crop, JPEG, ≤200KB)
2. Copy an existing `.testimonial-card` block and update: photo `src`/`alt`, quote text, name, role, company
3. No JS changes needed — the page is static HTML

### Update the Spotify integration
- The serverless function is at `api/spotify.js`
- Token refresh logic is self-contained with a module-level cache
- To change which endpoint is called (e.g. top tracks vs. recently played), modify the fetch URL in `spotify.js`
- Vercel environment variables must be updated in the Vercel dashboard

### Add a new page
1. Create `newpage.html` at root level
2. Add a rewrite rule to `vercel.json`:
   ```json
   { "source": "/newpage", "destination": "/newpage.html" }
   ```
3. Add a redirect rule for the `.html` version:
   ```json
   { "source": "/newpage.html", "destination": "/newpage", "permanent": true }
   ```
4. Link using the clean URL (`/newpage`)

### Modify carousel behaviour
Carousels use CSS `animation: carousel-scroll` on a `.carousel-track` element. The JS calculates total track width and clones items for seamless looping. Key pattern:
- `paused` class toggles `animation-play-state: paused`
- Do not change carousel timing in CSS without updating the JS width calculation

---

## What to Avoid

- **Do not add a build step** (webpack, Vite, etc.) unless explicitly asked — the zero-dependency approach is intentional
- **Do not introduce npm packages** to the main site (the serverless function already uses the Node.js runtime without a package.json)
- **Do not commit `.env` files** — environment variables live in the Vercel dashboard
- **Do not push to `master` or `main`** without a PR review — use feature branches
- **Do not modify `cube.js`** unless re-enabling the WebGL cube — it is unused
- **Do not hardcode Mark's email address** in new locations — use the existing pattern in the contact section

---

## Git Workflow

- Default branch: `master` (production)
- Development: feature branches → PR → merge to `master` → auto-deploy to Vercel
- Commit messages: imperative, lowercase, descriptive (e.g. `add kate testimonial headshot`)
- Branch naming: descriptive kebab-case (e.g. `add-testimonial-ikea`)
