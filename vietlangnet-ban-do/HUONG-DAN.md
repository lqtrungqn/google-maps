# VIETLANGNET – Bản đồ lớp học (plugin WordPress)

Plugin thêm bản đồ lớp học tiếng Việt toàn cầu vào site WordPress, **không sửa theme**.

## Chức năng

- **Mục "Bản đồ lớp học" trong trang quản trị** (menu bên trái), tách riêng khỏi Bài viết:
  - Danh sách lớp có cột Quốc gia / Thành phố, Khu vực, Liên hệ, **Vị trí** (✓ đã có / chưa có tọa độ), Hiển thị.
  - Tìm theo tên lớp, quốc gia, thành phố, SĐT, email. Lọc theo khu vực.
  - Màn hình thêm / sửa lớp: quốc gia, thành phố, khu vực, mô hình lớp, SĐT, email, website, lịch học, ngôn ngữ giảng dạy, độ tuổi, liên kết tới bài viết giới thiệu.
  - **Vị trí:** nhập địa chỉ → bấm **"Tìm vị trí"**, hoặc bấm lên bản đồ / kéo ghim, hoặc nhập tay vĩ độ, kinh độ (chấp nhận cả dấu phẩy).
  - Ô **"Hiển thị lớp này trên bản đồ"** để tạm ẩn lớp mà không xóa.
- **Trang bản đồ toàn màn hình** tại `/ban-do-lop-hoc/` (đổi được trong Cài đặt), giao diện theo màu VIETLANGNET: tìm kiếm, lọc quốc gia, lọc khu vực, danh sách lớp, popup thông tin, nút Chỉ đường và Xem chi tiết.
- **Shortcode `[vln_ban_do]`** để nhúng bản đồ vào một trang bất kỳ, ví dụ `[vln_ban_do height="600"]`.

## Cài đặt

1. **Sao lưu site trước** (database + thư mục `wp-content`).
2. Vào **Plugins → Add New → Upload Plugin**, chọn file `vietlangnet-ban-do.zip`, bấm **Install Now** rồi **Activate**.
3. Vào **Bản đồ lớp học → Cài đặt**:
   - Dán **Google Maps API key** (cần bật *Maps JavaScript API* và *Geocoding API*; giới hạn key theo tên miền `vietnamese-network.net/*`).
   - Kiểm tra đường dẫn trang bản đồ (mặc định `ban-do-lop-hoc`).
4. Nếu trang bản đồ báo 404: vào **Settings → Permalinks** và bấm **Save Changes** một lần.

## Thêm menu "Bản đồ lớp học" trên header

**Giao diện → Menu** → chọn menu chính → **Liên kết tự tạo**:
- URL: `https://vietnamese-network.net/ban-do-lop-hoc/`
- Tên: `Bản đồ lớp học`

Hoặc sửa link của menu "Bản đồ lớp học tiếng Việt toàn cầu" đang có sang URL trên.

## Ghi chú

- Logo trên trang bản đồ tự lấy từ theme VIETLANGNET (`assets/img/logo.png`); có thể đổi trong Cài đặt.
- Trang bản đồ toàn màn hình không dùng header/footer của theme để bản đồ chiếm trọn màn hình. Các plugin chèn mã vào `wp_head` (ví dụ Google Analytics) sẽ không chạy trên trang này.
- Gỡ plugin: dữ liệu lớp học vẫn còn trong database, cài lại là dùng tiếp.
