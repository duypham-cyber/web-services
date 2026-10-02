# Contract: site-shell-p0 — Khung site P0 (route, template, SEO, i18n, a11y)

## STATUS: DRAFT — chờ anh Duy duyệt

| | |
|---|---|
| Ngày | 02/10/2026 |
| Loại | Phần tĩnh nhưng rủi ro (`04` mục 4, G3). Không ERD, không API. RBAC: N/A |
| Quyết định nền | Phim A+ (02/10/2026). B2C nhánh A. Lenis tắt. Nội dung là code (`content/*.ts` + Zod). Không logo hãng. Analytics Umami (chưa cài) |
| Nguồn (chỗ khác nhau theo `04`) | `03` mục 1.4, 10, 11, 12, 13.1, 13.4, 13.5, 14 · `04` mục 2.4, 2.6, 2.7, 2.8, 6.1, 6.3 (P1, P6, P8), 7 · `01` mục 3, 4.6 · `research/raw/*.txt` (nội dung site cũ) |
| Contract liên quan | `film-home.md` (phim, HeroScreen, handoff). Form lead, `/api/*`, DB, CMS, `/tra-cuu`: contract riêng, **chưa có** |
| Chặn | G4 (build P0) không được code khi file này chưa **APPROVED** |

---

## 1. User story và Acceptance Criteria

```
AS A   người của Hãng/Sàn (B2B)    I WANT TO tới đúng landing của mình trong ≤ 2 cú bấm từ mọi trang,
                                   đọc SLA/giá/mạng lưới bằng số có định nghĩa và ngày
                                   SO THAT tôi đủ tin để xin báo giá.
AS A   thợ kỹ thuật                I WANT TO thấy thu nhập, tiêu chuẩn, lộ trình gia nhập ở một trang
                                   SO THAT tôi đăng ký làm đối tác.
AS A   khách lẻ                    I WANT TO gọi/Zalo và biết bảo hành ở đâu SO THAT được hỗ trợ nhanh.
AS A   người đọc tiếng Anh         I WANT TO có bản /en không lẫn tiếng Việt SO THAT site trông "quốc tế".
AS A   Googlebot / người dùng công nghệ hỗ trợ / máy yếu / không JS
                                   I WANT TO đọc được đủ nội dung, 1 H1/trang, link cũ không gãy.
```

### 1.1 Danh sách route VI ↔ EN

Nguồn: `03` mục 10.1. Slug VI không dấu, EN có slug riêng qua `pathnames` của next-intl, VI không tiền tố, EN `/en`. Cột "Đích 301" là URL cũ trỏ về route này (`03` mục 10.3).

| # | VI | EN | Ưu tiên | Template | Đích 301 từ URL cũ | JSON-LD |
|---|---|---|---|---|---|---|
| 1 | `/` | `/en` | P0 | T-HOME | `/`, `/en` (giữ) | Organization |
| 2 | `/giai-phap` | `/en/solutions` | P1 | T-HUB | — | BreadcrumbList |
| 3 | `/giai-phap/hang-dien-may` | `/en/solutions/appliance-brands` | P0 | T-SOLUTION | — | Service, BreadcrumbList |
| 4 | `/giai-phap/san-tmdt-ban-le` | `/en/solutions/marketplaces-retail` | P0 | T-SOLUTION | — | Service, BreadcrumbList |
| 5 | `/dich-vu` | `/en/services` | P0 | T-HUB | `/services`, `/en/services` | BreadcrumbList |
| 6 | `/dich-vu/lap-dat-dieu-hoa` | `/en/services/air-conditioner-installation` | P0 | T-SERVICE | — | Service, BreadcrumbList |
| 7 | `/dich-vu/lap-dat-dien-may` | `/en/services/appliance-installation` | P1 | T-SERVICE | — | Service, BreadcrumbList |
| 8 | `/dich-vu/bao-tri-dinh-ky` | `/en/services/scheduled-maintenance` | P1 | T-SERVICE | — | Service, BreadcrumbList |
| 9 | `/dich-vu/lap-dat-robot-hut-bui` | `/en/services/robot-vacuum-installation` | P2 | T-SERVICE | — | Service, BreadcrumbList |
| 10 | `/bang-gia` | `/en/pricing` | P0 | T-PRICING | `/prices`, `/en/prices` | BreadcrumbList |
| 11 | `/mang-luoi` | `/en/network` | P0 | T-NETWORK | `/system-map`, `/en/system-map` | BreadcrumbList |
| 12 | `/doi-tac-tho` | `/en/technician-partners` | P0 | T-PARTNER | `/requirement`, `/worker-map` (+ bản `/en/…`) | BreadcrumbList |
| 13 | `/ho-tro-khach-hang` | `/en/customer-support` | P1 | T-SUPPORT | — | BreadcrumbList |
| 14 | `/ve-chung-toi` | `/en/about` | P1 (**đích 301**, xem R-301-TARGET) | T-ABOUT | `/intro`, `/en/intro` | BreadcrumbList |
| 15 | `/kien-thuc` | `/en/knowledge` | P1 (**đích 301**) | T-KB-HUB | `/news`, `/en/news` | BreadcrumbList |
| 16 | `/kien-thuc/<slug>` × 6 | `/en/knowledge/<en-slug>` × 6 | P1 (**đích 301**) | T-ARTICLE | `/news/<slug>`, `/en/news/<slug>` | Article, BreadcrumbList |
| 17 | `/lien-he` | `/en/contact` | P0 | T-CONTACT | `/contact`, `/en/contact` | BreadcrumbList |
| 18 | `/chinh-sach-bao-mat` | `/en/privacy-policy` | P0 | T-LEGAL | — | BreadcrumbList |
| 19 | `/dieu-khoan-su-dung` | `/en/terms` | P0 | T-LEGAL | — | BreadcrumbList |
| 20 | `/chinh-sach-bao-hanh` | `/en/warranty-policy` | P0 | T-LEGAL | (chính sách tách từ `/prices`) | BreadcrumbList |
| — | 404 / 410 | 404 / 410 | P0 (bản tối thiểu) | T-ERROR | — | — |
| — | `/tra-cuu` | `/en/track` | P2 | — | **Không tạo route** (contract riêng) | — |

