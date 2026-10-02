# Nhật ký quyết định — bluebolt-web

Ghi mọi lựa chọn có ảnh hưởng (phạm vi, kỹ thuật, quy trình) kèm ngày, người chốt, lý do. Quyết định của anh Duy ghi
"Anh Duy"; mặc định do tech lead áp dụng khi chưa có câu trả lời ghi "Mặc định (chờ anh Duy)" — anh đổi được bất cứ lúc nào.
Mã câu hỏi Q1–Q20 theo `docs/04` mục 9.

## Phạm vi và sản phẩm

### D-01 · 02/10/2026 · Anh Duy chọn phim A+ và yêu cầu build
Phim trang chủ theo phương án **A+** (`docs/03` mục 9, 13.2): shot 0 POV người ngồi, phòng sáng ban ngày → shot 1 dolly-in,
phòng tối dần (exposure ramp) → **screen-hold** (website cuộn trên màn hình trong cảnh) → push-through/handoff sang
HeroScreen (H2) → section "Ba cửa vào". Bản đồ 34 tỉnh là **section HTML 2.5D sau phim**, không phải shot trong phim.
**Không có KHANG trong cảnh.** Giải quyết Q2.

### D-02 · 02/10/2026 · Mặc định cho câu hỏi chưa trả lời (Mặc định, chờ anh Duy)
| Chủ đề | Mặc định đang áp dụng | Câu hỏi |
|---|---|---|
| Vai trò B2C | Nhánh A: không nhận đơn B2C trực tiếp. CTA chính "Nhận báo giá cho doanh nghiệp", phụ "Đăng ký làm đối tác thợ". Khách lẻ: `/ho-tro-khach-hang` | Q4 |
| Smooth scroll | Lenis TẮT (cuộn native + GSAP scrub trong chunk phim) | Q9 |
| CMS | Nội dung là code (`content/*.ts` + Zod). Payload CMS là P1, chỉ qua contract | Q11 |
| Số liệu, khẳng định | Chưa duyệt thì KHÔNG hiển thị ở production. Bản xem trước (`DRAFT_PREVIEW=1`) hiện kèm nhãn "Nháp" | Q5, Q19 |
| Analytics | Umami tự host (chưa cài, không cookie, không banner) | Q12 |
| Logo hãng/sàn | Không dùng cho tới khi có văn bản đồng ý | Q6 |
| Tagline H1 | T1 "Hạ tầng lắp đặt toàn quốc cho hãng điện máy" / "Vietnam's nationwide installation network for appliance brands" | Q15 |
| Slug | Không dấu, EN có slug riêng; bài AI trả **410** (VI + EN) | Q10 |
| Handoff | Handoff thật sau pha giữ khung (agent phim) | Q8 |
| T-SEQ mobile | Video H.264 540×960, GOP ≤ 8 (agent phim đo lại trên máy thật) | Q7 |

### D-03 · 02/10/2026 · KHANG tắt hoàn toàn
Không có trong cảnh, poster, ảnh OG, 404. `reference/prototype/` cố ý không chép `khang.glb`, `hero-mobile.mp4`,
`poster*.jpg` (đều có KHANG, quyền chưa xác nhận — `docs/04` R9). Poster tạm của FilmHero là hình vector dựng bằng token.

### D-04 · 02/10/2026 · Phần động chưa làm (contract-first)
Form gửi lead (B2B, thợ, bảo hành), API, DB, CMS, `/tra-cuu`: chưa code cho tới khi `contracts/<feature>.md` có
`STATUS: APPROVED`. Trong lúc chờ: nút "Nhận báo giá" → `/lien-he#kinh-doanh`, "Đăng ký thợ" → `/doi-tac-tho#dang-ky`
(hằng `QUOTE_HREF`, `TECHNICIAN_SIGNUP_HREF` ở `components/layout/Header.tsx`). `Field` chỉ có phần trình bày.

### D-05 · 02/10/2026 · Câu khẳng định: không làm build fail vì claim nháp (diễn giải `docs/04` G4)
`docs/04` G4 ghi "build production fail nếu còn claim chưa duyệt bị tham chiếu". Hiện MỌI claim đều là nháp, làm vậy sẽ chặn
mọi agent. Thay bằng ba lớp: (1) id claim có kiểu chặt — gõ sai là typecheck lỗi; (2) production không bao giờ render claim
nháp (`lib/claims.ts`, có unit test); (3) agent QA thêm cổng "không còn claim nháp trên trang P0" trước BBNT.

