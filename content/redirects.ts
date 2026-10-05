import type { RedirectRow } from './schemas';

/**
 * Bảng URL cũ → mới: 34 URL trong sitemap site cũ (docs/03 mục 10.3, nguồn research/raw/urls.txt).
 * Chủ sở hữu: agent nội dung & SEO (bổ sung URL từ Search Console + access log 90 ngày, docs/04 mục 2.7).
 *
 * Ai đọc bảng này:
 *   - next.config.ts → redirects(): CHỈ dòng kind "redirect", mã 301 (statusCode: 301; KHÔNG permanent: true vì ra 308).
 *   - app/images/[...asset]/route.ts → 301/410 cho ảnh og:image cũ (legacyAssets bên dưới).
 *   - proxy.ts       → trả 410 cho dòng kind "gone" (không đưa vào redirects()).
 *   - scripts/gen-openresty-map.mjs → deploy/openresty/lapdattoanquoc.conf (map 1 hop: http→https, www→apex, "/" cuối)
 *     + redirect-inventory.csv (docs/04 mục 2.7). Sửa bảng này xong phải chạy lại script (test SEO kiểm file đã cập nhật).
 *   - scripts/check-redirects.mjs → kiểm N/N dòng × biến thể trên BASE_URL bất kỳ (NFR-SEO-01).
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

/**
 * Ảnh cũ đang được dùng làm og:image (crawl 02/10/2026: og:image của 18 trang + 8 bài viết) — AC-301-3: phải trả 200
 * (giữ file ở public/ đúng đường dẫn) hoặc 301 sang ảnh mới, để preview Zalo/Facebook của link cũ không vỡ.
 * Ngoài 34 dòng sitemap ở trên (content/validate.ts kiểm đúng 34 dòng), nên tách thành bảng riêng.
 * kind "gone": ảnh của nội dung đã gỡ (bài AI) → 410. Ảnh KHANG (chưa rõ quyền) và bản đồ cũ → 301 sang ảnh mới (AC-301-3).
 * Tầng Next: app/images/[...asset]/route.ts (301/410); production: openresty xử lý trước (1 hop).
 */
export type LegacyAssetRow = {
  from: string;
  to: string | null;
  kind: 'keep' | 'redirect' | 'gone';
  note: string;
};

