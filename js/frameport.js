/* ============================================================
   FRAMEPORT — демо-логика клиентской галереи фотографа.
   Фотографии сгенерированы для демонстрации проекта.
   ============================================================ */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ================= Данные галереи (демо) ================= */

  var photos = [
    { file: "fp-portrait-1.jpg", cat: "портрет", title: "Тёплый осенний свет",      tall: true },
    { file: "fp-street-2.jpg",   cat: "улица",   title: "Улица в жёлтых листьях",  wide: true },
    { file: "fp-detail-2.jpg",   cat: "детали",  title: "Роса на листьях" },
    { file: "fp-studio-1.jpg",   cat: "студия",  title: "Красное платье",          tall: true },
    { file: "fp-portrait-2.jpg", cat: "портрет", title: "Седина и контраст" },
    { file: "fp-street-1.jpg",   cat: "улица",   title: "Дождь в отражениях",      wide: true },
    { file: "fp-detail-1.jpg",   cat: "детали",  title: "Кофе между кадрами" },
    { file: "fp-studio-2.jpg",   cat: "студия",  title: "Жёсткий свет" },
    { file: "fp-portrait-3.jpg", cat: "портрет", title: "Взгляд в сторону",        tall: true },
    { file: "fp-street-3.jpg",   cat: "улица",   title: "Велосипед в тумане" },
    { file: "fp-detail-3.jpg",   cat: "детали",  title: "Плёночная камера" },
    { file: "fp-studio-3.jpg",   cat: "студия",  title: "Геометрия и тень",        wide: true },
    { file: "fp-studio-4.jpg",   cat: "студия",  title: "Движение ткани",          tall: true },
    { file: "fp-portrait-4.jpg", cat: "портрет", title: "Прогулка вдвоём" }
  ];

  var MAX_FAV = 15;
  var favs = [];         // индексы избранных фото
  var filter = "all";
  var current = [];      // индексы фото в текущей фильтрации (для лайтбокса)
  var lbIndex = 0;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function toast(text) {
    var box = document.createElement("div");
    box.className = "fp-toast";
    box.textContent = text;
    document.body.appendChild(box);
    setTimeout(function () { box.classList.add("is-out"); }, 2800);
    setTimeout(function () { box.remove(); }, 3300);
  }

  /* ================= Рендер галереи ================= */

  function visible() {
    if (filter === "all") return photos.map(function (_, i) { return i; });
    if (filter === "fav") return favs.slice();
    return photos.map(function (p, i) { return p.cat === filter ? i : -1; }).filter(function (i) { return i >= 0; });
  }

  function renderGallery() {
    var idxs = visible();
    current = idxs;
    var gallery = $("#gallery");
    gallery.innerHTML = idxs.map(function (i) {
      var p = photos[i];
      var isFav = favs.indexOf(i) !== -1;
      var num = String(i + 1).padStart(2, "0");
      return '<figure class="fp-photo' + (p.tall ? " tall" : "") + (p.wide ? " wide" : "") + '" data-i="' + i + '" tabindex="0" role="button" aria-label="Открыть фото: ' + esc(p.title) + '">' +
        '<img src="../assets/img/' + p.file + '" alt="' + esc(p.title) + ' — фотография из галереи (демо)" loading="lazy">' +
        '<span class="fp-num">' + num + " / " + p.cat.toUpperCase() + "</span>" +
        '<span class="fp-cap"><b>' + esc(p.title) + "</b><small>" + esc(p.cat) + "</small></span>" +
        '<button class="fp-heart' + (isFav ? " is-fav" : "") + '" data-heart="' + i + '" aria-label="В избранное">' +
          '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 13.5C4.6 11 2.5 8.8 2.5 6.4 2.5 4.7 3.9 3.5 5.5 3.5c1 0 2 .5 2.5 1.4C8.5 4 9.5 3.5 10.5 3.5c1.6 0 3 1.2 3 2.9 0 2.4-2.1 4.6-5.5 7.1Z" stroke="currentColor" stroke-width="1.3" fill="none"/></svg>' +
        "</button>" +
        "</figure>";
    }).join("");

    $("#galleryEmpty").hidden = idxs.length > 0;
    $("#favFilterCount").textContent = favs.length;

    $$(".fp-photo").forEach(function (fig) {
      fig.addEventListener("click", function (e) {
        if (e.target.closest(".fp-heart")) return;
        openLightbox(parseInt(fig.getAttribute("data-i"), 10));
      });
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(parseInt(fig.getAttribute("data-i"), 10));
        }
      });
    });
    $$(".fp-heart").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleFav(parseInt(btn.getAttribute("data-heart"), 10), btn);
      });
    });
  }

  function updateFavUI() {
    $("#favHeaderCount").textContent = favs.length;
    $("#favFilterCount").textContent = favs.length;
    $("#favbarCount").textContent = favs.length;
    $("#favbar").hidden = favs.length === 0;
    $("#deliveryStatus").textContent = favs.length > 0
      ? "выбор получен — ожидание подтверждения (" + favs.length + " из " + MAX_FAV + ")"
      : "ожидание отбора клиента";
    $("#stepFavNote").textContent = favs.length > 0
      ? "выбрано " + favs.length + " из " + MAX_FAV
      : "выберите понравившиеся кадры ♥";
  }

  function toggleFav(i, btn) {
    var pos = favs.indexOf(i);
    if (pos !== -1) {
      favs.splice(pos, 1);
      if (btn) btn.classList.remove("is-fav");
      toast("Кадр убран из избранного");
    } else {
      if (favs.length >= MAX_FAV) {
        toast("В пакет «Осень» входит до " + MAX_FAV + " кадров — уберите что-то, чтобы добавить новое");
        return;
      }
      favs.push(i);
      if (btn) {
        btn.classList.add("is-fav", "pop");
        setTimeout(function () { btn.classList.remove("pop"); }, 500);
      }
      toast("Кадр добавлен в избранное (" + favs.length + " из " + MAX_FAV + ")");
    }
    updateFavUI();
    if (filter === "fav") renderGallery();
  }

  /* ================= Фильтры ================= */

  $$(".fp-filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      filter = btn.getAttribute("data-f");
      $$(".fp-filter").forEach(function (b) { b.classList.toggle("is-on", b === btn); });
      renderGallery();
    });
  });
  $("#favJump").addEventListener("click", function () {
    filter = "fav";
    $$(".fp-filter").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-f") === "fav"); });
    renderGallery();
    $("#gallery").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ================= Панель избранного ================= */

  $("#favClear").addEventListener("click", function () {
    favs = [];
    updateFavUI();
    renderGallery();
    toast("Выбор очищен");
  });
  $("#favSend").addEventListener("click", function () {
    if (!favs.length) return;
    // Демо: данные никуда не отправляются — честно сообщаем об этом
    toast("Демо-режим: выбор сохранён только в вашем браузере и не отправлен фотографу");
  });

  /* ================= Лайтбокс ================= */

  var lb = $("#lightbox");

  function openLightbox(i) {
    lbIndex = current.indexOf(i);
    if (lbIndex === -1) { current = visible(); lbIndex = current.indexOf(i); }
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    showPhoto();
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
  }

  function showPhoto() {
    if (lbIndex < 0) lbIndex = current.length - 1;
    if (lbIndex >= current.length) lbIndex = 0;
    var i = current[lbIndex];
    var p = photos[i];
    var img = $("#lbImg");
    img.src = "../assets/img/" + p.file;
    img.alt = p.title + " — фотография из галереи (демо)";
    $("#lbCaption").textContent = p.title;
    $("#lbCounter").textContent = String(lbIndex + 1).padStart(2, "0") + " / " + String(current.length).padStart(2, "0") + " · " + p.cat;
    var isFav = favs.indexOf(i) !== -1;
    var favBtn = $("#lbFav");
    favBtn.classList.toggle("is-fav", isFav);
    $("#lbFavText").textContent = isFav ? "В избранном" : "В избранное";
  }

  function step(dir) {
    lbIndex += dir;
    showPhoto();
  }

  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lbPrev").addEventListener("click", function () { step(-1); });
  $("#lbNext").addEventListener("click", function () { step(1); });
  $("#lbFav").addEventListener("click", function () {
    var i = current[lbIndex];
    toggleFav(i, null);
    showPhoto();
    var gridBtn = document.querySelector('.fp-heart[data-heart="' + i + '"]');
    if (gridBtn) gridBtn.classList.toggle("is-fav", favs.indexOf(i) !== -1);
  });
  lb.addEventListener("click", function (e) {
    if (e.target === lb) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // свайп на мобильных
  var touchX = null;
  lb.addEventListener("touchstart", function (e) {
    touchX = e.touches[0].clientX;
  }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 48) step(dx > 0 ? -1 : 1);
    touchX = null;
  }, { passive: true });

  /* ================= Wipe-переход ================= */

  $$("[data-wipe]").forEach(function (link) {
    link.addEventListener("click", function (ev) {
      if (ev.metaKey || ev.ctrlKey) return;
      var href = link.getAttribute("href");
      if (!href) return;
      ev.preventDefault();
      document.body.classList.add("is-wiping");
      setTimeout(function () { window.location.href = href; }, 430);
    });
  });

  /* ================= Запуск ================= */

  renderGallery();
  updateFavUI();
})();
