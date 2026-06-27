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

  /* ---- Latest insight on the home page ---- */
  var contactSection = document.getElementById("contact");
  var onHome = contactSection && location.pathname.indexOf("/insights/") === -1;
  if (onHome) {
    fetch("insights/articles.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (articles) {
        if (!Array.isArray(articles) || !articles.length) return;
        articles.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
        var a = articles[0];
        var url = "insights/" + encodeURIComponent(a.slug) + ".html";
        var card =
          '<article class="post-card">' +
          '<div class="post-meta"><span class="post-tag">' + esc(a.tag || "Business") + '</span>' +
          '<span class="post-date">' + esc(a.dateDisplay || "") + '</span></div>' +
          '<h2><a href="' + url + '">' + esc(a.title || "") + '</a></h2>' +
          '<p>' + esc(a.summary || "") + '</p>' +
          '<a href="' + url + '" class="read-more">Read article &rarr;</a>' +
          '</article>';
        var sec = document.createElement("section");
        sec.className = "section section-alt";
        sec.id = "insights-preview";
        sec.innerHTML =
          '<div class="container">' +
          '<div class="section-head"><p class="eyebrow">Insights</p>' +
          '<h2>Latest insight</h2></div>' +
          '<div style="max-width:640px;margin:0 auto">' + card + '</div>' +
          '<div style="text-align:center;margin-top:32px">' +
          '<a href="insights/" class="btn btn-gold">View more</a></div>' +
          '</div>';
        contactSection.parentNode.insertBefore(sec, contactSection);
      })
      .catch(function () {});
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

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
})();
