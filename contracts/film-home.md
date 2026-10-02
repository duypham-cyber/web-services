# Contract: film-home — Phim trang chủ, phương án A+

## STATUS: DRAFT — chờ anh Duy duyệt

| | |
|---|---|
| Ngày | 02/10/2026 |
| Loại | Phần tĩnh nhưng rủi ro (`04` mục 4, G3). Không ERD, không API. RBAC: N/A |
| Quyết định nền | Anh Duy chọn **phương án phim A+** ngày 02/10/2026 |
| Nguồn (chỗ khác nhau theo `04`) | `03-DINH-HUONG-THIET-KE-3D.md` mục 2–4, 7, 8, 12.4, 13.2–13.3 · `04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md` mục 2.3, 3.1–3.5, 6.1, 6.3 (P2, P4, P5), 7 · `prototype/` (README, MEASUREMENTS, `src/scrollStore.js`, `src/App.jsx`, `src/Hero.jsx`, `scripts/check-modes.mjs`) |
| Contract liên quan | `site-shell-p0.md` (header, footer, các section sau phim, i18n, SEO). Form lead: contract riêng, chưa có |
| Chặn | G5 (phim production) không được code khi file này chưa **APPROVED** |

Mặc định đang áp dụng (ghi trong `docs/DECISIONS.md` khi duyệt):
- B2C **nhánh A**: CTA chính "Nhận báo giá cho doanh nghiệp", CTA phụ "Đăng ký làm đối tác thợ".
- **Không có KHANG** trong cảnh, poster, ảnh OG, video. **Không logo hãng**, không kiểu dáng nhận diện được hãng nào.
- **Lenis TẮT**. Cuộn native, GSAP ScrollTrigger `scrub` chạy trên cuộn native.
- Nội dung là code: `content/*.ts` + Zod. Số liệu và câu khẳng định chưa duyệt **không hiển thị ở production**, kể cả trong texture. Bản xem trước (cờ `DRAFT_PREVIEW=1`, chỉ local/staging) hiện chúng kèm nhãn "Nháp".
- Analytics Umami (chưa cài): sự kiện phim gọi qua một adapter, chưa có Umami thì adapter không làm gì.
- Handoff **thật** (crossfade 200 ms). Phương án "cắt trắng 1 khung" nằm ở mục 8.

---

## 1. User story và Acceptance Criteria

```
AS A   người phụ trách vận hành/hậu mãi của Hãng điện máy hoặc Sàn TMĐT (B2B, người trả tiền),
       vào trang chủ trên laptop hoặc điện thoại
I WANT TO thấy ngay Bluebolt là ai và bấm được CTA trong màn đầu; nếu muốn, cuộn để "đi" vào
       phòng điều phối và thấy website/nền tảng sống trên màn hình trong cảnh
SO THAT tôi tin Bluebolt là hạ tầng lắp đặt có thật (điều phối, nghiệm thu, đối soát), không phải
       một công ty dịch vụ nhỏ, và tôi bấm "Nhận báo giá cho doanh nghiệp".

AS A   thợ kỹ thuật                 I WANT TO  thấy lối "Đăng ký làm đối tác thợ" ngay màn đầu.
AS A   người dùng bàn phím / trình đọc màn hình / bật giảm chuyển động / máy yếu / tắt JS
       I WANT TO  đọc đủ nội dung, không bị kẹt trong phim, bỏ qua phim bằng 1 link.
AS A   Googlebot smartphone (không cuộn)   I WANT TO  thấy đúng 1 H1 và nội dung chính đã hiện.
```

### 1.1 Trục cuộn và mốc (desktop T-FULL / T-LITE)

Đơn vị `s` = số vh đã cuộn tính từ đỉnh trang. Track phim cao **300 vh** (gồm màn đầu 100 vh), khung sticky 100 vh, nên phần cuộn được là 200 vh. Mọi độ dài lấy từ `motion/camera.json` + `motion/camera.ts`, không hardcode trong scene.

```
s:  0 ─────────────── 100 ──────────── 180 ──── 200 ───── 220 ──▶ cuộn native
    │ shot 1 dolly-in  │ screen-hold    │ push-   │ dư âm   │ "Ba cửa vào"…
    │ p1 = s/100       │ (máy đứng yên) │ through │ (CSS)   │
  shot 0 (trạng thái khi vào trang: establish, H1 + CTA)  ↑ handoff khi màn hình phủ ≥ 98% viewport
```

| Pha | Độ dài mặc định | Khoảng cho phép | Easing | Nguồn |
|---|---|---|---|---|
| Shot 0 `establish` | 0 (trạng thái lúc vào) | — | — | `03` 3.1 |
| Shot 1 `dolly-in` + `exposure-ramp` | 100 vh | 80–120 vh | `cubic-bezier(.45,0,.2,1)`; exposure `power1.inOut` | `03` 3.1, 3.3 |
| `screen-hold` | 80 vh | 60–100 vh | tuyến tính | `03` 3.1 |
| `push-through` | 20 vh | 15–25 vh | `power2.in` | `03` 3.1, 7.4 |
| Dư âm sau handoff | 20 vh | cố định | tuyến tính | `04` G2, P4 |

Tổng track phải nằm trong 275–325 vh. Luật "dừng đọc 20–30 vh" (`03` 3.2 luật 7) được đáp ứng bởi `screen-hold`: A+ không có chữ chạy theo từng bước trong phim, nội dung kể chuyện nằm trên màn hình trong cảnh (`03` 2.2 quy tắc 2).

### 1.2 AC theo shot

**Shot 0 — establish (POV người ngồi, ban ngày)**

