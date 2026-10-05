import { articles } from '../content/articles';
import { services } from '../content/services';
import { site } from '../content/site';
import { defaultLocale, locales, routing, type AppPathname, type Locale } from '../i18n/routing';

/**
 * NGUỒN DUY NHẤT về danh sách route: sitemap, test tràn ngang, test SEO, trang /dev/routes, chụp ảnh tự soát,
 * nút đổi ngôn ngữ. Đường dẫn VI ↔ EN lấy từ i18n/routing.ts (pathnames) — không viết tay ở chỗ khác.
 * File này dùng được ở cả server, client và Playwright (chỉ import tương đối, không kéo zod).
 */

/**
 * Gốc URL tuyệt đối cho canonical/hreflang/og/sitemap. Mặc định content/site.ts (lapdattoanquoc.vn). Bản dựng cho tên miền
 * khác (vd bản trưng bày services.bluebolt.software, D-30) đặt biến SITE_URL LÚC BUILD (và lúc chạy cho route động) để link
 * chia sẻ (Zalo, Facebook) và ảnh OG trỏ đúng nơi đang phục vụ. Client không đọc được biến này → luôn là giá trị mặc định
 * (SITE_URL chỉ dùng ở server: metadata, sitemap, robots, JSON-LD).
 */
function siteUrl(): string {
  const env = typeof process !== 'undefined' ? process.env.SITE_URL : undefined;
  if (env && /^https?:\/\/[^/\s]+$/.test(env.replace(/\/+$/, ''))) return env.replace(/\/+$/, '');
  return site.url;
}
export const SITE_URL: string = siteUrl();

export type Priority = 'P0' | 'P1' | 'P2' | 'dev';

/** Khu vực phụ trách. Orchestrator gán agent cho từng khu vực; đổi nhãn ở OWNERS nếu cần. */
export type Owner = 'film' | 'map' | 'b2b' | 'partner' | 'seo' | 'qa' | 'foundation';

export const OWNERS: Record<Owner, { label: string; scope: string }> = {
  film: { label: 'Agent phim', scope: 'components/film/**, messages/*/film.json, FilmHero của trang chủ' },
  map: { label: 'Agent bản đồ', scope: 'components/map/**, /mang-luoi, content/provinces.ts, messages/*/network.json' },
  b2b: {
    label: 'Agent trang B2B',
    scope: 'trang chủ sau phim, /giai-phap/*, /dich-vu/*, /bang-gia; messages home, solutions, services, pricing',
  },
  partner: {
    label: 'Agent trang thợ & công ty',
    scope: '/doi-tac-tho, /ho-tro-khach-hang, /ve-chung-toi, /lien-he, 3 trang pháp lý; messages partners, support, about, contact, legal',
  },
  seo: {
    label: 'Agent nội dung & SEO',
    scope: '/kien-thuc/*, bản EN, sitemap, robots, JSON-LD, 301/410; messages knowledge; content/articles.ts, content/redirects.ts',
  },
  qa: { label: 'Agent QA', scope: 'tests/**, budgets, Lighthouse CI, a11y, kiểm máy thật' },
  foundation: { label: 'Tech lead nền móng', scope: 'components/ui, layout, motion, lib/, i18n/, styles/, content/site|stats|claims' },
};

type PageMeta = {
  /** Khóa route; route động dùng làm tiền tố: "services.<key>", "knowledge.<key>". */
  key: string;
  priority: Priority;
  owner: Owner;
  /** Có vào sitemap và được index không. */
  indexable: boolean;
};

/** Mỗi khóa pathname PHẢI có meta (thiếu → typecheck lỗi). */
const PAGE_META = {
  '/': { key: 'home', priority: 'P0', owner: 'b2b', indexable: true },
  '/giai-phap': { key: 'solutions', priority: 'P1', owner: 'b2b', indexable: true },
  '/giai-phap/hang-dien-may': { key: 'solutions.brands', priority: 'P0', owner: 'b2b', indexable: true },
  '/giai-phap/san-tmdt-ban-le': { key: 'solutions.retail', priority: 'P0', owner: 'b2b', indexable: true },
  '/dich-vu': { key: 'services', priority: 'P0', owner: 'b2b', indexable: true },
  '/dich-vu/[slug]': { key: 'services', priority: 'P0', owner: 'b2b', indexable: true },
  '/bang-gia': { key: 'pricing', priority: 'P0', owner: 'b2b', indexable: true },
  '/mang-luoi': { key: 'network', priority: 'P0', owner: 'map', indexable: true },
  '/doi-tac-tho': { key: 'partners', priority: 'P0', owner: 'partner', indexable: true },
  '/ho-tro-khach-hang': { key: 'support', priority: 'P1', owner: 'partner', indexable: true },
  '/ve-chung-toi': { key: 'about', priority: 'P1', owner: 'partner', indexable: true },
  '/kien-thuc': { key: 'knowledge', priority: 'P1', owner: 'seo', indexable: true },
  '/kien-thuc/[slug]': { key: 'knowledge', priority: 'P1', owner: 'seo', indexable: true },
  '/lien-he': { key: 'contact', priority: 'P0', owner: 'partner', indexable: true },
  '/chinh-sach-bao-mat': { key: 'legal.privacy', priority: 'P0', owner: 'partner', indexable: true },
  '/dieu-khoan-su-dung': { key: 'legal.terms', priority: 'P0', owner: 'partner', indexable: true },
  '/chinh-sach-bao-hanh': { key: 'legal.warranty', priority: 'P0', owner: 'partner', indexable: true },
  '/dev/ui': { key: 'dev.ui', priority: 'dev', owner: 'foundation', indexable: false },
  '/dev/routes': { key: 'dev.routes', priority: 'dev', owner: 'foundation', indexable: false },
  '/dev/hero-map': { key: 'dev.hero-map', priority: 'dev', owner: 'film', indexable: false },
} as const satisfies Record<AppPathname, PageMeta>;

