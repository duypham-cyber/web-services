import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { articles } from '@/content/articles';
import { ARTICLE_CONTENT } from '@/content/articles/all';
import { DEFAULT_OG_IMAGE, OG_LOCALE, SEO_PAGES, type SeoEntry, type SeoPageKey } from '@/content/seo';
import { site } from '@/content/site';
import { locales, type AppPathname, type Locale } from '@/i18n/routing';
import { absoluteUrl, getRoute, type RouteKey } from './routes';

/**
 * SEO cho mọi trang (agent nội dung & SEO; docs/04 NFR-SEO-02, contracts/site-shell-p0.md AC-SEO-1…5).
 * CHỈ dùng ở server (generateMetadata, Server Component, app/sitemap.ts): file đọc public/film/ bằng node:fs.
 *
 *   export async function generateMetadata({ params }) {
 *     const locale = await resolveLocale(params);
 *     return buildMetadata({ routeKey: 'pricing', locale });
 *   }
 *
 * - title/description: content/seo.ts (route tĩnh, dịch vụ) hoặc content/articles/<key>.ts (bài viết) là NGUỒN DUY NHẤT.
 *   `title`/`description` truyền vào chỉ được dùng khi route chưa có mục SEO (route mới) — giữ chữ ký cũ để tương thích.
 * - canonical tuyệt đối https://lapdattoanquoc.vn/..., không "/" cuối (trang chủ VI = "https://lapdattoanquoc.vn/").
 * - hreflang vi, en, x-default → VI, CHỈ khi cả hai bản đều là bản dịch thật (SeoEntry.translated).
 * - Open Graph + Twitter: ảnh riêng của bài > poster phim (public/film/og*|poster*.jpg|png) > ảnh OG mặc định.
 * - robots noindex: route không index (lib/routes.ts) hoặc SeoEntry.index === false.
 */

type BuildMetadataInput = {
  routeKey: RouteKey;
  locale: Locale;
  /** Chỉ dùng khi route chưa có mục trong content/seo.ts (fallback). */
  title?: string;
  /** Chỉ dùng khi route chưa có mục trong content/seo.ts (fallback). */
  description?: string;
  /** Fallback title: true = dùng nguyên chuỗi, không ghép " | Bluebolt Services". */
  absoluteTitle?: boolean;
};

export type OgImage = { url: string; width?: number; height?: number; alt: string };

export type ResolvedSeo = {
  title: string;
  description: string;
  label: string;
  updatedAt: string;
  translated: Record<Locale, boolean>;
  index: boolean;
  /** Ảnh OG riêng (bài viết). */
  ogImage?: { src: string; width: number; height: number };
  /** Loại Open Graph. */
  type: 'website' | 'article';
  publishedAt?: string;
};

const BOTH: Record<Locale, boolean> = { vi: true, en: true };

/** Mục SEO đã giải quyết cho một route + ngôn ngữ, hoặc null nếu route chưa có mục. */
export function seoFor(routeKey: RouteKey, locale: Locale): ResolvedSeo | null {
  if (routeKey.startsWith('knowledge.')) {
    const key = routeKey.slice('knowledge.'.length) as keyof typeof ARTICLE_CONTENT;
    const article = ARTICLE_CONTENT[key];
    if (!article) return null;
    const registry = articles.find((a) => a.key === key);
    return {
      title: article.seoTitle[locale],
      description: article.description[locale],
      // Nhãn breadcrumb = tiêu đề bài (H1) trong registry content/articles.ts
      label: registry?.title[locale] ?? article.seoTitle[locale],
      updatedAt: article.updatedAt,
      translated: BOTH,
      index: true,
      ogImage: article.ogImage ?? undefined,
      type: 'article',
      publishedAt: article.publishedAt,
    };
  }
  const entry: SeoEntry | undefined = (SEO_PAGES as Record<string, SeoEntry>)[routeKey as SeoPageKey];
  if (!entry) return null;
  return {
    title: entry.title[locale],
    description: entry.description[locale],
    label: entry.label[locale],
    updatedAt: entry.updatedAt,
    translated: { ...BOTH, ...entry.translated },
    index: entry.index !== false,
    type: 'website',
  };
}

/** Route có bản dịch thật ở ngôn ngữ này không (hreflang, sitemap). */
export function isTranslated(routeKey: RouteKey, locale: Locale): boolean {
  return seoFor(routeKey, locale)?.translated[locale] ?? true;
}

/** Route có được index không (lib/routes.ts PAGE_META.indexable + content/seo.ts index). */
export function isIndexable(routeKey: RouteKey): boolean {
  const route = getRoute(routeKey);
  if (!route.indexable) return false;
  return seoFor(routeKey, 'vi')?.index ?? true;
}

/** lastmod thật của route (YYYY-MM-DD) — ngày sửa nội dung, không phải ngày build. */
export function lastModified(routeKey: RouteKey): string | undefined {
  return seoFor(routeKey, 'vi')?.updatedAt;
}

// ---------------------------------------------------------------------------------------------
// Ảnh Open Graph
// ---------------------------------------------------------------------------------------------

let filmPosterCache: string | null | undefined;

