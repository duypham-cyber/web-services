import type { Claim } from '../schemas';

/**
 * Câu khẳng định cốt lõi (docs/03 mục 13.2, docs/04 R17 + Q19). "draft" = chưa có bằng chứng được anh Duy/pháp chế duyệt
 * → KHÔNG hiển thị ở production, kể cả trên texture/poster. Bản xem trước (DRAFT_PREVIEW=1) hiện kèm nhãn "Nháp".
 * Duyệt 03/10/2026 (docs/DECISIONS.md D-26 mục 2, bảng D-27): chỉ "coverage.provinces-34" (K2 = 34/34). Các câu còn lại
 * giữ nháp: chuẩn hãng (chưa có tài liệu), E-KYC (tiêu chuẩn thợ), bảo hành (thời hạn, trang pháp lý), 24/7 (giờ hotline).
 *
 * Duyệt một câu: điền evidence (bằng chứng + đường dẫn), approvedBy, approvedAt, rồi đổi status → "approved".
 */
export const coreClaims = [
  {
    id: 'coverage.provinces-34',
    text: {
      vi: 'Mạng lưới lắp đặt tại 34 tỉnh/thành',
      en: 'Installation network across all 34 provinces',
    },
    status: 'approved',
    evidence:
      'K2 = 34/34 tỉnh/thành (content/stats.ts), số đang công bố trên lapdattoanquoc.vn: bộ đếm trang chủ "34 Tỉnh/ TP" ' +
      '(NOI-DUNG.md mục 10, mục 13). Anh Duy duyệt 03/10/2026 (docs/DECISIONS.md D-26 mục 2).',
    approvedBy: 'Anh Duy (D-26)',
    approvedAt: '2026-10-03',
    note:
      'Duyệt 03/10/2026 (D-26 mục 2, D-27): câu chỉ khẳng định K2 = 34/34 đã duyệt, không đổi câu chữ. Trước đó: site cũ ' +
      'ghi lẫn 63 và 34 tỉnh (UX-03).',
  },
  {
    id: 'quality.brand-standard',
    text: {
      vi: 'Lắp đặt đúng chuẩn kỹ thuật của hãng',
      en: "Installed to each brand's technical standards",
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note: 'Cần tài liệu chuẩn lắp đặt của ít nhất một hãng đối tác hoặc quy trình nội bộ được ký.',
  },
  {
    id: 'technician.ekyc',
    text: {
      vi: 'Thợ được xác minh danh tính bằng E-KYC',
      en: 'Technicians are identity-verified through e-KYC',
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note: 'Cần xác nhận app thợ có bước E-KYC thật và tỷ lệ thợ đã qua E-KYC.',
  },
  {
    id: 'warranty.register-within-7-days',
    text: {
      vi: 'Khách đăng ký bảo hành trong 7 ngày sau khi nghiệm thu',
      en: 'Customers register for warranty within 7 days of sign-off',
    },
    status: 'draft',
    evidence: 'Chính sách hiện hành Phần 2, Điều khoản 3 (research/agent-notes/content-cro/policy-vi-parts.json)',
    approvedBy: null,
    approvedAt: null,
    note: 'Có trong chính sách cũ nhưng chưa được anh Duy/pháp chế xác nhận cho site mới (docs/04 mục 9 #4).',
  },
  {
    id: 'warranty.new-installation-term',
    text: {
      vi: 'Bảo hành lắp đặt mới 02 tháng kể từ ngày nghiệm thu',
      en: 'New installations carry a 2-month workmanship warranty from sign-off',
    },
    status: 'draft',
    evidence: 'Chính sách hiện hành Phần 2, Điều khoản 3 (research/agent-notes/content-cro/policy-vi-parts.json)',
    approvedBy: null,
    approvedAt: null,
    note: 'Mâu thuẫn: chính sách ghi 02 tháng, một bài viết ghi 12 tháng (docs/03 mục 14.2). Chờ anh Duy chốt.',
  },
  {
    id: 'support.24-7',
    text: {
      vi: 'Hỗ trợ vận hành 24/7',
      en: '24/7 operations support',
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note: 'Mâu thuẫn: footer cũ ghi "24/7", trang /contact ghi 9:00–18:00 T2–T6 (docs/03 mục 14.2, câu hỏi mở số 5).',
  },
] as const satisfies readonly Claim[];