### D-06 · 02/10/2026 · Địa chỉ, Zalo, vùng (giả định, chờ anh Duy)
- Địa chỉ "100 Nguyễn Văn Lượng, Phường Gò Vấp, TP. Hồ Chí Minh" lấy nguyên văn site cũ (`research/raw/contact.txt`); đã ở
  dạng sau sắp xếp đơn vị hành chính 01/07/2025. Cần đối chiếu Giấy chứng nhận ĐKDN mới nhất.
- Zalo `https://zalo.me/0902808049` để `draft` (chưa xác nhận Zalo/Zalo OA chính thức): production ẩn nút Zalo.
- 34 tỉnh chia 3 miền (Bắc 15 · Trung + Tây Nguyên 11 · Nam 8) — cách chia vùng SLA thật do vận hành quyết.
- Hai bài robot gộp vào `robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai`; 6 bài còn lại giữ slug VI.

## Quy trình làm việc

### D-07 · 02/10/2026 · Một cây làm việc, nhánh tích hợp, nhiều agent song song
Repo làm local (chưa có remote/CI). Nhánh: `main` → `develop` → **`feat/s1-1.4-p0-build`** (nhánh tích hợp). Nhiều agent
làm song song trong CÙNG một cây làm việc, trên các thư mục tách biệt (khu vực phụ trách: `lib/routes.ts` OWNERS và CLAUDE.md),
commit thẳng vào nhánh tích hợp. Lý do: dev server dùng chung (127.0.0.1:3091) phục vụ đúng một cây làm việc; worktree riêng
cho từng agent sẽ cần thêm dev server/`node_modules` (máy chỉ 8,7 GB RAM). Quy tắc kèm theo:
- Chỉ `git add <đường dẫn mình sửa>`; không `git add -A`, không `commit -a`, không rebase/force push nhánh chung.
- Agent contract ghi `contracts/` và `docs/SCOPE-P0.md`, `docs/SRS-LEADS.md` — tech lead nền móng không commit/sửa các file này.
- `npm install` chỉ qua `scripts/safe-npm.sh`; `next build` chỉ qua `scripts/safe-build.sh` (flock, không bao giờ 2 build cùng lúc).
- Merge vào `develop` sau khi review (code-reviewer) — không tự merge.

### D-08 · 02/10/2026 · AGENTS.md của Next
`next dev` 16.3.8 tự sinh `AGENTS.md` (khối "This is NOT the Next.js you know", trỏ tới `node_modules/next/dist/docs/`).
Commit nguyên `AGENTS.md`; `CLAUDE.md` của repo mở đầu bằng `@AGENTS.md` nên Next không ghi đè CLAUDE.md.

## Kỹ thuật

### D-09 · 02/10/2026 · Dev/preview chạy `-H localhost`, không phải `-H 127.0.0.1`
**Hiện tượng (đã tái hiện):** với `next dev -H 127.0.0.1` (và `next start -H 127.0.0.1`), mọi URL cần rewrite của next-intl
(`/doi-tac-tho` → `/vi/doi-tac-tho`, `/en/technician-partners` → `/en/doi-tac-tho`) trả **307 về chính nó** (vòng lặp).
**Nguyên nhân:** Next 16.3.8 dựng `request.url` cho proxy bằng host `localhost` (`next-server.js`, `fetchHostname || 'localhost'`)
nhưng so đích rewrite với `http://<-H>:<port>` (`resolve-routes.js`). Khác origin → coi là rewrite ra ngoài → proxy chạy lại
trên `/vi/...` → next-intl bỏ tiền tố mặc định → 307.
**Quyết định:** `npm run dev` và `npm run start` dùng `-H localhost`. Trên bbsw `localhost` chỉ phân giải `127.0.0.1`
(`/etc/hosts`), đã kiểm `ss -ltnp`: chỉ lắng nghe `127.0.0.1:3091` — vẫn đúng luật không mở cổng public. Thêm
`allowedDevOrigins: ['127.0.0.1']` để HMR/tài nguyên dev không bị chặn khi mở bằng `http://127.0.0.1:3091`.
**Việc của deploy (G8):** server standalone phải chạy với hostname khớp (`HOSTNAME=localhost` hoặc kiểm tương đương), và smoke
test bắt buộc: `curl -sI http://127.0.0.1:<port>/doi-tac-tho` trả 200 (không phải 307). Máy khác mà `localhost` phân giải `::1`
trước thì đặt `BASE_URL=http://localhost:3091` khi chạy test.

