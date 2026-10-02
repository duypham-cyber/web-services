# 01 — Đánh giá hiện trạng lapdattoanquoc.vn

| | |
|---|---|
| Thương hiệu | Bluebolt Services — Công ty Cổ phần Công nghệ Tia Chớp Xanh |
| Ngày đánh giá | 01/10/2026 |
| Phạm vi | 17 trang × 2 ngôn ngữ (34 URL trong sitemap), desktop 1440 + mobile 390, thêm các breakpoint 768 / 1024 / 1366 / 1920 cho phần tràn ngang |
| Nguồn | `research/research-results.json` (6 agent + critic), `research/agent-notes/**`, `research/lighthouse/*.json`, `research/screenshots/**`, `research/raw/**` |
| Người đọc | Anh Duy (quyết định) · dev vận hành Claude Code (thực thi) |

Mọi đường dẫn bằng chứng là tương đối từ `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/`.

---

## 1. Kết luận

1. **Khung kỹ thuật đúng hướng, thực thi ở mức bản nháp.** Next.js 16 + Tailwind v4 + i18n vi/en + SEO meta đã tốt. Nhưng giao diện là ghép template: 7 phong cách hình ảnh, palette phát sinh, không có font thương hiệu.
2. **Website đang tự phá niềm tin.** Số thợ có 4 con số (500+ / 1,500+ / "3000k+" / 460). Số tỉnh lúc 63 lúc 34. Bảo hành 2 tháng hay 12 tháng. Footer ghi "Procleaning All Rights Received".
3. **Lead đang bị mất.** Form "Đăng ký Thợ" ở /system-map không gửi request nào. Ba nút phân luồng Hãng / Sàn / Thợ trên trang chủ bấm không có tác dụng.
4. **Mobile và tablet vỡ bố cục.** Trang chủ tràn ngang 527 px trên màn 390. Ở 768 px, 9/9 trang đo được đều tràn do thanh nav. Site ĐÃ có 3D thật (`<model-viewer>` + GLB 3,7 MB), nhưng đang là nguồn chính gây chậm, và tải cả ở /intro trên mobile.
5. **Nhiều lỗi sửa được ngay, không cần chờ redesign** (mục 3): khoảng 27,5 giờ Claude Code (gồm 3 giờ làm quen repo). Đường găng không phải code, mà là quyền repo/server và việc anh chốt số liệu, SLA.

### Bảng điểm (thang 10)

6 hạng mục đầu do agent ux-visual chấm. 6 hạng mục sau là điểm tổng hợp của báo cáo này từ số đo của các agent khác.

| Hạng mục | Điểm | Lý do chính | Bằng chứng |
|---|---:|---|---|
| Thẩm mỹ | 5 | Có mascot và palette riêng, nhưng hero chồng 4 lớp (bản đồ, gradient, mascot, chữ), 7 ngôn ngữ thị giác lẫn lộn | `research/screenshots/slices/home--desktop--01.jpg`, `services--desktop--01.jpg`, `worker-map--desktop--01.jpg` |
| Nhất quán | 3,5 | Quy trình có 4 phiên bản, hotline 3 cách viết, palette thêm hồng/vàng/tím, 2 kiểu header | `slices/home--desktop--03.jpg`, `requirement--desktop--02.jpg`, `system-map--desktop--03.jpg` |
| Mobile | 3 | Tràn ngang, mất hamburger ở trang chủ, số liệu chữ trắng đè bản đồ, hero /services trống ~500 px | `research/screenshots/home--mobile-fold.png`, `services--mobile-fold.png` |
| Rõ thông điệp | 5 | Hero "Cần LẮP ĐẶT?" nói với người tiêu dùng, thân trang nói với Hãng; CTA "Đăng ký" không nói đăng ký gì | `slices/home--desktop--01.jpg`, `agent-notes/content-cro/shots/mobile-home-fold.png` |
| Quốc tế | 3 | Bản EN có dịch thật nhưng "Touch Us", sót "Hover để zoom", tên pháp nhân bị dịch, slug bài viết vẫn tiếng Việt | `agent-notes/content-cro/crawl-en.json`, `slices/en--desktop--01.jpg` |
| Premium | 3,5 | VIẾT HOA giữa câu, "?!?", "!!", "Hj! Em là KHANG 🤣", ảnh stock lạc đề, banner núi tuyết | `slices/intro--desktop--02.jpg`, `news--desktop--03.jpg` |
| Hiệu năng | 5 | Trang con desktop đạt 100; trang chủ desktop 60 (TBT 36 s, lab), mobile 73 (LCP 5,6 s); /intro tải GLB 3,7 MB mọi viewport, chưa đo Lighthouse | `research/lighthouse-summary.txt`, `agent-notes/frontend-seo-a11y/overflow-batch1.json` |
| SEO | 6,5 | Title/description/canonical/hreflang/sitemap tốt; thiếu JSON-LD, 2 H1 ở trang chủ, http không redirect, slug EN tiếng Việt | `agent-notes/frontend-seo-a11y/seo-meta-34-pages.json`, `research/raw/home--desktop.json` |
| A11y | 5 | Lighthouse 96 nhưng color-contrast fail mọi lần đo; input không label/name; không focus-visible, không reduced-motion, không skip-link | `research/lighthouse/*.json`, `agent-notes/frontend-seo/overflow-a11y.json` |
| Chuyển đổi | 2,5 | Form thợ chết, CTA chết, một form 4 trường cho mọi nhóm khách, không nút gọi/Zalo cố định trên mobile | `agent-notes/content-cro/verify-ctas.json`, `click-tests-2.json` |
| Độ tin cậy nội dung | 2 | Mâu thuẫn số liệu và cam kết, "Procleaning", "Sẽ cập nhật sau!", tin tuyển trùng mã, ghi "20+ Hãng" mà không có logo nào | mục 4.3 |
| Hạ tầng | 4 | http không sang https, không HSTS, www trả 502, apex chỉ HTTP/1.1, cache asset bị ghi đè; có ISR cache và header bảo mật cơ bản | `research/raw/headers.txt`, critic `reverified` |

---

## 2. Những gì đáng giữ

Các agent đồng thuận giữ những tài sản sau (critic `solid_facts`).

