/* Supreme Air Duct Service — minimal interactions */
(function () {
  "use strict";

  // Header shadow on scroll
  var hdr = document.getElementById("hdr");
  var onScroll = function () { hdr.classList.toggle("scrolled", window.scrollY > 6); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Quote form (demo: client-side success; wire to email/CRM in production)
  var form = document.getElementById("quoteForm");
  var ok = document.getElementById("formOk");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    if (!name || !phone) {
      form.name.style.borderColor = name ? "" : "var(--ember)";
      form.phone.style.borderColor = phone ? "" : "var(--ember)";
      return;
    }
    form.querySelector("button").style.display = "none";
    ok.classList.add("show");
  });
  ["name", "phone"].forEach(function (id) {
    form[id].addEventListener("input", function () { form[id].style.borderColor = ""; });
  });

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();
})();