- **AC-S0-1 Góc máy.** Given trang chủ desktop ở `s = 0`, Then camera đọc từ `camera.json` thỏa: cao 1,15–1,20 m, ngay sau mép bàn, chúc xuống; yaw lệch trục **25–35°** (mặc định 32°); FOV dọc 46° (tiêu cự tương đương 28 mm); roll nghiêng **2–4°** (mặc định −3°); khoảng cách tới đối tượng = 3× khoảng cách cuối.
- **AC-S0-2 Bố cục.** Laptop chiếm khoảng 1/3 dưới khung và bị cắt mép; màn hình lớn ở phía sau, chéo; **dàn lạnh treo tường thấy trọn** (không bị cắt) ở góc trên; đạo cụ nghề có mặt: hộp đồ nghề mở, cuộn ống đồng, đồng hồ đo gas, áo đồng phục vắt ghế, sổ tay, cốc; điện thoại app thợ dựng trên giá ở tiền cảnh. Không có bàn tay người, **không KHANG**, không logo, không kiểu dáng nhận ra được hãng nào.
- **AC-S0-3 Ánh sáng.** Phòng **sáng dịu ban ngày/chiều muộn**, cửa sổ sáng làm rim 4.500–5.500 K; `toneMappingExposure = 1,15 ± 0,02`. Không phải phòng tối.
- **AC-S0-4 Màn hình trong cảnh.** Laptop hiện `DispatchDashboard`, điện thoại hiện `TechnicianApp`, màn hình lớn hiện khung đầu của dải website (`ScreenHoldStrip`, mục 1.2 screen-hold). Mỗi màn hình có nhãn "Giao diện minh họa" (EN: "Illustrative UI"); số trên màn hình có nhãn "minh họa" cho tới khi `content/stats.ts` có số thật; tên đối tác dạng `[Hãng A]`.
- **AC-S0-5 H1 duy nhất.** Lớp HTML bên trái (mobile: khối chữ trên nền đặc) chứa theo thứ tự đọc: eyebrow, **H1**, lead, 2 CTA. Đây là **H1 duy nhất của trang**, do server render, **hiện mặc định** (không inline `opacity:0`, không `visibility:hidden`, không class ẩn trong HTML server). H1 hoặc poster là phần tử LCP; canvas không bao giờ là LCP.
- **AC-S0-6 Nội dung H1.** Chữ H1 lấy từ `messages/{vi,en}.json` theo tagline anh chọn (mặc định T1 "Hạ tầng lắp đặt toàn quốc cho hãng điện máy" / "Vietnam's nationwide installation network for appliance brands"). Eyebrow và lead chỉ chứa câu khẳng định đã duyệt trong `content/claims.ts` (ví dụ phạm vi tỉnh); claim chưa duyệt thì dùng câu dự phòng không có số (mục 5, R-CLAIM).
- **AC-S0-7 Scrim.** Lớp chữ có scrim `navy-900` 0 → 70% từ trái (mobile: nền đặc). Mọi chữ trên scrim đạt tương phản ≥ 4,5:1 (chữ thường) và ≥ 3:1 (chữ ≥ 24 px hoặc ≥ 18,66 px đậm) ở pixel xấu nhất của poster bên dưới.
- **AC-S0-8 CTA B2B.** CTA chính "Nhận báo giá cho doanh nghiệp" (nền `orange-500`, chữ `navy-900`, viền 1 px `orange-700`), CTA phụ "Đăng ký làm đối tác thợ" (ghost). Đích tạm khi form chưa có contract: `/lien-he#kinh-doanh` và `/doi-tac-tho#dang-ky` (EN: `/en/contact#sales`, `/en/technician-partners#apply`). Bấm CTA gửi `cta_click{target}`.
- **AC-S0-9 Link bỏ qua.** "Bỏ qua phần giới thiệu ↓" (EN "Skip the intro ↓") là thẻ `<a href="#ba-cua-vao">` thật, **nhìn thấy được** (không chỉ hiện khi focus), đặt dưới hàng CTA về mặt thị giác, và là **phần tử focus đầu tiên sau header** trong DOM (ngoại lệ thứ tự thị giác/DOM có chủ ý, ghi `DECISIONS.md`). Sau khi bấm: trang tới `#ba-cua-vao`, phần tử đích nhìn thấy được và nhận focus (`tabindex="-1"`), phim ở trạng thái đã handoff, gửi `film_skip`.
- **AC-S0-10 Handheld.** Rung tay chỉ chạy **khi đang cuộn**: xoay ±0,15–0,25°, tịnh tiến ±2–4 mm, 0,3–0,6 Hz, roll handheld ≤ 0,5°; tắt dần trong 1,5 s sau khi dừng cuộn, rồi canvas ngừng vẽ (`frameloop="demand"`). Đứng yên ở `s = 0` thì không có khung nào được vẽ thêm.
- **AC-S0-11 Header trong vùng phim.** Header trong suốt, chữ trắng, có dải scrim `navy-900` phía trên đủ tương phản như AC-S0-7. Header mờ dần và bị `inert` + `aria-hidden` trong `p1 ∈ [0,55; 0,72]` để không có hai thanh nav chồng nhau khi màn hình lớn chiếm khung. Tại mọi thời điểm chỉ có **đúng 1** `<nav aria-label="Điều hướng chính">` tương tác được.

**Shot 1 — dolly-in và phòng tối dần (s = 0 → 100)**

- **AC-S1-1 Đường máy.** Máy tiến về **màn hình lớn** (laptop ở tiền cảnh trôi nhanh hơn, có thị sai): yaw 32° → **0° ± 0,5°**, FOV **46° → 38° ± 0,5°**, khoảng cách 3× → 1,15×, nội suy CatmullRom theo keyframe `{t, pos[3], target[3], fov, roll}` trong `camera.json`.
- **AC-S1-2 Chân trời.** Roll về **0° ± 0,2°** chậm nhất khi kết thúc dolly-in (trước khi màn hình chiếm khung); từ đó tới hết phim chân trời thẳng, chỉ còn roll handheld ≤ 0,5°. Không nghiêng theo cuộn ở giữa phim.
- **AC-S1-3 Exposure ramp.** `toneMappingExposure` giảm **1,15 → 0,60 (± 0,05)** trong `p1 ∈ [0,45; 0,80]`, easing `power1.inOut`; ngoài đoạn này giữ hằng. Màn hình trong cảnh dùng `toneMapped=false` nên giữ sáng; ánh xanh từ màn hình hắt lên mặt bàn và tay ghế; đèn bàn 2.700–3.000 K chỉ nổi lên khi phòng đã tối.
- **AC-S1-4 Màn hình laptop.** Thẻ "đơn mới" trượt vào trên `DispatchDashboard` (dữ liệu minh họa, ví dụ "Lắp điều hòa 12.000 BTU · Thủ Đức · [Hãng A]"), đọc được ở khung cuối shot.
- **AC-S1-5 Lớp chữ HTML.** Lớp H1 của shot 0 rời đi bằng `opacity` + `translateY` ≤ 24 px trong `p1 ∈ [0,10; 0,35]` và quay lại đối xứng khi cuộn ngược. Không có chữ nào chuyển động cùng máy.

