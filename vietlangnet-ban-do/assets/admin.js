/* Bản đồ chọn vị trí trong màn hình thêm / sửa lớp học. */
(function () {
  "use strict";
  var CFG = window.VLN_ADMIN || {};
  var latEl = document.getElementById("vln_lat");
  var lngEl = document.getElementById("vln_lng");
  var addrEl = document.getElementById("vln_address");
  var btn = document.getElementById("vln_geocode");
  var msg = document.getElementById("vln_geo_msg");
  var box = document.getElementById("vln_picker");
  if (!latEl || !lngEl || !box) return;

  var NAVY = "#0b2545", GOLD = "#e09f3e";
  var BOOK = '<path d="M3 5.5C3 4.7 3.7 4 4.5 4H9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5h-5A1.5 1.5 0 0 1 3 16z"/><path d="M21 5.5c0-.8-.7-1.5-1.5-1.5H15a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5h5c.8 0 1.5-.7 1.5-1.5z" opacity=".85"/>';
  var PIN = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46"><path d="M18 45c-1.2 0-16-15.8-16-27A16 16 0 0 1 34 18c0 11.2-14.8 27-16 27z" fill="' + NAVY + '" stroke="#fff" stroke-width="2.5"/><g transform="translate(8 7) scale(0.8333)" fill="' + GOLD + '">' + BOOK + "</g></svg>");

  function say(text, kind) {
    msg.textContent = text;
    msg.className = "description" + (kind ? " vln-msg--" + kind : "");
  }
  function current() {
    var lat = parseFloat(String(latEl.value).replace(",", ".")), lng = parseFloat(String(lngEl.value).replace(",", "."));
    return isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat: lat, lng: lng } : null;
  }

  window.vlnAdminInit = function () {
    var start = current();
    var map = new google.maps.Map(box, {
      center: start || { lat: 20, lng: 100 }, zoom: start ? 15 : 2,
      streetViewControl: false, mapTypeControl: true, fullscreenControl: true, gestureHandling: "cooperative"
    });
    var marker = new google.maps.Marker({
      map: start ? map : null, position: start, draggable: true,
      icon: { url: PIN, scaledSize: new google.maps.Size(32, 41), anchor: new google.maps.Point(16, 41) }
    });

    function setPos(pos, pan) {
      latEl.value = pos.lat().toFixed(6);
      lngEl.value = pos.lng().toFixed(6);
      marker.setPosition(pos);
      marker.setMap(map);
      if (pan) map.panTo(pos);
    }
    marker.addListener("dragend", function (e) { setPos(e.latLng); say("Đã cập nhật vị trí theo ghim. Nhớ bấm Cập nhật / Đăng để lưu.", "ok"); });
    map.addListener("click", function (e) { setPos(e.latLng); say("Đã đặt ghim tại vị trí vừa bấm. Nhớ bấm Cập nhật / Đăng để lưu.", "ok"); });

    function fromInputs() {
      var p = current();
      if (!p) return;
      var ll = new google.maps.LatLng(p.lat, p.lng);
      marker.setPosition(ll); marker.setMap(map); map.panTo(ll);
      if (map.getZoom() < 10) map.setZoom(15);
    }
    latEl.addEventListener("change", fromInputs);
    lngEl.addEventListener("change", fromInputs);

    var geocoder = new google.maps.Geocoder();
    function geocode() {
      var address = addrEl.value.trim();
      var city = (document.getElementById("vln_city") || {}).value || "";
      var country = (document.getElementById("vln_country") || {}).value || "";
      var query = address || [city, country].filter(Boolean).join(", ");
      if (!query) { say("Hãy nhập địa chỉ (hoặc thành phố, quốc gia) trước khi bấm Tìm vị trí.", "error"); addrEl.focus(); return; }
      btn.disabled = true; say("Đang tìm vị trí…");
      geocoder.geocode({ address: query }, function (results, status) {
        btn.disabled = false;
        if (status === "OK" && results[0]) {
          var r = results[0];
          setPos(r.geometry.location, true);
          if (r.geometry.viewport) map.fitBounds(r.geometry.viewport);
          if (map.getZoom() > 17) map.setZoom(17);
          say("Đã tìm thấy: " + r.formatted_address + ". Kéo ghim nếu cần chỉnh cho chính xác, rồi bấm Cập nhật / Đăng.", "ok");
        } else if (status === "ZERO_RESULTS") {
          say("Không tìm thấy địa chỉ này. Thử ghi rõ hơn (thêm thành phố, quốc gia) hoặc bấm trực tiếp lên bản đồ.", "error");
        } else {
          say("Không dùng được chức năng tìm vị trí (" + status + "). Kiểm tra API key đã bật Geocoding API chưa, hoặc bấm trực tiếp lên bản đồ để chọn vị trí.", "error");
        }
      });
    }
    btn.addEventListener("click", geocode);
    addrEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); geocode(); } });
  };

  var s = document.createElement("script");
  s.src = "https://maps.googleapis.com/maps/api/js?callback=vlnAdminInit&language=vi&v=weekly" + (CFG.apiKey ? "&key=" + encodeURIComponent(CFG.apiKey) : "");
  s.async = true;
  s.onerror = function () { say("Không tải được Google Maps. Vẫn có thể nhập vĩ độ, kinh độ bằng tay.", "error"); };
  document.head.appendChild(s);
})();
