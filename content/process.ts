import type { ProcessStep } from './schemas';

/**
 * Quy trình vận hành chuẩn 5 bước (docs/03 mục 14.1) + bước 00 là sự kiện kích hoạt (hiển thị nhạt).
 * Đây là quy trình DUY NHẤT trên site: trang chủ, /giai-phap/*, texture trong phim đều đọc từ đây.
 *
 * Giả định, chờ anh Duy xác nhận (docs/03 mục 14.1, mục 15 dòng 7):
 *   - thứ tự 02 → 03 (điều phối trước, thợ xác nhận lịch sau) theo Chính sách Phần 3;
 *   - kênh nhận đơn ở bước 01 (API / file / portal) chưa kiểm chứng → mô tả bước 01 không nêu kênh cụ thể.
 * Lộ trình gia nhập 4 bước của thợ là thứ khác, KHÔNG gọi là "quy trình vận hành".
 */
export const PROCESS_PENDING_NOTE =
  'Thứ tự 02 → 03 và kênh nhận đơn ở bước 01 chờ anh Duy xác nhận (docs/03 mục 14.1).';

export const processSteps: readonly ProcessStep[] = [
  {
    id: '00',
    title: { vi: 'Khách mua hàng', en: 'Customer purchase' },
    actor: { vi: 'Khách hàng → Hãng/Sàn', en: 'Customer → brand or retailer' },
    description: {
      vi: 'Khách mua thiết bị tại Hãng, Sàn TMĐT hoặc chuỗi bán lẻ. Đây là sự kiện kích hoạt, chưa phải việc của Bluebolt.',
      en: 'The customer buys an appliance from a brand, marketplace or retail chain. This triggers the job; Bluebolt is not involved yet.',
    },
    isTrigger: true,
  },
  {
    id: '01',
    title: { vi: 'Tiếp nhận đơn', en: 'Order intake' },
    actor: { vi: 'Hãng/Sàn → Bluebolt', en: 'Brand or retailer → Bluebolt' },
    description: {
      vi: 'Đơn lắp đặt đi vào hệ thống của Bluebolt qua kênh đã thống nhất với Hãng/Sàn.',
      en: "Installation orders enter Bluebolt's system through the channel agreed with the brand or retailer.",
    },
    isTrigger: false,
  },
  {
    id: '02',
    title: { vi: 'Điều phối thợ', en: 'Technician dispatch' },
    actor: { vi: 'Bluebolt', en: 'Bluebolt' },
    description: {
      vi: 'Hệ thống chọn thợ gần nhất, đúng kỹ năng và còn lịch trống.',
      en: 'The system assigns the nearest technician with the right skills and an open slot.',
    },
    isTrigger: false,
  },
  {
    id: '03',
    title: { vi: 'Xác nhận lịch hẹn', en: 'Appointment confirmation' },
    actor: { vi: 'Thợ ↔ Khách', en: 'Technician ↔ customer' },
    description: {
      vi: 'Thợ gọi khách xác nhận thời gian và địa điểm lắp đặt.',
      en: 'The technician calls the customer to confirm the time and address.',
    },
    isTrigger: false,
  },
  {
    id: '04',
    title: { vi: 'Lắp đặt & nghiệm thu', en: 'Installation and sign-off' },
    actor: { vi: 'Thợ + Khách', en: 'Technician + customer' },
    description: {
      vi: 'Thợ lắp đặt, chạy thử và nghiệm thu với khách bằng ảnh trên app.',
      en: 'The technician installs and test-runs the unit, then signs off with the customer using photos in the app.',
    },
    isTrigger: false,
  },
  {
    id: '05',
    title: { vi: 'Đối soát & bảo hành', en: 'Reconciliation and warranty' },
    actor: { vi: 'Bluebolt → Hãng/Sàn, Khách', en: 'Bluebolt → brand or retailer, customer' },
    description: {
      vi: 'Bluebolt báo cáo và đối soát với Hãng/Sàn. Khách đăng ký bảo hành dịch vụ lắp đặt.',
      en: 'Bluebolt reports to and reconciles with the brand or retailer. The customer registers the installation warranty.',
    },
    isTrigger: false,
  },
];

/** 5 bước chính (bỏ bước kích hoạt 00). */
export const coreProcessSteps = processSteps.filter((s) => !s.isTrigger);