**screen-hold — website cuộn trên màn hình (s = 100 → 180)**

- **AC-SH-1 Máy đứng yên.** Camera giữ khung khi màn hình lớn phủ **85–90% bề ngang viewport** (mặc định 0,88), laptop còn ở mép dưới khung; exposure ≈ 0,60; chỉ còn handheld khi đang cuộn.
- **AC-SH-2 Texture dài.** Màn hình lớn hiện texture `screen-hold-<locale>.<hash>.avif` (JPG dự phòng) **≤ 1600×3600 px**, sRGB, **không KTX2**. Texture là ảnh chụp component thật `ScreenHoldStrip` (cùng tokens, cùng locale) bằng `npm run tex:shoot`. Dải gồm 3–4 "màn" của website mới và **900 px cuối là đúng khung `HeroScreen` 1600×900**. Thứ tự các màn chốt ở style frame "pha screen-hold".
- **AC-SH-3 Cuộn UV.** Offset V tăng **tuyến tính** theo tiến độ pha: 0 ở đầu pha, `(H − 900)/H` ở cuối pha; cuối pha vùng hiện trên màn hình là khung `HeroScreen`. Cuộn ngược thì chạy ngược.
- **AC-SH-4 Đọc được.** Ở khung cuối pha, chữ trên màn hình trong cảnh có cỡ hiệu dụng **≥ 14 px** ở viewport 1366×768.
- **AC-SH-5 Không claim lạ.** Texture chỉ chứa claim/số đã duyệt (production) và không có chữ tiếng Việt ở bản `en`.

**push-through và handoff (s = 180 → 200)**

- **AC-PT-1 Ngưỡng.** Máy tiến tiếp (`power2.in`), handheld đã tắt dần. Khi màn hình phủ **≥ 98% viewport**, section HTML thật `HeroScreen` được đặt `position: fixed` đúng vị trí và **crossfade 200 ms** đè lên canvas (theo thời gian, không theo cuộn).
- **AC-PT-2 Sau handoff.** Canvas ẩn, `frameloop="never"`, pin gỡ, cuộn native tiếp tục; texture lớn (dải screen-hold) được giải phóng. Cuộn ngược qua ngưỡng: chạy ngược lại (HTML mờ đi, canvas vẽ lại).
- **AC-PT-3 Khớp texture.** Chồng khung 3D cuối camera (`?hideHandoff&capture`) với khung HTML `HeroScreen` ở **1280×720, 1366×768, 1920×1080**: sai khác trung bình **≤ 6/255** (prototype 3,3). Viewport khác 16:9: `HeroScreen` căn kiểu "cover" khớp texture; `HeroScreen` dùng đơn vị `--u = min(1vw, 1.7778vh)`.
- **AC-PT-4 HeroScreen là H2.** `HeroScreen` dùng `<h2>` (không H1), gồm nav (component `SiteNav` dùng chung với header), H2, lead, 2 CTA, 3 trụ "Nhanh · Chuẩn · Minh bạch", khối minh họa `aria-hidden`. Trước handoff (khi `.film-armed`), `HeroScreen` có `inert`; sau handoff gỡ `inert`. Nếu khối minh họa có bản đồ Việt Nam thì áp NFR-MAP-01 cho cả HTML và texture.
- **AC-PT-5 Lỗi handoff.** Nếu crossfade hoặc canvas lỗi, `HeroScreen` vẫn là một section bình thường, đọc được, bấm được.
- **AC-PT-6 Dư âm 20 vh.** Sau handoff, lớp CSS `aria-hidden`, `pointer-events:none` (vignette, ánh xanh mép dưới, viền bezel) mờ dần 1 → 0 trong 20 vh cuộn native đầu tiên. Không dùng WebGL cho dư âm. Tắt khi reduced-motion.
- **AC-PT-7 Tới "Ba cửa vào".** Section `#ba-cua-vao` (H2, thuộc `site-shell-p0.md`) nằm ngay sau `HeroScreen`; gửi `film_handoff` một lần mỗi lượt xem khi handoff hoàn tất.

**Thanh chương (desktop)**

- **AC-CH-1** `<nav aria-label="Chương phim">` ở cạnh phải, 3 mục: "Phòng điều phối" (s = 0), "Một đơn vừa đến" (s ≈ 40), "Website trên màn hình" (s = 100); nhãn lấy từ `messages`. Mỗi mục là link thật tới mốc tương ứng, focus được, Enter nhảy tới mốc (cuộn tức thì nếu reduced-motion). Mục hiện tại có `aria-current="step"`. Ẩn sau handoff và ở T-STILL.

### 1.3 Bốn tầng thiết bị (theo `04` mục 3.1, chọn theo renderer thật)

| Tầng | Điều kiện (VÀ/HOẶC chính xác) | Hiển thị |
|---|---|---|
| **T-FULL** | `min(w,h) ≥ 768` VÀ `w ≥ 1024` VÀ `pointer:fine` VÀ GPU tier 3 (detect-gpu, benchmark tự host) VÀ renderer thật VÀ KHÔNG Save-Data VÀ KHÔNG reduced-motion | Canvas R3F, DPR [1; 2]. DOF/bloom **không** nằm trong contract này |
| **T-LITE** | Như T-FULL nhưng GPU tier 2, **hoặc** renderer thật nhưng detect-gpu không xếp được hạng (R15) | Canvas, DPR [1; 1,5], không DOF, không bóng động |
| **T-SEQ** | `w < 768` HOẶC (`pointer:coarse` VÀ `min(w,h) < 768`); VÀ KHÔNG reduced-motion VÀ KHÔNG Save-Data | Video dọc H.264 tua theo cuộn (mục 1.5). Dự phòng chuỗi ảnh chỉ khi G2 chuyển sang (Q7) |
| **T-STILL** | `prefers-reduced-motion: reduce` HOẶC `navigator.connection.saveData === true` HOẶC không JS HOẶC desktop/tablet không đủ điều kiện T-FULL/T-LITE: GPU tier 0–1, renderer khớp `/SwiftShader\|llvmpipe\|Basic Render\|Software/i`, tạo context WebGL2 thất bại, không đọc được renderer, hoặc mất WebGL context | Poster + ảnh tĩnh, không pin, không scrub |

