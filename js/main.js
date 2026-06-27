/* ===================================================================
   Stone Cold Solutions — site behavior
   =================================================================== */
(function () {
  "use strict";

  /* ---- Current year in footer ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Mobile nav toggle ---- */
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Reveal-on-scroll ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Contact form ---- */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");

  function setStatus(msg, type) {
    if (!status) return;
    status.textContent = msg;
    status.className = "form-status" + (type ? " " + type : "");
  }

  if (form) {
    var action = form.getAttribute("action") || "";
    var usingFormspree = action.indexOf("YOUR_FORM_ID") === -1 && action.indexOf("formspree.io") !== -1;

    form.addEventListener("submit", function (e) {
      if (!usingFormspree) {
        e.preventDefault();
        var name = (val("first") + " " + val("last")).trim();
        var subject = encodeURIComponent("Website inquiry from " + (name || "a visitor"));
        var body = encodeURIComponent(
          "Name: " + name +
          "\nEmail: " + val("email") +
          "\nPhone: " + val("phone") +
          "\n\nMessage:\n" + val("message")
        );
        window.location.href =
          "mailto:Info@stonecoldsolutions.io?subject=" + subject + "&body=" + body;
        setStatus("Opening your email app to send the message.", "ok");
        return;
      }

      e.preventDefault();
      setStatus("Sending...", "");
      var data = new FormData(form);
      fetch(action, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            setStatus("Thanks! Your message has been sent. We will be in touch shortly.", "ok");
          } else {
            return res.json().then(function (d) {
              throw new Error((d && d.errors && d.errors[0] && d.errors[0].message) || "Submission failed.");
            });
          }
        })
        .catch(function () {
          setStatus("Something went wrong. Please email Info@stonecoldsolutions.io directly.", "err");
        });
    });
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
})();
