# Demo Scope: Website Bluebolt Services (lapdattoanquoc.vn) — cây module P0/P1/P2

**Ngày lập:** 2026-10-02
**Domain:** website B2B + tuyển thợ (không khớp 10 template của `/demo-scope`; không dùng `retail-pos.md` làm base vì site không có POS, kho hay đăng nhập. Cây module dựng từ IA `03` mục 10.1 và kế hoạch `04`)
**Timeline:** launch khoảng 10/12/2026 (10 tuần, `04` mục 5.4–5.5). Mốc an toàn M2 (site HTML chưa có phim) ở tuần 7
**Người lập:** Claude (qua /demo-scope, chế độ ux-designer)
**Trạng thái:** DRAFT — chờ anh Duy duyệt cùng `contracts/film-home.md` và `contracts/site-shell-p0.md`

Quyết định đã có: phim **A+** (02/10/2026). Mặc định: B2C nhánh A, Lenis tắt, nội dung là code (`content/*.ts` + Zod), số liệu/khẳng định chưa duyệt không hiện ở production (`DRAFT_PREVIEW` hiện kèm nhãn "Nháp"), Umami (chưa cài), không logo hãng, không KHANG trong cảnh.

---

## 1. Tóm tắt nghiệp vụ KH

CTCP Công nghệ Tia Chớp Xanh (Bluebolt Services) là mạng lưới lắp đặt và bảo hành last-mile cho Hãng điện máy và Sàn TMĐT/bán lẻ; đơn đến từ Hãng/Sàn, thợ đối tác thực hiện, khách trả vật tư tại chỗ. Site hiện tại tự mâu thuẫn số liệu (500+/1.500+/"3000k+" thợ; 63 và 34 tỉnh; bảo hành 2 hay 12 tháng), mất lead thợ (form /system-map không gửi), tràn ngang ở mobile/tablet, trang chủ desktop TBT 36 s vì `model-viewer`. Mong muốn: site "Services, quốc tế", nói với 3 nhóm khách (Hãng & Sàn trả tiền, thợ là nguồn cung, khách lẻ là người dùng cuối), có phim trang chủ theo ngôn ngữ máy quay của video mẫu, bản VI/EN, giữ SEO của 34 URL cũ.

---

## 2. Cây Module — 3 cấp

Quy ước theo `/demo-scope`. Hai điều chỉnh cho website công khai:
- **"Dashboard ở đầu"** áp thành **Trang chủ ở đầu**: không có màn hình quản trị ở P0, trang chủ là màn hình đầu tiên mọi người dùng thấy.
- **Submodule ≈ một trang hoặc một năng lực nền tảng**; Feature ≈ section/hành vi trong trang. Mục có ghi "contract riêng" là phần động, **không code trước khi contract APPROVED**.

