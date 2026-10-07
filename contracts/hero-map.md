# Contract: hero-map — Hero trang chủ "Bản đồ sống 34 tỉnh" (Mẫu 02)

## STATUS: DRAFT — phần tĩnh, dùng ngoại lệ D-19 (build trước, anh Duy duyệt bằng ảnh và bản xem trước)

| | |
|---|---|
| Ngày | 03/10/2026 |
| Quyết định nền | D-26: anh Duy chọn Mẫu 02, thay phim A+ của D-01. Không KHANG, không Lenis, không mở màn tia chớp của Mẫu 01 |
| Thay cho | `contracts/film-home.md` (phim A+, dừng). AC còn hợp được giữ, ghi nguồn dạng (FH AC-…) |
| Mẫu hình | `../website-services-3d/mau/02-ban-do-song/` (chỉ đọc; `shots/` là chuẩn hình anh đã chọn) |
| Dữ liệu | `public/data/vn34.topo.json` (MIT) → `node scripts/make-hero-map.mjs` → `public/data/hero-map.json` (`--check` lệch thì exit 1) |
| Code | Cảnh `components/film/map3d/**` · máy `motion/map-camera.{json,ts}` · poster `scripts/hero-poster.mjs` → `public/images/hero/` · lớp HTML `components/film/FilmHero.tsx` (bước 2, giữ `FilmHeroProps`) |
| ERD / API / RBAC | Không có (phần tĩnh) |

## 1. User story

```
AS A   người phụ trách vận hành/hậu mãi của Hãng điện máy hoặc Sàn TMĐT, vào trang chủ trên laptop hoặc điện thoại
I WANT TO thấy ngay Bluebolt phủ cả nước và bấm được CTA trong màn đầu; cuộn để máy bay qua từng miền
SO THAT tôi tin mạng lưới có thật ở tỉnh của mình và bấm "Nhận báo giá cho doanh nghiệp".
AS A   người dùng bàn phím / trình đọc màn hình / giảm chuyển động / máy yếu / tắt JS / Googlebot
I WANT TO đọc đủ nội dung, bỏ qua hero bằng một link, không tải 3D khi không cần.
```

## 2. Bố cục và trục cuộn

- Track hero `data-film-zone="light"` (cả track; header chữ navy, sang đêm chữ trắng). HTML server = bố cục T-STILL theo dòng chảy
  (màn đầu 100svh + 4 panel xếp lưới). Runtime thêm `.film-armed` khi T-FULL/T-LITE:
  - desktop (màn ngang): track 320vh, khung sticky 100svh, panel cố định bên trái ẩn/hiện theo tiến độ; khối chữ phải vừa
    100svh, không vừa (laptop thấp, điện thoại xoay ngang) → T-STILL;
  - mobile (màn dọc): BẢN ĐỒ dính trên cùng (cao min(1,16·W, 54svh)), khối chữ và 4 panel cuộn theo dòng chảy bên dưới, không
    bao giờ đè bản đồ; tiến độ cảnh theo vị trí đọc của panel (panel đi qua tâm "cửa sổ đọc" ↔ đoạn đứng của cảnh đó).
    Bản mẫu để panel cố định đè nửa dưới bản đồ, che Trường Sa trên máy nhỏ — đổi để giữ NFR-MAP-01.
  p ∈ [0, 1] ghi vào biến của runtime + `data-p`/biến CSS, không vào React state (FH luật 10).
- Năm cảnh, trọng số đọc từ `motion/map-camera.json` (`weights`), không viết lại ở chỗ khác:

| Cảnh | Hiện rõ (p) | Máy (desktop) | Lớp HTML |
|---|---|---|---|
| 1 Toàn quốc | 0 – 0,03 | cả nước + hai quần đảo, bản đồ lệch phải | eyebrow, H1, lead, 2 CTA, link bỏ qua, dải KPI |
| 2 Miền Bắc | 0,23 – 0,37 | zoom Bắc Bộ | panel H2 "Miền Bắc" + số thợ miền (qua `lib/stats.ts`) |
| 3 Miền Trung | 0,50 – 0,63 | zoom Trung Bộ | panel H2 "Miền Trung" |
| 4 Miền Nam | 0,76 – 0,88 | zoom Nam Bộ + HQ TP.HCM | panel H2 "Miền Nam" (+ Mekong) |
| 5 Toàn mạng lưới | 0,985 – 1 | kéo ra cả nước, biển chuyển đêm (`night` 0,88 → 0,985) | câu kết + CTA |