| Tài sản | Vì sao giữ | Cách nâng cấp | Bằng chứng |
|---|---|---|---|
| Mascot KHANG (robot mũ cam) | Nhận diện riêng, đã có nhiều pose, màu cam khớp accent. Là cầu nối tự nhiên cho hướng "3D" | Chuẩn hoá 1 model, 1 rig, 1 bộ ánh sáng; bỏ giọng trẻ con; chỉ xuất hiện ở hero, empty state, CTA | `slices/home--desktop--01.jpg`, `intro--desktop--01.jpg` |
| Palette xanh #004AAD + cam #EF8426, slogan "Nhanh – Chuẩn – Minh bạch" | Đã nhất quán ở logo và phần lớn UI | Token hoá; tách cam làm nền và cam đậm làm chữ để đạt WCAG (mục 4.7) | `slices/home--desktop--01.jpg` |
| Phân khúc Hãng / Sàn TMĐT / Thợ | Đúng mô hình kinh doanh 2 phía | Nâng thành trục IA, mỗi nhóm một landing | `slices/home--desktop--02.jpg` |
| Bản đồ thợ theo tỉnh | Bằng chứng năng lực khác biệt, đúng tinh thần "toàn quốc" | Bản đồ 34 tỉnh tương tác, dữ liệu từ 1 nguồn | `slices/home--desktop--04.jpg`, `services--desktop--03.jpg` |
| Quy trình vận hành | Thể hiện tư duy nền tảng/SLA | Chuẩn hoá còn 1 quy trình B2B + 1 quy trình Thợ (số bước chưa chốt, xem mục 4.3) | `slices/home--desktop--03.jpg` |
| Bảng giá theo vùng (HCM / HN / Tỉnh / Đặc thù) | Minh bạch giá hiếm có trong ngành | Ghi VAT, ngày hiệu lực, lọc theo thiết bị | `slices/prices--desktop--02.jpg` |
| Tiêu chuẩn thợ 4 nhóm, viện dẫn TCVN 5687:2024, QCVN 25:2025/BKHCN | Tạo độ tin chuyên môn cho B2B | Trình bày thành "Bluebolt Technician Standard". Trích dẫn TCVN/QCVN chưa kiểm chứng | `slices/worker-map--desktop--02.jpg` |
| Template bài viết 7 bước | Trang thiết kế tốt nhất site | Đổi marker tím sang xanh, bỏ justify trên mobile, thêm schema Article | `slices/news__lap-dat-may-lanh-dung-cach-7-buoc--desktop--01.jpg` → `--04.jpg` |
| Video Bluebolt x Panasonic, ảnh thợ mặc đồng phục | Bằng chứng xã hội thật duy nhất hiện có | Đưa lên trang chủ (chờ xác nhận quyền dùng) | `slices/news--desktop--01.jpg` |
| Ảnh app điều phối (dashboard) | Chứng minh Bluebolt là nền tảng công nghệ | Mockup độ phân giải cao, chú thích tính năng | `slices/services--desktop--04.jpg` |
| Chính sách 4 phần (Chung, Khách, Thợ, Hãng) | Nội dung chi tiết, là nguồn cho SLA chuẩn | Tách ra URL riêng, đồng bộ với các trang | `agent-notes/content-cro/policy-vi-parts.json` |
| Khung kỹ thuật | Xem mục 5 | | |

---

## 3. Lỗi phải sửa NGAY trên site hiện tại

Áp dụng kể cả khi chưa redesign. Đây là sửa lỗi trong phạm vi đã có, nên không cần CR. Riêng việc **nối form vào API mới** là tính năng động: theo quy trình phải có `/contract` APPROVED, nên phương án sửa nóng dưới đây chọn gỡ form hoặc chuyển hướng sang luồng đang chạy được.

**Điều kiện tiên quyết (giả định, chờ anh xác nhận):** bên mình có repo source, quyền deploy và quyền sửa cấu hình openresty của site. Critic ghi đây là câu hỏi mở. Nếu chưa có quyền, mọi giờ bên dưới chưa bắt đầu được.

Cách tính giờ: Claude Code là tay code. Hệ số nén so với người: nội dung/dữ liệu ~10×, trang lặp khuôn ~5×, logic mới ~3×, chạm thế giới thật (deploy, openresty, test máy thật, Safari/iOS, asset) ~1,5×, vòng duyệt với anh ~1×.