Luật chọn tầng:
- **AC-T-1 Thứ tự đánh giá:** no-JS → reduced-motion → Save-Data → T-SEQ (theo kích thước/con trỏ) → điều kiện desktop (`min(w,h) ≥ 768` VÀ `w ≥ 1024` VÀ `pointer:fine`; không đạt thì T-STILL, ví dụ iPad ≥ 768 cả hai chiều) → probe WebGL2 + renderer → detect-gpu.
- **AC-T-2 Renderer thật:** đọc `UNMASKED_RENDERER_WEBGL` qua `WEBGL_debug_renderer_info`, không có thì `gl.RENDERER`. Không đọc được, hoặc chuỗi chung chung không xác định được phần cứng → coi là máy yếu → T-STILL. Thiếu `deviceMemory`/`navigator.connection` không bao giờ được hiểu là "máy mạnh"; riêng Save-Data thiếu thì coi như người dùng không bật.
- **AC-T-3 Một lần mỗi lượt tải:** tầng chọn một lần. Đổi kích thước/xoay máy làm đổi lớp bố cục thì **hạ** tại chỗ xuống "T-STILL tại chỗ" (mục 5, R-DOWN), không nâng tầng và không tải thêm asset nặng trong phiên.
- **AC-T-4 Guard FPS:** chỉ đo frame time trong cửa sổ **đang cuộn**; p90 > 25 ms trong 2 s cuộn → hạ một bậc (T-FULL → T-LITE → T-STILL tại chỗ), gửi `film_downgrade{from,to}`.
- **AC-T-5 Mất context:** `webglcontextlost` → chuyển ngay sang T-STILL tại chỗ ở đúng khung đang xem; desktop **không** nhận video dọc; gửi `webgl_context_lost`.
- **AC-T-6 Mặc định server:** HTML server render ở trạng thái tương thích T-STILL (poster + H1 + HeroScreen hiện). Chỉ sau hydrate và tầng là T-FULL/T-LITE/T-SEQ mới thêm class `.film-armed` để điều khiển lớp chuyển giao; reduced-motion, no-JS hoặc lỗi thì không có class này. Poster chỉ gỡ sau khi khung canvas/video đầu tiên đã vẽ (WebGL: sau 2 khung liên tiếp < 33 ms).
- **AC-T-7** Gửi `film_tier_selected{tier}` một lần mỗi lượt tải.

### 1.4 Thời điểm tải

- **AC-L-1 Không có gì nặng ở lần render đầu.** Probe GPU (kể cả tải benchmark detect-gpu) và `import()` chunk 3D **chỉ** chạy sau ý định đầu tiên (`wheel`, `scroll`, `pointermove`, `keydown`, `touchstart`) **hoặc** sau `load` + 2 s rảnh. Không bao giờ ở lần render đầu. Không dùng `React.lazy` import ngay.
- **AC-L-2 Làm nóng lúc rảnh.** Sau khung đầu của shot 0: tải trước asset pha kế tiếp, `renderer.compileAsync(scene, camera)` và `gl.initTexture` cho mọi texture. **Cấm** tải asset hoặc biên dịch shader trong lúc tiến độ cuộn đang đổi.
- **AC-L-3 Một canvas.** Một `<Canvas>` cho cả phim, `frameloop="demand"` (invalidate khi tiến độ đổi hoặc handheld đang chạy). Tiến độ cuộn ghi vào store/ref, không vào React state. IntersectionObserver: vùng phim ra khỏi khung nhìn → `frameloop="never"` + giải phóng texture lớn. Tab ẩn (`visibilitychange`) → ngừng vẽ.
- **AC-L-4 GSAP.** GSAP + ScrollTrigger chỉ nằm trong chunk phim (import động cùng `FilmStage`), không nằm trong JS tải đầu.

### 1.5 Video mobile (T-SEQ)

- **AC-V-1 Bố cục dọc.** Màn đầu: header, khối chữ (eyebrow, H1, lead, 2 CTA, link bỏ qua) **trên nền đặc**, poster dọc bên dưới; thanh Gọi/Zalo/Nhận báo giá ở đáy (`site-shell-p0.md`). Vùng phim: video **sticky 55svh** ở nửa trên; nửa dưới là danh sách chương (cùng DOM với thanh chương desktop) cuộn native. Chữ không đè lên video. Không badge "Prototype".
- **AC-V-2 Khung dọc riêng.** Video render riêng khung dọc (không cắt từ khung ngang): khung cuối lấy laptop + khoảng 2/3 màn hình lớn; chữ trong màn hình không bị cắt mép.
- **AC-V-3 Thông số.** H.264 540×960 mặc định (720×1280 chỉ khi DPR ≥ 3 VÀ `effectiveType = '4g'`), GOP ≤ 8, `-sc_threshold 0`, faststart, không âm thanh. HEVC/AV1 chỉ khi `mediaCapabilities.decodingInfo()` trả `powerEfficient: true`. Thông số cuối chốt sau ma trận G2 (NFR-PERF-13).
- **AC-V-4 Tải.** Không `preload="auto"`, không `requestIdleCallback`. Ở `touchstart` hoặc `scroll` đầu tiên: `fetch()` toàn bộ file shot thành `Blob` → `URL.createObjectURL`. Trước khi có Blob: giữ poster. Chỉ bật tua khi `canplaythrough`. iOS: ở `touchstart` đầu gọi `v.play().then(() => v.pause())`. Phim cắt nhiều file thì tải file kế khi còn 30% file hiện tại; giải phóng Blob của file đã qua (`revokeObjectURL`).
- **AC-V-5 Tua.** `currentTime = clamp(p_seq) × (duration − 0,05)`, gom theo rAF, **bỏ qua khi `v.seeking`** (bù lại ở `seeked`), dùng `requestVideoFrameCallback` nếu có. Sticky dùng đơn vị `svh`, `ScrollTrigger.config({ ignoreMobileResize: true })`.
- **AC-V-6 Kết thúc.** Cuối vùng phim, video mờ 200 ms sang section `HeroScreen` bố cục mobile. Không áp kiểm khớp pixel (AC-PT-3) cho T-SEQ.
- **AC-V-7 Độ dài.** Vùng scrub mobile mặc định 160svh (cho phép 140–200svh), cùng thứ tự pha với desktop.

### 1.6 T-STILL

