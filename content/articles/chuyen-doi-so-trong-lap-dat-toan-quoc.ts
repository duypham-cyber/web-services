import type { ArticleContent } from './types';

/**
 * Nguồn: https://lapdattoanquoc.vn/news/chuyen-doi-so-trong-lap-dat-toan-quoc (+ bản /en), tải lại 02/10/2026.
 * Xếp lại vào nhóm "Vận hành cho doanh nghiệp" (docs/03 mục 10.3 dòng 13).
 */
export const chuyenDoiSoTrongLapDat = {
  key: 'chuyen-doi-so-trong-lap-dat-toan-quoc',
  seoTitle: {
    vi: 'Chuyển đổi số trong lắp đặt điện máy | Bluebolt Services',
    en: 'Digital transformation in nationwide installation',
  },
  description: {
    vi: 'Chuyển đổi số trong lắp đặt điện lạnh, điện máy: quản lý đơn tập trung, điều phối thợ qua app, đối soát minh bạch và dữ liệu để vận hành tốt hơn.',
    en: 'How digital tools change appliance installation: centralised orders, app-based dispatch, transparent reconciliation and data for better operations.',
  },
  lead: {
    vi: 'Bluebolt Services hệ thống hóa vận hành: quản lý đơn tập trung, kết nối thợ qua app, minh bạch chi phí bằng tính toán tự động.',
    en: 'Bluebolt Services runs installation as a system: centralised order management, technicians connected through an app, and costs calculated automatically.',
  },
  publishedAt: '2026-04-08',
  updatedAt: '2026-10-02',
  hero: {
    src: '/images/news-card5.jpg',
    width: 1600,
    height: 1068,
    alt: {
      vi: 'Kỹ thuật viên mặc đồng phục xanh cầm bìa hồ sơ, đứng cạnh hộp đồ nghề trong bếp',
      en: 'Technician in a blue uniform holding a clipboard next to a toolbox in a kitchen',
    },
  },
  ogImage: { src: '/images/news/og/chuyen-doi-so-trong-lap-dat-toan-quoc.jpg', width: 1200, height: 630 },
  intro: [
    {
      type: 'p',
      text: {
        vi: 'Trong bối cảnh công nghệ phát triển mạnh, “chuyển đổi số” không còn là câu chuyện riêng của doanh nghiệp công nghệ mà đang trở thành xu hướng tất yếu trong mọi ngành nghề, bao gồm cả lĩnh vực lắp đặt và dịch vụ kỹ thuật.',
        en: 'As technology moves fast, digital transformation is no longer just for tech companies. It is becoming the norm in every industry, including installation and technical services.',
      },
    },
    {
      type: 'p',
      text: {
        vi: 'Vậy với một ngành đặc thù như lắp đặt điện lạnh, điện máy, vốn phụ thuộc nhiều vào con người và vận hành thực địa, chuyển đổi số được áp dụng như thế nào?',
        en: 'So how does it work in air conditioning and appliance installation, a field that depends so heavily on people and work done on site?',
      },
    },
  ],
  sections: [
    {
      title: {
        vi: '1. Từ vận hành thủ công sang hệ thống hóa toàn bộ quy trình',
        en: '1. From manual work to a fully systematised process',
      },
      blocks: [
        {
          type: 'list',
          label: { vi: 'Trước đây, việc triển khai lắp đặt thường dựa vào', en: 'Installation work used to rely on' },
          items: [
            { vi: 'Gọi điện điều phối', en: 'Phone calls to dispatch technicians' },
            { vi: 'Ghi chép thủ công', en: 'Records kept by hand' },
            { vi: 'Theo dõi đơn hàng rời rạc', en: 'Orders tracked in scattered places' },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Điều này dẫn đến khó kiểm soát tiến độ, sai sót trong đối soát và trải nghiệm khách hàng không đồng nhất.',
            en: 'The result was poor visibility of progress, reconciliation errors and an inconsistent customer experience.',
          },
        },
        {
          type: 'list',
          label: { vi: 'Chuyển đổi số đã thay đổi điều gì?', en: 'What digital tools change' },
          items: [
            {
              vi: 'Tất cả đơn hàng được quản lý trên hệ thống tập trung',
              en: 'Every order is managed in one central system',
            },
            {
              vi: 'Trạng thái đơn hàng được cập nhật theo thời gian thực',
              en: 'Order status is updated in real time',
            },
            { vi: 'Điều phối thợ tự động theo khu vực', en: 'Technicians are dispatched automatically by area' },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Kết quả: nhanh hơn, chính xác hơn, minh bạch hơn.',
            en: 'The result: faster, more accurate and more transparent operations.',
          },
        },
        { type: 'claim', id: 'knowledge.digital-ops-results' },
      ],
    },
    {
      title: {
        vi: '2. Kết nối mạng lưới thợ trên toàn quốc',
        en: '2. Connecting technicians across the country',
      },
      blocks: [
        {
          type: 'p',
          text: {
            vi: 'Một trong những thách thức lớn nhất của ngành là làm sao quản lý hàng trăm, hàng nghìn thợ ở nhiều tỉnh thành.',
            en: "One of the industry's biggest challenges is managing hundreds or even thousands of technicians spread across many provinces.",
          },
        },
        {
          type: 'list',
          label: { vi: 'Giải pháp số hóa', en: 'The digital approach' },
          items: [
            { vi: 'Thợ nhận việc qua app hoặc nền tảng trực tuyến', en: 'Technicians accept jobs through an app or online platform' },
            {
              vi: 'Cập nhật trạng thái công việc ngay tại hiện trường',
              en: 'Job status is updated on site, as the work happens',
            },
            {
              vi: 'Lưu trữ lịch sử làm việc và đánh giá chất lượng',
              en: 'Work history and quality ratings are stored in one place',
            },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Cách làm này giúp chuẩn hóa chất lượng dịch vụ, tăng tính minh bạch và tối ưu hiệu suất làm việc của thợ.',
            en: "This standardises service quality, increases transparency and makes better use of each technician's time.",
          },
        },
      ],
    },
    {
      title: { vi: '3. Minh bạch hóa chi phí và đối soát', en: '3. Transparent costs and reconciliation' },
      blocks: [
        {
          type: 'p',
          text: {
            vi: 'Trong mô hình truyền thống, báo giá dễ phát sinh, đối soát mất thời gian và dễ xảy ra tranh chấp.',
            en: 'In the traditional model, quotes tend to grow, reconciliation takes time and disputes are common.',
          },
        },
        {
          type: 'list',
          label: { vi: 'Khi áp dụng chuyển đổi số', en: 'With digital tools' },
          items: [
            { vi: 'Giá dịch vụ được thiết lập sẵn trên hệ thống', en: 'Service prices are set in the system in advance' },
            { vi: 'Tự động tính toán chi phí theo từng đơn', en: 'Costs are calculated automatically for each job' },
            {
              vi: 'Báo cáo đối soát rõ ràng theo ngày hoặc tháng',
              en: 'Clear reconciliation reports by day or by month',
            },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Lợi ích: doanh nghiệp kiểm soát tốt dòng tiền, thợ nhận thu nhập minh bạch, khách hàng yên tâm về chi phí.',
            en: 'The benefits: the business keeps control of cash flow, technicians see exactly what they earn, and customers know what they will pay.',
          },
        },
      ],
    },
    {
      title: { vi: '4. Nâng cao trải nghiệm khách hàng', en: '4. A better customer experience' },
      blocks: [
        {
          type: 'list',
          label: {
            vi: 'Chuyển đổi số không chỉ tối ưu nội bộ mà còn tạo ra trải nghiệm tốt hơn cho khách hàng',
            en: 'Digital tools do more than streamline internal work; customers benefit too',
          },
          items: [
            { vi: 'Đặt lịch lắp đặt dễ dàng', en: 'Installation appointments are easy to book' },
            { vi: 'Theo dõi tiến độ đơn hàng', en: 'Order progress can be tracked' },
            {
              vi: 'Đánh giá chất lượng dịch vụ sau khi hoàn thành',
              en: 'Service quality can be rated once the job is done',
            },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Khách hàng không còn mơ hồ về việc khi nào thợ đến, chi phí bao nhiêu và ai chịu trách nhiệm.',
            en: 'Customers are no longer left wondering when the technician will arrive, what it will cost or who is responsible.',
          },
        },
      ],
    },
    {
      title: { vi: '5. Dữ liệu trở thành lợi thế cạnh tranh', en: '5. Data becomes a competitive advantage' },
      blocks: [
        {
          type: 'list',
          label: {
            vi: 'Khi toàn bộ hoạt động được số hóa, doanh nghiệp có thể',
            en: 'Once every operation is digital, a business can',
          },
          items: [
            { vi: 'Phân tích hiệu suất thợ', en: 'Analyse technician performance' },
            { vi: 'Dự báo nhu cầu theo mùa', en: 'Forecast seasonal demand' },
            { vi: 'Tối ưu giá dịch vụ và vận hành', en: 'Fine-tune pricing and operations' },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Đây chính là yếu tố giúp doanh nghiệp mở rộng nhanh, kiểm soát tốt và phát triển bền vững.',
            en: 'This is what lets a business scale quickly, stay in control and grow sustainably.',
          },
        },
      ],
    },
    {
      title: {
        vi: '6. Bluebolt Services ứng dụng chuyển đổi số trong lắp đặt toàn quốc',
        en: '6. How Bluebolt Services applies digital tools to nationwide installation',
      },
      blocks: [
        {
          type: 'list',
          label: {
            vi: 'Bluebolt Services đang từng bước xây dựng hệ thống lắp đặt toàn quốc dựa trên nền tảng số',
            en: 'Bluebolt Services is building its nationwide installation operation step by step on a digital foundation',
          },
          items: [
            { vi: 'Quản lý đơn hàng tập trung', en: 'Centralised order management' },
            { vi: 'Kết nối mạng lưới thợ đối tác', en: 'A connected network of partner technicians' },
            { vi: 'Chuẩn hóa quy trình lắp đặt', en: 'Standardised installation procedures' },
            { vi: 'Minh bạch chi phí và đối soát', en: 'Transparent costs and reconciliation' },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Nhờ đó, Bluebolt Services không chỉ lắp đặt mà còn vận hành cả quy trình từ nhận đơn, điều phối, thực hiện tới đối soát.',
            en: 'This means Bluebolt Services does more than install: it runs the whole process from order intake and dispatch to the job itself and reconciliation.',
          },
        },
      ],
    },
    {
      title: { vi: 'Lợi ích cho cả ba bên', en: 'Benefits for all three sides' },
      gate: 'knowledge.three-party-benefits',
      blocks: [],
    },
  ],
  editNotes: [
    'Bỏ infographic chuyen-doi-so-infographic.png (có mascot KHANG — quyền chưa xác nhận, D-03).',
    'Số "4 giờ → 15 phút, khiếu nại giảm 65%" chuyển thành claim nháp knowledge.digital-ops-results (không có nguồn, kỳ đo).',
    'Mục "Lợi ích cho cả 3 bên" (SLA cam kết, mọi tỉnh thành, đào tạo thợ) gắn claim knowledge.three-party-benefits: production ẩn cả mục.',
    '"Kết nối mạng lưới thợ rộng khắp" → "mạng lưới thợ đối tác" (bỏ ý phạm vi chưa duyệt); "hệ sinh thái hiện đại, hiệu quả, đáng tin cậy" (tự khen) → mô tả việc làm cụ thể.',
    'Bỏ emoji 👉 🚀 🔧 💡; "scale", "pricing" → tiếng Việt.',
  ],
} as const satisfies ArticleContent;