| # | Lỗi | Bằng chứng | Cách sửa nóng | Loại việc | Giờ Claude Code | Việc người cần |
|---|---|---|---|---|---:|---|
| H1 | **Lead thợ bị mất:** form "Đăng ký Thợ" ở /system-map không phát request, không báo gì. Các trường không nằm trong `<form>`, không có `name` | `agent-notes/content-cro/verify-ctas.json` (`systemMapSubmit.posts = []`), `shots/system-map-filled-submit.png` | Gỡ form, thay bằng nút mở modal ứng tuyển ở /requirement + hotline/Zalo. Gửi 1 lead thử có đánh dấu qua form liên hệ và modal ứng tuyển để xác nhận đích đến | Thế giới thật | 2 | Anh cho biết lead đi về đâu (email/CRM/sheet), cho phép gửi lead thử |
| H2 | **Footer sai thương hiệu:** "2024 'Procleaning' All Rights Received", chi nhánh "Sẽ cập nhật sau!", tên pháp nhân bản EN bị dịch thành "BLUE LIGHTNING TECHNOLOGY JSC" | `slices/home--desktop--06.jpg`, `en--desktop--06.jpg`, `research/raw/home.txt` | Sửa dòng copyright (2 đề xuất đang lệch nhau, xem dưới bảng), ẩn mục chi nhánh, giữ tên pháp lý tiếng Việt ở bản EN | Nội dung | 0,5 | Anh chốt dòng copyright |
| H3 | **CTA chết:** 3 nút "Tìm hiểu thêm →" (Hãng/Sàn/Thợ), "Tất cả →", "…giải quyết như thế nào →", "Trở thành thợ", "Tìm thợ gần nhất" (thẻ `<span>`), 4 icon mạng xã hội không có `<a>`, link "Chính sách" `href="#"` | `agent-notes/content-cro/click-tests-2.json`, `verify-ctas.json`, `shots/dead-*.png` | Trỏ 3 thẻ tới trang hiện có gần nhất (/services, /requirement), "Chính sách" trỏ tới accordion ở /prices, gỡ icon MXH chưa có kênh, bỏ chữ "Tìm thợ gần nhất" | Lặp khuôn | 1,5 | Anh cho biết kênh MXH / Zalo OA thật |
| H4 | **Tràn ngang:** / và /en 390 → 527 px; /services 1366 → 1428, 1440 → ~1465; **768 px: 9/9 trang đo được tràn (990–1000 px) do khối hotline trên nav**; /worker-map 1024 → 1068 | `agent-notes/frontend-seo/overflow-a11y.json`, `agent-notes/frontend-seo-a11y/overflow-batch3.json`, `overflow-batch4.json`, `overflow-tablet-nav-crop.jpg`, `overflow-worker-map-1024-crop.jpg` | Khối bản đồ `w-[664px] shrink-0` → `w-full max-w-[664px] aspect-[664/685]`; `overflow-x-clip` cho section có mascot absolute; ẩn hotline nav dưới `lg`; `body{overflow-x:clip}` làm lưới an toàn. Chạy lại `overflow.mjs` ở 360/390/414/768/1024/1280/1366/1440/1920 × 34 URL | Thế giới thật | 4 | — |
| H5 | **Hạ tầng:** http:// trả 200 (không 301), không HSTS, https://www trả 502, apex chỉ HTTP/1.1 (www đã đàm phán được h2), `/_next/static` bị ghi đè `max-age≈52.000 s`, GLB cache 1 ngày | `research/raw/headers.txt`, critic `reverified` (hạ tầng), `research-results.json` → tech-seo SEC-01, PERF-04 | openresty: 301 cổng 80 → https; 301 www → apex; `listen 443 ssl http2` cho apex; HSTS bắt đầu max-age ngắn rồi nâng ≥ 1 năm; bỏ `expires` ở `/_next/static` để Next trả `immutable` | Thế giới thật | 2,5 | Quyền server, kiểm DNS/chứng chỉ cho www |
| H6 | **GLB 3,7 MB ở / (desktop) và /intro (mọi viewport):** 417.618 tam giác, auto-rotate liên tục, không tôn trọng reduced-motion. Chặn model-viewer thì blocking về 0 | `agent-notes/frontend-seo-a11y/longtask-model-viewer.txt`, `overflow-batch1.json` (/intro 390 tải 3.565 KB), `agent-notes/webgl-architect/r3d-measurements.json` | Ngắn hạn: chỉ hiện poster `khang-3d-poster.webp` trên mobile/tablet và khi `prefers-reduced-motion`; desktop thay bằng GLB đã tối ưu (628 KB / 62,6k tam giác), dừng render khi ra khỏi viewport. Đo lại Lighthouse cả / và /intro | Thế giới thật | 3 | — |
| H7 | **STK ngân hàng công khai trên footer mọi trang** (ACB 93110788), trong khi chính sách nói khách trả tiền tại chỗ cho thợ: dễ bị giả mạo yêu cầu chuyển khoản | `slices/home--desktop--06.jpg`, `home--mobile--11.jpg`, `agent-notes/content-cro/policy-vi-parts.json` | Gỡ STK khỏi footer (đưa vào hợp đồng/hoá đơn B2B), thêm câu cảnh báo "Bluebolt không yêu cầu chuyển khoản cá nhân cho thợ" | Nội dung | 0,5 | Anh đồng ý gỡ |
| H8 | **Cam kết công khai tự mâu thuẫn:** bảo hành 12 tháng (bài viết) vs 02 tháng (chính sách); "24/7" vs CN/Lễ không nhận đơn; "thợ đến trong 24h" vs tối đa 48h; "63 tỉnh" | Mục 4.3 | Ngắn hạn: gỡ con số và câu cam kết chưa chắc, tạm theo chính sách hiện hành; gom số liệu về 1 file config dùng chung 2 ngôn ngữ | Nội dung | 1,5 | **Anh chốt bộ số liệu + SLA** (câu hỏi mở, xem mục 4.3) |
| H9 | **Cookie `NEXT_LOCALE=en` đổi URL tiếng Việt sang /en** (307): link chia sẻ qua Zalo/quảng cáo mở ra bản tiếng Anh | `research-results.json` → content-conversion CRO-13, critic `reverified` | URL không tiền tố luôn hiển thị tiếng Việt; cookie chỉ dùng để gợi ý ngôn ngữ | Logic | 1,5 | — |
| H10 | **Placeholder lên production:** bản đồ wireframe "Bản đồ Việt Nam" ở /system-map, khung bản đồ trống ở /contact, 6 tin tuyển cùng mã BBSV0924561 "hết hạn", "Hover để zoom" chưa dịch, menu EN "Touch Us" | `slices/system-map--desktop--02.jpg`, `contact--desktop--01.jpg`, `requirement--desktop--01.jpg`, `en--desktop--01.jpg` | Ẩn placeholder, hiện địa chỉ text + nút "Mở Google Maps", sửa mã/ngày tin tuyển, sửa chuỗi EN | Nội dung + lặp khuôn | 1,5 | Danh sách tin tuyển thật |
| H11 | **Không có chính sách bảo mật ở URL riêng**, trong khi form thu ngày sinh, địa chỉ, và quy trình E-KYC yêu cầu CCCD | `agent-notes/content-cro/apply-modal.json`, `policy-vi.json`; content-conversion CRO-10 | Soạn bản nháp chính sách xử lý dữ liệu cá nhân, đặt URL riêng, câu đồng ý dưới form link tới đó. **Không publish khi pháp chế chưa duyệt** | Nội dung | 1,5 | Pháp chế duyệt |
| H12 | **LCP mobile trang chủ 5,6 s:** ảnh trang trí opacity-30 là phần tử LCP; HTML preload 4 ảnh, gồm SVG bản đồ 1,2 MB và ảnh cuối trang | `research/lighthouse/home-mobile.json`; tech-seo FE-02 | Chỉ preload 1 ảnh hero; bỏ preload SVG và `contact-section.jpg`; ảnh trang trí lazy | Logic | 1,5 | — |
| — | Làm quen repo site cũ (chưa từng thấy), dựng môi trường build giống production | — | Đọc cấu trúc, chạy build/start local ở 127.0.0.1 | Thế giới thật | 3 | Quyền repo |
| — | Deploy, smoke test, chạy lại Lighthouse + tràn ngang, test Safari/iOS thật | — | Branch `hotfix/production-<slug>`, PR vào `main` và cherry-pick sang `develop` | Thế giới thật | 2 | Máy iPhone thật để test |
| — | Duyệt kết quả với anh Duy | — | Demo trước/sau trên staging hoặc production | Duyệt | 1 | 1 buổi duyệt |
| | **Tổng** | | | | **≈ 27,5 giờ** | |

