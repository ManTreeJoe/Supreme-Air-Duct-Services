# Supreme Air Duct Service — Website Rebuild

A pro-bono rebuild of [supremeairductservice.com](https://supremeairductservice.com),
a family-owned air duct, dryer vent & kitchen exhaust cleaning company serving
all of Southern California.

The original site is a dark warm-brown design with gold/amber headings. This
rebuild keeps that **warm** identity (sand · ember · amber · espresso) while
bringing everything up to modern, responsive, accessible standards — and adds
optional online booking.

There are **two self-contained versions** so you can pick the right fit:

## 📁 `redesign/` — Modern static site

A clean, fast, fully responsive marketing website. **No build step, no
dependencies** — just open `redesign/index.html`.

- Warm theme matching the original brand
- All 6 services, "why us," process, 25+ service areas with a live coverage checker
- Authentic content: BBB A+ accredited, family-owned, Rotobrush/NFPA, air-quality facts
- Client-side quote form

Best if they just want a great-looking site to host anywhere (Netlify, GitHub
Pages, any web host).

➡️ See [`redesign/README.md`](redesign/README.md)

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