- **AC-ST-1** Không pin, không scrub, không track 300 vh. Thứ tự: khối H1 trên poster (`<picture>`: nguồn dọc khi `max-width:767px`, ngang khi lớn hơn, AVIF + JPG, `fetchpriority="high"`, có `width`/`height`, `alt=""`) → ảnh tĩnh khung cuối `screen-hold` (lazy, `alt=""`) → `HeroScreen` → `#ba-cua-vao`.
- **AC-ST-2** Không tải chunk renderer phim (`WebGLFilm`, `VideoScrubFilm`, `SequenceFilm`), three/R3F, GLB, KTX2, HDRI, decoder, video hay chuỗi ảnh. GSAP chỉ được tải nếu motion 2.5D ngoài phim ở tầng Full (không áp khi reduced-motion).
- **AC-ST-3** "T-STILL tại chỗ" (hạ tầng giữa phiên): giữ nguyên chiều cao track để không nhảy cuộn, thay canvas bằng ảnh tĩnh gần khung đang xem nhất (poster hoặc ảnh screen-hold), lớp HTML (H1, HeroScreen) vẫn theo tiến độ; không tải thêm asset nặng.

### 1.7 Ngân sách (lấy từ `04` mục 7; CI đọc `budgets.json`)

| ID | Hạng mục | Ngưỡng | Đo |
|---|---|---|---|
| NFR-PERF-01 | LCP mobile trang chủ | Lab ≤ 2,5 s (field p75 ≤ 2,5 s hậu launch) | Lighthouse CI, preset mặc định |
| NFR-PERF-02 | Phản hồi khi cuộn phim | Không long task > 100 ms khi cuộn phim trên R-AND, T-SEQ (field INP p75 ≤ 200 ms) | Trace + RUM |
| NFR-PERF-03 | CLS | ≤ 0,1 (poster, video, font có kích thước sẵn) | Lighthouse + RUM |
| NFR-PERF-04 | Lighthouse trang chủ | Mobile ≥ 85, desktop ≥ 90 (CI SwiftShader → T-STILL theo thiết kế) | LHCI, median 3 lần |
| NFR-PERF-05 | TBT desktop | (a) LHCI ≤ 200 ms; (b) R-iGPU, từ load tới 10 s sau cú cuộn đầu: tổng long task > 50 ms ≤ 300 ms, không task nào > 200 ms | LHCI + Chrome trace máy thật |
| NFR-PERF-06 | JS tải đầu | ≤ 170 KB gz | `check-budgets` |
| NFR-PERF-07 | Chunk 3D | ≤ 290 KB gz | `check-budgets` |
| NFR-PERF-08 | Trang chủ mobile trước khi cuộn | ≤ 600 KB **byte truyền**, tới `load` + 5 s, không tương tác | Playwright `response.sizes()` |
| NFR-PERF-09 | Phim desktop (chunk 3D + GLB + texture, không tính JS chính, font) | T-FULL ≤ 2,2 MB · T-LITE ≤ 1,4 MB · shot 0–1 ≤ 1,2 MB | Playwright đếm byte, cuộn hết phim |
| NFR-PERF-09 | Video mobile | ≤ 110 KB/s phim, file đầu ≤ 400 KB, tải theo shot | `check-budgets` đọc `manifest.json` + `ffprobe` |
| NFR-PERF-10 | Cảnh | GLB phòng ≤ 900 KB · ≤ 150k tam giác · ≤ 60 draw call · VRAM texture ≤ 48 MB · KTX2 vật liệu ≤ 2048², ≤ 3 texture lớn | `gltf-transform inspect` + `renderer.info` |
| — | Texture màn hình | Tổng ≤ 400 KB; màn hình ≤ 1600×900; dải screen-hold ≤ 1600×3600; AVIF/JPG, không KTX2 | `check-budgets` |
| — | Poster | ≤ 150 KB desktop · ≤ 90 KB mobile (AVIF); ảnh tĩnh screen-hold cùng ngưỡng | `check-budgets` |
| — | HDRI | 1K, ≤ 250 KB | `check-budgets` |
| NFR-PERF-11 | Khung hình T-FULL | p95 ≤ 16,7 ms, R-HI, cuộn đều 30 s | rAF trace máy thật |
| NFR-PERF-12 | Khung hình T-LITE | p95 ≤ 20 ms, R-iGPU 1366×768 | rAF trace máy thật |
| NFR-PERF-13 | Tua video | Lệch `currentTime` ≤ 1 khung; không đứng hình > 150 ms khi cuộn nhanh 3 lần liên tục | R-IOS (cả Low Power Mode), R-AND (cả Data Saver) |
| NFR-PERF-14 | Bộ nhớ mobile | Tab không bị tải lại sau 3 lần cuộn hết phim | R-IOS, R-AND |

### 1.8 Request theo tầng

| Tầng | three/R3F, GLB, KTX2, HDRI, decoder | Video/chuỗi ảnh | Texture màn hình |
|---|---|---|---|
| T-FULL / T-LITE | Có, chỉ sau AC-L-1 | **0** | Có, sau AC-L-1 |
| T-SEQ | **0** | Có, chỉ sau cú chạm/cuộn đầu | 0 (đã nung trong video) |
| T-STILL | **0** | **0** | 0 |

### 1.9 Truy cập (a11y)

- **AC-A-1** `<canvas>` và `<video>` có `aria-hidden="true"`, không focus được; video `muted playsinline`, không `controls`.
- **AC-A-2** Reduced-motion → T-STILL (AC-ST-*), kể cả khi máy đủ GPU.
- **AC-A-3** Bàn phím: Space, PageDown/PageUp, mũi tên, Home/End cuộn native và phim theo đúng vị trí. Thứ tự Tab: SkipLink toàn site → header → "Bỏ qua phần giới thiệu" → CTA → thanh chương → (sau handoff) `HeroScreen` → `#ba-cua-vao`. Không phần tử nào nhận focus khi đang vô hình (`inert` trước handoff).
- **AC-A-4** axe: 0 lỗi serious/critical, 0 `color-contrast` ở `s = 0`, giữa screen-hold và sau handoff, cả VI và EN.
- **AC-A-5** Không JS: đủ H1, CTA, link bỏ qua, poster, `HeroScreen`, `#ba-cua-vao`; không có khoảng trống 300 vh.

### OUT OF SCOPE (rõ ràng)

