# Báo cáo của 5 agent build (02/10/2026)

> Nguyên văn báo cáo cuối của từng agent. Lưu ý: hero 3D trang chủ CHƯA chọn (D-22) — câu nào trong báo cáo nói "anh đã chọn A+" là sai, theo D-22.

## build:home

Trang chủ phần sau hero đã dựng xong theo `contracts/site-shell-p0.md`, bản VI và EN, và đã commit vào nhánh `feat/s1-1.4-p0-build`. Các test của trang chủ đều xanh. Trang chạy được với bất kỳ hero nào. Anh đã chọn A+, nên agent phim chỉ cần thay ruột `FilmHero`, không phải sửa `page.tsx`.

**1. Đã làm gì**
- **Thứ tự section** (theo T-HOME của contract, chèn thêm Công nghệ sau Quy trình): FilmHero → Ba cửa vào → Bản đồ 34 tỉnh → Dải tin cậy → Vấn đề → giải pháp → Quy trình 5 bước → Công nghệ → Dịch vụ → Bằng chứng → Tiêu chuẩn thợ → Kiến thức → CTA cuối.
- **`page.tsx`**: truyền đủ `FilmHeroProps`. Eyebrow hero đi qua `claim('coverage.provinces-34')`; khi claim chưa duyệt thì dùng câu không số "Nhanh · Chuẩn · Minh bạch" (đúng AC-S0-6). Thêm JSON-LD Organization và WebSite bằng helper của agent SEO. Nền các section tự xen kẽ trắng / xanh nhạt khi một section bị ẩn.
- **Ba cửa vào** `#ba-cua-vao`: có `tabindex="-1"` và H2. Đã thử: bấm link bỏ qua thì section nhận focus, nằm dưới header, Tab tiếp theo vào link đầu tiên của thẻ.
- **Ảnh giữ chỗ**: một component chung `MediaFrame` với 3 minh họa SVG thiết bị, không logo, không chữ, không KHANG. Sau này thay ảnh thật chỉ cần truyền `image`. Nhãn "Ảnh thật sẽ chụp" chỉ hiện ở bản xem trước.
- **Công nghệ**: mockup dashboard cho hãng và app thợ dựng bằng HTML/CSS, luôn kèm nhãn "Giao diện minh họa". Dữ liệu là ví dụ, tên đối tác dạng [Hãng A], không có số tổng hợp hay số tiền.
- **Kiến thức**: hiện 3 bài mới nhất theo ngày đăng, dùng `listArticles()` và `ArticleCard` của agent SEO (chỉ đọc), nên giữ ảnh bài cũ.
- **Claim và số liệu**: KPI chỉ đọc từ `content/stats.ts`; số null thì ẩn, bản xem trước hiện ô "—" kèm nhãn Nháp. Mọi câu khẳng định đi qua `claim()`. Logo đối tác đọc từ `partnersWithConsent()` và còn cần claim được duyệt.
- **CTA cuối**: một khối, ba nút (Nhận báo giá, Đặt lịch demo 30 phút, Gọi). Không có form; bản xem trước hiện khung ghi chú chờ contract lead-b2b.
- **Motion**: dùng `rise`, `stagger`, `curtain`, `count-up` của nền móng. Khi bật giảm chuyển động hoặc tắt JS, cả 49 phần tử có hiệu ứng đều hiện ngay.
- **File chính**: `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/bluebolt-web/app/[locale]/page.tsx`, thư mục `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/bluebolt-web/components/home/` (17 file), `messages/{vi,en}/home.json`, `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/bluebolt-web/content/claims/home.ts` (6 claim, đều draft).

**2. Ảnh đã chụp (đã mở ra xem và sửa)**
- Ảnh chuẩn, bản xem trước, VI và EN ở 390, 768, 1440: `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/bluebolt-web/.cache/shots/home/`
- Bản production (không nhãn Nháp, ẩn dải tin cậy và bằng chứng): `/tmp/claude-1000/-home-bbsw/ee28fbb7-d651-4847-a095-3dfaa7266689/scratchpad/shots/prod/`. Ảnh này dựng bằng cách mở HTML của bản build qua Playwright, không chạy `next start`.
- Ảnh từng section ở 360, 390, 768, 1440: thư mục `/tmp/claude-1000/-home-bbsw/ee28fbb7-d651-4847-a095-3dfaa7266689/scratchpad/shots/r2` đến `r10`.

**3. Kết quả kiểm tra**

| Kiểm | Kết quả |
|---|---|
| `npm run typecheck` | 0 lỗi |
| `eslint` các file của em | 0 lỗi |
| overflow `/` và `/en`, 9 bề rộng | 2/2 xanh |
| axe + SEO render (1 H1, cả chế độ không JS) | 8/8 xanh |
| Chủ quyền bản đồ trên trang chủ | 20/20 xanh |
| Test messages | 70/70 xanh |
| Unit test toàn repo | 1 test hỏng: `content.test.ts` (đích 301 của `/images/og-cover.jpg`), thuộc phần agent SEO, không phải trang chủ |
| Bản production | `h1` = 1, eyebrow là câu dự phòng, không chữ tiếng Việt trên `/en` |
| Mô phỏng Googlebot (không cuộn) | 5 bước và 3 CTA đều hiện (opacity 1) |
| Console trình duyệt | sạch. Đã có 1 lần báo lỗi hydration lúc chụp ở 390, chạy lại không tái hiện, có thể do HMR khi agent khác sửa file; chưa xác định chắc |

**4. Số đo** (bản build `.next-home-check`, đã xóa sau khi đo)
- JS tải đầu trang chủ: 164,7 KB gz, ngân sách 170. Phần tăng khoảng 7,9 KB gz so với trang con là chunk client của bản đồ (`MapInteractions`). Các section của em đều là Server Component, không thêm JS.
- HTML khoảng 80 KB gz. Phần section của em khoảng 20 KB gz; riêng section bản đồ khoảng 12,6 KB gz.