Sáu bài viết (slug VI giữ nguyên, EN mới theo `03` 10.3):

| VI `/kien-thuc/…` | EN `/en/knowledge/…` |
|---|---|
| `lap-dat-may-lanh-dung-cach-7-buoc` | `how-to-install-an-air-conditioner-in-7-steps` |
| `10-nguyen-nhan-may-lanh-khong-lanh` | `10-reasons-your-air-conditioner-is-not-cooling` |
| `rui-ro-lap-dat-may-giat-khong-dung-cach` | `risks-of-improper-washing-machine-installation` |
| `chuyen-doi-so-trong-lap-dat-toan-quoc` | `digital-transformation-in-nationwide-installation` |
| `tuong-lai-nganh-dien-lanh-2026` | `hvac-industry-outlook-2026` |
| `robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai` (gộp 2 bài robot) | `home-robots-and-automation-trends` |

### 1.2 Wireframe khung chung (`03` mục 13.1)

```
DESKTOP ≥1024 (sticky; trong vùng phim trang chủ: trong suốt chữ trắng, theo film-home.md)
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Bluebolt Services]  Giải pháp▾  Dịch vụ  Bảng giá  Mạng lưới  Đối tác thợ  Kiến thức │
│                                     VI|EN   ☎ 0902 808 049   [Nhận báo giá]  │
└──────────────────────────────────────────────────────────────────────────────┘
 Giải pháp▾ (mega menu): Hãng điện máy · Sàn TMĐT & bán lẻ · (link) Hỗ trợ khách lẻ
 768–1023: logo · Nhận báo giá · ☰  (hotline vào menu; nguyên nhân tràn 768 px của site cũ)

MOBILE <768                              THANH DÍNH ĐÁY (safe-area, mọi trang)
┌──────────────────────────┐             ┌────────────┬────────────┬──────────────┐
│ [Bluebolt]       ☎   ☰  │             │    Gọi     │   Zalo*    │ Nhận báo giá │
└──────────────────────────┘             └────────────┴────────────┴──────────────┘
 ☰ = ngăn kéo toàn màn hình, focus trap, ESC đóng.   * Zalo chỉ hiện khi có URL Zalo OA thật.
 Trên /doi-tac-tho nút phải là "Đăng ký thợ".

FOOTER (navy-900; mobile: accordion)
┌───────────────┬───────────────┬───────────────┬───────────────┬─────────────────────┐
│ Giải pháp     │ Dịch vụ       │ Công ty       │ Pháp lý       │ CÔNG TY CỔ PHẦN CÔNG │
│ Hãng điện máy │ Điều hòa      │ Về chúng tôi  │ Bảo mật       │ NGHỆ TIA CHỚP XANH   │
│ Sàn TMĐT      │ Bảng giá      │ Kiến thức     │ Điều khoản    │ MST 0316875706       │
│               │ Mạng lưới     │ Đối tác thợ   │ Bảo hành      │ 100 Nguyễn Văn Lượng,│
│               │               │ Liên hệ       │               │ P. Gò Vấp, TP.HCM    │
├───────────────┴───────────────┴───────────────┴───────────────┴─────────────────────┤
│ ☎ 0902 808 049 · contact@bluebolt.services · [Zalo OA*]                              │
│ © 2026 Công ty Cổ phần Công nghệ Tia Chớp Xanh (Bluebolt Services). Bảo lưu mọi quyền.│
└──────────────────────────────────────────────────────────────────────────────────────┘
 KHÔNG: số tài khoản ngân hàng, "Sẽ cập nhật sau!", chi nhánh chưa có, icon mạng xã hội không có link thật.
```

### 1.3 Wireframe từng template (ASCII rút gọn, `03` mục 13.4–13.5)