- Shot của phương án B/C: `crane` xuống bản đồ trong phim, cảnh nhà khách, `orbit` dàn lạnh, `rack-focus`, thanh chương 6 chấm. Bản đồ 34 tỉnh của A+ là section HTML 2.5D sau phim (`site-shell-p0.md`).
- KHANG dưới mọi dạng (tượng, sticker, poster, OG, video).
- Lenis/smooth scroll; ScrollSmoother.
- DOF, bloom, `@react-three/postprocessing` (chỉ cân nhắc sau khi đo trên GPU thật, cần CR nhỏ).
- WebGL cho iPad/iPhone (G9, sau RUM). Video mobile render từ Blender (sau launch).
- Video loop hero trang con (`03` 7.5): làm sau, trang con dùng poster tĩnh theo `site-shell-p0.md`.
- Các section sau `HeroScreen` (Ba cửa vào, bản đồ, KPI…), header/footer: `site-shell-p0.md`.
- Form lead, API, DB, CMS, `/tra-cuu`: contract riêng.
- Phương án Q (quay thật).

---

## 2. Database Schema

**Không áp dụng.** Phim là lớp trình bày trên HTML do server render. Dữ liệu (claim, số liệu, chữ VI/EN) đọc từ `content/*.ts` và `messages/*.json` lúc build. Không bảng, không migration.

## 3. API Contract

**Không áp dụng.** Không có endpoint. Thay vào đó là hợp đồng tài nguyên tĩnh mà dev và CI dựa vào:

```
GET /film/<name>.<hash>.<ext>        tĩnh, Cache-Control: public, max-age=31536000, immutable
                                     + header bảo mật như mọi đường dẫn (HSTS, nosniff, Referrer-Policy)
public/film/manifest.json            sinh bởi `npm run film:render` + `npm run tex:shoot`, Zod validate lúc build
{
  "version": 1,
  "variant": "A+",
  "locales": ["vi", "en"],
  "desktop": {
    "glb":      { "file": "dispatch-room.<hash>.glb", "bytes": 0, "triangles": 0, "drawCalls": 0 },
    "textures": [{ "id": "laptop|phone|hero|screenHold", "locale": "vi", "file": "...", "w": 1600, "h": 900, "bytes": 0 }],
    "hdri":     { "file": "...", "bytes": 0 }
  },
  "mobile": [{ "shot": "a-plus", "locale": "vi", "codec": "h264|hevc|av1", "w": 540, "h": 960,
               "durationS": 0, "gop": 8, "bytes": 0, "file": "..." }],
  "posters":  [{ "id": "shot0|hold", "orientation": "landscape|portrait", "format": "avif|jpg", "bytes": 0, "file": "..." }],
  "og":       [{ "locale": "vi", "file": "...", "w": 1200, "h": 630, "noKhang": true }]
}
```

Build fail nếu manifest sai schema, thiếu locale, `noKhang !== true`, hoặc vượt ngân sách mục 1.7.

## 4. RBAC Map

**N/A.** Trang công khai, không đăng nhập. Cờ kiểm thử `?mode=full|lite|seq|still`, `?capture`, `?clean`, `?hideHandoff`, `?noKhang`, `?tex=` **chỉ** có tác dụng khi `NODE_ENV !== 'production'` hoặc request có header nội bộ do openresty staging gắn. Ở production các cờ này bị bỏ qua.

## 5. Business Rules & Edge Cases

```
R-CLAIM — câu khẳng định và số liệu
  - Mọi claim (34 tỉnh, chuẩn hãng, E-KYC, bảo hành, "24/7"…) đọc từ content/claims.ts {id, text{vi,en},
    evidence, approvedBy, approvedAt}; số liệu từ content/stats.ts {id K1–K6, value|null, definition, updatedAt}.
  - Production: claim chưa có approvedBy → không render (phần chứa nó thu gọn, không để khoảng trống);
    số null → ẩn ô. Áp cho HTML, texture, poster, OG, video.
  - DRAFT_PREVIEW=1 (chỉ local/staging, luôn noindex): hiện claim/số chưa duyệt kèm nhãn "Nháp".
  - Build production fail khi: SITE_ENV=production mà DRAFT_PREVIEW=1; tham chiếu id claim/stat không tồn tại;
    output (HTML, texture đã chụp) chứa chữ của claim chưa duyệt, nhãn "Nháp" hoặc chuỗi TODO_DATA.
  - Ví dụ: claim "coverage-34" chưa duyệt → eyebrow dùng câu dự phòng không có số; tagline T2 (có "34 tỉnh")
    không dùng được ở production.

R-TEXTURE — màn hình trong cảnh
  - Texture chụp từ component thật cho từng locale; sửa HeroScreen/ScreenHoldStrip/DispatchDashboard →
    chạy lại tex:shoot + test:visual trong cùng PR.
  - Texture production chụp với DRAFT_PREVIEW tắt.

R-DOWN — hạ tầng giữa phiên (FPS, mất context, đổi kích thước)
  - Chỉ hạ, không nâng. Giữ chiều cao track, không nhảy cuộn. Không tải asset nặng mới.

EDGE CASES
- Vào trang có hash (#ba-cua-vao, #...) hoặc khôi phục vị trí cuộn (back/forward, bfcache `pageshow`):
  trạng thái phim tính lại từ vị trí cuộn hiện tại; không tự chạy cú máy nào theo thời gian.
- Cuộn rất nhanh/kéo thanh cuộn qua cả phim: không được kẹt ở trạng thái nửa chừng; handoff khớp vị trí cuối.
- Cuộn ngược từ dưới lên qua handoff: HTML mờ đi, canvas vẽ lại từ texture đã giải phóng → tải lại ở lúc
  rảnh; trong lúc chờ hiện ảnh tĩnh screen-hold, không biên dịch shader khi tiến độ đang đổi.
- Blob video chưa tải xong mà người dùng đã cuộn qua phim: poster đứng yên, không chặn cuộn; tải xong thì
  tua tới đúng vị trí.
- Video lỗi giải mã/không phát: T-STILL tại chỗ cho phiên này.
- In trang (@media print): bố cục T-STILL, ẩn canvas/video/thanh chương.
- Zoom trình duyệt 200% / cỡ chữ lớn: khối H1 không tràn ngang, không bị cắt chữ có dấu.
- Viewport rất thấp (h < 600, desktop): giữ tầng theo luật 1.3; lớp chữ không bị cắt (cuộn trong khối).
- Prefers-reduced-motion đổi giữa phiên: áp ở lượt tải sau; trong phiên hiện tại hạ về T-STILL tại chỗ.

KHÔNG XỬ LÝ trong contract này: xem OUT OF SCOPE mục 1.
```

