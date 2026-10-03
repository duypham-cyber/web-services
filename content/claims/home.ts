import type { Claim } from '../schemas';

/**
 * Câu khẳng định riêng của TRANG CHỦ (khu vực b2b, phần sau phim). Chủ sở hữu: agent trang chủ.
 * TẤT CẢ đang là "draft" → KHÔNG hiển thị ở production; bản xem trước (DRAFT_PREVIEW=1) hiện kèm nhãn "Nháp".
 * Xét duyệt 03/10/2026 (docs/DECISIONS.md D-26 mục 2, bảng D-27): cả 6 câu giữ nháp (dashboard, hóa đơn, logo/đối tác,
 * video, case study, TCVN/QCVN đều thuộc nhóm chờ bằng chứng).
 * Đọc CHỈ qua `claim(id, locale)` (lib/claims.ts). Câu dùng chung toàn site (34 tỉnh, chuẩn hãng, E-KYC, bảo hành,
 * 24/7) nằm ở content/claims/core.ts — không lặp lại ở đây.
 *
 * Duyệt một câu: điền evidence (bằng chứng + đường dẫn), approvedBy, approvedAt, rồi đổi status → "approved".
 * Riêng logo đối tác, video và case study: ngoài claim còn cần dữ liệu thật (file logo, nguồn video, số liệu case)
 * trong components/home (xem TrustBand.tsx, ProofSection.tsx) — thiếu dữ liệu thì section vẫn ẩn ở production.
 */
export const homeClaims = [
  {
    id: 'home.photo-sign-off',
    text: {
      vi: 'Mỗi đơn có ảnh nghiệm thu lưu trên hệ thống, Hãng/Sàn xem lại được',
      en: 'Every job is signed off with photos stored in the system for you to review',
    },
    status: 'draft',
    evidence:
      'Site cũ: trang chủ mục "Quy trình minh bạch" (hình ảnh nghiệm thu cập nhật trên hệ thống), trang /services bước 4 ' +
      '("gửi hình ảnh & biên bản lên hệ thống"). Chưa có ảnh chụp màn hình app/dashboard thật.',
    approvedBy: null,
    approvedAt: null,
    note: 'Cần ảnh chụp màn hình dashboard thật (che dữ liệu khách) hoặc biên bản demo để duyệt.',
  },
  {
    id: 'home.compliant-costs',
    text: {
      vi: 'Phí dịch vụ có hóa đơn và chứng từ hợp lệ cho Hãng/Sàn',
      en: 'Service fees are backed by valid invoices and paperwork',
    },
    status: 'draft',
    evidence:
      'Site cũ, trang chủ mục "Giải pháp Bluebolt Services": "Hợp lệ hóa chi phí: tối ưu bài toán thuế (VAT/TNCN)". ' +
      'Chính sách hiện hành Phần 2 Điều khoản 2: Bluebolt không thu tiền và không xuất hóa đơn cho vật tư phát sinh ' +
      '(research/agent-notes/content-cro/policy-vi-parts.json).',
    approvedBy: null,
    approvedAt: null,
    note: 'Cần kế toán/pháp chế xác nhận loại hóa đơn xuất cho Hãng/Sàn và cách xử lý thuế TNCN của thợ.',
  },
  {
    id: 'home.partner-logos',
    text: {
      vi: 'Logo hãng và sàn đang hợp tác',
      en: 'Logos of our brand and marketplace partners',
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note:
      'Chỉ hiện khi có văn bản đồng ý dùng logo của từng đối tác (docs/03 mục 15 dòng 14, AC-DATA-4). ' +
      'Site cũ không có logo hãng nào.',
  },
  {
    id: 'home.partner-video',
    text: {
      vi: 'Video Bluebolt × Panasonic',
      en: 'Bluebolt × Panasonic video',
    },
    status: 'draft',
    evidence: 'Video đang có ở trang /news của site cũ (docs/01 mục 2: "bằng chứng xã hội thật duy nhất hiện có").',
    approvedBy: null,
    approvedAt: null,
    note: 'Cần văn bản cho phép dùng video trên trang chủ và file video/nguồn phát chính thức (docs/04 mục 5.2).',
  },
  {
    id: 'home.case-study',
    text: {
      vi: 'Case study triển khai cho một hãng đối tác',
      en: 'Rollout case study with a brand partner',
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note: 'Cần: tên hãng (có văn bản đồng ý), số tỉnh, thời gian triển khai, một chỉ số kết quả, trích dẫn của người thật.',
  },
  {
    id: 'home.standards-citation',
    text: {
      vi: 'Lắp điều hòa theo TCVN 5687:2024, an toàn điện theo QCVN 25:2025/BKHCN',
      en: 'Air conditioners installed to TCVN 5687:2024, electrical safety to QCVN 25:2025/BKHCN',
    },
    status: 'draft',
    evidence: 'Site cũ, trang /worker-map (Tiêu chuẩn 2 và Tiêu chuẩn 4).',
    approvedBy: null,
    approvedAt: null,
    note: 'Trích dẫn chưa được kiểm chứng (docs/03 mục 13.4 P6): cần xác nhận số hiệu, năm ban hành và phạm vi áp dụng.',
  },
] as const satisfies readonly Claim[];
