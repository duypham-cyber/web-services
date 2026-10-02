#!/usr/bin/env node
/**
 * shot.mjs — chụp ảnh tự soát: route × ngôn ngữ × bề rộng → .cache/shots/*.png (gitignore).
 * Danh sách route đọc từ trang /dev/routes (sinh từ lib/routes.ts) nên luôn khớp nguồn duy nhất.
 *
 *   npm run shot                                       # mọi route, vi, 390 + 1440, ảnh cả trang
 *   npm run shot -- --routes home,partners --locales vi,en --widths 360,390,1440
 *   npm run shot -- --paths /,/en/technician-partners  # chụp đường dẫn bất kỳ
 *   npm run shot -- --mode slices                      # cắt từng màn hình (dễ soát chi tiết bằng mắt)
 *   npm run shot -- --reduced-motion --base http://127.0.0.1:3092
 *
 * Tùy chọn: --base (mặc định $BASE_URL hoặc http://127.0.0.1:3091) · --mode full|viewport|slices · --out .cache/shots
 * Chromium: $CHROMIUM_PATH (mặc định bản đầy đủ rev 1234 trên bbsw) + $LD_LIBRARY_PATH (xem CLAUDE.local.md).
 * Trình duyệt luôn được đóng trong finally (máy dùng chung RAM).
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const BASE = opt('base', process.env.BASE_URL || 'http://127.0.0.1:3091').replace(/\/$/, '');
const MODE = opt('mode', 'full');
const OUT = opt('out', '.cache/shots');
const WIDTHS = opt('widths', '390,1440').split(',').map(Number);
const LOCALES = opt('locales', 'vi').split(',');
const ROUTE_FILTER = opt('routes', 'all');
const PATHS = opt('paths', '');
const REDUCED = flag('reduced-motion');
const EXECUTABLE =
  process.env.CHROMIUM_PATH || '/home/bbsw/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const LIBS = process.env.LD_LIBRARY_PATH || '/home/bbsw/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu';

const heightFor = (w) => (w < 768 ? 844 : w < 1280 ? 1024 : 900);
const slug = (s) => s.replace(/^\/$/, 'root').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

async function loadTargets(browser) {
  if (PATHS) return PATHS.split(',').map((p) => ({ name: slug(p), path: p }));
  const page = await browser.newPage();
  try {
    const res = await page.goto(`${BASE}/dev/routes`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    if (!res || res.status() !== 200) throw new Error(`/dev/routes trả ${res?.status()} (dev server chưa chạy hoặc DEV_PAGES tắt?)`);
    const rows = await page.$$eval('tr[data-route-key]', (trs) =>
      trs.map((tr) => ({ key: tr.dataset.routeKey, vi: tr.dataset.pathVi, en: tr.dataset.pathEn })),
    );
    const wanted = ROUTE_FILTER === 'all' ? null : new Set(ROUTE_FILTER.split(','));
    return rows
      .filter((r) => !wanted || wanted.has(r.key))
      .flatMap((r) => LOCALES.map((l) => ({ name: `${l}--${r.key}`, path: l === 'en' ? r.en : r.vi })));
  } finally {
    await page.close();
  }
}

async function scrollThrough(page) {
  // Cuộn xuống từng nấc để motion (rise/curtain) và lazy content chạy, rồi về đầu trang
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

const browser = await chromium.launch({
  executablePath: EXECUTABLE,
  env: { ...process.env, LD_LIBRARY_PATH: LIBS },
});
let count = 0;
try {
  mkdirSync(OUT, { recursive: true });
  const targets = await loadTargets(browser);
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: heightFor(width) },
      deviceScaleFactor: 1,
      reducedMotion: REDUCED ? 'reduce' : 'no-preference',
    });
    const page = await context.newPage();
    for (const t of targets) {
      const res = await page.goto(`${BASE}${t.path}`, { waitUntil: 'networkidle', timeout: 120_000 });
      await scrollThrough(page);
      const base = join(OUT, `${t.name}--${width}${REDUCED ? '--reduced' : ''}`);
      if (MODE === 'slices') {
        const total = await page.evaluate(() => document.documentElement.scrollHeight);
        const h = heightFor(width);
        for (let i = 0, y = 0; y < total; i += 1, y += h) {
          await page.evaluate((top) => window.scrollTo(0, top), y);
          await page.waitForTimeout(250);
          await page.screenshot({ path: `${base}--${String(i).padStart(2, '0')}.png` });
          count += 1;
        }
      } else {
        await page.screenshot({ path: `${base}.png`, fullPage: MODE === 'full' });
        count += 1;
      }
      console.log(`${res?.status()} ${width}px ${t.path} → ${base}${MODE === 'slices' ? '--NN' : ''}.png`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(`[shot] ${count} ảnh trong ${OUT}`);
