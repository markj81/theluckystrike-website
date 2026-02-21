# Accessibility Audit Report
**Site:** Mark Jenkins Portfolio (theluckystrike-website)
**Pages reviewed:** `index.html`, `testimonials.html`, `styles.css`, `script.js`
**Standard:** WCAG 2.1 AA
**Date:** 2026-02-21

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High     | 5 |
| Medium   | 6 |
| Low      | 5 |

---

## Critical Issues

### 1. No `<main>` landmark element
**Both pages** (`index.html`, `testimonials.html`) have no `<main>` element. Screen reader users rely on landmarks to jump directly to page content, bypassing navigation. The content currently sits in a series of `<section>` and `<header>` elements with no enclosing `<main>`.

**Fix:** Wrap all primary page content (everything between the `<nav>` and `<footer>`) in `<main>`.

---

### 2. No skip navigation link
There is no "Skip to main content" link at the top of either page. Keyboard-only users must tab through all navigation items on every page load before reaching content.

**Fix:** Add a visually hidden, focusable link as the very first element in `<body>`:
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```
With CSS to make it visible only on focus:
```css
.skip-link {
    position: absolute;
    top: -100%;
    left: 1rem;
    padding: 0.5rem 1rem;
    background: var(--color-text);
    color: var(--color-bg);
}
.skip-link:focus { top: 1rem; }
```

---

### 3. Modal dialogs are not accessible
Both modals (`#modal`, `#modal-2`) have significant accessibility failures:
- No `role="dialog"` on the modal container
- No `aria-modal="true"` (so screen readers may still browse content behind the overlay)
- No `aria-labelledby` linking the modal to its `<h2>` title
- **Focus is not moved into the modal when it opens** — screen reader users won't know the modal appeared
- **No focus trap** — tabbing past the modal's last interactive element leaves the modal

**Fix:**
```html
<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <h2 class="modal-title" id="modal-title">Mo' Modals, Mo' Problems</h2>
    ...
</div>
```
In `script.js`, when a modal opens: save the triggering element, move focus to the first focusable element inside the modal, and trap focus within it. On close, return focus to the triggering element.

---

## High Issues

### 4. Mobile menu has no focus trap and no `aria-expanded`
When the mobile menu opens, focus is not trapped inside it. Users can tab behind the overlay to hidden page content.

Additionally, the hamburger `<button class="nav-toggle">` has no `aria-expanded` attribute, so screen readers cannot announce whether the menu is open or closed.

**Fix (HTML):**
```html
<button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-menu">
```
**Fix (JS):** Toggle `aria-expanded` when the menu opens/closes, and implement a focus trap while the menu is active.

---

### 5. Testimonial carousel auto-play (WCAG 2.2.2)
The testimonial carousel and Spotify carousel both auto-play on load. WCAG 2.2.2 requires moving content that starts automatically to be pausable. While a pause button exists for the testimonial carousel, it is small (36×36px), centred below the carousel, and not immediately obvious.

There is **no pause control for the Spotify carousel** at all.

**Fix:** Add a pause/play button adjacent to the Spotify carousel. Ensure both pause buttons are easily discoverable, ideally labelled with visible text rather than icon-only.

---

### 6. Missing focus visible styles
No custom `:focus-visible` styles are defined in `styles.css`. The site relies entirely on browser-default outlines, which are often invisible against dark `#0D0D0D` backgrounds (especially in Safari and Firefox). Interactive elements — nav links, carousel cards, contact links, buttons — need a clearly visible focus indicator.

**Fix:**
```css
:focus-visible {
    outline: 2px solid var(--color-accent-purple);
    outline-offset: 3px;
    border-radius: 2px;
}
```

---

### 7. Decorative elements exposed to screen readers
The following decorative elements have no `aria-hidden="true"`:
- `.bg-orb` and `.bg-shape` divs in the hero (animated background blobs)
- `.cube-container` / `.cube` / `.cube-face` divs (purely visual 3D animation)
- `.theme-liquid-overlay` / `.liquid-blob` in `testimonials.html`

Screen readers may announce these as empty interactive elements or navigate into them.

**Fix:** Add `aria-hidden="true"` to each decorative container:
```html
<div class="hero-bg" aria-hidden="true"> ... </div>
<div class="cube-container" aria-hidden="true"> ... </div>
<div class="theme-liquid-overlay" aria-hidden="true"> ... </div>
```

---

