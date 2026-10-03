import type { Claim } from '../schemas';

/**
 * Câu khẳng định trong 6 bài /kien-thuc (agent nội dung & SEO). Lấy NGUYÊN Ý từ bài cũ trên lapdattoanquoc.vn/news
 * (crawl 02/10/2026), chưa có bằng chứng → "draft": production KHÔNG hiển thị; bản xem trước hiện kèm nhãn "Nháp".
 * Nguồn bài cũ: website-services-3d/noi-dung/crawl.json + HTML tải lại ngày 02/10/2026.
 *
 * Xét duyệt 03/10/2026 (docs/DECISIONS.md D-26 mục 2, bảng D-27): cả 7 câu giữ nháp (bảo hành 12 tháng, giá, B2C nhánh A,
 * số không nguồn, câu gộp nhiều cam kết chưa duyệt).
 *
 * Duyệt một câu: điền evidence, approvedBy, approvedAt rồi đổi status → "approved" (content/README.md).
 */
export const knowledgeClaims = [
  {
    id: 'knowledge.warranty-workmanship-12-months',
    text: {
      vi: 'Bảo hành tay nghề lắp đặt 12 tháng',
      en: '12-month workmanship warranty on installation',
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note:
      'Bài cũ ghi 12 tháng; chính sách hiện hành ghi 02 tháng (warranty.new-installation-term). Chờ anh Duy chốt một ' +
      'thời hạn rồi sửa cho khớp (docs/03 mục 14.2).',
  },
  {
    id: 'knowledge.pricing-no-surprise-costs',
    text: {
      vi: 'Báo giá minh bạch, không phát sinh chi phí ngoài báo giá đã thỏa thuận',
      en: 'Transparent quotes, with no charges beyond the agreed quote',
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note: 'Cam kết của site cũ (NOI-DUNG.md mục 8). Cần chính sách giá/hợp đồng làm bằng chứng.',
  },
  {
    id: 'knowledge.b2c-ac-care-services',
    text: {
      vi: 'Bluebolt Services nhận vệ sinh máy lạnh, kiểm tra và sửa chữa tận nơi, lắp đặt đúng chuẩn kỹ thuật.',
      en: 'Bluebolt Services offers air conditioner cleaning, on-site inspection and repair, and installation to technical standards.',
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note:
      'Dịch vụ trực tiếp cho khách lẻ. Mặc định hiện tại là nhánh A — không nhận đơn B2C trực tiếp (docs/DECISIONS.md ' +
      'D-02, Q4). Chỉ duyệt nếu anh Duy chọn nhánh B.',
  },
  {
    id: 'knowledge.washer-install-commitment',
    text: {
      vi: 'Bluebolt Services lắp đặt máy giặt theo đúng quy trình của hãng, bảo hành tay nghề 12 tháng và hỗ trợ kiểm tra, xử lý sự cố trong 24–48 giờ.',
      en: "Bluebolt Services installs washing machines according to the manufacturer's procedure, with a 12-month workmanship warranty and inspection or troubleshooting support within 24–48 hours.",
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note:
      'Gộp 3 cam kết: chuẩn hãng (quality.brand-standard, nháp), bảo hành 12 tháng (mâu thuẫn chính sách 02 tháng, nháp ' +
      'theo D-26), xử lý 24–48 giờ (đã duyệt: content/sla.ts "fix-response-time", D-27). Còn hai ý chưa duyệt nên cả câu giữ nháp.',
  },
  {
    id: 'knowledge.digital-ops-results',
    text: {
      vi: 'Thời gian phản hồi đơn rút ngắn từ 4 giờ xuống còn 15 phút, tỷ lệ khiếu nại giảm 65% so với mô hình truyền thống.',
      en: 'Order response time has fallen from 4 hours to 15 minutes, and complaints are down 65% compared with the traditional model.',
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note:
      'Số liệu vận hành không có nguồn, kỳ đo, định nghĩa. Khi có số thật phải đưa vào content/stats.ts (K1–K6) kèm ' +
      'ngày cập nhật, không viết cứng trong bài (docs/03 mục 11.5, 14.2).',
  },
  {
    id: 'knowledge.three-party-benefits',
    text: {
      vi: 'Khách hàng theo dõi được tiến độ và nghiệm thu minh bạch; thợ có nguồn đơn ổn định, hoa hồng rõ ràng, được đào tạo và hỗ trợ kỹ thuật; hãng và sàn TMĐT có SLA cam kết, dữ liệu báo cáo theo thời gian thực và mở rộng được tới mọi tỉnh thành.',
      en: 'Customers can track progress and sign off transparently; technicians get a steady flow of jobs, clear commissions, training and technical support; brands and marketplaces get committed SLAs, real-time reporting and room to expand to every province.',
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note:
      'Gộp nhiều cam kết: SLA (content/sla.ts mới duyệt 2 mốc: 60 phút, 24–48 giờ — D-27), phủ mọi tỉnh ' +
      '(coverage.provinces-34, đã duyệt), còn chưa có bằng chứng: báo cáo thời gian thực, đào tạo thợ, hoa hồng. Duyệt từng ý ' +
      'hoặc viết lại khi có chính sách thật.',
  },
  {
    id: 'knowledge.single-point-of-contact',
    text: {
      vi: 'Một thợ cho nhiều thiết bị, một đầu mối chịu trách nhiệm toàn bộ trải nghiệm.',
      en: 'One technician for many devices, and a single point of contact responsible for the whole experience.',
    },
    status: 'draft',
    evidence: null,
    approvedBy: null,
    approvedAt: null,
    note: 'Lời hứa về mô hình phục vụ khách lẻ (nhánh A/B chưa chốt, D-02). Cần quy trình thật để duyệt.',
  },
] as const satisfies readonly Claim[];
