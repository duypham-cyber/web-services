import type { ServiceKey } from './services';
import { site } from './site';

/**
 * Metadata SEO cho MỌI route VI/EN (agent nội dung & SEO, docs/04 NFR-SEO-02, contracts/site-shell-p0.md AC-SEO-1…5).
 * Trang gọi `buildMetadata({ routeKey, locale })` (lib/seo.ts) — mục ở đây là NGUỒN DUY NHẤT của <title>,
 * meta description, nhãn breadcrumb và lastmod của sitemap. Bài viết /kien-thuc/* lấy từ content/articles/<key>.ts.
 *
 * Luật (tests/seo/seo-content.spec.ts kiểm):
 *  - title ≤ 60 ký tự, sentence case, đã gồm " | Bluebolt Services" nếu vừa; không trùng giữa các URL.
 *  - description 70–155 ký tự, không trùng; KHÔNG câu khẳng định chưa duyệt (34 tỉnh, 24/7, thời hạn bảo hành,
 *    chuẩn hãng, E-KYC...) và KHÔNG số liệu ngoài content/stats.ts; không phụ thuộc phương án hero.
 *  - Bản EN không có chữ tiếng Việt có dấu.
 *  - updatedAt = ngày sửa NỘI DUNG trang (YYYY-MM-DD), không phải ngày build. Agent sửa nội dung trang nào thì
 *    báo agent SEO (hoặc sửa dòng updatedAt tương ứng) để sitemap có lastmod thật.
 *  - translated: trang chưa có bản dịch thật thì đặt { en: false } → không hreflang, không vào sitemap EN.
 *  - index: false → noindex + bỏ khỏi sitemap (vd trang pháp lý chưa được pháp chế duyệt, AC-LEGAL-1).
 */
export type LocalizedText = { readonly vi: string; readonly en: string };

export type SeoEntry = {
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  /** Nhãn ngắn cho breadcrumb (hiển thị + JSON-LD BreadcrumbList). */
  readonly label: LocalizedText;
  readonly updatedAt: `${number}-${number}-${number}`;
  readonly translated?: { readonly vi: boolean; readonly en: boolean };
  readonly index?: boolean;
};

/** Khóa route tĩnh (lib/routes.ts) + route dịch vụ. Route bài viết "knowledge.<key>" lấy từ content/articles. */
type StaticSeoKey =
  | 'home'
  | 'solutions'
  | 'solutions.brands'
  | 'solutions.retail'
  | 'services'
  | `services.${ServiceKey}`
  | 'pricing'
  | 'network'
  | 'partners'
  | 'support'
  | 'about'
  | 'knowledge'
  | 'contact'
  | 'legal.privacy'
  | 'legal.terms'
  | 'legal.warranty'
  | 'dev.ui'
  | 'dev.routes'
  | 'dev.hero-map';

const CONTENT_DATE = '2026-10-02';

