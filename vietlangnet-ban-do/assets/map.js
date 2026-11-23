/* VIETLANGNET – Bản đồ lớp học (trang toàn màn hình và shortcode). */
(function () {
  "use strict";
  var CFG = window.VLN_MAP || { classes: [], regions: [] };
  var CLASSES = CFG.classes || [];
  var NAVY = "#0b2545", GOLD = "#e09f3e";

  // Kiểu bản đồ tông sáng, tối giản: biển xanh nhạt, đất trắng ngà, ẩn địa điểm kinh doanh.
  var MAP_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#f5f5f2" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#5b6676" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#a9b6c6" }, { weight: 0.8 }] },
    { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#3b4a5e" }] },
    { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#d3dae3" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#4a5567" }] },
    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#e6ece3" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e9edf2" }] },
    { featureType: "road.arterial", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbe4ee" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#8a9bb0" }] }
  ];

  var BOOK = '<path d="M3 5.5C3 4.7 3.7 4 4.5 4H9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5h-5A1.5 1.5 0 0 1 3 16z"/><path d="M21 5.5c0-.8-.7-1.5-1.5-1.5H15a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5h5c.8 0 1.5-.7 1.5-1.5z" opacity=".85"/>';
  var BOOK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true">' + BOOK + "</svg>";
  var PIN_SVG = '<svg viewBox="0 0 384 512" aria-hidden="true"><path d="M215.7 499.2C267 435 384 279.4 384 192 384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2a30.2 30.2 0 0 0 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>';
  var ARROW_SVG = '<svg viewBox="0 0 448 512" aria-hidden="true"><path d="M438.6 278.6a32 32 0 0 0 0-45.3l-160-160a32 32 0 0 0-45.3 45.3L338.8 224H32a32 32 0 1 0 0 64h306.7L233.4 393.4a32 32 0 0 0 45.3 45.3l160-160z"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function svgUrl(s) { return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(s); }
  function pinSvg(bg, fg) {
    return svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">' +
      '<path d="M18 45c-1.2 0-16-15.8-16-27A16 16 0 0 1 34 18c0 11.2-14.8 27-16 27z" fill="' + bg + '" stroke="#ffffff" stroke-width="2.5"/>' +
      '<g transform="translate(8 7) scale(0.8333)" fill="' + fg + '">' + BOOK + "</g></svg>");
  }
  function row(label, value) { return value ? "<dt>" + label + "</dt><dd>" + value + "</dd>" : ""; }

  function popupHtml(c) {
    var dir = "https://www.google.com/maps/dir/?api=1&destination=" + c.lat + "," + c.lng;
    var phone = c.phone ? '<span class="vln-inline"><span>' + esc(c.phone) + '</span><button class="vln-copy" type="button" data-copy="' + esc(c.phone) + '">Sao chép</button></span>' : "";
    var web = c.website ? '<a href="' + esc(c.website) + '" target="_blank" rel="noopener">' + esc(c.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")) + "</a>" : "";
    var where = [c.city, c.country].filter(Boolean).join(", ");
    return '<div class="vln-pop">' +
      (c.model ? '<span class="vln-tag">' + esc(c.model) + "</span>" : "") +
      "<h3>" + esc(c.name) + "</h3>" +
      (where ? '<p class="vln-where">' + esc(where) + "</p>" : "") +
      "<dl>" +
      row("Điện thoại", phone) + row("Email", esc(c.email)) + row("Website", web) + row("Địa chỉ", esc(c.address)) +
      row("Độ tuổi", esc(c.ages)) + row("Lịch học", esc(c.schedule)) + row("Ngôn ngữ", esc(c.language)) +
      "</dl>" +
      '<div class="vln-actions">' +
      '<a class="vln-btn" href="' + dir + '" target="_blank" rel="noopener">' + PIN_SVG + "Chỉ đường</a>" +
      (c.url ? '<a class="vln-btn vln-btn--ghost" href="' + esc(c.url) + '">Xem chi tiết' + ARROW_SVG + "</a>" : "") +
      "</div></div>";
  }

  function $(root, name) { return root.querySelector('[data-vln="' + name + '"]'); }

  function init() {
    var root = document.querySelector(".vln-app");
    if (!root) return;
    var mapEl = $(root, "map"), listEl = $(root, "list"), countEl = $(root, "count"), chipsEl = $(root, "regions");
    var qEl = $(root, "q"), sel = $(root, "country"), panel = $(root, "panel"), toggle = $(root, "toggle");
    var toggleText = toggle.querySelector("span");
    var mobile = window.matchMedia("(max-width: 760px)");

    var ICON = { url: pinSvg(NAVY, GOLD), scaledSize: new google.maps.Size(32, 41), anchor: new google.maps.Point(16, 41) };
    var ICON_ACTIVE = { url: pinSvg(GOLD, NAVY), scaledSize: new google.maps.Size(40, 51), anchor: new google.maps.Point(20, 51) };

    var map = new google.maps.Map(mapEl, {
      center: { lat: 25, lng: 110 }, zoom: 3, minZoom: 2, styles: MAP_STYLE,
      mapTypeControl: true,
      mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR, position: google.maps.ControlPosition.TOP_RIGHT, mapTypeIds: ["roadmap", "hybrid"] },
      streetViewControl: false, fullscreenControl: root.classList.contains("vln-app--embed"), gestureHandling: "greedy"
    });
    var info = new google.maps.InfoWindow({ maxWidth: 320 });
    var activeId = null;
    var markers = {};

    CLASSES.forEach(function (c) {
      var m = new google.maps.Marker({ position: { lat: c.lat, lng: c.lng }, icon: ICON, title: c.name });
      m.addListener("click", function () { info.setContent(popupHtml(c)); info.open({ map: map, anchor: m }); setActive(c.id); });
      markers[c.id] = m;
    });
    info.addListener("closeclick", function () { setActive(null); });

    var renderer = {
      render: function (cluster) {
        return new google.maps.Marker({
          position: cluster.position, zIndex: 1000 + cluster.count,
          label: { text: String(cluster.count), color: "#ffffff", fontWeight: "800", fontSize: "13px", fontFamily: "Be Vietnam Pro, sans-serif" },
          icon: {
            url: svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="22" fill="' + GOLD + '" fill-opacity=".35"/><circle cx="24" cy="24" r="16" fill="' + NAVY + '" stroke="' + GOLD + '" stroke-width="2.5"/></svg>'),
            scaledSize: new google.maps.Size(48, 48), anchor: new google.maps.Point(24, 24)
          }
        });
      }
    };
    var clusterer = new markerClusterer.MarkerClusterer({ map: map, renderer: renderer });

    root.addEventListener("click", function (e) {
      var b = e.target.closest(".vln-copy");
      if (!b || !navigator.clipboard) return;
      navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function () {
        b.textContent = "Đã chép"; setTimeout(function () { b.textContent = "Sao chép"; }, 1500);
      });
    });

    // Danh sách quốc gia (nhiều lớp nhất lên đầu)
    var counts = {};
    CLASSES.forEach(function (c) { if (c.country) counts[c.country] = (counts[c.country] || 0) + 1; });
    Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b, "vi"); })
      .forEach(function (n) { sel.add(new Option(n + " (" + counts[n] + ")", n)); });

    // Nút lọc khu vực
    var region = "";
    var chips = [["", "Tất cả (" + CLASSES.length + ")"]];
    (CFG.regions || []).forEach(function (r) { if (CLASSES.some(function (c) { return c.region === r; })) chips.push([r, r]); });
    chipsEl.innerHTML = chips.length > 1 ? chips.map(function (x) {
      return '<button class="vln-chip" type="button" data-region="' + esc(x[0]) + '" aria-pressed="' + (x[0] === "") + '">' + esc(x[1]) + "</button>";
    }).join("") : "";
    chipsEl.addEventListener("click", function (e) {
      var b = e.target.closest(".vln-chip"); if (!b) return;
      region = b.getAttribute("data-region");
      chipsEl.querySelectorAll(".vln-chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      render(true);
    });

    function setActive(id) {
      if (activeId !== null && markers[activeId]) { markers[activeId].setIcon(ICON); markers[activeId].setZIndex(undefined); }
      activeId = id;
      if (id !== null && markers[id]) { markers[id].setIcon(ICON_ACTIVE); markers[id].setZIndex(9999); }
      listEl.querySelectorAll(".vln-item").forEach(function (li) { li.classList.toggle("is-active", +li.getAttribute("data-id") === id); });
      var li = listEl.querySelector(".vln-item.is-active");
      if (li && !mobile.matches) li.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function render(fit) {
      var q = qEl.value.trim().toLowerCase(), ct = sel.value;
      var rows = CLASSES.filter(function (c) {
        return (!ct || c.country === ct) && (!region || c.region === region) &&
          (!q || [c.name, c.city, c.country, c.address].join(" ").toLowerCase().indexOf(q) !== -1);
      });
      clusterer.clearMarkers();
      clusterer.addMarkers(rows.map(function (c) { return markers[c.id]; }));
      info.close(); setActive(null);
      countEl.innerHTML = "Hiển thị <b>" + rows.length + "</b> / " + CLASSES.length + " lớp học";
      listEl.innerHTML = rows.length ? rows.map(function (c) {
        return '<li class="vln-item" tabindex="0" data-id="' + c.id + '">' +
          '<span class="vln-pin">' + BOOK_SVG + "</span><b>" + esc(c.name) + "</b>" +
          '<span class="vln-meta">' + esc([c.city, c.country].filter(Boolean).join(", ")) + "</span>" +
          (c.model ? '<span class="vln-tag">' + esc(c.model) + "</span>" : "") + "</li>";
      }).join("") : '<li class="vln-empty">' + (CLASSES.length ? "Không có lớp nào khớp với tìm kiếm." : "Chưa có lớp học nào trên bản đồ.") + "</li>";
      if (rows.length && fit) {
        var b = new google.maps.LatLngBounds();
        rows.forEach(function (c) { b.extend({ lat: c.lat, lng: c.lng }); });
        map.fitBounds(b, 60);
        google.maps.event.addListenerOnce(map, "idle", function () { if (map.getZoom() > 12) map.setZoom(12); });
      }
    }

    function openClass(id) {
      var c = CLASSES.filter(function (x) { return x.id === id; })[0];
      if (!c) return;
      if (mobile.matches) { panel.setAttribute("data-open", "false"); toggleText.textContent = "Danh sách lớp"; }
      map.panTo({ lat: c.lat, lng: c.lng });
      map.setZoom(14);
      google.maps.event.addListenerOnce(map, "idle", function () { google.maps.event.trigger(markers[id], "click"); });
    }
    listEl.addEventListener("click", function (e) { var li = e.target.closest(".vln-item"); if (li) openClass(+li.getAttribute("data-id")); });
    listEl.addEventListener("keydown", function (e) {
      var li = e.target.closest(".vln-item");
      if (li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openClass(+li.getAttribute("data-id")); }
    });

    toggle.addEventListener("click", function () {
      var open = panel.getAttribute("data-open") !== "true";
      panel.setAttribute("data-open", String(open));
      toggleText.textContent = open ? "Xem bản đồ" : "Danh sách lớp";
    });
    function syncPanel() { panel.setAttribute("data-open", mobile.matches ? "false" : "true"); toggleText.textContent = "Danh sách lớp"; }
    if (mobile.addEventListener) mobile.addEventListener("change", syncPanel);
    syncPanel();

    var t;
    qEl.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { render(true); }, 200); });
    sel.addEventListener("change", function () { render(true); });
    render(CLASSES.length > 0);
  }

  window.vlnMapInit = init;
  var s = document.createElement("script");
  s.src = "https://maps.googleapis.com/maps/api/js?callback=vlnMapInit&language=vi&v=weekly" + (CFG.apiKey ? "&key=" + encodeURIComponent(CFG.apiKey) : "");
  s.async = true;
  s.onerror = function () {
    var el = document.querySelector('.vln-app [data-vln="map"]');
    if (el) el.innerHTML = '<p class="vln-empty">Không tải được Google Maps. Kiểm tra kết nối mạng hoặc API key.</p>';
  };
  document.head.appendChild(s);
})();