```
T-HOME (sau phim; phim + HeroScreen theo film-home.md)
 [PHIM A+ → HeroScreen (H2)]
 ┌ #ba-cua-vao  H2 ───────────────────────────────────────────────────────────┐
 │ Hãng & Sàn [→ Giải pháp cho hãng] │ Thợ [→ Đăng ký đối tác] │ Khách lẻ [→ Hỗ trợ] │ ảnh tách vùng chữ
 ├ BẢN ĐỒ 34 TỈNH 2.5D (SVG, map-rise) ── K1, K2 ── [Xem mạng lưới →] ──────────┤ QĐ. Hoàng Sa/Trường Sa
 ├ DẢI TIN CẬY: KPI K1–K4 (count-up; ô thiếu số thì ẩn) · logo: ẩn tới khi có phép┤
 ├ VẤN ĐỀ → GIẢI PHÁP: H2 + 3 nỗi đau │ ①–④ lợi ích, mỗi ý 1 số/1 ảnh thật (claim) ┤
 ├ QUY TRÌNH 5 BƯỚC <ol> (00 nhạt: khách mua hàng) 01…05 + ảnh tĩnh từ cảnh ──────┤
 ├ DỊCH VỤ: 4 card (stagger-grid) → chi tiết hoặc anchor trong hub ──────────────┤
 ├ (P1) Bằng chứng · (P1) Tiêu chuẩn thợ · Kiến thức: 3 bài mới nhất ────────────┤
 ├ CTA CUỐI: "Sẵn sàng triển khai…?" [Nhận báo giá] [Đặt lịch demo 30'] (chưa form)┤
 └ FOOTER ─────────────────────────────────────────────────────────────────────┘

T-SOLUTION (/giai-phap/hang-dien-may, /giai-phap/san-tmdt-ban-le)
 Breadcrumb · H1 + lead + [Đặt lịch demo] (poster tĩnh; video loop: sau)
 Nỗi đau → Bảng SLA theo vùng (content/sla.ts) → Quy trình 5 bước → Đối soát & VAT
 (Hãng) hoặc Sơ đồ tích hợp đơn sàn → thợ → trạng thái (Sàn, SVG) → Khung giá nhóm thiết bị
 → Case study (P1, ẩn) → So sánh tự quản/địa phương/Bluebolt → FAQ → CTA cuối

T-HUB (/dich-vu; /giai-phap ở P1)
 Breadcrumb · H1 + lead → lưới card (icon + 1 dòng + link) → CTA cuối
 Card trỏ trang chưa build: dùng anchor section trong hub, không link 404

T-SERVICE (/dich-vu/<slug>)
 Breadcrumb · H1 → Phạm vi & thiết bị → Đã gồm / chưa gồm → Bảo hành (bảng SLA chung)
 → Quy trình → FAQ → CTA cuối

T-PRICING (/bang-gia) — không motion, không shot
 H1 "Khung giá vật tư tham khảo (thợ thu tại chỗ)" → bộ lọc thiết bị/vùng (HCM · HN · Tỉnh khác ·
 Khu vực đặc thù) → bảng (đơn vị, VAT, ngày hiệu lực, tabular-nums) → [Tải PDF] → Giá theo hợp đồng
 cho B2B + CTA → link /chinh-sach-bao-hanh. Không animate giá.

T-NETWORK (/mang-luoi)
 H1 → bản đồ 34 tỉnh SVG (P0; WebGL P1) → bảng 34 tỉnh có ô tìm (SSR) → SLA theo vùng
 → CTA "Triển khai tại tỉnh của bạn". Ô số thợ null → "chưa có số".

T-PARTNER (/doi-tac-tho)
 H1 "Đơn ổn định, thu nhập minh bạch" → thu nhập tham khảo (số thật hoặc ẩn) → cách nhận tiền,
 phí, ví → lộ trình 4 bước (Đăng ký → E-KYC → Đào tạo → Nhận đơn) → tiêu chuẩn 4 nhóm
 → #viec-dang-tuyen (chỉ tin thật) → FAQ → #dang-ky (chưa form: hotline/Zalo) + link tải app

T-SUPPORT (/ho-tro-khach-hang, P1)
 H1 → Gọi/Zalo → Đăng ký bảo hành 7 ngày (form: contract riêng) → thời hạn bảo hành
 → "Bluebolt không yêu cầu chuyển khoản cá nhân cho thợ" (claim)

T-ABOUT (/ve-chung-toi)
 H1 → sứ mệnh → KPI → (P1) mốc phát triển, đội ngũ, ảnh thật → pháp nhân, MST → đối tác (ẩn tới khi có phép)

T-KB-HUB (/kien-thuc) và T-ARTICLE (/kien-thuc/<slug>)
 Hub: H1 → lọc 3 nhóm → card (nhóm · ngày · thời gian đọc · excerpt 2 dòng)
 Bài: breadcrumb · H1 (sentence case) · meta ngày/cập nhật · mục lục sticky (≥1024) · thân MDX
      (template 7 bước, marker xanh) · scroll-progress · bài liên quan · CTA cuối

T-CONTACT (/lien-he)
 H1 → 3 kênh theo bộ phận: #kinh-doanh (B2B) · #tuyen-tho · #cskh → địa chỉ chữ + nút "Mở Google Maps"
 (không nhúng Maps JS) → giờ hoạt động (content/sla.ts)

T-LEGAL (3 trang)
 H1 → ngày hiệu lực/phiên bản → mục lục → thân MDX do pháp chế duyệt

T-ERROR
 404: H1 "Không tìm thấy trang" + 3 link chính (không KHANG). 410: trang tĩnh ngắn từ openresty.
```

### 1.4 Acceptance Criteria

**Route và i18n**
- **AC-R-1** Route lấy từ một nguồn `content/routes.ts` (id, path vi, path en, ưu tiên, `enabled`, template). `i18n/routing.ts` sinh từ nguồn này. Mọi route `enabled` trả 200 ở cả VI và EN; route chưa build trả 404 và **không có link nội bộ nào trỏ tới** (crawl nội bộ 0 link 404).
- **AC-R-2** URL không tiền tố luôn là tiếng Việt. Cookie `NEXT_LOCALE` không gây redirect (chỉ được dùng để gợi ý bằng banner, P1).
- **AC-R-3** Nút VI|EN dẫn tới đúng trang tương ứng theo `pathnames`; trang không có bản dịch thật thì dẫn về trang chủ ngôn ngữ kia.
- **AC-R-4** URL chuẩn không có dấu `/` cuối; biến thể có `/` cuối trả 301 một bước (openresty).

