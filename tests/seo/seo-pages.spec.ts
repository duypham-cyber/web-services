import { expect, test, type Page } from '@playwright/test';
import { absoluteUrl } from '../../lib/routes';
import { isTranslated, seoFor } from '../../lib/seo';
import { routeCases } from '../helpers';
import { hasVietnamese } from './vi-allowlist';

/**
 * NFR-SEO-02 · AC-H1-1 · AC-SEO-1…4 · AC-LD-1/2 · AC-I18N-1 — mọi route VI/EN trên dev server (hoặc BASE_URL):
 * đúng 1 H1; title/description = content/seo.ts; canonical + hreflang tuyệt đối; Open Graph/Twitter; JSON-LD parse được,
 * không LocalBusiness/AggregateRating/Review; không "localhost"; trang /en không có chữ tiếng Việt có dấu (trừ allowlist).
 * Chạy route của mình: ONLY_ROUTES=knowledge,knowledge.lap-dat-may-lanh-dung-cach-7-buoc npx playwright test tests/seo
 * (chỉ project desktop-1440: kiểm HTML/metadata, không phụ thuộc khổ màn hình).
 */
const FORBIDDEN_TYPES = ['LocalBusiness', 'AggregateRating', 'Review'];

/** "https://lapdattoanquoc.vn" ≡ "https://lapdattoanquoc.vn/" (đường dẫn rỗng = "/", RFC 3986); Next bỏ "/" của trang chủ. */
const sameUrl = (u: string | null | undefined) => (u ? u.replace(/^(https?:\/\/[^/]+)\/?$/, '$1/') : u);

type Head = {
  title: string;
  meta: Record<string, string>;
  canonical: string | null;
  alternates: Record<string, string>;
  jsonLd: string[];
  headHtml: string;
  h1: number;
};

async function readHead(page: Page): Promise<Head> {
  return page.evaluate(() => {
    const meta: Record<string, string> = {};
    for (const m of Array.from(document.querySelectorAll('meta[name], meta[property]'))) {
      const key = m.getAttribute('property') ?? m.getAttribute('name') ?? '';
      if (!(key in meta)) meta[key] = m.getAttribute('content') ?? '';
    }
    const alternates: Record<string, string> = {};
    for (const l of Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'))) {
      alternates[l.getAttribute('hreflang') ?? ''] = l.getAttribute('href') ?? '';
    }
    return {
      title: document.title,
      meta,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      alternates,
      jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent ?? ''),
      headHtml: document.head.innerHTML,
      h1: document.querySelectorAll('h1').length,
    };
  });
}

/** Mọi @type trong một khối JSON-LD (đệ quy). */
function typesOf(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((n) => typesOf(n, out));
  else if (node && typeof node === 'object') {
    const t = (node as Record<string, unknown>)['@type'];
    if (typeof t === 'string') out.push(t);
    if (Array.isArray(t)) out.push(...t.filter((x): x is string => typeof x === 'string'));
    Object.values(node).forEach((v) => typesOf(v, out));
  }
  return out;
}

/** Chữ hiển thị + thuộc tính (alt, title, aria-label, placeholder, value) của trang, trừ vùng [lang="vi"] và ghi chú dev. */
async function visibleStrings(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const skip = (el: Element | null) =>
      !!el?.closest('[lang="vi"], script, style, noscript, template, section[aria-labelledby="dev-notes-title"]');
    const out: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent?.trim();
      if (text && !skip(n.parentElement)) out.push(text);
    }
    for (const el of Array.from(document.body.querySelectorAll('[alt], [title], [aria-label], [placeholder]'))) {
      if (skip(el)) continue;
      for (const attr of ['alt', 'title', 'aria-label', 'placeholder']) {
        const v = el.getAttribute(attr);
        if (v) out.push(`${attr}="${v}"`);
      }
    }
    return out;
  });
}