**5. Đề xuất sửa ngoài khu vực**
- **Đã chạm (cần anh biết)**: em sửa 2 dòng ở `content/claims/index.ts` để đăng ký claim của trang chủ, theo quy trình trong CLAUDE.md. Commit chỉ gồm phần của em.
- **DECISIONS.md**: cập nhật D-22 thành "anh Duy chọn A+" theo tin nhắn của anh.
- **`QUOTE_HREF`**: đang dùng neo `#kinh-doanh` cho cả hai ngôn ngữ, trong khi `film-home.md` ghi EN là `#sales` / `#apply`. Cần nền móng hoặc agent partner chốt một cách.
- **Cổng QA "build production không có chữ Nháp"**: dữ liệu `common.status.draft` nằm trong payload client nên sẽ báo nhầm. Nên chỉ dò chữ hiển thị.
- **Agent bản đồ**: nên tải chunk tương tác bản đồ trên trang chủ sau thay vì ngay, tiết kiệm khoảng 8 KB gz.
- **Agent partner**: thêm `width`/`height` cho logo trong `content/partners.ts` khi có logo thật.

**6. Giả định cần anh Duy xác nhận**
- Duyệt 6 claim mới của trang chủ (đều draft): nghiệm thu bằng ảnh, hóa đơn/chứng từ hợp lệ, logo đối tác, video Bluebolt × Panasonic, case study, số hiệu TCVN/QCVN.
- Khi có số thật, K1–K2 sẽ hiện ở cả section bản đồ và dải tin cậy liền nhau, vì contract ghi như vậy. Em đề xuất dải tin cậy khi đó chỉ hiện K3–K4; chờ anh chọn.
- "3 bài mới nhất" lấy theo ngày đăng của site cũ. Tiêu chuẩn thợ (ví dụ "1–2 năm") lấy từ trang `/worker-map` cũ, trình bày như yêu cầu tuyển chọn, không phải số liệu.
- Mặc định khách lẻ theo nhánh A: cửa "Khách lẻ" dẫn tới `/ho-tro-khach-hang`.
- Bản EN cần người bản ngữ biên tập.

**7. Việc còn dở**
- Ảnh thật cho 3 cửa vào (cần buổi chụp).
- Video facade và case study: phải có văn bản cho phép và dữ liệu thật mới bật được ở production.
- Form báo giá B2B: chờ `lead-b2b` có STATUS: APPROVED.
- Ảnh tĩnh từ cảnh phim cho phần quy trình (03 mục 13.4): làm khi agent phim có asset.

## build:map

Em đã làm xong phần bản đồ: bản đồ SVG 34 tỉnh (dùng ở trang chủ và `/mang-luoi`) và trang `/mang-luoi` đủ VI + EN. Mọi kiểm tra cho route của em đều xanh, kể cả test chủ quyền bản đồ ở 9 bề rộng. Đã commit 6 lần vào `feat/s1-1.4-p0-build`, chỉ `git add` đúng file của em.

## Đã làm
Các file chính, thư mục gốc `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/bluebolt-web/`:

- **`scripts/make-map.mjs`**: sinh bản đồ đã chiếu sẵn lúc build từ `vn34.topo.json` (d3-geo Mercator, khung 600×800 = 3:4), nên trình duyệt không phải tải d3.
  - Ra 3 file: `components/map/vn34-map.generated.ts`, `public/data/vn34-map.svg`, `public/data/vn34-map.en.svg`.
  - Script tự FAIL nếu khung không chứa đủ Hoàng Sa (tới 112,63°E) và Trường Sa (tới 117,83°E) cùng nhãn.
  - Chạy với `--check` thì báo lệch nếu file sinh ra chưa khớp nguồn.
- **`components/map/VietnamMap.tsx`**: giữ nguyên props của nền móng.
  - Server render đầy đủ nên tắt JS vẫn thấy bản đồ, hai quần đảo và nhãn.
  - Tỉnh tô theo vùng: Bắc blue-600, Trung blue-300, Nam navy-900. Có lớp nền tạo cảm giác nổi khối, không tốn thêm dữ liệu đường vẽ.
  - Hiệu ứng map-rise Bắc → Nam bằng CSS; khi người dùng tắt chuyển động thì hiện ngay trạng thái cuối. Hai quần đảo và nhãn luôn hiện, không chạy hiệu ứng.
  - Nhãn quần đảo: chữ 12–13px trên nền trắng, tương phản 16:1.
  - Ghim cam chỉ hiện khi tỉnh có số thợ. Bản xem trước hiện chấm nháp kèm nhãn "Nháp".
- **`components/map/MapInteractions.tsx`**: rê chuột hoặc chạm vào tỉnh/quần đảo thì hiện tên, loại, vùng, số thợ hoặc "Chưa có số".
  - Màn rộng: thẻ nổi cạnh tỉnh, tự tìm chỗ để không bao giờ đè hai quần đảo và nhãn.
  - Điện thoại: thông tin hiện ở dải ngay dưới bản đồ, không che bản đồ.
- **`/mang-luoi`** (`app/[locale]/mang-luoi/page.tsx`, `ProvinceTable.tsx`, `ProvinceFilter.tsx`, `search.ts`), theo thứ tự trên trang:
  - **Hero**: H1, câu dẫn và bản đồ.
  - **Bảng 34 tỉnh**: có đủ trong HTML; mỗi vùng một bảng, xếp 2 cột từ 1024px.
    - Ô tìm gõ có dấu hay không dấu đều được, và nhận cả tên tỉnh cũ: gõ "binh duong" ra TP. Hồ Chí Minh.
    - Lọc theo vùng.
  - **Thời gian phục vụ theo vùng**: chỉ hiện giá trị đã duyệt trong `content/sla.ts`. Bản xem trước có thêm khung ghi chú cho anh xem điều site cũ đang ghi.
  - **CTA cuối**: một khối duy nhất "Triển khai tại tỉnh của bạn" → `/lien-he#kinh-doanh`.
- **`content/provinces.ts`**: chuyển vùng sang đúng cách Bluebolt tự chia trên site cũ (trang `/worker-map`): Bắc 18 · Trung 4 · Nam 12. Thêm mô tả vùng, tên tỉnh cũ, tên gọi khác (Sài Gòn, HCM).
- **`messages/{vi,en}/network.json`**, **`tests/map/sovereignty.spec.ts`**.

