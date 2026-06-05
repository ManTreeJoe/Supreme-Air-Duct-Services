/* =========================================================================
   book.js — 4-step booking wizard. Talks to the booking API.
   Vanilla JS, no dependencies.
   ========================================================================= */
(function () {
  "use strict";

  const state = {
    step: 1,
    service: null,        // { id, name, duration }
    date: null,           // YYYY-MM-DD
    dateLabel: null,
    time: null,           // "08:00"
    timeLabel: null,
    details: {},
  };

  const $ = (s) => document.querySelector(s);
  const fmtDate = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const todayMidnight = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

  /* ---------------- step navigation ---------------- */
  function goto(step) {
    state.step = step;
    document.querySelectorAll(".step").forEach((s) => s.classList.remove("active"));
    const map = { 1: "step1", 2: "step2", 3: "step3", 4: "step4", 5: "stepDone" };
    $("#" + map[step]).classList.add("active");
    // stepper visuals
    document.querySelectorAll("#stepper .dot").forEach((dot) => {
      const n = Number(dot.dataset.step);
      dot.classList.toggle("active", n === step);
      dot.classList.toggle("done", n < step);
    });
    if (step === 4) renderSummary();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelectorAll("[data-prev]").forEach((b) =>
    b.addEventListener("click", () => goto(Math.max(1, state.step - 1)))
  );

  /* ---------------- step 1: services ---------------- */
  async function loadServices() {
    let services;
    try {
      const r = await fetch("/api/services");
      services = (await r.json()).services;
    } catch (e) {
      $("#err1").textContent = "Couldn't load services. Please refresh or call 888-784-0746.";
      return;
    }
    const wrap = $("#svcOptions");
    wrap.innerHTML = services.map((s) => `
      <button type="button" class="svc-option" data-id="${s.id}" data-name="${s.name}" data-dur="${s.duration}">
        <span class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
        <span><b>${s.name}</b><span>${s.desc}</span><span class="dur">~ ${s.duration}</span></span>
      </button>`).join("");
    wrap.querySelectorAll(".svc-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        wrap.querySelectorAll(".svc-option").forEach((o) => o.classList.remove("selected"));
        opt.classList.add("selected");
        state.service = { id: opt.dataset.id, name: opt.dataset.name, duration: opt.dataset.dur };
        $("#next1").disabled = false;
        $("#err1").textContent = "";
      });
    });
  }
  $("#next1").addEventListener("click", () => {
    if (!state.service) { $("#err1").textContent = "Please choose a service."; return; }
    goto(2);
  });

  /* ---------------- step 2: calendar + slots ---------------- */
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  let viewYear, viewMonth; // currently displayed month

  function initCal() {
    const t = todayMidnight();
    viewYear = t.getFullYear();
    viewMonth = t.getMonth();
    renderCal();
  }

  function renderCal() {
    $("#calLabel").textContent = `${MONTHS[viewMonth]} ${viewYear}`;
    const grid = $("#calGrid");
    const today = todayMidnight();
    const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 60); // 60-day window
    const first = new Date(viewYear, viewMonth, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    let html = DOW.map((d) => `<div class="dow">${d}</div>`).join("");
    for (let i = 0; i < startDow; i++) html += `<button class="cal-day muted" disabled></button>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(viewYear, viewMonth, d);
      const iso = fmtDate(viewYear, viewMonth, d);
      const isPast = cellDate < today;
      const isSunday = cellDate.getDay() === 0;
      const tooFar = cellDate > maxDate;
      const disabled = isPast || isSunday || tooFar;
      const classes = ["cal-day"];
      if (cellDate.getTime() === today.getTime()) classes.push("today");
      if (state.date === iso) classes.push("selected");
      html += `<button class="${classes.join(" ")}" data-iso="${iso}" ${disabled ? "disabled" : ""}>${d}</button>`;
    }
    grid.innerHTML = html;
    grid.querySelectorAll(".cal-day[data-iso]:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => selectDate(btn.dataset.iso));
    });

    // disable prev nav past current month
    const atCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    $("#calPrev").disabled = atCurrentMonth;
  }

  $("#calPrev").addEventListener("click", () => {
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } renderCal();
  });
  $("#calNext").addEventListener("click", () => {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } renderCal();
  });

  async function selectDate(iso) {
    state.date = iso;
    state.time = null;
    $("#next2").disabled = true;
    renderCal();
    const [y, m, d] = iso.split("-").map(Number);
    const labelDate = new Date(y, m - 1, d);
    state.dateLabel = labelDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    $("#slotsTitle").textContent = state.dateLabel;
    $("#slotList").innerHTML = `<div class="slots-empty">Loading available times…</div>`;
    try {
      const r = await fetch(`/api/availability?date=${iso}`);
      const data = await r.json();
      renderSlots(data);
    } catch (e) {
      $("#slotList").innerHTML = `<div class="slots-empty">Couldn't load times. Call 888-784-0746.</div>`;
    }
  }

  function renderSlots(data) {
    const list = $("#slotList");
    if (!data.open || !data.slots.length) {
      list.innerHTML = `<div class="slots-empty">No availability this day — please pick another date.</div>`;
      return;
    }
    list.innerHTML = data.slots.map((s) => `
      <button type="button" class="slot" data-time="${s.time}" data-label="${s.label}" ${s.available ? "" : "disabled"}>
        <span>${s.label}</span>
        ${s.available ? `<span class="taken">Available</span>` : `<span class="taken">Booked</span>`}
      </button>`).join("");
    list.querySelectorAll(".slot:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => {
        list.querySelectorAll(".slot").forEach((s) => s.classList.remove("selected"));
        btn.classList.add("selected");
        state.time = btn.dataset.time;
        state.timeLabel = btn.dataset.label;
        $("#next2").disabled = false;
        $("#err2").textContent = "";
      });
    });
  }

  $("#next2").addEventListener("click", () => {
    if (!state.date || !state.time) { $("#err2").textContent = "Please pick a date and time."; return; }
    goto(3);
  });

  /* ---------------- step 3: details ---------------- */
  $("#next3").addEventListener("click", () => {
    const name = $("#b_name").value.trim();
    const phone = $("#b_phone").value.trim();
    let ok = true;
    [["b_name", name], ["b_phone", phone]].forEach(([id, val]) => {
      $("#" + id).style.borderColor = val ? "" : "var(--ember)";
      if (!val) ok = false;
    });
    if (!ok) { $("#err3").textContent = "Please enter your name and phone number."; return; }
    state.details = {
      name, phone,
      email: $("#b_email").value.trim(),
      address: $("#b_address").value.trim(),
      city: $("#b_city").value.trim(),
      zip: $("#b_zip").value.trim(),
      notes: $("#b_notes").value.trim(),
    };
    $("#err3").textContent = "";
    goto(4);
  });
  ["b_name", "b_phone"].forEach((id) =>
    $("#" + id).addEventListener("input", () => { $("#" + id).style.borderColor = ""; })
  );

  /* ---------------- step 4: summary + confirm ---------------- */
  function renderSummary() {
    const d = state.details;
    const loc = [d.address, d.city, d.zip].filter(Boolean).join(", ") || "—";
    $("#summary").innerHTML = `
      <div class="summary-row"><span>Service</span><b>${state.service.name}</b></div>
      <div class="summary-row"><span>Date</span><b>${state.dateLabel}</b></div>
      <div class="summary-row"><span>Arrival window</span><b>${state.timeLabel}</b></div>
      <div class="summary-row"><span>Name</span><b>${esc(d.name)}</b></div>
      <div class="summary-row"><span>Phone</span><b>${esc(d.phone)}</b></div>
      ${d.email ? `<div class="summary-row"><span>Email</span><b>${esc(d.email)}</b></div>` : ""}
      <div class="summary-row"><span>Location</span><b>${esc(loc)}</b></div>
      ${d.notes ? `<div class="summary-row"><span>Notes</span><b>${esc(d.notes)}</b></div>` : ""}`;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  $("#confirmBtn").addEventListener("click", async () => {
    const btn = $("#confirmBtn");
    btn.disabled = true;
    btn.textContent = "Booking…";
    $("#err4").textContent = "";
    const payload = {
      service: state.service.id,
      date: state.date,
      time: state.time,
      ...state.details,
    };
    try {
      const r = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Booking failed");
      $("#doneRef").textContent = data.ref;
      $("#doneSummary").innerHTML = `
        <div class="summary-row"><span>Service</span><b>${state.service.name}</b></div>
        <div class="summary-row"><span>Date</span><b>${state.dateLabel}</b></div>
        <div class="summary-row"><span>Window</span><b>${state.timeLabel}</b></div>`;
      goto(5);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Confirm Appointment";
      $("#err4").textContent = err.message + (/just booked/i.test(err.message) ? "" : " Please try again or call 888-784-0746.");
      if (/slot/i.test(err.message)) goto(2); // slot taken — send back to pick another
    }
  });

  /* ---------------- init ---------------- */
  loadServices();
  initCal();
})();