Ghi chú:
- **Dòng copyright đang có 2 đề xuất lệch nhau** (critic `contradictions`): "© 2026 Bluebolt Services. All rights reserved." và "© 2026 Công ty Cổ phần Công nghệ Tia Chớp Xanh (Bluebolt Services). Bảo lưu mọi quyền." Anh chọn một.
- **Tỷ lệ build : việc người.** Claude Code khoảng 27,5 giờ. Việc người gồm cấp quyền, chốt số liệu/SLA, xác nhận đích lead, duyệt chính sách, tổng khoảng 6–10 giờ công (ước lượng). Lịch thực tế phụ thuộc phần người: nếu có quyền repo/server ngay thì H2–H7, H9, H10, H12 xong trong 2–3 ngày làm việc. H8 và H11 chờ anh và pháp chế.
- Thứ tự đề xuất: H1 → H2 → H7 → H5 → H4 → H6 → H3 → H8 → các mục còn lại.

---

## 4. Đánh giá chi tiết

### 4.1 UX/UI và art direction

| Vấn đề | Mức | Bằng chứng |
|---|---|---|
| Ít nhất 7 ngôn ngữ thị giác lẫn lộn: mascot chibi 3D, thợ 3D hoạt hình, nhà isometric, ảnh stock phương Tây (gia đình + robot, cô gái headset vs robot), banner núi Himalaya "Exclusive AIR CONDITIONER", bản đồ hành chính nhiều màu, emoji | Cao | `slices/home--desktop--02.jpg`, `news--desktop--03.jpg`, `worker-map--desktop--01.jpg` |
| Hero desktop chồng chéo: mascot đè chữ "LẮP ĐẶT TOÀN QUỐC"; 2 tiêu đề lớn ("Cần LẮP ĐẶT?" và "BLUEBOLT SERVICES") tranh tiêu điểm; bản EN chữ "INSTALLATION?" chạm mũ mascot | Trung bình | `slices/home--desktop--01.jpg`, `en--desktop--01.jpg` |
| Palette phân mảnh: badge hồng #ff69b4, vàng đất #d3b861, 4 pill 4 màu, marker bước tím | Cao | `slices/services--desktop--05.jpg`, `news__lap-dat-may-lanh-dung-cach-7-buoc--desktop--02.jpg` |
| Không có typeface thương hiệu: class khai báo "Be Vietnam Pro" nhưng không có `@font-face`, nên chỉ hiện nếu máy đã cài; thực tế là font hệ thống | Cao | tech-seo `stack_detected`; critic `contradictions` (font) |
| Lạm dụng VIẾT HOA và dấu câu: "Cước phí CẠNH TRANH", "Vấn đề ở đâu?!?" (trang có lỗi chính tả "Vần đề"), "An toàn - Tiết kiệm - Yên tâm!!" | Cao | `slices/home--desktop--03.jpg`, `research/raw/home.txt` |
| Section "Ưu điểm" 6 ô xanh chỉ có icon + 2–3 chữ; trên mobile chiếm khoảng 6 màn hình | Trung bình | `slices/home--mobile--04.jpg`, `home--mobile--05.jpg` |
| Widget nổi bên phải (Products / Hotline / Worker Map) đè nội dung, nhãn ~8 px, nút "Products" gần như vô hình | Trung bình | `slices/services--desktop--01.jpg`, `contact--desktop--01.jpg` |
| Card "Giải pháp": bullet chữ trắng đè lên ảnh 3D | Trung bình | `slices/home--desktop--02.jpg` |
| Trang /intro mỏng (khoảng 337 từ), giọng mascot quá trẻ con cho B2B | Trung bình | `slices/intro--desktop--01.jpg`, `intro--desktop--02.jpg` |
| Ba trang tuyển thợ trùng lặp, tên route không khớp nội dung: /worker-map là tiêu chuẩn thợ (không có bản đồ), /system-map là form thợ + bản đồ placeholder (không có trong menu), /requirement là tin tuyển | Cao | `research/raw/system-map--desktop.json`, `worker-map--desktop.json` |
| "3D" hiện tại: chỉ 1 mascot `<model-viewer>` xoay tròn ở home desktop và /intro, không có motion system. Phần lớn cảm giác "3D" đến từ ảnh render tĩnh | — | critic `reverified`; `agent-notes/frontend-seo-a11y/longtask-model-viewer.txt` |

### 4.2 Mobile và responsive

| Vấn đề | Bằng chứng |
|---|---|
| Trang chủ và /en tràn ngang 527 px trên màn 390 (critic đo lại). Một lần đo khác ghi 650 px, nên con số dao động theo trạng thái tải; bản chất lỗi giống nhau | `agent-notes/frontend-seo/home-mobile-overflow.png`, `agent-notes/frontend-seo-a11y/overflow-home-services.json` |
| Header trang chủ mobile không có hamburger, chỉ có nút "Đăng ký" + ô tìm kiếm; trang con lại có hamburger. Có 2 ô tìm kiếm | `research/screenshots/home--mobile-fold.png`, `slices/intro--mobile--01.jpg` |
| Hero mobile: số liệu "500+ / 1,500+ / 34" chữ trắng trên bản đồ sáng; "QUỐC", "MINH BẠCH" bị cắt; hotline bị cắt ở đáy | `research/screenshots/home--mobile-fold.png`, `slices/en--mobile--01.jpg` |
| Hero /services mobile là khoảng trắng ~500 px | `research/screenshots/services--mobile-fold.png` |
| Ở 768 px (tablet), cả 9 trang đo được tràn 990–1000 px, gốc là `div.flex.items-center.gap-5.pl-10` (khối hotline "0902 8080 49") trong `nav.hidden.md:flex`. Chưa agent nào đưa vào báo cáo chính | `agent-notes/frontend-seo-a11y/overflow-batch3.json`, `overflow-batch4.json`, `overflow-tablet-nav-crop.jpg` |
| Bản đồ hành chính mobile: nhãn 6–8 px không đọc được; "Hover để zoom" vô nghĩa trên cảm ứng | `slices/home--mobile--06.jpg`, `home--mobile--07.jpg` |
| Không có nút gọi/Zalo cố định; link `tel:` của hotline bị ẩn trên mobile | `agent-notes/content-cro/click-tests-2.json` (`fixed=[]`, `Hotline vis=false`) |
| Trang quá dài, lặp khối: home 12.890 px, /services 11.814 px; 2 CTA liền nhau trước footer | `research/raw/home--mobile.json`, `slices/services--mobile--08.jpg` |
| Footer mobile dài khoảng 2 màn hình | `slices/home--mobile--11.jpg` |

Bối cảnh: mobile chiếm 60,47% lưu lượng web tại VN (StatCounter 03/2026, tech-3d `facts`). Đây là số liệu thị trường, chưa phải số của chính site.