```
📦 1. Trang chủ & Phim                                              [P0]
   📁 1.1 Màn đầu & phim A+                         (film-home.md)  [P0]
      ├─ 📄 1.1.1 Màn đầu: eyebrow, H1 duy nhất, lead, 2 CTA B2B,
      │           link "Bỏ qua phần giới thiệu ↓"                   [P0]
      ├─ 📄 1.1.2 Phim desktop: establish POV ban ngày → dolly-in
      │           + phòng tối dần → screen-hold → push-through      [P0]
      ├─ 📄 1.1.3 HeroScreen (H2) + handoff 200 ms + dư âm 20 vh    [P0]
      ├─ 📄 1.1.4 Video dọc tua theo cuộn (T-SEQ)                   [P0]
      ├─ 📄 1.1.5 Poster + ảnh tĩnh (T-STILL, reduced-motion, máy yếu) [P0]
      └─ 📄 1.1.6 Thanh chương 3 mục                                [P0]
   📁 1.2 Các section sau phim                      (site-shell-p0.md) [P0]
      ├─ 📄 1.2.1 Ba cửa vào (#ba-cua-vao)                          [P0]
      ├─ 📄 1.2.2 Bản đồ 34 tỉnh 2.5D (SVG, Hoàng Sa/Trường Sa)     [P0]
      ├─ 📄 1.2.3 Dải KPI K1–K4 (ô thiếu số thì ẩn)                 [P0]
      ├─ 📄 1.2.4 Vấn đề → giải pháp                                [P0]
      ├─ 📄 1.2.5 Quy trình 5 bước (<ol> SSR)                       [P0]
      ├─ 📄 1.2.6 Dịch vụ 4 card                                    [P0]
      ├─ 📄 1.2.7 CTA cuối (nút; form B2B: contract riêng)          [P0]
      ├─ 📄 1.2.8 Bằng chứng: logo, case study, video đối tác       [P1]
      ├─ 📄 1.2.9 Tiêu chuẩn thợ                                    [P1]
      └─ 📄 1.2.10 Kiến thức: 3 bài mới nhất                        [P1]
   📁 1.3 Phim mở rộng B/C (crane bản đồ, nhà khách, orbit, rack-focus) [P2]
   📁 1.4 Phim WebGL cho iPad/iPhone cao cấp (sau 4 tuần RUM)       [P2]

📦 2. Giải pháp cho Hãng & Sàn                                      [P0]
   📁 2.1 Landing Hãng điện máy                                     [P0]
      ├─ 📄 2.1.1 Hero + CTA "Đặt lịch demo 30 phút" (poster tĩnh)  [P0]
      ├─ 📄 2.1.2 Bảng SLA theo vùng (content/sla.ts)               [P0]
      ├─ 📄 2.1.3 Quy trình 5 bước, đối soát & VAT, so sánh, FAQ    [P0]
      ├─ 📄 2.1.4 Form B2B                          (contract riêng) [P0]
      ├─ 📄 2.1.5 Video loop hero dolly-in          (cần phụ lục)    [P0*]
      └─ 📄 2.1.6 Case study                                        [P1]
   📁 2.2 Landing Sàn TMĐT & bán lẻ                                 [P0]
      ├─ 📄 2.2.1 Sơ đồ tích hợp đơn sàn → thợ → trạng thái (SVG)   [P0]
      ├─ 📄 2.2.2 Khung giá theo nhóm thiết bị, SLA, khiếu nại/đổi thợ [P0]
      ├─ 📄 2.2.3 Form "Thảo luận tích hợp"         (contract riêng) [P0]
      └─ 📄 2.2.4 Video loop hero đối soát          (cần phụ lục)    [P0*]
   📁 2.3 Hub giải pháp + bảng so sánh                              [P1]

📦 3. Dịch vụ & Bảng giá                                            [P0]
   📁 3.1 Hub dịch vụ (4 nhóm, anchor cho trang chưa build)         [P0]
   📁 3.2 Lắp đặt điều hòa                                          [P0]
      ├─ 📄 3.2.1 Phạm vi, đã gồm/chưa gồm, bảo hành, quy trình, FAQ [P0]
      └─ 📄 3.2.2 Video loop orbit dàn lạnh         (cần phụ lục)    [P0*]
   📁 3.3 Lắp đặt điện máy (máy giặt, TV treo tường, tủ lạnh…)      [P1]
   📁 3.4 Bảo trì định kỳ (chuỗi, văn phòng)                        [P1]
   📁 3.5 Lắp robot hút bụi                                         [P2]
   📁 3.6 Bảng giá                                                  [P0]
      ├─ 📄 3.6.1 Bảng vật tư tham khảo lọc theo thiết bị/vùng, VAT,
      │           ngày hiệu lực, không animate giá                  [P0]
      ├─ 📄 3.6.2 Giá theo hợp đồng cho B2B + CTA                   [P0]
      └─ 📄 3.6.3 Tải PDF bảng giá                                  [P1]

📦 4. Mạng lưới & Đối tác thợ                                       [P0]
   📁 4.1 Mạng lưới 34 tỉnh (SVG + bảng 34 tỉnh có tìm kiếm + SLA vùng) [P0]
   📁 4.2 Đối tác thợ                                               [P0]
      ├─ 📄 4.2.1 Thu nhập tham khảo, cách nhận tiền, phí, ví       [P0]
      ├─ 📄 4.2.2 Lộ trình 4 bước (Đăng ký → E-KYC → Đào tạo → Nhận đơn) [P0]
      ├─ 📄 4.2.3 Tiêu chuẩn thợ 4 nhóm, FAQ                        [P0]
      ├─ 📄 4.2.4 Form 4 trường                     (contract riêng) [P0]
      └─ 📄 4.2.5 Link tải app thợ (khi có link thật)               [P0]
   📁 4.3 Việc đang tuyển + JobPosting (chỉ tin thật, có hạn)       [P1]
   📁 4.4 Bản đồ WebGL tương tác (hover/tap từng tỉnh)              [P1]

📦 5. Liên hệ & Hỗ trợ khách hàng                                   [P0]
   📁 5.1 Liên hệ theo bộ phận (#kinh-doanh, #tuyen-tho, #cskh; địa chỉ chữ
          + nút mở Google Maps, không nhúng Maps JS)                [P0]
   📁 5.2 Hỗ trợ khách lẻ (gọi/Zalo, thời hạn bảo hành)             [P1]
      └─ 📄 5.2.1 Đăng ký bảo hành 7 ngày           (contract riêng) [P1]
   📁 5.3 Tra cứu đơn & bảo hành (cần API hệ thống điều phối)       [P2]
   📁 5.4 Đặt thợ B2C (chỉ khi anh chọn nhánh B, qua CR)            [P2]

📦 6. Công ty & Kiến thức                                           [P0]
   📁 6.1 Về chúng tôi                                              [P0]
      ├─ 📄 6.1.1 Bản tối thiểu: sứ mệnh, pháp nhân, MST (đích 301 /intro) [P0]
      └─ 📄 6.1.2 Mốc phát triển, đội ngũ, văn phòng (ảnh thật)     [P1]
   📁 6.2 Kiến thức                                                 [P0]
      ├─ 📄 6.2.1 Hub + 6 bài chuyển từ site cũ VI/EN (đích 301 /news) [P0]
      ├─ 📄 6.2.2 Lọc 3 nhóm, mục lục sticky, scroll-progress       [P1]
      └─ 📄 6.2.3 Bài mới                                           [P1]
   📁 6.3 Pháp lý: bảo mật, điều khoản, bảo hành (nội dung pháp chế) [P0]

📦 7. Hệ thống (nền tảng site & vận hành)                           [P0]
   📁 7.1 Khung giao diện & design system                           [P0]
      ├─ 📄 7.1.1 Tokens Tailwind v4 + ~12 primitive + /_dev/ui     [P0]
      ├─ 📄 7.1.2 Header, mega menu, footer, thanh dính đáy, SkipLink [P0]
      └─ 📄 7.1.3 Motion 2.5D (rise, curtain, count-up, map-rise…)  [P0]
   📁 7.2 Đa ngôn ngữ & SEO                                         [P0]
      ├─ 📄 7.2.1 VI không tiền tố, EN /en, pathnames, không redirect cookie [P0]
      ├─ 📄 7.2.2 Metadata, canonical, hreflang (x-default → vi), sitemap [P0]
      ├─ 📄 7.2.3 JSON-LD Organization, Service, BreadcrumbList, Article [P0]
      └─ 📄 7.2.4 301 một bước + 410 (openresty map sinh từ code)   [P0]
   📁 7.3 Nội dung & số liệu (stats, claims, SLA, giá, 34 tỉnh; Zod;
          DRAFT_PREVIEW; build guard)                               [P0]
   📁 7.4 Đo lường, kiểm thử & vận hành                             [P0]
      ├─ 📄 7.4.1 Umami tự host + RUM web-vitals + ~12 sự kiện      [P0]
      ├─ 📄 7.4.2 CI: lint, typecheck, budget, overflow, a11y, visual, LHCI [P0]
      └─ 📄 7.4.3 Staging sau openresty, deploy blue/green, HSTS/h2/www [P0]
   📁 7.5 CMS Payload                               (contract riêng) [P1]
   📁 7.6 Bản JA/KO                                                 [P2]
```

