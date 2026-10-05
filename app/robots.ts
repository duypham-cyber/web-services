import type { MetadataRoute } from 'next';
import { isStaging } from '@/lib/env';
import { SITE_URL } from '@/lib/routes';

/**
 * robots.txt (AC-SEO-5): chuẩn, KHÔNG có dòng "Host:" (site cũ có). Cờ đọc LÚC BUILD (route tĩnh):
 *   STAGING=1 scripts/safe-build.sh → cho crawl ("Allow: /") nhưng KHÔNG có Sitemap; việc chặn index do X-Robots-Tag noindex
 *   (next.config.ts + proxy/openresty) đảm nhiệm. Lý do (D-30): "Disallow: /" làm Google không đọc được noindex (URL vẫn có thể
 *   lên kết quả tìm kiếm khi có link trỏ tới) và chặn trình xem trước link của Facebook/Telegram trên bản trưng bày.
 */
export default function robots(): MetadataRoute.Robots {
  if (isStaging()) {
    return { rules: { userAgent: '*', allow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