type StaticPathname = Exclude<AppPathname, `${string}[slug]`>;
type StaticRouteKey = (typeof PAGE_META)[StaticPathname]['key'];
export type RouteKey =
  | StaticRouteKey
  | `services.${(typeof services)[number]['key']}`
  | `knowledge.${(typeof articles)[number]['key']}`;

export type ConcreteRoute = {
  key: RouteKey;
  /** Khóa trong routing.pathnames (đường dẫn nội bộ). */
  pathname: AppPathname;
  /** Tham số route động theo từng ngôn ngữ (slug VI ≠ slug EN). */
  params?: Record<Locale, { slug: string }>;
  /** URL tương đối thật theo từng ngôn ngữ, vd { vi: '/doi-tac-tho', en: '/en/technician-partners' }. */
  paths: Record<Locale, string>;
  priority: Priority;
  owner: Owner;
  indexable: boolean;
};

/** Ghép URL tương đối từ pathname nội bộ (+ params) cho một ngôn ngữ. VI không tiền tố, EN có /en. */
export function localizePath(pathname: AppPathname, locale: Locale, params?: { slug: string }): string {
  const config = routing.pathnames[pathname];
  let localized: string = typeof config === 'string' ? config : config[locale];
  if (localized.includes('[slug]')) {
    if (!params?.slug) throw new Error(`lib/routes: ${pathname} cần params.slug`);
    localized = localized.replace('[slug]', params.slug);
  }
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  if (localized === '/') return prefix || '/';
  return `${prefix}${localized}`;
}

function staticRoute(pathname: StaticPathname): ConcreteRoute {
  const meta = PAGE_META[pathname];
  return {
    key: meta.key,
    pathname,
    paths: { vi: localizePath(pathname, 'vi'), en: localizePath(pathname, 'en') },
    priority: meta.priority,
    owner: meta.owner,
    indexable: meta.indexable,
  };
}

function buildRoutes(): ConcreteRoute[] {
  const list: ConcreteRoute[] = [];
  for (const pathname of Object.keys(routing.pathnames) as AppPathname[]) {
    if (pathname === '/dich-vu/[slug]') {
      for (const s of services) {
        const params = { vi: { slug: s.slug.vi }, en: { slug: s.slug.en } };
        list.push({
          key: `services.${s.key}`,
          pathname,
          params,
          paths: { vi: localizePath(pathname, 'vi', params.vi), en: localizePath(pathname, 'en', params.en) },
          priority: s.priority,
          owner: 'b2b',
          indexable: true,
        });
      }
    } else if (pathname === '/kien-thuc/[slug]') {
      for (const a of articles) {
        const params = { vi: { slug: a.slug.vi }, en: { slug: a.slug.en } };
        list.push({
          key: `knowledge.${a.key}`,
          pathname,
          params,
          paths: { vi: localizePath(pathname, 'vi', params.vi), en: localizePath(pathname, 'en', params.en) },
          priority: 'P1',
          owner: 'seo',
          indexable: true,
        });
      }
    } else {
      list.push(staticRoute(pathname));
    }
  }
  return list;
}

/** Mọi route cụ thể (đã bung route động), theo thứ tự khai báo trong i18n/routing.ts. */
export const ROUTES: readonly ConcreteRoute[] = buildRoutes();

const BY_KEY = new Map<string, ConcreteRoute>(ROUTES.map((r) => [r.key, r]));

export function getRoute(key: RouteKey): ConcreteRoute {
  const route = BY_KEY.get(key);
  if (!route) throw new Error(`lib/routes: không có route "${key}"`);
  return route;
}

export function pathFor(key: RouteKey, locale: Locale): string {
  return getRoute(key).paths[locale];
}

/** URL tuyệt đối. Trang chủ VI = "https://lapdattoanquoc.vn/" (có "/"), mọi URL khác không có "/" cuối. */
export function absoluteUrl(path: string): string {
  if (!path.startsWith('/')) throw new Error(`lib/routes: đường dẫn phải bắt đầu bằng "/": ${path}`);
  return `${SITE_URL}${path}`;
}

/**
 * Tìm route cụ thể từ pathname nội bộ (usePathname của next-intl) + slug hiện tại.
 * Dùng cho nút đổi ngôn ngữ: slug VI ↔ EN khác nhau nên phải tra bảng, không ghép chuỗi.
 */
export function findRoute(pathname: string, slug: string | undefined, locale: Locale): ConcreteRoute | undefined {
  return ROUTES.find(
    (r) => r.pathname === pathname && (r.params === undefined || (slug !== undefined && r.params[locale].slug === slug)),
  );
}

/** Route được index (sitemap). */
export const INDEXABLE_ROUTES = ROUTES.filter((r) => r.indexable);

export { locales };