`[P0*]` = video loop hero trang con: `04` G5 đặt trong phạm vi launch (KL 7 giờ, chung với section bản đồ và thanh chương), nhưng **chưa có contract nào phủ** (`film-home.md` và `site-shell-p0.md` đều để ngoài phạm vi). Cần một phụ lục ngắn trước khi làm (≤ 4 s, khoảng 600 KB **ước tính**, `muted playsinline`, không autoplay khi Save-Data/reduced-motion, chỉ tải khi vào viewport, dừng khi ra). Tới lúc đó trang con dùng poster tĩnh.

---

## 3. ERD Core Entities

P0 **không có database**. Bảng dưới là mô hình nội dung (TypeScript + Zod trong `content/`), thiết kế theo shape để sau này chuyển sang Payload chỉ cần thay tầng đọc. Chi tiết shape ở `contracts/site-shell-p0.md` mục 3.

```
ROUTE ─┬─< SECTION (trong template) >── CLAIM
       │                          └──── STAT ──< tính K2 từ ── PROVINCE
       ├── REDIRECT (from cũ → ROUTE)
       └── SERVICE ─< PRICE_ROW
                   └─< SLA_ITEM (theo vùng)
ARTICLE(vi) ── pairId ── ARTICLE(en)            PROCESS_STEP (5 bước, dùng chung)
CONTACT_CHANNEL → header, footer, JSON-LD       PARTNER (chỉ hiện khi có consentDoc)
FILM_ASSET (manifest.json) ── chụp từ màn hình trong cảnh ── tham chiếu CLAIM/STAT
LEAD: thuộc contract form, chưa có (ngoài P0 tĩnh)
```

