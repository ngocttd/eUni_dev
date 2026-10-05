ẢNH THƯƠNG HIỆU  (đặt/ghi đè file rồi hard-refresh trình duyệt: Ctrl+Shift+R)

============================================================
1. LOGO — đang dùng ở TẤT CẢ các trang + tab trình duyệt
============================================================
  public/brand/logo-60-nam.png   <-- ĐÂY là logo đang hiển thị
    - Là biểu trưng 60 năm (đã có sẵn trong repo).
    - Muốn đổi logo khác: GHI ĐÈ file này (PNG nền trong suốt, vuông).
    - Header/Footer/Auth/Portal/CMS + favicon đều lấy từ file này.
    - Thiếu file -> fallback SVG "60" (public khỏi vỡ layout).

  public/brand/logo-humg.png     — con dấu tròn HUMG (KHÔNG còn dùng ở header).

============================================================
2. BANNER TRANG CHỦ — ảnh nền khối hero
============================================================
  public/brand/hero-campus.jpg   <-- GHI ĐÈ file này bằng ảnh banner của bạn
    - Ảnh ngang ~2:1 (vd 1920x960).
    - Chữ hero nằm bên trái, đã tự phủ lớp trắng mờ để đọc rõ -> để ảnh nguyên.
    - Thiếu/hỏng file -> hero tự quay về nền gradient (không vỡ layout).
    - Hiện file này đang là ảnh minh hoạ AI -> thay bằng ảnh thật của bạn.

============================================================
3. ẢNH section "Dành cho bạn" (tuỳ chọn)
============================================================
  public/brand/audience/{thi-sinh,sinh-vien,phu-huynh,cuu-sinh-vien,giang-vien,doi-tac}.jpg
  (ảnh ngang ~16:9, vd 640x360; fallback .jpg -> .svg -> nền gradient)