### D-10 · 02/10/2026 · Trang 404 do client render (hành vi Next 16.3.8)
`notFound()` gọi trong page → HTML server là shell lỗi (`<html id="__next_error__">`) với mã **404** và `noindex`; nội dung
`app/[locale]/not-found.tsx` (có header/footer, đúng ngôn ngữ, link gợi ý) do client render sau hydrate. Đã kiểm bằng
Chromium: H1 "Không tìm thấy trang" / "Page not found" hiện, có header. Đã loại trừ lỗi app: tái hiện y hệt với layout tối
giản, not-found lồng, và một app Next 16.3.8 tối giản riêng. Không JS: trang trắng nhưng mã 404 đúng — chấp nhận (404 không
được index). Theo dõi khi nâng Next. `global-not-found` (experimental) chưa bật.

### D-11 · 02/10/2026 · next-intl 4.14.8 với Next 16
- `proxy.ts` (Next 16 thay `middleware.ts`) gọi `createMiddleware(routing)`; trước đó trả **410** cho URL đã gỡ.
- Locale lấy từ `next/root-params` (có sẵn từ Next 16.3) trong `i18n/request.ts` → trang tĩnh không cần `setRequestLocale`.
- `localeDetection: false`, `localeCookie: false` (không Set-Cookie, không auto-redirect theo cookie/Accept-Language),
  `alternateLinks: false` (hreflang chỉ do `lib/seo.ts` sinh trong `<head>`: vi, en, x-default → vi).
- Messages tách 14 namespace/locale, gộp ở `i18n/request.ts`; kiểu chặt qua `global.d.ts` (`AppConfig`). Client chỉ nhận
  namespace `common` + `errors` (giảm payload); chữ khác truyền từ server qua props.
- `generateStaticParams`: root layout khai báo 2 locale + mỗi page tĩnh export `localeStaticParams` (yêu cầu nền móng);
  route động sinh slug theo locale của layout cha; `dynamicParams = false` → locale/slug lạ trả 404. Build ra đúng 56 trang.

### D-12 · 02/10/2026 · Phiên bản ghim và ngoại lệ so với danh sách ban đầu
- `typescript` **5.9.3**: bản mới nhất là 7.0.2 nhưng `typescript-eslint` 8.x (trong eslint-config-next 16.3.8) yêu cầu `<6.1`.
- `eslint` **9.39.5**: eslint 10 lệch peer của eslint-plugin-react/import/jsx-a11y trong eslint-config-next 16.3.8. npm báo
  9.x "no longer supported" — giữ tới khi Next nâng plugin.
- Thêm `vite` **8.3.2**: Vitest 5 yêu cầu vite là peer bắt buộc. Config ở `vitest.config.mts` (ESM).
- Thêm `playwright-core` **1.62.0**: không có dòng này npm tự kéo playwright-core 1.63 làm peer của @axe-core/playwright (lệch
  Chromium 1234 và lệch kiểu `Page`).
- Bản mới nhất ngày 02/10/2026: `lucide-react` 1.49.0, `sharp` 0.35.5; `@types/three` 0.186.0, `@types/node` 22.20.5,
  `@types/react(-dom)` 19.3.0, `@types/d3-geo` 3.1.1, `@types/topojson-client` 3.1.5. `npm ls --all` không lỗi peer.

### D-13 · 02/10/2026 · Build an toàn trên máy dùng chung
`scripts/safe-build.sh`: khóa `/tmp/bluebolt-web-build.lock`, distDir `.next-check-<pid>` (env `NEXT_DIST_DIR`), tsconfig tạm
`tsconfig.build-<dist>.json` qua `NEXT_TSCONFIG_PATH` (nếu không, Next ghi đường dẫn distDir tạm vào `tsconfig.json` mỗi lần build),
khôi phục `next-env.d.ts` sau build. Next 16 bỏ cột "First Load JS" → `scripts/route-sizes.mjs` đo từ HTML prerender
(gzip -9, bỏ polyfill `noModule`), ghi `<dist>/route-sizes.json`. Đo ngày 02/10/2026 (build cuối của nền móng): **156,9 KB gz** mọi trang con, **157,6 KB gz** trang chủ (ngân sách 170); CSS 8,7 KB gz; HTML 20,6–28,4 KB gz (gồm payload RSC; logo inline chiếm ~6 KB gz — có thể giảm sau bằng sprite ngoài hoặc giảm độ chính xác path).

