import type { Article } from './schemas';

/**
 * Bài viết /kien-thuc/[slug] (docs/03 mục 10.3): 8 bài cũ → 6 bài (gộp 2 bài robot, bài AI trả 410 — giả định Q10).
 * Slug VI giữ nguyên slug cũ; slug EN mới. Tiêu đề (H1) chuyển sang sentence case (docs/03 mục 11.5).
 * File này là REGISTRY (lib/routes.ts đọc để sinh route) — giữ đúng shape `Article` của content/schemas.ts.
 * Thân bài, ngày đăng/sửa, mô tả, ảnh: content/articles/<key>.ts, gom ở content/articles/all.ts.
 * Chủ sở hữu: agent nội dung & SEO.
 */
export const articles = [
  {
    key: 'lap-dat-may-lanh-dung-cach-7-buoc',
    slug: { vi: 'lap-dat-may-lanh-dung-cach-7-buoc', en: 'how-to-install-an-air-conditioner-in-7-steps' },
    title: {
      vi: 'Tổng hợp kinh nghiệm lắp đặt máy lạnh mới mua đúng cách',
      en: 'A complete guide to installing a new air conditioner the right way',
    },
    category: 'installation-guide',
    legacyPaths: ['/news/lap-dat-may-lanh-dung-cach-7-buoc', '/en/news/lap-dat-may-lanh-dung-cach-7-buoc'],
    status: 'migrated',
  },
  {
    key: '10-nguyen-nhan-may-lanh-khong-lanh',
    slug: { vi: '10-nguyen-nhan-may-lanh-khong-lanh', en: '10-reasons-your-air-conditioner-is-not-cooling' },
    title: {
      vi: '10 nguyên nhân và cách khắc phục máy lạnh không lạnh',
      en: '10 causes and fixes for an air conditioner that will not cool',
    },
    category: 'installation-guide',
    legacyPaths: ['/news/10-nguyen-nhan-may-lanh-khong-lanh', '/en/news/10-nguyen-nhan-may-lanh-khong-lanh'],
    status: 'migrated',
  },
  {
    key: 'rui-ro-lap-dat-may-giat-khong-dung-cach',
    slug: { vi: 'rui-ro-lap-dat-may-giat-khong-dung-cach', en: 'risks-of-improper-washing-machine-installation' },
    title: {
      vi: 'Những rủi ro khi lắp đặt máy giặt không đúng cách',
      en: 'The risks of improper washing machine installation',
    },
    category: 'installation-guide',
    legacyPaths: ['/news/rui-ro-lap-dat-may-giat-khong-dung-cach', '/en/news/rui-ro-lap-dat-may-giat-khong-dung-cach'],
    status: 'migrated',
  },
  {
    key: 'chuyen-doi-so-trong-lap-dat-toan-quoc',
    slug: { vi: 'chuyen-doi-so-trong-lap-dat-toan-quoc', en: 'digital-transformation-in-nationwide-installation' },
    title: {
      vi: 'Lắp đặt toàn quốc áp dụng chuyển đổi số như thế nào?',
      en: 'How nationwide installation services are embracing digital transformation',
    },
    category: 'b2b',
    legacyPaths: ['/news/chuyen-doi-so-trong-lap-dat-toan-quoc', '/en/news/chuyen-doi-so-trong-lap-dat-toan-quoc'],
    status: 'migrated',
  },
  {
    key: 'tuong-lai-nganh-dien-lanh-2026',
    slug: { vi: 'tuong-lai-nganh-dien-lanh-2026', en: 'hvac-industry-outlook-2026' },
    title: {
      vi: 'Tương lai ngành điện lạnh 2026: dịch vụ sẽ quyết định cuộc chơi',
      en: 'The HVAC industry in 2026: service will decide the game',
    },
    category: 'technical-knowledge',
    legacyPaths: ['/news/tuong-lai-nganh-dien-lanh-2026', '/en/news/tuong-lai-nganh-dien-lanh-2026'],
    status: 'migrated',
  },
  {
    key: 'robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai',
    slug: { vi: 'robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai', en: 'home-robots-and-automation-trends' },
    title: {
      vi: 'Robot và tự động hóa: xu hướng mới trong gia đình hiện đại',
      en: 'Robots and automation: a new trend in the modern home',
    },
    category: 'technical-knowledge',
    legacyPaths: [
      '/news/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai',
      '/news/robot-va-tu-dong-hoa-gia-dinh',
      '/en/news/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai',
      '/en/news/robot-va-tu-dong-hoa-gia-dinh',
    ],
    status: 'migrated',
  },
] as const satisfies readonly Article[];

export type ArticleKey = (typeof articles)[number]['key'];
