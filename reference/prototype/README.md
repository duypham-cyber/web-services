# Prototype hero "máy quay tiến vào màn hình" (Bluebolt Services)

Prototype này dựng lại **ngôn ngữ điện ảnh của video quảng cáo** (`../research/tiktok/sheets/camera_0-8s.jpg`): mở bằng cảnh rộng chéo góc trong phòng tối, máy quay dolly-in và xoay dần về chính diện, có rung tay nhẹ, cho tới khi màn hình lấp khung. Bố cục và màu của site nội thất trong video **không** được dùng.

Áp vào web: **người dùng cuộn trang = máy quay di chuyển**. Khi màn hình lớn lấp khung, cảnh 3D hòa sang **hero HTML thật**. Từ đó trang là HTML bình thường: chọn được chữ, bấm được nút, máy tìm kiếm đọc được.

- Video bằng chứng: `demo-desktop.mp4` (1280×720, 7 s)
- Khung then chốt: `shots/01…06-*.png` · Contact sheet: `shots/sheet.jpg`
- Asset mobile sinh từ chính cảnh 3D: `hero-mobile.mp4` (720×1280)
- Số đo: `MEASUREMENTS.md`

## Chạy thử

```bash
cd /home/bbsw/WorkspaceDuy/LapDatToanQuoc/prototype
npm install            # lần đầu
npm run build
npm run preview        # http://127.0.0.1:9620  (chỉ bind 127.0.0.1)
# hoặc npm run dev     # http://127.0.0.1:9621
```

Muốn xem từ máy khác thì dùng SSH tunnel: `ssh -L 9620:127.0.0.1:9620 bbsw@<máy>`. Không mở cổng ra ngoài.

### Tham số URL để kiểm thử

| Tham số | Tác dụng |
|---|---|
| `?mode=scene` / `video` / `still` | Ép chế độ 3D, video mobile, hoặc poster tĩnh, bất kể thiết bị |
| `?capture` | Bỏ làm mượt; thời gian rung tay lấy từ `window.__t` để khung hình lặp lại được |
| `?clean` | Ẩn chữ DOM phủ trên cảnh (dùng khi chụp poster hoặc quay video) |
| `?hideHandoff` | Không hiện hero HTML (để so độ khớp chuyển giao) |
| `?tex=hero` / `dispatch` / `phone` | Render từng "màn hình" để chụp làm texture |

## Cách hoạt động

```
cuộn 0 ──────────── 0.55 ── 0.72 ─ 0.80 ── 0.86 ── 0.93 ─── 1.0 ──▶ trang HTML tiếp tục
 khung rộng chéo ~38°,     ẩn thanh     camera tới     hero HTML     cảnh 3D ngừng vẽ
 nghiêng 3°, rung tay      trên DOM     "lấp khung"    hiện rõ 100%  (frameloop=never)
 dolly-in + xoay về chính diện ──────▶  rung tay tắt dần từ 0.62
```

- `src/scrollStore.js`: các mốc tiến độ (`CAMERA_END`, `HANDOFF_IN`, `HANDOFF_FULL`).
- `src/App.jsx`: GSAP ScrollTrigger đọc tiến độ của khối `.scene-track` (cao 420vh, khung sticky 100vh). Tiến độ được ghi thẳng vào store và style DOM, không qua React state.
- `src/Scene.jsx`: cảnh R3F dựng thủ tục. `CameraRig` nội suy vị trí và điểm nhìn bằng 2 đường CatmullRom. Có làm mượt `damp`, FOV 46°→38°, roll −3,2°→0 và rung tay bằng tổng sin lệch pha.
- **Chuyển giao khớp từng pixel:** hero HTML (`src/Hero.jsx`) dùng đơn vị `--u = min(1vw, 1.7778vh)` nên bố cục 16:9 giống nhau ở mọi cỡ. Texture màn hình lớn là ảnh chụp chính component này ở 1600×900. Camera dừng ở khoảng cách mà màn hình 16:9 phủ đúng khung. Kiểm tra chồng ảnh khung 3D (p=0.87) với HTML (p=0.99): sai khác trung bình 3,3/255, hai lớp không lệch nhau.
- **Fallback:**
  - `prefers-reduced-motion`: chỉ hiện poster tĩnh, hero HTML nằm ngay bên dưới, không tải three.js.
  - Mobile (≤767 px): **không chạy WebGL**. Phát `hero-mobile.mp4`, cuộn để tua `currentTime`. Video được encode GOP 4 để tua mượt. Chỗ chọn chế độ có ghi chú trong `useMode()` ở `App.jsx`.
  - Desktop: poster hiện khi JS chạy, chunk three.js nạp bằng `React.lazy`. **Lưu ý (vòng phản biện):** `React.lazy` import ngay ở lần render đầu, nên chunk 3D, GLB và texture tải **song song** với poster, không phải sau LCP; phần tử LCP thực tế là caption chữ. Lighthouse desktop 61, TBT 39.400 ms, không hơn site cũ (`MEASUREMENTS.md` mục 6). Cách sửa cho production ở `../04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md` mục 3.1.

## Dựng lại asset

```bash
node scripts/make-map-svg.mjs                      # vn-map.svg + tâm 34 tỉnh (có nhãn QĐ. Hoàng Sa, QĐ. Trường Sa)
npm run dev &                                      # cổng 9621
node scripts/shoot-textures.mjs http://127.0.0.1:9621   # public/tex/*.jpg
npm run build && npm run preview &                 # cổng 9620
# poster + khung bằng chứng + khung mobile
node scripts/capture.mjs http://127.0.0.1:9620 1280 720 1  out/poster 0 0 "&clean"
node scripts/capture.mjs http://127.0.0.1:9620 1280 720 84 out/desk   0 1.22
node scripts/capture.mjs http://127.0.0.1:9620 720 1280 96 out/mob    0 0.86 "&clean&hideHandoff"
ffmpeg -framerate 24 -i out/mob/f_%03d.png -c:v libx264 -pix_fmt yuv420p -crf 25 -g 4 -keyint_min 4 -an -movflags +faststart public/hero-mobile.mp4
node scripts/check-modes.mjs                       # kiểm 3 chế độ → shots/mode-*.png, shots/modes.json
```