### 4.3 Nội dung và mâu thuẫn số liệu

| Hạng mục | Các giá trị đang hiển thị | Nơi xuất hiện | Bằng chứng |
|---|---|---|---|
| Số thợ | 500+ · 1,500+ (cùng nhãn "Thợ chuyên nghiệp") · "Gồm 3000k + Thợ" (EN "3,000+") · Bắc 120+ / Trung 80+ / Nam 200+ / Mekong 60+ = 460 | /, /system-map, /en | `slices/home--desktop--01.jpg`, `home--desktop--04.jpg`, `system-map--desktop--02.jpg` |
| Số tỉnh | 63 và 34 (cả trong alt ảnh "63 tỉnh thành") | /, /intro, /services, /en | `slices/home--desktop--02.jpg`, `intro--desktop--01.jpg` |
| Số vùng | 3 miền và 4 vùng ("Mekong" viết tiếng Anh trên trang Việt) | /services, /worker-map, /system-map | `research/raw/system-map.txt` |
| Bảo hành lắp đặt | 02 tháng (chính sách) · "12 tháng" (bài viết) · "dài hạn" (/services) | /prices, /news/…7-buoc, /services | `agent-notes/content-cro/policy-vi-parts.json`, `research/raw/news__lap-dat-may-lanh-dung-cach-7-buoc.txt` |
| Giờ phục vụ | "24/7 – Từ T2 → CN" · 9:00–18:00 T2–T6 · nhận đơn T2–T6 đến 16:30, T7 đến 12:00, CN/Lễ không nhận | footer, /contact, chính sách | `slices/home--desktop--06.jpg`, `contact--desktop--01.jpg` |
| Thời gian đến | "trong 24h" · xác nhận 60 phút, xử lý 24–48h · tối đa 48h, 24h nội thành HN/HCM, 36h ngoại thành | /, /services, chính sách | `research/raw/home.txt`, `services.txt` |
| Quy trình | 4 phiên bản (thứ tự "xác nhận lịch" và "điều phối thợ" đảo nhau; /system-map có bước "khách thanh toán tiền mặt") | /, /requirement, /system-map, /worker-map | `slices/home--desktop--03.jpg`, `requirement--desktop--02.jpg`, `system-map--desktop--03.jpg` |
| Kinh nghiệm thợ | Tối thiểu 2 năm · 1–2 năm, có học việc · form có lựa chọn "Dưới 1 năm" | /system-map, /worker-map | `research/raw/worker-map.txt` |
| Cách trả tiền thợ | Hoa hồng chuyển khoản hàng tuần · thanh toán định kỳ · phụ phí trừ vào ví Top-up | /worker-map, /requirement, chính sách | `policy-vi-parts.json` Phần 3 |
| Hotline | 0902 8080 49 · 0902.808.049 · 0902 808 049 | header, footer, /contact | `slices/home--desktop--01.jpg`, `home--desktop--06.jpg` |
| Tagline EN | FAST - RELIABLE - TRANSPARENT · FAST - PRECISE - TRANSPARENT | /en, /en/system-map | `agent-notes/content-cro/pages/en.txt` |
| Vật tư & VAT | "Không bán vật tư" nhưng tiêu đề "Bảng giá Vật Tư … 2026"; chính sách: BBSV không xuất hoá đơn vật tư; trang chủ: "Hợp lệ hoá chi phí VAT/TNCN" | /prices, / | `agent-notes/content-cro/prices-interactive.json` |
| Số dịch vụ | Số "5" cạnh danh sách 4 thẻ; thẻ "Robot hút bụi" mô tả sai | /services | `research/raw/services.txt` |

Các lỗi nội dung khác:
- **Bảng giá:** chỉ 6 dòng vật tư (ống đồng, dây điện); tab "Bảng giá Dịch vụ" để trống. Người tiêu dùng không thấy giá công lắp (`agent-notes/content-cro/prices-interactive.json`, `shots/prices-dichvu.png`).
- **Tin tức:** 8 bài, đều đăng từ 05/04 đến 26/04/2026, không có bài mới khoảng 5 tháng. 3 bài lạc đề hoặc trùng chủ đề (AI/việc làm, 2 bài robot). Mục "Truyền thông | Báo chí" trống. Ghi "8 phút đọc" cho bài khoảng 704 từ (`agent-notes/content-cro/crawl-vi.json`).
- **Bằng chứng xã hội:** ghi "Đối tác Hãng 20+" nhưng không có logo, case study, testimonial, chứng nhận nào (`crawl-vi.json` mục `imgs`).

**Câu hỏi mở cho anh (critic `questions_for_owner`), báo cáo này không tự trả lời:**
- Bộ số liệu chính thức là gì, theo định nghĩa nào và ngày cập nhật nào (thợ đang hoạt động / đã đăng ký, số tỉnh có thợ, số đơn/năm, số hãng)? Có số thợ theo từng tỉnh không?
- SLA và bảo hành chuẩn: giờ hotline, giờ nhận đơn, CN/Lễ có nhận không, thời gian đến theo vùng, bảo hành 2 hay 12 tháng, có trực 24/7 thật không?
- Số bước quy trình chuẩn: các agent đề xuất 4, 6 hoặc 7 bước, chưa thống nhất.

### 4.4 Chuyển đổi theo 4 nhóm khách

| Nhóm | Hành trình hiện tại | Lỗ hổng chính | Cần có (khi redesign) |
|---|---|---|---|
| (a) Hãng điện máy / điện lạnh | Trang chủ → thẻ "Hãng" → nút "Tìm hiểu thêm" chết → chỉ còn modal hợp tác hoặc /contact | Không có landing riêng; số liệu năng lực mâu thuẫn; không logo, case study, SLA đo được; form thiếu sản lượng, khu vực, ngành hàng; placeholder email "@gmail.com" | Landing B2B có bản đồ phủ, bảng SLA theo vùng, đối soát + VAT, case study, CTA "Đặt lịch demo", hồ sơ năng lực PDF |
| (b) Sàn TMĐT / Retail | Thẻ "Sàn TMĐT" → nút chết → form chung | Không có nội dung về tích hợp (API, webhook trạng thái); cam kết 24h ngược chính sách; không có giá theo nhóm thiết bị | Landing có sơ đồ tích hợp, bảng giá công lắp, trang tra cứu đơn/bảo hành cho khách cuối |
| (c) Thợ kỹ thuật | 4 lối vào rời rạc: nút "Trở thành thợ" (chết) → /requirement (modal ~29 trường) → /worker-map → /system-map (form chết) | Không có thu nhập tham khảo; ví Top-up và khung phạt chỉ nằm trong accordion ở trang Bảng giá; tin tuyển trông giả; không có link tải app | Một trang đối tác thợ: thu nhập, phí, chu kỳ thanh toán, E-KYC, FAQ; form 4 trường; màn hình cảm ơn |
| (d) Người tiêu dùng | Google/bài viết → CTA hotline hoặc form chung dưới tiêu đề "ĐỒNG HÀNH CÙNG HÃNG" → /prices (không có giá công lắp) | Không rõ Bluebolt có nhận đơn trực tiếp không; không form đặt lịch, không Zalo, không nút gọi cố định; không có trang tra cứu/đăng ký bảo hành dù chính sách yêu cầu đăng ký trong 7 ngày qua website | Phụ thuộc quyết định B2C (câu hỏi mở bên dưới) |