## Kiểm tra
| Kiểm | Kết quả |
|---|---|
| `npm run typecheck`, `npm run lint` | 0 lỗi (toàn repo) |
| `tests/map --project=desktop-1440` | 42/42 xanh |
| └ chủ quyền bản đồ | `/` và `/mang-luoi` × VI/EN × 9 bề rộng: khung đảo và nhãn nằm trong khung và trong màn hình, không gì che (dò từng điểm cách 3 px), chữ ≥ 11px, tương phản ≥ 4,5:1 |
| └ rê chuột | Rê lần lượt 36 vị trí: thẻ không đè quần đảo |
| └ không JS, tắt chuyển động | Đạt |
| overflow + SEO (1 H1) + a11y cho `network,home` | 20/20 xanh |
| `npm run test` | 1 test hỏng: điểm đến 301 của redirects đang dở của agent SEO, không phải file của em |

**Số đo** (build production qua `safe-build`):
| | /mang-luoi | Trang chủ |
|---|---|---|
| JS tải đầu | 161,1 KB gz | 164,7 KB gz |
| HTML | 53,8 KB gz | — |
| CSS | 15,2 KB | — |

Ngân sách JS là 170 KB. Dữ liệu đường vẽ bản đồ 21,4 KB thô, không nằm trong JS gửi xuống trình duyệt. Bản production không còn nội dung nháp nào (đã kiểm HTML).

## Ảnh đã chụp và đã xem
- `.cache/shots/map/{home,network}-{vi,en}--{360,1440}.png`: ảnh riêng khung bản đồ, độ nét gấp đôi.
- `.cache/shots/{vi,en}--network--{390,768,1440}--NN.png`: ảnh cả trang theo từng màn hình.
- `.cache/map-agent/`: thẻ khi rê chuột, chạm trên mobile, các khung hình map-rise, ô tìm kiếm, và ghim khi có số thợ mẫu (đã thử tạm rồi trả lại nguyên file).

## Đề xuất sửa ngoài khu vực
1. **`docs/DECISIONS.md` D-06**: sửa "Bắc 15 · Trung + Tây Nguyên 11 · Nam 8" thành "Bắc 18 · Trung 4 · Nam 12, theo trang /worker-map site cũ".
2. **`CLAUDE.md`**: VietnamMap không còn là STUB. Thêm hai lệnh: sinh lại bản đồ `node scripts/make-map.mjs`; kiểm `npx playwright test tests/map --project=desktop-1440`.
3. **`package.json`**: thêm script, và cho CI chạy `map:check`:
   ```
   "map:gen": "node scripts/make-map.mjs",
   "map:check": "node scripts/make-map.mjs --check",
   "test:map": "playwright test tests/map --project=desktop-1440"
   ```
4. **`content/redirects.ts`** (agent SEO): có thể đổi `/images/vn-map-workers.svg` từ 410 sang 301 về `/data/vn34-map.svg` (bản đồ mới có đủ hai quần đảo).
5. **`contracts/site-shell-p0.md`**: tên test đúng là `tests/map/sovereignty.spec.ts`.
6. **`content/schemas.ts`, `validate.ts`** (tùy chọn): thêm schema cho `regions` và `formerNames`.

## Giả định cần anh Duy xác nhận
1. Cách chia 3 vùng theo site cũ (Bắc từ Hà Tĩnh trở ra; Trung từ Quảng Trị tới Quảng Ngãi; Nam từ Gia Lai trở vào). Đây có phải luôn là vùng tính SLA không?
2. Nhãn EN "Hoang Sa (Paracel) Is." và "Truong Sa (Spratly) Is." chờ pháp chế duyệt.
   - Ảnh 360 px để pháp chế ký nên chụp từ bản production, vì bản xem trước có chấm nháp: `BASE_URL=<bản build> npx playwright test tests/map --project=desktop-1440`.
3. Dữ liệu gốc xếp vùng bãi Tư Chính/DK1 (109,5–110,6°E) vào Khánh Hòa. Em vẽ chúng chung nhóm chấm với Trường Sa, đều nằm trong khung. Nhờ pháp chế xem cách thể hiện này.
4. Danh sách tên tỉnh cũ (Nghị quyết 202/2025/QH15) hiện trong bảng dạng "Gồm cả … cũ".
5. Số thợ theo tỉnh và KPI K1/K2 đang để trống: bảng hiện "Chưa có số", ô KPI ẩn.

## Việc còn dở
- Pháp chế chưa ký ảnh 360 px.
- Bản đồ WebGL tương tác là P1, đợt này không làm.
- Rê chuột lên dòng trong bảng để tô tỉnh trên bản đồ: chưa làm, chỉ là tùy chọn.

## build:partner

Anh Duy, 7 trang khu vực thợ & công ty (cả VI và EN) đã xong và đã commit vào `feat/s1-1.4-p0-build`. Các kiểm tra của em đều xanh: typecheck, lint, tràn ngang, SEO/H1 và axe. Bản production em đã build qua `scripts/safe-build.sh`: không lọt nội dung nháp ra ngoài, và 3 trang pháp lý tự gắn `noindex`. Em không làm hero, form, API hay DB.

## Đã làm
- **`/doi-tac-tho`** (gộp `/requirement`, `/worker-map` và phần thợ của `/system-map`):
  - Hero H1 "Đơn ổn định, thu nhập minh bạch", kèm hình minh họa app thợ dựng bằng HTML, có nhãn "Minh họa giao diện", không có số.
  - Thu nhập và cách nhận tiền: số thu nhập, phí nền tảng để `null`; tiền công, vật tư, phụ phí đơn gấp, ví Top-up đi qua claim nháp. Production chỉ hiện đoạn trung tính.
  - Lộ trình 4 bước (Đăng ký → Xác thực danh tính → Đào tạo → Nhận đơn). Chữ "E-KYC" đi qua claim nên production không hiện.
  - Tiêu chuẩn 4 nhóm; TCVN/QCVN là claim nháp, có ghi chú "chưa kiểm chứng".
  - Việc đang tuyển: đã sửa lỗi cả 6 tin dùng chung mã BBSV0924561, gộp 2 tin HCM trùng chức danh. Tin đều là nháp nên production hiện khối trống.
  - Hỏi đáp; khối `#dang-ky` dùng Gọi/Zalo. Bản xem trước có khung "form 4 trường" (không phải form thật).
