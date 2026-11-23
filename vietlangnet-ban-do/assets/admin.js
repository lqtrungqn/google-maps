/* Bản đồ chọn vị trí trong màn hình thêm / sửa lớp học (Leaflet + tìm địa chỉ bằng OpenStreetMap Nominatim). */
(function () {
  "use strict";
  var CFG = window.VLN_ADMIN || {};
  var TILES = CFG.tiles || { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap", maxZoom: 19 };
  var latEl = document.getElementById("vln_lat");
  var lngEl = document.getElementById("vln_lng");
  var addrEl = document.getElementById("vln_address");
  var btn = document.getElementById("vln_geocode");
  var msg = document.getElementById("vln_geo_msg");
  var box = document.getElementById("vln_picker");
  if (!latEl || !lngEl || !box || typeof L === "undefined") return;

  var BOOK = '<path d="M3 5.5C3 4.7 3.7 4 4.5 4H9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5h-5A1.5 1.5 0 0 1 3 16z"/><path d="M21 5.5c0-.8-.7-1.5-1.5-1.5H15a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5h5c.8 0 1.5-.7 1.5-1.5z" opacity=".85"/>';
  var ICON = L.divIcon({
    className: "vln-admin-marker",
    html: '<svg viewBox="0 0 36 46" width="32" height="41" aria-hidden="true"><path d="M18 45c-1.2 0-16-15.8-16-27A16 16 0 0 1 34 18c0 11.2-14.8 27-16 27z" fill="#0b2545" stroke="#fff" stroke-width="2.5"/><g transform="translate(8 7) scale(0.8333)" fill="#e09f3e">' + BOOK + "</g></svg>",
    iconSize: [32, 41], iconAnchor: [16, 41]
  });

  function say(text, kind) {
    msg.textContent = text;
    msg.className = "description" + (kind ? " vln-msg--" + kind : "");
  }
  function current() {
    var lat = parseFloat(String(latEl.value).replace(",", ".")), lng = parseFloat(String(lngEl.value).replace(",", "."));
    return isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
  }

  var start = current();
  var map = L.map(box, { center: start || [20, 100], zoom: start ? 15 : 2, scrollWheelZoom: false });
  map.attributionControl.setPrefix(false);
  L.tileLayer(TILES.url, { attribution: TILES.attribution, maxZoom: TILES.maxZoom || 19 }).addTo(map);
  map.on("focus", function () { map.scrollWheelZoom.enable(); });
  map.on("blur", function () { map.scrollWheelZoom.disable(); });

  var marker = L.marker(start || [0, 0], { icon: ICON, draggable: true });
  if (start) marker.addTo(map);

  function setPos(ll, pan) {
    latEl.value = ll.lat.toFixed(6);
    lngEl.value = ll.lng.toFixed(6);
    marker.setLatLng(ll);
    if (!map.hasLayer(marker)) marker.addTo(map);
    if (pan) map.panTo(ll);
  }
  marker.on("dragend", function () { setPos(marker.getLatLng()); say("Đã cập nhật vị trí theo ghim. Nhớ bấm Cập nhật / Đăng để lưu.", "ok"); });
  map.on("click", function (e) { setPos(e.latlng); say("Đã đặt ghim tại vị trí vừa bấm. Nhớ bấm Cập nhật / Đăng để lưu.", "ok"); });

  function fromInputs() {
    var p = current();
    if (!p) return;
    marker.setLatLng(p);
    if (!map.hasLayer(marker)) marker.addTo(map);
    map.setView(p, Math.max(map.getZoom(), 15));
  }
  latEl.addEventListener("change", fromInputs);
  lngEl.addEventListener("change", fromInputs);

  // Tìm tọa độ từ địa chỉ bằng Nominatim (OpenStreetMap). Miễn phí, không cần key; chỉ dùng khi admin bấm nút.
  function geocode() {
    var address = addrEl.value.trim();
    var city = (document.getElementById("vln_city") || {}).value || "";
    var country = (document.getElementById("vln_country") || {}).value || "";
    var queries = [];
    if (address) queries.push(address);
    var cc = [city, country].filter(Boolean).join(", ");
    if (cc && queries.indexOf(cc) === -1) queries.push(cc);
    if (!queries.length) { say("Hãy nhập địa chỉ (hoặc thành phố, quốc gia) trước khi bấm Tìm vị trí.", "error"); addrEl.focus(); return; }
    btn.disabled = true;
    say("Đang tìm vị trí…");
    (function next(i) {
      if (i >= queries.length) {
        btn.disabled = false;
        say("Không tìm thấy địa chỉ này. Thử ghi rõ hơn (thêm thành phố, quốc gia, viết theo tiếng địa phương hoặc tiếng Anh) hoặc bấm trực tiếp lên bản đồ.", "error");
        return;
      }
      var url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=vi&q=" + encodeURIComponent(queries[i]);
      fetch(url, { headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (res) {
          if (!res || !res.length) { setTimeout(function () { next(i + 1); }, 1100); return; }
          btn.disabled = false;
          var r = res[0], ll = L.latLng(parseFloat(r.lat), parseFloat(r.lon));
          setPos(ll, false);
          if (r.boundingbox) {
            var b = r.boundingbox.map(parseFloat);
            map.fitBounds([[b[0], b[2]], [b[1], b[3]]], { maxZoom: 17 });
          } else {
            map.setView(ll, 16);
          }
          var approx = i > 0 ? " (chỉ tìm được theo thành phố, hãy kéo ghim tới đúng vị trí lớp)" : "";
          say("Đã tìm thấy: " + r.display_name + approx + ". Kéo ghim nếu cần chỉnh cho chính xác, rồi bấm Cập nhật / Đăng.", i > 0 ? "error" : "ok");
        })
        .catch(function () {
          btn.disabled = false;
          say("Không kết nối được dịch vụ tìm địa chỉ. Hãy bấm trực tiếp lên bản đồ hoặc nhập vĩ độ, kinh độ bằng tay.", "error");
        });
    })(0);
  }
  btn.addEventListener("click", geocode);
  addrEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); geocode(); } });

  // Meta box có thể bị thu gọn rồi mở lại → cập nhật kích thước bản đồ.
  setTimeout(function () { map.invalidateSize(); }, 300);
  var postbox = box.closest(".postbox");
  if (postbox && window.MutationObserver) {
    new MutationObserver(function () { setTimeout(function () { map.invalidateSize(); }, 50); }).observe(postbox, { attributes: true, attributeFilter: ["class"] });
  }
})();
