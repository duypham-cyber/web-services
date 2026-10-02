import { expect, test } from '@playwright/test';
import { routeCases, scrollThrough } from './helpers';

/**
 * NFR-COMP-01 (docs/04 mục 7.2): scrollWidth ≤ clientWidth ở 9 breakpoint × mọi route × VI/EN.
 * Spec tự đổi 9 bề rộng nên chỉ chạy ở project desktop-1440 (playwright.config.ts). Khi fail: in 5 phần tử tràn.
 */
const WIDTHS = [360, 390, 414, 768, 1024, 1280, 1366, 1440, 1920];

test.describe('không tràn ngang', () => {
  for (const { locale, path, route } of routeCases()) {
    test(`${route.key} [${locale}] ${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'networkidle' });
      expect(res?.status(), `HTTP ${path}`).toBe(200);
      const failures: unknown[] = [];
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await scrollThrough(page);
        const result = await page.evaluate(() => {
          const doc = document.documentElement;
          const clipped = (el: Element) => {
            for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
              const ox = getComputedStyle(p).overflowX;
              if (ox !== 'visible') return true;
            }
            return false;
          };
          const describe = (el: Element) => {
            const id = el.id ? `#${el.id}` : '';
            const cls = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}` : '';
            return `${el.tagName.toLowerCase()}${id}${cls}`;
          };
          const offenders: { el: string; left: number; right: number }[] = [];
          if (doc.scrollWidth > doc.clientWidth) {
            for (const el of Array.from(document.body.querySelectorAll('*'))) {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) continue;
              if ((r.right > doc.clientWidth + 0.5 || r.left < -0.5) && !clipped(el)) {
                offenders.push({ el: describe(el), left: Math.round(r.left), right: Math.round(r.right) });
              }
              if (offenders.length >= 5) break;
            }
          }
          return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, offenders };
        });
        if (result.scrollWidth > result.clientWidth) failures.push({ width, ...result });
      }
      expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
    });
  }
});