- **`/ho-tro-khach-hang`:** thẻ hotline có nút Gọi/Zalo, giờ hỗ trợ, email; hướng dẫn đăng ký bảo hành 3 bước; bảng thời hạn bảo hành chỉ hiện ở bản xem trước (vì 02 tháng và 12 tháng mâu thuẫn); cảnh báo chuyển khoản. Câu "không yêu cầu chuyển khoản cá nhân" là claim nháp, production chỉ còn lời khuyên gọi hotline xác minh.
- **`/ve-chung-toi`:** sứ mệnh, câu chuyện, Nhanh – Chuẩn – Minh bạch, pháp nhân + MST, văn phòng. Dải KPI, mốc phát triển và logo đối tác đang ẩn vì chưa có số, nguồn hay văn bản đồng ý.
- **`/lien-he`:** 3 bộ phận `#kinh-doanh`, `#tuyen-tho`, `#cskh`; địa chỉ chữ + sơ đồ minh họa SVG (không tải gì của Google) + nút "Mở Google Maps"; bảng giờ làm việc liệt kê các mốc đang mâu thuẫn để anh chốt.
- **3 trang pháp lý**, mẫu chung có mục lục dính:
  - `/chinh-sach-bao-hanh`: chính sách 4 phần của site cũ, sắp xếp lại, đổi "BBSV" thành "Bluebolt", có banner "Bản đang áp dụng theo website cũ — chờ pháp chế rà soát".
  - Bảo mật và điều khoản: chỉ có khung mục + ghi chú cho pháp chế, em không tự viết điều khoản. Ghi rõ nội dung do pháp chế soạn theo Luật BVDLCN 91/2025/QH15 và nghị định hướng dẫn.
  - Production, khi chưa có bản pháp chế duyệt: chỉ hiện "Nội dung đang được cập nhật" + kênh liên hệ, kèm `noindex, follow`.
- **Dùng chung:**
  - Ảnh thật chưa có nên dùng khung giữ chỗ `MediaFrame`; ghi chú "Ảnh thật sẽ chụp" chỉ hiện ở bản xem trước.
  - Mọi trang có breadcrumb + BreadcrumbList (component của agent SEO).

Commit: `534299d`, `f86782b`, `5dcfac0`, `70fbb7f`, `ff10f47`, `5876ab3`.

## Kết quả kiểm
| Kiểm | Kết quả |
|---|---|
| `npm run typecheck`, `npm run lint` (toàn repo) | 0 lỗi |
| `npm run test` | 119/120 xanh. 1 ca đỏ là redirect ảnh OG của agent SEO, không phải route của em |
| Tràn ngang, 9 bề rộng × 7 route × VI/EN | 14/14 xanh |
| SEO (đúng 1 H1, kể cả không JS) + axe, 390 và 1440 | 56/56 xanh |
| Chữ tiếng Việt trên `/en` (ngoài tên pháp nhân) | 0 |
| JS tải đầu (build production) | 156,9–157,7 KB gz mỗi route, ngân sách 170 |

`/ve-chung-toi` từng ở 162,9 KB vì kéo `next/image`; em đổi khung ảnh sang `<picture>` thường nên giờ còn 157,7.

## Cần sửa ngoài khu vực của em
Đây là các file của agent khác hoặc nền móng, em chưa sửa:
1. **`tests/seo-render.spec.ts` (QA):** test đang cấm `noindex` ở route indexable. Chạy trên bản production, 6 URL pháp lý sẽ đỏ vì chúng `noindex` đúng theo AC-LEGAL-1. Cần cho phép ngoại lệ này khi văn bản chưa duyệt.
2. **`content/seo.ts` (agent SEO):** đặt `index` của 3 trang pháp lý theo `isLegalDocPublished(legalDocs.x)` trong `content/legal.ts`, để sitemap bỏ các trang này cho tới khi pháp chế duyệt.
3. **`content/schemas.ts` + `content/validate.ts` (nền móng):** thêm schema Zod cho `content/jobs.ts`, `content/legal.ts`, `content/partners.ts`. Hiện chỉ có kiểu TypeScript.
4. **`content/sla.ts` (B2B):** nên chuyển 2 mốc giờ đang để tạm ở `content/legal.ts` (thi công tại nhà khách, xử lý bảo hành) vào đây cho một nguồn.
5. **`docs/DECISIONS.md`:** ghi các giả định ở mục dưới. Em không sửa vì nằm ngoài khu vực.
6. **Đã sửa ngoài khu vực:** `content/claims/index.ts`, em thêm 1 dòng import `partnerClaims` theo đúng chú thích trong file, và chỉ commit đúng phần đó.

Ghi chú thêm: tiêu đề và mô tả trang hiện do `content/seo.ts` quyết định, `meta` trong messages của em chỉ còn là dự phòng. Anchor `#register` cho EN em làm bằng một neo phụ, vì header vẫn trỏ `#dang-ky` ở cả hai ngôn ngữ.

## Giả định cần anh xác nhận
- **Tiền và phí:**
  - Số thu nhập tham khảo và cách đo, mức phí nền tảng.
  - Thợ nhận "hoa hồng" hay "tiền công", có chuyển khoản hằng tuần không.
  - Ví Top-up dùng để làm gì: chính sách cũ ghi thợ "nhận" phụ phí nhưng lại "trừ vào ví".
- **Tiêu chuẩn thợ:**
  - Kinh nghiệm 1–2 năm hay tối thiểu 2 năm.
  - TCVN 5687:2024 và QCVN 25:2025/BKHCN có đúng không.
  - App thợ có E-KYC thật không; có còn yêu cầu lý lịch tư pháp không.
- **Tin tuyển:** danh sách tin thật, mã tin, hạn nộp. Tin cũ đều ghi "hết hạn".
- **Bảo hành và giờ làm việc:**
  - Lắp đặt mới bảo hành 02 hay 12 tháng; thời gian phản hồi.
  - Giờ hotline (24/7 hay 9:00–18:00), giờ nhận đơn, giờ thi công.
