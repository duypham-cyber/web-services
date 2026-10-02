# Bluebolt Services — Làm lại lapdattoanquoc.vn theo hướng "Cinematic 3D"

Bản tổng quan cho anh Duy. Chi tiết nằm ở 4 tài liệu bên dưới và thư mục `prototype/`.

| File | Nội dung |
|---|---|
| [01-DANH-GIA-HIEN-TRANG.md](01-DANH-GIA-HIEN-TRANG.md) | Đánh giá site hiện tại: điểm theo hạng mục, lỗi phải sửa ngay, bằng chứng |
| [02-MAU-THAM-KHAO-VA-BENCHMARK.md](02-MAU-THAM-KHAO-VA-BENCHMARK.md) | Mổ xẻ ngôn ngữ máy quay của video mẫu, 4 cấp "3D", benchmark quốc tế |
| [03-DINH-HUONG-THIET-KE-3D.md](03-DINH-HUONG-THIET-KE-3D.md) | Concept "Mỗi lần cuộn là một cú máy": IA, bảng 301, design tokens, storyboard |
| [04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md](04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md) | Kế hoạch G0→G9, giờ Claude Code, CLAUDE.md mẫu, prompt mẫu, NFR, rủi ro |
| [prototype/](prototype/) | Hero chạy được + `demo-desktop.mp4`, `hero-mobile.mp4`, `shots/sheet.jpg` |
| [research/](research/) | Ảnh chụp, Lighthouse, kết quả nghiên cứu, ghi chú của từng agent |

## 1. Kết luận đánh giá

Site hiện tại chọn đúng hướng nhưng làm còn ở mức bản nháp.

**Nên giữ**
- Stack Next.js 16 và khung i18n vi/en, SEO cơ bản (title, hreflang, sitemap).
- Mascot KHANG, palette xanh – cam.
- Cách chia ba nhóm khách: Hãng, Sàn và Thợ.

**Đang làm hại doanh nghiệp, cần sửa ngay**
- **Mất lead:** form "Đăng ký Thợ" ở /system-map bấm gửi không đi đâu. Nhiều nút "Tìm hiểu thêm" không có đích.
- **Tự phá niềm tin:** số thợ ghi 4 kiểu (500+ / 1,500+ / "3000k+" / 460), số tỉnh lúc 63 lúc 34, bảo hành 2 tháng hay 12 tháng, "24/7" mâu thuẫn với giờ làm việc ghi trên site. Footer vẫn ghi `"Procleaning" All Rights Received`.
- **Mobile vỡ:** trang chủ tràn ngang (rộng 527 px trên màn 390 px), không có menu, chữ đè lên bản đồ.
- **Chậm:** trang chủ đã có 3D thật (`<model-viewer>` tải file KHANG 3,7 MB). Đo lab: TBT desktop 36 giây, LCP mobile 5,6 giây. File này nén được xuống 352–628 KB.
- **Hạ tầng:** http không chuyển sang https, chưa có HSTS, `www` trả lỗi 502.

Danh sách sửa nóng (G0, khoảng 27 giờ Claude Code) ở 01 §3. Phần này cần quyền vào repo và server.

## 2. "3D" mà anh muốn

Video TikTok là clip quảng cáo của agency quay site mddecorpro.com. **Chính site đó không có 3D.** Cảm giác 3D đến từ cách quay: mở bằng cảnh rộng chéo góc trong phòng thật, máy đẩy vào và xoay về chính diện cho tới khi màn hình phủ kín khung, rung tay nhẹ, phòng tối, màn hình phát sáng.

Concept mới đưa đúng ngữ pháp này lên web: **người xem cuộn trang là máy quay di chuyển** trong phòng điều phối của Bluebolt. Trên bàn có laptop chạy Dispatch với bản đồ đơn hàng 34 tỉnh, điện thoại mở app Thợ, KHANG đứng cạnh. Máy quay tiến vào màn hình rồi **chuyển hẳn sang trang HTML thật**, nên SEO và tốc độ vẫn dựa trên HTML. Cách trình bày "nền tảng chạy trên thiết bị thật" này là thứ tạo chất "Services" và "quốc tế".

**Prototype đã chạy được** (ảnh bên dưới: `prototype/shots/sheet.jpg`):
- Desktop: cảnh 3D thời gian thực.
- Mobile: video tua theo cuộn, dựng từ chính cảnh 3D đó.
- Người dùng tắt chuyển động: ảnh tĩnh.