export const SEO_PAGES = {
  home: {
    title: {
      vi: 'Bluebolt Services: lắp đặt điện máy cho hãng và sàn TMĐT',
      en: 'Bluebolt Services: appliance installation for brands',
    },
    description: {
      vi: 'Bluebolt Services nhận đơn lắp đặt, bảo trì điều hòa và điện máy từ hãng, sàn TMĐT và chuỗi bán lẻ: điều phối thợ, nghiệm thu bằng ảnh, đối soát từng đơn.',
      en: 'Bluebolt Services takes air conditioner and appliance installation jobs from brands, marketplaces and retailers: dispatch, photo sign-off, reconciliation.',
    },
    label: { vi: 'Trang chủ', en: 'Home' },
    updatedAt: CONTENT_DATE,
  },
  solutions: {
    title: {
      vi: 'Giải pháp lắp đặt cho hãng và sàn TMĐT | Bluebolt Services',
      en: 'Installation solutions for brands | Bluebolt Services',
    },
    description: {
      vi: 'So sánh ba cách triển khai lắp đặt điện máy cho hãng và sàn TMĐT: tự quản đội thợ, thuê đơn vị địa phương hoặc dùng mạng lưới thợ của Bluebolt.',
      en: 'Compare three ways to deliver appliance installation for brands and marketplaces: your own crews, local contractors or the Bluebolt technician network.',
    },
    label: { vi: 'Giải pháp', en: 'Solutions' },
    updatedAt: CONTENT_DATE,
  },
  'solutions.brands': {
    title: {
      vi: 'Lắp đặt cho hãng điện máy, điện lạnh | Bluebolt Services',
      en: 'Installation for appliance brands | Bluebolt Services',
    },
    description: {
      vi: 'Giải pháp cho hãng điện máy, điện lạnh: nhận đơn lắp đặt, điều phối thợ theo khu vực, nghiệm thu bằng ảnh và báo cáo đối soát theo từng đơn.',
      en: 'For appliance and air conditioner brands: installation order intake, technician dispatch by area, photo sign-off and per-order reconciliation reports.',
    },
    label: { vi: 'Hãng điện máy', en: 'Appliance brands' },
    updatedAt: CONTENT_DATE,
  },
  'solutions.retail': {
    title: {
      vi: 'Lắp đặt sau bán cho sàn TMĐT, bán lẻ | Bluebolt Services',
      en: 'Installation for marketplaces & retail | Bluebolt Services',
    },
    description: {
      vi: 'Tích hợp dịch vụ lắp đặt sau bán hàng vào luồng đơn của sàn TMĐT và chuỗi bán lẻ, trạng thái từng đơn được trả về hệ thống của bạn.',
      en: 'Add post-purchase installation to your marketplace or retail order flow, with the status of every job sent back to your own system.',
    },
    label: { vi: 'Sàn TMĐT và bán lẻ', en: 'Marketplaces and retail' },
    updatedAt: CONTENT_DATE,
  },
  services: {
    title: {
      vi: 'Dịch vụ lắp đặt và bảo trì điện máy | Bluebolt Services',
      en: 'Installation and maintenance services | Bluebolt Services',
    },
    description: {
      vi: 'Bốn nhóm dịch vụ của Bluebolt Services: lắp đặt điều hòa, lắp đặt điện máy, bảo trì định kỳ cho chuỗi và lắp đặt robot hút bụi, nhà thông minh.',
      en: 'Four Bluebolt Services groups: air conditioner installation, appliance installation, scheduled maintenance for chains, and robot vacuum setup.',
    },
    label: { vi: 'Dịch vụ', en: 'Services' },
    updatedAt: CONTENT_DATE,
  },
  'services.lap-dat-dieu-hoa': {
    title: {
      vi: 'Lắp đặt điều hòa treo tường, âm trần | Bluebolt Services',
      en: 'Air conditioner installation | Bluebolt Services',
    },
    description: {
      vi: 'Lắp đặt điều hòa treo tường, âm trần cho đơn của hãng và sàn TMĐT: phạm vi công việc, vật tư tham khảo, quy trình nghiệm thu và bảo hành.',
      en: 'Wall-mounted and ceiling air conditioner installation for brand and marketplace orders: scope of work, reference materials, sign-off and warranty.',
    },
    label: { vi: 'Lắp đặt điều hòa', en: 'Air conditioner installation' },
    updatedAt: CONTENT_DATE,
  },
  'services.lap-dat-dien-may': {
    title: {
      vi: 'Lắp đặt máy giặt, tủ lạnh, tivi | Bluebolt Services',
      en: 'Appliance installation | Bluebolt Services',
    },
    description: {
      vi: 'Lắp đặt máy giặt, tủ lạnh, máy sấy, bình nóng lạnh, tivi treo tường, bếp từ và máy lọc nước cho đơn của hãng và sàn TMĐT.',
      en: 'Installation of washing machines, fridges, dryers, water heaters, wall-mounted TVs, induction hobs and water purifiers for brand and marketplace orders.',
    },
    label: { vi: 'Lắp đặt điện máy', en: 'Appliance installation' },
    updatedAt: CONTENT_DATE,
  },
  'services.bao-tri-dinh-ky': {
    title: {
      vi: 'Bảo trì điện máy định kỳ cho chuỗi | Bluebolt Services',
      en: 'Scheduled appliance maintenance | Bluebolt Services',
    },
    description: {
      vi: 'Bảo trì định kỳ điều hòa và điện máy cho chuỗi cửa hàng, văn phòng: lịch kiểm tra, vệ sinh, phát hiện sớm hư hỏng để thiết bị chạy ổn định.',
      en: 'Scheduled maintenance of air conditioners and appliances for store chains and offices: planned inspections, cleaning and early fault detection.',
    },
    label: { vi: 'Bảo trì định kỳ', en: 'Scheduled maintenance' },
    updatedAt: CONTENT_DATE,
  },
  'services.lap-dat-robot-hut-bui': {
    title: {
      vi: 'Lắp đặt robot hút bụi, smart home | Bluebolt Services',
      en: 'Robot vacuum and smart home setup | Bluebolt Services',
    },
    description: {
      vi: 'Lắp đặt, cài đặt và hướng dẫn sử dụng robot hút bụi, thiết bị nhà thông minh cho khách hàng của hãng và sàn TMĐT.',
      en: 'Installation, configuration and handover of robot vacuums and smart home devices for customers of brands and online marketplaces.',
    },
    label: { vi: 'Lắp đặt robot hút bụi', en: 'Robot vacuum installation' },
    updatedAt: CONTENT_DATE,
  },
  pricing: {
    title: {
      vi: 'Bảng giá vật tư lắp đặt tham khảo | Bluebolt Services',
      en: 'Installation materials price guide | Bluebolt Services',
    },
    description: {
      vi: 'Khung giá vật tư lắp đặt tham khảo do thợ thu tại chỗ, kèm thông tin giá theo hợp đồng dành cho hãng, sàn TMĐT và chuỗi bán lẻ.',
      en: 'Reference prices for installation materials that technicians collect on site, plus how contract pricing works for brands and retailers.',
    },
    label: { vi: 'Bảng giá', en: 'Pricing' },
    updatedAt: CONTENT_DATE,
  },
  network: {
    title: {
      vi: 'Mạng lưới thợ lắp đặt theo tỉnh | Bluebolt Services',
      en: 'Technician network by province | Bluebolt Services',
    },
    description: {
      vi: 'Bản đồ và bảng tỉnh, thành của mạng lưới thợ lắp đặt Bluebolt, ba vùng điều phối và cách triển khai lắp đặt tại tỉnh của bạn.',
      en: 'The Bluebolt installation technician network on a map and a province table, our three dispatch regions and how to launch in your province.',
    },
    label: { vi: 'Mạng lưới', en: 'Network' },
    updatedAt: CONTENT_DATE,
  },
  partners: {
    title: {
      vi: 'Đăng ký làm đối tác thợ lắp đặt | Bluebolt Services',
      en: 'Become a technician partner | Bluebolt Services',
    },
    description: {
      vi: 'Trở thành đối tác thợ của Bluebolt Services: cách nhận đơn, cách nhận tiền công, lộ trình gia nhập, tiêu chuẩn thợ và việc đang tuyển.',
      en: 'Join Bluebolt Services as a technician partner: how jobs are assigned, how you get paid, the onboarding steps, our standards and open positions.',
    },
    label: { vi: 'Đối tác thợ', en: 'Technician partners' },
    updatedAt: CONTENT_DATE,
  },
  support: {
    title: {
      vi: 'Hỗ trợ khách hàng sau lắp đặt | Bluebolt Services',
      en: 'Customer support after installation | Bluebolt Services',
    },
    description: {
      vi: 'Dành cho khách đã được Bluebolt lắp đặt: kênh liên hệ hỗ trợ, cách đăng ký bảo hành dịch vụ lắp đặt và lưu ý khi thanh toán cho thợ.',
      en: 'For customers whose appliance Bluebolt installed: how to reach support, how to register the installation warranty and what to know about paying.',
    },
    label: { vi: 'Hỗ trợ khách hàng', en: 'Customer support' },
    updatedAt: CONTENT_DATE,
  },
  about: {
    title: {
      vi: 'Về Bluebolt Services, Công nghệ Tia Chớp Xanh',
      en: 'About us | Bluebolt Services',
    },
    description: {
      vi: 'Bluebolt Services (Công ty Cổ phần Công nghệ Tia Chớp Xanh) kết nối hãng điện máy, sàn TMĐT và chuỗi bán lẻ với thợ lắp đặt. Sứ mệnh và pháp nhân.',
      en: 'Bluebolt Services connects appliance brands, marketplaces and retail chains with installation technicians: our mission, approach and company details.',
    },
    label: { vi: 'Về chúng tôi', en: 'About us' },
    updatedAt: CONTENT_DATE,
  },
  knowledge: {
    title: {
      vi: 'Kiến thức lắp đặt và vận hành điện máy | Bluebolt Services',
      en: 'Installation and HVAC knowledge | Bluebolt Services',
    },
    description: {
      vi: 'Hướng dẫn lắp đặt máy lạnh, máy giặt, kiến thức kỹ thuật điện lạnh và kinh nghiệm vận hành lắp đặt cho doanh nghiệp từ Bluebolt Services.',
      en: 'Air conditioner and washing machine installation guides, HVAC know-how and insights on running installation operations, from Bluebolt Services.',
    },
    label: { vi: 'Kiến thức', en: 'Knowledge' },
    updatedAt: CONTENT_DATE,
  },
  contact: {
    title: {
      vi: 'Liên hệ kinh doanh, tuyển thợ, CSKH | Bluebolt Services',
      en: 'Contact us | Bluebolt Services',
    },
    description: {
      vi: `Liên hệ Bluebolt Services theo bộ phận: kinh doanh cho doanh nghiệp, tuyển thợ, chăm sóc khách hàng. Hotline ${site.hotline.display.vi}, văn phòng TP. Hồ Chí Minh.`,
      en: `Contact Bluebolt Services by team: business sales, technician recruitment or customer care. Hotline ${site.hotline.display.en}, office in Ho Chi Minh City.`,
    },
    label: { vi: 'Liên hệ', en: 'Contact' },
    updatedAt: CONTENT_DATE,
  },
  'legal.privacy': {
    title: { vi: 'Chính sách bảo mật | Bluebolt Services', en: 'Privacy policy | Bluebolt Services' },
    description: {
      vi: 'Cách Bluebolt Services thu thập, sử dụng và bảo vệ dữ liệu cá nhân của khách hàng, đối tác thợ và người dùng website lapdattoanquoc.vn.',
      en: 'How Bluebolt Services collects, uses and protects the personal data of customers, technician partners and visitors to lapdattoanquoc.vn.',
    },
    label: { vi: 'Chính sách bảo mật', en: 'Privacy policy' },
    updatedAt: CONTENT_DATE,
  },
  'legal.terms': {
    title: { vi: 'Điều khoản sử dụng | Bluebolt Services', en: 'Terms of use | Bluebolt Services' },
    description: {
      vi: 'Điều khoản sử dụng website lapdattoanquoc.vn của Bluebolt Services: phạm vi dịch vụ, quyền và trách nhiệm của người dùng và của công ty.',
      en: 'Terms of use for lapdattoanquoc.vn, the Bluebolt Services website: the scope of the services and the rights and duties of users and the company.',
    },
    label: { vi: 'Điều khoản sử dụng', en: 'Terms of use' },
    updatedAt: CONTENT_DATE,
  },
  'legal.warranty': {
    title: {
      vi: 'Chính sách bảo hành lắp đặt | Bluebolt Services',
      en: 'Installation warranty policy | Bluebolt Services',
    },
    description: {
      vi: 'Phạm vi, cách đăng ký và điều kiện bảo hành dịch vụ lắp đặt của Bluebolt Services, cùng quy định áp dụng cho thợ đối tác và hãng.',
      en: 'Scope, registration and conditions of the Bluebolt Services installation warranty, together with the rules for partner technicians and brands.',
    },
    label: { vi: 'Chính sách bảo hành', en: 'Warranty policy' },
    updatedAt: CONTENT_DATE,
  },
  'dev.ui': {
    title: { vi: 'UI kit nội bộ | Bluebolt Services', en: 'Internal UI kit | Bluebolt Services' },
    description: {
      vi: 'Trang nội bộ cho đội phát triển: toàn bộ primitive giao diện, màu, chữ và trạng thái của website Bluebolt Services. Không lập chỉ mục.',
      en: 'Internal page for the development team showing every interface primitive, colour, type style and state of the Bluebolt Services website.',
    },
    label: { vi: 'UI kit', en: 'UI kit' },
    updatedAt: CONTENT_DATE,
    index: false,
  },
  'dev.routes': {
    title: { vi: 'Danh mục route nội bộ | Bluebolt Services', en: 'Internal route list | Bluebolt Services' },
    description: {
      vi: 'Trang nội bộ liệt kê mọi route VI và EN của website Bluebolt Services, khu vực phụ trách và mức ưu tiên. Chỉ dùng khi phát triển.',
      en: 'Internal page listing every Vietnamese and English route of the Bluebolt Services website with its owner and priority. For development only.',
    },
    label: { vi: 'Danh mục route', en: 'Route list' },
    updatedAt: CONTENT_DATE,
    index: false,
  },
  'dev.hero-map': {
    title: { vi: 'Cảnh bản đồ hero nội bộ | Bluebolt Services', en: 'Internal hero map scene | Bluebolt Services' },
    description: {
      vi: 'Trang nội bộ để soát cảnh bản đồ 3D của trang chủ theo tiến độ cuộn và từng tầng thiết bị. Chỉ dùng khi phát triển, không lập chỉ mục.',
      en: 'Internal page for checking the 3D home page map scene by scroll progress and device tier. For development only and never indexed.',
    },
    label: { vi: 'Cảnh bản đồ hero', en: 'Hero map scene' },
    updatedAt: '2026-10-03',
    index: false,
  },
} as const satisfies Record<StaticSeoKey, SeoEntry>;