## 6. Security Requirements

```
DỮ LIỆU
[ ] Không thu dữ liệu cá nhân. Sự kiện analytics chỉ gồm tên sự kiện, tầng, tiến độ, đích CTA, locale.
[ ] Không gửi IP/UA chi tiết từ client; Umami tự host (khi cài) không cookie.

CẤU HÌNH
[ ] Cờ kiểm thử (mục 4) vô hiệu ở production; test xác nhận ?capture/?mode không đổi hành vi production.
[ ] Decoder meshopt/basis, benchmark detect-gpu, font tự host trong /public; không CDN ngoài.
[ ] CSP (Report-Only 1 tuần trước khi bật): media-src 'self' blob:; worker-src 'self' blob: (nếu decoder
    dùng worker); img-src 'self' data: blob:; không 'unsafe-eval'. Ghi danh sách nguồn vào DECISIONS.md.
[ ] /film/* có HSTS, nosniff, Referrer-Policy (include snippet header trong location riêng, `04` 2.7).
[ ] Blob URL thu hồi khi không dùng; không chèn HTML từ dữ liệu ngoài vào texture.
[ ] Không model-viewer, không Spline runtime.

QUYỀN TÀI SẢN
[ ] GLB/texture từ 3D artist có hợp đồng chuyển giao quyền; không asset AI/stock không rõ giấy phép.
[ ] noKhang bắt buộc cho poster, OG, video, texture (manifest kiểm).
```

## 7. Test Checklist (ánh xạ AC → test)

Ghi chú: CI chạy trên SwiftShader nên tự chọn T-STILL (đúng thiết kế). Đường T-FULL/T-LITE/T-SEQ trong CI được ép bằng `?mode=` (chỉ non-production). Số FPS từ CI ghi "SwiftShader, không đại diện"; NFR khung hình chỉ nghiệm thu trên máy thật.

| AC | Test | Loại |
|---|---|---|
| AC-S0-1, AC-S1-1, AC-S1-2, AC-S1-3, AC-SH-1, AC-PT-1 (thông số) | `tests/unit/camera.test.ts`: Zod schema `camera.json`; nội suy tại t = 0 / 0,5 / 1 khớp keyframe; yaw₀ ∈ [25°, 35°], roll₀ ∈ [2°, 4°] (trị tuyệt đối), cao ∈ [1,15; 1,20] m, FOV 46 → 38, yaw cuối 0 ± 0,5, exposure(0,45) = 1,15 và exposure(0,80) = 0,60 ± 0,02, fillWidth ∈ [0,85; 0,90], pushThrough.fillThreshold = 0,98, crossfadeMs = 200, tổng track ∈ [275; 325] vh | Tự động |
| AC-S0-2, AC-S0-3, AC-S0-4, AC-S1-4, AC-SH-2, AC-SH-3 | `tests/film-visual.spec.ts`: 6 khung then chốt × T-FULL/T-SEQ/T-STILL so ảnh chuẩn (image `playwright:v1.62.0-noble`): **01** s = 0 · **02** p1 = 0,5 · **03** cuối dolly-in · **04** giữa screen-hold · **05** cuối screen-hold · **06** handoff + 10 vh dư âm | Tự động + người duyệt ảnh chuẩn (dàn lạnh thấy trọn, đạo cụ, không KHANG/logo) |
| AC-SH-4 | `film-visual.spec.ts`: đo cỡ chữ hiệu dụng trên khung 05 ở 1366×768 ≥ 14 px (tỉ lệ texture → màn hình × cỡ chữ component) | Tự động |
| AC-PT-3, AC-SH-2 (900 px cuối) | `tests/film-handoff.spec.ts`: diff khung cuối camera (`?hideHandoff&capture`) với HTML ở 1280×720, 1366×768, 1920×1080 ≤ 6/255; diff 900 px cuối dải screen-hold với ảnh chụp `HeroScreen` ≤ 2/255 | Tự động |
| AC-PT-2, AC-PT-5, AC-PT-6 | `tests/e2e/film-handoff-flow.spec.ts`: sau ngưỡng canvas ẩn, không còn rAF của canvas, pin gỡ, cuộn ngược khôi phục; chặn canvas (route abort) → HeroScreen vẫn hiển thị và bấm được | Tự động |
| AC-S0-5, AC-PT-4, AC-A-5 | `tests/seo-render.spec.ts`: UA Googlebot smartphone, 412 × scrollHeight, không cuộn, có/không JS, mọi tầng ép bằng `?mode`: `h1` = 1, H1/CTA opacity ≥ 0,9 và trong viewport; `HeroScreen` không chứa `h1` | Tự động |
| AC-S0-6, R-CLAIM | `tests/unit/claims.test.ts` + `scripts/check-claims-output.mjs` (quét `.next` và texture đã chụp sau build production) | Tự động |
| AC-S0-7, AC-S0-11, AC-A-4 | `tests/unit/scrim-contrast.test.ts` (lấy mẫu pixel poster dưới hộp chữ, ghép scrim, tính tỉ lệ ở pixel xấu nhất) + `tests/a11y.spec.ts` (axe ở s = 0, giữa screen-hold, sau handoff, VI/EN) | Tự động |
| AC-S0-8, AC-S0-9, AC-A-3, AC-CH-1 | `tests/e2e/skip-link.spec.ts`: Tab đầu tiên sau header là link bỏ qua; Enter → `#ba-cua-vao` trong viewport và có focus; CTA đúng href theo locale; thanh chương focus/Enter/`aria-current`; không focus vào phần tử `inert` | Tự động (desktop + mobile) |
| AC-S0-10, AC-L-3 | `tests/e2e/film-idle.spec.ts`: đếm khung vẽ (hook `__frames` ở non-production) — đứng yên 2 s sau khi dừng cuộn: 0 khung mới; ra khỏi vùng phim: `frameloop` = never | Tự động |
| AC-T-1 … AC-T-3, AC-T-6 | `tests/unit/film-tier.test.ts`: bảng quyết định (width, height, pointer, reduced-motion, saveData, renderer, tier, webgl2) → tầng mong đợi, gồm iPad 768×1024 cảm ứng → T-STILL, điện thoại xoay ngang 844×390 → T-SEQ, renderer SwiftShader/llvmpipe → T-STILL, renderer không đọc được → T-STILL, tier không xếp hạng → T-LITE | Tự động |
| AC-T-4 | `tests/unit/fps-guard.test.ts`: chuỗi frame time giả lập; chỉ tính khi đang cuộn; p90 > 25 ms trong 2 s → hạ đúng một bậc | Tự động |
| AC-T-5, AC-ST-3 | `tests/e2e/context-lost.spec.ts`: gọi `WEBGL_lose_context.loseContext()` giữa dolly-in → ảnh tĩnh tại chỗ, `scrollY` không đổi, 0 request video, có sự kiện `webgl_context_lost` | Tự động |
| AC-L-1, AC-L-4, mục 1.8 | `tests/modes.spec.ts` (từ `prototype/scripts/check-modes.mjs`): theo từng tầng liệt kê request; T-STILL/T-SEQ không có three/GLB/KTX2/HDRI/decoder; T-STILL không có video; T-FULL/T-LITE không có video; request chunk 3D bắt đầu **sau** sự kiện ý định đầu hoặc sau load + 2 s; JS tải đầu không chứa GSAP | Tự động |
| AC-V-1 … AC-V-7 | `tests/e2e/video-scrub.spec.ts` (390×844, `isMobile`, `hasTouch`): 0 request video trước tương tác; sau `touchstart` có đúng 1 fetch Blob; cuộn 50% vùng phim → `currentTime` đúng công thức ± 1 khung; không `preload="auto"` | Tự động |
| NFR-PERF-08 | `tests/perf/home-bytes.spec.ts`: byte truyền tới load + 5 s, không tương tác, mobile ≤ 600 KB (qua openresty staging có brotli) | Tự động |
| NFR-PERF-06/07/09/10, ngân sách texture/poster/HDRI | `npm run budget` (`scripts/check-budgets.mjs` + `manifest.json`) | Tự động, chặn merge |
| NFR-PERF-01/03/04/05a | `npm run lhci` (trang chủ VI + EN, mobile + desktop, median 3 lần, throttling mặc định) | Tự động |
| NFR-PERF-02/05b/11/12 | Trace Performance trên R-iGPU 1366×768 (Chrome/Edge), R-HI, R-AND; script ghi frame time trong `useFrame` | **Máy thật** |
| NFR-PERF-13/14 | Script ghi `currentTime`/tiến độ mỗi rAF, đọc qua Safari Web Inspector (Mac mượn) và Chrome remote debug; 3 lần cuộn hết phim | **Máy thật** (R-IOS cả Low Power Mode, R-AND cả Data Saver) |
| AC-ST-1, AC-ST-2, AC-A-2 | `tests/e2e/reduced-motion.spec.ts` (`reducedMotion: 'reduce'`): 0 request GLB/three/video, 0 pin (không phần tử `position: sticky` của track), 0 scrub | Tự động |
| AC-A-5 | `tests/e2e/no-js.spec.ts` (`javaScriptEnabled: false`): đủ H1, CTA, link bỏ qua, poster, HeroScreen; chiều cao trang không có khoảng trống track | Tự động |
| Mục 6 | `tests/e2e/prod-flags.spec.ts` (build production local): `?mode=full&capture` không đổi tầng; header `/film/*` có HSTS/nosniff | Tự động |
| AC-PT-4 (nếu có bản đồ) | `tests/map-sovereignty.spec.ts` (NFR-MAP-01) chạy cả trên texture/poster/OG bằng mask tọa độ | Tự động + pháp chế ký |
| Safari/iOS, Edge | NFR-COMP-02: trang chủ cả 4 tầng trên Safari macOS/iOS 15–17, Edge Windows | **Máy thật** |