- Desktop (`layoutFor`: viewport ngang): chữ trái, bản đồ phải bằng lens shift `setViewOffset` (sx). Mobile (dọc): bản đồ trên
  (khung chuẩn 9:16 neo trên), chữ dưới; máy giữ CẢ NƯỚC trong mọi cảnh (không zoom miền), chỉ đổi điểm nhìn và tô sáng miền.
- Khung chuẩn: desktop 16:10, mobile 9:16, đặt vào viewport kiểu `object-fit: cover` tại `anchor` (desktop phải-giữa, mobile
  giữa-trên); nếu cover cắt vùng `safe` (đất liền + hai quần đảo), lấn cột chữ (`textInset` 40% trái) hoặc dải header (`topInset`)
  thì khung thu nhỏ vừa đủ, lộ thêm biển ở mép (`viewWindow()`). Ở 16:10 là cover thuần → poster khớp từng điểm ảnh với khung 3D
  p = 0; mọi tỉ lệ khác poster đặt theo đúng `viewWindow()` (rộng `fullWidth`, lệch `−cropX/−cropY`), phần hở tô màu `edge`.

## 3. Acceptance Criteria

### 3.1 Nội dung, SEO, a11y (giữ từ film-home)
- **AC-HM-1** Đúng một H1 (trong hero), server render, HIỆN mặc định: không inline `opacity:0`/`visibility:hidden`. LCP = H1
  hoặc poster; canvas không bao giờ là LCP. Lớp chuyển giao chỉ ẩn bằng `.film-armed` thêm sau hydrate (FH AC-S0-5, AC-T-6).
- **AC-HM-2** Link "Bỏ qua phần giới thiệu ↓" là `<a href="#ba-cua-vao">` thật, nhìn thấy được, phần tử focus đầu tiên sau
  header, hiển thị dưới CTA; đích `#ba-cua-vao` (H2, `tabindex="-1"`) nhận focus (FH AC-S0-9).
- **AC-HM-3** Mọi chữ/số/CTA ở DOM, render từ server. Số qua `statViews()` / `lib/stats.ts`; câu khẳng định qua `claim()`.
  Canvas và poster KHÔNG chứa chữ (nhãn là HTML) nên không có claim trong ảnh.
- **AC-HM-4** `<canvas aria-hidden="true">`, không focus. Nhãn bản đồ là trang trí `aria-hidden`; danh sách 34 tỉnh đầy đủ đã có
  ở `/mang-luoi`. Panel tour dùng H2.
- **AC-HM-5** Không KHANG, không logo/kiểu dáng hãng. Đường cung, chấm sáng chạy, nhịp ghim là TRANG TRÍ, không phải dữ liệu đơn
  thật; thẻ đơn hàng (nếu có) ghi "Ví dụ minh hoạ" / "Illustrative example".
- **AC-HM-6** Không JS: đủ H1, CTA, link bỏ qua, poster + nhãn HTML tĩnh (vị trí từ JSON poster), không khoảng trống track (FH AC-A-5).
- **AC-HM-7** axe: 0 lỗi serious/critical, 0 `color-contrast` ở p = 0, giữa mỗi cảnh và p = 1, VI + EN. Chữ trên biển có lớp
  sương sáng (desktop trái, mobile dưới) đủ 4,5:1; ở cảnh đêm chữ chuyển sang trắng.

### 3.2 Tour 5 cảnh
- **AC-TR-1** Máy chỉ đọc `motion/map-camera.json` + `motion/map-camera.ts` (`cameraPose`, `viewWindow`); cảnh không hardcode camera.
  Giữa hai miền có "cú bay" (`bump`). Tiến độ làm mượt `smoothing` (trừ reduced-motion và chế độ chụp).