**Khung chung**
- **AC-SH-1** Header một mẫu cho mọi trang, đúng wireframe 1.2: sticky nền trắng có `shadow-1` khi cuộn (trừ vùng phim trang chủ); hotline VI `0902 808 049` / EN `+84 902 808 049`, `href="tel:+84902808049"`; nút "Nhận báo giá" → `/lien-he#kinh-doanh` cho tới khi form B2B có contract. Không ô tìm kiếm, không widget nổi "Products".
- **AC-SH-2** Mega menu "Giải pháp" mở bằng chuột, Enter/Space; ESC đóng và trả focus; `aria-expanded` đúng. Không JS: "Giải pháp" là link thường tới landing Hãng điện máy.
- **AC-SH-3** Mobile < 768: header logo · ☎ · ☰; ngăn kéo có focus trap, ESC/nút đóng trả focus về ☰; không JS: ☰ là `<a href="#footer-nav">`. Thanh dính đáy theo wireframe, tôn trọng `env(safe-area-inset-bottom)`, không che nội dung (padding-bottom cho `main`); trên `/doi-tac-tho` nút phải là "Đăng ký thợ" → `#dang-ky`. Nút Zalo chỉ hiện khi `content/contact.ts` có `zaloUrl` đã duyệt.
- **AC-SH-4** Vùng chạm trên mobile ≥ 44×44 px cho mọi nút/link của header, ngăn kéo, thanh đáy, footer.
- **AC-SH-5** Footer đúng wireframe: dòng copyright VI `© 2026 Công ty Cổ phần Công nghệ Tia Chớp Xanh (Bluebolt Services). Bảo lưu mọi quyền.` · EN `© 2026 CÔNG TY CỔ PHẦN CÔNG NGHỆ TIA CHỚP XANH (Bluebolt Services). All rights reserved.`; tên pháp nhân không dịch; không STK, không "Sẽ cập nhật sau!", không icon MXH thiếu link thật.
- **AC-SH-6** SkipLink "Bỏ qua tới nội dung chính" là phần tử focus đầu tiên của mọi trang, hiện khi focus, trỏ `#noi-dung` (`<main id="noi-dung" tabindex="-1">`).
- **AC-SH-7** Mỗi trang chỉ có **một** khối CTA cuối (UX-32).

**Tràn ngang và bố cục**
- **AC-OVF-1** `document.documentElement.scrollWidth ≤ clientWidth` ở **360, 390, 414, 768, 1024, 1280, 1366, 1440, 1920** × **mọi route enabled** × **VI/EN**, đo sau khi cuộn tới cuối trang, chạy cả mặc định, `reducedMotion: 'reduce'` và `?mode=still`. Có `body { overflow-x: clip }` và wrapper `overflow: clip` cho phần tử trang trí absolute; lưới an toàn này không thay cho việc sửa nguồn tràn.
- **AC-OVF-2** Container nội dung ≤ 1280 px, full-bleed ≤ 1440 px, gutter `clamp(16px, 4vw, 64px)` (đúng 16 px ở 360–390).

**SEO**
- **AC-H1-1** Mỗi URL **đúng 1 `<h1>`**, ở mọi route VI/EN, có và không JS, mọi tầng phim (trang chủ: H1 ở shot 0, theo `film-home.md`).
- **AC-SEO-1** `title` riêng (≤ 60 ký tự, sentence case), `meta description` riêng (70–160 ký tự), không trùng giữa các URL.
- **AC-SEO-2** `canonical` tuyệt đối `https://lapdattoanquoc.vn/...`, không `localhost`, không `http://`, không dấu `/` cuối.
- **AC-SEO-3** `hreflang` tuyệt đối `vi`, `en`, **`x-default` → bản VI**, chỉ cho cặp có bản dịch thật; hai chiều khớp nhau.
- **AC-SEO-4** Open Graph/Twitter riêng mỗi trang; ảnh OG 1200×630 ≤ 300 KB, chế độ `noKhang`; `og:locale` `vi_VN` / `en_US`.
- **AC-SEO-5** `sitemap.xml` chỉ gồm URL 200 indexable, có `lastmod` thật (từ `updatedAt` của nội dung, không phải giờ build) và `xhtml:link` alternate. `robots.txt` chuẩn (không dòng `Host:`). Staging: `X-Robots-Tag: noindex, nofollow` từ openresty.
- **AC-LD-1** JSON-LD hợp lệ theo bảng 1.1 và G6: **Organization** (trang chủ; `legalName` "CÔNG TY CỔ PHẦN CÔNG NGHỆ TIA CHỚP XANH" không dịch, `name` "Bluebolt Services", `url`, `logo`, `sameAs` chỉ link thật, `contactPoint` theo bộ phận chỉ khi dữ liệu liên hệ đã duyệt); **Service** (trang giải pháp và dịch vụ; `areaServed` chỉ gồm tỉnh đã xác nhận trong `content/provinces.ts`); **BreadcrumbList** (mọi trang trừ trang chủ); **Article** (bài viết: `headline`, `datePublished`, `dateModified`, `inLanguage`, `author`/`publisher` Organization).
- **AC-LD-2** **Không** LocalBusiness, **không** AggregateRating/Review tự đánh giá. FAQPage chỉ khi FAQ hiển thị trên trang. JobPosting chỉ cho tin tuyển thật đủ trường bắt buộc có `validThrough` (P1).

