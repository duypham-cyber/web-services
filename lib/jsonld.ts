import { articles, type ArticleKey } from '@/content/articles';
import { ARTICLE_CONTENT, plainText } from '@/content/articles/all';
import { provinces } from '@/content/provinces';
import { CONTACT_POINTS } from '@/content/seo';
import { site } from '@/content/site';
import type { Locale } from '@/i18n/routing';
import { claim } from './claims';
import { absoluteUrl, getRoute, SITE_URL, type RouteKey } from './routes';
import { breadcrumbTrail, ogImageFor, seoFor, type Crumb } from './seo';

/**
 * JSON-LD (schema.org) — agent nội dung & SEO (contracts/site-shell-p0.md AC-LD-1, AC-LD-2; docs/04 G6).
 * Render bằng <JsonLd data={...} /> (components/seo/JsonLd.tsx). CHỈ dùng ở server.
 *
 *   Organization   → trang chủ (đề xuất gắn ở app/[locale]/page.tsx hoặc layout) — organizationJsonLd(locale)
 *   Service        → trang giải pháp + dịch vụ — serviceJsonLd({ routeKey, locale, serviceType })
 *   BreadcrumbList → mọi trang trừ trang chủ — breadcrumbJsonLd(routeKey, locale) (hoặc <Breadcrumbs/>)
 *   Article        → /kien-thuc/[slug] — articleJsonLd(key, locale)
 *
 * KHÔNG LocalBusiness (không có địa điểm đón khách), KHÔNG AggregateRating/Review tự đánh giá (AC-LD-2).
 * Tên pháp nhân KHÔNG dịch. sameAs chỉ link thật (content/site.ts → socials, Zalo đã duyệt).
 * areaServed: tỉnh "confirmed" trong content/provinces.ts; chưa có tỉnh nào thì ghi Việt Nam (Country) KHI claim phạm vi
 * coverage.provinces-34 đã duyệt (D-26/D-27); claim còn nháp → bỏ trường.
 */
export type JsonLdObject = { '@context'?: 'https://schema.org'; '@type': string | string[]; [key: string]: unknown };

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
const LOGO_URL = absoluteUrl('/images/logo-bluebolt-services-512.png');

function sameAs(): string[] {
  // socials hiện là [] (chưa có link thật) → TypeScript suy ra never[]; ép kiểu theo schema của content/site.ts
  const links: string[] = (site.socials as readonly { name: string; url: string }[]).map((s) => s.url);
  if ((site.zalo.status as string) === 'approved') links.push(site.zalo.url);
  return links;
}

/** Tham chiếu gọn tới Organization (publisher/provider) — đủ name/url/logo để hợp lệ khi trang không có node đầy đủ. */
export function organizationRef(): JsonLdObject {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: site.brandName,
    legalName: site.legalName.upper,
    url: `${SITE_URL}/`,
    logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
  };
}

/** Organization đầy đủ (trang chủ). */
export function organizationJsonLd(locale: Locale): JsonLdObject {
  const links = sameAs();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: site.brandName,
    legalName: site.legalName.upper,
    alternateName: site.legalName.titleCase,
    url: `${SITE_URL}/`,
    logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
    taxID: site.taxCode,
    email: site.email,
    telephone: site.hotline.tel,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.text[locale],
      addressCountry: 'VN',
    },
    contactPoint: CONTACT_POINTS.map((c) => ({
      '@type': 'ContactPoint',
      contactType: c.contactType,
      telephone: c.telephone,
      email: c.email,
    })),
    ...(links.length > 0 ? { sameAs: links } : {}),
  };
}