### D-14 · 02/10/2026 · Font
Be Vietnam Pro qua `next/font/google` (tự host lúc build), subset latin/latin-ext/vietnamese, 400/500/600/700, `display: swap`.
Hai lần gọi để CHỈ preload một file: lần 1 (4 weight, không preload) + lần 2 (700, preload subset vietnamese). Turbopack gộp
cả hai vào cùng họ "Be Vietnam Pro"; build kiểm: đúng 1 `<link rel="preload" as="font">`. Chuỗi "ẦẪỆ Ước Hưởng" ở mọi cỡ
heading (2 dòng) trên `/dev/ui`: không chạm dấu ở 1440 và 390.

### D-15 · 02/10/2026 · Logo
Dùng vector logo của site cũ (`/images/logo-bluebolt-services.svg`, 136×44, giữ nguyên đường dẫn trong `public/images/` cho link
cũ). `components/layout/Logo.tsx` khai báo path một lần (`<symbol>`), dùng lại bằng `<use>`; màu theo biến CSS → bản nền tối
(chữ BLUE trắng, SERVICES slate-300) là **biến thể tự tô, chờ file logo gốc + bản nền tối chính thức** (Q6). Favicon
`app/icon.svg` (tia chớp cam trên nền xanh) là tạm.

### D-16 · 02/10/2026 · Header, footer, motion
- Menu đầy đủ chỉ từ 1280px; dưới 1280: logo · "Nhận báo giá" (≥ 768) · ☎ · ☰ (sheet `<dialog>` modal: khóa nền, Esc, Tab vòng
  trong menu, trả focus về nút). Lý do: 1024–1279 (iPad ngang, laptop nhỏ) không đủ chỗ cho 6 mục + VI|EN + hotline + CTA.
- Header trong suốt trên vùng `[data-film-zone]` bằng CSS `:has()` (không nháy lúc tải) + `HeaderObserver` (IntersectionObserver,
  chỉ ghi data-attribute). Trình duyệt không hỗ trợ `:has()` thấy header trắng — chấp nhận.
- Footer mobile: lưới 2 cột × 2 hàng thay cho accordion (`docs/03` 13.4 P9): 4 cột ngắn, hiện hết link không cần bấm, không JS,
  không nhân đôi link. Đổi được nếu anh Duy muốn accordion.
- Motion ngoài phim không dùng GSAP: một IntersectionObserver (`MotionRuntime`) + CSS; `html[data-motion]` pending → ready, tự
  "off" sau 4 s nếu JS lỗi. `Curtain` đặt clip-path ở lớp trong (Chrome không báo giao cho phần tử bị clip 100%).
- Script khởi động motion nằm ĐẦU `<head>` nhưng chỉ render ở server (`MotionBootScript`, client trả null): chạy trước lần vẽ
  đầu (không nháy), và không gây lỗi "script tag" của React khi Next render lại layout ở client cho trang 404 (D-10).
  Đã thử `next/script` beforeInteractive: Next đẩy script vào hàng đợi chạy SAU bundle → quá muộn, bỏ.

### D-17 · 02/10/2026 · Ghi chú cho deploy và SEO (chưa làm, để agent tương ứng)
- 301 ở tầng Next dùng `statusCode: 301` (không `permanent: true` vì ra 308). Biến thể có "/" cuối (`/news/`) ở tầng Next đi
  2 bước (308 rồi 301); production làm 1 bước ở openresty (`docs/04` mục 2.7).
- Script đầu `<head>` (`MOTION_BOOT_SCRIPT`) cần hash trong CSP khi bật CSP.
- `output: 'standalone'`: `next start` in cảnh báo (vẫn chạy) — production dùng `node .next/standalone/server.js` (xem D-09).