| Entity | Fields chính | Ghi chú |
|---|---|---|
| ROUTE | id, vi, en, priority, enabled, template | Nguồn cho pathnames, sitemap, link nội bộ |
| STAT | id K1–K6, value \| null, unit, definition, updatedAt | Thiếu số → ẩn ô |
| CLAIM | id, text{vi,en}, evidence, approvedBy, approvedAt | Chưa duyệt → không render ở production |
| SLA_ITEM | id, label, value \| null, region, source | Giờ hotline, giờ nhận đơn, thời gian hoàn thành, bảo hành |
| PRICE_ROW | item, unit, region, priceVnd (số nguyên), vatIncluded, effectiveFrom | Không có ngày hiệu lực/VAT thì không hiện |
| PROVINCE | code, name{vi,en}, region, technicians \| null, confirmed | 34 dòng; `areaServed` chỉ lấy `confirmed` |
| PROCESS_STEP | n, title{vi,en}, body{vi,en}, actor | 5 bước + bước 00 kích hoạt |
| SERVICE | slug{vi,en}, group, scope, included/excluded, faq | 4 nhóm |
| ARTICLE | slug, title, category, publishedAt, updatedAt, pairId | MDX, 6 bài sau gộp/410 |
| REDIRECT | from, to \| null, status 301/410, approved | Sinh map openresty + test |
| CONTACT_CHANNEL | hotline, email, zaloUrl \| null, address, departments | Không STK ngân hàng |
| PARTNER | name, logo, consentDoc \| null | Không văn bản → ẩn |
| FILM_ASSET | kind, locale, file, bytes, w, h, noKhang | `public/film/manifest.json` |

---

## 4. RBAC — Roles & Permission Matrix

**Runtime: N/A** (site công khai, không đăng nhập ở P0). Ma trận dưới là **quyền vận hành nội dung** (ai cung cấp, ai duyệt qua trường `approvedBy`, ai sửa qua PR). CMS P1 sẽ biến ma trận này thành RBAC thật trong contract riêng.

| Role | Mô tả |
|---|---|
| OWNER | Anh Duy: duyệt phạm vi, claim, số liệu, giá, contract, BBNT |
| VẬN HÀNH | Cung cấp K1–K6, số thợ theo tỉnh, SLA, thu nhập thợ |
| PHÁP CHẾ | Duyệt pháp lý, câu đồng ý, claim quảng cáo, bản đồ chủ quyền |
| KD/HR/CSKH | Cung cấp case study, văn bản logo, tin tuyển; nhận lead (sau contract form) |
| DEV | Dev + Claude Code: sửa mọi thứ qua PR, không tự duyệt claim/số |
| KHÁCH TRUY CẬP | Hãng/Sàn, thợ, khách lẻ, bot: chỉ xem |