- **AC-TR-2** Tô sáng miền theo ranh giới tỉnh THẬT (miền của `content/provinces.ts`, Bắc 18 · Trung 4 · Nam 12 — D-06),
  không theo dải vĩ độ như bản mẫu. Miền khác tối đi ≤ 15%.
- **AC-TR-3** Cảnh 5: biển, mây, sương chuyển đêm theo `nightAt(p)`; header chuyển chữ trắng khi `night > 0,5` (HeaderObserver).
- **AC-TR-4** Chữ không chuyển động cùng máy: desktop panel đổi `opacity` + `translateY` ≤ 24 px, mỗi cảnh có đoạn đứng ≥ 20 vh
  (Bắc 0,23–0,37 × 220vh ≈ 31vh). Mobile: panel cuộn native dưới bản đồ dính, cách nhau 30svh (đoạn máy bay).
- **AC-TR-5** Cuộn ngược, nhảy hash, back/forward, kéo thanh cuộn: trạng thái tính lại từ vị trí cuộn, không kẹt nửa chừng.
  Space/PageDown/mũi tên/Home/End cuộn native.

### 3.3 Nhãn và chủ quyền (NFR-MAP-01)
- **AC-MAP-1** Nhãn HTML: tỉnh theo cảnh (TP trực thuộc TW ưu tiên hơn tỉnh), HQ "TP. Hồ Chí Minh · văn phòng điều phối", Biển
  Đông, Quần đảo Hoàng Sa, Quần đảo Trường Sa. Tên lấy từ `content/provinces.ts` (VI/EN) và `messages/*/film.json`; không hardcode.
- **AC-MAP-2** Hai quần đảo LUÔN thấy được trong mọi khung, ở mọi bề rộng 360–1920 và mọi tầng: (a) mọi chấm đảo trong viewport
  (`project().archipelagos[i].inView`) HOẶC (b) minimap (desktop, khi zoom miền) vẽ đủ hai quần đảo, ghi đủ tên. Nhãn ≥ 11 CSS px,
  tương phản ≥ 4,5:1, KHÔNG bị chống chồng nhãn ẩn đi (ưu tiên cao nhất, kéo vào trong mép); không phần tử nào đè bbox đảo + nhãn.
- **AC-MAP-3** Mọi keyframe `fit: true` (desktop p = 0, 0,06, 1; MỌI keyframe mobile) chứa trọn hai quần đảo trong vùng `safe` của
  khung chuẩn — `tests/hero/map-camera.test.ts` kiểm offline. Poster desktop và mobile thấy cả hai quần đảo.
- **AC-MAP-4** Chấm từng đảo lấy từ dữ liệu thật (tâm từng đảo của TopoJSON), elip nét đứt quanh nhóm, quầng nước nông quanh đảo.
  Chấm DK1/Tư Chính vẽ cùng nhóm Trường Sa, nằm ngoài elip (D-25, chờ pháp chế).
- **AC-MAP-5** Dòng chú thích "Bản đồ minh hoạ — có Quần đảo Hoàng Sa và Quần đảo Trường Sa của Việt Nam" trong hero (messages).
- **AC-MAP-6** Chống chồng nhãn tỉnh theo ưu tiên, né panel tour và khối H1; toạ độ nhãn làm tròn px (SwiftShader vỡ glyph lẻ).

### 3.4 Tầng (chọn MỘT lần mỗi lượt tải; chỉ hạ, không nâng)