**Truy cập và chuyển động**
- **AC-A11Y-1** axe-core: **0 lỗi serious/critical** và **0 `color-contrast`** trên mọi route enabled VI/EN (trang chủ: theo `film-home.md` thêm các trạng thái phim). Màu chỉ từ tokens `03` 11.1; chữ cam chỉ `orange-700`; nút cam chữ navy + viền 1 px `orange-700`.
- **AC-A11Y-2** Focus ring: outline 3 px `blue-600`, offset 2 px trên nền sáng; `orange-200` trên nền navy; không `outline: none` khi chưa thay thế.
- **AC-A11Y-3** Landmark đủ (`header`, `nav` có nhãn, `main`, `footer`); `<html lang="vi">` / `lang="en"`; ảnh nội dung có `alt`, ảnh trang trí `alt=""`; zoom 200% không mất nội dung.
- **AC-RM-1** `prefers-reduced-motion: reduce`: tắt mọi hiệu ứng `03` 12.2 (count-up hiện số cuối, dải logo đứng yên, `map-rise` hiện trạng thái cuối), 0 request GLB/three/video ở trang chủ, `/mang-luoi` và hero trang con.
- **AC-RM-2** Luật motion `03` 12.2: chỉ animate `transform`/`opacity`/`clip-path`; không animate giá, hotline, pháp lý, trường form, thông báo lỗi; ≤ 1 hiệu ứng lớn mỗi màn hình; không loop vô hạn; phần tử LCP không bắt đầu ở `opacity:0`; `html[data-motion=pending]` tự gỡ sau 4 s và chỉ được đặt bằng script (không JS thì không có).
- **AC-NOJS-1** Tắt JS: mọi trang đọc đủ nội dung (H1, chữ, bảng giá, bảng 34 tỉnh, KPI số cuối, CTA, footer); điều hướng dùng được (AC-SH-2, AC-SH-3).

**i18n và nội dung**
- **AC-I18N-1** 0 ký tự tiếng Việt có dấu trên trang `/en` (text node, `alt`, `title`, `aria-label`, `meta`, JSON-LD), trừ danh sách cho phép `tests/i18n/vi-allowlist.ts`: tên pháp nhân và địa chỉ đường phố. Nhãn bản đồ EN không dấu ("Hoang Sa (Paracel) Is.", "Truong Sa (Spratly) Is.", chờ pháp chế duyệt chữ EN).
- **AC-I18N-2** Không thiếu khóa dịch: build fail nếu `messages/en.json` thiếu khóa có trong `vi.json` hoặc ngược lại.
- **AC-DATA-1** Mọi số liệu đọc từ `content/stats.ts` (K1–K6: giá trị hoặc `null`, định nghĩa, ngày cập nhật); thiếu số thì **ẩn ô**, cả dải trống thì ẩn dải. Không số liệu nào viết cứng trong component hay `messages`.
- **AC-DATA-2** Câu khẳng định (34 tỉnh, chuẩn hãng, E-KYC, bảo hành, "24/7", "không yêu cầu chuyển khoản cá nhân"…) chỉ đọc từ `content/claims.ts`. Production: chưa có `approvedBy` thì không render. `DRAFT_PREVIEW=1` (local/staging, noindex) hiện kèm nhãn "Nháp". Build production fail theo luật R-CLAIM của `film-home.md`.
- **AC-DATA-3** Giọng văn `03` 11.5: sentence case, không "?!?"/"!!", không emoji trong UI, xưng "Bluebolt/chúng tôi" với khách, "bạn" với thợ, không "BBSV".
- **AC-DATA-4** Logo hãng/sàn, case study, video đối tác chỉ hiện khi `content/partners.ts` có văn bản đồng ý; không có thì ẩn cả section.

**Chuyển URL (`03` 10.3, `04` 2.7)**
- **AC-301-1** 34 URL sitemap cũ theo bảng `03` 10.3 + URL kiểm kê thêm (Search Console, access log 90 ngày, crawl) ghi trong `content/redirects.ts` → sinh map openresty (`npm run redirects:gen`) và `redirect-inventory.csv`.
- **AC-301-2** Mỗi URL trong inventory × 4 biến thể (`http`/`https` × `www`/apex) × có/không `/` cuối trả **301 đúng 1 hop** tới đích, hoặc **410** cho dòng đã duyệt (mặc định: `/news/ky-nguyen-ai-nhung-nganh-bi-anh-huong` và bản `/en/news/…`). 2 bài robot cũ cùng 301 về bài gộp.
- **AC-301-3** Mọi đích 301 trả **200** tại thời điểm launch (R-301-TARGET). Ảnh đang được index/dùng làm og:image (`/images/og-cover.jpg`, `/images/news/*`, `/images/vn-map-workers.svg`, `/images/khang-3d-poster.webp`…) trả 200 (giữ đường dẫn trong `public/images/`) hoặc 301.

**Hiệu năng**
- **AC-PERF-1** JS tải đầu **≤ 170 KB gz** cho mỗi route (`check-budgets`, chặn merge). GSAP không nằm trong first-load.
- **AC-PERF-2** Lighthouse **mobile ≥ 85, desktop ≥ 90** (lab, median 3 lần, preset mặc định Slow 4G/CPU 4×) cho mọi route P0 VI và bản `/en` tương ứng; LCP ≤ 2,5 s, TBT ≤ 200 ms, CLS ≤ 0,1.
- **AC-PERF-3** Be Vietnam Pro tự host qua `next/font` (subset `latin`, `latin-ext`, `vietnamese`; weight 400/500/600/700; `display: swap`), chỉ preload 1 file; mỗi trang preload tối đa 1 ảnh hero; ảnh AVIF/WebP có `width`/`height`.
- **AC-PERF-4** `/lien-he` không tải Google Maps JS (chỉ nút mở Google Maps).