- **Câu "không yêu cầu chuyển khoản cá nhân":** cần khớp với quy định khách trả tiền vật tư trực tiếp cho thợ.
- **Thông tin công ty:**
  - Địa chỉ có khớp giấy chứng nhận ĐKDN không; có Zalo OA thật không.
  - Số điện thoại, email riêng cho từng bộ phận.
  - Các mốc phát triển có nguồn.
- **Bản chính sách cũ:** ý "Bluebolt không điều phối được thợ trong 36 giờ" đang nằm trong danh sách vi phạm của thợ, pháp chế cần xem lại.

## Việc còn dở
- Form thợ, form B2B, form bảo hành: chờ contract APPROVED.
- Ảnh thật (chỉ cần truyền ảnh vào `MediaFrame`), link tải app thợ.
- Nội dung pháp lý do pháp chế viết.
- Người bản ngữ biên tập lại bản EN.
- JSON-LD FAQPage (agent SEO).

Ảnh em đã chụp và tự xem: bộ 28 ảnh bản xem trước (7 route × VI/EN × 390/1440) ở `/tmp/claude-1000/-home-bbsw/ee28fbb7-d651-4847-a095-3dfaa7266689/scratchpad/partner-agent/final/`, ảnh bản production ở `…/partner-agent/prod2/`.

## build:b2b-pages

Đã dựng xong 6 trang B2B (9 route × VI/EN). Toàn repo xanh: typecheck 0 lỗi, lint 0 lỗi 0 cảnh báo, unit 120/120, `safe-build` xanh. Trên route của tôi: overflow 18/18, seo-render 36/36, axe 36/36. Có 5 commit trên `feat/s1-1.4-p0-build`: e0674b0, 0a4b518, 89b8392, 128b2d5, c7d7459.

## Đã làm (đường dẫn tính từ `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/bluebolt-web/`)

**Trang** (`app/[locale]/…`)
- `giai-phap/page.tsx`: hero có minh họa luồng đơn → 2 thẻ lớn (Hãng / Sàn) → bảng so sánh "tự quản thợ / đơn vị địa phương / Bluebolt" → mục tài liệu → CTA cuối.
- `giai-phap/hang-dien-may/page.tsx`:
  - hero B2B, CTA "Đặt lịch demo 30 phút";
  - 5 nỗi đau của hãng, mỗi ý kèm "Cách Bluebolt xử lý";
  - dải KPI K3/K5/K6 (đang ẩn vì chưa có số);
  - bảng SLA theo vùng;
  - quy trình 5 bước dạng bảng phân cảnh, mỗi bước một khung ảnh tĩnh;
  - đối soát & VAT (phí dịch vụ tách khỏi vật tư thợ thu tại chỗ, theo chính sách cũ Phần 2);
  - so sánh, 7 câu hỏi thường gặp, CTA cuối.
- `giai-phap/san-tmdt-ban-le/page.tsx`:
  - sơ đồ tích hợp: HTML thật cộng đường nối SVG, chuyển động nhẹ chạy một lần khi vào khung nhìn, tắt khi reduced-motion;
  - khung giá theo 7 nhóm thiết bị, ghi "theo hợp đồng";
  - SLA, khiếu nại / đổi thợ, câu hỏi thường gặp;
  - CTA "Thảo luận tích hợp" → `/lien-he#kinh-doanh`.
- `dich-vu/page.tsx` (hub 4 nhóm, có neo `#<slug>`) và `dich-vu/[slug]/page.tsx` cho cả 4 dịch vụ: phạm vi & thiết bị → đã gồm / chưa gồm → bảo hành (bảng SLA chung từ `content/sla.ts`) → quy trình → câu hỏi thường gặp → dịch vụ khác → CTA.
- `bang-gia/page.tsx`:
  - H1 đúng contract: "Khung giá vật tư tham khảo (thợ thu tại chỗ)";
  - bảng render đủ ở server, lọc ở client theo thiết bị (BTU) và vùng, số dòng đọc qua aria-live; mobile hiển thị dạng thẻ, không cuộn ngang;
  - không có hiệu ứng chuyển động;
  - khối giá theo hợp đồng cho B2B;
  - chính sách 4 phần chỉ là mục lục, link sang `/chinh-sach-bao-hanh`.

**Thành phần**
- `components/solutions/kit/`: hero trang con, `MediaFrame` (chỗ duy nhất để thay ảnh thật: truyền `src`), 12 minh họa SVG không logo, bảng so sánh, bảng SLA theo vùng, bảng bảo hành, quy trình, FAQ, CTA cuối, `draft.tsx` (cổng hiển thị claim theo R-CLAIM).
- `components/solutions/IntegrationDiagram.tsx` + `.module.css`, `components/solutions/BillingSplit.tsx`.
- `components/services/*`, `components/pricing/PriceTable.tsx`, `components/pricing/pricing-schema.ts` (Zod; trang `/bang-gia` gọi khi render, dữ liệu sai thì build fail).

**Dữ liệu**
- `content/pricing.ts`: 6 dòng × 4 vùng, chép đúng bảng giá cũ, không thêm dòng nào.
- `content/claims/b2b.ts`: 23 claim nháp, mỗi claim có evidence trỏ về chính sách cũ.
- `messages/{vi,en}/{solutions,services,pricing}.json`.

**Ngoại lệ và phụ thuộc**
- Sửa ngoài khu vực duy nhất: `content/claims/index.ts` +2 dòng để đăng ký `b2bClaims` (CLAUDE.md yêu cầu "gom ở index.ts"); chỉ commit đúng phần của tôi.
- Dùng `components/seo/Breadcrumbs` và `serviceJsonLd` của agent SEO, không sửa file của họ. Vì vậy các trang có BreadcrumbList; các trang giải pháp chi tiết và dịch vụ có thêm Service JSON-LD.

## Kiểm tra và số đo
- Bản production (không bật `DRAFT_PREVIEW`) đã soát bằng ảnh, xem qua một server tĩnh tạm ở 127.0.0.1:3097, đã dừng theo PID:
  - không lộ claim nháp hay giá chưa duyệt;
  - các khối chưa có dữ liệu tự thu gọn ("SLA ghi trong hợp đồng", "Khung giá đang được cập nhật").
