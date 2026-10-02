import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { buildNextRedirects } from './content/redirects';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const isStaging = process.env.STAGING === '1';

/** Header bảo mật cơ bản cho mọi đường dẫn. HSTS/CSP đặt ở openresty (docs/04 mục 2.7, NFR-SEC-03). */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Staging không bao giờ được index, kể cả khi Basic Auth bị tắt tạm (docs/04 mục 2.7)
  ...(isStaging ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
];

const nextConfig: NextConfig = {
  // Build có khóa và distDir riêng: scripts/safe-build.sh đặt NEXT_DIST_DIR=.next-check-<pid>
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // Dev server chạy -H localhost (xem docs/DECISIONS.md D-09) nhưng agent/test mở http://127.0.0.1:3091:
  // cho phép origin này để HMR và tài nguyên /_next không bị chặn "cross-site" khi dev.
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  typescript: {
    // safe-build.sh trỏ tới tsconfig tạm (gitignore) để Next không ghi distDir tạm vào tsconfig.json
    tsconfigPath: process.env.NEXT_TSCONFIG_PATH || 'tsconfig.json',
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    // Chỉ các dòng "redirect" của content/redirects.ts, mã 301. Dòng 410 do proxy.ts xử lý.
    return buildNextRedirects();
  },
};

export default withNextIntl(nextConfig);
