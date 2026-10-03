import type { SlaItem } from './schemas';

/**
 * SLA và bảo hành dùng chung (docs/03 mục 14.2) — MỘT nguồn cho mọi mốc giờ.
 * Mặc định: value = null, status = "draft". Cột `current` ghi nguyên điều site cũ/chính sách hiện hành đang nói, để anh Duy
 * + pháp chế đối chiếu và chốt. KHÔNG render `current` ra trang như một cam kết. Trang chỉ hiện `value` khi status = "approved".
 * Nguồn: research/agent-notes/content-cro/policy-vi.json, policy-vi-parts.json, research/raw/home.txt, contact.txt, services.txt.
 *
 * Đã duyệt (anh Duy, 03/10/2026 — docs/DECISIONS.md D-26 mục 2, bảng D-27): "confirm-time" (xác nhận lịch trong 60 phút) và
 * "fix-response-time" (xử lý bảo hành/lỗi lắp đặt trong 24–48 giờ). value chỉ chứa đúng phần đã duyệt; phần khác của `current`
 * (CSKH phản hồi 24 giờ làm việc, 24/36 giờ làm việc theo khu vực) vẫn chưa duyệt.
 * Giữ nháp theo D-26: thời hạn bảo hành (02 hay 12 tháng), giờ hotline (24/7 hay 9:00–18:00), "có thợ trong 24h" mọi tỉnh,
 * cùng các mốc giờ khác của chính sách cũ (trang pháp lý chưa có bản chốt).
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
    // Thêm 03/10/2026 để ghi mốc đã duyệt (D-26). Cùng mốc với KPI K6 (content/stats.ts) và claim b2b.sla.confirm-60-minutes.
    // Không nêu ai liên hệ: site cũ ghi CSKH, chính sách cũ và content/process.ts (bước 03) ghi thợ — chờ anh Duy chốt.
    id: 'confirm-time',
    label: { vi: 'Xác nhận lịch với khách', en: 'Appointment confirmation' },
    current: {
      vi: 'Trang /services cũ: CSKH liên hệ khách trong vòng 60 phút để xác nhận thông tin, chốt lịch; chính sách cũ: thợ phải liên hệ khách trong ngày nhận đơn',
      en: 'Old /services page: customer care contacts the customer within 60 minutes to confirm details and book; old policy: the technician must contact the customer on the day the job arrives',
    },
    currentSource: 'research/raw/services.txt (mục 3); Chính sách Phần 3, Điều khoản 3; NOI-DUNG.md mục 6, mục 13',
    value: { vi: 'Trong vòng 60 phút sau khi nhận đơn', en: 'Within 60 minutes of receiving the order' },
    status: 'approved',
    approvedBy: 'Anh Duy (D-26, 03/10/2026)',
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
    // Duyệt đúng mốc "xử lý bảo hành 24–48h" (D-26; NOI-DUNG.md mục 8, 13). "24 giờ làm việc" (CSKH phản hồi) và
    // "24/36 giờ làm việc" theo khu vực KHÔNG nằm trong value — vẫn nháp ở claim b2b.sla.fix-*, support.warranty-response-time.
    value: { vi: 'Trong 24–48 giờ', en: 'Within 24–48 hours' },
    status: 'approved',
    approvedBy: 'Anh Duy (D-26, 03/10/2026)',
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
