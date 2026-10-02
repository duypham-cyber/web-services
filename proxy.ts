import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { GONE_PATHS } from './content/redirects';
import { routing } from './i18n/routing';

/**
 * Next 16: file proxy.ts thay cho middleware.ts (docs Next: getting-started/proxy).
 * 1) URL cũ đã gỡ (content/redirects.ts, kind "gone") → 410 Gone, noindex.
 * 2) Còn lại → next-intl: VI không tiền tố, EN /en + slug tiếng Anh; KHÔNG dò ngôn ngữ theo cookie/Accept-Language.
 * Redirect 301 URL cũ nằm ở next.config.ts (chạy TRƯỚC proxy).
 */
const handleI18nRouting = createMiddleware(routing);

const GONE_BODY =
  '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>410 — Trang đã được gỡ</title></head>' +
  '<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;color:#0F172A">' +
  '<h1>Trang này đã được gỡ</h1><p>Nội dung không còn trên lapdattoanquoc.vn.</p>' +
  '<p><a href="/" style="color:#004AAD">Về trang chủ Bluebolt Services</a></p></body></html>';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, '') || '/';
  if (GONE_PATHS.has(pathname)) {
    return new NextResponse(GONE_BODY, {
      status: 410,
      headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' },
    });
  }
  return handleI18nRouting(request);
}

export const config = {
  // Bỏ qua /api, /_next, /_vercel và mọi đường dẫn có dấu chấm (file tĩnh trong public/)
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
