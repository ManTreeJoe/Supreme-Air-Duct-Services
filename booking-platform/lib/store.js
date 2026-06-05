/* =========================================================================
   store.js — tiny JSON-file data store (no external dependencies)
   Persists appointments and contact messages to ./data/*.json with
   atomic writes. Good enough for a small business; swap for SQLite/Postgres
   later without changing the API surface much.
   ========================================================================= */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const APPTS_FILE = path.join(DATA_DIR, "appointments.json");
const MSGS_FILE = path.join(DATA_DIR, "messages.json");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(APPTS_FILE)) fs.writeFileSync(APPTS_FILE, "[]");
  if (!fs.existsSync(MSGS_FILE)) fs.writeFileSync(MSGS_FILE, "[]");
}
ensure();

function read(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8") || "[]");
  } catch (e) {
    return [];
  }
}

// Atomic-ish write: write to temp then rename.
function write(file, data) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

/* Short, human-friendly reference like "SAD-7K3QX9" */
function makeRef() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[crypto.randomInt(alphabet.length)];
  return "SAD-" + s;
}

const Appointments = {
  all() {
    return read(APPTS_FILE).sort((a, b) =>
      (a.date + a.time).localeCompare(b.date + b.time)
    );
  },

  forDate(date) {
    return read(APPTS_FILE).filter(
      (a) => a.date === date && a.status !== "cancelled"
    );
  },

  // Is a given date+time slot already taken by an active booking?
  isTaken(date, time) {
    return this.forDate(date).some((a) => a.time === time);
  },

  create(data) {
    const list = read(APPTS_FILE);
    const now = new Date().toISOString();
    const appt = {
      id: crypto.randomUUID(),
      ref: makeRef(),
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      service: data.service,
      address: data.address || "",
      city: data.city || "",
      zip: data.zip || "",
      date: data.date,
      time: data.time,
      notes: data.notes || "",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    list.push(appt);
    write(APPTS_FILE, list);
    return appt;
  },

  update(id, patch) {
    const list = read(APPTS_FILE);
    const i = list.findIndex((a) => a.id === id);
    if (i === -1) return null;
    list[i] = { ...list[i], ...patch, updatedAt: new Date().toISOString() };
    write(APPTS_FILE, list);
    return list[i];
  },

  remove(id) {
    const list = read(APPTS_FILE);
    const next = list.filter((a) => a.id !== id);
    write(APPTS_FILE, next);
    return next.length !== list.length;
  },
};

const Messages = {
  all() {
    return read(MSGS_FILE).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  create(data) {
    const list = read(MSGS_FILE);
    const msg = {
      id: crypto.randomUUID(),
      name: data.name,
      phone: data.phone || "",
      email: data.email || "",
      city: data.city || "",
      service: data.service || "",
      message: data.message || "",
      handled: false,
      createdAt: new Date().toISOString(),
    };
    list.push(msg);
    write(MSGS_FILE, list);
    return msg;
  },
  update(id, patch) {
    const list = read(MSGS_FILE);
    const i = list.findIndex((m) => m.id === id);
    if (i === -1) return null;
    list[i] = { ...list[i], ...patch };
    write(MSGS_FILE, list);
    return list[i];
  },
};

module.exports = { Appointments, Messages };