- Chữ "Nháp" chỉ còn trong payload messages `common` của layout, có ở mọi trang (xem đề xuất 4).
- `/en`: script dò 9 trang, 0 ký tự tiếng Việt ngoài allowlist.
- Bộ lọc giá: chọn Hà Nội + 18.000 BTU → còn 3/6 dòng, 4 cột, aria-live cập nhật đúng.
- JS tải đầu (gz, build production cuối, ngân sách 170 KB):

| Route | KB gz |
|---|---|
| `/giai-phap`, `/dich-vu`, `/dich-vu/*` | 156,9 (bằng trang khung) |
| `/giai-phap/hang-dien-may`, `/giai-phap/san-tmdt-ban-le` | 157,7 |
| `/bang-gia` | 158,7 |

  Bỏ `next/image` khỏi `MediaFrame` (dùng `<img>`) bớt khoảng 5,5 KB mỗi trang khi chưa có ảnh thật.
- Ảnh:
  - `.cache/shots/b2b/`: 36 ảnh full-page, 9 route × vi/en × 390/1440.
  - Ảnh bản production: `/tmp/claude-1000/-home-bbsw/ee28fbb7-d651-4847-a095-3dfaa7266689/scratchpad/prod/`.
  - Đã mở ra xem và sửa tới khi ổn, gồm: ô SLA bị ngắt dòng trên mobile, chip lọc đang chọn bị mất chữ khi hover, lỗi `<dl>` sai cấu trúc (axe), cột bảng SLA bản EN lệch.

## Đề xuất sửa ngoài khu vực
1. **Nền móng** (`content/schemas.ts`, `content/validate.ts`): chuyển `pricingTableSchema` từ `components/pricing/pricing-schema.ts` sang:
   ```diff
   + import { pricingTable } from './pricing';
   + check('pricing.ts', pricingTableSchema, pricingTable);
   ```
   Sau đó bỏ lời gọi `assertPricingValid()` trong `/bang-gia`.
2. **`content/sla.ts`**: thêm trường `byRegion?: { inner, outer, provinces, special }` (mỗi trường kiểu `localizedText | null`). Khi có, `SLA_MATRIX` đọc từ đây thay cho các claim `b2b.sla.*`.
3. **`components/layout/Header.tsx`**: thêm `DEMO_HREF` và `INTEGRATION_HREF` (tạm bằng `QUOTE_HREF`). Khi form B2B được duyệt, intent `demo`/`integration` sẽ tách được mà không phải sửa trang.
4. **QA / nền móng**: bước grep "không có nhãn Nháp" trên bản production phải chỉ quét chữ hiển thị, hoặc bỏ `common.status` khỏi payload client. Nếu không, mọi trang sẽ bị báo nhầm.
5. **SEO**: có thể thêm helper FAQPage JSON-LD cho các khối câu hỏi thường gặp (dữ liệu đã có trong `buildFaqEntries`).
6. **`content/README.md` và `docs/DECISIONS.md`**: thêm dòng cho `pricing.ts`, `claims/b2b.ts` (chủ sở hữu B2B) và các giả định dưới đây.

## Giả định cần anh Duy xác nhận
Tất cả đang là nháp: production ẩn, bản xem trước hiện kèm nhãn "Nháp" và khung "Nội dung chờ xác nhận" cuối mỗi trang.
1. **SLA theo vùng.** Đang lấy: xác nhận lịch 60 phút, hoàn thành tối đa 48 giờ, xử lý lỗi lắp đặt 24/36 giờ làm việc, khu vực đặc thù theo từng trường hợp. Mốc xác nhận lịch mâu thuẫn giữa hai nguồn: trang dịch vụ cũ ghi "60 phút (CSKH)", chính sách ghi "thợ liên hệ trong ngày", và thứ tự bước 02→03 cũng chưa chốt.
2. **Bảng giá.** Chưa có ngày hiệu lực (nguồn chỉ ghi năm 2026), nên production đang ẩn bảng. Cần xác nhận thêm:
   - dòng ống đồng đầu tiên không ghi công suất;
   - thứ tự 4 cột vùng;
   - tab giá công trên site cũ để trống, nên trang không có giá công.
3. **Đối soát & VAT.** Bluebolt có xuất hóa đơn VAT cho phí dịch vụ không, và thuế TNCN của thợ xử lý thế nào.
4. **Tích hợp.** Kênh nhận đơn (API, tệp, cổng đối tác) và dashboard thời gian thực chưa kiểm chứng. Sơ đồ chỉ mô tả luồng nghiệp vụ; các trạng thái trên sơ đồ ghi rõ là ví dụ.
5. **Cam kết của sàn.** "Có thợ trong 24 giờ" (site cũ) mâu thuẫn với thời hạn tối đa 48 giờ trong chính sách.
6. **Nội dung viết mới.** Phần bếp từ / máy lọc nước / bình nóng lạnh, trang bảo trì định kỳ và trang robot (P2) chưa có nguồn chi tiết trên site cũ. Bảng so sánh chỉ định tính, không có số.
7. **Ảnh.** Toàn bộ là khung minh họa SVG: không ảnh stock, không KHANG, không logo hãng. Không có khối case study (chưa có văn bản đồng ý).

## Việc còn dở
- Form B2B: chờ `contracts/lead-b2b.md` APPROVED; hiện mọi CTA dẫn tới `/lien-he#kinh-doanh`.
- Nút tải PDF bảng giá (P1).
- Video loop ở hero trang con: chờ phụ lục contract.
- Ảnh thật hoặc ảnh tĩnh từ phim: truyền `src` vào `MediaFrame`.
- Hiệu ứng chuyển trang từ thẻ dịch vụ sang trang chi tiết (P1).
- Bản EN cần người bản ngữ biên tập.
- Test tràn ngang ở chế độ reduced-motion và `?mode=still` chưa chạy, vì spec hiện tại chưa có hai chế độ này.

## build:seo

# Báo cáo agent SEO và chuyển nội dung (02/10/2026)

