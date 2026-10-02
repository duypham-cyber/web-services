import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { routeCases, scrollThrough } from './helpers';

/**
 * NFR-A11Y-01 (bản nền móng): axe WCAG 2.1 A/AA — 0 lỗi mức serious/critical và 0 lỗi color-contrast.
 * Bỏ qua lớp phủ dev của Next (nextjs-portal). Agent QA mở rộng: bàn phím, reduced-motion, máy thật.
 */
for (const { locale, path, route } of routeCases()) {
  test(`${route.key} [${locale}] ${path}`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: 'networkidle' });
    expect(res?.status()).toBe(200);
    await scrollThrough(page); // để motion hiện hết nội dung trước khi đo tương phản
    await page.waitForTimeout(1200);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('nextjs-portal')
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical' || v.id === 'color-contrast',
    );
    const summary = blocking.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.slice(0, 5).map((n) => `${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1] ?? ''}`),
    }));
    expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
  });
}