![prototype](prototype/shots/sheet.jpg)

**Lưu ý thẳng:** prototype mới chứng minh ý tưởng. Đồ vật dựng bằng khối cơ bản, và khi đo bằng CPU (headless) TBT vẫn ở mức của site cũ. Để đạt chất lượng thương mại cần 3D artist làm lại bộ bàn điều phối, và cần cổng chọn tầng theo GPU thật như mô tả ở 04 §2–3.

## 3. Phương án cho anh chọn bằng mắt

| Phương án | Mô tả | Ghi chú |
|---|---|---|
| **A+ (khuyến nghị)** | Một cú máy dài khoảng 300vh: tiến vào phòng điều phối, giữ khung để website cuộn trên màn hình, rồi chuyển sang trang thật. Bản đồ 34 tỉnh làm ở section 2.5D | Cân bằng giữa "wow" và tốc độ |
| B | A+ cộng một cú crane đi xuống bản đồ 34 tỉnh dạng 3D | Thêm khoảng 10 giờ, nặng hơn |
| Q | Quay thật phòng điều phối, video tua theo cuộn, không dùng WebGL | Không cần 3D artist, phụ thuộc phòng thật có đẹp không |
| C | Chuỗi 6 shot (~740vh) | Không dùng cho trang chủ, chỉ lấy các cú máy cho hero trang con |

## 4. Ước lượng (phương án A+)

| Hạng mục | Con số |
|---|---|
| Giờ build của Claude Code | **≈ 271 giờ** (gồm G0), tương đương khoảng 912 giờ nếu người code |
| Giờ người | ≈ 208 giờ: dev vận hành ~80, anh duyệt ~28, pháp chế ~16, chụp ảnh ~20, biên tập EN ~16. Cộng thêm 50–80 giờ 3D artist |
| Chi phí ngoài (chưa kiểm chứng giá) | 45–120 triệu đồng (3D artist, nhiếp ảnh, EN, pháp chế, máy test). Phương án Q: 40–90 triệu |
| Lịch (bắt đầu 05/10) | Duyệt style frame 16/10 → chọn phương án ~21/10 → contract APPROVED 26/10 → site HTML launch được ở tuần 7 → **launch đầy đủ ~10/12/2026 (tuần 10)** |

Giờ build không phải lịch dự án. **Đường găng nằm ở phần việc người:**
- chốt số liệu và SLA;
- 3D artist dựng lại bộ bàn điều phối;
- chụp ảnh thật;
- xin phép dùng logo hãng;
- duyệt prototype.

Phần build chèn vào khoảng trống giữa các việc này (sơ đồ ở 04 §5).

Cam kết nghiệm thu đo được, chi tiết ở 04 §7:
- Lighthouse mobile ≥ 85, desktop ≥ 90.
- LCP mobile ≤ 2,5 giây.
- Không tràn ngang ở mọi khổ màn hình từ 360 đến 1920 px.
- Đạt tương phản WCAG AA.
- Có đủ bảng 301 cho URL cũ.

## 5. Tám việc anh cần chốt

1. **Phương án phim:** A+, B hay Q (mặc định A+). Có nên quay thử phòng điều phối thật 1–2 giờ để so không?
2. **3D artist:** có thuê không, trần ngân sách bao nhiêu (đề xuất khoảng 50 triệu, xin 2–3 báo giá).
3. **Quyền mascot KHANG:** khi chưa có văn bản về quyền, KHANG không xuất hiện trong cảnh, poster hay ảnh chia sẻ.
4. **Bộ số liệu và cam kết chính thức:** số thợ, 34 tỉnh, bảo hành, 24/7, SLA theo vùng. Câu nào chưa có bằng chứng thì không đưa lên.
5. **Có nhận đơn khách lẻ (B2C) trực tiếp không?** Mặc định CTA chính là "Nhận báo giá cho doanh nghiệp" và "Đăng ký làm đối tác thợ".
6. **Quyền truy cập:** repo, server/openresty, Search Console, access log 90 ngày. Cần ngay tuần 1 để làm G0 và lập bảng 301.
7. **Pháp lý dữ liệu cá nhân và analytics:** form theo Luật BVDLCN, cần pháp chế xác nhận. Mặc định dùng Umami tự host, không cần banner cookie.
8. **Ký phụ lục NFR và lịch launch:** báo trước những ngày cao điểm điện lạnh để tránh cutover vào hôm đó.

Cập nhật: 01/10/2026.
