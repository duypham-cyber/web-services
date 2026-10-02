# Bàn giao nền móng (02/10/2026)

> Báo cáo của agent nền móng khi kết thúc. Quy ước chính thức nằm ở CLAUDE.md; file này là ảnh chụp trạng thái lúc bàn giao.

**Báo cáo nền móng bluebolt-web — 02/10/2026**

Nền móng đã dựng xong và mọi kiểm tra đều xanh. Có hai chỗ tôi làm khác chỉ thị vì lỗi thật của Next 16.3.8 (mục 7).

**Repo:** `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/bluebolt-web`, nhánh tích hợp `feat/s1-1.4-p0-build` (tách từ `develop` ← `main`), 12 commit. Chưa merge, đúng yêu cầu. Các file của agent contract (`contracts/*.md`, `docs/SCOPE-P0.md`, `docs/SRS-LEADS.md`) vẫn để nguyên, chưa commit, không sửa.

**Dev server dùng chung:** `http://127.0.0.1:3091`, user unit `~/.config/systemd/user/bluebolt-web-dev.service`. Unit đang enabled và active, `DRAFT_PREVIEW=1`, `MemoryMax=3G`, chỉ lắng nghe trên 127.0.0.1.

## 1. Cây thư mục chính
```
app/[locale]/              layout (root), page (trang chủ), not-found, error, [...rest], 20 trang khung, dev/ui, dev/routes
components/ui/             Button Card Chip Badge DraftBadge Field(+TextInput/TextArea/Select) Section Container Heading
                           Eyebrow KpiTile TextLink IconButton Prose TableScroll
components/motion/         Rise Curtain StaggerGrid CountUp MotionRuntime MotionBootScript
components/layout/         Header SolutionsMenu NavLink LocaleSwitch MobileMenu MobileActionBar HeaderObserver Footer SkipLink Logo PagePlaceholder
components/film/FilmHero.tsx (STUB) · components/map/VietnamMap.tsx (STUB)
content/                   site stats claims/{index,core} process sla provinces services articles redirects schemas validate README.md
lib/                       routes seo claims env format tokens cn
i18n/                      routing navigation request messages types static-params params
messages/{vi,en}/          14 namespace
styles/tokens.css · app/globals.css · proxy.ts · next.config.ts
tests/unit/ (Vitest) · tests/{overflow,seo-render,a11y}.spec.ts · scripts/{safe-build.sh,safe-npm.sh,shot.mjs,route-sizes.mjs}
docs/00–04 (bản sao), docs/DECISIONS.md · reference/prototype (chỉ đọc, đã bỏ mọi file có KHANG) · CLAUDE.md · CLAUDE.local.md (gitignore)
```

## 2. Quy ước bắt buộc (chi tiết trong `CLAUDE.md`)

**Git**
- Chỉ `git add` đúng đường dẫn mình sửa. Không `git add -A`, không `commit -a`, không rebase hay force push nhánh chung.
- Scope commit: `web|film|content|i18n|seo|infra|test|docs`.

**npm và build**
- npm chỉ qua `scripts/safe-npm.sh`.
- Build chỉ qua `scripts/safe-build.sh`. Script có khóa flock, build vào `.next-check-<pid>`, in bảng JS tải đầu từng route.
- Cờ `SAFE_BUILD_CLEAN=1` để tự xóa thư mục build. `DRAFT_PREVIEW`, `DEV_PAGES`, `STAGING` phải đặt lúc build.
- Xem bản build: `NEXT_DIST_DIR=<dist> PORT=3092 npm run start`.

**Route**
- Nguồn duy nhất là `lib/routes.ts` cùng `pathnames` trong `i18n/routing.ts`.
- Thêm trang theo 3 bước: thêm khóa pathnames, thêm `PAGE_META` (thiếu thì typecheck lỗi), tạo `page.tsx`.
- Mỗi page phải có:
  - `generateStaticParams = localeStaticParams`
  - `generateMetadata` gọi `buildMetadata({routeKey, locale, title, description})`
  - đúng một `<h1>`
- Link dùng đường dẫn nội bộ tiếng Việt, ví dụ `'/doi-tac-tho'` hoặc `{pathname:'/dich-vu/[slug]', params}`.

**Messages**
- Khóa ở `vi` và `en` phải giống hệt nhau, có kiểu chặt (gõ sai khóa là typecheck lỗi).
- Chủ sở hữu namespace:

| Namespace | Khu vực |
|---|---|
| `common`, `errors` | nền móng |
| `home`, `solutions`, `services`, `pricing` | b2b |
| `film` | phim |
| `network` | bản đồ |
| `partners`, `support`, `about`, `contact`, `legal` | partner |
| `knowledge` | seo |

- Client component chỉ có `common` và `errors`. Chữ khác truyền từ server qua props.