| Tầng | Điều kiện | Hiển thị |
|---|---|---|
| T-FULL | desktop (màn ngang VÀ `pointer:fine`) VÀ WebGL2 VÀ renderer thật VÀ GPU mạnh theo heuristic AC-T-1 | bóng đổ (shadow map vẽ 1 lần), mây tiền cảnh khi bay, lưới kinh vĩ, DPR ≤ 2, mặt nạ biển 1024² |
| T-LITE | như trên nhưng GPU không thuộc nhóm mạnh; HOẶC màn dọc/`pointer:coarse` không thuộc nhóm yếu | không bóng, 12 cụm mây + 2 dải, không mây tiền cảnh, biển rút gọn (bỏ lưới, bọt tĩnh), DPR ≤ 1,5, mặt nạ 512² |
| T-STILL | không JS, reduced-motion, Save-Data, trình duyệt thiếu `color-mix()` (Safari < 16.2, Chrome < 111 — D-35), không WebGL2, renderer `/SwiftShader\|llvmpipe\|Software\|Basic Render/i` hoặc không đọc được, GPU yếu/máy yếu (AC-T-1), desktop có khối chữ không vừa 100svh, `webglcontextlost`, FPS guard hết bậc ở ≤ 20 hình/s | poster `<picture>` + nhãn HTML tĩnh, KHÔNG tải three/chunk 3D; chọn từ đầu → bố cục dòng chảy, không pin; hạ giữa phiên → giữ track |

- **AC-T-1** Thứ tự: no-JS → reduced-motion → Save-Data → trình duyệt thiếu `color-mix()` (`old-browser`) → probe WebGL2
  (`failIfMajorPerformanceCaveat`) + `UNMASKED_RENDERER_WEBGL`
  → heuristic không gọi mạng (thay benchmark detect-gpu tải từ unpkg): renderer phần mềm/GPU đời cũ (Mali-T/4xx, Adreno ≤ 4xx,
  PowerVR SGX, Intel HD 2000–4000 kể cả tên có "(R)", VideoCore) hoặc `deviceMemory` < 2 / `hardwareConcurrency` < 4 → T-STILL;
  màn dọc hoặc `pointer:coarse` → T-LITE; Safari che tên GPU ("Apple GPU") mà không có `WEBGL_compressed_texture_astc` (Mac
  Intel/AMD) → T-LITE (`mac-intel`, D-35); GPU rời/đời mới (NVIDIA, Radeon RX/Pro, Apple M, "Apple GPU" có ASTC, Iris Xe, Arc)
  + ≥ 8 nhân + RAM ≥ 8 GB (hoặc không báo) + màn ≤ 4K → T-FULL; còn lại T-LITE. Thiếu API = máy yếu (FH AC-T-2). Dev/bản xem
  trước nhận `?tier=`.
- **AC-T-2** FPS guard: chỉ đo khi ĐANG cuộn; p90 khoảng rAF > 25 ms trong 2 s → `scene.degrade()` (hạ DPR, tắt mây tiền cảnh/dải,
  không biên dịch lại shader). Ngoại lệ: nhịp đều quanh 33 ms (trung vị 28–40 ms, p90 − trung vị ≤ 6 ms) là trình duyệt khoá
  30 hình/s (Low Power Mode của macOS, Energy Saver của Chrome, màn 30 Hz) → không hạ. `degrade()` trả `false` → T-STILL tại chỗ
  chỉ khi p90 > 50 ms (≤ 20 hình/s); còn lại giữ bậc thấp nhất (D-35, `runtime/fps-guard.ts`).
- **AC-T-3** `webglcontextlost` (callback `onContextLost`) → T-STILL tại chỗ: giữ chiều cao track (không nhảy cuộn), thay canvas bằng
  poster, panel HTML vẫn theo tiến độ; không tải thêm gì.
- **AC-T-4** Đổi bố cục desktop ↔ mobile giữa phiên (xoay máy) → T-STILL tại chỗ với poster bố cục mới; không dựng lại cảnh.
- **AC-T-5** Server render ở trạng thái T-STILL. `.film-armed` chỉ thêm khi T-FULL/T-LITE; canvas (tạo mới mỗi lần dựng, `aria-hidden`)
  hiện đè poster khi khung đầu xong; poster giữ nguyên bên dưới làm nền dự phòng (T-STILL tại chỗ).

### 3.5 Reduced-motion → T-STILL
Không pin, không tour, không tải three; poster p = 0 + nhãn HTML + ba panel miền xếp dọc như section thường. Chọn poster thay cho
"cảnh 3D đứng yên" vì nhẹ hơn hẳn (không 290 KB JS, không GPU) mà hình giống hệt khung p = 0 (FH AC-A-2).

