import type { RedirectRow } from './schemas';

/**
 * Bảng URL cũ → mới: 34 URL trong sitemap site cũ (docs/03 mục 10.3, nguồn research/raw/urls.txt).
 * Chủ sở hữu: agent nội dung & SEO (bổ sung URL từ Search Console + access log 90 ngày, docs/04 mục 2.7).
 *
 * Ai đọc bảng này:
 *   - next.config.ts → redirects(): CHỈ dòng kind "redirect", mã 301 (statusCode: 301; KHÔNG permanent: true vì ra 308).
 *   - proxy.ts       → trả 410 cho dòng kind "gone" (không đưa vào redirects()).
 *   - Sau này: scripts/gen-openresty-map.mjs sinh map openresty 1 hop (http→https, www→apex, "/" cuối) — docs/04 mục 2.7.
 *
 * Lưu ý: ở tầng Next, biến thể có "/" cuối (vd /news/) đi 2 bước (308 bỏ "/" rồi 301). Production xử lý 1 bước ở openresty.
 * File này KHÔNG import alias "@/..." và KHÔNG import zod (next.config.ts đọc trực tiếp). Validate ở content/validate.ts.
 */
export const legacyRedirects: readonly RedirectRow[] = [
  { n: 1, from: '/', to: '/', kind: 'keep' },
  { n: 2, from: '/intro', to: '/ve-chung-toi', kind: 'redirect' },
  { n: 3, from: '/services', to: '/dich-vu', kind: 'redirect' },
  {
    n: 4,
    from: '/prices',
    to: '/bang-gia',
    kind: 'redirect',
    note: 'Chính sách 4 phần trong accordion tách sang /chinh-sach-bao-hanh và các trang pháp lý',
  },
  { n: 5, from: '/news', to: '/kien-thuc', kind: 'redirect' },
  {
    n: 6,
    from: '/requirement',
    to: '/doi-tac-tho',
    kind: 'redirect',
    note: 'Danh sách việc trở thành section #viec-dang-tuyen',
  },
  { n: 7, from: '/worker-map', to: '/doi-tac-tho', kind: 'redirect', note: 'Title cũ "Tuyển thợ & tiêu chuẩn kỹ thuật viên"' },
  {
    n: 8,
    from: '/system-map',
    to: '/mang-luoi',
    kind: 'redirect',
    note: 'Title cũ "Hệ thống thợ kỹ thuật toàn quốc"; phần tiêu chuẩn chuyển sang /doi-tac-tho',
  },
  { n: 9, from: '/contact', to: '/lien-he', kind: 'redirect' },
  {
    n: 10,
    from: '/news/lap-dat-may-lanh-dung-cach-7-buoc',
    to: '/kien-thuc/lap-dat-may-lanh-dung-cach-7-buoc',
    kind: 'redirect',
    note: 'Giữ slug; kiểm Search Console trước (docs/03 mục 10.2)',
  },
  {
    n: 11,
    from: '/news/10-nguyen-nhan-may-lanh-khong-lanh',
    to: '/kien-thuc/10-nguyen-nhan-may-lanh-khong-lanh',
    kind: 'redirect',
  },
  {
    n: 12,
    from: '/news/rui-ro-lap-dat-may-giat-khong-dung-cach',
    to: '/kien-thuc/rui-ro-lap-dat-may-giat-khong-dung-cach',
    kind: 'redirect',
  },
  {
    n: 13,
    from: '/news/chuyen-doi-so-trong-lap-dat-toan-quoc',
    to: '/kien-thuc/chuyen-doi-so-trong-lap-dat-toan-quoc',
    kind: 'redirect',
    note: 'Xếp lại vào nhóm B2B',
  },
  {
    n: 14,
    from: '/news/tuong-lai-nganh-dien-lanh-2026',
    to: '/kien-thuc/tuong-lai-nganh-dien-lanh-2026',
    kind: 'redirect',
  },
  {
    n: 15,
    from: '/news/robot-va-tu-dong-hoa-gia-dinh',
    to: '/kien-thuc/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai',
    kind: 'redirect',
    note: 'Gộp 2 bài robot đang tranh từ khóa (CRO-14)',
  },
  {
    n: 16,
    from: '/news/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai',
    to: '/kien-thuc/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai',
    kind: 'redirect',
    note: 'Bài giữ lại sau khi gộp',
  },
  {
    n: 17,
    from: '/news/ky-nguyen-ai-nhung-nganh-bi-anh-huong',
    to: null,
    kind: 'gone',
    note: 'Bài lạc đề. Giả định: gỡ (410). Chờ anh Duy quyết (docs/04 Q10). Không 301 về trang không liên quan (soft 404)',
  },
  { n: 18, from: '/en', to: '/en', kind: 'keep' },
  { n: 19, from: '/en/intro', to: '/en/about', kind: 'redirect' },
  { n: 20, from: '/en/services', to: '/en/services', kind: 'keep' },
  { n: 21, from: '/en/prices', to: '/en/pricing', kind: 'redirect' },
  { n: 22, from: '/en/news', to: '/en/knowledge', kind: 'redirect' },
  { n: 23, from: '/en/requirement', to: '/en/technician-partners', kind: 'redirect' },
  { n: 24, from: '/en/worker-map', to: '/en/technician-partners', kind: 'redirect' },
  { n: 25, from: '/en/system-map', to: '/en/network', kind: 'redirect' },
  { n: 26, from: '/en/contact', to: '/en/contact', kind: 'keep' },
  {
    n: 27,
    from: '/en/news/lap-dat-may-lanh-dung-cach-7-buoc',
    to: '/en/knowledge/how-to-install-an-air-conditioner-in-7-steps',
    kind: 'redirect',
    note: 'Slug EN mới',
  },
  {
    n: 28,
    from: '/en/news/10-nguyen-nhan-may-lanh-khong-lanh',
    to: '/en/knowledge/10-reasons-your-air-conditioner-is-not-cooling',
    kind: 'redirect',
  },
  {
    n: 29,
    from: '/en/news/rui-ro-lap-dat-may-giat-khong-dung-cach',
    to: '/en/knowledge/risks-of-improper-washing-machine-installation',
    kind: 'redirect',
  },
  {
    n: 30,
    from: '/en/news/chuyen-doi-so-trong-lap-dat-toan-quoc',
    to: '/en/knowledge/digital-transformation-in-nationwide-installation',
    kind: 'redirect',
  },
  {
    n: 31,
    from: '/en/news/tuong-lai-nganh-dien-lanh-2026',
    to: '/en/knowledge/hvac-industry-outlook-2026',
    kind: 'redirect',
  },
  {
    n: 32,
    from: '/en/news/robot-va-tu-dong-hoa-gia-dinh',
    to: '/en/knowledge/home-robots-and-automation-trends',
    kind: 'redirect',
    note: 'Gộp như dòng 15',
  },
  {
    n: 33,
    from: '/en/news/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai',
    to: '/en/knowledge/home-robots-and-automation-trends',
    kind: 'redirect',
  },
  {
    n: 34,
    from: '/en/news/ky-nguyen-ai-nhung-nganh-bi-anh-huong',
    to: null,
    kind: 'gone',
    note: 'Theo quyết định dòng 17 (giả định 410)',
  },
];

/** Dùng cho next.config.ts → redirects(). 301 một bước (không chuỗi). */
export function buildNextRedirects(): { source: string; destination: string; statusCode: 301 }[] {
  return legacyRedirects
    .filter((r) => r.kind === 'redirect' && r.to !== null)
    .map((r) => ({ source: r.from, destination: r.to as string, statusCode: 301 as const }));
}

/** Đường dẫn trả 410 Gone (proxy.ts). */
export const GONE_PATHS: ReadonlySet<string> = new Set(legacyRedirects.filter((r) => r.kind === 'gone').map((r) => r.from));
