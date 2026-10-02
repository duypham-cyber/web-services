import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { absoluteUrl, INDEXABLE_ROUTES } from '@/lib/routes';
import { isIndexable, isTranslated, lastModified } from '@/lib/seo';

/**
 * sitemap.xml (AC-SEO-5): chỉ URL indexable trả 200 (lib/routes.ts + content/seo.ts), cả VI và EN.
 * - lastmod = ngày sửa NỘI DUNG (content/seo.ts updatedAt, bài viết: content/articles/<key>.ts updatedAt), không phải giờ build.
 * - xhtml:link alternate vi/en/x-default (→ VI) chỉ khi cả hai bản đều là bản dịch thật.
 * Route tĩnh: cache lúc build (không dùng API request-time).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const route of INDEXABLE_ROUTES) {
    if (!isIndexable(route.key)) continue;
    const both = locales.every((l) => isTranslated(route.key, l));
    for (const locale of locales) {
      if (!isTranslated(route.key, locale)) continue;
      entries.push({
        url: absoluteUrl(route.paths[locale]),
        lastModified: lastModified(route.key),
        ...(both
          ? {
              alternates: {
                languages: {
                  vi: absoluteUrl(route.paths.vi),
                  en: absoluteUrl(route.paths.en),
                  'x-default': absoluteUrl(route.paths.vi),
                },
              },
            }
          : {}),
      });
    }
  }
  return entries;
}
