/* =========================================================================
   admin.js — staff dashboard. Login → list/manage appointments.
   Token is stored in localStorage and sent as a Bearer header.
   ========================================================================= */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const TOKEN_KEY = "sad_admin_token";
  let appointments = [];
  let filter = "all";

  const token = () => localStorage.getItem(TOKEN_KEY);
  const authHeaders = () => ({ "Authorization": "Bearer " + token(), "Content-Type": "application/json" });

  /* ---------------- auth ---------------- */
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#loginErr").textContent = "";
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: $("#pw").value }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem(TOKEN_KEY, data.token);
      showDash();
    } catch (err) {
      $("#loginErr").textContent = err.message;
    }
  });

  $("#logoutBtn").addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);
    $("#dash").hidden = true;
    $("#loginWrap").style.display = "grid";
  });

  $("#refreshBtn").addEventListener("click", load);

  function showDash() {
    $("#loginWrap").style.display = "none";
    $("#dash").hidden = false;
    load();
  }

  /* ---------------- data ---------------- */
  async function load() {
    try {
      const r = await fetch("/api/admin/appointments", { headers: authHeaders() });
      if (r.status === 401) { localStorage.removeItem(TOKEN_KEY); location.reload(); return; }
      const data = await r.json();
      appointments = data.appointments || [];
      renderStats(data.stats);
      renderTable();
    } catch (e) {
      alert("Couldn't load appointments. Is the server running?");
    }
  }

  function renderStats(s) {
    $("#stats").innerHTML = `
      <div class="admin-stat"><b>${s.todays}</b><span>Today's jobs</span></div>
      <div class="admin-stat"><b>${s.upcoming}</b><span>Upcoming</span></div>
      <div class="admin-stat"><b>${s.pending}</b><span>Pending confirmation</span></div>
      <div class="admin-stat"><b>${s.total}</b><span>Total booked</span></div>`;
  }

  /* ---------------- table ---------------- */
  const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

  function fmtWhen(a) {
    const [y, m, d] = a.date.split("-").map(Number);
    const dateStr = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const [hh] = a.time.split(":").map(Number);
    const end = hh + 2;
    const t12 = (h) => `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;
    return { dateStr, window: `${t12(hh)}–${t12(end)}` };
  }

  function passesFilter(a) {
    if (filter === "all") return true;
    if (filter === "upcoming") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [y, m, d] = a.date.split("-").map(Number);
      return new Date(y, m - 1, d) >= today && a.status !== "cancelled" && a.status !== "completed";
    }
    return a.status === filter;
  }

  function renderTable() {
    const rows = appointments.filter(passesFilter);
    const body = $("#apptBody");
    $("#emptyState").hidden = rows.length > 0;
    body.innerHTML = rows.map((a) => {
      const w = fmtWhen(a);
      const loc = [a.city, a.zip].filter(Boolean).join(" ") || "—";
      const addr = a.address ? esc(a.address) + (a.city ? ", " : "") : "";
      return `
      <tr data-id="${a.id}">
        <td data-label="Ref"><span class="appt-ref">${a.ref}</span></td>
        <td data-label="When"><div class="appt-when"><b>${w.dateStr}</b><span>${w.window}</span></div></td>
        <td data-label="Service">${esc(a.serviceName || a.service)}</td>
        <td data-label="Customer"><div class="appt-cust"><b>${esc(a.name)}</b><a href="tel:${esc(a.phone)}">${esc(a.phone)}</a>${a.email ? `<br><a href="mailto:${esc(a.email)}">${esc(a.email)}</a>` : ""}</div></td>
        <td data-label="Location"><div class="appt-cust"><b>${esc(loc)}</b><span style="font-size:.8rem;color:var(--bark)">${addr}</span></div></td>
        <td data-label="Status">
          <span class="badge ${a.status}">${a.status}</span>
        </td>
        <td data-label="">
          <select class="status-select" data-action="status">
            ${STATUSES.map((s) => `<option value="${s}" ${s === a.status ? "selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`).join("")}
          </select>
          <div><button class="row-del" data-action="delete">Delete</button></div>
        </td>
      </tr>`;
    }).join("");

    body.querySelectorAll("[data-action=status]").forEach((sel) => {
      sel.addEventListener("change", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        await updateStatus(id, e.target.value);
      });
    });
    body.querySelectorAll("[data-action=delete]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        if (confirm("Delete this appointment permanently?")) await del(id);
      });
    });
  }

  async function updateStatus(id, status) {
    try {
      const r = await fetch("/api/admin/appointments/" + id, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error();
      load();
    } catch (e) { alert("Update failed."); }
  }

  async function del(id) {
    try {
      const r = await fetch("/api/admin/appointments/" + id, { method: "DELETE", headers: authHeaders() });
      if (!r.ok) throw new Error();
      load();
    } catch (e) { alert("Delete failed."); }
  }

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      filter = chip.dataset.filter;
      renderTable();
    });
  });

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------------- init ---------------- */
  if (token()) showDash();
})();
