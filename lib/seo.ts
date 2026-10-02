import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';
import { absoluteUrl, getRoute, type RouteKey } from './routes';

type BuildMetadataInput = {
  routeKey: RouteKey;
  locale: Locale;
  title: string;
  description: string;
  /** true: dùng nguyên title, không ghép " | Bluebolt Services" (trang chủ). */
  absoluteTitle?: boolean;
};

/**
 * Metadata TỐI THIỂU cho mọi trang (docs/04 NFR-SEO-02). Agent nội dung & SEO sẽ hoàn thiện:
 * Open Graph/ảnh OG (noKhang), JSON-LD, sitemap.ts, robots.ts, chỉ phát hreflang cho cặp có bản dịch thật.
 *
 * - canonical: URL tuyệt đối https://lapdattoanquoc.vn/... của chính trang đang xem
 * - hreflang: vi, en và x-default → bản VI
 * - route không index (trang /dev/*) → robots noindex, nofollow
 */
export function buildMetadata({ routeKey, locale, title, description, absoluteTitle }: BuildMetadataInput): Metadata {
  const route = getRoute(routeKey);
  const canonical = absoluteUrl(route.paths[locale]);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      languages: {
        vi: absoluteUrl(route.paths.vi),
        en: absoluteUrl(route.paths.en),
        'x-default': absoluteUrl(route.paths.vi),
      },
    },
    ...(route.indexable ? {} : { robots: { index: false, follow: false } }),
  };
}