Bằng chứng: `research-results.json` → content-conversion `audiences`; `agent-notes/content-cro/partner-modal.json`, `apply-modal.json`, `click-tests.json`.

Form liên hệ chung: 4 trường chỉ có placeholder, `name` rỗng, `novalidate`; SĐT "abc" vẫn được POST tới `/api/contact`; chống spam chỉ có honeypot `website`; rate-limit phía server chưa kiểm chứng (`click-tests.json`, `shots/contact-bad-submit.png`).

**Câu hỏi mở cho anh:** Bluebolt có nhận đơn trực tiếp từ người tiêu dùng (B2C) không, hay chỉ phục vụ khách của Hãng/Sàn? Chính sách hiện ghi đơn đến từ Hãng/Sàn, trang chủ lại hỏi "Cần LẮP ĐẶT?". Các agent mâu thuẫn ở điểm này (critic `contradictions`). Câu trả lời quyết định hero, form đặt lịch và trang giá.

### 4.5 Kỹ thuật và hiệu năng

**Stack đo được:** Next.js 16.3.4 App Router (Turbopack), Tailwind v4, i18n vi/en qua middleware, sau openresty, ISR `x-nextjs-cache: HIT`. `<model-viewer>` 4.0.0 vẽ WebGL trong shadow DOM (vì vậy một số công cụ quét đếm ra 0 canvas). Google Maps JS ở /contact.

**Lighthouse (lab data).** Lighthouse 12.8.2, chế độ simulate, chạy headless trên máy bbsw, WebGL render bằng CPU (SwiftShader). Đây **không** phải số đo người dùng thật và không dùng làm cam kết với khách. Nguồn: `research/lighthouse-summary.txt`, `research/lighthouse/*.json`.

| Trang | Chế độ | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | Dung lượng |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| / | mobile | 73 | 96 | 100 | 100 | 1,3 s | **5,6 s** | 290 ms | 0,001 | 1.294 KiB |
| / | desktop | **60** | 96 | 100 | 100 | 0,3 s | 1,2 s | **36.430 ms** | 0 | **4.583 KiB** |
| /services | mobile | 97 | 96 | 100 | 100 | 1,1 s | 2,4 s | 90 ms | 0 | 473 KiB |
| /services | desktop | 100 | 96 | 100 | 100 | 0,3 s | 0,6 s | 0 ms | 0 | 682 KiB |
| /contact | mobile | 86 | 96 | 100 | 100 | 1,1 s | 2,7 s | 430 ms | 0 | 935 KiB |
| /contact | desktop | 100 | 96 | 100 | 100 | 0,3 s | 0,7 s | 0 ms | 0 | 1.373 KiB |
| /prices | mobile | 96 | 96 | 100 | 100 | 1,1 s | 2,7 s | 100 ms | 0 | 360 KiB |
| /prices | desktop | 100 | 96 | 100 | 100 | 0,3 s | 0,6 s | 0 ms | 0 | 489 KiB |
| /news | mobile | 90 | 96 | 100 | 100 | 1,1 s | **3,6 s** | 90 ms | 0 | 568 KiB |
| /news | desktop | 100 | 96 | 100 | 100 | 0,3 s | 0,7 s | 0 ms | 0 | 826 KiB |
| /worker-map | mobile | 95 | 96 | 100 | 100 | 1,1 s | 2,6 s | 180 ms | 0 | 744 KiB |
| /worker-map | desktop | 100 | 96 | 100 | 100 | 0,3 s | 0,6 s | 0 ms | 0 | 936 KiB |

Đọc bảng:
- **TBT 36 s ở home desktop do model-viewer, không phải bộ đếm số.** Khi chặn model-viewer + GLB, blocking về 0 ms. Khi cuộn để model ra khỏi màn hình, cũng 0 ms. Khi bật reduced-motion vẫn 8.341 ms, tức model-viewer không tôn trọng reduced-motion (`agent-notes/frontend-seo-a11y/longtask-model-viewer.txt`; critic đã phân xử mâu thuẫn này). Mức ảnh hưởng trên GPU thật chưa đo.
- **GLB:** `/models/khang-3d.glb` 3.702.548 byte, 1 mesh, 417.618 tam giác, 4 texture 2048², không rig/animation. Tối ưu thử bằng gltf-transform còn 628 KB (62,6k tam giác) hoặc 352 KB (25k tam giác) (`agent-notes/webgl-architect/r3d-measurements.json`, `r3d-glb-original.png`, `r3d-glb-opt15.png`, `r3d-glb-opt06.png`).
- **/intro chưa được đo Lighthouse**, nhưng tải GLB ở mọi viewport (390: tổng 3.565 KB; 768: 3.655 KB) (`agent-notes/frontend-seo-a11y/overflow-batch1.json`, `overflow-batch4.json`).
- **LCP mobile trang chủ 5,6 s:** phần tử LCP là ảnh trang trí opacity-30; Load Delay 2.971 ms; HTML preload 4 ảnh, gồm `vn-map-workers.svg` 1,2 MB và ảnh cuối trang. Trên mobile vẫn tải `system-power-circle.webp` ở `w=3840`.
- **Tài nguyên nặng:** `og-cover.jpg` 1,34 MB dùng chung cho mọi trang (Zalo/Messenger có thể không hiện thumbnail); Google Maps JS ~264 KiB không dùng, chặn main thread 260 ms ở /contact mobile (`research/lighthouse/contact-mobile.json`).
- **Ảnh gốc trong repo rất nặng** (`news-card5.jpg` 9,3 MB, `contact-bg-figma.jpg` 8,0 MB, `intro-hero.jpg` 4,3 MB…). Chúng đi qua `/_next/image` nên người xem nhận WebP nhỏ hơn, nhưng AVIF chưa bật (`agent-notes/frontend-seo-a11y/image-original-sizes.txt`).
- **Trang chủ render 2 DOM** riêng cho desktop và mobile: nhân đôi heading và ảnh (86 `img`, DOM 864 phần tử).
- Polyfill legacy JS 13 KiB mọi trang; source map lỗi ở home desktop.