| Module | OWNER | VẬN HÀNH | PHÁP CHẾ | KD/HR/CSKH | DEV | KHÁCH |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1. Trang chủ & Phim | ✅ | ✏️ số KPI | ✏️ claim | 🔒 view | ✏️ | 🔒 view |
| 2. Giải pháp cho Hãng & Sàn | ✅ | ✏️ SLA | ✏️ claim | ✏️ case study | ✏️ | 🔒 view |
| 3. Dịch vụ & Bảng giá | ✅ | ✏️ giá | ✏️ claim | 🔒 view | ✏️ | 🔒 view |
| 4. Mạng lưới & Đối tác thợ | ✅ | ✏️ số thợ/tỉnh | ✅ bản đồ | ✏️ tin tuyển | ✏️ | 🔒 view |
| 5. Liên hệ & Hỗ trợ | ✅ | ✏️ giờ phục vụ | ✏️ | ✏️ kênh liên hệ | ✏️ | 🔒 view |
| 6. Công ty & Kiến thức | ✅ | 🔒 view | ✅ pháp lý | ✏️ | ✏️ | 🔒 view |
| 7. Hệ thống | ✅ | ❌ | 🔒 view | ❌ | ✏️ | ❌ |

Ký hiệu: ✅ duyệt (ghi `approvedBy`) · ✏️ cung cấp/sửa nội dung, không tự duyệt · 🔒 view chỉ xem · ❌ không liên quan.

---

## 5. Phạm vi P0 tới launch

- [ ] 1.1 Màn đầu & phim A+ — `contracts/film-home.md`
- [ ] 1.2 Các section sau phim — `contracts/site-shell-p0.md`
- [ ] 2.1 Landing Hãng điện máy (form: contract riêng)
- [ ] 2.2 Landing Sàn TMĐT & bán lẻ (form: contract riêng)
- [ ] 3.1 Hub dịch vụ
- [ ] 3.2 Lắp đặt điều hòa
- [ ] 3.6 Bảng giá
- [ ] 4.1 Mạng lưới 34 tỉnh (SVG + bảng)
- [ ] 4.2 Đối tác thợ (form: contract riêng)
- [ ] 5.1 Liên hệ theo bộ phận
- [ ] 6.1 Về chúng tôi — bản tối thiểu (đích 301)
- [ ] 6.2 Kiến thức — hub + 6 bài chuyển (đích 301)
- [ ] 6.3 Pháp lý 3 trang (nội dung pháp chế)
- [ ] 7.1 Khung giao diện & design system
- [ ] 7.2 Đa ngôn ngữ & SEO
- [ ] 7.3 Nội dung & số liệu
- [ ] 7.4 Đo lường, kiểm thử & vận hành

**Tổng submodule P0:** 17 / 30 (56,7%). Phân bố: P0 17 · P1 7 · P2 6.

**Effort (ước lượng `04` mục 5.1, phương án A+, chưa phải số đo):** khoảng **243,5 giờ Claude Code** cho G1–G8 (271 giờ nếu tính G0 sửa nóng site cũ), cộng khoảng **3–4 giờ** nếu anh đồng ý launch kèm bản tối thiểu 6.1/6.2 (ước của em, chưa có trong `04`). Việc người khoảng **208 giờ** + **50–80 giờ 3D artist**. Lịch khoảng 10 tuần, đường găng là duyệt style frame → 3D artist → G5 → G7 → BBNT.

---

## 6. Full Scope (P0 + P1)

Thêm **7 submodule P1**: 2.3 Hub giải pháp, 3.3 Điện máy, 3.4 Bảo trì định kỳ, 4.3 Việc đang tuyển, 4.4 Bản đồ WebGL, 5.2 Hỗ trợ khách lẻ (+ form bảo hành), 7.5 CMS Payload. Cộng các feature P1 nằm trong submodule P0: 1.2.8–1.2.10, 2.1.6, 3.6.3, 6.1.2, 6.2.2–6.2.3. **Tổng P0 + P1: 24 submodule.**

Ước lượng `04` G9 (ngoài tổng giờ launch): trang P1 KL 8 · `/mang-luoi` WebGL LM 8 · form bảo hành LM 4 · CMS LM 12 + TG 3 → khoảng **35 giờ Claude Code**, chưa tính tin tuyển và nội dung. Form bảo hành và CMS chỉ làm sau contract APPROVED.

