/* VIETLANGNET – Bản đồ lớp học (Leaflet + bản đồ nền CARTO / OpenStreetMap). */
(function () {
  "use strict";
  var CFG = window.VLN_MAP || { classes: [], regions: [] };
  var CLASSES = CFG.classes || [];
  var TILES = CFG.tiles || { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap", maxZoom: 19 };

  var BOOK = '<path d="M3 5.5C3 4.7 3.7 4 4.5 4H9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5h-5A1.5 1.5 0 0 1 3 16z"/><path d="M21 5.5c0-.8-.7-1.5-1.5-1.5H15a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5h5c.8 0 1.5-.7 1.5-1.5z" opacity=".85"/>';
  var BOOK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true">' + BOOK + "</svg>";
  var PIN_SVG = '<svg viewBox="0 0 384 512" aria-hidden="true"><path d="M215.7 499.2C267 435 384 279.4 384 192 384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2a30.2 30.2 0 0 0 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>';
  var ARROW_SVG = '<svg viewBox="0 0 448 512" aria-hidden="true"><path d="M438.6 278.6a32 32 0 0 0 0-45.3l-160-160a32 32 0 0 0-45.3 45.3L338.8 224H32a32 32 0 1 0 0 64h306.7L233.4 393.4a32 32 0 0 0 45.3 45.3l160-160z"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pinHtml() {
    return '<svg class="vln-marker-svg" viewBox="0 0 36 46" aria-hidden="true">' +
      '<path class="vln-marker-bg" d="M18 45c-1.2 0-16-15.8-16-27A16 16 0 0 1 34 18c0 11.2-14.8 27-16 27z" stroke="#ffffff" stroke-width="2.5"/>' +
      '<g class="vln-marker-fg" transform="translate(8 7) scale(0.8333)">' + BOOK + "</g></svg>";
  }
  var ICON = L.divIcon({ className: "vln-marker", html: pinHtml(), iconSize: [32, 41], iconAnchor: [16, 41], popupAnchor: [0, -38] });
  var ICON_ACTIVE = L.divIcon({ className: "vln-marker is-active", html: pinHtml(), iconSize: [40, 51], iconAnchor: [20, 51], popupAnchor: [0, -48] });

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
    if (!root || typeof L === "undefined") return;
    var mapEl = $(root, "map"), listEl = $(root, "list"), countEl = $(root, "count"), chipsEl = $(root, "regions");
    var qEl = $(root, "q"), sel = $(root, "country"), panel = $(root, "panel"), toggle = $(root, "toggle");
    var toggleText = toggle.querySelector("span");
    var mobile = window.matchMedia("(max-width: 760px)");

    var map = L.map(mapEl, { center: [25, 110], zoom: 3, minZoom: 2, worldCopyJump: true, zoomControl: true });
    map.attributionControl.setPrefix(false);
    L.tileLayer(TILES.url, { attribution: TILES.attribution, maxZoom: TILES.maxZoom || 19, detectRetina: true }).addTo(map);

    var cluster = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 45, spiderfyOnMaxZoom: true,
      iconCreateFunction: function (c) {
        var n = c.getChildCount();
        return L.divIcon({ className: "vln-cluster", html: "<span>" + n + "</span>", iconSize: [44, 44] });
      }
    });
    map.addLayer(cluster);

    var activeId = null;
    var markers = {};
    CLASSES.forEach(function (c) {
      var m = L.marker([c.lat, c.lng], { icon: ICON, title: c.name, riseOnHover: true });
      m.bindPopup(popupHtml(c), { maxWidth: 320, minWidth: 260, autoPanPadding: [24, 24] });
      m.on("popupopen", function () { setActive(c.id); });
      m.on("popupclose", function () { if (activeId === c.id) setActive(null); });
      markers[c.id] = m;
    });

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
      if (activeId !== null && markers[activeId]) { markers[activeId].setIcon(ICON); markers[activeId].setZIndexOffset(0); }
      activeId = id;
      if (id !== null && markers[id]) { markers[id].setIcon(ICON_ACTIVE); markers[id].setZIndexOffset(1000); }
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
      map.closePopup();
      setActive(null);
      cluster.clearLayers();
      cluster.addLayers(rows.map(function (c) { return markers[c.id]; }));
      countEl.innerHTML = "Hiển thị <b>" + rows.length + "</b> / " + CLASSES.length + " lớp học";
      listEl.innerHTML = rows.length ? rows.map(function (c) {
        return '<li class="vln-item" tabindex="0" data-id="' + c.id + '">' +
          '<span class="vln-pin">' + BOOK_SVG + "</span><b>" + esc(c.name) + "</b>" +
          '<span class="vln-meta">' + esc([c.city, c.country].filter(Boolean).join(", ")) + "</span>" +
          (c.model ? '<span class="vln-tag">' + esc(c.model) + "</span>" : "") + "</li>";
      }).join("") : '<li class="vln-empty">' + (CLASSES.length ? "Không có lớp nào khớp với tìm kiếm." : "Chưa có lớp học nào trên bản đồ.") + "</li>";
      if (rows.length && fit) {
        map.fitBounds(L.latLngBounds(rows.map(function (c) { return [c.lat, c.lng]; })), { padding: [50, 50], maxZoom: 12 });
      }
    }

    function openClass(id) {
      var m = markers[id];
      if (!m) return;
      if (mobile.matches) { panel.setAttribute("data-open", "false"); toggleText.textContent = "Danh sách lớp"; map.invalidateSize(); }
      cluster.zoomToShowLayer(m, function () {
        map.setView(m.getLatLng(), Math.max(map.getZoom(), 14), { animate: true });
        setTimeout(function () { m.openPopup(); }, 300);
      });
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
      if (!open) map.invalidateSize();
    });
    function syncPanel() {
      panel.setAttribute("data-open", mobile.matches ? "false" : "true");
      toggleText.textContent = "Danh sách lớp";
      setTimeout(function () { map.invalidateSize(); }, 0);
    }
    if (mobile.addEventListener) mobile.addEventListener("change", syncPanel);
    syncPanel();

    var t;
    qEl.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { render(true); }, 200); });
    sel.addEventListener("change", function () { render(true); });
    render(CLASSES.length > 0);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
