import type { Page } from '@playwright/test';
import { locales, ROUTES, type ConcreteRoute } from '../lib/routes';

export type RouteCase = { route: ConcreteRoute; locale: (typeof locales)[number]; path: string };

/** Mọi route × ngôn ngữ, lấy từ lib/routes.ts (nguồn duy nhất). ONLY_ROUTES=home,partners để chạy một phần. */
export function routeCases(): RouteCase[] {
  const only = process.env.ONLY_ROUTES?.split(',').filter(Boolean);
  return ROUTES.filter((r) => !only || only.includes(r.key)).flatMap((route) =>
    locales.map((locale) => ({ route, locale, path: route.paths[locale] })),
  );
}

/** Cuộn tới cuối trang từng nấc (để motion/lazy chạy), rồi về đầu trang. */
export async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(240, Math.floor(window.innerHeight * 0.9));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 80));
  });
}
