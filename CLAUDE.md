@AGENTS.md

# bluebolt-web — Website Bluebolt Services (lapdattoanquoc.vn)

Website B2B của CÔNG TY CỔ PHẦN CÔNG NGHỆ TIA CHỚP XANH (Bluebolt Services): mạng lưới lắp đặt điện máy toàn quốc
(phạm vi tỉnh: đọc `content/claims/`, KHÔNG tự ghi) cho Hãng, Sàn TMĐT, thợ, khách lẻ.
Concept "Bluebolt Cinematic" — **phương án phim A+ (anh Duy chọn 02/10/2026)**: shot 0 POV ban ngày → dolly-in, phòng
tối dần → screen-hold (website cuộn trên màn hình) → push-through/handoff sang HeroScreen (H2) → section "Ba cửa vào".
Bản đồ 34 tỉnh là section HTML 2.5D SAU phim. KHÔNG có KHANG trong cảnh.
Tài liệu gốc: `docs/03-DINH-HUONG-THIET-KE-3D.md`, `docs/04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md` (khác nhau thì theo 04).
Mọi quyết định và giả định: `docs/DECISIONS.md`. Đường dẫn riêng của máy (Chromium, ffmpeg): `CLAUDE.local.md` (gitignore).

## Stack (ghim chính xác, KHÔNG tự nâng — package.json không có dấu ^)
- Next.js 16.3.8 App Router + Turbopack · React 19.3.0 (GHIM <19.4 vì R3F 9.8.1) · next-intl 4.14.8
- Tailwind CSS 4.3.3 (`@theme` ở `styles/tokens.css`) · Zod 4.6.5 · lucide-react 1.49.0
- three 0.186.1 · @react-three/fiber 9.8.1 · @react-three/drei 10.7.9 (import theo đường dẫn con) · gsap 3.15.0
  (+ScrollTrigger, CHỈ trong chunk phim, import động) · detect-gpu 5.0.70 · d3-geo 3.1.1 · topojson-client 3.1.0
- TypeScript 5.9.3 · ESLint 9.39.5 + eslint-config-next 16.3.8 · Vitest 5.0.3 (+vite 8.3.2) · @playwright/test 1.62.0
  (+playwright-core 1.62.0) · @axe-core/playwright 4.13.0 · @gltf-transform/cli 4.5.1
- **Không tự `npm install`.** Mọi thao tác npm qua `scripts/safe-npm.sh` (khóa flock). Thêm/nâng gói = hỏi tech lead,
  ghim chính xác, PR riêng `chore(deps): ...`.
- Next 16 KHÁC kiến thức cũ: đọc `node_modules/next/dist/docs/` trước khi dùng API lạ (proxy.ts thay middleware.ts,
  params là Promise, `next/root-params`, `PageProps<'/[locale]/...'>`/`LayoutProps` là kiểu toàn cục sinh tự động).

## Lệnh
- Dev server DÙNG CHUNG đã chạy sẵn: `http://127.0.0.1:3091` (systemd user `bluebolt-web-dev`, DRAFT_PREVIEW=1).
  KHÔNG chạy `npm run dev` thứ hai. Sửa next.config.ts → `systemctl --user restart bluebolt-web-dev`.
- `npm run typecheck` (next typegen + tsc) · `npm run lint` · `npm run test` (Vitest, tests/unit)
- `scripts/safe-build.sh` — build production có khóa flock, distDir `.next-check-<pid>`, in bảng JS tải đầu mỗi route.
  `SAFE_BUILD_CLEAN=1` để tự xóa; `DRAFT_PREVIEW=1` / `DEV_PAGES=1` / `STAGING=1` (thêm X-Robots-Tag noindex) phải đặt
  LÚC BUILD (trang tĩnh và header được đóng băng khi build). KHÔNG gọi `next build` trực tiếp.
- Xem bản build: `NEXT_DIST_DIR=.next-check-<pid> PORT=3092 npm run start` (127.0.0.1:3092). Xong thì dừng theo PID.
- Playwright (chạy trên dev server; `BASE_URL=http://127.0.0.1:3092` cho bản build; tối đa 2 worker):
  `npm run test:overflow` (9 bề rộng × mọi route × VI/EN) · `npm run test:seo` · `npm run test:a11y` · `npm run test:e2e` (tất cả)
  Chỉ chạy route của mình: `ONLY_ROUTES=partners,support npm run test:seo`.