Biến môi trường để chạy Chromium trên máy bbsw: `LD_LIBRARY_PATH=/home/bbsw/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu`. Các script tham chiếu `playwright-core` trong scratchpad của phiên làm việc. Khi đưa vào repo thật, chuyển nó thành devDependency.

## Hạn chế của prototype

1. **Đồ vật dựng thủ tục bằng khối cơ bản.** Laptop, màn hình, đèn và máy lạnh đọc được là "vật gì" nhưng chưa đạt chất lượng thương mại. Chưa có vật liệu PBR thật (vân gỗ vẽ bằng canvas), chưa có bevel chi tiết.
2. **Chưa có DOF và bloom.** Đã cân nhắc và quyết định bỏ: thêm `@react-three/postprocessing` làm tăng JS và giảm FPS. Cả hai nên được bake sẵn vào video mobile, còn desktop thì chỉ bật sau khi đo trên GPU thật.
3. **Ánh sáng không có bóng đổ động.** Chỉ dùng ContactShadows vẽ 1 lần và RectAreaLight (loại đèn này không đổ bóng). Phòng còn đơn giản: tường, sàn, cửa sổ rèm lá, tranh, máy lạnh.
4. **FPS chưa đo trên GPU thật.** SwiftShader chỉ cho khoảng 2,3 fps, xem `MEASUREMENTS.md`.
5. **Hero mobile chưa có bố cục dọc riêng.** Khi video mobile kết thúc, hero HTML vẫn là sân khấu 16:9 thu nhỏ. Cần thiết kế hero dọc.
6. **Chưa thử Safari/iOS** (RectAreaLight, tua video khi cuộn nhanh).
7. **Logo là biểu tượng tia chớp tạm**, không phải logo chính thức. Mọi số trên màn hình đều có nhãn "minh họa".
8. Màn hình trong cảnh dùng ảnh tĩnh. Video gốc có trang cuộn trên màn hình; muốn vậy thì dùng texture video hoặc dịch UV.

## Việc cần 3D artist để đạt chất lượng thương mại

1. **Model hóa bộ bàn điều phối** (Blender): bàn gỗ, màn hình, laptop, điện thoại, đèn, máy lạnh treo tường đúng kiểu dáng phổ biến ở VN, ghế, cây, kệ. Mục tiêu tổng ≤ 150k tam giác, chia ≤ 60 draw call. Không dùng logo hãng điện máy thật.
2. **Vật liệu PBR và bake ánh sáng:** bake lightmap/AO cho phòng (ánh màn hình hắt, LED cam sau màn, đèn bàn ấm). Kết xuất KTX2/Basis cho texture, Meshopt cho geometry.
3. **Camera path chuẩn điện ảnh:** chỉnh lại 5 keyframe trong Blender và xuất đường cong (JSON) để dev nạp vào `CameraRig`. Thêm rung tay lấy từ dữ liệu tracking thật nếu muốn.
4. **Render bản mobile chất lượng cao** từ cùng cảnh (Cycles hoặc Eevee) có DOF, bloom, motion blur: 720×1280 và 1080×1920, kèm bản AV1/H.265 cho máy hỗ trợ.
5. **KHANG:** retopo và tối ưu lại (bản hiện tại 62,6k tam giác chiếm gần 90% cảnh), thêm pose ngồi trên bàn hoặc cầm cờ lê.
6. **Poster:** render một khung đầu đẹp làm poster và ảnh OG.

## Giả định chờ anh Duy xác nhận

- Số liệu trên màn hình (128 đơn, 342 KTV, 96,4%, 27/34) là **minh họa**. Câu "34 tỉnh/thành" đã bỏ khỏi caption cho tới khi anh chốt phạm vi phủ.
- Quyền dùng logo chính thức và mascot KHANG cho bản thương mại. **Prototype hiện CÓ dùng KHANG (chỉ dùng nội bộ).** Khung, video và ảnh trong `shots/` có KHANG: không đem ra ngoài, không dùng làm poster/OG khi chưa có văn bản quyền.
- Hotline 0902 808 049 lấy từ site hiện tại.
- Có nhận đơn B2C (khách lẻ) trực tiếp hay không, vì điều này ảnh hưởng nút "Gửi yêu cầu lắp đặt".
- Ngân sách 3D artist và repo hoặc hạ tầng để đưa vào bản thật.

Phần động (form, API, CMS) **chưa làm**, chờ contract APPROVED theo quy trình /contract.

## Phản biện ngày 01/10/2026: prototype chưa bắt được tinh thần video

Vòng phản biện (xem `../04-KE-HOACH-PHAT-TRIEN-CLAUDE-CODE.md` mục 1.1) chỉ ra: video là POV người ngồi, phòng sáng ban ngày, phòng chỉ tối khi màn hình chiếm khung, và máy **giữ khung cho website cuộn trên màn hình** ~40 giây. Prototype là diorama đêm nhìn từ cao 1,44 m, thiếu pha giữ khung, màn đầu không có H1/CTA B2B. Các điểm này được sửa ở G2 thành **prototype A+**. Các sửa nhỏ đã làm ngay ở `MEASUREMENTS.md` mục 8.
