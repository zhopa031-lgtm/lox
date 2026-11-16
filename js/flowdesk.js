/* ============================================================
   FLOWDESK — демо-логика: заявки, календарь, клиенты, статусы.
   Все данные тестовые, живут в памяти текущей сессии.
   ============================================================ */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ================= Тестовые данные ================= */

  var TODAY = new Date();
  function iso(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }
  function shift(days) {
    var d = new Date(TODAY);
    d.setDate(d.getDate() + days);
    return iso(d);
  }

  var STATUS = {
    new:    { label: "Новая",              pill: "pill-new",    ce: "ce-new",    lg: "lg-new" },
    work:   { label: "В работе",           pill: "pill-work",   ce: "ce-work",   lg: "lg-work" },
    wait:   { label: "Ожидает запчастей",  pill: "pill-wait",   ce: "ce-wait",   lg: "lg-wait" },
    done:   { label: "Выполнена",          pill: "pill-done",   ce: "ce-done",   lg: "lg-done" },
    cancel: { label: "Отменена",           pill: "pill-cancel", ce: "ce-cancel", lg: "lg-cancel" }
  };
  var statusKeys = Object.keys(STATUS);

  var clients = [
    { id: "CL-101", name: "ООО «Промметалл»",       city: "Челябинск",     person: "Игорь Валентинович Ш.",  phone: "+7 (351) 200-11-40", address: "ул. Заводская, 14",       equipment: [{ t: "Токарный станок с ЧПУ", m: "16К20Ф3 / с/н 0412" }, { t: "Гидравлический пресс", m: "ПГ-200 / с/н 0087" }] },
    { id: "CL-102", name: "АО «УралГидро»",          city: "Екатеринбург",  person: "Марина Сергеевна К.",    phone: "+7 (343) 310-22-18", address: "ш. Сибирский тракт, 8",   equipment: [{ t: "Насос центробежный", m: "Д-320-50 / с/н 1187" }, { t: "Задвижка чугунная", m: "30ч915бр D300" }] },
    { id: "CL-103", name: "ООО «СибЭнергоРемонт»",   city: "Новосибирск",   person: "Павел Дмитриевич Л.",    phone: "+7 (383) 227-30-55", address: "ул. Энергетиков, 23",     equipment: [{ t: "Компрессор поршневой", m: "2ВМ-10 / с/н 2043" }, { t: "Котёл паровой", m: "ДЕ-10-14ГМ" }] },
    { id: "CL-104", name: "МУП «Горводоканал»",      city: "Пермь",         person: "Ольга Ивановна Т.",      phone: "+7 (342) 218-44-02", address: "ул. Садовая, 40",         equipment: [{ t: "Насос водоотливащий", m: "СД 250/22 / с/н 0092" }, { t: "Станок заточной", m: "3Б633А" }] },
    { id: "CL-105", name: "ООО «АгроТехСоюз»",       city: "Курган",        person: "Сергей Петрович В.",     phone: "+7 (3522) 45-01-77", address: "пер. Машинный, 5",        equipment: [{ t: "Конвейер ленточный", m: "ЛК-500 / участок 2" }, { t: "Дробилка зерновая", m: "ДКР-3 / с/н 0771" }] },
    { id: "CL-106", name: "ЗАО «Металлург-Сервис»",  city: "Магнитогорск",  person: "Анна Дмитриевна Р.",     phone: "+7 (3519) 35-90-13", address: "ул. Осадки, 101",         equipment: [{ t: "Кран мостовой", m: "16т / пролёт 22м" }, { t: "Ножницы гильотинные", m: "НГ-16" }] },
    { id: "CL-107", name: "ООО «ЛифтМонтаж»",        city: "Екатеринбург",  person: "Дмитрий Олегович Н.",    phone: "+7 (343) 287-06-91", address: "ул. Малышева, 72",        equipment: [{ t: "Лебёдка монтажная", m: "ЛМ-3.2 / с/н 0315" }] },
    { id: "CL-108", name: "АО «ХимПром-Восток»",     city: "Тюмень",        person: "Елена Александровна Б.", phone: "+7 (3452) 52-38-04", address: "пр. Промышленный, 3",     equipment: [{ t: "Реактор смешивания", m: "РС-2000 / с/н 1119" }, { t: "Насос дозировочный", m: "НД-2.5Э / с/н 0064" }] }
  ];

  var engineers = ["А. Соколов", "Д. Крылов", "М. Ефимова"];

  var reqSeed = [
    { client: 0, eq: "Токарный станок с ЧПУ", model: "16К20Ф3", work: "Ремонт", visit: shift(-8), prio: "Обычный", status: "done", desc: "Замена изношенных направляющих, проверка геометрии после ремонта.", cost: "68 400 ₽", eng: 0, created: shift(-12) },
    { client: 1, eq: "Насос центробежный", model: "Д-320-50", work: "Плановое ТО", visit: shift(-6), prio: "Обычный", status: "done", desc: "Регламентное ТО: замена сальниковой набивки, проверка вибрации.", cost: "24 800 ₽", eng: 1, created: shift(-10) },
    { client: 3, eq: "Насос водоотливащий", model: "СД 250/22", work: "Диагностика", visit: shift(-5), prio: "Высокий", status: "done", desc: "Повышенный уровень вибрации при пуске. Диагностика подшипников.", cost: "15 200 ₽", eng: 0, created: shift(-7) },
    { client: 4, eq: "Конвейер ленточный", model: "ЛК-500", work: "Ремонт", visit: shift(-3), prio: "Высокий", status: "done", desc: "Замена приводного барабана и натяжного устройства участка 2.", cost: "91 000 ₽", eng: 2, created: shift(-8) },
    { client: 2, eq: "Компрессор поршневой", model: "2ВМ-10", work: "Плановое ТО", visit: shift(-2), prio: "Обычный", status: "done", desc: "ТО по регламенту: клапаны, масляный фильтр, опрессовка.", cost: "31 500 ₽", eng: 1, created: shift(-6) },
    { client: 5, eq: "Кран мостовой", model: "16т", work: "Диагностика", visit: shift(-1), prio: "Критический", status: "wait", desc: "Замечен износ ходовых колёс. Ожидаются запчасти с завода.", cost: "47 300 ₽", eng: 0, created: shift(-4) },
    { client: 0, eq: "Гидравлический пресс", model: "ПГ-200", work: "Ремонт", visit: shift(0), prio: "Высокий", status: "work", desc: "Потеря давления в гидросистеме. Замена уплотнений цилиндра.", cost: "54 900 ₽", eng: 1, created: shift(-3) },
    { client: 7, eq: "Насос дозировочный", model: "НД-2.5Э", work: "Диагностика", visit: shift(0), prio: "Обычный", status: "work", desc: "Нестабильная дозировка реагента. Проверка привода и клапанов.", cost: "18 600 ₽", eng: 2, created: shift(-2) },
    { client: 3, eq: "Станок заточной", model: "3Б633А", work: "Плановое ТО", visit: shift(1), prio: "Обычный", status: "new", desc: "Регламентное ТО заточного оборудования механической мастерской.", cost: "12 400 ₽", eng: 0, created: shift(-1) },
    { client: 1, eq: "Задвижка чугунная", model: "30ч915бр D300", work: "Ремонт", visit: shift(2), prio: "Высокий", status: "work", desc: "Неполное закрытие затвора. Проточка уплотнительной поверхности.", cost: "27 800 ₽", eng: 1, created: shift(-2) },
    { client: 4, eq: "Дробилка зерновая", model: "ДКР-3", work: "Ремонт", visit: shift(3), prio: "Критический", status: "wait", desc: "Разбалансировка ротора, сильная вибрация. Нужен новый ротор.", cost: "112 000 ₽", eng: 2, created: shift(-1) },
    { client: 2, eq: "Котёл паровой", model: "ДЕ-10-14ГМ", work: "Плановое ТО", visit: shift(4), prio: "Высокий", status: "new", desc: "Очередное ТО перед отопительным периодом, проверка автоматики.", cost: "58 200 ₽", eng: 0, created: shift(-1) },
    { client: 6, eq: "Лебёдка монтажная", model: "ЛМ-3.2", work: "Диагностика", visit: shift(6), prio: "Обычный", status: "new", desc: "Проверка тормозной системы перед монтажным сезоном.", cost: "9 800 ₽", eng: 1, created: shift(0) },
    { client: 7, eq: "Реактор смешивания", model: "РС-2000", work: "Модернизация", visit: shift(8), prio: "Обычный", status: "new", desc: "Установка частотного привода мешалки и новых датчиков температуры.", cost: "186 000 ₽", eng: 2, created: shift(0) },
    { client: 5, eq: "Ножницы гильотинные", model: "НГ-16", work: "Установка", visit: shift(11), prio: "Обычный", status: "new", desc: "Монтаж и пуско-наладка новых ножниц на участке резки.", cost: "74 500 ₽", eng: 0, created: shift(1) },
    { client: 0, eq: "Токарный станок с ЧПУ", model: "16К20Ф3", work: "Плановое ТО", visit: shift(14), prio: "Обычный", status: "new", desc: "Очередное регламентное ТО стойки ЧПУ и приводов подачи.", cost: "22 300 ₽", eng: 1, created: shift(1) },
    { client: 3, eq: "Насос водоотливащий", model: "СД 250/22", work: "Ремонт", visit: shift(-14), prio: "Высокий", status: "cancel", desc: "Перенос: объект закрыт на дезактивацию по внешним причинам.", cost: "—", eng: 0, created: shift(-20) }
  ];

  var nextId = 1063;
  var requests = reqSeed.map(function (r, i) {
    return Object.assign({ id: "ЗЯ-" + (1046 + i) }, r);
  });

  var notifications = [
    { text: "Новая заявка от ООО «АгроТехСоюз»: дробилка ДКР-3, приоритет — критический", time: "сегодня, 09:40", read: false },
    { text: "Заявка ЗЯ-1051 переведена в статус «Ожидает запчастей»", time: "сегодня, 08:15", read: false },
    { text: "На сегодня запланировано 2 визита по расписанию", time: "сегодня, 07:00", read: false },
    { text: "Заявка ЗЯ-1049 (ООО «СибЭнергоРемонт») выполнена и закрыта", time: "вчера, 17:32", read: true }
  ];

  /* ================= Состояние ================= */

  var state = {
    view: "requests",
    statusFilter: "all",
    search: "",
    calDate: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1),
    drawerReqId: null,
    drawerClientId: null,
    editingId: null
  };

  var viewMeta = {
    dashboard: ["Дашборд", "Сводка по заявкам и расписанию"],
    requests: ["Заявки", "Управление заявками на обслуживание"],
    calendar: ["Календарь", "Расписание визитов и записей"],
    clients: ["Клиенты", "Карточки компаний и история работ"]
  };

  /* ================= Утилиты ================= */

  var MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

  function clientById(id) { return clients[id]; }
  function fmtDate(s) {
    var p = s.split("-");
    return parseInt(p[2], 10) + " " + MONTHS_GEN[parseInt(p[1], 10) - 1];
  }
  function dayDiff(s) {
    var d = new Date(s + "T00:00:00");
    var t = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
    return Math.round((d - t) / 86400000);
  }
  function relativeDay(s) {
    var diff = dayDiff(s);
    if (diff === 0) return "сегодня";
    if (diff === 1) return "завтра";
    if (diff === -1) return "вчера";
    return fmtDate(s);
  }
  function pillHtml(status) {
    return '<span class="pill ' + STATUS[status].pill + '">' + STATUS[status].label + "</span>";
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function toast(text) {
    var box = $("#toasts");
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    box.appendChild(t);
    setTimeout(function () { t.classList.add("is-out"); }, 3200);
    setTimeout(function () { t.remove(); }, 3700);
  }

  function pushNotification(text) {
    notifications.unshift({ text: text, time: "только что", read: false });
    renderNotifications();
  }

  /* ================= Переключение видов ================= */

  function setView(view) {
    state.view = view;
    $$(".sb-item").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-view") === view); });
    $$(".view").forEach(function (v) { v.hidden = v.id !== "view-" + view; });
    $("#viewTitle").textContent = viewMeta[view][0];
    $("#viewSub").textContent = viewMeta[view][1];
    if (view === "calendar") renderCalendar();
    if (view === "clients") renderClients();
  }

  $$(".sb-item").forEach(function (b) {
    b.addEventListener("click", function () { setView(b.getAttribute("data-view")); });
  });
  $$(".card-link[data-goto]").forEach(function (b) {
    b.addEventListener("click", function () { setView(b.getAttribute("data-goto")); });
  });
  $("#btnCreate").addEventListener("click", function () { openModal(null, null); });

  /* ================= Дашборд ================= */

  function renderDashboard() {
    var active = requests.filter(function (r) { return r.status === "new" || r.status === "work" || r.status === "wait"; });
    var doneMonth = requests.filter(function (r) {
      return r.status === "done" && r.visit.slice(0, 7) === iso(TODAY).slice(0, 7);
    });
    var weekVisits = requests.filter(function (r) { var d = dayDiff(r.visit); return d >= 0 && d <= 7 && r.status !== "cancel"; });

    var kpis = [
      { t: "Активные заявки", v: active.length, trend: "новых: " + requests.filter(function (r) { return r.status === "new"; }).length, cls: "is-blue" },
      { t: "Визитов за неделю", v: weekVisits.length, trend: "по расписанию", cls: "" },
      { t: "Выполнено за месяц", v: doneMonth.length, trend: "закрыто с актом", cls: "is-green" },
      { t: "Клиентов в базе", v: clients.length, trend: "активных договоров", cls: "" }
    ];
    $("#kpiGrid").innerHTML = kpis.map(function (k) {
      return '<div class="kpi ' + k.cls + '"><small>' + k.t + '</small><b>' + k.v + '</b><span class="kpi-trend">' + k.trend + "</span></div>";
    }).join("");

    // график визитов на 14 дней
    var chart = $("#dashChart");
    var maxV = 1;
    var days = [];
    for (var i = 0; i < 14; i++) {
      var d = shift(i);
      var cnt = requests.filter(function (r) { return r.visit === d && r.status !== "cancel"; }).length;
      if (cnt > maxV) maxV = cnt;
      days.push({ d: d, c: cnt, today: i === 0 });
    }
    chart.innerHTML = days.map(function (o) {
      var h = Math.max(Math.round(o.c / maxV * 100), 4);
      var label = o.d.slice(8, 10) + "." + o.d.slice(5, 7);
      return '<div class="bar' + (o.today ? " today" : "") + (o.c === 0 ? " zero" : "") + '"><i style="height:' + h + '%"></i><span>' + label + "</span></div>";
    }).join("");

    // статусы
    var counts = statusKeys.map(function (k) {
      return { k: k, n: requests.filter(function (r) { return r.status === k; }).length };
    });
    var total = requests.length || 1;
    $("#dashStack").innerHTML = counts.map(function (c) {
      if (!c.n) return "";
      return '<i class="' + STATUS[c.k].lg + '" style="width:' + (c.n / total * 100) + '%"></i>';
    }).join("");
    $("#dashLegend").innerHTML = counts.map(function (c) {
      return '<div class="lg-row"><i class="lg ' + STATUS[c.k].lg + '"></i>' + STATUS[c.k].label + "<b>" + c.n + "</b></div>";
    }).join("");

    // ближайшие визиты
    var visits = requests
      .filter(function (r) { var d = dayDiff(r.visit); return d >= 0 && r.status !== "cancel" && r.status !== "done"; })
      .sort(function (a, b) { return a.visit < b.visit ? -1 : 1; })
      .slice(0, 5);
    $("#dashVisits").innerHTML = visits.map(function (r) {
      return '<li data-req="' + r.id + '"><span class="ml-date">' + relativeDay(r.visit) + '</span><span class="ml-title">' + esc(r.eq) + " · " + esc(clientById(r.client).name) + "<small>" + r.work + ", инженер: " + esc(engineers[r.eng]) + "</small></span>" + pillHtml(r.status) + "</li>";
    }).join("") || '<li><span class="ml-title">Ближайших визитов нет<small>Создайте заявку с датой</small></span></li>';

    // последние заявки
    var latest = requests.slice().sort(function (a, b) { return b.created < a.created ? -1 : 1; }).slice(0, 5);
    $("#dashLatest").innerHTML = latest.map(function (r) {
      return '<li data-req="' + r.id + '"><span class="ml-date">' + relativeDay(r.created) + '</span><span class="ml-title">' + esc(r.id) + " · " + esc(r.eq) + "<small>" + esc(clientById(r.client).name) + "</small></span>" + pillHtml(r.status) + "</li>";
    }).join("");

    $("#sbReqCount").textContent = requests.filter(function (r) { return r.status !== "cancel"; }).length;

    $$("#dashVisits li[data-req], #dashLatest li[data-req]").forEach(function (li) {
      li.addEventListener("click", function () { openReqDrawer(li.getAttribute("data-req")); });
    });
  }

  /* ================= Заявки ================= */

  function renderChips() {
    var box = $("#statusChips");
    var counts = { all: requests.length };
    statusKeys.forEach(function (k) {
      counts[k] = requests.filter(function (r) { return r.status === k; }).length;
    });
    var html = '<button class="chip' + (state.statusFilter === "all" ? " is-on" : "") + '" data-st="all">Все <b>' + counts.all + "</b></button>";
    html += statusKeys.map(function (k) {
      return '<button class="chip' + (state.statusFilter === k ? " is-on" : "") + '" data-st="' + k + '">' + STATUS[k].label + " <b>" + counts[k] + "</b></button>";
    }).join("");
    box.innerHTML = html;
    $$(".chip[data-st]").forEach(function (c) {
      c.addEventListener("click", function () {
        state.statusFilter = c.getAttribute("data-st");
        renderChips();
        renderRequests();
      });
    });
  }

  function renderRequests() {
    var q = state.search.toLowerCase();
    var list = requests.filter(function (r) {
      if (state.statusFilter !== "all" && r.status !== state.statusFilter) return false;
      if (!q) return true;
      var hay = (r.id + " " + clientById(r.client).name + " " + r.eq + " " + r.model + " " + r.work).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    var body = $("#reqBody");
    body.innerHTML = list.map(function (r) {
      var c = clientById(r.client);
      var prioCls = r.prio === "Критический" ? "prio-crit" : r.prio === "Высокий" ? "prio-high" : "prio-normal";
      return "<tr data-req=\"" + r.id + "\">" +
        '<td><span class="req-id">' + r.id + "</span></td>" +
        '<td><span class="req-client"><b>' + esc(c.name) + "</b><small>" + esc(c.city) + "</small></span></td>" +
        '<td><span class="req-eq">' + esc(r.eq) + "</span></td>" +
        "<td>" + esc(r.work) + "</td>" +
        '<td><span class="req-date">' + fmtDate(r.visit) + "</span></td>" +
        '<td><span class="prio ' + prioCls + '">' + r.prio + "</span></td>" +
        "<td>" + pillHtml(r.status) + "</td>" +
        '<td><span class="req-open"><svg viewBox="0 0 16 16" fill="none"><path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span></td>' +
        "</tr>";
    }).join("");
    $("#reqEmpty").hidden = list.length > 0;
    $$("#reqBody tr").forEach(function (tr) {
      tr.addEventListener("click", function () { openReqDrawer(tr.getAttribute("data-req")); });
    });
  }

  $("#reqSearch").addEventListener("input", function (e) {
    state.search = e.target.value.trim();
    renderRequests();
  });

  /* ================= Drawer: карточка заявки / клиента ================= */

  var drawer = $("#drawer");
  var scrim = $("#scrim");

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    scrim.hidden = false;
    requestAnimationFrame(function () { scrim.classList.add("is-open"); });
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    scrim.classList.remove("is-open");
    setTimeout(function () { if (!drawer.classList.contains("is-open")) scrim.hidden = true; }, 350);
    document.body.style.overflow = "";
    state.drawerReqId = null;
    state.drawerClientId = null;
  }
  $("#drawerClose").addEventListener("click", closeDrawer);
  scrim.addEventListener("click", function () { closeDrawer(); closeNotif(); });

  function openReqDrawer(id) {
    var r = requests.find(function (x) { return x.id === id; });
    if (!r) return;
    state.drawerReqId = id;
    state.drawerClientId = null;
    var c = clientById(r.client);
    $("#drawerTitle").textContent = "Заявка " + r.id;
    $("#drawerBody").innerHTML =
      '<div class="dr-id"><span>' + r.id + " · создана " + fmtDate(r.created) + '</span>' + pillHtml(r.status) + "</div>" +
      '<div class="dr-section"><b>Клиент</b><div class="dr-rows">' +
        '<div class="dr-row"><span class="k">Компания</span><span class="v"><button class="dr-client-link" style="text-align:left" data-client="' + r.client + '">' + esc(c.name) + '</button><small>' + esc(c.person) + " · " + esc(c.phone) + "</small></span></div>" +
        '<div class="dr-row"><span class="k">Город</span><span class="v">' + esc(c.city) + "</span></div>" +
      "</div></div>" +
      '<div class="dr-section"><b>Оборудование и работы</b><div class="dr-rows">' +
        '<div class="dr-row"><span class="k">Оборудование</span><span class="v">' + esc(r.eq) + "</span></div>" +
        '<div class="dr-row"><span class="k">Модель</span><span class="v">' + esc(r.model || "—") + "</span></div>" +
        '<div class="dr-row"><span class="k">Тип работ</span><span class="v">' + esc(r.work) + "</span></div>" +
        '<div class="dr-row"><span class="k">Визит</span><span class="v">' + fmtDate(r.visit) + " · " + relativeDay(r.visit) + "</span></div>" +
        '<div class="dr-row"><span class="k">Приоритет</span><span class="v">' + esc(r.prio) + "</span></div>" +
        '<div class="dr-row"><span class="k">Инженер</span><span class="v">' + esc(engineers[r.eng]) + "</span></div>" +
        '<div class="dr-row"><span class="k">Смета</span><span class="v">' + esc(r.cost) + "</span></div>" +
      "</div></div>" +
      '<div class="dr-section"><b>Описание задачи</b><div class="dr-desc">' + esc(r.desc) + "</div></div>" +
      '<div class="dr-section"><b>Статус заявки</b><div class="dr-status-row">' +
        '<select id="drStatus">' + statusKeys.map(function (k) {
          return '<option value="' + k + '"' + (k === r.status ? " selected" : "") + ">" + STATUS[k].label + "</option>";
        }).join("") + "</select>" +
        '<button class="btn-soft" id="drEdit">Изменить</button>' +
      "</div></div>" +
      '<div class="dr-section"><b>История клиента</b>' +
        '<div class="dr-mini-table">' + requests.filter(function (x) { return x.client === r.client; }).map(function (x) {
          return '<div class="mt-row" data-req="' + x.id + '"><span class="mt-id">' + x.id + '</span><span class="mt-t">' + esc(x.eq) + "<small>" + fmtDate(x.visit) + " · " + esc(x.work) + "</small></span>" + pillHtml(x.status) + "</div>";
        }).join("") + "</div></div>";

    $("#drStatus").addEventListener("change", function (e) {
      var old = STATUS[r.status].label;
      r.status = e.target.value;
      renderAll();
      toast(r.id + ": статус «" + old + "» → «" + STATUS[r.status].label + "»");
      pushNotification("Заявка " + r.id + " переведена в статус «" + STATUS[r.status].label + "»");
      openReqDrawer(r.id); // перерисовать карточку с новым статусом
    });
    var editBtn = $("#drEdit");
    if (editBtn) editBtn.addEventListener("click", function () { closeDrawer(); openModal(r, null); });
    $$("#drawerBody .dr-client-link").forEach(function (b) {
      b.addEventListener("click", function () { openClientDrawer(parseInt(b.getAttribute("data-client"), 10)); });
    });
    $$("#drawerBody .mt-row[data-req]").forEach(function (row) {
      row.addEventListener("click", function () { openReqDrawer(row.getAttribute("data-req")); });
    });
    openDrawer();
  }

  function openClientDrawer(idx) {
    var c = clientById(idx);
    state.drawerClientId = idx;
    state.drawerReqId = null;
    $("#drawerTitle").textContent = c.name;
    var hist = requests.filter(function (r) { return r.client === idx; });
    var activeCnt = hist.filter(function (r) { return r.status === "new" || r.status === "work" || r.status === "wait"; }).length;
    $("#drawerBody").innerHTML =
      '<div class="dr-id"><span>' + c.id + " · " + esc(c.city) + '</span><span>' + activeCnt + " активных</span></div>" +
      '<div class="dr-section"><b>Контакты</b><div class="dr-rows">' +
        '<div class="dr-row"><span class="k">Контактное лицо</span><span class="v">' + esc(c.person) + "</span></div>" +
        '<div class="dr-row"><span class="k">Телефон</span><span class="v">' + esc(c.phone) + "</span></div>" +
        '<div class="dr-row"><span class="k">Адрес</span><span class="v">' + esc(c.address) + "</span></div>" +
      "</div></div>" +
      '<div class="dr-section"><b>Оборудование на обслуживании</b>' +
        c.equipment.map(function (e) {
          return '<div class="dr-eq-item"><span>' + esc(e.t) + "<small>" + esc(e.m) + "</small></span></div>";
        }).join("") + "</div>" +
      '<div class="dr-section"><b>История заявок (' + hist.length + ")</b>" +
        (hist.length
          ? '<div class="dr-mini-table">' + hist.map(function (x) {
              return '<div class="mt-row" data-req="' + x.id + '"><span class="mt-id">' + x.id + '</span><span class="mt-t">' + esc(x.eq) + "<small>" + fmtDate(x.visit) + " · " + esc(x.work) + "</small></span>" + pillHtml(x.status) + "</div>";
            }).join("") + "</div>"
          : '<div class="dr-desc">Заявок пока нет</div>') + "</div>" +
      '<div class="dr-actions"><button class="btn-blue" id="drNewReq">Создать заявку</button></div>';

    $$("#drawerBody .mt-row[data-req]").forEach(function (row) {
      row.addEventListener("click", function () { openReqDrawer(row.getAttribute("data-req")); });
    });
    $("#drNewReq").addEventListener("click", function () {
      closeDrawer();
      openModal(null, idx);
    });
    openDrawer();
  }

  /* ================= Модальное окно заявки ================= */

  var modal = $("#reqModal");
  var editing = null;

  function openModal(req, presetClient) {
    editing = req || null;
    state.editingId = req ? req.id : null;
    $("#modalTitle").textContent = req ? "Изменить заявку " + req.id : "Новая заявка";
    $("#mfClient").innerHTML = clients.map(function (c, i) {
      return '<option value="' + i + '"' + ((req ? req.client : presetClient) === i ? " selected" : "") + ">" + esc(c.name) + "</option>";
    }).join("");
    $("#mfWork").value = req ? req.work : "Диагностика";
    $("#mfEquipment").value = req ? req.eq : "";
    $("#mfModel").value = req ? (req.model || "") : "";
    $("#mfVisit").value = req ? req.visit : shift(2);
    $("#mfPriority").value = req ? req.prio : "Обычный";
    $("#mfDesc").value = req ? req.desc : "";
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add("is-open"); });
    document.body.style.overflow = "hidden";
    setTimeout(function () { $("#mfEquipment").focus(); }, 80);
  }
  function closeModal() {
    modal.classList.remove("is-open");
    setTimeout(function () { modal.hidden = true; }, 280);
    document.body.style.overflow = "";
    editing = null;
    state.editingId = null;
  }
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalCancel").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

  $("#reqForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var data = {
      client: parseInt($("#mfClient").value, 10),
      eq: $("#mfEquipment").value.trim(),
      model: $("#mfModel").value.trim(),
      work: $("#mfWork").value,
      visit: $("#mfVisit").value,
      prio: $("#mfPriority").value,
      desc: $("#mfDesc").value.trim() || "Описание уточняется у клиента."
    };
    if (!data.eq || !data.visit) return;
    if (editing) {
      Object.assign(editing, data);
      toast("Заявка " + editing.id + " обновлена");
      pushNotification("Заявка " + editing.id + " изменена: " + data.eq);
    } else {
      var r = Object.assign({ id: "ЗЯ-" + nextId++, status: "new", cost: "Смета готовится", eng: 0, created: iso(TODAY) }, data);
      requests.push(r);
      toast("Заявка " + r.id + " создана");
      pushNotification("Новая заявка " + r.id + " от " + clientById(r.client).name);
      if (state.drawerReqId === r.id) openReqDrawer(r.id);
    }
    closeModal();
    renderAll();
  });

  /* ================= Календарь ================= */

  function renderCalendar() {
    var y = state.calDate.getFullYear();
    var m = state.calDate.getMonth();
    $("#calTitle").textContent = MONTHS[m] + " " + y;
    var grid = $("#calGrid");
    var first = new Date(y, m, 1);
    var startIdx = (first.getDay() + 6) % 7; // Пн = 0
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var daysPrev = new Date(y, m, 0).getDate();
    var todayIso = iso(TODAY);
    var cells = [];

    for (var i = 0; i < 42; i++) {
      var dayNum, monthOffset, inMonth;
      if (i < startIdx) { dayNum = daysPrev - startIdx + 1 + i; monthOffset = -1; inMonth = false; }
      else if (i < startIdx + daysInMonth) { dayNum = i - startIdx + 1; monthOffset = 0; inMonth = true; }
      else { dayNum = i - startIdx - daysInMonth + 1; monthOffset = 1; inMonth = false; }
      cells.push({ day: dayNum, off: monthOffset, isoDate: iso(new Date(y, m + monthOffset, dayNum)) });
    }

    grid.innerHTML = cells.map(function (cell) {
      var isToday = cell.isoDate === todayIso;
      var entries = requests.filter(function (r) { return r.visit === cell.isoDate; });
      var shown = entries.slice(0, 3);
      var cls = "cal-day" + (cell.off !== 0 ? " is-other is-empty" : "") + (isToday ? " is-today" : "");
      var html = '<div class="' + cls + '" data-date="' + cell.isoDate + '">';
      html += '<span class="d-num">' + cell.day + "</span>";
      shown.forEach(function (r) {
        html += '<button class="cal-entry ' + STATUS[r.status].ce + '" data-req="' + r.id + '">' + esc(clientById(r.client).name).replace(/^(ООО|АО|МУП|ЗАО) /, "") + " · " + esc(r.work) + "</button>";
      });
      if (entries.length > 3) html += '<span class="cal-more">+' + (entries.length - 3) + " ещё</span>";
      html += "</div>";
      return html;
    }).join("");

    $$(".cal-entry[data-req]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        openReqDrawer(b.getAttribute("data-req"));
      });
    });
    $$(".cal-day").forEach(function (cell) {
      cell.addEventListener("click", function (e) {
        if (e.target !== cell) return;
        openModal(null, null);
        $("#mfVisit").value = cell.getAttribute("data-date");
      });
    });
  }
  $("#calPrev").addEventListener("click", function () {
    state.calDate.setMonth(state.calDate.getMonth() - 1);
    renderCalendar();
  });
  $("#calNext").addEventListener("click", function () {
    state.calDate.setMonth(state.calDate.getMonth() + 1);
    renderCalendar();
  });
  $("#calToday").addEventListener("click", function () {
    state.calDate = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    renderCalendar();
  });

  /* ================= Клиенты ================= */

  function renderClients() {
    var grid = $("#clientsGrid");
    grid.innerHTML = clients.map(function (c, i) {
      var hist = requests.filter(function (r) { return r.client === i; });
      var active = hist.filter(function (r) { return r.status === "new" || r.status === "work" || r.status === "wait"; }).length;
      var initials = c.name.replace(/^(ООО|АО|МУП|ЗАО)\s+«?/, "").slice(0, 2).toUpperCase();
      return '<button class="client-card" data-client="' + i + '">' +
        '<div class="cc-head"><span class="cc-logo">' + esc(initials) + '</span><span class="cc-name">' + esc(c.name) + "<small>" + esc(c.city) + " · " + esc(c.person) + "</small></span></div>" +
        '<div class="cc-stats"><span>Заявок: <b>' + hist.length + '</b></span><span>Активных: <b>' + active + '</b></span><span>Единиц техники: <b>' + c.equipment.length + "</b></span></div>" +
        "</button>";
    }).join("");
    $$(".client-card[data-client]").forEach(function (card) {
      card.addEventListener("click", function () {
        openClientDrawer(parseInt(card.getAttribute("data-client"), 10));
      });
    });
  }

  /* ================= Уведомления ================= */

  var notifPanel = $("#notifPanel");
  var notifBtn = $("#btnNotif");
  function renderNotifications() {
    var unread = notifications.filter(function (n) { return !n.read; }).length;
    var badge = $("#notifBadge");
    badge.textContent = unread;
    badge.style.display = unread ? "grid" : "none";
    $("#notifList").innerHTML = notifications.map(function (n) {
      return '<div class="np-item' + (n.read ? " is-read" : "") + '"><span class="dot"></span><span>' + esc(n.text) + '<span class="np-time">' + esc(n.time) + "</span></span></div>";
    }).join("") || '<div class="np-empty">Уведомлений нет</div>';
  }
  notifBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    notifPanel.hidden = !notifPanel.hidden;
  });
  document.addEventListener("click", function (e) {
    if (!notifPanel.hidden && !notifPanel.contains(e.target) && e.target !== notifBtn) notifPanel.hidden = true;
  });
  $("#notifReadAll").addEventListener("click", function () {
    notifications.forEach(function (n) { n.read = true; });
    renderNotifications();
  });

  /* ================= Клавиатура ================= */

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!modal.hidden) closeModal();
      else if (drawer.classList.contains("is-open")) closeDrawer();
      else if (!notifPanel.hidden) notifPanel.hidden = true;
    }
  });

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

  /* ================= Рендер всего ================= */

  function renderAll() {
    renderDashboard();
    renderChips();
    renderRequests();
    if (state.view === "calendar") renderCalendar();
    if (state.view === "clients") renderClients();
    renderNotifications();
  }

  setView("requests");
  renderAll();
})();
