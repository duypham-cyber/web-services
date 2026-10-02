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
   (`YYYY-MM-DD`) và nguồn.
4. **Câu khẳng định chỉ đọc qua `claim(id, locale)`** (`lib/claims.ts`). Chưa `approved` → không hiển thị ở
   production; bản xem trước (`DRAFT_PREVIEW=1`) hiện kèm `<DraftBadge />`.
5. Mỗi chuỗi có bản VI và EN (`{ vi, en }`). EN là nháp cho tới khi người biên tập bản ngữ duyệt.
6. Chữ giao diện (nút, tiêu đề, mô tả trang) KHÔNG để ở đây — để ở `messages/<locale>/<namespace>.json`.

## Chủ sở hữu từng file

| File | Nội dung | Chủ sở hữu (agent) | Ai cung cấp dữ liệu thật |
|---|---|---|---|
| `schemas.ts` | Schema Zod của mọi file | Tech lead nền móng | — |
| `validate.ts` | Kiểm toàn bộ + ràng buộc chéo | Tech lead nền móng | — |
| `site.ts` | Pháp nhân, MST, địa chỉ, hotline 2 định dạng, email, Zalo (draft) | Tech lead nền móng | Anh Duy (địa chỉ theo ĐKDN, Zalo OA) |
| `stats.ts` | KPI K1–K6 (đều `null`) | Tech lead nền móng | Anh Duy + vận hành (docs/03 mục 15 dòng 4) |
| `claims/core.ts` | 34 tỉnh, chuẩn hãng, E-KYC, bảo hành, 24/7 (đều draft) | Tech lead nền móng | Anh Duy + pháp chế duyệt bằng chứng |
| `claims/<khu-vuc>.ts` | Câu khẳng định riêng từng khu vực (tạo khi cần) | Agent của khu vực đó | Anh Duy + pháp chế |
| `process.ts` | Quy trình 5 bước + bước 00 | Agent trang B2B | Anh Duy xác nhận thứ tự 02→03, kênh nhận đơn |
| `sla.ts` | SLA, bảo hành (đều `null`, có cột "đang ghi") | Agent trang B2B | Anh Duy + pháp chế (docs/03 mục 15 dòng 6) |
| `provinces.ts` | 34 tỉnh, vùng, số thợ (`null`), nhãn Hoàng Sa/Trường Sa | Agent bản đồ | Vận hành: số thợ theo tỉnh, cách chia vùng |
| `services.ts` | 4 nhóm dịch vụ, slug VI/EN | Agent trang B2B | — |
| `articles.ts` | 6 bài viết, slug VI/EN, URL cũ | Agent nội dung & SEO | — |
| `redirects.ts` | 34 URL cũ → mới (301), 2 dòng 410 | Agent nội dung & SEO | Search Console + access log 90 ngày (bổ sung) |

Đổi slug hoặc URL đã công khai → thêm dòng 301 vào `redirects.ts` trong cùng PR.
