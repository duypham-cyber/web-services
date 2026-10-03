# content/ — nội dung là code (docs/04 mục 2.4)

Giai đoạn 1 không có CMS: số liệu, câu khẳng định, SLA, tỉnh, bảng 301 nằm ở đây, kiểu chặt, kiểm bằng Zod.
Shape được thiết kế để sau này chuyển sang Payload CMS (P1, qua contract) chỉ cần thay tầng đọc dữ liệu.

## Quy tắc

1. **File dữ liệu KHÔNG import zod** (client component đọc được mà không kéo zod vào bundle). Kiểu lấy từ
   `schemas.ts` bằng `import type`.
2. **Validate lúc build**: `validate.ts` parse mọi file bằng schema + ràng buộc chéo. Root layout gọi
   `assertContentValid()` → dữ liệu sai làm `next build` FAIL; `tests/unit/content.test.ts` kiểm cùng điều đó.
   Thêm file mới → thêm vào `validate.ts` + schema trong `schemas.ts`.
3. **Không bịa số.** Chưa có số thật thì để `null` (KPI ẩn ô, tỉnh hiện "chưa có số"). Có số thì kèm ngày
   (`YYYY-MM-DD`) và nguồn. Số site cũ đang ghi để ở `legacyValue` của `stats.ts` (CHỈ bản xem trước hiện, kèm
   "Nháp · số site cũ"; đọc qua `lib/stats.ts`, không đọc thẳng — docs/DECISIONS.md D-24).
4. **Câu khẳng định chỉ đọc qua `claim(id, locale)`** (`lib/claims.ts`). Chưa `approved` → không hiển thị ở
   production; bản xem trước (`DRAFT_PREVIEW=1`) hiện kèm `<DraftBadge />`.
5. Mỗi chuỗi có bản VI và EN (`{ vi, en }`). EN là nháp cho tới khi người biên tập bản ngữ duyệt.
6. Chữ giao diện (nút, tiêu đề, mô tả trang) KHÔNG để ở đây — để ở `messages/<locale>/<namespace>.json`.
7. **Ảnh đưa vào `public/` (docs/03 mục 11.4).** Trước khi thêm hoặc dùng lại ảnh, mở ảnh ra xem cả khung và soát góc:
   - CẤM ảnh AI/render có người mặc đồng phục, áo in chữ hoặc logo "BLUEBOLT"/tia chớp (giả làm thợ thật), và ảnh in sẵn
     khẩu hiệu tự khen ("tay nghề cao", "uy tín"...). Thợ Bluebolt chỉ xuất hiện qua ảnh chụp thật (docs/03 mục 15 dòng 10).
   - Soát dấu ảnh AI: hình ✦ của Gemini ở góc phải dưới, chữ ký/watermark công cụ; ảnh Google tạo còn có SynthID
     (không nhìn thấy) — nguồn là ảnh AI thì coi như ảnh AI. Không chắc nguồn → không dùng.
   - Không logo/kiểu dáng nhận diện của hãng; không stock "gia đình phương Tây + robot", người máy, cảnh cháy nổ; không
     chữ trong ảnh. Chưa có ảnh đạt → để `hero: null` (bài viết không có ảnh đầu bài, thẻ bài dùng bìa dựng từ token).
   - Ảnh cũ đang là og:image của URL cũ mà không còn dùng được → 301 sang ảnh OG mặc định trong `redirects.ts`
     (`legacyAssets`), không để file cũ tiếp tục được phục vụ.

## Chủ sở hữu từng file

| File | Nội dung | Chủ sở hữu (agent) | Ai cung cấp dữ liệu thật |
|---|---|---|---|
| `schemas.ts` | Schema Zod của mọi file | Tech lead nền móng | — |
| `validate.ts` | Kiểm toàn bộ + ràng buộc chéo | Tech lead nền móng | — |
| `site.ts` | Pháp nhân, MST, địa chỉ, hotline 2 định dạng, email, Zalo (draft) | Tech lead nền móng | Anh Duy (địa chỉ theo ĐKDN, Zalo OA) |
| `stats.ts` | KPI K1–K6: K1 500+ (kèm số theo miền `byRegion`), K2 34/34, K6 60 phút là số công bố đã duyệt (D-26, `basis: 'published'`); K3–K5 `null`. Số site cũ `legacy*` chỉ cho bản xem trước | Tech lead nền móng | Anh Duy + vận hành (docs/03 mục 15 dòng 4) |
| `claims/core.ts` | 34 tỉnh, chuẩn hãng, E-KYC, bảo hành, 24/7 (đều draft) | Tech lead nền móng | Anh Duy + pháp chế duyệt bằng chứng |
| `claims/<khu-vuc>.ts` | Câu khẳng định riêng từng khu vực: `home.ts`, `b2b.ts` (agent B2B), `partner.ts` (agent partner), `knowledge.ts` (agent SEO) | Agent của khu vực đó | Anh Duy + pháp chế |
| `process.ts` | Quy trình 5 bước + bước 00 | Agent trang B2B | Anh Duy xác nhận thứ tự 02→03, kênh nhận đơn |
| `sla.ts` | SLA, bảo hành, mọi mốc giờ (hotline, nhận đơn, thi công, bảo hành cùng hãng). Đã duyệt `confirm-time` (60 phút) và `fix-response-time` (24–48 giờ, D-26/D-27); còn lại `null`, có cột "đang ghi" | Agent trang B2B | Anh Duy + pháp chế (docs/03 mục 15 dòng 6) |
| `pricing.ts` | Khung giá vật tư `/bang-gia` (6 dòng × 4 vùng, chưa có ngày hiệu lực → production ẩn) | Agent trang B2B | Anh Duy (ngày hiệu lực, giá công) |
| `jobs.ts` | Tin tuyển thợ (đều draft) | Agent trang thợ & công ty | Bộ phận tuyển thợ |
| `legal.ts` | 3 văn bản pháp lý (bảo hành = chính sách cũ; bảo mật/điều khoản chỉ có khung) | Agent trang thợ & công ty | Pháp chế |
| `partners.ts` | Logo đối tác (cần văn bản đồng ý), thu nhập/phí của thợ, link app | Agent trang thợ & công ty | Anh Duy + vận hành |
| `provinces.ts` | 34 tỉnh, 3 vùng (18/4/12 theo site cũ), tên tỉnh cũ, số thợ (`null`), nhãn Hoàng Sa/Trường Sa | Agent bản đồ | Vận hành: số thợ theo tỉnh, cách chia vùng |
| `services.ts` | 4 nhóm dịch vụ, slug VI/EN | Agent trang B2B | — |
| `articles.ts`, `articles/*.ts` | 6 bài viết (registry + thân bài có cấu trúc, Zod ở `articles/schema.ts`) | Agent nội dung & SEO | — |
| `seo.ts` | title/description/nhãn breadcrumb mọi route — nguồn duy nhất của `<title>` | Agent nội dung & SEO | — |
| `redirects.ts` | 34 URL cũ → mới (301), 2 dòng 410; ảnh og:image cũ (`legacyAssets`) | Agent nội dung & SEO | Search Console + access log 90 ngày (bổ sung) |

Đổi slug hoặc URL đã công khai → thêm dòng 301 vào `redirects.ts` trong cùng PR.