### 4.6 SEO

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Title, meta description riêng từng trang (vi/en) | Đạt | Title bài viết VIẾT HOA và dài > 60 ký tự |
| Canonical, hreflang vi/en/x-default | Đạt | Truy cập qua http:// thì Link header phát hreflang http:// |
| Sitemap | Một phần | 34 URL, chỉ 16/34 có `lastmod` |
| robots.txt | Một phần | Có dòng `Host:` không chuẩn (`research/raw/robots.txt`) |
| H1 | Không đạt | Trang chủ 2 H1 "Cần LẮP ĐẶT?"; /worker-map không có H1; H1 /requirement bị cắt câu |
| JSON-LD | Không đạt | 0/13 trang có `application/ld+json` |
| Slug EN | Không đạt | 8 bài `/en/news/*` vẫn slug tiếng Việt; /requirement, /worker-map, /system-map lệch nghĩa nội dung |
| HTTPS + HSTS | Không đạt | http trả 200, có rủi ro trùng lặp nội dung; www 502 |
| Open Graph | Một phần | og-cover 1,34 MB dùng chung |
| apple-touch-icon, manifest | Không đạt | Cả hai 404 |
| Google Business Profile | Chưa kiểm chứng | Website không liên kết GBP |

Nguồn: `research-results.json` → tech-seo-perf-a11y `seo_checklist`; `agent-notes/frontend-seo-a11y/seo-meta-34-pages.json`.

Cấu trúc URL: các agent khuyên giữ URL cũ hoặc 301 đầy đủ, nhưng đồng thời đề xuất IA mới đổi slug. Chưa ai lập bảng 301. Đổi slug hay giữ, dùng slug có dấu hay không dấu, bản EN có slug riêng không: đây là **câu hỏi mở cho anh**. Chưa có dữ liệu traffic và thứ hạng để định lượng rủi ro mất SEO.

### 4.7 Accessibility

Lighthouse a11y 96 trên mọi trang đã đo. Con số này **đánh giá cao hơn thực tế**, vì audit tự động không bắt được nhiều lỗi dưới đây.

| Vấn đề | Bằng chứng |
|---|---|
| Color-contrast fail trên cả 12 lần đo. Gốc là cam #EF8426: 2,62:1 trên trắng, trượt cả ngưỡng 3:1 cho chữ lớn. Chip #DEAB5B 2,08:1; chữ #829fc7 trên #d8d7d8 1,89:1; chữ trắng trên #6EB4FF 2,01:1 | `research/lighthouse/*.json` |
| Input form không có `<label>`, không `name`, không `aria-label`, chỉ có placeholder | `agent-notes/frontend-seo/overflow-a11y.json` |
| 0 rule `prefers-reduced-motion`, 0 `:focus-visible`, 4 `outline:none`, 14 keyframes chạy liên tục | tech-seo A11Y-03 (`site.css`) |
| Không có skip-link. Trang chủ không có `<header>`, /worker-map có 5 `<header>`. Phần tử `MODEL-VIEWER` nhận focus đầu tiên với outline none | tech-seo A11Y-03 |
| Chưa test trình đọc màn hình, điều hướng bàn phím đầy đủ, Safari/iOS | critic `gaps` |

**Mâu thuẫn chưa chốt về nút cam** (critic `contradictions`). ux-visual đề xuất nút nền cam, chữ trắng đậm, chữ cam đậm khoảng #C2600F. tech-seo chỉ ra chữ trắng trên #EF8426 chỉ đạt 2,62:1 nên đề xuất nút cam dùng chữ navy, chữ cam đậm khoảng #B85A00. Sẽ chốt khi dựng design system, kiểm bằng công cụ contrast.

### 4.8 Bảo mật và hạ tầng

| Hạng mục | Hiện trạng | Bằng chứng |
|---|---|---|
| Redirect http → https | Không có (http trả 200) | critic `reverified` |
| HSTS | Không có | `research/raw/headers.txt` |
| www.lapdattoanquoc.vn | Trả 502 (đã đàm phán được HTTP/2) | critic `reverified` |
| HTTP/2 ở apex | Chưa bật (chỉ 1.1). openresty hỗ trợ h2, chỉ server block apex chưa bật | critic `contradictions` (đã đo lại) |
| Header bảo mật | Có X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options; CSP chỉ có `frame-ancestors`, `object-src`, `base-uri` | `research/raw/headers.txt` |
| `X-Powered-By: Next.js` | Đang lộ, nên tắt | `research/raw/headers.txt` |
| Cache asset | `/_next/static` bị openresty ghi đè ~14 giờ thay vì immutable 1 năm; GLB `max-age=86400` | tech-seo PERF-04 |
| Chống spam form | Chỉ honeypot; SĐT không kiểm tra; rate-limit chưa kiểm chứng | `agent-notes/content-cro/click-tests.json` |
| STK ngân hàng công khai | Có, mọi trang | H7 |
| Đánh giá bảo mật đầy đủ | Chưa làm. Theo quy trình công ty, `/security` bắt buộc trước go-live của bản mới | critic `gaps` |

### 4.9 Pháp lý

Phần này nêu rủi ro, **chưa có xác nhận của pháp chế**. Các agent đều ghi "chưa kiểm chứng" ở mặt điều khoản cụ thể.

