# Số đo prototype hero "máy quay tiến vào màn hình"

Đo ngày 01/10/2026 trên bản build production (`vite build`, phục vụ bằng `vite preview` ở 127.0.0.1:9620).
Trình duyệt: Chromium 1234 headless, đồ họa **SwiftShader (render bằng CPU)**. Nguồn số: `shots/modes.json`, file `capture-info.json` do `scripts/capture.mjs` ghi ra, và gzip -9 các file trong `dist/`.

> **FPS đo trên SwiftShader KHÔNG đại diện máy thật.** SwiftShader vẽ bằng CPU, chạy được khoảng 2,3 khung/giây với cảnh này. Số FPS thật phải đo lại trên máy có GPU (laptop văn phòng có card tích hợp, MacBook, Android tầm trung), xem mục 5.

## 1. JavaScript

| Chunk | Raw | Gzip -9 | Tải khi nào |
|---|---|---|---|
| `index-*.js` (React 19.3 + react-dom + GSAP 3.15 core + ScrollTrigger + hero HTML) | 337,0 KB | **113,0 KB** | Mọi chế độ |
| `Scene-*.js` (three 0.186 + R3F 9.8 + phần drei dùng tới + GLTFLoader/Meshopt) | 1.221,1 KB | **359,0 KB** | Chỉ desktop có 3D (`React.lazy`) |
| `TexPages-*.js` (trang dựng texture) | 6,4 KB | 2,4 KB | Không bao giờ ở trang thật (chỉ khi `?tex=`) |
| CSS | 7,9 KB | 2,3 KB | Mọi chế độ |

- Mobile và reduced-motion **không tải three.js** (đã kiểm: `hasCanvas: false`, không có request `Scene-*.js`).
- Trong chunk 3D, three core chiếm phần lớn. Đã bỏ `<Environment>` của drei (kéo theo bộ nạp EXR/HDR) và thay bằng PMREM tự dựng, tiết kiệm khoảng 14 KB gz.
- Nếu bản thật chỉ cần tiến độ cuộn, có thể thay ScrollTrigger bằng phép tính cuộn tự viết (bớt khoảng 40 KB gz ở chunk chính). Chỉ nên giữ GSAP nếu còn dùng cho motion khác.

## 2. Tổng dung lượng tải theo chế độ (byte thân response, chưa nén HTTP)

| Chế độ | Request | Tổng | Thành phần nặng |
|---|---|---|---|
| Desktop 3D (1280×720) | 17 | 2.697 KB | Scene.js 1.221 KB raw, KHANG GLB 613 KB, 3 texture màn hình 273 KB |
| Reduced-motion (poster tĩnh) | 11 | 540 KB | index.js 337 KB raw, poster 45 KB, font 99 KB |
| Mobile 390×844 (video tua theo cuộn) | 12 | 1.471 KB | hero-mobile.mp4 933 KB |

`vite preview` không bật gzip. Khi chạy production sau nginx/openresty có gzip hoặc brotli, phần JS chỉ còn khoảng 113 + 359 KB.

## 3. Cảnh 3D

| Chỉ số | Giá trị |
|---|---|
| Draw call / khung | **36** (desktop), 37 (khung dọc) |
| Tam giác / khung | **71.205** (`renderer.info`). KHANG chiếm khoảng 62,6k (GLB tối ưu `khang-opt-15`). Phần dựng thủ tục khoảng 8,6k |
| Geometry trên GPU | 53 |
| Texture trên GPU | 22 (gồm render target của ContactShadows và PMREM) |
| Đèn | 1 ambient, 1 point, 1 spot, 3 RectAreaLight (màn hình lớn, laptop, dải LED cam sau màn) |
| Bóng | ContactShadows chỉ vẽ 1 lần (`frames={1}`), không có shadow map động |
| Sẵn sàng (load đến lúc cảnh vẽ xong) | 6,3–10,2 s trên SwiftShader, localhost |

### Kích thước texture

| Texture | Kích thước | File | VRAM ước tính (RGBA + mipmap) |
|---|---|---|---|
| Màn hình lớn = ảnh chụp hero HTML | 1600×900 | `tex/hero.jpg` 128 KB | ~7,7 MB |
| Laptop = bản đồ đơn hàng | 1440×900 | `tex/dispatch.jpg` 95 KB | ~6,9 MB |
| Điện thoại = app thợ | 540×1170 | `tex/phone.jpg` 51 KB | ~3,4 MB |
| Tranh bản đồ trên tường | 600×1000 (SVG) | `vn-map.svg` 50 KB (18 KB gz) | ~3,2 MB |
| Vân gỗ bàn (canvas) | 1024×512 | dựng lúc chạy | ~2,8 MB |
| Tường vữa, cửa sổ đêm (canvas) | 256×256, 256×320 | dựng lúc chạy | <1 MB |
| KHANG (trong GLB) | 1024×1024 + 512×512 | trong `khang.glb` 613 KB | ~7 MB |

Tổng VRAM texture ước tính khoảng 31 MB. Trên mobile không có con số này vì mobile không chạy WebGL.

## 4. Asset video và ảnh

