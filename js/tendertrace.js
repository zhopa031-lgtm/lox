/* ============================================================
   TENDERTRACE — демо-логика: лента закупок, фильтры, избранное.
   Все данные тестовые, сгенерированы для демонстрации.
   ============================================================ */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ================= Тестовые данные ================= */

  var REGIONS = ["Москва", "Московская обл.", "Свердловская обл.", "Челябинская обл.", "Новосибирская обл.", "Пермский край", "Республика Татарстан", "Тюменская обл."];
  var CATEGORIES = ["Насосное оборудование", "Компрессоры", "Металлообработка", "Котельное оборудование", "КИПиА и автоматика", "Конвейерные системы", "Электродвигатели"];

  function shiftIso(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function pubIso(daysAgo) { return shiftIso(-daysAgo); }

  var tenders = [
    {
      num: "0372200010625000084", title: "Поставка центробежных насосов для систем водоотведения",
      org: "МУП «Горводоканал»", region: 2, cat: 0, budget: 4850000, deadline: 12, score: 92, pub: 3,
      desc: "Закупка трёх центробежных насосов для насосной станции второго подъёма. Требуется наличие сертификатов соответствия, гарантия не менее 24 месяцев, шеф-монтаж силами поставщика.",
      reqs: ["Аналоги не допускаются — требуется конкретный типоразмер Д-320", "Гарантия 24 месяца с моментом ввода", "Шеф-монтаж и пусконаладка включены в цену", "Доставка до объекта не позднее 10 дней с даты отгрузки"],
      docs: ["Извещение № 0372200010625000084", "Техническое задание (PDF, 1.2 МБ)", "Проект договора (DOCX, 340 КБ)"]
    },
    {
      num: "0169300011425000121", title: "Ремонт и модернизация токарного станка с ЧПУ 16К20Ф3",
      org: "АО «Промметалл»", region: 3, cat: 2, budget: 1240000, deadline: 5, score: 87, pub: 6,
      desc: "Капитальный ремонт токарного станка с заменой направляющих и восстановлением геометрической точности. Работы на площадке заказчика, срок выполнения — 45 календарных дней.",
      reqs: ["Опыт ремонта станков с ЧПУ не менее 3 лет", "Собственная метрологическая база", "Поэтапная приёмка работ с актами"],
      docs: ["Извещение № 0169300011425000121", "Дефектная ведомость (PDF, 620 КБ)"]
    },
    {
      num: "0540300010725000193", title: "Приобретение поршневых компрессоров для котельной микрорайона",
      org: "ООО «СибЭнергоРемонт»", region: 4, cat: 1, budget: 2970000, deadline: 21, score: 81, pub: 2,
      desc: "Поставка двух поршневых компрессорных установок для обеспечения сжатым воздухом котельного оборудования. Требуется автоматизация управления и интеграция с существующей системой контроля.",
      reqs: ["Производительность не менее 10 м³/мин", "Автоматическое управление с удалённым мониторингом", "Обучение персонала заказчика"],
      docs: ["Извещение № 0540300010725000193", "ТЗ на компрессорное оборудование (PDF)"]
    },
    {
      num: "0366300010925000042", title: "Поставка частотных преобразователей для приводов насосных агрегатов",
      org: "АО «УралГидро»", region: 2, cat: 6, budget: 1870000, deadline: 9, score: 78, pub: 4,
      desc: "Закупка шести частотных преобразователей мощностью 75 кВт для модернизации насосной группы. Требуется интеграция с существующей АСУ ТП и настройка режимов работы.",
      reqs: ["Совместимость с протоколом Modbus RTU", "Степень защиты не ниже IP54", "Настройка и пусконаладка на объекте"],
      docs: ["Извещение № 0366300010925000042", "Опросные листы (XLSX)"]
    },
    {
      num: "0111300011125000157", title: "Выполнение работ по замене приводного барабана конвейерной линии",
      org: "ООО «АгроТехСоюз»", region: 3, cat: 5, budget: 940000, deadline: 4, score: 74, pub: 8,
      desc: "Замена приводного и натяжного барабанов ленточного конвейера ЛК-500 на зерноперерабатывающем комплексе. Работы в межсезонный простой линии.",
      reqs: ["Работы строго в окно простоя (12 дней)", "Наличие монтажной бригады с допусками", "Утилизация демонтированного оборудования"],
      docs: ["Извещение № 0111300011125000157", "Схема конвейерной линии (PDF)"]
    },
    {
      num: "0261300010525000216", title: "Поставка манометров и датчиков давления для системы учёта",
      org: "МУП «Тепловые сети»", region: 1, cat: 4, budget: 620000, deadline: 16, score: 71, pub: 1,
      desc: "Закупка партии датчиков давления и вторичной аппаратуры для узлов учёта тепловой энергии. Поставка партиями по графику согласованному с заказчиком.",
      reqs: ["Поверка приборов на момент поставки", "Паспорта и свидетельства на каждую единицу", "Гарантия 18 месяцев"],
      docs: ["Извещение № 0261300010525000216", "Спецификация приборов (PDF)"]
    },
    {
      num: "0169300011425000031", title: "Оказание услуг по диагностике мостового крана грузоподъёмностью 16 т",
      org: "ЗАО «Металлург-Сервис»", region: 3, cat: 2, budget: 380000, deadline: 7, score: 88, pub: 5,
      desc: "Комплексная техническая диагностика мостового крана: дефектоскопия металлоконструкций, проверка механизмов подъёма, оценка остаточного ресурса с выдачей заключения.",
      reqs: ["Аттестованные специалисты по неразрушающему контролю", "Заключение по форме Ростехнадзора", "Опыт диагностики кранов от 5 лет"],
      docs: ["Извещение № 0169300011425000031", "Паспорт крана (по запросу)"]
    },
    {
      num: "0352300010825000068", title: "Поставка запасных частей для насосного оборудования водоотлива",
      org: "МУП «Горводоканал»", region: 6, cat: 0, budget: 540000, deadline: 13, score: 83, pub: 2,
      desc: "Поставка комплекта запасных частей для насосов СД 250/22: подшипниковые узлы, сальниковые набивки, крыльчатки. Годовой контракт с поквартальной отгрузкой.",
      reqs: ["Оригинальные или равноценные по качеству детали", "Складской запас на время контракта", "Отгрузка в течение 5 рабочих дней"],
      docs: ["Извещение № 0169300011425000031 (позиция 2)", "Перечень запасных частей (XLSX)"]
    },
    {
      num: "0255300010425000099", title: "Модернизация системы автоматизации котельной с установкой контроллера",
      org: "АО «ХимПром-Восток»", region: 7, cat: 4, budget: 2130000, deadline: 26, score: 76, pub: 1,
      desc: "Замена устаревшего контроллера котельной на современный ПЛК с интеграцией в диспетчерскую систему предприятия. Работы включают программирование и обучение операторов.",
      reqs: ["Опыт автоматизации котельных", "Резервирование контроллера", "Передача исходных кодов проекта АСУ"],
      docs: ["Извещение № 0255300010425000099", "Схема автоматизации (PDF, 2.1 МБ)"]
    },
    {
      num: "0409300012025000144", title: "Поставка электродвигателей для привода вентиляторов градирни",
      org: "ООО «СибЭнергоРемонт»", region: 4, cat: 6, budget: 760000, deadline: 18, score: 58, pub: 6,
      desc: "Поставка четырёх асинхронных электродвигателей 30 кВт для вентиляторов градирни с защитой от влаги и перепадов температур.",
      reqs: ["Степень защиты IP55", "Климатическое исполнение УХЛ1", "Гарантия 24 месяца"],
      docs: ["Извещение № 0409300012025000144"]
    },
    {
      num: "0261300010525000077", title: "Капитальный ремонт парового котла ДЕ-10-14ГМ с заменой трубопроводов",
      org: "ООО «СибЭнергоРемонт»", region: 4, cat: 3, budget: 5600000, deadline: 29, score: 69, pub: 3,
      desc: "Комплексный капитальный ремонт парового котла: замена экранных труб, ремонт горелочных устройств, гидравлические испытания с последующей постановкой на режим.",
      reqs: ["Лицензия на работы с оборудованием под давлением", "Аттестованные сварщики (НАКС)", "Гидравлические испытания с составлением актов"],
      docs: ["Извещение № 0261300010525000077", "Проект производства работ (PDF)"]
    },
    {
      num: "0111300011125000185", title: "Поставка роликов и роликоопор для конвейерной линии участка отгрузки",
      org: "ООО «АгроТехСоюз»", region: 5, cat: 5, budget: 430000, deadline: 11, score: 81, pub: 4,
      desc: "Поставка 240 роликов и 32 роликоопор для конвейера ЛК-500. Поставка в два этапа: 60% в течение 15 дней, остальное — по графику ремонта.",
      reqs: ["Соответствие типоразмерам эксплуатируемой линии", "Упаковка, предотвращающая повреждения при перевозке"],
      docs: ["Извещение № 0111300011125000185", "Спецификация роликов (XLSX)"]
    },
    {
      num: "0372200010625000168", title: "Поставка дозировочных насосов для станции нейтрализации стоков",
      org: "МУП «Водоканал-Сервис»", region: 0, cat: 0, budget: 1180000, deadline: 15, score: 90, pub: 1,
      desc: "Поставка трёх дозировочных насосов-модулей с автоматическим регулированием производительности для станции нейтрализации промышленных стоков.",
      reqs: ["Регулирование производительности 0–100%", "Материалы, стойкие к агрессивным средам", "Пусконаладка и обучение операторов"],
      docs: ["Извещение № 0372200010625000168", "ТЗ на дозировочное оборудование (PDF)"]
    },
    {
      num: "0540300010725000204", title: "Услуги по техническому обслуживанию компрессорной станции",
      org: "АО «Промметалл»", region: 3, cat: 1, budget: 690000, deadline: 22, score: 64, pub: 7,
      desc: "Годовой контракт на регламентное ТО компрессорной станции: ежеквартальные осмотры, замена фильтров и масла, аварийные выезды в течение 24 часов.",
      reqs: ["Собственный склад расходников", "Аварийный выезд не позднее 24 часов", "Отчётность после каждого выезда"],
      docs: ["Извещение № 0540300010725000204", "Проект годового контракта (DOCX)"]
    },
    {
      num: "0366300010925000129", title: "Поставка заточного оборудования для инструментального участка",
      org: "МУП «Горводоканал»", region: 5, cat: 2, budget: 490000, deadline: 20, score: 52, pub: 9,
      desc: "Поставка двух универсально-заточных станков для восстановления режущего инструмента ремонтной мастерской предприятия.",
      reqs: ["Габариты и масса в пределах имеющегося фундамента", "Обучение двух сотрудников работе на станках"],
      docs: ["Извещение № 0366300010925000129"]
    },
    {
      num: "0255300010425000231", title: "Поставка и монтаж шкафа управления задвижками водозаборного узла",
      org: "АО «УралГидро»", region: 2, cat: 4, budget: 830000, deadline: 10, score: 79, pub: 2,
      desc: "Изготовление, поставка и монтаж шкафа управления с контроллером для управления группой из шести задвижек водозаборного узла с резервированием питания.",
      reqs: ["Резервированный источник питания", "Отображение статуса каждой задвижки", "Монтаж и пусконаладка на объекте"],
      docs: ["Извещение № 0255300010425000231", "Схема подключений (PDF)"]
    },
    {
      num: "0409300012025000071", title: "Поставка гидроцилиндров для прессового оборудования цеха номер четыре",
      org: "ЗАО «Металлург-Сервис»", region: 7, cat: 2, budget: 1350000, deadline: 3, score: 85, pub: 8,
      desc: "Изготовление и поставка двух гидроцилиндров усилием 200 т по образцам демонтированных. Требуется ускоренное изготовление из-за простоя прессовой линии.",
      reqs: ["Изготовление по образцам заказчика", "Испытания на стенде перед отгрузкой", "Гарантия на сварные соединения 36 месяцев"],
      docs: ["Извещение № 0409300012025000071", "Чертежи цилиндров (по запросу)"]
    },
    {
      num: "0111300011125000193", title: "Поставка подшипников для редукторов конвейерных линий",
      org: "ООО «АгроТехСоюз»", region: 5, cat: 5, budget: 320000, deadline: 8, score: 67, pub: 5,
      desc: "Поставка партии подшипников качения для планового ремонта редукторов конвейерных линий. Требуется упаковка с маркировкой по типоразмерам.",
      reqs: ["Оригинальные подшипники или аналоги премиум-класса", "Маркировка каждой упаковки типоразмером", "Срок поставки не более 10 дней"],
      docs: ["Извещение № 0111300011125000193", "Перечень типоразмеров (XLSX)"]
    },
    {
      num: "0169300011425000109", title: "Разработка проектной документации на модернизацию системы пылеудаления",
      org: "АО «ХимПром-Восток»", region: 7, cat: 3, budget: 970000, deadline: 24, score: 61, pub: 4,
      desc: "Разработка проектной и рабочей документации на модернизацию аспирационной системы цеха. Проект должен пройти экспертизу промышленной безопасности.",
      reqs: ["СРО на проектирование опасных производственных объектов", "Сопровождение экспертизы проекта", "Срок разработки — 90 дней"],
      docs: ["Извещение № 0169300011425000109", "Техническое задание на проектирование (PDF)"]
    },
    {
      num: "0352300010825000116", title: "Поставка лабораторного оборудования для контроля качества воды",
      org: "МУП «Водоканал-Сервис»", region: 1, cat: 4, budget: 560000, deadline: 17, score: 72, pub: 2,
      desc: "Поставка комплектов лабораторного оборудования для химической лаборатории: pH-метры, кондуктометры, фотометры с расходными материалами на год.",
      reqs: ["Поверка приборов и внесение в реестр", "Расходные материалы на 12 месяцев работы", "Обучение лаборантов"],
      docs: ["Извещение № 0352300010825000116", "Перечень оборудования (PDF)"]
    }
  ];

  /* Состояние */
  var favs = {};       // номер закупки -> true
  var tracked = {};    // номер -> true
  var favOnly = false;
  var filters = {
    q: "",
    regions: {},
    cats: {},
    scoreMin: 0,
    deadlineMax: 3650,
    sort: "score"
  };

  function fmtMoney(n) {
    return n.toLocaleString("ru-RU").replace(/,/g, " ") + " ₽";
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function scoreClass(s) { return s >= 80 ? "" : s >= 65 ? "mid" : "low"; }
  function dlClass(days) { return days <= 7 ? "dl-soon" : days <= 14 ? "dl-mid" : ""; }

  function toast(text) {
    var box = $("#toasts");
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    box.appendChild(t);
    setTimeout(function () { t.classList.add("is-out"); }, 3000);
    setTimeout(function () { t.remove(); }, 3500);
  }

  /* ================= Фильтры: чекбоксы ================= */

  function buildChecks(containerId, items, stateObj, keyName) {
    var box = $(containerId);
    box.innerHTML = items.map(function (name, i) {
      var cnt = tenders.filter(function (t) { return t[keyName] === i; }).length;
      return '<label class="tf-check"><input type="checkbox" data-i="' + i + '"><span class="box">✓</span>' + esc(name) + '<span class="cnt">' + cnt + "</span></label>";
    }).join("");
    box.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var i = parseInt(inp.getAttribute("data-i"), 10);
        if (inp.checked) stateObj[i] = true;
        else delete stateObj[i];
        render();
      });
    });
  }

  buildChecks("#regionChecks", REGIONS, filters.regions, "region");
  buildChecks("#catChecks", CATEGORIES, filters.cats, "cat");

  $("#ttSearch").addEventListener("input", function (e) {
    filters.q = e.target.value.trim().toLowerCase();
    render();
  });
  $("#scoreMin").addEventListener("change", function (e) {
    filters.scoreMin = parseInt(e.target.value, 10);
    render();
  });
  $("#deadlineMax").addEventListener("change", function (e) {
    filters.deadlineMax = parseInt(e.target.value, 10);
    render();
  });
  $("#sortSel").addEventListener("change", function (e) {
    filters.sort = e.target.value;
    render();
  });
  $("#favToggle").addEventListener("click", function () {
    favOnly = !favOnly;
    $("#favToggle").classList.toggle("is-on", favOnly);
    render();
    if (favOnly) toast("Показаны только избранные закупки");
  });
  function resetFilters() {
    filters.q = "";
    filters.regions = {};
    filters.cats = {};
    filters.scoreMin = 0;
    filters.deadlineMax = 3650;
    $("#ttSearch").value = "";
    $("#scoreMin").value = "0";
    $("#deadlineMax").value = "3650";
    $$(".tf-check input").forEach(function (inp) { inp.checked = false; });
    render();
    toast("Фильтры сброшены");
  }
  $("#resetFilters").addEventListener("click", resetFilters);
  $("#resetFilters2").addEventListener("click", resetFilters);

  /* ================= Рендер ленты ================= */

  function filtered() {
    var list = tenders.filter(function (t) {
      if (favOnly && !favs[t.num]) return false;
      if (Object.keys(filters.regions).length && !filters.regions[t.region]) return false;
      if (Object.keys(filters.cats).length && !filters.cats[t.cat]) return false;
      if (t.score < filters.scoreMin) return false;
      if (t.deadline > filters.deadlineMax) return false;
      if (filters.q) {
        var hay = (t.title + " " + t.org + " " + REGIONS[t.region] + " " + CATEGORIES[t.cat] + " " + t.num).toLowerCase();
        if (hay.indexOf(filters.q) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      switch (filters.sort) {
        case "budget": return b.budget - a.budget;
        case "deadline": return a.deadline - b.deadline;
        case "new": return b.pub - a.pub;
        default: return b.score - a.score;
      }
    });
    return list;
  }

  function starSvg() {
    return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.8 9.9 5.6l4.2.6-3 3 .7 4.2L8 11.4l-3.8 2 .7-4.2-3-3 4.2-.6L8 1.8Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  }

  function renderFeed() {
    var list = filtered();
    $("#foundCount").innerHTML = "Найдено закупок: <b>" + list.length + "</b> из " + tenders.length;
    $("#feed").innerHTML = list.map(function (t) {
      var isFav = !!favs[t.num];
      var dl = t.deadline === 1 ? "1 день" : t.deadline < 5 ? t.deadline + " дня" : t.deadline + " дн.";
      return '<article class="tt-row' + (t.score >= 85 ? " is-hot" : "") + '" data-num="' + t.num + '" tabindex="0" role="button" aria-label="Открыть карточку закупки">' +
        '<span class="tt-score ' + scoreClass(t.score) + '" style="--v:' + t.score + '" aria-label="Релевантность">' + t.score + "</span>" +
        '<div class="tt-info">' +
          '<div class="tt-title">' + esc(t.title) + "</div>" +
          '<div class="tt-meta"><span>' + esc(t.org) + '</span><span>' + esc(REGIONS[t.region]) + '</span><span class="cat">' + esc(CATEGORIES[t.cat]) + "</span></div>" +
          '<div class="tt-num">№ ' + t.num + " · опубликовано " + t.pub + " дн. назад</div>" +
        "</div>" +
        '<div class="tt-money">' +
          '<div class="tt-budget">' + fmtMoney(t.budget) + "</div>" +
          '<span class="tt-deadline ' + dlClass(t.deadline) + '">дедлайн: ' + dl + "</span>" +
        "</div>" +
        '<button class="tt-star' + (isFav ? " is-fav" : "") + '" data-star="' + t.num + '" aria-label="В избранное">' + starSvg() + "</button>" +
        "</article>";
    }).join("");

    $("#feedEmpty").hidden = list.length > 0;

    $$("#feed .tt-row").forEach(function (row) {
      row.addEventListener("click", function (e) {
        if (e.target.closest(".tt-star")) return;
        openDrawer(row.getAttribute("data-num"));
      });
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDrawer(row.getAttribute("data-num"));
        }
      });
    });
    $$("#feed .tt-star").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleFav(btn.getAttribute("data-star"));
      });
    });
  }

  function toggleFav(num) {
    var t = tenders.find(function (x) { return x.num === num; });
    if (favs[num]) {
      delete favs[num];
      toast("Убрано из избранного: " + t.title.slice(0, 34) + "…");
    } else {
      favs[num] = true;
      toast("Добавлено в избранное: " + t.title.slice(0, 34) + "…");
    }
    var cnt = Object.keys(favs).length;
    $("#favCount").textContent = cnt;
    if (favOnly && cnt === 0) {
      favOnly = false;
      $("#favToggle").classList.remove("is-on");
    }
    renderFeed();
    if (stateDrawerNum === num) renderDrawerActions(num);
  }

  /* ================= Шапка-статистика ================= */

  function renderStats() {
    $("#statTotal").textContent = tenders.length;
    var sum = tenders.reduce(function (acc, t) { return acc + t.budget; }, 0);
    $("#statBudget").textContent = (sum / 1000000).toLocaleString("ru-RU") + " млн ₽";
    $("#statHot").textContent = tenders.filter(function (t) { return t.score >= 85; }).length;
    $("#statSoon").textContent = tenders.filter(function (t) { return t.deadline <= 7; }).length;
  }

  /* ================= Аналитика выборки ================= */

  function renderAnalytics() {
    var list = filtered();
    // по категориям
    var catCounts = CATEGORIES.map(function (_, i) {
      return list.filter(function (t) { return t.cat === i; }).length;
    });
    var maxCat = Math.max.apply(null, catCounts.concat([1]));
    $("#ttaCatHint").textContent = "в текущей выборке: " + list.length;
    $("#catBars").innerHTML = CATEGORIES.map(function (name, i) {
      var w = Math.round(catCounts[i] / maxCat * 100);
      return '<div class="tta-cat"><span class="nm">' + esc(name) + '</span><span class="track"><i style="width:' + w + '%"></i></span><span class="n">' + catCounts[i] + "</span></div>";
    }).join("");

    // дедлайны на 14 дней
    var bars = [];
    for (var d = 1; d <= 14; d++) {
      var n = tenders.filter(function (t) { return t.deadline === d; }).length;
      bars.push({ n: n, d: d });
    }
    var maxD = Math.max.apply(null, bars.map(function (b) { return b.n; }).concat([1]));
    $("#dlBars").innerHTML = bars.map(function (b) {
      var cls = b.d <= 7 ? " is-soon" : b.d <= 10 ? " is-mid" : "";
      var h = b.n ? Math.max(Math.round(b.n / maxD * 100), 6) : 0;
      return '<div class="bar' + cls + (b.n ? "" : " zero") + '"><i style="height:' + h + '%"></i><span>' + b.d + "</span></div>";
    }).join("");
  }

  /* ================= Drawer: карточка закупки ================= */

  var drawer = $("#drawer");
  var scrim = $("#scrim");
  var stateDrawerNum = null;

  function openDrawer(num) {
    stateDrawerNum = num;
    var t = tenders.find(function (x) { return x.num === num; });
    if (!t) return;
    var dlTxt = t.deadline === 1 ? "1 день" : t.deadline < 5 ? t.deadline + " дня" : t.deadline + " дней";
    $("#drawerBody").innerHTML =
      '<div class="td-title-row">' +
        '<span class="td-score-lg ' + scoreClass(t.score) + '" style="--v:' + t.score + '">' + t.score + "</span>" +
        "<div><div class=\"td-title\">" + esc(t.title) + '</div><div class="td-score-label">релевантность профилю поставщика · ' + (t.score >= 85 ? "высокая" : t.score >= 65 ? "средняя" : "низкая") + "</div></div>" +
      "</div>" +
      '<div class="td-facts">' +
        '<div class="td-fact"><small>Организация</small><b>' + esc(t.org) + "</b></div>" +
        '<div class="td-fact"><small>Регион</small><b>' + esc(REGIONS[t.region]) + "</b></div>" +
        '<div class="td-fact"><small>Бюджет (НМЦК)</small><b class="money">' + fmtMoney(t.budget) + "</b></div>" +
        '<div class="td-fact"><small>Срок подачи заявок</small><b class="' + (t.deadline <= 7 ? "soon" : t.deadline <= 14 ? "warn" : "") + '">осталось ' + dlTxt + "</b></div>" +
        '<div class="td-fact"><small>Категория</small><b>' + esc(CATEGORIES[t.cat]) + "</b></div>" +
        '<div class="td-fact"><small>Номер закупки</small><b style="font-family:var(--font-mono);font-size:12px">' + t.num + "</b></div>" +
      "</div>" +
      '<div class="td-sec"><b>Описание закупки</b><p class="td-desc">' + esc(t.desc) + "</p></div>" +
      '<div class="td-sec"><b>Требования к поставщику</b><ul class="td-list">' + t.reqs.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="td-sec"><b>Документы</b><ul class="td-list td-docs">' + t.docs.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="td-actions" id="tdActions"></div>' +
      '<p class="td-note">Это демонстрационная карточка. В реальной системе здесь отображаются данные площадки закупок в моменте, история изменений лота и уведомления о переносе дедлайнов.</p>';

    renderDrawerActions(num);
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    scrim.hidden = false;
    requestAnimationFrame(function () { scrim.classList.add("is-open"); });
    document.body.style.overflow = "hidden";
    drawer.querySelector(".td-body").scrollTop = 0;
  }

  function renderDrawerActions(num) {
    var box = $("#tdActions");
    if (!box) return;
    var isFav = !!favs[num];
    var isTr = !!tracked[num];
    box.innerHTML =
      '<button class="td-btn td-btn-fav' + (isFav ? " is-fav" : "") + '" id="tdFav">' + starSvg() + (isFav ? "В избранном" : "В избранное") + "</button>" +
      '<button class="td-btn td-btn-track' + (isTr ? " is-on" : "") + '" id="tdTrack">' + (isTr ? "Отслеживается ✓" : "Отслеживать") + "</button>" +
      '<button class="td-btn td-btn-disabled" title="В демо переход на площадку отключён">Перейти на площадку (демо)</button>';
    $("#tdFav").addEventListener("click", function () { toggleFav(num); });
    $("#tdTrack").addEventListener("click", function () {
      if (tracked[num]) {
        delete tracked[num];
        toast("Отслеживание отключено");
      } else {
        tracked[num] = true;
        toast("Закупка добавлена в отслеживание — уведомим о переносе дедлайна");
      }
      renderDrawerActions(num);
    });
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    scrim.classList.remove("is-open");
    setTimeout(function () { if (!drawer.classList.contains("is-open")) scrim.hidden = true; }, 350);
    document.body.style.overflow = "";
    stateDrawerNum = null;
  }
  $("#drawerClose").addEventListener("click", closeDrawer);
  scrim.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
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

  /* ================= Запуск ================= */

  function render() {
    renderFeed();
    renderAnalytics();
  }
  renderStats();
  render();
})();
