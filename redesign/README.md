# Supreme Air Duct Service — Modern Redesign

A clean, modern, fully responsive marketing website for **Supreme Air Duct
Service**, a family-owned air duct & dryer vent cleaning company serving
Southern California.

This folder is a **pure static site** — no build step, no dependencies. It keeps
the original brand's *warm* feel (sand, ember/burnt-orange, amber, espresso)
while bringing the design up to modern standards.

## What's inside

| File | Purpose |
|------|---------|
| `index.html` | The full single-page site (semantic, accessible markup) |
| `styles.css` | Hand-written CSS — warm theme, responsive layout, animations |
| `main.js` | Sticky header, mobile menu, scroll reveals, ZIP checker, quote form |

## View it

Just open `index.html` in any browser. Or serve it locally:

```bash
cd redesign
python3 -m http.server 8080
# visit http://localhost:8080
```

## Sections

- **Hero** with clear value prop, trust signals, and a "3 easy steps" card
- **Stats bar** (years, cities, systems cleaned, flat-rate promise)
- **Services** — all 6 offerings (air duct, dryer vent, kitchen exhaust,
  HVAC inspection, filter & duct replacement)
- **Why Us** — family-owned, honest flat-rate pricing, Rotobrush + NFPA
- **Process** — 4-step how-it-works
- **Service Areas** — 25+ SoCal cities + live ZIP/city coverage checker
- **Reviews** — testimonials
- **Quote form** — client-side demo (wire to email/CRM in production)
- **Footer** with full contact details

## Brand facts baked in

- Phone: **888-784-0746**
- Family-owned & operated, strong values, *not* a franchise
- Rotobrush-certified equipment · NFPA-trained technicians
- Flat-rate pricing, no upselling
- Serves all of Southern California (+ Las Vegas, NV)

## Customizing

- **Colors** live as CSS variables at the top of `styles.css` (`:root`).
- **Phone/email/address** are plain text in `index.html` — search & replace.
- The contact form currently shows a success state on the client. To make it
  live, point the `submit` handler in `main.js` at your email service, Formspree,
  or backend endpoint.

> Want online booking, appointment scheduling, and an admin dashboard? See the
> **`../booking-platform/`** folder for the full-featured version.