### 3.6 Tải và vòng vẽ
- **AC-L-1** JS tải đầu trang chủ ≤ 170 KB gz; bộ nạp hero trong đó ≤ 3 KB gz. `import()` chunk 3D CHỈ sau ý định đầu tiên
  (`wheel`, `scroll`, `pointermove`, `keydown`, `touchstart`) hoặc `load` + 2 s rảnh; không ở lần render đầu, không `React.lazy` ngay.
- **AC-L-2** `hero-map.json` tải song song với chunk (truyền vào `createMapScene({ data })`). Ảnh poster là tài nguyên LCP duy nhất
  được preload (`fetchpriority="high"`).
- **AC-L-3** `createMapScene()` dựng cảnh, `compileAsync` mọi shader và vẽ khung đầu TRƯỚC khi resolve. Phần dựng trên CPU (giải mã,
  mặt nạ biển, hình học) chạy ngay; trước bước biên dịch + khung đầu, `beforeCompile` của bước 2 chờ cuộn đứng ≥ 150 ms, tối đa
  1 s (D-35: vuốt trackpad liên tục vẫn có cảnh giữa chừng; trước đây chờ không giới hạn → cả lượt vuốt chỉ thấy poster).
- **AC-L-4** Một rAF của bước 2 gọi `renderIfNeeded(now)`: chỉ vẽ khi p (đã làm mượt) đổi, khi resize, hoặc khi hiệu ứng nền bật.
  Hiệu ứng nền (đường cung chạy, sóng ghim, mây trôi, rung máy ≤ 1,2°) chỉ bật khi hero trong khung nhìn, tab hiện, không reduced-motion;
  tắt sau 8 s không tương tác (brief bước 2). Ra khỏi khung (IntersectionObserver) hoặc tab ẩn → dừng rAF; ra khỏi khung > 20 s
  hoặc tab ẩn > 10 s → `dispose()` (giải phóng texture + WebGL context), quay lại thì dựng lại ở đúng tiến độ (D-35: trước là
  3 s, cuộn xuống xem rồi quay lên là phải dựng lại).
- **AC-L-5** `dispose()` giải phóng mọi geometry/material/texture, `renderer.dispose()` + `forceContextLoss()`.

### 3.7 Ngân sách (`budgets.json`; bước 1 đo, bước 2 giữ)

| Hạng mục | Ngưỡng | Đo |
|---|---|---|
| JS tải đầu trang chủ | ≤ 170 KB gz (bộ nạp ≤ 3 KB gz) | `scripts/safe-build.sh` |
| Chunk 3D (three tree-shake + cảnh) | ≤ 290 KB gz | chunk chứa chữ ký three của `budgets.json`, gzip -9 |
| `hero-map.json` | ≤ 60 KB gz | `make-hero-map.mjs` tự kiểm |
| Poster | ≤ 150 KB desktop (1920×1200) · ≤ 90 KB mobile (576×1024); AVIF, WebP dự phòng | `scripts/hero-poster.mjs` tự kiểm |
| Trang chủ mobile trước khi cuộn | ≤ 600 KB truyền | `npm run budget` (live) |
| Cảnh | FULL ≤ 40 draw call · ≤ 150k tam giác (khung đầu, gồm pass bóng); LITE ≤ 30 draw call · ≤ 80k tam giác | `scene.stats()` |
| Khung hình (máy thật) | FULL p95 ≤ 16,7 ms; LITE p95 ≤ 20 ms (1366×768 iGPU) | rAF trace; số SwiftShader không đại diện |

