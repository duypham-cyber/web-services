import type { ArticleContent } from './types';

/**
 * Nguồn: https://lapdattoanquoc.vn/news/tuong-lai-nganh-dien-lanh-2026 (+ bản /en), tải lại 02/10/2026.
 */
export const tuongLaiNganhDienLanh2026 = {
  key: 'tuong-lai-nganh-dien-lanh-2026',
  seoTitle: {
    vi: 'Ngành điện lạnh 2026: dịch vụ quyết định cuộc chơi',
    en: 'HVAC industry 2026: why service decides the game',
  },
  description: {
    vi: 'Khi công nghệ giữa các hãng điều hòa ngày càng đồng đều, chất lượng lắp đặt, bảo trì và hậu mãi trở thành lý do khách hàng chọn đơn vị dịch vụ.',
    en: 'As air conditioner brands converge on technology, installation quality, maintenance and after-sales care become the reason customers choose a provider.',
  },
  lead: {
    vi: 'Khi sản phẩm bão hòa, trải nghiệm dịch vụ trở thành yếu tố khác biệt chính. Khách hàng dịch chuyển từ “mua máy hiệu gì” sang “đơn vị nào lắp đặt tốt”.',
    en: 'As products saturate the market, service becomes the main differentiator. Customers are moving from “which brand should I buy?” to “who will install it well?”.',
  },
  publishedAt: '2026-04-20',
  updatedAt: '2026-10-02',
  // Ảnh đầu bài cũ là ảnh ghép nhà máy lọc dầu + kỹ sư (lệch art direction, docs/03 mục 11.4) → gỡ, chờ ảnh thiết bị
  // không người, không logo, hoặc ảnh thật. File cũ vẫn ở public/ (og:image cũ, content/redirects.ts "keep").
  hero: null,
  ogImage: null,
  intro: [
    {
      type: 'p',
      text: {
        vi: 'Trước đây, khách hàng thường quan tâm: “Nên mua điều hòa hãng nào?” Nhưng hiện nay, câu hỏi đã thay đổi:',
        en: 'Customers used to ask, “Which air conditioner brand should I buy?” Today the question has changed:',
      },
    },
    {
      type: 'quote',
      text: {
        vi: '“Đơn vị nào lắp đặt tốt và đảm bảo vận hành ổn định?”',
        en: '“Which company will install it properly and keep it running reliably?”',
      },
    },
    {
      type: 'p',
      text: {
        vi: 'Nguyên nhân là thị trường đang dần bão hòa về sản phẩm, trong khi trải nghiệm dịch vụ trở thành yếu tố khác biệt chính. Thị trường điện lạnh Việt Nam đang chuyển dịch mạnh mẽ, và sự thay đổi này định hình lại toàn bộ chuỗi giá trị của ngành.',
        en: "The reason is that products are reaching saturation while the service experience has become the main differentiator. Vietnam's air conditioning market is shifting fast, and the change is reshaping the industry's entire value chain.",
      },
    },
  ],
  sections: [
    {
      title: {
        vi: '1. Sản phẩm không còn là lợi thế cạnh tranh',
        en: '1. The product is no longer the competitive edge',
      },
      blocks: [
        {
          type: 'list',
          label: { vi: 'Các hãng lớn hiện đều có', en: 'The major brands all offer' },
          items: [
            { vi: 'Công nghệ Inverter tiết kiệm điện', en: 'Energy-saving inverter technology' },
            { vi: 'Độ bền cao', en: 'High durability' },
            { vi: 'Tích hợp điều khiển thông minh', en: 'Built-in smart controls' },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Sản phẩm của các hãng lớn đã chạm ngưỡng đồng đều về công nghệ. Cùng phân khúc giá, hiệu suất giữa các hãng chênh nhau không nhiều.',
            en: 'Products from the major brands have reached a similar level of technology. Within the same price band, performance differs very little.',
          },
        },
        {
          type: 'p',
          text: {
            vi: 'Sự khác biệt giữa các hãng ngày càng thu hẹp. Người dùng chuyển sang quan tâm dịch vụ lắp đặt và hậu mãi.',
            en: 'As the gap between brands narrows, buyers turn their attention to installation and after-sales service.',
          },
        },
      ],
    },
    {
      title: {
        vi: '2. Lắp đặt quyết định phần lớn hiệu quả sử dụng',
        en: '2. Installation decides most of the real-world performance',
      },
      blocks: [
        {
          type: 'list',
          label: { vi: 'Một hệ thống lắp đặt sai có thể gây', en: 'A poorly installed system can lead to' },
          items: [
            { vi: 'Hao điện', en: 'Wasted energy' },
            { vi: 'Giảm tuổi thọ máy', en: 'A shorter equipment life' },
            { vi: 'Rò rỉ, lỗi vận hành', en: 'Leaks and operating faults' },
          ],
        },
        {
          type: 'list',
          label: { vi: 'Ngược lại, lắp đặt đúng chuẩn giúp', en: 'A correct installation, on the other hand, delivers' },
          items: [
            { vi: 'Tiết kiệm điện', en: 'Lower power bills' },
            { vi: 'Máy chạy ổn định lâu dài', en: 'Stable operation for years' },
            { vi: 'Phát huy tối đa công nghệ của hãng', en: "The full benefit of the brand's technology" },
          ],
        },
        {
          type: 'quote',
          text: {
            vi: 'Một chiếc máy 5 sao lắp sai kỹ thuật vẫn tốn điện và mau hư hơn máy 3 sao lắp chuẩn.',
            en: 'A five-star unit installed badly will still use more power and fail sooner than a three-star unit installed properly.',
          },
        },
      ],
    },
    {
      title: {
        vi: '3. Khách hàng muốn “trọn gói”, không muốn tự xử lý',
        en: '3. Customers want an end-to-end service, not DIY',
      },
      blocks: [
        {
          type: 'list',
          label: {
            vi: 'Xu hướng mới: không chỉ mua máy mà cần một chuỗi dịch vụ đầy đủ',
            en: 'The new expectation is not just a unit but a complete chain of services',
          },
          items: [
            { vi: 'Tư vấn lựa chọn thiết bị phù hợp', en: 'Advice on choosing the right equipment' },
            { vi: 'Lắp đặt theo đúng chuẩn kỹ thuật', en: 'Installation to technical standards' },
            { vi: 'Bảo trì định kỳ', en: 'Scheduled maintenance' },
            { vi: 'Hỗ trợ khi có sự cố', en: 'Support when something goes wrong' },
          ],
        },
        {
          type: 'p',
          text: {
            vi: 'Người dùng ưu tiên một đơn vị chịu trách nhiệm toàn bộ, tránh tình trạng đá bóng trách nhiệm giữa nơi bán máy và nơi lắp đặt.',
            en: 'Buyers prefer one provider who takes full responsibility, rather than watching the seller and the installer blame each other.',
          },
        },
      ],
    },
    {
      title: {
        vi: '4. Khách hàng muốn gì ở một đơn vị dịch vụ?',
        en: '4. What do customers expect from a service provider?',
      },
      blocks: [
        {
          type: 'defs',
          items: [
            {
              term: { vi: 'Trọn gói', en: 'End to end' },
              text: {
                vi: 'Một đơn vị chịu trách nhiệm toàn bộ: tư vấn, giao máy, lắp đặt, bảo trì.',
                en: 'One company handles everything: advice, delivery, installation and maintenance.',
              },
            },
            {
              term: { vi: 'Minh bạch', en: 'Transparency' },
              text: {
                vi: 'Báo giá rõ ràng từ đầu, không phụ phí phát sinh.',
                en: 'A clear price from the start, with no surprise extras.',
              },
            },
            {
              term: { vi: 'Bảo hành tay nghề', en: 'A workmanship warranty' },
              text: {
                vi: 'Bảo hành riêng cho phần lắp đặt, ghi rõ thời hạn, không chỉ dựa vào bảo hành máy của hãng.',
                en: "A warranty on the installation itself, with a clearly stated term, not just the brand's warranty on the unit.",
              },
            },
            {
              term: { vi: 'Phản hồi nhanh', en: 'Fast response' },
              text: {
                vi: 'Có cam kết thời gian phản hồi khi có sự cố.',
                en: 'A committed response time when something goes wrong.',
              },
            },
          ],
        },
      ],
    },
    {
      title: {
        vi: '5. Cơ hội cho đơn vị lắp đặt chuyên nghiệp',
        en: '5. The opportunity for professional installers',
      },
      blocks: [
        {
          type: 'p',
          text: {
            vi: 'Đây là “ngách vàng” cho các đơn vị có hệ thống: biết tổ chức mạng lưới thợ kỹ thuật chuẩn, có app quản lý đơn, có quy trình nghiệm thu minh bạch.',
            en: 'This is a sweet spot for organised players: those who can build a network of trained technicians, manage jobs through an app and run a transparent sign-off process.',
          },
        },
        {
          type: 'quote',
          text: {
            vi: 'Sản phẩm có thể giống nhau, nhưng dịch vụ là thứ quyết định khách hàng chọn bạn.',
            en: 'Products may look alike, but service is what makes customers choose you.',
          },
        },
      ],
    },
  ],
  editNotes: [
    'Bỏ ảnh hero-technician.png kèm 4 nhãn "E-KYC 100%, bảo hành 12 tháng, phản hồi 24h, 1000+ thợ" (claim chưa duyệt, số 1000+ mâu thuẫn 500+).',
    'Bỏ ảnh tuong-lai-nganh-dien-illustration.png (có mascot KHANG).',
    'Bỏ tên hãng cụ thể (Panasonic, Daikin, LG, Casper, Toshiba) → "các hãng lớn": site B2B làm việc với hãng, chưa có văn bản dùng tên/logo.',
    '"Chênh nhau không quá 5%" → "không nhiều"; "Lắp đặt quyết định 70%" → "quyết định phần lớn" (số không có nguồn).',
    '"Bluebolt Services đang đi đúng hướng này" (tự khen) → bỏ hẳn: đặt ngay sau "bảo hành 6–12 tháng", "phản hồi 24–48 giờ" khiến người đọc hiểu là cam kết của Bluebolt, mâu thuẫn chính sách hiện hành 02 tháng (D-25); hai mốc số → câu trung tính không số. "bóng đá trách nhiệm" → "đá bóng trách nhiệm".',
    'Gỡ ảnh đầu bài (ảnh ghép nhà máy lọc dầu + kỹ sư, lệch art direction).',
  ],
} as const satisfies ArticleContent;