**Claims và DRAFT_PREVIEW**
- Câu khẳng định chỉ lấy qua `claim(id, locale)`. Hàm trả `null` ở production nếu claim chưa approved.
- Ở bản xem trước hàm trả `{text, draft: true}`, và trang phải gắn `<DraftBadge/>`.
- Claim mới đặt ở `content/claims/<khu-vuc>.ts`.
- KPI lấy từ `content/stats.ts` (hiện tất cả `null`). `KpiTile` tự ẩn khi giá trị là `null`.

**Section và Button**
- `Section tone="light|blue-50|navy" spacing="default|compact|none" container="content|bleed|text"|false`. Section đặt `data-tone`, chữ, link và focus ring tự đổi theo nền.
- `Button variant="primary|blue|ghost|on-dark" size="sm|md|lg"`, nhận `href` (nội bộ, qua next-intl), hoặc `externalHref` (tel, mailto, https, #id), hoặc không có gì (thành `button`).
- Ẩn hoặc hiện primitive theo breakpoint thì dùng `max-md:hidden`, không dùng `hidden md:flex`.

**Stub giữ chữ ký props**
- `FilmHeroProps`: `{ locale, eyebrow: {text, draft}|null, title (H1), lead, primaryCta, secondaryCta: {label, href}, skipLabel, skipTargetId='ba-cua-vao' }`.
- Link "Bỏ qua phần giới thiệu" đứng đầu trong DOM nhưng hiển thị dưới CTA. Section đích `#ba-cua-vao` dùng H2.
- Phim A+ phải đặt `data-film-zone` lên cả track cuộn để header tự chuyển trong suốt.
- `VietnamMapProps`: `{ locale, variant: 'home'|'network', title, className }`. Khung cố định tỉ lệ 3:4.

**Motion**
- `Rise`, `Curtain`, `StaggerGrid`, `CountUp`, không dùng GSAP.
- Không bọc H1, phần tử LCP, giá, hotline, nội dung pháp lý, form.

**Tự soát và test**
- Chụp: `npm run shot -- --routes <key> --locales vi,en --widths 390,1440 --mode slices`, ảnh ra `.cache/shots`, phải mở ảnh xem trước khi báo xong.
- Chạy test riêng route của mình: `ONLY_ROUTES=<key,...> npm run test:overflow|test:seo|test:a11y`.

## 3. Route VI ↔ EN

| Khóa | VI | EN | Ưu tiên · Khu vực |
|---|---|---|---|
| home | `/` | `/en` | P0 · b2b + film |
| solutions | `/giai-phap` | `/en/solutions` | P1 · b2b |
| solutions.brands | `/giai-phap/hang-dien-may` | `/en/solutions/appliance-brands` | P0 · b2b |
| solutions.retail | `/giai-phap/san-tmdt-ban-le` | `/en/solutions/marketplaces-retail` | P0 · b2b |
| services | `/dich-vu` | `/en/services` | P0 · b2b |
| services.* (4 trang) | `/dich-vu/lap-dat-dieu-hoa`, `lap-dat-dien-may`, `bao-tri-dinh-ky`, `lap-dat-robot-hut-bui` | `/en/services/air-conditioner-installation`, `appliance-installation`, `scheduled-maintenance`, `robot-vacuum-installation` | P0 / P1 / P1 / P2 · b2b |
| pricing | `/bang-gia` | `/en/pricing` | P0 · b2b |
| network | `/mang-luoi` | `/en/network` | P0 · map |
| partners | `/doi-tac-tho` | `/en/technician-partners` | P0 · partner |
| support | `/ho-tro-khach-hang` | `/en/customer-support` | P1 · partner |
| about | `/ve-chung-toi` | `/en/about` | P1 · partner |
| knowledge | `/kien-thuc` | `/en/knowledge` | P1 · seo |
| knowledge.* (6 bài) | `/kien-thuc/<slug cũ>` | `/en/knowledge/<slug EN mới>` | P1 · seo |
| contact | `/lien-he` | `/en/contact` | P0 · partner |
| legal.* (3 trang) | `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`, `/chinh-sach-bao-hanh` | `/en/privacy-policy`, `/en/terms`, `/en/warranty-policy` | P0 · partner |
| dev.* | `/dev/ui`, `/dev/routes` | `/en/dev/...` | dev, noindex, 404 ở production |

URL cũ: 30 dòng 301 (`statusCode: 301`), 2 dòng 410 (bài AI, giả định Q10), 4 dòng giữ nguyên.

## 4. Kết quả kiểm

| Kiểm | Kết quả |
|---|---|
| `npm run typecheck` (next typegen + tsc) | 0 lỗi |
| `npm run lint` | 104 file, 0 lỗi, 0 cảnh báo |
| `npm run test` (Vitest) | 120/120, gồm tương phản WCAG của 22 cặp bảng 11.1 (±0,02) và 2 cặp cấm |
| `scripts/safe-build.sh` | xanh trong 25 s, 56 trang prerender |
| `npm ls --all` | không lỗi peer |
| Playwright trên dev | 270/270 trong 8,0 phút: overflow 54 (route × ngôn ngữ × 9 bề rộng), SEO 108, axe 108 |
| Playwright trên bản production | 250/250: SEO 100, overflow 50, axe 100 |
| curl | 54 đường dẫn VI/EN trả 200 trên dev; 50 trên production; 404, 301, 410 đúng; có header bảo mật; không `X-Powered-By`, không `Set-Cookie` |

Ảnh `/dev/ui` và trang chủ ở 390 và 1440 (thêm 768 và 1024) đã mở ra xem và sửa:
- scrim ở 1024 để chữ không đè lên màn hình sáng của poster;
- header căn đúng lưới 1280;
- Curtain hiện đúng;
- chuỗi "ẦẪỆ Ước Hưởng" ở mọi cỡ heading không chạm dấu.

## 5. JS tải đầu (gzip -9, đo từ HTML prerender)
- Trang chủ VI/EN: 157,6 KB.
- Mọi trang con: 156,9 KB. Ngân sách là 170 KB.
- CSS 8,7 KB, HTML 20,6–28,4 KB.
- Chỉ đúng 1 file font được preload (Be Vietnam Pro 700, subset vietnamese).

## 6. Giả định đã ghi trong `docs/DECISIONS.md` (D-01 đến D-18)
- A+ ngày 02/10/2026; KHANG tắt; Lenis tắt.
- B2C nhánh A; tagline T1; Umami chưa cài; không logo hãng.
- Mọi claim và SLA là draft, mọi KPI là `null`.
- Địa chỉ lấy nguyên văn site cũ (đã ở dạng sau sắp xếp 2025), cần đối chiếu ĐKDN. Zalo để draft. 34 tỉnh chia 3 miền là giả định.
- Logo lấy từ site cũ; bản nền tối là biến thể tự tô.
- Footer mobile dùng lưới 2×2 thay accordion; menu đầy đủ chỉ hiện từ 1280px.

## 7. Chỗ làm khác chỉ thị
- **Script `dev` và `start` dùng `-H localhost` thay cho `-H 127.0.0.1`.** Với 127.0.0.1, Next 16.3.8 coi rewrite của next-intl là rewrite ra ngoài, nên mọi URL VI không tiền tố và mọi slug EN trả 307 về chính nó. Đã tái hiện và đọc mã nguồn Next (D-09). Trên bbsw `localhost` chỉ trỏ tới 127.0.0.1, `ss` xác nhận vẫn chỉ bind loopback. Thêm `allowedDevOrigins: ['127.0.0.1']`. **Lúc deploy bắt buộc kiểm** `curl -I http://127.0.0.1:<port>/doi-tac-tho` trả 200.
- **Thêm 2 gói ngoài danh sách:** `vite` 8.3.2 (peer bắt buộc của Vitest 5) và `playwright-core` 1.62.0 (nếu không, axe kéo bản 1.63, lệch Chromium 1234).
- **TypeScript 5.9.3 và ESLint 9.39.5**, không lấy bản mới nhất, vì peer của eslint-config-next 16.3.8 không nhận bản mới hơn.
- **Trang 404:** khi page gọi `notFound()`, Next 16.3.8 trả HTML là shell lỗi kèm mã 404 và noindex; nội dung 404 (có header, đúng ngôn ngữ) do client render. Đã tái hiện y hệt trên một app Next tối giản riêng, tức là hành vi của Next, không phải lỗi app (D-10).

## 8. Việc còn dở cho các agent khác
- **Phim:** phim A+ thay ruột FilmHero, poster AVIF thật, `motion/camera.json`.
- **Bản đồ:** SVG từ `public/data/vn34.topo.json` và bảng 34 tỉnh.
- **SEO:** `sitemap.ts`, `robots.ts`, JSON-LD, ảnh OG, nội dung 6 bài viết, kiểm kê thêm URL cũ.
- **QA:** `check-budgets.mjs` và `budgets.json` (`npm run budget` hiện chưa kiểm gì), Lighthouse CI, test trên máy thật.
- **Trang B2B và partner:** nội dung thật thay các trang khung (ghi chú dựng trang chỉ hiện ở dev và bản xem trước).
- **Form, API, DB, CMS, `/tra-cuu`:** chờ contract APPROVED.

File quan trọng (thư mục gốc `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/bluebolt-web/`):
- `CLAUDE.md`
- `docs/DECISIONS.md`
- `content/README.md`
- `lib/routes.ts`
- `i18n/routing.ts`
- `styles/tokens.css`
- `components/film/FilmHero.tsx`
- `components/map/VietnamMap.tsx`
- `scripts/safe-build.sh`