---

## 7. Out of Scope (P2 — Phase 2)

- 1.3 Phim B/C trên trang chủ; 1.4 WebGL cho iPad/iPhone (chỉ sau 4 tuần RUM).
- 3.5 Trang lắp robot hút bụi (nội dung site cũ mô tả sai, cần viết mới).
- 5.3 `/tra-cuu` (cần API từ hệ thống điều phối, chưa kiểm chứng có API).
- 5.4 Đặt thợ B2C (chỉ khi anh chọn nhánh B, qua CR).
- 7.6 Bản JA/KO (nếu hãng mục tiêu là FDI Nhật/Hàn).
- KHANG trong phim/poster/OG (chờ văn bản quyền); Lenis; DOF/bloom; video mobile render Blender (sau launch, khi chữ/số đã khóa).
- Phương án phim Q (quay thật).

Lý do ghi rõ: để anh biết trước và mọi yêu cầu thêm đi qua CR (`rules/vn-docs.md`).

---

## 8. Tích hợp ngoài & Risks

| Tích hợp | Bắt buộc? | Risk |
|---|---|---|
| openresty (301 map, HTTPS, HSTS, h2, www) | P0 | Chưa có quyền server (R1) chặn G0/G8 |
| Search Console + access log 90 ngày | P0 | Không có quyền → kiểm kê URL chỉ dựa sitemap + crawl, rủi ro SEO cao hơn (R10) |
| Umami tự host + web-vitals RUM | P0 | Thêm dịch vụ trên server dùng chung; cần kiểm RAM |
| Asset 3D từ 3D artist (GLB, camera.json) | P0 cho phim | Trễ hoặc không đạt (R2) → launch M2, cắm phim sau |
| Pipeline Playwright + ffmpeg (texture, video, poster) | P0 (build) | SwiftShader không đo được FPS thật (R16) |
| detect-gpu benchmark tự host | P0 | Dữ liệu benchmark cũ, nhận sai GPU mới (R15) → guard FPS |
| SMTP, Cloudflare Turnstile | P0, thuộc contract form | Bên xử lý dữ liệu ngoài, pháp chế duyệt (R14) |
| Zalo OA (link) | P0 nếu có URL thật | Chưa có URL → ẩn nút |
| Google Maps | Link ngoài, không nhúng | — |
| Payload CMS + Postgres | P1 | Thêm DB, auth, backup; cần contract |
| API hệ thống điều phối Bluebolt | P2 (`/tra-cuu`) | Chưa kiểm chứng có API |

Rủi ro chính khác (`04` mục 8): số liệu/claim chưa duyệt (R8, R17) → ẩn; bản đồ chủ quyền (R7) → NFR-MAP-01 + pháp chế ký; ngân sách hiệu năng (R5) → CI chặn merge; đích 301 là trang P1 (mới phát hiện) → câu #6 của `site-shell-p0.md`.

---

## 9. Bước tiếp theo

Sau khi anh duyệt scope này và 2 contract:
1. → `/ba` viết SRS ngắn cho form B2B, form thợ và các trang B2B (G1).
2. → `/contract lead-b2b`, `/contract lead-technician` (P0), `/contract warranty-registration` (P1); phụ lục video loop hero trang con.
3. → `/dev` theo G4 (khung site) và G5 (phim), chỉ sau khi từng contract có `STATUS: APPROVED`.

---

## Checklist `/demo-scope` (đã tự soát)

- [x] Trang đầu tiên ở đầu (thay cho Dashboard, lý do ở mục 2)
- [x] Module "Hệ thống" ở cuối
- [x] 7 module chính (trong khoảng 4–10)
- [x] Mọi feature có P0/P1/P2 (`P0*` = P0 chờ phụ lục contract)
- [x] P0 ≤ 60% tổng submodule: 17/30 = 56,7%
- [x] 13 entity (trong khoảng 8–15), là mô hình nội dung, không phải DB
- [x] 6 role vận hành nội dung (runtime RBAC: N/A)
- [x] Ma trận quyền đủ ô cho mọi module × role
- [x] Out of Scope liệt kê rõ
- [x] Không có 2 module trùng nghĩa
