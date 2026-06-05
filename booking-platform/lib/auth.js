/* =========================================================================
   auth.js — minimal stateless admin auth via HMAC-signed tokens.
   No external dependencies. The admin password and signing secret come
   from environment variables (with safe-ish dev defaults).
   ========================================================================= */
"use strict";

const crypto = require("crypto");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "supreme123";
const SECRET = process.env.AUTH_SECRET || "change-me-in-production-please";
const TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function sign(payload) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

// token = base64(expiry).signature
function issueToken() {
  const expiry = String(Date.now() + TTL_MS);
  const b = Buffer.from(expiry).toString("base64");
  return b + "." + sign(b);
}

function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [b, sig] = token.split(".");
  if (!b || !sig) return false;
  const expected = sign(b);
  // constant-time compare
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const expiry = Number(Buffer.from(b, "base64").toString("utf8"));
  return Number.isFinite(expiry) && Date.now() < expiry;
}

function checkPassword(pw) {
  const a = Buffer.from(String(pw));
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { issueToken, verifyToken, checkPassword };
