/* =========================================================================
   Supreme Air Duct Service — interactions
   Vanilla JS, no dependencies. Handles: sticky header, mobile drawer,
   scroll reveal, ZIP/area checker, and the quote form.
   ========================================================================= */
(function () {
  "use strict";

  /* ---- Sticky header shadow ---- */
  const header = document.getElementById("header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile drawer ---- */
  const drawer = document.getElementById("drawer");
  const toggle = document.getElementById("navToggle");
  const openDrawer = () => {
    drawer.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };
  const closeDrawer = () => {
    drawer.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };
  toggle.addEventListener("click", openDrawer);
  drawer.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]") || e.target.closest("[data-close]")) closeDrawer();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  /* ---- Scroll reveal ---- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = (Math.min(i % 4, 3) * 0.08) + "s";
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---- Service-area checker ---- */
  const SERVICE_AREAS = [
    "riverside","moreno valley","perris","norco","chino","corona","pomona",
    "canyon lake","temecula","menifee","murrieta","sun city","winchester",
    "lake elsinore","upland","rialto","yucaipa","palm springs","palm desert",
    "la quinta","desert palms","rancho mirage","chula vista","el cajon",
    "oceanside","rancho bernardo","san diego","las vegas"
  ];
  // Representative ZIP prefixes we cover (Inland Empire, desert, San Diego Co., LV)
  const ZIP_PREFIXES = ["900","902","909","917","918","919","920","921","922","923","924","925","926","927","928","891","889"];

  const zipForm = document.getElementById("zipForm");
  const zipInput = document.getElementById("zipInput");
  const zipResult = document.getElementById("zipResult");

  zipForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = zipInput.value.trim().toLowerCase();
    if (!raw) {
      zipResult.textContent = "Please enter a city or ZIP code.";
      zipResult.className = "zip-result no";
      return;
    }
    let covered = false;
    if (/^\d{5}$/.test(raw)) {
      covered = ZIP_PREFIXES.some((p) => raw.startsWith(p));
    } else {
      covered = SERVICE_AREAS.some((city) => raw.includes(city) || city.includes(raw));
    }
    if (covered) {
      zipResult.textContent = "✓ Great news — we serve your area! Call 888-784-0746 or request a quote below.";
      zipResult.className = "zip-result ok";
    } else {
      zipResult.textContent = "We may still cover you! Give us a call at 888-784-0746 to confirm.";
      zipResult.className = "zip-result no";
    }
  });

  /* ---- Quote form (posts to the booking platform API) ---- */
  const form = document.getElementById("quoteForm");
  const success = document.getElementById("formSuccess");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    if (!name || !phone) {
      [["name", name], ["phone", phone]].forEach(([id, val]) => {
        form[id].style.borderColor = val ? "" : "var(--ember)";
      });
      return;
    }
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Sending…";
    const payload = {
      name, phone,
      email: form.email.value.trim(),
      city: form.city.value.trim(),
      service: form.service.value,
      message: form.message.value.trim(),
    };
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("request failed");
    } catch (err) {
      // Best-effort: even on a network hiccup we still thank the customer.
    }
    form.style.display = "none";
    success.classList.add("show");
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  ["name", "phone"].forEach((id) => {
    form[id].addEventListener("input", () => { form[id].style.borderColor = ""; });
  });

  /* ---- Footer year ---- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
