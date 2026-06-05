# Supreme Air Duct Service — Website Rebuild

A pro-bono rebuild of [supremeairductservice.com](https://supremeairductservice.com),
a family-owned air duct, dryer vent & kitchen exhaust cleaning company serving
all of Southern California.

The original site is a dark warm-brown design with gold/amber headings. This
rebuild keeps that **warm** identity (sand · ember · amber · espresso) while
bringing everything up to modern, responsive, accessible standards — and adds
optional online booking.

There are **two self-contained versions** so you can pick the right fit:

## Modern static site — at the repo root

A clean, simple, mobile-first marketing website. **No build step, no
dependencies** — just open `index.html`. This is what's published to GitHub
Pages (live at the repo's Pages URL).

- Warm theme matching the original brand (sand · ember · amber · espresso)
- The 6 services, why-us, and a short quote form
- BBB A+ accredited, family-owned, Rotobrush/NFPA messaging
- Sticky one-tap "Call" bar on mobile

Files: `index.html`, `styles.css`, `main.js`. Host it anywhere (GitHub Pages,
Netlify, any web host).

## 📁 `booking-platform/` — Site + online appointments + admin

Everything in the redesign **plus**:

- 🗓️ **Online booking wizard** — pick a service, date & live time slot, confirm → instant reference number
- 🔒 **Staff admin dashboard** — view/manage appointments, change status, see daily stats
- 📨 **Working contact/lead capture**
- ⚙️ Built on **pure Node.js** (built-in modules only) — **no `npm install`**, just `node server.js`

```bash
cd booking-platform
node server.js
# Site:    http://localhost:3000/
# Booking: http://localhost:3000/book
# Admin:   http://localhost:3000/admin   (password: supreme123)
```

Best if they want customers to self-schedule and want to manage jobs online.

➡️ See [`booking-platform/README.md`](booking-platform/README.md)

---

## Business details baked in

- **Phone:** 888-784-0746
- Family-owned & operated · BBB A+ accredited · Rotobrush-certified · NFPA-trained
- Flat-rate pricing, no upselling
- Services: Air Duct Cleaning · Dryer Vent Cleaning · Kitchen Exhaust Hood Cleaning · HVAC Visual Inspection · Air Filter Replacement · Air Duct Replacement
- Serves all of Southern California (Inland Empire, desert cities, San Diego County) + Las Vegas, NV

> Everything is easy to customize — colors are CSS variables, business rules
> (services/hours/slots) live in one config file, and contact details are plain
> text. Nothing here is locked in; it's a starting point we can refine together.
