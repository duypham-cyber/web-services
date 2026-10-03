import { defineRouting } from 'next-intl/routing';

/**
 * Cấu hình định tuyến đa ngôn ngữ (next-intl 4 + Next 16, docs/03 mục 10.1–10.2).
 *
 * - VI không tiền tố (`/doi-tac-tho`), EN có tiền tố `/en` và slug tiếng Anh (`/en/technician-partners`).
 * - KHÔNG tự chuyển hướng theo cookie hay Accept-Language: URL không tiền tố LUÔN là tiếng Việt.
 * - Không đặt cookie NEXT_LOCALE (localeCookie: false) nên trang tĩnh không có Set-Cookie.
 * - hreflang do lib/seo.ts sinh trong <head> (alternateLinks: false để chỉ có MỘT nguồn).
 *
 * Khóa của `pathnames` là đường dẫn NỘI BỘ = tên thư mục trong app/[locale]/ (tiếng Việt).
 * Thêm route mới: thêm vào đây + thêm PAGE_META trong lib/routes.ts (typecheck sẽ báo nếu thiếu).
 */
export const locales = ['vi', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'vi';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
  pathnames: {
    '/': '/',
    '/giai-phap': { vi: '/giai-phap', en: '/solutions' },
    '/giai-phap/hang-dien-may': { vi: '/giai-phap/hang-dien-may', en: '/solutions/appliance-brands' },
    '/giai-phap/san-tmdt-ban-le': { vi: '/giai-phap/san-tmdt-ban-le', en: '/solutions/marketplaces-retail' },
    '/dich-vu': { vi: '/dich-vu', en: '/services' },
    '/dich-vu/[slug]': { vi: '/dich-vu/[slug]', en: '/services/[slug]' },
    '/bang-gia': { vi: '/bang-gia', en: '/pricing' },
    '/mang-luoi': { vi: '/mang-luoi', en: '/network' },
    '/doi-tac-tho': { vi: '/doi-tac-tho', en: '/technician-partners' },
    '/ho-tro-khach-hang': { vi: '/ho-tro-khach-hang', en: '/customer-support' },
    '/ve-chung-toi': { vi: '/ve-chung-toi', en: '/about' },
    '/kien-thuc': { vi: '/kien-thuc', en: '/knowledge' },
    '/kien-thuc/[slug]': { vi: '/kien-thuc/[slug]', en: '/knowledge/[slug]' },
    '/lien-he': { vi: '/lien-he', en: '/contact' },
    '/chinh-sach-bao-mat': { vi: '/chinh-sach-bao-mat', en: '/privacy-policy' },
    '/dieu-khoan-su-dung': { vi: '/dieu-khoan-su-dung', en: '/terms' },
    '/chinh-sach-bao-hanh': { vi: '/chinh-sach-bao-hanh', en: '/warranty-policy' },
    // Trang nội bộ cho dev (noindex, tắt ở production trừ khi DEV_PAGES=1)
    '/dev/ui': '/dev/ui',
    '/dev/routes': '/dev/routes',
    '/dev/hero-map': '/dev/hero-map',
  },
});

export type AppPathname = keyof typeof routing.pathnames;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
