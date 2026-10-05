import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { GONE_PATHS } from './content/redirects';
import { routing } from './i18n/routing';
import { NOT_FOUND_MARKER } from './lib/not-found';
import { ROUTES } from './lib/routes';

/**
 * Next 16: file proxy.ts thay cho middleware.ts (docs Next: getting-started/proxy).
 * 1) URL cũ đã gỡ (content/redirects.ts, kind "gone") → 410 Gone, noindex; trang báo theo ngôn ngữ của URL.
 * 2) Còn lại → next-intl: VI không tiền tố, EN /en + slug tiếng Anh; KHÔNG dò ngôn ngữ theo cookie/Accept-Language.
 * Redirect 301 URL cũ nằm ở next.config.ts (chạy TRƯỚC proxy).
 */
const handleI18nRouting = createMiddleware(routing);

/**
 * Đường dẫn NỘI BỘ có trang thật ("/<locale>" + pathname của routing, slug theo ngôn ngữ), vd "/en/lien-he",
 * "/en/dich-vu/air-conditioner-installation". Trang /dev/* chỉ tính khi bật trang dev.
 */
const DEV_PAGES = process.env.NODE_ENV !== 'production' || process.env.DEV_PAGES === '1';
const KNOWN_INTERNAL = new Set(
  ROUTES.filter((r) => DEV_PAGES || !r.key.startsWith('dev.')).flatMap((r) =>
    routing.locales.map((locale) => {
      const slug = r.params?.[locale].slug;
      const inner = slug ? r.pathname.replace('[slug]', slug) : r.pathname;
      return inner === '/' ? `/${locale}` : `/${locale}${inner}`;
    }),
  ),
);

/** Trang 410 tối giản theo ngôn ngữ của URL (/en/... → tiếng Anh). openresty có bản song ngữ tương đương ở production. */
const GONE_BODY = {
  vi:
    '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>410 — Trang đã được gỡ</title></head>' +
    '<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;color:#0F172A">' +
    '<h1>Trang này đã được gỡ</h1><p>Nội dung này không còn trên website Bluebolt Services.</p>' +
    '<p><a href="/" style="color:#004AAD">Về trang chủ Bluebolt Services</a></p></body></html>',
  en:
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>410 — Page removed</title></head>' +
    '<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;color:#0F172A">' +
    '<h1>This page has been removed</h1><p>This content is no longer available on the Bluebolt Services website.</p>' +
    '<p><a href="/en" style="color:#004AAD">Go to the Bluebolt Services home page</a></p></body></html>',
} as const;

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, '') || '/';
  if (GONE_PATHS.has(pathname)) {
    const lang = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'vi';
    return new NextResponse(GONE_BODY[lang], {
      status: 410,
      headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' },
    });
  }
  const response = handleI18nRouting(request);
  if (response.status >= 300 && response.status < 400) return response;
  // Không khớp trang nào → trang 404 render bình thường (HTML đầy đủ) kèm mã 404, thay cho vỏ lỗi của notFound() (D-10)
  // mà trên đó router Next 16.3.8 prefetch lặp không dừng các link /en/* (D-30).
  const rewrite = response.headers.get('x-middleware-rewrite');
  const target = (rewrite ? new URL(rewrite).pathname : request.nextUrl.pathname).replace(/\/+$/, '') || '/';
  // (middleware không chạy lại cho chính lần rewrite này, nên gõ thẳng /__404 cũng rơi vào nhánh 404)
  if (!KNOWN_INTERNAL.has(target)) {
    const locale = target === '/en' || target.startsWith('/en/') ? 'en' : 'vi';
    return NextResponse.rewrite(new URL(`/${locale}/${NOT_FOUND_MARKER}`, request.url), {
      status: 404,
      headers: { 'x-robots-tag': 'noindex' },
    });
  }
  return response;
}

export const config = {
  // Bỏ qua /api, /_next, /_vercel và mọi đường dẫn có dấu chấm (file tĩnh trong public/)
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