- Ảnh tự soát: `npm run shot -- --routes partners --locales vi,en --widths 360,390,1440 --mode slices`
  → `.cache/shots/*.png`, rồi MỞ ẢNH RA XEM (Read) trước khi báo xong. Danh sách route: `/dev/routes`.
- `npm run budget` — CHƯA KIỂM GÌ (agent QA sẽ viết check-budgets.mjs + budgets.json).

## Cây thư mục và khu vực phụ trách (`lib/routes.ts` → OWNERS)
```
app/[locale]/…            trang (khóa route = thư mục tiếng Việt; slug EN ở i18n/routing.ts)
app/[locale]/dev/ui       UI kit (noindex, chỉ dev hoặc DEV_PAGES=1) · dev/routes: danh mục route
components/ui/            primitive (nền móng) · components/motion/ (nền móng) · components/layout/ (nền móng)
components/film/          Agent phim (FilmHero là STUB, giữ props) · components/map/ Agent bản đồ (VietnamMap STUB)
content/                  nội dung là code + Zod (chủ sở hữu từng file: content/README.md)
messages/{vi,en}/*.json   chữ giao diện theo namespace (bảng dưới)
lib/                      routes (nguồn route duy nhất), seo, claims, env, format, tokens, cn
i18n/                     routing (pathnames), navigation, request, messages, static-params, params
styles/tokens.css         design tokens DUY NHẤT · app/globals.css: base, tông bề mặt, motion engine, header phim, prose
tests/unit/*.test.ts      Vitest · tests/*.spec.ts Playwright · scripts/ safe-build, safe-npm, shot, route-sizes
contracts/, docs/SCOPE-P0.md, docs/SRS-LEADS.md   agent contract (đừng sửa nếu không được giao)
reference/prototype/      prototype Vite CHỈ ĐỌC (không build, không import)
```
Khu vực: **film** (Agent phim) · **map** (Agent bản đồ) · **b2b** (trang chủ sau phim, /giai-phap/*, /dich-vu/*, /bang-gia)
· **partner** (/doi-tac-tho, /ho-tro-khach-hang, /ve-chung-toi, /lien-he, 3 trang pháp lý) · **seo** (/kien-thuc/*, EN,
sitemap/robots/JSON-LD/301/410) · **qa** (tests, budget, Lighthouse) · **foundation** (ui, layout, motion, lib, i18n, styles).
Chỉ sửa file thuộc khu vực của mình. Cần đổi file dùng chung (primitive, layout, lib, i18n, tokens) → ghi rõ trong
báo cáo/PR, giữ tương thích ngược, chạy lại typecheck + test + overflow.

## Route (nguồn duy nhất: `lib/routes.ts` + `i18n/routing.ts`)
- Thêm trang: (1) thêm khóa vào `routing.pathnames` (VI → EN), (2) thêm `PAGE_META` trong `lib/routes.ts` (thiếu → typecheck
  lỗi), (3) tạo `app/[locale]/<đường-dẫn-vi>/page.tsx` theo mẫu bên dưới. Sitemap, test tràn ngang, test SEO, /dev/routes,
  nút VI|EN tự nhận route mới.
- Mỗi `page.tsx`:
  ```tsx
  export const generateStaticParams = localeStaticParams;                 // cả vi và en
  export async function generateMetadata({ params }: PageProps<'/[locale]/bang-gia'>) {
    const locale = await resolveLocale(params);
    const t = await getTranslations({ locale, namespace: 'pricing' });
    return buildMetadata({ routeKey: 'pricing', locale, title: t('meta.title'), description: t('meta.description') });
  }
  ```
  Đúng MỘT `<h1>` mỗi trang (trang chủ: H1 ở FilmHero). Route động (`/dich-vu/[slug]`, `/kien-thuc/[slug]`) dùng slug
  theo ngôn ngữ từ `content/services.ts` / `content/articles.ts`, `dynamicParams = false`.
- Link nội bộ: `Link`/`Button href`/`TextLink href` với đường dẫn NỘI BỘ tiếng Việt (`'/doi-tac-tho'`,
  `{ pathname: '/dich-vu/[slug]', params: { slug } }`) — next-intl tự đổi sang `/en/technician-partners`. Không viết tay `/en/...`.
- Đổi URL đã công khai → thêm dòng 301 vào `content/redirects.ts`.

## i18n và nội dung
- VI không tiền tố, EN `/en` + slug tiếng Anh. KHÔNG tự chuyển hướng theo cookie/Accept-Language; không có cookie NEXT_LOCALE.
- Chữ giao diện ở `messages/<locale>/<namespace>.json`, KHÓA GIỐNG HỆT ở vi và en (test kiểm). Namespace ↔ chủ sở hữu:
  `common` `errors` (nền móng) · `home` `solutions` `services` `pricing` (b2b) · `film` (phim) · `network` (bản đồ) ·
  `partners` `support` `about` `contact` `legal` (partner) · `knowledge` (seo). Thêm namespace: `i18n/messages.ts` + `i18n/types.ts`.
- Khóa messages có kiểu chặt: `t('nav.sai')` → typecheck lỗi. Client component chỉ có namespace `common` và `errors`;
  chữ khác truyền từ Server Component qua props.
- Không chuỗi tiếng Việt trong messages EN (test dò dấu). Tên pháp nhân không dịch, lấy từ `content/site.ts`.
- Hotline: VI `0902 808 049` · EN `+84 902 808 049` (`site.hotline`). Giọng văn: sentence case, không "?!", "!!", emoji.
- Mọi số liệu đọc từ `content/stats.ts` (`getStat`, `statsWithValue`). `value: null` → `KpiTile` không render. KHÔNG bịa số.
- Câu khẳng định (34 tỉnh, chuẩn hãng, E-KYC, bảo hành, 24/7…) CHỈ qua `claim(id, locale)` (`lib/claims.ts`):
  ```tsx
  const c = claim('coverage.provinces-34', locale);          // null ở production nếu chưa approved
  {c && <p>{c.text}{c.draft && <DraftBadge />}</p>}
  ```
  Claim mới: thêm vào `content/claims/<khu-vuc>.ts` (status "draft", evidence, note) và gom ở `content/claims/index.ts`.
- `DRAFT_PREVIEW=1` (dev server dùng chung đang bật): hiện nội dung draft kèm nhãn "Nháp" (`<DraftBadge/>`,
  `<Badge variant="draft">`). Production build không có cờ → draft ẩn hẳn. Cờ đọc ở server (`lib/env.ts`), lúc build.

## Design system (docs/03 mục 11–12) — chỉ dùng token
- Màu: CHỈ tên trong `styles/tokens.css` (palette mặc định của Tailwind đã xóa). Cam `orange-500` chỉ làm NỀN (chữ navy-900
  trên đó); chữ cam: `orange-700` trên nền sáng, `orange-200` trên navy. `slate-500` chỉ trên nền trắng.
- Chữ: `text-display` `text-h1` (thêm `font-display`, weight 700) · `text-h2` `text-h3` `text-lead` `text-body` `text-small`
  · `eyebrow` (utility, VIẾT HOA) · `text-kpi` + `tabular`. Bo: `rounded-sm|md|lg|xl|pill`. Bóng: `shadow-1|2|3`.
  Khoảng cách bội 4 (`p-1`=4px … `p-32`=128px), `px-gutter`, `py-section`. Easing `ease-entry|glide|standard`,
  thời lượng `duration-(--dur-fast|base|medium|slow)`.
- Primitive (`components/ui`): `Section tone="light|blue-50|navy" spacing="default|compact|none" container="content|bleed|text"|false`
  (đặt `data-tone` → chữ/link/eyebrow/focus ring tự đổi) · `Container size` · `Heading level size` · `Eyebrow` ·
  `Button variant="primary|blue|ghost|on-dark" size="sm|md|lg"` + `href` (nội bộ) | `externalHref` (tel/mailto/https/#id) | không
  (button) · `TextLink variant="inline|arrow"` · `IconButton label` · `Card tone padding interactive` · `Chip` · `Badge
  variant="info|warranty|success|danger|draft|illustration"` · `DraftBadge` · `Field` + `TextInput|TextArea|Select` (CHỈ trình bày)
  · `KpiTile` · `Prose` · `TableScroll label` (bảng rộng cuộn ngang trong khung, focus được). Xem tất cả ở `/dev/ui`.
- `className` của primitive chỉ cho bố cục (margin, width, grid). Ẩn/hiện theo breakpoint dùng `max-md:hidden`,
  `max-xl:hidden` (KHÔNG `hidden md:flex` trên primitive đã có display — Tailwind không gộp class xung đột).
- Phần tử trang trí `absolute` phải nằm trong wrapper `overflow-clip`. Mọi trang phải qua `npm run test:overflow`.

## Header, vùng phim, stub
- Header dùng chung ở root layout. Trang có phần tử `[data-film-zone]` → header trong suốt chữ trắng, qua khỏi vùng đó thì
  nền trắng có bóng (CSS `:has()` + `HeaderObserver`, không setState khi cuộn). Phim A+: đặt `data-film-zone` lên CẢ track cuộn.
- `components/film/FilmHero.tsx` — STUB. Agent phim thay ruột, GIỮ props `FilmHeroProps` { locale, eyebrow ({text, draft}|null),
  title (H1), lead, primaryCta, secondaryCta ({label, href}), skipLabel, skipTargetId='ba-cua-vao' }. Link "Bỏ qua phần giới
  thiệu ↓" đứng ĐẦU trong DOM (focus đầu tiên sau header), hiển thị dưới CTA. Đích handoff: `<section id="ba-cua-vao">` (H2).
- `components/map/VietnamMap.tsx` — STUB khung cố định 3:4. Agent bản đồ GIỮ props { locale, variant='home'|'network', title,
  className }. NFR-MAP-01: Hoàng Sa, Trường Sa luôn trong khung, nhãn ≥ 11px (`content/provinces.ts` → archipelagos).

## Ngân sách (CI fail khi QA cài check-budgets — nguồn: docs/04 mục 7.1)
- JS tải đầu mỗi route ≤ 170 KB gz. Hiện tại (02/10/2026): 156,8–157,6 KB gz (`scripts/safe-build.sh` in bảng). GSAP/three
  KHÔNG được vào first-load: chỉ import động trong chunk phim.
- Chunk 3D ≤ 290 KB gz (chỉ T-FULL/T-LITE; import sau ý định đầu tiên hoặc load + 2 s rảnh, KHÔNG ở lần render đầu).
- Trang chủ mobile trước khi cuộn ≤ 600 KB byte truyền. Phim desktop T-FULL ≤ 2,2 MB · T-LITE ≤ 1,4 MB · shot 0–1 ≤ 1,2 MB.
- Video tua mobile ≤ 110 KB/s phim, 540×960, GOP ≤ 8, shot đầu ≤ 400 KB. Poster ≤ 150 KB desktop / ≤ 90 KB mobile (AVIF).
- Font: chỉ 1 file preload (Be Vietnam Pro 700 vietnamese). Không thêm weight/họ font.

## Luật cảnh 3D và máy quay (Agent phim — KHÔNG vi phạm)
1. HTML là nội dung. Mọi chữ/số/CTA trong DOM render từ server. Canvas `aria-hidden="true"`.
2. LCP = H1 hoặc poster, server render và HIỆN mặc định. Ẩn lớp chuyển giao chỉ bằng class `.film-armed` thêm sau hydrate;
   KHÔNG inline `opacity:0` trong HTML server. HeroScreen và "Ba cửa vào" dùng H2. Canvas không bao giờ là LCP.
3. Đường máy CHỈ đọc từ `motion/camera.json` + `motion/camera.ts`. Không hardcode vị trí camera trong scene.
4. Máy chỉ di chuyển khi cuộn (scrub). Handheld chỉ khi đang cuộn, tắt dần 1,5 s; đứng yên thì không vẽ.
5. Khung establish nghiêng 2–4°, về 0° trước khi màn hình chiếm khung; roll handheld ≤ 0,5°. Mỗi shot 1 cú máy chính.
6. Chữ không chuyển động cùng máy; đoạn dừng đọc 20–30 vh cuối mỗi shot.
7. Một `<Canvas frameloop="demand">` cho cả phim; ra khỏi vùng phim → `frameloop="never"` + giải phóng texture lớn.
8. `webglcontextlost` → T-STILL ở đúng khung. Guard FPS p90 > 25 ms trong 2 s ĐANG CUỘN → hạ tầng.
9. Tầng T-FULL/T-LITE (WebGL) · T-SEQ (video tua, màn dọc/nhỏ) · T-STILL (poster). Chọn theo renderer thật; thiếu API = máy yếu.
   T-SEQ/T-STILL KHÔNG tải three/GLB; T-STILL không tải video. Cấm tải/biên dịch shader khi tiến độ đang đổi.
10. Không lưu tiến độ cuộn trong React state: ghi vào store/ref, đọc trong `useFrame`.
11. Không logo/kiểu dáng hãng thật; số trên màn hình trong cảnh gắn "minh họa"; claim chưa duyệt không vào texture.
12. KHANG: TẮT ở mọi bản, poster, OG (quyền chưa xác nhận). Lenis: TẮT.
13. Handoff: HeroScreen dùng đơn vị `--u = min(1vw, 1.7778vh)`; texture màn hình lớn = ảnh chụp chính component.

## Motion ngoài phim (`components/motion`, không GSAP)
- `Rise` · `Curtain` · `StaggerGrid` = thuộc tính data, MỘT IntersectionObserver (`MotionRuntime`). `CountUp`: số cuối có sẵn
  trong HTML, cập nhật textContent qua rAF, không setState mỗi frame.
- KHÔNG bọc: H1, phần tử LCP, nội dung màn đầu của trang con, giá, hotline, nội dung pháp lý, trường form, thông báo lỗi.
- Chỉ animate transform/opacity/clip-path. Không loop vô hạn. Reduced-motion/Save-Data/không JS: mọi thứ hiện ngay
  (`html[data-motion]` pending → ready; tự "off" sau 4 s nếu JS lỗi).

## Phần động — contract-first (KHÔNG exception)
- Form lead (B2B, thợ, bảo hành), API, DB, CMS, `/tra-cuu`: KHÔNG code khi `contracts/<feature>.md` chưa có `STATUS: APPROVED`.
  Hiện tại CTA "Nhận báo giá" → `/lien-he#kinh-doanh`, "Đăng ký thợ" → `/doi-tac-tho#dang-ky` (`QUOTE_HREF`, `TECHNICIAN_SIGNUP_HREF`).
- API theo rules công ty: `/api/v1/...`, `{ success, data | error{code,message,details} }`, Zod, honeypot + Turnstile + rate-limit,
  correlationId, KHÔNG log SĐT/tên/email, consent theo Luật BVDLCN 91/2025 (câu chữ do pháp chế viết).

## Git (làm local, một cây làm việc, nhiều agent song song)
- Nhánh tích hợp: `feat/s1-1.4-p0-build` (tách từ `develop`). Không push `main`/`develop`, không `--force`, không rebase nhánh chung.
- CHỈ `git add <đường dẫn mình sửa>` — KHÔNG `git add -A`/`git add .`/`git commit -a` (agent khác đang có file chưa commit).
- Conventional Commits, scope: `web` | `film` | `content` | `i18n` | `seo` | `infra` | `test` | `docs` (subject tiếng Anh,
  động từ nguyên thể, ≤ 72 ký tự). Commit theo từng mốc nhỏ.

## Definition of Done (mỗi phần việc)
- [ ] `npm run typecheck`, `npm run lint`, `npm run test` xanh; `scripts/safe-build.sh` xanh (ghi JS tải đầu của route đã chạm)
- [ ] `ONLY_ROUTES=<route của mình> npm run test:overflow` + `test:seo` + `test:a11y` xanh trên dev server
- [ ] Ảnh `npm run shot` ở 390 và 1440 (VI + EN) đã MỞ RA XEM và sửa đến khi đúng token
- [ ] Không số liệu/chuỗi hardcode ngoài `content/` và `messages/`; claim đi qua `claim()`
- [ ] Nếu chạm phim: số đo JS/GLB/draw call + khung 01–06; nếu chạm phần động: link contract APPROVED

## Không được
- Mở cổng ra Internet, bind 0.0.0.0, chạy `next dev` thứ hai, `next build` không qua safe-build, `pkill` theo tên tiến trình
  (máy có nhiều next-server: dừng theo PID và kiểm `readlink /proc/<PID>/cwd`).
- Commit `.env*`, khóa, credential, `CLAUDE.local.md`, file có KHANG.
- Spline runtime, model-viewer, CDN ngoài cho decoder/font; logo hãng khi chưa có văn bản.
- Tự trả lời câu hỏi mở (số liệu thật, SLA, B2C, quyền logo/KHANG): ghi "giả định, chờ anh Duy" và đưa vào `docs/DECISIONS.md`.

## Hành vi đã biết của Next 16.3.8 (chi tiết: docs/DECISIONS.md)
- Dev/preview chạy `-H localhost` (không phải `-H 127.0.0.1`): với `-H 127.0.0.1`, rewrite của next-intl bị coi là rewrite ra
  ngoài → 307 về chính nó. `localhost` trên bbsw = 127.0.0.1 nên vẫn chỉ loopback. Deploy phải kiểm lại (D-09).
- `notFound()` trong page: HTML server là shell lỗi + mã 404 + noindex; nội dung not-found (có header/footer) do client render (D-10).
