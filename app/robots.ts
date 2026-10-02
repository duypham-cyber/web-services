import type { MetadataRoute } from 'next';
import { isStaging } from '@/lib/env';
import { SITE_URL } from '@/lib/routes';

/**
 * robots.txt (AC-SEO-5): chuẩn, KHÔNG có dòng "Host:" (site cũ có). Cờ đọc LÚC BUILD (route tĩnh):
 *   STAGING=1 scripts/safe-build.sh → "Disallow: /" (kèm X-Robots-Tag noindex ở next.config.ts và openresty).
 */
export default function robots(): MetadataRoute.Robots {
  if (isStaging()) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