**Bản đồ chủ quyền (trang chủ section bản đồ, `/mang-luoi`)**
- **AC-MAP-1** NFR-MAP-01 ở 9 breakpoint: bbox Hoàng Sa và Trường Sa nằm trọn trong khung; không phần tử nào có z-index cao hơn giao với bbox quần đảo + nhãn; nhãn "QĐ. Hoàng Sa", "QĐ. Trường Sa" ≥ 11 CSS px, tương phản ≥ 4,5:1; đảo tương phản ≥ 3:1 với nền; bảng 34 tỉnh có trong HTML. Pháp chế ký ảnh chụp 360 px trước launch.

**Pháp lý**
- **AC-LEGAL-1** 3 trang pháp lý dùng template T-LEGAL; thân bài đọc từ `content/legal/*.mdx` có `approvedBy`. Production chưa có bản duyệt: trang hiện thông báo ngắn "Nội dung đang được hoàn thiện" + kênh liên hệ, có `noindex`. Launch gate: `/chinh-sach-bao-mat` phải có bản pháp chế duyệt (NFR-PDP-01).

### OUT OF SCOPE (rõ ràng)

- Form lead (B2B, thợ, bảo hành), `/api/v1/leads`, xử lý `/api/contact` cũ, bảng `leads`, Turnstile, email thông báo: contract riêng.
- CMS (Payload) và mọi màn hình quản trị; `/tra-cuu`; booking B2C (nhánh B, qua CR).
- Phim trang chủ, HeroScreen, handoff: `film-home.md`. Video loop hero trang con: làm sau, P0 dùng poster tĩnh.
- `/mang-luoi` WebGL tương tác (P1), bản JA/KO (P2), WebGL iPad/iPhone (P2).
- Banner gợi ý ngôn ngữ theo cookie (P1). Lenis. GA4 + banner đồng ý (chỉ khi anh chọn GA4).
- Nội dung chữ cuối cùng VI/EN, số liệu, SLA, giá: thuộc G6 và việc người; contract này chỉ định khung và luật.

---

## 2. Database Schema

**Không áp dụng.** Site P0 không có DB. Nội dung là code trong `content/*.ts`, `content/**/*.mdx`, `messages/*.json`, kiểm bằng Zod lúc build. Bảng `leads` thuộc contract form lead.

## 3. API Contract

**Không áp dụng.** Không tạo `app/api/*` trong contract này. Thay vào đó là **hợp đồng dữ liệu nội dung** (Zod, build fail nếu sai). Shape bám theo khả năng chuyển sang Payload sau này (`04` 2.4).

| File | Shape chính | Luật |
|---|---|---|
| `content/routes.ts` | `{ id, vi, en, priority: 'P0'\|'P1'\|'P2', enabled, template, redirectFrom[] }` | Nguồn cho pathnames, sitemap, link nội bộ |
| `content/stats.ts` | `{ id: 'K1'…'K6', value: number\|null, unit, label{vi,en}, definition{vi,en}, updatedAt }` | `null` → ẩn ô |
| `content/claims.ts` | `{ id, text{vi,en}, evidence, approvedBy: string\|null, approvedAt }` | Gate R-CLAIM |
| `content/sla.ts` | `{ id, label{vi,en}, value{vi,en}\|null, region?, source }` | Giờ hotline, giờ nhận đơn, thời gian hoàn thành, bảo hành |
| `content/pricing.ts` | `{ item{vi,en}, unit, region: 'HCM'\|'HN'\|'OTHER'\|'SPECIAL', priceVnd: integer, vatIncluded: boolean, effectiveFrom }` | Giá số nguyên VNĐ, không animate |
| `content/provinces.ts` | 34 dòng `{ code, name{vi,en}, region, technicians: number\|null, confirmed: boolean }` | `areaServed` chỉ lấy `confirmed` |
| `content/process.ts` | 5 bước `{ n, title{vi,en}, body{vi,en}, actor }` + bước 00 kích hoạt | Một nguồn cho trang chủ, giải pháp, phim |
| `content/contact.ts` | `{ hotline, email, zaloUrl\|null, address, departments[] }` | Không STK ngân hàng |
| `content/partners.ts` | `{ name, logo, consentDoc\|null }` | Không có `consentDoc` → không hiển thị |
| `content/redirects.ts` | `{ from, to\|null, status: 301\|410, approved }` | Sinh map openresty + test |
| `content/articles/{vi,en}/*.mdx` | frontmatter `{ slug, title, description, category, publishedAt, updatedAt, readingMinutes, pairId }` | `pairId` nối cặp VI/EN cho hreflang |
| `content/legal/{vi,en}/*.mdx` | frontmatter `{ version, effectiveFrom, approvedBy\|null }` | AC-LEGAL-1 |

## 4. RBAC Map

**N/A.** Site công khai, không đăng nhập, không phân quyền runtime. Quyền **duyệt nội dung** thể hiện qua trường `approvedBy` (không phải RBAC): anh Duy duyệt claim/số liệu/giá; vận hành cung cấp số K1–K6 và số thợ theo tỉnh; pháp chế duyệt pháp lý, claim quảng cáo, chữ trên bản đồ; dev/Claude Code chỉ sửa qua PR. Trang `/_dev/ui` (G2) trả 404 ở production.

## 5. Business Rules & Edge Cases