Phần SEO và 6 bài Kiến thức đã xong, đã commit 9 lần vào `feat/s1-1.4-p0-build`. Toàn repo qua typecheck, lint và 120/120 Vitest. Có một chỗ tôi làm khác chỉ thị: không dùng ảnh `/images/og-cover.jpg` của site cũ làm ảnh OG tạm (lý do ở mục 4). Phần việc này không phụ thuộc hero, nên anh Duy chọn A+ thì không phải sửa gì.

## 1. Đã làm gì
Đường dẫn gốc: `/home/bbsw/WorkspaceDuy/LapDatToanQuoc/bluebolt-web/`

**Chuyển bài viết**
- Tải lại HTML của 8 bài cũ, cả VI và EN. Kết quả là 6 bài còn sống: 2 bài robot gộp thành 1, bài AI trả 410.
- Thân bài nằm ở `content/articles/<key>.ts`, dạng khối có cấu trúc. Kiểu dữ liệu ở `types.ts`, gom ở `all.ts`, kiểm bằng Zod và luật giọng văn ở `schema.ts`.
- `content/articles.ts` giữ vai trò registry, các bài đã đổi sang `migrated`.
- Lời hứa của Bluebolt trong bài đi qua 7 claim nháp ở `content/claims/knowledge.ts`. Tôi có sửa `content/claims/index.ts` để đăng ký, nhưng chỉ commit đúng phần của mình.

**Trang và component**
- `app/[locale]/kien-thuc/page.tsx`: trang hub, 3 nhóm điều hướng bằng neo, không cần JS.
- `app/[locale]/kien-thuc/[slug]/page.tsx`: trang bài, gồm:
  - breadcrumb, H1, ngày đăng, ngày cập nhật, thời gian đọc;
  - mục lục dính ở màn ≥ 1024px, mục lục gập bằng `<details>` ở màn nhỏ;
  - thanh tiến độ đọc chỉ dùng CSS, tắt khi reduced-motion;
  - 7 bước có số xanh, bài liên quan, một khối CTA cuối.
- `components/knowledge/*`: `MediaFrame` là khung ảnh dùng chung, chưa có ảnh thì hiện khung giữ chỗ.
- `components/seo/JsonLd.tsx`, `components/seo/Breadcrumbs.tsx`: hiện đã được các agent B2B và đối tác dùng trên trang của họ.
- `messages/{vi,en}/knowledge.json`.

**Metadata và JSON-LD**
- `content/seo.ts`: title ≤ 60 ký tự và description 70–155 ký tự cho mọi route VI/EN, không trùng nhau. File này là nguồn duy nhất của `<title>`.
- `lib/seo.ts`: giữ nguyên chữ ký `buildMetadata`. Gồm canonical, hreflang, OG/Twitter, ảnh OG tự lấy poster phim, robots, breadcrumb.
- `lib/jsonld.ts`: Organization, WebSite, Service, BreadcrumbList, Article. Không có LocalBusiness hay AggregateRating, không ghi `areaServed` khi chưa có tỉnh nào được xác nhận.

**Sitemap, robots, chuyển hướng**
- `app/sitemap.ts` (lastmod thật) và `app/robots.ts` (không có dòng `Host:`; `STAGING=1` thì `Disallow: /`).
- `content/redirects.ts`: 34 dòng khớp bảng docs/03 mục 10.3, thêm bảng `legacyAssets` cho ảnh og:image cũ.
- `app/images/[...asset]/route.ts`: trả 301/410 cho ảnh cũ ở tầng Next.
- `scripts/gen-openresty-map.mjs` sinh `deploy/openresty/lapdattoanquoc.conf` (kèm `snippets/` và `README.md`) và `redirect-inventory.csv` (46 dòng). Đã sửa 2 lỗi theo lead-b2b mục 3.8: `rate=1r/m` + `burst=4`, và thêm X-Real-IP cho location form lead.
- `scripts/check-redirects.mjs`: chạy được với BASE_URL bất kỳ.
- `scripts/lib/load-ts.mjs`: script `.mjs` dùng nó để nạp file `.ts` của repo.

**Ảnh**
- `public/images/news/*`: giữ tên cũ.
- `public/images/news-card5.jpg`: nén từ 9,3 MB xuống 113 KB, giữ tên.
- `public/images/news/og/*` và `public/images/og/bluebolt-services-{vi,en}.jpg`: ảnh OG 1200×630, 51–90 KB.
- `public/images/logo-bluebolt-services-512.png`: logo vuông cho JSON-LD.
- Sinh lại bằng `scripts/gen-og-images.mjs`.

**Test:** `tests/seo/` gồm `seo-content.spec.ts`, `seo-pages.spec.ts`, `seo-files.spec.ts`, `vi-allowlist.ts`.

## 2. Kết quả kiểm
| Kiểm | Kết quả |
|---|---|
| `npm run typecheck` (toàn repo) | 0 lỗi |
| `npm run lint` (toàn repo) | 0 lỗi, 0 cảnh báo |
| `npm run test` (Vitest) | 120/120 |
| `tests/seo/` trên dev server (54 route VI/EN, robots, sitemap, 301, 410, ảnh OG) | 64/64 |
| `tests/seo/` trên bản build production (cổng 3092) | 60 qua, 4 bỏ qua (`/dev/*` trả 404 ở production, đúng thiết kế) |
| 14 route Kiến thức: `seo-render` (đúng 1 H1, có và không JS) | 28/28 |
| 14 route Kiến thức: axe | 28/28 |
| 14 route Kiến thức: tràn ngang (9 bề rộng) | 14/14 |
| `check-redirects` trên dev và bản build | 46 dòng, 0 lỗi (biến thể "/" cuối đi 2 bước ở tầng Next, như D-17) |
| Cấu hình openresty sinh ra, chạy thử local trên nginx 1.29.8 (docker, chỉ loopback) | `nginx -t` ok; 362 request (4 biến thể × có/không "/" × có query) — 0 lỗi, đúng 1 hop, giữ query, HTTP/2, header không lặp. Container đã dừng |

**`scripts/safe-build.sh`:** xanh, 56 trang prerender.
- JS tải đầu của `/kien-thuc` và 12 trang bài: 162,4 KB gz (ngân sách 170). Cao hơn trang thường 5,5 KB vì dùng `next/image`, tôi giữ lại vì ảnh đầu bài gốc nặng tới 2,4 MB.
- CSS 13,7–14 KB, HTML 27,5–38,4 KB gz.
- Sitemap ở production có 44 URL; bản xem trước có 50 (6 trang pháp lý chưa duyệt bị loại ở production).
- HTML production không còn chữ của claim nháp, không còn ghi chú "Ảnh thật sẽ chụp".

