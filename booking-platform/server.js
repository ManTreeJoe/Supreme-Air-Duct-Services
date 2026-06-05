/* =========================================================================
   Supreme Air Duct Service — Booking Platform
   Zero-dependency Node.js server (built-in modules only).
   Run:  node server.js     →  http://localhost:3000
   ========================================================================= */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const { Appointments, Messages } = require("./lib/store");
const { SERVICES, SLOTS, SERVICE_AREAS, isOpenOn, serviceName } = require("./lib/config");
const { issueToken, verifyToken, checkPassword } = require("./lib/auth");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

/* ---------------------------- helpers ---------------------------- */
function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1e6) { reject(new Error("payload too large")); req.destroy(); }
      data += chunk;
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(new Error("invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function requireAuth(req) {
  const h = req.headers["authorization"] || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  return verifyToken(token);
}

function isValidDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s); }

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* ---------------------------- static files ---------------------------- */
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/") rel = "/index.html";
  // strip query already gone; prevent path traversal
  const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(PUBLIC_DIR, safe);
  if (!filePath.startsWith(PUBLIC_DIR)) return notFound(res);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // pretty routes: /book -> book.html, /admin -> admin.html
      const alt = path.join(PUBLIC_DIR, safe + ".html");
      if (fs.existsSync(alt)) return streamFile(res, alt);
      return notFound(res);
    }
    streamFile(res, filePath);
  });
}

function streamFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const cache = ext === ".html" ? "no-cache" : "public, max-age=3600";
  res.writeHead(200, { "Content-Type": type, "Cache-Control": cache });
  fs.createReadStream(filePath).pipe(res);
}

function notFound(res) {
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<h1>404 — Not found</h1><p><a href='/'>Back home</a></p>");
}

/* ---------------------------- API ---------------------------- */
async function handleApi(req, res, url) {
  const { pathname } = url;
  const method = req.method;

  // --- public: services list ---
  if (pathname === "/api/services" && method === "GET") {
    return sendJSON(res, 200, { services: SERVICES });
  }

  // --- public: service areas ---
  if (pathname === "/api/areas" && method === "GET") {
    return sendJSON(res, 200, { areas: SERVICE_AREAS });
  }

  // --- public: availability for a date ---
  if (pathname === "/api/availability" && method === "GET") {
    const date = url.searchParams.get("date");
    if (!date || !isValidDate(date)) return sendJSON(res, 400, { error: "Invalid date" });
    if (date < todayStr()) return sendJSON(res, 200, { date, open: false, slots: [] });
    if (!isOpenOn(date)) return sendJSON(res, 200, { date, open: false, slots: [] });
    const slots = SLOTS.map((s) => ({
      ...s,
      available: !Appointments.isTaken(date, s.time),
    }));
    return sendJSON(res, 200, { date, open: true, slots });
  }

  // --- public: create appointment ---
  if (pathname === "/api/appointments" && method === "POST") {
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendJSON(res, 400, { error: e.message }); }

    const required = ["name", "phone", "service", "date", "time"];
    for (const f of required) {
      if (!body[f] || String(body[f]).trim() === "") {
        return sendJSON(res, 400, { error: `Missing field: ${f}` });
      }
    }
    if (!isValidDate(body.date)) return sendJSON(res, 400, { error: "Invalid date" });
    if (body.date < todayStr()) return sendJSON(res, 400, { error: "Date is in the past" });
    if (!isOpenOn(body.date)) return sendJSON(res, 400, { error: "We're closed that day" });
    if (!SLOTS.some((s) => s.time === body.time)) return sendJSON(res, 400, { error: "Invalid time slot" });
    if (Appointments.isTaken(body.date, body.time)) {
      return sendJSON(res, 409, { error: "Sorry, that slot was just booked. Please pick another." });
    }
    const appt = Appointments.create(body);
    // (In production: trigger confirmation email/SMS here.)
    return sendJSON(res, 201, {
      ok: true,
      ref: appt.ref,
      appointment: { ref: appt.ref, date: appt.date, time: appt.time, service: serviceName(appt.service) },
    });
  }

  // --- public: contact / quote message ---
  if (pathname === "/api/contact" && method === "POST") {
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendJSON(res, 400, { error: e.message }); }
    if (!body.name || !body.phone) return sendJSON(res, 400, { error: "Name and phone are required" });
    Messages.create(body);
    return sendJSON(res, 201, { ok: true });
  }

  // --- admin: login ---
  if (pathname === "/api/admin/login" && method === "POST") {
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendJSON(res, 400, { error: e.message }); }
    if (!checkPassword(body.password || "")) {
      return sendJSON(res, 401, { error: "Incorrect password" });
    }
    return sendJSON(res, 200, { token: issueToken() });
  }

  // --- admin: everything below requires auth ---
  if (pathname.startsWith("/api/admin/")) {
    if (!requireAuth(req)) return sendJSON(res, 401, { error: "Unauthorized" });
  }

  // --- admin: list appointments (+ stats) ---
  if (pathname === "/api/admin/appointments" && method === "GET") {
    const all = Appointments.all().map((a) => ({ ...a, serviceName: serviceName(a.service) }));
    const today = todayStr();
    const stats = {
      total: all.length,
      pending: all.filter((a) => a.status === "pending").length,
      confirmed: all.filter((a) => a.status === "confirmed").length,
      upcoming: all.filter((a) => a.date >= today && a.status !== "cancelled" && a.status !== "completed").length,
      todays: all.filter((a) => a.date === today && a.status !== "cancelled").length,
    };
    return sendJSON(res, 200, { appointments: all, stats });
  }

  // --- admin: update appointment status ---
  const apptMatch = pathname.match(/^\/api\/admin\/appointments\/([\w-]+)$/);
  if (apptMatch && method === "PATCH") {
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendJSON(res, 400, { error: e.message }); }
    const allowed = ["pending", "confirmed", "completed", "cancelled"];
    if (!allowed.includes(body.status)) return sendJSON(res, 400, { error: "Invalid status" });
    const updated = Appointments.update(apptMatch[1], { status: body.status });
    if (!updated) return sendJSON(res, 404, { error: "Not found" });
    return sendJSON(res, 200, { ok: true, appointment: updated });
  }

  // --- admin: delete appointment ---
  if (apptMatch && method === "DELETE") {
    const ok = Appointments.remove(apptMatch[1]);
    return sendJSON(res, ok ? 200 : 404, { ok });
  }

  // --- admin: messages ---
  if (pathname === "/api/admin/messages" && method === "GET") {
    return sendJSON(res, 200, { messages: Messages.all() });
  }
  const msgMatch = pathname.match(/^\/api\/admin\/messages\/([\w-]+)$/);
  if (msgMatch && method === "PATCH") {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJSON(res, 400, { error: e.message }); }
    const updated = Messages.update(msgMatch[1], { handled: !!body.handled });
    if (!updated) return sendJSON(res, 404, { error: "Not found" });
    return sendJSON(res, 200, { ok: true });
  }

  return sendJSON(res, 404, { error: "Unknown endpoint" });
}

/* ---------------------------- server ---------------------------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      return await handleApi(req, res, url);
    }
    return serveStatic(req, res, url.pathname);
  } catch (err) {
    console.error("Server error:", err);
    sendJSON(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`\n  Supreme Air Duct — Booking Platform`);
  console.log(`  ▸ Site:    http://localhost:${PORT}/`);
  console.log(`  ▸ Booking: http://localhost:${PORT}/book`);
  console.log(`  ▸ Admin:   http://localhost:${PORT}/admin   (password: ${process.env.ADMIN_PASSWORD ? "set via env" : "supreme123"})\n`);
});