### 3.8 Hình ảnh (bằng hoặc hơn Mẫu 02)
- Đất sứ nổi khối (cao 0,34 đơn vị ≈ cảnh), nhiễu đất sét, viền sáng mép bờ; vách CHỈ ở bờ biển + biên giới; viền `blue-600`
  (#004AAD) bằng `LineSegments2`; ranh giới 34 tỉnh `blue-300` mảnh, không hở viền (biên chung là một arc).
- Biển shader: nước nông theo mặt nạ khoảng cách bờ, bọt sóng, quầng san hô quanh hai quần đảo, elip nét đứt, sương theo bán kính
  và khoảng cách máy, chuyển đêm. Bóng đổ chỉ ở T-FULL.
- 33 đường cung từ HQ TP.HCM tới tâm 33 tỉnh (đuôi sao chổi + 66 chấm sáng), ghim instanced + vòng sóng, cột sáng HQ.
- Mây thủ tục (canvas): FULL 22 cụm biển mây + 5 dải trên đất + 5 mây tiền cảnh khi bay; LITE 12 + 2.
- Màu thương hiệu đọc từ token (`styles/tokens.css`) lúc dựng cảnh. Màu nước theo họ `blue-600` #004AAD (biển xa `blue-600`, gần bờ
  #0057CC, nước nông `blue-300` — D-31); màu mây/đất là bảng minh hoạ riêng của cảnh 3D, không dùng cho UI HTML. Seed cố định
  (3402) → bố cục đường cung/mây giống poster.

## 4. Quy tắc và edge case
- R-CLAIM: như film-home mục 5 — production không render claim/số chưa duyệt, kể cả trong nhãn bản đồ và panel tour.
- R-DOWN: chỉ hạ tầng; giữ chiều cao track; không tải asset nặng mới.
- Vào trang có hash hoặc khôi phục cuộn: tính lại p, không tự chạy cú máy theo thời gian.
- Cuộn nhanh qua track khi chunk chưa về: poster + panel HTML theo cuộn; chunk về thì chờ cuộn đứng mới dựng.
- In trang: bố cục T-STILL. Zoom 200%: khối H1 không tràn ngang. Viewport thấp (< 600 px): chữ không bị cắt.
- `prefers-reduced-motion` đổi giữa phiên: hạ T-STILL tại chỗ.

## 5. Test checklist

| AC | Test |
|---|---|
| AC-MAP-3, AC-TR-1 | `tests/hero/map-camera.test.ts` (Vitest): JSON hợp lệ, keyframe tăng dần, nội suy khớp keyframe, `projectPoint` khớp three, mọi keyframe `fit` chứa hai quần đảo trong `safe`, phép chiếu trùng `projection.ts` |
| Dữ liệu | `node scripts/make-hero-map.mjs --check` (34 tỉnh, ≥ 5/20 chấm đảo, chấm trong elip, ≤ 60 KB gz); `tests/hero/hero-map-data.test.ts` |
| Màu | `tests/hero/palette.test.ts`: `TOKEN_FALLBACK` khớp `styles/tokens.css` |
| AC-MAP-2, AC-HM-* | `tests/hero/hero.spec.ts` (Playwright): H1/panel H2 trong HTML server, link bỏ qua focus đầu, không JS, reduced-motion, không WebGL, SwiftShader → T-STILL, hết track → panel cuối + `/mang-luoi`, nhãn hai quần đảo ở 9 bề rộng (T-STILL và `.film-armed`), cảnh sống: quần đảo trong khung hoặc minimap đủ tên, tương phản header + chữ ở p = 0 và p = 1. Ép tầng `?tier=` · `?scene=0` · `?shot=1` · `?fpsguard=0` chỉ ở dev/bản xem trước |
| Poster | `scripts/hero-poster.mjs` kiểm dung lượng + hai quần đảo trong khung; ảnh do người xem duyệt |
| AC-L-*, AC-T-* | `tests/hero/hero.spec.ts`: T-STILL không tải `hero-map.json`/chunk 3D; `node scripts/hero-budget.mjs`: bộ nạp ≤ 3 KB gz, dữ liệu, poster, draw call/tam giác khung đầu; `npm run budget`: JS tải đầu, chunk 3D. Ảnh soát trên trang: `scripts/hero-page-shots.mjs` |

## 6. Câu cần anh Duy / pháp chế xác nhận
1. Minimap (desktop, cảnh zoom miền) có được coi là thoả NFR-MAP-01 (a) không — mặc định: CÓ (như bản mẫu anh đã chọn).
2. Chấm DK1/Tư Chính nằm ngoài elip Trường Sa (D-25) — mặc định giữ như `/mang-luoi`.
3. Dòng chú thích AC-MAP-5 — mặc định câu của bản mẫu.