/** WebSite (trang chủ) — tên site + ngôn ngữ; không có SearchAction (site không có ô tìm kiếm). */
export function webSiteJsonLd(locale: Locale): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: site.brandName,
    url: `${SITE_URL}/`,
    inLanguage: locale === 'vi' ? 'vi-VN' : 'en',
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/** BreadcrumbList từ chuỗi breadcrumb (lib/seo.ts breadcrumbTrail). */
export function breadcrumbListJsonLd(trail: readonly Crumb[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

export function breadcrumbJsonLd(routeKey: RouteKey, locale: Locale): JsonLdObject {
  return breadcrumbListJsonLd(breadcrumbTrail(routeKey, locale));
}

/**
 * areaServed: tỉnh đã xác nhận có thợ (content/provinces.ts coverage === 'confirmed'); chưa có tỉnh nào mà claim phạm vi
 * 34 tỉnh/thành đã duyệt → cả nước (Country). Claim còn nháp → [] (bỏ trường). Không phụ thuộc DRAFT_PREVIEW.
 */
export function confirmedAreaServed(locale: Locale): JsonLdObject[] {
  const confirmed = provinces
    .filter((p) => (p.coverage as string) === 'confirmed')
    .map((p) => ({ '@type': 'AdministrativeArea', name: p.name[locale] }));
  if (confirmed.length > 0) return confirmed;
  return claim('coverage.provinces-34', locale, { draftPreview: false })
    ? [{ '@type': 'Country', name: locale === 'vi' ? 'Việt Nam' : 'Vietnam' }]
    : [];
}

type ServiceInput = {
  routeKey: RouteKey;
  locale: Locale;
  /** Loại dịch vụ, vd "Air conditioner installation". Mặc định = nhãn breadcrumb của route. */
  serviceType?: string;
  /** Mặc định = title/description trong content/seo.ts. */
  name?: string;
  description?: string;
};

/** Service (trang giải pháp, dịch vụ). provider = Organization; areaServed chỉ khi có tỉnh đã xác nhận. */
export function serviceJsonLd({ routeKey, locale, serviceType, name, description }: ServiceInput): JsonLdObject {
  const seo = seoFor(routeKey, locale);
  const area = confirmedAreaServed(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: name ?? seo?.label ?? site.brandName,
    ...(serviceType ?? seo?.label ? { serviceType: serviceType ?? seo?.label } : {}),
    ...(description ?? seo?.description ? { description: description ?? seo?.description } : {}),
    url: absoluteUrl(getRoute(routeKey).paths[locale]),
    provider: organizationRef(),
    ...(area.length > 0 ? { areaServed: area } : {}),
  };
}

/** Article (bài /kien-thuc). headline ≤ 110 ký tự theo khuyến nghị của Google. */
export function articleJsonLd(key: ArticleKey, locale: Locale): JsonLdObject {
  const content = ARTICLE_CONTENT[key];
  const registry = articles.find((a) => a.key === key);
  const routeKey = `knowledge.${key}` as RouteKey;
  const url = absoluteUrl(getRoute(routeKey).paths[locale]);
  const headline = plainText(registry?.title[locale] ?? content.seoTitle[locale]);
  const images = [
    ...(content.hero && (!content.hero.locales || content.hero.locales.includes(locale))
      ? [absoluteUrl(content.hero.src)]
      : []),
    ogImageFor(routeKey, locale).url,
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: headline.length > 110 ? `${headline.slice(0, 107)}...` : headline,
    description: content.description[locale],
    inLanguage: locale === 'vi' ? 'vi-VN' : 'en',
    datePublished: content.publishedAt,
    dateModified: content.updatedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    image: Array.from(new Set(images)),
    author: organizationRef(),
    publisher: organizationRef(),
  };
}

/**
 * Chuỗi JSON an toàn để nhét vào <script type="application/ld+json">: thay "<" bằng chuỗi thoát unicode (chặn "</script>"),
 * và U+2028/U+2029 (docs Next: guides/json-ld).
 */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  const LS = String.fromCharCode(0x2028);
  const PS = String.fromCharCode(0x2029);
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .split(LS)
    .join('\\u2028')
    .split(PS)
    .join('\\u2029');
}
