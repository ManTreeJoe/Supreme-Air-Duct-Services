# Supreme Air Duct Service — Booking Platform

The modern website **plus** a full online appointment system and a staff admin
dashboard. Built on **pure Node.js** (built-in modules only) — **no
`npm install` required**, nothing to compile, just run it.

```bash
cd booking-platform
node server.js
```

Then open:

| URL | What |
|-----|------|
| http://localhost:3000/        | The marketing site (warm redesign) |
| http://localhost:3000/book    | Customer booking wizard |
| http://localhost:3000/admin   | Staff dashboard (password: `supreme123`) |

> Node 18+ recommended (developed/tested on Node 22).

## What it does

### For customers
- **Online booking wizard** (`/book`) — a friendly 4-step flow:
  1. Pick a service (air duct, dryer vent, kitchen exhaust, inspection, filter, replacement)
  2. Choose a date on a live calendar (Sundays & past dates disabled, 60-day window) and an **available** arrival window
  3. Enter contact + address details
  4. Review & confirm → instant **confirmation reference** (e.g. `SAD-7K3QX9`)
- **Real availability** — slots already booked show as unavailable; the server
  rejects double-bookings even under a race.
- **Quote/contact form** on the homepage posts real leads to the backend.
- **Service-area checker** on the homepage.

### For the business (admin)
- **Dashboard** (`/admin`) with at-a-glance stats: today's jobs, upcoming,
  pending confirmations, total booked.
- **Appointment table** with filters (all / upcoming / pending / confirmed /
  completed / cancelled), one-click **status changes**, click-to-call / email,
  and delete.
- **Password-protected** with stateless HMAC-signed session tokens.

## How it's built (zero dependencies)

```
booking-platform/
├── server.js          # HTTP server: static files + JSON API + routing
├── lib/
│   ├── store.js       # JSON-file data store (atomic writes) — appointments & messages
│   ├── config.js      # Services, business hours, time slots, service areas
│   └── auth.js        # HMAC-signed admin tokens, password check
├── public/            # The website + booking & admin front-ends
│   ├── index.html     # Marketing site (warm redesign)
│   ├── book.html / book.js
│   ├── admin.html / admin.js
│   ├── styles.css     # Shared warm theme + booking/admin styles
│   └── main.js
├── data/              # Runtime JSON (git-ignored — holds real customer data)
├── package.json
└── .env.example
```

### API at a glance

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET  | `/api/services` | — | List services |
| GET  | `/api/availability?date=YYYY-MM-DD` | — | Open slots for a date |
| POST | `/api/appointments` | — | Create a booking |
| POST | `/api/contact` | — | Submit a quote/contact lead |
| POST | `/api/admin/login` | — | Exchange password for a token |
| GET  | `/api/admin/appointments` | ✓ | List bookings + stats |
| PATCH| `/api/admin/appointments/:id` | ✓ | Change status |
| DELETE| `/api/admin/appointments/:id` | ✓ | Remove a booking |
| GET  | `/api/admin/messages` | ✓ | List contact leads |

## Configuration

Copy `.env.example` → `.env` (all optional):

```bash
PORT=3000
ADMIN_PASSWORD=supreme123          # change this!
AUTH_SECRET=a-long-random-string   # change this in production!
```

**Change services, hours, or time slots** in `lib/config.js`. The calendar and
availability update automatically.

## Recommended next steps (production)

These are intentionally left as clear extension points:

- **Email/SMS confirmations & reminders** — hook into the `POST /api/appointments`
  handler in `server.js` (Twilio for SMS, Resend/SendGrid for email).
- **Database** — `lib/store.js` is the only file that touches storage. Swap the
  JSON store for SQLite or Postgres without changing the API.
- **Payments / deposits** — add a Stripe checkout step after confirmation.
- **Google Reviews + Calendar sync** — pull live reviews; push jobs to a crew calendar.
- **HTTPS & hosting** — run behind Nginx/Caddy or deploy to Render, Railway,
  Fly.io, or a small VPS.

## Data & privacy

Real bookings and leads are written to `data/*.json`, which is **git-ignored**
so customer data is never committed. Back this folder up if you run it for real.

---

Want just the marketing site with no server? See **`../redesign/`**.