| Vấn đề | Hiện trạng | Việc cần làm |
|---|---|---|
| Dữ liệu cá nhân (Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, hiệu lực 01/01/2026, và nghị định hướng dẫn thay NĐ 13/2023/NĐ-CP; pháp chế xác nhận số hiệu) | Form thu ngày sinh, địa chỉ cư trú; quy trình E-KYC yêu cầu CCCD, lý lịch tư pháp. Không có chính sách xử lý dữ liệu cá nhân ở URL riêng; câu đồng ý dưới form không link tới văn bản nào; link "Chính sách" `href="#"` (`agent-notes/content-cro/apply-modal.json`, `research/raw/system-map.txt`) | Pháp chế xác định nghĩa vụ cụ thể; soạn chính sách + cơ chế đồng ý (H11) |
| Hoàng Sa, Trường Sa trên bản đồ | File `/images/vn-map-workers.svg` (tải ngày 01/10/2026) **có** nhãn "Q.Đ. Hoàng Sa" và "Q.Đ. Trường Sa". Nhưng trên trang chủ desktop, bản đồ bị cắt trong khung tròn; trong ảnh chụp không thấy rõ hai quần đảo (`slices/home--desktop--04.jpg`). Bản đồ placeholder ở /system-map không có hai quần đảo (`slices/system-map--desktop--02.jpg`) | Kiểm tra mọi khung hiển thị bản đồ ở mọi breakpoint; pháp chế xác nhận cơ sở pháp lý (Luật Đo đạc và Bản đồ 2018: chưa kiểm chứng điều khoản) |
| Quyền dùng logo hãng, video Bluebolt x Panasonic | Site hiện không có logo hãng nào; video có ở /news | Cần văn bản đồng ý trước khi đưa logo hoặc video lên trang chủ |
| Quyền sở hữu mascot KHANG (ảnh + `khang-3d.glb`) | Chưa rõ ai làm. GLB có dấu hiệu output AI image-to-3D (1 mesh, không rig) | Xác nhận Bluebolt sở hữu bản quyền đầy đủ |
| Bản quyền ảnh | og:image bài viết tên `em-telco-tect-image-web-1024x690.jpg` có vẻ lấy từ nguồn khác; ảnh stock chưa rõ license | Kiểm tra hoặc thay |
| Quảng cáo sai so với điều khoản | Bảo hành 12 tháng vs 2 tháng; "24/7" vs CN nghỉ | H8 |
| Tên pháp nhân bản EN | Tên chủ tài khoản ngân hàng bị dịch | H2, H7 |

Các câu hỏi mở liên quan (critic `questions_for_owner`): quyền dùng logo hãng/sàn và video Panasonic; ai làm mascot và Bluebolt có sở hữu không.

---

## 5. Nền tảng kỹ thuật tái dùng được

| Thành phần | Trạng thái | Ghi chú khi tái dùng |
|---|---|---|
| Next.js 16 App Router + Turbopack + Tailwind v4 | Đang chạy 16.3.4 | Trùng stack chuẩn công ty. Nâng lên 16.3.8 (bản vá bảo mật 30/09/2026), React 19.3.x ghim dưới 19.4 nếu dùng R3F 9.8.1 (critic `reverified`) |
| i18n vi/en (middleware, tiền tố /en, vi mặc định) | Tốt | Bỏ auto-redirect theo cookie (H9) |
| `generateMetadata` (title, description, canonical, hreflang), sitemap có `xhtml:link` | Tốt | Thêm `lastmod` thật, JSON-LD, manifest |
| Cấu trúc 34 URL | Có thứ hạng (chưa có số liệu) | Giữ hoặc lập bảng 301 đầy đủ |
| ISR/prerender, HTML cache HIT, TTFB desktop ~165 ms | Tốt | Giữ |
| Header bảo mật ở openresty | Một phần | Bổ sung HSTS, redirect, h2, CSP đầy đủ |
| Pipeline 3D: model-viewer + meshopt + lazy IntersectionObserver/requestIdleCallback + poster webp | Có | Nén GLB, dừng render ngoài viewport, tôn trọng reduced-motion |
| `khang-3d.glb` + bộ ảnh render mascot/thợ | Có | Tối ưu được xuống 628 KB / 352 KB; chờ xác nhận bản quyền |
| `vn-map-workers.svg` | Có nhãn Hoàng Sa, Trường Sa | 1,2 MB: cần SVGO hoặc chuyển TopoJSON. Dữ liệu 34 tỉnh (MIT, ~31,7 KB, đủ hai quần đảo) đã được tech-3d kiểm tra |
| Nội dung chính sách 4 phần, tiêu chuẩn thợ, bảng giá theo vùng, 8 bài viết (5 bài đúng chủ đề dịch vụ) | Có | Đồng bộ lại theo số liệu và SLA đã chốt |
| Alt ảnh đầy đủ (ảnh trang trí để `alt=""`), honeypot `website`, CLS ≈ 0 | Tốt | Giữ |
| Script QA của đợt nghiên cứu: `agent-notes/frontend-seo/overflow.mjs`, `ov2.mjs`, `lhx.py`; `agent-notes/frontend-seo-a11y/scripts/` | Có | Đưa vào CI cho bản mới |

---

## 6. Giới hạn của đánh giá

- **Lab data, không phải field data.** Lighthouse chạy headless trên bbsw, WebGL render bằng CPU. Chưa có CrUX, Search Console Core Web Vitals hay RUM. Chưa test trên Android tầm trung thật hay iPhone/Safari thật.
- **Phủ chưa đủ.** Lighthouse chỉ đo 6/17 trang. Chưa đo /intro, /requirement, /system-map, /en/*, các bài /news/*. Test tràn ngang ở 768/1024/1366/1920 mới chạy trên một phần URL.
- **Chưa có analytics.** Chưa biết site có GA4/GTM/Search Console không. Không có baseline traffic, nguồn, tỷ lệ mobile/desktop của chính site, từ khoá, backlink hay chuyển đổi.
- **Đường lead chưa kiểm chứng đầu-cuối.** Mọi POST đã bị chặn khi test để không gửi dữ liệu thật. Mới biết form /system-map không phát request; chưa biết form liên hệ, modal hợp tác, modal ứng tuyển có thật sự đến tay sales/HR không.
- **Chưa phỏng vấn khách.** Hành trình 4 nhóm khách là suy luận từ nội dung site. Chưa nói chuyện với Hãng, Sàn, Thợ hay người tiêu dùng. Chưa rõ hãng mục tiêu là hãng Việt hay FDI Nhật/Hàn/Trung.
- **Chưa biết phía Bluebolt có gì.** Repo source, đội đã build site, CMS, cách deploy, quyền openresty đều là câu hỏi mở.
- **Pháp lý chưa được pháp chế xác nhận.** Mục 4.9 là nhận diện rủi ro, không phải ý kiến pháp lý.
- **Chưa đối chiếu đối thủ B2B trực tiếp trong nước** (mạng lưới lắp đặt white-label, đội dịch vụ chuỗi điện máy, đơn vị bảo hành uỷ quyền). Benchmark trong nước mới có 8 site, phần lớn là B2C.
- **MST 0316875706, Google Business Profile, Zalo OA, mạng xã hội** chưa được tra cứu.

---

Cập nhật: 01/10/2026 — đã qua vòng phản biện