```
R-301-TARGET — đích chuyển URL phải tồn tại khi launch
  - /ve-chung-toi, /kien-thuc và 6 bài là P1 trong 03 nhưng là đích 301 của /intro, /news, /news/*.
  - Mặc định đề xuất: launch kèm bản tối thiểu của các trang này (nội dung site cũ viết lại theo giọng văn
    11.5, không thêm tính năng P1). Không 301 tạm về trang khác rồi đổi sau (2 lần đổi đích, hại SEO).
    → Câu cần anh xác nhận #6.

R-LINK — link nội bộ
  - Link tới route enabled=false bị thay bằng đích dự phòng: "Hỗ trợ khách lẻ" → /lien-he#cskh;
    card dịch vụ P1/P2 → anchor trong /dich-vu. Không link nội bộ nào trả 404.

R-CTA — khi form chưa có contract
  - "Nhận báo giá" → /lien-he#kinh-doanh; "Đăng ký thợ" → /doi-tac-tho#dang-ky (hotline/Zalo).
  - Khi contract form APPROVED chỉ đổi đích trong content/routes.ts, không đổi URL trang.

R-CLAIM — như film-home.md mục 5 (một luật cho toàn site).

R-KPI — trang chủ hiện tối đa K1–K4; landing giải pháp thêm K5, K6 chỉ khi đo được.

EDGE CASES
- Trang có bản VI nhưng chưa có EN thật: không hreflang, không vào sitemap EN, nút EN về /en.
- Bảng giá chưa có ngày hiệu lực hoặc VAT: không hiển thị bảng (không hiện giá thiếu điều kiện).
- Tỉnh có technicians = null: hiện "chưa có số", không suy ra 0.
- Tin tuyển hết hạn (validThrough < hôm nay lúc build): không hiển thị, không JobPosting; build hằng ngày
  hoặc ISR để tin tự gỡ (cơ chế chốt ở G4).
- Người dùng mở link cũ có query (?utm=…): 301 giữ nguyên query.
- Link cũ /en/... có slug bài tiếng Việt: 301 về slug EN mới, 1 hop.
- 768–1023 px: không hiện hotline trên thanh nav (gốc tràn 768 px của site cũ).
- Màn 360 px: tên tỉnh dài, bảng giá nhiều cột → bảng cuộn ngang trong wrapper có nhãn
  (role="region", aria-label, tabindex="0"), trang không tràn.
- Chuỗi tiếng Việt dài ("Ước Hưởng", "ẦẪỆ") ở H1/H2 xuống 2 dòng: line-height ≥ 1,1, không chạm dấu.

KHÔNG XỬ LÝ: xem OUT OF SCOPE mục 1.
```

## 6. Security Requirements

```
HẠ TẦNG / HEADER (openresty, 04 mục 2.7)
[ ] http → https 301; www → apex 301; apex HTTP/2; HSTS từ ngày launch (max-age nâng dần lên ≥ 31536000).
[ ] Mọi đường dẫn có HSTS, nosniff, Referrer-Policy (kể cả location có add_header riêng); không X-Powered-By.
[ ] CSP Report-Only 1 tuần rồi bật thật; không script bên thứ ba ngoài Umami tự host (khi cài).
[ ] Staging: Basic Auth cho CẢ tên miền (tránh prefetch bật hộp đăng nhập) + X-Robots-Tag noindex, nofollow.
[ ] App chỉ bind 127.0.0.1; không mở cổng mới ra Internet.

DỮ LIỆU
[ ] Không thu dữ liệu cá nhân trong contract này (không form). Không STK ngân hàng trên site.
[ ] Liên kết ngoài có rel="noopener noreferrer"; tel:/mailto: dạng chuẩn.
[ ] Không nhúng Google Maps JS, không font/decoder CDN ngoài.

CẤU HÌNH BUILD
[ ] DRAFT_PREVIEW không bật được ở production (build fail). /_dev/ui và cờ ?mode/?capture vô hiệu ở production.
[ ] npm audit 0 critical; phiên bản ghim theo 04 mục 2.1.
```

## 7. Test Checklist (ánh xạ AC → test)