/**
 * Poster phim làm ảnh OG mặc định khi agent phim đã xuất (public/film/og*.jpg|png ưu tiên, rồi poster*.jpg|png).
 * Chỉ JPG/PNG (Facebook/Zalo chưa đọc AVIF/WebP ổn định). Đọc một lần mỗi tiến trình (lúc build).
 */
export function filmPosterOg(): string | null {
  if (filmPosterCache !== undefined) return filmPosterCache;
  try {
    const dir = path.join(process.cwd(), 'public', 'film');
    const files = fs.readdirSync(dir).filter((f) => /^(og|poster)[\w.-]*\.(jpe?g|png)$/i.test(f));
    files.sort((a, b) => Number(b.startsWith('og')) - Number(a.startsWith('og')) || a.localeCompare(b));
    filmPosterCache = files[0] ? `/film/${files[0]}` : null;
  } catch {
    filmPosterCache = null;
  }
  return filmPosterCache;
}

export function ogImageFor(routeKey: RouteKey, locale: Locale): OgImage {
  const seo = seoFor(routeKey, locale);
  const fallback = DEFAULT_OG_IMAGE[locale];
  if (seo?.ogImage) {
    return { url: absoluteUrl(seo.ogImage.src), width: seo.ogImage.width, height: seo.ogImage.height, alt: seo.title };
  }
  const poster = filmPosterOg();
  if (poster) return { url: absoluteUrl(poster), alt: fallback.alt };
  return { url: absoluteUrl(fallback.src), width: fallback.width, height: fallback.height, alt: fallback.alt };
}

// ---------------------------------------------------------------------------------------------
// Breadcrumb (hiển thị + JSON-LD BreadcrumbList)
// ---------------------------------------------------------------------------------------------

export type Crumb = {
  key: RouteKey;
  name: string;
  /** URL tương đối đã bản địa hóa, vd "/en/knowledge". */
  path: string;
  url: string;
  /** Đường dẫn nội bộ (khóa routing.pathnames) + params — dùng cho <Link> của next-intl. */
  href: AppPathname | { pathname: AppPathname; params: { slug: string } };
};

/** Route cha theo cây thông tin (docs/03 mục 10.1). Không có hub pháp lý → về trang chủ. */
function parentOf(routeKey: RouteKey): RouteKey | null {
  if (routeKey === 'home') return null;
  if (routeKey.startsWith('solutions.')) return 'solutions';
  if (routeKey.startsWith('services.')) return 'services';
  if (routeKey.startsWith('knowledge.')) return 'knowledge';
  return 'home';
}

/** Chuỗi breadcrumb từ trang chủ tới route hiện tại (gồm cả route hiện tại). */
export function breadcrumbTrail(routeKey: RouteKey, locale: Locale): Crumb[] {
  const chain: RouteKey[] = [];
  for (let key: RouteKey | null = routeKey; key; key = parentOf(key)) chain.unshift(key);
  return chain.map((key) => {
    const route = getRoute(key);
    const p = route.paths[locale];
    const href = route.params ? { pathname: route.pathname, params: route.params[locale] } : route.pathname;
    return { key, name: seoFor(key, locale)?.label ?? key, path: p, url: absoluteUrl(p), href };
  });
}

// ---------------------------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------------------------

export function buildMetadata({ routeKey, locale, title, description, absoluteTitle }: BuildMetadataInput): Metadata {
  const route = getRoute(routeKey);
  const seo = seoFor(routeKey, locale);
  const canonical = absoluteUrl(route.paths[locale]);
  const finalTitle = seo?.title ?? (title ? (absoluteTitle ? title : `${title} | ${site.brandName}`) : site.brandName);
  const finalDescription = seo?.description ?? description ?? '';
  const translated = seo?.translated ?? BOTH;
  const bothTranslated = locales.every((l) => translated[l]);
  const indexable = route.indexable && (seo?.index ?? true);
  const og = ogImageFor(routeKey, locale);
  const otherLocale = locales.find((l) => l !== locale);

  return {
    title: { absolute: finalTitle },
    description: finalDescription,
    alternates: {
      canonical,
      ...(bothTranslated
        ? {
            languages: {
              vi: absoluteUrl(route.paths.vi),
              en: absoluteUrl(route.paths.en),
              'x-default': absoluteUrl(route.paths.vi),
            },
          }
        : {}),
    },
    openGraph: {
      type: seo?.type ?? 'website',
      url: canonical,
      siteName: site.brandName,
      locale: OG_LOCALE[locale],
      ...(bothTranslated && otherLocale ? { alternateLocale: [OG_LOCALE[otherLocale]] } : {}),
      title: finalTitle,
      description: finalDescription,
      images: [{ url: og.url, ...(og.width ? { width: og.width, height: og.height } : {}), alt: og.alt }],
      ...(seo?.type === 'article' && seo.publishedAt
        ? { publishedTime: seo.publishedAt, modifiedTime: seo.updatedAt, authors: [site.brandName] }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      images: [{ url: og.url, alt: og.alt }],
    },
    ...(indexable ? {} : { robots: { index: false, follow: false } }),
  };
}