for (const { locale, path, route } of routeCases()) {
  test(`${route.key} [${locale}] ${path}`, async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'metadata không phụ thuộc khổ màn hình');
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
    // Trang nội bộ /dev/* trả 404 ở bản production (DEV_PAGES tắt) — đúng thiết kế, không kiểm
    test.skip(!route.indexable && res?.status() === 404, `${path}: trang nội bộ tắt ở production`);
    expect(res?.status(), `HTTP ${path}`).toBe(200);
    const head = await readHead(page);
    const seo = seoFor(route.key, locale);
    const canonical = absoluteUrl(route.paths[locale]);

    // 1 H1
    expect(head.h1, 'số thẻ h1').toBe(1);

    // title/description riêng (content/seo.ts là nguồn duy nhất)
    expect(seo, 'có mục SEO').toBeTruthy();
    expect(head.title).toBe(seo?.title);
    expect(head.meta.description).toBe(seo?.description);

    // canonical + hreflang tuyệt đối
    expect(sameUrl(head.canonical)).toBe(sameUrl(canonical));
    const canonicalPath = new URL(head.canonical ?? 'https://x/').pathname;
    expect(canonicalPath === '/' || !canonicalPath.endsWith('/'), 'canonical không có "/" cuối').toBe(true);
    if (isTranslated(route.key, 'vi') && isTranslated(route.key, 'en')) {
      expect(Object.fromEntries(Object.entries(head.alternates).map(([k, v]) => [k, sameUrl(v)]))).toEqual({
        vi: sameUrl(absoluteUrl(route.paths.vi)),
        en: sameUrl(absoluteUrl(route.paths.en)),
        'x-default': sameUrl(absoluteUrl(route.paths.vi)),
      });
    } else {
      expect(Object.keys(head.alternates), 'không hreflang khi chưa có bản dịch thật').toEqual([]);
    }

    // Open Graph + Twitter
    expect(head.meta['og:title']).toBe(seo?.title);
    expect(head.meta['og:description']).toBe(seo?.description);
    expect(sameUrl(head.meta['og:url'])).toBe(sameUrl(canonical));
    expect(head.meta['og:locale']).toBe(locale === 'vi' ? 'vi_VN' : 'en_US');
    expect(head.meta['og:site_name']).toBe('Bluebolt Services');
    expect(head.meta['og:image']).toMatch(/^https:\/\/lapdattoanquoc\.vn\/.+\.(jpe?g|png)$/);
    expect(head.meta['twitter:card']).toBe('summary_large_image');
    if (route.key.startsWith('knowledge.')) {
      expect(head.meta['og:type']).toBe('article');
      expect(head.meta['article:published_time']).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
    // Ảnh OG thật sự tồn tại trên server đang kiểm
    const ogPath = new URL(head.meta['og:image'] ?? 'https://x/').pathname;
    const og = await request.get(ogPath);
    expect(og.status(), `og:image ${ogPath}`).toBe(200);
    expect(og.headers()['content-type'] ?? '').toMatch(/^image\//);

    // Không localhost trong <head> và JSON-LD
    expect(head.headHtml).not.toMatch(/localhost|127\.0\.0\.1/);

    // JSON-LD hợp lệ
    const types: string[] = [];
    for (const raw of head.jsonLd) {
      expect(raw).not.toMatch(/localhost|127\.0\.0\.1/);
      let data: unknown;
      expect(() => (data = JSON.parse(raw)), `JSON-LD parse: ${raw.slice(0, 80)}`).not.toThrow();
      const nodes = Array.isArray(data) ? data : [data];
      for (const n of nodes) expect((n as Record<string, unknown>)['@context']).toBe('https://schema.org');
      types.push(...typesOf(data));
    }
    for (const t of FORBIDDEN_TYPES) expect(types, `không được có ${t}`).not.toContain(t);
    if (route.key === 'home') expect(types).toContain('Organization');
    if (route.key.startsWith('knowledge')) expect(types).toContain('BreadcrumbList');
    if (route.key.startsWith('knowledge.')) expect(types).toContain('Article');
    if (route.key !== 'home' && !types.includes('BreadcrumbList')) {
      testInfo.annotations.push({ type: 'thiếu BreadcrumbList', description: `${path} (AC-LD-1: mọi trang trừ trang chủ)` });
    }

    // /en: không chữ tiếng Việt có dấu (text, alt, title, aria-label, meta, JSON-LD) trừ tên pháp nhân + địa chỉ.
    // Trang /dev/* (noindex, 404 ở production) không áp dụng.
    if (locale === 'en' && route.indexable) {
      const offenders = [
        ...(await visibleStrings(page)),
        head.title,
        ...Object.entries(head.meta).map(([k, v]) => `${k}=${v}`),
        ...head.jsonLd,
      ].filter(hasVietnamese);
      expect(offenders.slice(0, 10), offenders.slice(0, 10).join('\n')).toEqual([]);
    }
  });
}