| AC | Test | Loại |
|---|---|---|
| AC-R-1, R-LINK | `tests/e2e/routes.spec.ts`: mọi route enabled VI/EN trả 200; crawl link nội bộ từ trang chủ + sitemap: 0 link 404 | Tự động |
| AC-R-2, AC-R-3 | `tests/e2e/i18n-routing.spec.ts`: đặt cookie `NEXT_LOCALE=en` rồi mở `/bang-gia` → 200 tiếng Việt, không 307; nút EN trên mọi trang dẫn đúng cặp | Tự động |
| AC-R-4, AC-301-1…3 | `scripts/check-redirects.mjs` trên staging qua openresty: N/N dòng × 4 biến thể × có/không `/` → 301 (1 hop, đúng đích, giữ query) hoặc 410; mọi đích trả 200; ảnh og cũ 200/301 | Tự động (CI sau deploy) |
| AC-SH-1…7, AC-A11Y-2 | `tests/e2e/shell.spec.ts`: header/mega menu/ngăn kéo bằng bàn phím (Enter, Space, ESC, focus trap, trả focus); SkipLink là focus đầu tiên; thanh đáy đổi nút ở `/doi-tac-tho`; Zalo ẩn khi `zaloUrl = null`; footer không chứa STK/"Sẽ cập nhật sau"; đúng 1 khối CTA cuối | Tự động |
| AC-SH-4 | `tests/e2e/touch-targets.spec.ts` (390×844): mọi phần tử tương tác của header/ngăn kéo/thanh đáy/footer có hộp ≥ 44×44 | Tự động |
| AC-OVF-1, AC-OVF-2 | `tests/overflow.spec.ts` (P8 ở `04`): 9 breakpoint × mọi route × VI/EN × {mặc định, reduced-motion, `?mode=still`}; fail thì chụp ảnh + in 5 phần tử tràn | Tự động, chặn merge |
| AC-H1-1 | `tests/seo-render.spec.ts`: mọi route VI/EN, có/không JS, UA Googlebot smartphone: `h1` = 1 | Tự động, chặn merge |
| AC-SEO-1…5 | `tests/seo-meta.spec.ts`: title/description duy nhất và đúng độ dài; canonical tuyệt đối, không localhost/`http://`/`/` cuối; hreflang hai chiều + x-default → VI; OG ≤ 300 KB; sitemap chỉ URL 200 có lastmod; robots không `Host:` | Tự động |
| AC-LD-1, AC-LD-2 | `tests/jsonld.spec.ts`: validate schema.org trong CI; assert không có `LocalBusiness`/`AggregateRating`/`Review`; `areaServed` ⊆ tỉnh `confirmed` | Tự động + Rich Results Test (dán code) ở G7 |
| AC-A11Y-1, AC-A11Y-3 | `tests/a11y.spec.ts` (axe): mọi route enabled VI/EN, 0 serious/critical, 0 `color-contrast`; `tests/unit/contrast.test.ts` cho cặp token | Tự động, chặn merge |
| AC-RM-1, AC-RM-2 | `tests/e2e/reduced-motion.spec.ts`: 0 request GLB/three/video ở `/`, `/mang-luoi`, trang có hero; count-up = số cuối ngay | Tự động |
| AC-NOJS-1 | `tests/e2e/no-js.spec.ts`: mọi route enabled, nội dung chính hiện (opacity ≥ 0,9), nav dùng được | Tự động |
| AC-I18N-1, AC-I18N-2 | `tests/i18n/no-vietnamese-on-en.spec.ts` (regex ký tự có dấu, trừ allowlist) + `tests/unit/messages-keys.test.ts` | Tự động, chặn merge |
| AC-DATA-1…4, R-CLAIM | `tests/unit/stats.test.ts`, `tests/unit/claims.test.ts`, `scripts/check-claims-output.mjs`; grep build production: không `TODO_DATA`, không nhãn "Nháp"; lint cấm số/hex ngoài `content/` và `tokens.css` | Tự động |
| AC-PERF-1, AC-PERF-3, AC-PERF-4 | `npm run budget`; `tests/perf/requests.spec.ts` (1 font preload, ≤ 1 ảnh preload, không `maps.googleapis.com`) | Tự động, chặn merge |
| AC-PERF-2 | `npm run lhci` (lighthouserc: mọi route P0 VI + EN, mobile + desktop, median 3) | Tự động |
| AC-MAP-1 | `tests/map-sovereignty.spec.ts` (P6 ở `04`): 9 breakpoint, bbox, che phủ, cỡ chữ, tương phản | Tự động + pháp chế ký ảnh 360 px |
| AC-LEGAL-1 | `tests/e2e/legal.spec.ts`: bản chưa duyệt → thông báo + `noindex`; bản duyệt → thân bài | Tự động |
| NFR-COMP-02 | Trang chủ, 1 trang giải pháp, `/bang-gia`, `/mang-luoi` trên Safari macOS/iOS 15–17, Chrome Android, Edge Windows | **Máy thật** (G7) |

REGRESSION
[ ] `film-home.md`: 1 H1 ở shot 0 vẫn đúng sau khi gắn header/footer; skip film link vẫn là focus đầu tiên sau header.
[ ] Bật/tắt từng route P1 (`enabled`) không làm tràn ngang, không sinh link 404.

---

## 8. Câu cần anh xác nhận

| # | Câu hỏi | Mặc định nếu anh chưa trả lời | Ảnh hưởng tới file này |
|---|---|---|---|
| 1 | Tagline: **T1** / T2 / T3 (`03` 1.4)? | T1 | Title/description trang chủ, OG, JSON-LD `slogan` |
| 2 | Eyebrow phạm vi tỉnh có ghi số không? | Không số tới khi claim phạm vi tỉnh có bằng chứng | Trang chủ, `/mang-luoi`, landing |
| 3 | Slug: VI **không dấu**, EN slug riêng, giữ slug bài viết VI? URL có traffic trong Search Console thì giữ nguyên? | Có cả ba; giữ URL có traffic đáng kể sau khi lấy baseline 90 ngày | Bảng 1.1, AC-301 |
| 4 | Bài lạc đề "ky-nguyen-ai-nhung-nganh-bi-anh-huong": **410** hay giữ dưới `/kien-thuc/`? Gộp 2 bài robot? | 410 cả VI và EN; gộp 2 bài robot | AC-301-2, danh sách 6 bài |
| 5 | Handoff thật hay cắt trắng 1 khung? | Handoff thật | Không đổi khung site (thuộc `film-home.md`) |
| 6 | `/ve-chung-toi`, `/kien-thuc` + 6 bài (P1 trong `03`) là đích 301: launch kèm **bản tối thiểu** (nội dung cũ viết lại)? | Có (R-301-TARGET). Khoảng +3–4 giờ khuôn lặp, nằm trong G6 | Phạm vi launch |
| 7 | Trang `/dich-vu/lap-dat-robot-hut-bui` giữ P2 (mô tả trên site cũ sai) hay nâng P1? | Giữ P2, hub dùng anchor | Bảng 1.1 |
| 8 | Có Zalo OA thật không (URL)? | Chưa có thì ẩn nút Zalo | Thanh đáy, footer, JSON-LD `sameAs` |
| 9 | Pháp chế kịp duyệt 3 trang pháp lý trước BBNT? | Chưa duyệt thì trang hiện thông báo + `noindex`, nhưng `/chinh-sach-bao-mat` là điều kiện launch | AC-LEGAL-1 |

Khi anh trả lời "OK proceed", thêm dòng `## STATUS: APPROVED — <ngày>` lên đầu file kèm email xác nhận.
