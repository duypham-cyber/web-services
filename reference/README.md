# reference/ — CHỈ ĐỌC

Bản sao mã prototype hướng A (Vite + R3F) ngày 01/10/2026 từ `../prototype/` (thư mục dự án, ngoài repo),
để agent phim port sang Next (docs/04 mục 6.3 P2, P4, P5). **Không build, không import từ code app.**
TypeScript, ESLint và Tailwind đều bỏ qua thư mục này.

| Có | Ghi chú |
|---|---|
| `prototype/src/` | `Scene.jsx` (CameraRig, cảnh thủ tục), `App.jsx` (chọn chế độ, ScrollTrigger), `Hero.jsx` (đơn vị `--u`), `TexPages.jsx`, `scrollStore.js` |
| `prototype/scripts/` | `capture.mjs`, `shoot-textures.mjs`, `check-modes.mjs`, `make-map-svg.mjs` |
| `prototype/public/` | `data/vn34.topo.json`, `tex/*.jpg` (texture màn hình), `vn-map.svg` |
| `prototype/README.md`, `MEASUREMENTS.md` | Cách chạy, số đo, hạn chế đã biết |

**Cố ý KHÔNG chép:** `public/models/khang.glb`, `public/hero-mobile.mp4`, `public/poster*.jpg` — đều có KHANG,
quyền sử dụng chưa xác nhận (docs/04 R9, mục 9 Q6). Phương án A+ mặc định **không có KHANG trong cảnh**.
Bản gốc vẫn nằm ở `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/prototype/` nếu cần đối chiếu nội bộ.

Prototype là hướng A **chưa sửa theo phản biện** (diorama đêm, thiếu screen-hold, H1 bị ẩn, chunk 3D tải ngay).
Khi port, làm theo docs/04 mục 1.1, 2.3, 3.1 và CLAUDE.md "Luật cảnh 3D", không chép nguyên hành vi cũ.