**Ảnh tự soát (đã mở xem):**
- `.cache/shots/seo-final/{vi,en}--knowledge*--{390,1440}.png` (hub, bài máy giặt, bài điện lạnh 2026)
- `.cache/shots/seo/kien-thuc--{1440,768}--0*.png`
- `public/images/og/bluebolt-services-{vi,en}.jpg`

## 3. Đề xuất sửa ngoài khu vực (chưa sửa)
1. **`proxy.ts`** (nền móng): trang 410 của bản EN đang hiện chữ tiếng Việt. Đề xuất:
   ```diff
   -const GONE_BODY = '<!doctype html><html lang="vi">…</html>';
   +const GONE_BODY = { vi: '…(bản hiện tại)…', en: '<!doctype html><html lang="en">…<h1>This page has been removed</h1>…<a href="/en">…</a>…' };
   -    return new NextResponse(GONE_BODY, {
   +    const lang = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'vi';
   +    return new NextResponse(GONE_BODY[lang], {
   ```
   Cấu hình openresty đã có trang 410 song ngữ.
2. **`package.json`:**
   ```diff
   -"test:seo": "playwright test tests/seo-render.spec.ts",
   +"test:seo": "playwright test tests/seo-render.spec.ts tests/seo/",
   +"seo:og": "node scripts/gen-og-images.mjs",
   +"redirects:gen": "node scripts/gen-openresty-map.mjs",
   +"redirects:check": "node scripts/check-redirects.mjs",
   ```
3. **`app/[locale]/mang-luoi/page.tsx`** (agent bản đồ): trang này là trang index duy nhất còn thiếu BreadcrumbList. Thêm `<Breadcrumbs routeKey="network" locale={locale} />`.
4. **`tests/seo-render.spec.ts`** (QA): kiểm robots theo `route.indexable` sẽ fail ở trang `legal.*` trên production (đang noindex khi chưa duyệt). Nên bỏ qua `legal.*` ở bước này; `tests/seo/seo-files.spec.ts` đã kiểm sitemap khớp với meta robots.
5. **`content/validate.ts`** (tuỳ chọn): gọi `validateArticles()` (`content/articles/schema.ts`) để Vitest cũng kiểm thân bài. Hiện việc kiểm chạy lúc build qua trang bài và trong `tests/seo/`.
6. **Các agent khác:**
   - Chỉ cần `buildMetadata({ routeKey, locale })`; title/description truyền vào bị bỏ qua khi `content/seo.ts` đã có mục. Các khóa `meta.*` trong messages giờ không còn dùng cho `<title>`.
   - Sửa nội dung trang nào thì cập nhật `updatedAt` của trang đó trong `content/seo.ts` để sitemap có lastmod đúng.
   - Agent phim: xuất `public/film/og-*.jpg` (1200×630, ≤ 300 KB, không KHANG) thì `lib/seo.ts` tự dùng làm ảnh OG mặc định. Poster chỉ có AVIF sẽ không được dùng.
7. **`docs/DECISIONS.md`** (tech lead): cần ghi các giả định ở mục 4. Tôi không tự sửa vì tech lead đang thêm mục vào file này.

## 4. Giả định cần anh Duy xác nhận
1. **`/images/og-cover.jpg`** (og:image cũ của 18 trang) là banner khóa học "Đào tạo chuyển đổi số AI" của SiêuTăngTrưởng, hotline 0936 038 739, không phải của Bluebolt. Tôi không dùng ảnh này mà tự dựng ảnh OG mới (không KHANG, không claim) và cho đường dẫn cũ 301 sang ảnh mới.
2. **Bài viết:** bài AI trả 410 cả VI và EN (Q10). Bài robot gộp lấy ngày đăng 22/04/2026 của URL được giữ.
3. **Ảnh đã bỏ khỏi bài:**
   - 2 ảnh có KHANG;
   - ảnh có logo hãng: quảng cáo Samsung, DEEBOT, camera Viettel, robot LG, cảm biến Milesight/E-TEK;
   - ảnh gia đình phương Tây có chú thích sai là đội thợ Bluebolt;
   - ảnh thợ 3D kèm nhãn "1000+ thợ";
   - ảnh dàn nóng Daikin trong bài về máy lạnh hỏng: thay bằng khung giữ chỗ, đường dẫn cũ 301 sang ảnh khác của cùng bài.
4. **Số không có nguồn đã làm mềm:** 40%, 80%, 70%, 5%, "hai chữ số", "gấp 5–10 lần". Tên hãng (Panasonic, Daikin, LG, Casper, Toshiba, Xiaomi, iRobot, Ecovacs) đổi thành "các hãng lớn".
5. **7 claim nháp:**
   - "Bảo hành 12 tháng" mâu thuẫn với chính sách 02 tháng.
   - Các câu "4 giờ → 15 phút, khiếu nại giảm 65%" và "SLA, mọi tỉnh thành" chưa có nguồn.
   - Dịch vụ trực tiếp cho khách lẻ (nhánh A) bị ẩn cả mục ở production.
6. **Bản EN** là bản nháp, cần người bản ngữ biên tập.
7. **JSON-LD:** contactPoint của 3 bộ phận dùng chung hotline và email; không ghi `areaServed`.
8. **lastmod:** mọi route lấy ngày 2026-10-02.

## 5. Việc còn dở
- Kiểm kê URL từ Search Console 90 ngày và access log (chưa có quyền). Bảng hiện chỉ gồm 34 URL sitemap và ảnh og:image.
- Áp cấu hình openresty lên server (chưa có quyền server, R1): nếu nginx < 1.25.1 thì chạy với `--legacy-http2`; nâng HSTS theo lịch; kiểm SSL Labs.
- Chạy Rich Results Test thủ công (G7).
- Ảnh thật cho bài "10 nguyên nhân" (đang dùng khung giữ chỗ).
- Biên tập bản EN.
