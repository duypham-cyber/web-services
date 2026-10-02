import type { SlaItem } from './schemas';

/**
 * SLA và bảo hành dùng chung (docs/03 mục 14.2). TẤT CẢ là placeholder: value = null, status = "draft".
 * Cột `current` ghi nguyên điều site cũ/chính sách hiện hành đang nói, để anh Duy + pháp chế đối chiếu và chốt.
 * KHÔNG render `current` ra trang như một cam kết. Trang chỉ hiện `value` khi status = "approved".
 * Nguồn: research/agent-notes/content-cro/policy-vi.json, policy-vi-parts.json, research/raw/home.txt, contact.txt.
 */
export const slaItems: readonly SlaItem[] = [
  {
    id: 'hotline-hours',
    label: { vi: 'Giờ hotline', en: 'Hotline hours' },
    current: {
      vi: 'Footer ghi "24/7 - Từ T2 → CN"; trang /contact ghi 9:00–18:00 từ Thứ Hai đến Thứ Sáu',
      en: 'Footer says "24/7, Mon–Sun"; the /contact page says 9:00–18:00, Monday to Friday',
    },
    currentSource: 'research/raw/home.txt (footer), research/raw/contact.txt',
    value: null,
    status: 'draft',
    approvedBy: null,
  },
  {
    id: 'order-intake-hours',
    label: { vi: 'Giờ tiếp nhận đơn', en: 'Order intake hours' },
    current: {
      vi: 'T2–T6 09:00–16:30; T7 09:00–12:00; CN và Lễ/Tết không tiếp nhận đơn',
      en: 'Mon–Fri 09:00–16:30; Sat 09:00–12:00; no intake on Sundays and public holidays',
    },
    currentSource: 'Chính sách Phần 1, Điều khoản 2 (policy-vi.json)',
    value: null,
    status: 'draft',
    approvedBy: null,
  },
  {
    id: 'completion-time',
    label: { vi: 'Thời gian hoàn thành', en: 'Completion time' },
    current: {
      vi: 'Trang chủ cũ: "trong 24h"; chính sách: 24h nội thành HN/HCM, 36h ngoại thành và tỉnh, tối đa 48h',
      en: 'Old home page: "within 24h"; policy: 24h in central Hanoi/HCMC, 36h suburbs and provinces, 48h maximum',
    },
    currentSource: 'research/raw/home.txt; Chính sách Phần 3 Điều khoản 1, Phần 4 Điều khoản 2',
    value: null,
    status: 'draft',
    approvedBy: null,
  },
  {
    id: 'warranty-new-installation',
    label: { vi: 'Bảo hành lắp đặt mới', en: 'Warranty: new installation' },
    current: {
      vi: 'Chính sách: 02 tháng kể từ ngày nghiệm thu; một bài viết cũ ghi 12 tháng',
      en: 'Policy: 2 months from sign-off; an old article says 12 months',
    },
    currentSource: 'Chính sách Phần 2, Điều khoản 3; bài lap-dat-may-lanh-dung-cach-7-buoc',
    value: null,
    status: 'draft',
    approvedBy: null,
  },
  {
    id: 'warranty-repair',
    label: { vi: 'Bảo hành sửa chữa / thay linh kiện', en: 'Warranty: repair or part replacement' },
    current: { vi: 'Chính sách: 03 tháng', en: 'Policy: 3 months' },
    currentSource: 'Chính sách Phần 2, Điều khoản 3',
    value: null,
    status: 'draft',
    approvedBy: null,
  },
  {
    id: 'warranty-cleaning',
    label: { vi: 'Bảo hành vệ sinh, bảo dưỡng', en: 'Warranty: cleaning and servicing' },
    current: { vi: 'Chính sách: 01 tháng', en: 'Policy: 1 month' },
    currentSource: 'Chính sách Phần 2, Điều khoản 3',
    value: null,
    status: 'draft',
    approvedBy: null,
  },
  {
    id: 'warranty-registration-window',
    label: { vi: 'Hạn đăng ký bảo hành', en: 'Warranty registration window' },
    current: {
      vi: 'Trong 7 ngày sau nghiệm thu, qua website, Zalo chính thức hoặc tổng đài',
      en: 'Within 7 days of sign-off, via the website, official Zalo or the hotline',
    },
    currentSource: 'Chính sách Phần 2, Điều khoản 3',
    value: null,
    status: 'draft',
    approvedBy: null,
  },
  {
    id: 'fix-response-time',
    label: { vi: 'Thời gian xử lý lỗi lắp đặt', en: 'Installation fault response time' },
    current: {
      vi: 'CSKH phản hồi trong 24 giờ làm việc; lỗi do Bluebolt khắc phục trong 24–48 giờ; HN/HCM nội thành 24 giờ, ngoại thành và tỉnh 36 giờ làm việc',
      en: 'Support replies within 24 business hours; Bluebolt-caused faults fixed in 24–48 hours; 24 business hours in central Hanoi/HCMC, 36 in suburbs and provinces',
    },
    currentSource: 'Chính sách Phần 2 Điều khoản 3, Phần 4 Điều khoản 2',
    value: null,
    status: 'draft',
    approvedBy: null,
  },
  // Hai mốc giờ dưới đây chuyển từ content/legal.ts (legacyServiceHours) về đây cho một nguồn — đề xuất P4 của agent
  // partner, 02/10/2026. /lien-he#gio-lam-viec (HoursTable) đọc theo id.
  {
    id: 'onsite-work-hours',
    label: { vi: 'Thi công tại nhà khách', en: 'On-site work' },
    current: {
      vi: '08:00–12:00 và 13:00–17:00, thứ Hai đến thứ Bảy; không thi công Chủ nhật, ngày lễ, Tết',
      en: '08:00–12:00 and 13:00–17:00, Monday to Saturday; no on-site work on Sundays or public holidays',
    },
    currentSource: 'Chính sách cũ Phần 3, Điều khoản 1 (policy-vi.json)',
    value: null,
    status: 'draft',
    approvedBy: null,
  },
  {
    id: 'warranty-service-hours',
    label: { vi: 'Xử lý bảo hành cùng hãng', en: 'Warranty service with brands' },
    current: { vi: '08:00–17:00, thứ Hai đến thứ Sáu', en: '08:00–17:00, Monday to Friday' },
    currentSource: 'Chính sách cũ Phần 4, Điều khoản 2 (policy-vi.json)',
    value: null,
    status: 'draft',
    approvedBy: null,
  },
];