REGRESSION
[ ] `site-shell-p0.md`: overflow 9 breakpoint, 1 H1/trang, i18n vẫn xanh sau khi gắn phim.
[ ] Trang chủ khi tắt phim (cờ `NEXT_PUBLIC_FILM=0`) vẫn là mốc M2: H1 + poster + HTML.

---

## 8. Câu cần anh xác nhận

| # | Câu hỏi | Mặc định nếu anh chưa trả lời | Ảnh hưởng tới file này |
|---|---|---|---|
| 1 | Tagline H1: **T1** "Hạ tầng lắp đặt toàn quốc cho hãng điện máy", T2 "Lắp đặt chuẩn hãng. 34 tỉnh thành. Một đầu mối.", hay T3 "Bán ở đâu, lắp chuẩn ở đó."? | T1. T2 chỉ dùng được khi claim "34 tỉnh" có bằng chứng | Chữ H1 shot 0, texture HeroScreen VI/EN |
| 2 | Eyebrow phạm vi tỉnh: ghi số ("Mạng lưới lắp đặt [__] tỉnh/thành") hay câu không số? | Câu không số cho tới khi claim phạm vi tỉnh được duyệt; có bằng chứng thì hiện số từ `content/stats.ts` K2 | Eyebrow shot 0, texture |
| 3 | Slug: VI không dấu, EN slug riêng, giữ slug bài viết VI? | Có cả ba (`03` 10.2) | Đích CTA (`/lien-he`, `/doi-tac-tho`, bản EN) |
| 4 | Bài lạc đề "ky-nguyen-ai-…": 410 hay giữ? | 410 cả VI và EN | Không ảnh hưởng phim (thuộc `site-shell-p0.md`) |
| 5 | **Handoff thật hay cắt trắng 1 khung?** | **Handoff thật** (prototype đã khớp 3,3/255) | Nếu cắt trắng: bỏ AC-PT-3 và `film-handoff.spec.ts`, thay bằng 1 khung `blue-50` rồi hiện HeroScreen; giảm khoảng 2 giờ G5 |
| 6 | Nội dung 3–4 "màn" trong dải screen-hold (AC-SH-2) | Chốt ở style frame "pha screen-hold" | Texture `ScreenHoldStrip` |
| 7 | Đích tạm của 2 CTA khi form chưa có contract (`/lien-he#kinh-doanh`, `/doi-tac-tho#dang-ky`) có ổn không? | Có | AC-S0-8 |

Khi anh trả lời "OK proceed", thêm dòng `## STATUS: APPROVED — <ngày>` lên đầu file kèm email xác nhận.