export const legacyAssets: readonly LegacyAssetRow[] = [
  {
    from: '/images/og-cover.jpg',
    to: '/images/og/bluebolt-services-vi-v2.jpg',
    kind: 'redirect',
    note: 'og:image cũ của 18 trang. Ảnh là banner khóa học "Đào tạo chuyển đổi số AI" của đơn vị khác, hotline khác → KHÔNG giữ; 301 sang ảnh OG mới',
  },
  {
    from: '/images/logo-bluebolt-services.svg',
    to: '/images/logo-bluebolt-services.svg',
    kind: 'keep',
    note: 'Logo site cũ, giữ nguyên đường dẫn (docs/DECISIONS.md D-15)',
  },
  {
    from: '/images/news/lap-dat-may-lanh-7-buoc.jpg',
    to: '/images/og/bluebolt-services-vi-v2.jpg',
    kind: 'redirect',
    note:
      'og:image bài lap-dat-may-lanh-dung-cach-7-buoc (VI + EN). Ảnh AI (dấu ✦ Gemini, thợ mặc áo in "BLUEBOLT" giả) → ' +
      'không phục vụ file cũ; 301 sang ảnh OG mặc định. Có ảnh thật từ buổi chụp thì đặt lại đúng đường dẫn này và đổi về "keep"',
  },
  {
    from: '/images/news/nguyen-nhan-may-lanh-hero.png',
    to: '/images/news/nguyen-nhan-may-lanh.png',
    kind: 'redirect',
    note: 'og:image bài 10-nguyen-nhan: ảnh dàn nóng có logo hãng trong bài về máy hỏng → không dùng; 301 sang infographic cùng bài',
  },
  {
    from: '/images/news/may-giat-hero.png',
    to: '/images/news/may-giat-hero.png',
    kind: 'keep',
    note:
      'og:image bài rui-ro-lap-dat-may-giat (VI + EN). Từ 02/10/2026 không còn là ảnh đầu bài (stock lệch art direction, ' +
      'docs/03 mục 11.4); giữ file để link cũ trả 200 (AC-301-3)',
  },
  {
    from: '/images/news-card5.jpg',
    to: '/images/news-card5.jpg',
    kind: 'keep',
    note: 'og:image bài chuyen-doi-so (VI + EN); file nén lại 1600px (bản cũ 9,3 MB), giữ tên',
  },
  {
    from: '/images/news/tuong-lai-nganh-dien-lanh-2026.avif',
    to: '/images/news/tuong-lai-nganh-dien-lanh-2026.avif',
    kind: 'keep',
    note:
      'og:image bài tuong-lai-nganh-dien-lanh-2026 (VI + EN). Từ 02/10/2026 không còn là ảnh đầu bài (ảnh ghép nhà máy lọc ' +
      'dầu, lệch art direction); giữ file để link cũ trả 200 (AC-301-3)',
  },
  {
    from: '/images/news/robot-gia-dinh.jpg',
    to: '/images/news/og/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai.jpg',
    kind: 'redirect',
    note: 'og:image bài robot-va-tu-dong-hoa (đã gộp). Ảnh stock "gia đình phương Tây + robot" (docs/03 mục 11.4) → 301 sang ảnh OG bài gộp',
  },
  {
    from: '/images/news/em-telco-tect-image-web-1024x690.jpg',
    to: '/images/news/og/robot-tu-dong-hoa-xu-huong-gia-dinh-hien-dai.jpg',
    kind: 'redirect',
    note: 'og:image bài robot-tu-dong-hoa: ảnh tháp viễn thông lạc đề, tên file của website khác → 301 sang ảnh OG bài gộp',
  },
  {
    from: '/images/news-card10.jpg',
    to: null,
    kind: 'gone',
    note: 'og:image bài AI (410). Ảnh stock "cô gái headset vs robot" (docs/03 mục 11.4)',
  },
  {
    from: '/images/khang-3d-poster.webp',
    to: '/images/og/bluebolt-services-vi-v2.jpg',
    kind: 'redirect',
    note:
      'Ảnh KHANG (quyền chưa xác nhận, D-03) — không phục vụ file cũ; 301 sang ảnh OG mặc định (không KHANG) vì AC-301-3 ' +
      'liệt kê đích danh ảnh này phải trả 200/301 (preview link cũ trên Zalo/Facebook không vỡ)',
  },
  {
    from: '/images/vn-map-workers.svg',
    to: '/data/vn34-map.svg',
    kind: 'redirect',
    note:
      'Bản đồ cũ (số thợ theo vùng chưa duyệt) → 301 sang bản đồ SVG mới 34 tỉnh có đủ QĐ. Hoàng Sa, QĐ. Trường Sa ' +
      '(scripts/make-map.mjs). AC-301-3 yêu cầu ảnh cũ trả 200/301, không 410 (đề xuất của agent bản đồ, 02/10/2026)',
  },
];

/** Dùng cho next.config.ts → redirects(). 301 một bước (không chuỗi). Chỉ URL trang (34 dòng sitemap). */
export function buildNextRedirects(): { source: string; destination: string; statusCode: 301 }[] {
  return legacyRedirects
    .filter((r) => r.kind === 'redirect' && r.to !== null)
    .map((r) => ({ source: r.from, destination: r.to as string, statusCode: 301 as const }));
}

/**
 * Ảnh og:image cũ cần 301/410 ở tầng Next (app/images/[...asset]/route.ts). Ảnh "keep" là file tĩnh trong public/,
 * không đi qua đây. Production: openresty xử lý trước (deploy/openresty/lapdattoanquoc.conf).
 */
export function findLegacyAsset(path: string): LegacyAssetRow | undefined {
  return legacyAssets.find((a) => a.from === path && a.kind !== 'keep');
}

/** Đường dẫn trang trả 410 Gone (proxy.ts). Ảnh "gone" không qua proxy (matcher bỏ file có dấu chấm) → route ảnh lo. */
export const GONE_PATHS: ReadonlySet<string> = new Set(legacyRedirects.filter((r) => r.kind === 'gone').map((r) => r.from));
