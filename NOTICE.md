# Phạm vi giấy phép

Mã nguồn trong repo này dùng giấy phép MIT ([`LICENSE`](LICENSE)). Những thứ dưới đây **không** thuộc giấy phép MIT.

| Thành phần | Vị trí | Điều kiện |
|---|---|---|
| Tên và nhận diện Bluebolt Services / Công ty Cổ phần Công nghệ Tia Chớp Xanh: logo, tên thương hiệu | `public/images/logo-*`, `components/layout/Logo.tsx`, ảnh OG `public/images/og/` | Nhãn hiệu của công ty, không cấp quyền dùng. Bản dựng cho đơn vị khác phải thay bằng nhận diện của mình. |
| Thông tin doanh nghiệp: MST, hotline, địa chỉ, số liệu, câu khẳng định dịch vụ | `content/`, `messages/` | Thông tin của Bluebolt Services. Bản dựng cho đơn vị khác phải thay, không dùng để giới thiệu dịch vụ của bên khác. |
| Ảnh minh họa (stock Pexels/Unsplash, ảnh tạo bằng AI) | `assets/photos/`, `public/images/photos/` | Theo giấy phép của từng nguồn, ghi ở [`docs/PHOTOS.md`](docs/PHOTOS.md). |
| Font Roboto (chỉ dùng lúc dựng ảnh OG) | `assets/fonts/roboto/` | Apache License 2.0. |
| Dữ liệu ranh giới 34 tỉnh | `public/data/vn34.topo.json` | MIT, nguồn thanglequoc/vietnamese-provinces-database. |
| Thư viện npm | `package.json` | Theo giấy phép của từng thư viện. |

---

## License scope (English)

The source code is MIT-licensed (see [`LICENSE`](LICENSE)). Not covered: the Bluebolt Services name, logo and brand assets
(trademarks, no rights granted), company details and service claims in `content/` and `messages/`, illustrative photos
(per-source licenses in `docs/PHOTOS.md`), the Roboto font (Apache-2.0), province boundary data (MIT,
thanglequoc/vietnamese-provinces-database) and npm dependencies (their own licenses).