### D-18 · 02/10/2026 · Trạng thái nền móng khi bàn giao cho các agent
- Nhánh `feat/s1-1.4-p0-build`; dev server dùng chung `http://127.0.0.1:3091` (systemd `bluebolt-web-dev`, DRAFT_PREVIEW=1).
- Kiểm xanh: typecheck, lint (89+ file), Vitest 120 test, build production (56 trang prerender), Playwright trên dev server
  (overflow 54 route×ngôn ngữ × 9 bề rộng, SEO render 108, axe 108) và trên bản production (SEO 100, overflow 50, axe 100).
- Mọi trang ngoài trang chủ là KHUNG (H1 + lead + ghi chú dựng trang ở dev/preview). FilmHero, VietnamMap là STUB giữ props.
- Chưa có: sitemap.ts, robots.ts, JSON-LD, ảnh OG (agent SEO); check-budgets + Lighthouse CI (agent QA); phim A+ (agent phim);
  bản đồ thật (agent bản đồ); form/API (chờ contract APPROVED).


## Quyết định của anh Duy (trả lời 3 câu hỏi, 02/10/2026)

### D-19 · 02/10/2026 · Ngoại lệ quy trình: build staging phần tĩnh trước khi contract APPROVED (anh Duy chọn)
- Câu hỏi: "Build staging ngay, ghi ngoại lệ" hay "viết contract trước, anh duyệt rồi build". **Anh Duy chọn: build staging ngay,
  ghi ngoại lệ.**
- Phạm vi ngoại lệ: CHỈ phần tĩnh — phim trang chủ và khung site P0 dùng dữ liệu mẫu, không backend. `contracts/film-home.md` và
  `contracts/site-shell-p0.md` (DRAFT) được dùng làm tiêu chí nghiệm thu khi build.
- KHÔNG thuộc ngoại lệ: form gửi lead, API `/api/v1/leads`, DB, CMS, `/tra-cuu` — vẫn chờ `contracts/lead-b2b.md` và
  `contracts/lead-technician.md` có `STATUS: APPROVED`.

### D-20 · 02/10/2026 · Kênh lead (anh Duy chọn)
- **Lưu DB (Postgres) trước, sau đó email cho bộ phận** (Kinh doanh B2B / Tuyển thợ) — phương án (a) trong contract lead.
- Còn thiếu để duyệt contract: địa chỉ email nhận của từng bộ phận, câu chữ đồng ý (pháp chế), các điểm D-01…D-19 trong contract.

### D-21 · 02/10/2026 · Cổng xem bản build (anh Duy chọn 9515)
- Anh Duy chọn cổng 9515. Kiểm 02/10/2026: từ Internet `<IP công cộng của văn phòng>:9515` vẫn trả trang "Mention — Social Listening" của MÁY
  KHÁC (listener nhận dạng của bbsw không nhận được) → NAT router chưa trỏ 9515 về bbsw (<IP LAN của máy chủ>).
- Bản xem trước chạy trên bbsw cổng 9515 (Basic Auth). Truy cập được ngay qua Tailscale `http://<IP Tailscale của máy chủ>:9515` và LAN
  `http://<IP LAN của máy chủ>:9515`. Muốn public cần đổi NAT 9515 → <IP LAN của máy chủ> (dịch vụ Mention sẽ mất cổng này).

### D-22 · 02/10/2026 · Hero 3D trang chủ: chờ anh Duy chọn
- Sáng 02/10 có thêm nhánh "5 mẫu 3D làm riêng" ở `../website-services-3d/` (khuyến nghị Mẫu 02 "Bản đồ sống", có thể + mở màn
  tia chớp Mẫu 01). Hỏi anh Duy chọn hero: A+, Mẫu 02, Mẫu 02 + 01 — **anh trả lời: "Anh xem 5 mẫu rồi báo sau".**
- Trong lúc chờ: build toàn bộ phần không phụ thuộc hero (trang, nội dung, bản đồ SVG, SEO, QA, bản xem trước 9515).
  Hero giữ `FilmHero` khung tạm (H1 + CTA + poster). Đổi hero sau này chỉ thay ruột `FilmHero` (giữ `FilmHeroProps`).
- Một repo duy nhất `bluebolt-web` cho mọi hướng hero; mẫu ở `website-services-3d/mau/` là bản tham khảo HTML + three.js.