export type SeoPageKey = keyof typeof SEO_PAGES;

/**
 * Ảnh Open Graph mặc định 1200×630 (scripts/gen-og-images.mjs, không KHANG, không claim).
 * Khi agent phim xuất poster OG vào public/film/ (og*.jpg|png hoặc poster*.jpg|png), lib/seo.ts tự dùng poster đó.
 * KHÔNG dùng /images/og-cover.jpg của site cũ: đó là banner khóa học của đơn vị khác (hotline khác) → 301 sang ảnh này.
 */
export const DEFAULT_OG_IMAGE = {
  vi: {
    src: '/images/og/bluebolt-services-vi-v2.jpg',
    width: 1200,
    height: 630,
    alt: 'Bluebolt Services — lắp đặt điện máy cho hãng và sàn thương mại điện tử',
  },
  en: {
    src: '/images/og/bluebolt-services-en-v2.jpg',
    width: 1200,
    height: 630,
    alt: 'Bluebolt Services — appliance installation for brands and marketplaces',
  },
} as const;

/** og:locale theo ngôn ngữ (AC-SEO-4). */
export const OG_LOCALE = { vi: 'vi_VN', en: 'en_US' } as const;

/**
 * Liên hệ theo bộ phận cho JSON-LD Organization.contactPoint (AC-LD-1). Hiện ba bộ phận dùng chung hotline và email
 * đã công bố ở content/site.ts. Có số/email riêng từng bộ phận (đã duyệt) thì sửa ở đây.
 */
export const CONTACT_POINTS = [
  { contactType: 'sales', telephone: site.hotline.tel, email: site.email },
  { contactType: 'customer support', telephone: site.hotline.tel, email: site.email },
  { contactType: 'technician recruitment', telephone: site.hotline.tel, email: site.email },
] as const;
