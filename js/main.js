/* ============================================================
   VERSTAK — main.js: навигация, reveal-анимации, hero-canvas,
   аккордеон услуг, прогресс процесса, форма, переходы.
   ============================================================ */
(function () {
  "use strict";

  var cfg = window.VERSTAK_CONFIG || {};

  /* ---------- Контактные данные из config.js ---------- */
  document.querySelectorAll("[data-cfg]").forEach(function (el) {
    var key = el.getAttribute("data-cfg");
    if (key === "telegram") el.textContent = "@" + cfg.telegramHandle;
    if (key === "email") el.textContent = cfg.email;
    if (key === "telegram-inline") el.textContent = "Telegram: @" + cfg.telegramHandle;
  });
  document.querySelectorAll("[data-cfg-link]").forEach(function (el) {
    var key = el.getAttribute("data-cfg-link");
    if (key === "telegram") el.setAttribute("href", cfg.telegramUrl || "https://t.me/" + cfg.telegramHandle);
    if (key === "email") el.setAttribute("href", "mailto:" + cfg.email);
  });

  /* ---------- Появление страницы ---------- */
  requestAnimationFrame(function () {
    document.body.classList.add("is-loaded");
  });

  /* ---------- Навигация: скролл-состояние ---------- */
  var nav = document.getElementById("nav");
  function onScrollNav() {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---------- Мобильное меню ---------- */
  var burger = document.getElementById("burger");
  var mobileMenu = document.getElementById("mobileMenu");
  function closeMenu() {
    burger.classList.remove("is-open");
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  burger.addEventListener("click", function () {
    var open = !mobileMenu.classList.contains("is-open");
    burger.classList.toggle("is-open", open);
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* ---------- Reveal при прокрутке ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Аккордеон услуг ---------- */
  document.querySelectorAll(".svc-row").forEach(function (row) {
    var head = row.querySelector(".svc-head");
    head.addEventListener("click", function () {
      var willOpen = !row.classList.contains("is-open");
      document.querySelectorAll(".svc-row.is-open").forEach(function (r) {
        if (r !== row) {
          r.classList.remove("is-open");
          r.querySelector(".svc-head").setAttribute("aria-expanded", "false");
        }
      });
      row.classList.toggle("is-open", willOpen);
      head.setAttribute("aria-expanded", String(willOpen));
    });
  });
  // первая строка открыта по умолчанию — задаёт тон
  var firstSvc = document.querySelector(".svc-row");
  if (firstSvc) {
    firstSvc.classList.add("is-open");
    firstSvc.querySelector(".svc-head").setAttribute("aria-expanded", "true");
  }

  /* ---------- Прогресс процесса ---------- */
  var steps = document.querySelectorAll("#steps .step");
  var stepsWrap = document.getElementById("steps");
  var progressBar = document.getElementById("processProgress");
  if (steps.length && stepsWrap && "IntersectionObserver" in window) {
    var stepIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.classList.add("is-active");
        });
      },
      { threshold: 0.55 }
    );
    steps.forEach(function (s) { stepIo.observe(s); });

    var onScrollProgress = function () {
      var rect = stepsWrap.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = rect.height;
      var passed = Math.min(Math.max(vh * 0.55 - rect.top, 0), total);
      var pct = total ? (passed / total) * 100 : 0;
      stepsWrap.style.setProperty("--progress", pct + "%");
      if (progressBar) progressBar.style.transform = "scaleX(" + pct / 100 + ")";
    };
    onScrollProgress();
    window.addEventListener("scroll", onScrollProgress, { passive: true });
    window.addEventListener("resize", onScrollProgress);
  }

  /* ---------- «Наверх» ---------- */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Wipe-переход на страницы демо ---------- */
  document.querySelectorAll("[data-wipe]").forEach(function (link) {
    link.addEventListener("click", function (ev) {
      var href = link.getAttribute("href");
      if (!href || ev.metaKey || ev.ctrlKey || reduceMotion) return;
      ev.preventDefault();
      document.body.classList.add("is-wiping");
      setTimeout(function () { window.location.href = href; }, reduceMotion ? 0 : 430);
    });
  });

  /* ---------- Форма заявки (честный демо-режим) ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    var note = document.getElementById("formNote");
    var submitBtn = document.getElementById("formSubmit");

    // предзаполнение по параметру ?project=flowdesk|tendertrace|frameport
    try {
      var params = new URLSearchParams(window.location.search);
      var from = params.get("project");
      var typeMap = { flowdesk: "Веб-приложение", tendertrace: "Автоматизация", frameport: "Сайт" };
      var nameMap = { flowdesk: "FLOWDESK", tendertrace: "TENDERTRACE", frameport: "FRAMEPORT" };
      if (from && typeMap[from]) {
        form.querySelector('[name="type"]').value = typeMap[from];
        var msg = form.querySelector('[name="message"]');
        if (!msg.value) {
          msg.value = "Здравствуйте! Понравился демо-проект " + nameMap[from] + " — нужна похожая система.";
        }
      }
    } catch (e) { /* без предзаполнения */ }

    function showError(input, on) {
      var field = input.closest(".field");
      if (field) field.classList.toggle("is-error", on);
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = form.querySelector('[name="name"]');
      var contact = form.querySelector('[name="contact"]');
      var type = form.querySelector('[name="type"]');
      var message = form.querySelector('[name="message"]');

      var ok = true;
      [name, contact, message].forEach(function (input) {
        var valid = input.value.trim().length > 1;
        if (input === contact) {
          var v = input.value.trim();
          valid = /@/.test(v) && v.length > 3; // email или @telegram
        }
        showError(input, !valid);
        if (!valid) ok = false;
      });
      if (!ok) return;

      var payload = {
        name: name.value.trim(),
        contact: contact.value.trim(),
        type: type.value,
        message: message.value.trim(),
        meta: { page: location.pathname, date: new Date().toISOString() }
      };

      if (cfg.formEndpoint) {
        // Реальная отправка, если endpoint задан в config.js
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправляю…";
        fetch(cfg.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            note.classList.add("is-visible");
            note.innerHTML = "<strong>Заявка отправлена.</strong> Спасибо! Отвечу в ближайшее время на указанный контакт.";
            form.reset();
          })
          .catch(function () {
            note.classList.add("is-visible");
            note.innerHTML = "<strong>Не удалось отправить заявку автоматически.</strong> Напишите напрямую в Telegram или на email — кнопки рядом.";
          })
          .finally(function () {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Отправить заявку <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          });
        return;
      }

      // Демо-режим: серверная часть не подключена — не притворяемся, что отправили
      note.classList.add("is-visible");
      note.innerHTML =
        "<strong>Демо-версия сайта: заявка не отправлена.</strong><br>" +
        "Серверная обработка формы ещё не подключена (это честно указано в README). " +
        "Скопируйте описание и отправьте напрямую — так даже быстрее:";
      var actions = document.createElement("div");
      actions.className = "note-actions";
      var tg = document.createElement("a");
      tg.className = "btn btn-solid";
      tg.href = (cfg.telegramUrl || "https://t.me/" + cfg.telegramHandle) +
        "?text=" + encodeURIComponent(
          "Здравствуйте! Я " + payload.name + ". " +
          "Интересует: " + payload.type + ". " + payload.message +
          " (Контакт для ответа: " + payload.contact + ")"
        );
      tg.target = "_blank";
      tg.rel = "noopener";
      tg.textContent = "Отправить в Telegram";
      var mail = document.createElement("a");
      mail.className = "btn btn-ghost";
      mail.href = "mailto:" + cfg.email +
        "?subject=" + encodeURIComponent("Заявка с сайта: " + payload.type) +
        "&body=" + encodeURIComponent("Имя: " + payload.name + "\nКонтакт: " + payload.contact + "\n\n" + payload.message);
      mail.textContent = "Отправить email";
      actions.appendChild(tg);
      actions.appendChild(mail);
      note.appendChild(actions);
      note.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    });

    form.querySelectorAll("input, textarea").forEach(function (input) {
      input.addEventListener("input", function () { showError(input, false); });
    });
  }

  /* ============================================================
     HERO CANVAS — «живая система соединённых модулей»
     ============================================================ */
  var canvas = document.getElementById("heroCanvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = 1;
    var nodes = [];
    var pulses = [];
    var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    var running = true;

    function buildNodes() {
      nodes = [];
      var cols = 4, rows = 5;
      var padX = W * 0.12, padY = H * 0.14;
      var cw = (W - padX * 2) / (cols - 1);
      var ch = (H - padY * 2) / (rows - 1);
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var jitterX = (Math.random() - 0.5) * cw * 0.5;
          var jitterY = (Math.random() - 0.5) * ch * 0.4;
          nodes.push({
            ox: padX + c * cw + jitterX,
            oy: padY + r * ch + jitterY,
            x: 0, y: 0,
            w: 34 + Math.random() * 66,
            h: 15 + Math.random() * 17,
            depth: 0.4 + Math.random() * 1.25,
            phase: Math.random() * Math.PI * 2,
            hot: Math.random() < 0.22,
            glow: 0
          });
        }
      }
      // рёбра: к 2 ближайшим соседям
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].edges = [];
        var dists = nodes
          .map(function (n, j) { return { j: j, d: Math.hypot(n.ox - nodes[i].ox, n.oy - nodes[i].oy) }; })
          .filter(function (o) { return o.j !== i; })
          .sort(function (a, b) { return a.d - b.d; })
          .slice(0, 2);
        dists.forEach(function (o) { nodes[i].edges.push(o.j); });
      }
      pulses = [];
      for (var p = 0; p < 7; p++) pulses.push(newPulse());
    }

    function newPulse() {
      var a = Math.floor(Math.random() * nodes.length);
      var b = nodes[a].edges[Math.floor(Math.random() * nodes[a].edges.length)];
      return { a: a, b: b, t: Math.random(), speed: 0.004 + Math.random() * 0.008 };
    }

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height - 42; // минус подпись снизу
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildNodes();
    }

    var t = 0;
    function draw() {
      if (!running) return;
      t += 0.016;
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;

      ctx.clearRect(0, 0, W, H);

      // редкая точечная сетка
      ctx.fillStyle = "rgba(238,244,230,0.05)";
      var gs = 34;
      for (var gx = gs / 2; gx < W; gx += gs) {
        for (var gy = gs / 2; gy < H; gy += gs) {
          ctx.fillRect(gx, gy, 1.4, 1.4);
        }
      }

      // позиции узлов с параллаксом от мыши
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var dx = n.ox - mouse.x, dy = n.oy - mouse.y;
        var md = Math.hypot(dx, dy);
        var rep = md < 130 ? (130 - md) / 130 * 26 : 0;
        var ux = md ? dx / md : 0, uy = md ? dy / md : 0;
        n.x = n.ox + ux * rep * n.depth * 0.35 + Math.cos(t * 0.7 + n.phase) * 2.4 * n.depth + (mouse.x > -999 ? -(mouse.x - W / 2) * 0.02 * n.depth : 0);
        n.y = n.oy + uy * rep * n.depth * 0.35 + Math.sin(t * 0.6 + n.phase) * 2.4 * n.depth + (mouse.y > -999 ? -(mouse.y - H / 2) * 0.02 * n.depth : 0);
      }

      // рёбра
      var drawn = {};
      ctx.lineWidth = 1;
      for (var i2 = 0; i2 < nodes.length; i2++) {
        var n2 = nodes[i2];
        n2.edges.forEach(function (j) {
          var key = i2 < j ? i2 + "-" + j : j + "-" + i2;
          if (drawn[key]) return;
          drawn[key] = 1;
          var m = nodes[j];
          ctx.strokeStyle = "rgba(238,244,230,0.10)";
          ctx.beginPath();
          ctx.moveTo(n2.x + n2.w / 2, n2.y + n2.h / 2);
          ctx.lineTo(m.x + m.w / 2, m.y + m.h / 2);
          ctx.stroke();
        });
      }

      // импульсы по рёбрам
      ctx.fillStyle = "#C9F73F";
      pulses.forEach(function (p) {
        p.t += p.speed;
        if (p.t >= 1) { Object.assign(p, newPulse()); p.t = 0; return; }
        var a = nodes[p.a], b = nodes[p.b];
        var x = a.x + a.w / 2 + (b.x + b.w / 2 - a.x - a.w / 2) * p.t;
        var y = a.y + a.h / 2 + (b.y + b.h / 2 - a.y - a.h / 2) * p.t;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // узлы-модули
      nodes.forEach(function (n) {
        var breath = 0.5 + 0.5 * Math.sin(t * 0.9 + n.phase * 2);
        if (n.hot && breath > 0.96) n.glow = 1;
        n.glow *= 0.94;
        var active = n.glow > 0.05;

        ctx.save();
        ctx.translate(n.x, n.y);
        // корпус
        ctx.fillStyle = active ? "rgba(201,247,63," + (0.10 + n.glow * 0.22) + ")" : "rgba(238,244,230,0.045)";
        ctx.strokeStyle = active ? "rgba(201,247,63," + (0.5 + n.glow * 0.5) + ")" : "rgba(238,244,230,0.22)";
        roundRect(ctx, 0, 0, n.w, n.h, 4);
        ctx.fill();
        ctx.stroke();
        // «строки интерфейса» внутри модуля
        ctx.fillStyle = active ? "rgba(201,247,63,0.85)" : "rgba(238,244,230,0.28)";
        ctx.fillRect(5, n.h / 2 - 1, n.w * (0.28 + 0.3 * breath), 2);
        if (n.h > 24) ctx.fillRect(5, n.h / 2 + 4, n.w * 0.22, 1.6);
        ctx.restore();
      });

      requestAnimationFrame(draw);
    }

    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    function onMove(ev) {
      var r = canvas.getBoundingClientRect();
      mouse.tx = ev.clientX - r.left;
      mouse.ty = ev.clientY - r.top;
    }
    function onLeave() { mouse.tx = -9999; mouse.ty = -9999; }

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("touchend", onLeave);

    resize();
    window.addEventListener("resize", resize);

    // пауза, когда панель не видна
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(draw); }
        if (!vis) running = false;
      }, { threshold: 0.02 }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) running = false;
      else if (!running) { running = true; requestAnimationFrame(draw); }
    });

    if (reduceMotion) {
      // один статичный кадр
      running = true;
      draw();
      running = false;
    } else {
      requestAnimationFrame(draw);
    }
  }
})();
