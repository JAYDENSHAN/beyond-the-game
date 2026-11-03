/* =========================================================
   BEYOND THE GAME WELLNESS — site.js
   Page transitions, header, menu, scroll reveals,
   injury library search/filters, gallery lightbox.
   ========================================================= */
   (function () {
    "use strict";
  
    var doc = document.documentElement;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
    /* ---------- 1. Page transition curtain ---------- */
    var curtain = document.querySelector(".curtain");
  
    function isInternalPage(a) {
      if (!a || !a.href) return false;
      if (a.target && a.target !== "_self") return false;
      if (a.hasAttribute("download")) return false;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin && location.protocol !== "file:") return false;
      if (url.protocol !== location.protocol) return false;
      if (url.pathname === location.pathname && url.hash) return false;  // same-page anchor
      return /\.html?$|\/$/.test(url.pathname);
    }
  
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!curtain || reduceMotion || !isInternalPage(a)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      var href = a.href;
      document.body.classList.remove("menu-open");
      curtain.classList.remove("is-entering");
      void curtain.offsetWidth;
      curtain.classList.add("is-leaving");
      setTimeout(function () { location.href = href; }, 650);
    });
  
    // Coming back with the browser's Back button: hide the curtain again
    window.addEventListener("pageshow", function (e) {
      if (e.persisted && curtain) {
        curtain.classList.remove("is-leaving");
        curtain.classList.add("is-entering");
      }
    });
  
    /* ---------- 2. Header: hide on scroll down, show on scroll up ---------- */
    var header = document.querySelector(".site-header");
    var lastY = window.scrollY;
    var ticking = false;
    function onScroll() {
      var y = window.scrollY;
      if (header) {
        header.classList.toggle("is-scrolled", y > 30);
        if (!document.body.classList.contains("menu-open")) {
          header.classList.toggle("is-hidden", y > lastY && y > 300);
        }
      }
      lastY = y;
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  
    /* ---------- 3. Mobile menu ---------- */
    var toggle = document.querySelector(".menu-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = document.body.classList.toggle("menu-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
          document.body.classList.remove("menu-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  
    /* ---------- 4. Scroll reveals ---------- */
    var revealTargets = document.querySelectorAll("[data-reveal], .lines, .pulse-line, .shot, [data-count], .statement");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add("is-in");
          if (el.hasAttribute("data-count")) countUp(el);
          io.unobserve(el);
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
      revealTargets.forEach(function (el) { io.observe(el); });
    } else {
      revealTargets.forEach(function (el) { el.classList.add("is-in"); });
    }
  
    /* ---------- 5. Count-up numbers ---------- */
    function countUp(el) {
      var end = parseInt(el.getAttribute("data-count"), 10);
      if (reduceMotion || isNaN(end)) { el.textContent = end; return; }
      var start = null, dur = 1600;
      function step(t) {
        if (!start) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(end * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  
    /* ---------- 6. Statement: words light up as you scroll ---------- */
    document.querySelectorAll(".statement[data-scrub]").forEach(function (st) {
      var walker = document.createTreeWalker(st, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement("span");
          s.className = "word";
          s.textContent = part;
          frag.appendChild(s);
        });
        node.parentNode.replaceChild(frag, node);
      });
      var words = st.querySelectorAll(".word");
      if (reduceMotion) { words.forEach(function (w) { w.classList.add("lit"); }); return; }
      function scrub() {
        var r = st.getBoundingClientRect();
        var vh = window.innerHeight;
        var progress = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
        progress = Math.max(0, Math.min(1, progress));
        var lit = Math.round(progress * words.length);
        words.forEach(function (w, i) { w.classList.toggle("lit", i < lit); });
      }
      window.addEventListener("scroll", function () { requestAnimationFrame(scrub); }, { passive: true });
      scrub();
    });
  
    /* ---------- 7. Magnetic buttons (mouse only) ---------- */
    if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
      document.querySelectorAll(".btn, .feature .go i").forEach(function (btn) {
        btn.addEventListener("mousemove", function (e) {
          var r = btn.getBoundingClientRect();
          var x = (e.clientX - r.left - r.width / 2) * 0.18;
          var y = (e.clientY - r.top - r.height / 2) * 0.3;
          btn.style.transform = "translate(" + x + "px," + y + "px)";
        });
        btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
      });
  
      // Gentle 3D tilt on logo tiles
      document.querySelectorAll(".logo-tile").forEach(function (tile) {
        tile.addEventListener("mousemove", function (e) {
          var r = tile.getBoundingClientRect();
          var rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
          var ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
          tile.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
        });
        tile.addEventListener("mouseleave", function () { tile.style.transform = ""; });
      });
    }
  
    /* ---------- 8. Hero parallax (home) ---------- */
    var heroBg = document.querySelector(".hero-bg");
    if (heroBg && !reduceMotion) {
      window.addEventListener("scroll", function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) heroBg.style.translate = "0 " + y * 0.25 + "px";
      }, { passive: true });
    }
  
    /* ---------- 9. Missing images -> tidy placeholders ---------- */
    // Only mark a photo as missing if the browser actually fails to load it.
    // (An earlier version also checked img.complete, which some browsers report
    // for lazy-loaded photos that simply hadn't started loading yet.)
    document.querySelectorAll(".shot img, .logo-box img").forEach(function (img) {
      img.addEventListener("error", function () { img.parentElement.classList.add("missing"); });
      img.addEventListener("load", function () { img.parentElement.classList.remove("missing"); });
    });
  
    /* ---------- 10. Injury Library: smooth accordions ---------- */
    document.querySelectorAll("details.injury").forEach(function (det) {
      var summary = det.querySelector("summary");
      var content = det.querySelector(".card-content");
      var anim = null;
      summary.addEventListener("click", function (e) {
        if (reduceMotion || !content.animate) return;
        e.preventDefault();
        if (anim) anim.cancel();
        if (!det.open) {
          det.open = true;
          var h = content.offsetHeight;
          anim = content.animate(
            [{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }],
            { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
          );
          anim.onfinish = function () { anim = null; };
        } else {
          var h2 = content.offsetHeight;
          anim = content.animate(
            [{ height: h2 + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
            { duration: 380, easing: "cubic-bezier(0.76, 0, 0.24, 1)" }
          );
          anim.onfinish = function () { det.open = false; anim = null; };
        }
      });
    });
  
    /* ---------- 11. Injury Library: search + body-area filters ---------- */
    var list = document.querySelector(".injury-list");
    if (list) {
      var items = Array.prototype.slice.call(list.querySelectorAll(".injury"));
      var input = document.querySelector("#injury-search");
      var filterBtns = document.querySelectorAll(".filter");
      var countEl = document.querySelector(".lib-count");
      var empty = document.querySelector(".no-results");
      var region = "all";
  
      function apply() {
        var q = (input.value || "").trim().toLowerCase();
        var shown = 0;
        items.forEach(function (it) {
          var okRegion = region === "all" || it.getAttribute("data-region") === region;
          var okText = !q || it.textContent.toLowerCase().indexOf(q) !== -1;
          var show = okRegion && okText;
          it.classList.toggle("is-hidden", !show);
          if (show) shown++;
        });
        if (countEl) countEl.textContent = shown + (shown === 1 ? " injury" : " injuries");
        if (empty) empty.classList.toggle("show", shown === 0);
      }
      if (input) input.addEventListener("input", apply);
      filterBtns.forEach(function (b) {
        b.addEventListener("click", function () {
          filterBtns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", "true");
          region = b.getAttribute("data-filter");
          apply();
        });
      });
      apply();
  
      // Open an injury straight from a link like injurylibrary.html#acl-tears
      if (location.hash) {
        var target = document.getElementById(location.hash.slice(1));
        if (target && target.tagName === "DETAILS") target.open = true;
      }
    }
  
    /* ---------- 12. Gallery lightbox ---------- */
    var shots = Array.prototype.slice.call(document.querySelectorAll(".shot"));
    if (shots.length) {
      var lb = document.createElement("div");
      lb.className = "lightbox";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.setAttribute("aria-label", "Photo viewer");
      lb.innerHTML =
        '<img alt="">' +
        '<button class="lb-btn lb-close" aria-label="Close">✕</button>' +
        '<button class="lb-btn lb-prev" aria-label="Previous photo">←</button>' +
        '<button class="lb-btn lb-next" aria-label="Next photo">→</button>' +
        '<div class="lb-count"></div>';
      document.body.appendChild(lb);
      var lbImg = lb.querySelector("img");
      var lbCount = lb.querySelector(".lb-count");
      var group = [], idx = 0, lastFocus = null;
  
      function show(i) {
        idx = (i + group.length) % group.length;
        var img = group[idx].querySelector("img");
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lbCount.textContent = (idx + 1) + " / " + group.length;
      }
      function open(shot) {
        var gallery = shot.closest(".gallery");
        group = Array.prototype.slice.call(gallery.querySelectorAll(".shot:not(.missing)"));
        if (!group.length) return;
        lastFocus = document.activeElement;
        show(group.indexOf(shot));
        lb.classList.add("open");
        document.body.style.overflow = "hidden";
        lb.querySelector(".lb-close").focus();
      }
      function close() {
        lb.classList.remove("open");
        document.body.style.overflow = "";
        if (lastFocus) lastFocus.focus();
      }
      shots.forEach(function (s) {
        s.addEventListener("click", function () { if (!s.classList.contains("missing")) open(s); });
      });
      lb.querySelector(".lb-close").addEventListener("click", close);
      lb.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
      lb.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
      lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
      document.addEventListener("keydown", function (e) {
        if (!lb.classList.contains("open")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") show(idx - 1);
        if (e.key === "ArrowRight") show(idx + 1);
      });
    }
  })();