### 8. Testimonials page: full-card anchor wraps mixed content
The first testimonial card on `testimonials.html` wraps its entire content in an `<a>` tag:
```html
<div class="testimonial-card">
    <a href="..." class="testimonial-card-link">
        <div class="testimonial-photo">...</div>
        <blockquote>...</blockquote>
        <div class="testimonial-author">...</div>
    </a>
</div>
```
This causes the full quote and author details to be read as a single, very long link label. It is also invalid HTML to place a `<blockquote>` inside an `<a>`.

**Fix:** Remove the wrapping anchor, or restructure so only a concise element (e.g. the author's name) is the link target, with the card using CSS to extend the clickable area.

---

## Medium Issues

### 9. `<nav>` element has no accessible label
There is only one `<nav>` on each page, so this is a minor issue, but best practice is to label it:
```html
<nav class="nav" aria-label="Primary navigation">
```

### 10. Contact link arrow is not hidden from screen readers
The `<span class="link-arrow">→</span>` inside each contact link will be read aloud by screen readers as "right-pointing arrow", which disrupts the reading flow.

**Fix:**
```html
<span class="link-arrow" aria-hidden="true">→</span>
```

### 11. Carousel duplicate content for screen readers
Both carousels clone their cards (original + clone) to create a seamless loop. Screen readers will encounter every card twice. The cloned set should be hidden from assistive technology.

**Fix:** After cloning, add `aria-hidden="true"` to each clone element:
```js
const clones = cards.map(c => {
    const clone = c.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    return clone;
});
```

### 12. Sections lack accessible names
Several `<section>` elements have no `aria-labelledby` or `aria-label`, making them anonymous landmarks in the accessibility tree. The Teaching section, Spotify section, and Philosophy section are examples.

**Fix:** Ensure each section's heading has an `id` and the section references it:
```html
<section class="section" aria-labelledby="teaching-heading">
    <h2 id="teaching-heading" class="section-title">Sharing knowledge</h2>
```

### 13. `prefers-reduced-motion` partially applied
`styles.css` correctly disables animations for `prefers-reduced-motion`, but elements with `animate-on-scroll` start with `opacity: 0` in CSS. If a reduced-motion user loads the page and JavaScript is slow, content remains invisible. The JS-driven IntersectionObserver may still run and transition opacity.

**Fix:** Within the reduced-motion media query, also ensure `.animate-on-scroll` is immediately visible:
```css
@media (prefers-reduced-motion: reduce) {
    .animate-on-scroll {
        opacity: 1;
        transform: none;
        transition: none;
    }
    .title-line, .hero-description, .hero-visual {
        opacity: 1;
        transform: none;
        animation: none;
    }
}
```

### 14. Hero emoji in label text
The hero label reads "Design Leader, Product Designer and AI Fanatic 🧢". Screen readers announce emojis by their Unicode name ("baseball cap"), which may break the reading flow.

**Fix:**
```html
<div class="hero-label">Design Leader, Product Designer and AI Fanatic <span aria-hidden="true">🧢</span></div>
```

---

## Low Issues

### 15. `<blockquote>` citations are missing
Testimonial quotes use `<blockquote>` correctly, but none include a `cite` attribute or a `<cite>` element identifying the speaker. This is not a WCAG failure but is a semantic best practice.

**Fix:**
```html
<blockquote class="testimonial-quote" cite="Bert Sinnema">
    "I had the pleasure..."
</blockquote>
<div class="testimonial-author">
    <cite><span class="author-name">Bert Sinnema</span></cite>
    ...
</div>
```

---

## What's Working Well

- `<html lang="en">` is correctly set on both pages.
- All `<img>` elements have descriptive `alt` attributes.
- The `nav-toggle`, `mobile-menu-close`, carousel pause button, and modal close buttons all have `aria-label`.
- The carousel pause button correctly uses `aria-pressed` to communicate toggle state.
- Spotify album links have descriptive `aria-label` values (e.g. "Album Name by Artist on Spotify").
- `rel="noopener"` is applied to all external links.
- Page `<title>` elements are descriptive and unique per page.
- The `prefers-reduced-motion` query is in place, even if incomplete.
- Keyboard `Escape` closes modals.
- Touch events on the carousel are handled with `{ passive: true }`.

---

## Recommended Priority Order

1. Add `<main>` landmark and skip link (critical, low effort)
2. Fix modal role, labelling, and focus management (critical, medium effort)
3. Add `aria-expanded` + focus trap to mobile menu (high, low effort)
4. Add `:focus-visible` styles (high, low effort)
5. Add `aria-hidden="true"` to decorative elements and carousel clones (high, low effort)
6. Fix reduced-motion for initial element opacity (medium, low effort)
7. Add pause control to Spotify carousel (high, low effort)
8. Fix full-card link on testimonials page (high, medium effort)
9. Remaining medium/low items