| File | Thông số | Dung lượng |
|---|---|---|
| `demo-desktop.mp4` (bằng chứng) | 1280×720, 12 fps, 7,0 s, 84 khung, H.264 CRF 20 | 1.708 KB |
| `hero-mobile.mp4` (asset mobile thật) | 720×1280, 24 fps, 4,0 s, 96 khung, H.264 CRF 25, **GOP 4** để tua mượt | 933 KB |
| `public/poster.jpg` | 1280×720, khung đầu, không có chữ DOM | 45 KB |
| `public/poster-mobile.jpg` | 720×1280 | 44 KB |

Kiểm tra tua video: ở 50% cuộn trên khung 390×844, `video.currentTime` bằng 2,30 s, tức 0,5/0,86 của 4 s. Đúng công thức tiến độ.

## 5. Chưa đo được (cần máy thật)

- FPS và thời gian mỗi khung trên GPU thật. Đề xuất ngưỡng NFR: P95 frame time ≤ 16,7 ms trên laptop có GPU tích hợp ở 1366×768, đo bằng `performance.now()` trong `useFrame`, 30 giây cuộn liên tục.
- ~~LCP và TBT bằng Lighthouse có throttling.~~ **Đã đo ở vòng phản biện 01/10/2026** (mục 6). Câu cũ "poster là phần tử LCP ứng viên và three.js được tải sau" là **sai**: xem mục 6.
- Safari/iOS: RectAreaLight, `video.currentTime` khi cuộn nhanh (iOS hay giật nếu GOP dài), và giới hạn bộ nhớ texture.
- Độ trễ mạng thật: mọi số ở đây đo qua localhost.

## 6. Lighthouse (vòng phản biện 01/10/2026)

Lighthouse 12.8.2 mặc định (simulate; mobile: RTT 150 ms, 1,6 Mbps, CPU 4×), chạy trên `dist/` phục vụ có gzip qua 127.0.0.1, SwiftShader. Cùng cách đo với `../research/lighthouse-summary.txt`. Số do người phản biện đo, **chưa lưu file JSON vào repo**; G2 đo lại và lưu.

| Chế độ | Perf | LCP | TBT | Ghi chú |
|---|---:|---:|---:|---|
| Desktop | **61** | 0,4 s | **39.400 ms** | Mainthread 45 s, long task 4.530 ms và 1.406 ms. Site cũ: Perf 60, TBT 36.430 ms, tức **không tốt hơn** |
| Mobile | — | 1,8 s | — | Tổng 1.212 KiB. `hero-mobile.mp4` request ở 206 ms, ngay sau poster (186 ms) |

Đọc số:
- **Chunk 3D không tải sau LCP.** `Scene-*.js` bắt đầu ở 152 ms, cùng lúc `poster.jpg`; `khang.glb` ở 358 ms; `tex/*` ở 532 ms. `React.lazy` bắt đầu import ngay ở lần render đầu khi `mode === 'scene'`.
- **Phần tử LCP là chữ `div.film-caption`** ở cả mobile và desktop, không phải poster. Poster chỉ xuất hiện sau khi JS chạy xong vì `#root` rỗng trong HTML.
- **H1 duy nhất nằm trong lớp handoff ở opacity 0** tới tiến độ 0,8. Googlebot (không cuộn) không thấy H1.
- Cách sửa đưa vào production (`../04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md` mục 2.3, 3.1, 3.2, 3.5): chọn tầng theo renderer thật (SwiftShader → T-STILL), import 3D sau ý định đầu tiên, server render poster + H1 hiện sẵn, video tải ở lần chạm/cuộn đầu dưới dạng Blob.

## 7. Encode lại `hero-mobile.mp4` (vòng phản biện, ffmpeg 7.0.2 trên bbsw, cùng 96 khung 4 s)

| Thông số | Dung lượng |
|---|---:|
| 720p / CRF 24 / GOP 4 | 975 KB |
| 720p / CRF 24 / GOP 12 | 716 KB |
| 720p / CRF 28 / GOP 4 | 725 KB |
| 540p / CRF 24 / GOP 4 | 631 KB |
| 540p / CRF 28 / GOP 8 | 303 KB |

Bản ffmpeg trên bbsw có `libx264`, `libx265`, `libaom-av1`, **không có `libsvtav1`** (đã kiểm `ffmpeg -encoders`). Ngân sách mới theo tốc độ bit: ≤ 110 KB/s phim, 540×960 mặc định, GOP ≤ 8.

## 8. Sửa nhỏ sau phản biện (đã build lại `dist/` ngày 01/10/2026)

- Caption bỏ "trên 34 tỉnh/thành" (chưa có bằng chứng): "Nơi mỗi đơn lắp đặt được giao đúng kỹ thuật viên gần nhất."
- Link "Bỏ qua phần giới thiệu ↓" nhìn thấy được, trỏ tới `#ba-cua-vao` (section sau phim) thay vì H1 đang ẩn.
- Tua video gom theo rAF, bỏ qua khi `seeking`, bù lại ở `seeked`.
- Khung sticky dùng `100svh` (thanh công cụ Safari iOS không che caption).
- Nhãn texture laptop "thời gian thực" → "minh họa" trong `src/TexPages.jsx`. **Texture `public/tex/dispatch.jpg`, `shots/*` và video chưa chụp lại**, nên ảnh hiện tại vẫn là bản cũ. G2 chụp lại cùng các thay đổi A+.
- Chunk sau khi build lại: `index-*.js` 113,1 KB gz, `Scene-*.js` 359,4 KB gz (gzip -9), không đổi đáng kể.
