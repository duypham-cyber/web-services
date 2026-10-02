import { expect, test } from '@playwright/test';
import { absoluteUrl } from '../lib/routes';
import { routeCases } from './helpers';

/**
 * NFR-SEO-02 + NFR-A11Y-04 (bản nền móng): mỗi URL đúng 1 H1 nhìn thấy được, title/description khác rỗng,
 * canonical + hreflang (vi, en, x-default→vi) tuyệt đối https://lapdattoanquoc.vn, <html lang> đúng.
 * Project mobile-390 chạy thêm như Googlebot smartphone và KHÔNG JavaScript (HTML server render).
 * Agent SEO mở rộng: JSON-LD, sitemap, OG, 5 bước/KPI/CTA không phụ thuộc cuộn.
 */
const GOOGLEBOT_SMARTPHONE =
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const norm = (u: string | null) => (u ?? '').replace(/\/$/, '');

for (const { locale, path, route } of routeCases()) {
  test(`${route.key} [${locale}] ${path}`, async ({ page, browser }, testInfo) => {
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(res?.status(), `HTTP ${path}`).toBe(200);

    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    expect((await page.title()).trim()).not.toBe('');
    const description = await page.evaluate(() => document.querySelector('meta[name="description"]')?.getAttribute('content'));
    expect(description?.trim(), 'meta description').toBeTruthy();

    const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null);
    expect(norm(canonical)).toBe(norm(absoluteUrl(route.paths[locale])));
    for (const [lang, expected] of [
      ['vi', route.paths.vi],
      ['en', route.paths.en],
      ['x-default', route.paths.vi],
    ] as const) {
      const href = await page.evaluate(
        (l) => document.querySelector(`link[rel="alternate"][hreflang="${l}"]`)?.getAttribute('href') ?? null,
        lang,
      );
      expect(norm(href), `hreflang ${lang}`).toBe(norm(absoluteUrl(expected)));
    }

    // Đọc trực tiếp (meta robots có thể không tồn tại → không dùng locator để khỏi chờ tới timeout)
    const robots = await page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '');
    if (!route.indexable) expect(robots).toContain('noindex');
    else expect(robots).not.toContain('noindex');

    if (testInfo.project.name === 'mobile-390') {
      // HTML server render, không JS, UA Googlebot smartphone: vẫn đúng 1 H1 và H1 nhìn thấy (opacity ≥ 0,9)
      const ctx = await browser.newContext({ javaScriptEnabled: false, userAgent: GOOGLEBOT_SMARTPHONE, viewport: { width: 412, height: 915 } });
      try {
        const noJs = await ctx.newPage();
        const r2 = await noJs.goto(path, { waitUntil: 'domcontentloaded' });
        expect(r2?.status()).toBe(200);
        await expect(noJs.locator('h1')).toHaveCount(1);
        const opacity = await noJs.locator('h1').evaluate((el) => Number(getComputedStyle(el).opacity));
        expect(opacity).toBeGreaterThanOrEqual(0.9);
      } finally {
        await ctx.close();
      }
    }
  });
}
