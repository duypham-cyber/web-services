#!/usr/bin/env node
/**
 * leads-shot.mjs — chụp khối form lead (section chứa [data-lead-block]) để tự soát giao diện form.
 * Không gửi request nào tới API (trừ khi --submit-errors: bấm "Gửi" khi form trống → chụp trạng thái lỗi inline, FE chặn
 * trước khi gọi API nên không ghi DB).
 *
 *   flock /tmp/bluebolt-web-browser.lock node scripts/leads-shot.mjs
 *   flock /tmp/bluebolt-web-browser.lock node scripts/leads-shot.mjs --paths /,/en/pricing --widths 390 --submit-errors
 *   … --base http://127.0.0.1:3095    (bản build production: kiểm khối Gọi · Zalo · email thay form)
 *
 * Ảnh: .cache/shots/leads/<path>--<width>[--errors].png. Trình duyệt luôn đóng trong finally (máy dùng chung RAM).
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const BASE = opt('base', process.env.BASE_URL || 'http://127.0.0.1:3091').replace(/\/$/, '');
const OUT = opt('out', '.cache/shots/leads');
const WIDTHS = opt('widths', '390,1440').split(',').map(Number);
const DEFAULT_PATHS = [
  '/',
  '/en',
  '/giai-phap/hang-dien-may',
  '/en/solutions/appliance-brands',
  '/giai-phap/san-tmdt-ban-le',
  '/en/solutions/marketplaces-retail',
  '/bang-gia',
  '/en/pricing',
  '/doi-tac-tho',
  '/en/technician-partners',
];
const PATHS = opt('paths', DEFAULT_PATHS.join(',')).split(',');
const SUBMIT_ERRORS = args.includes('--submit-errors');
const EXECUTABLE =
  process.env.CHROMIUM_PATH || '/home/bbsw/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const LIBS = process.env.LD_LIBRARY_PATH || '/home/bbsw/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu';
const slug = (s) => s.replace(/^\/$/, 'root').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXECUTABLE, env: { ...process.env, LD_LIBRARY_PATH: LIBS } });
try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: width < 768 ? 844 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    for (const path of PATHS) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 120_000 });
      const block = page.locator('[data-lead-block]').first();
      if ((await block.count()) === 0) {
        console.log(`[leads-shot] ${path} @${width}: không có [data-lead-block]`);
        continue;
      }
      const section = block.locator('xpath=ancestor::section[1]');
      const target = (await section.count()) > 0 ? section : block;
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const file = join(OUT, `${slug(path)}--${width}.png`);
      await target.screenshot({ path: file });
      console.log(`[leads-shot] ${file}`);
      if (SUBMIT_ERRORS && (await block.locator('form button[type="submit"]').count()) > 0) {
        await block.locator('form button[type="submit"]').click();
        await page.waitForTimeout(300);
        const errFile = join(OUT, `${slug(path)}--${width}--errors.png`);
        await target.screenshot({ path: errFile });
        console.log(`[leads-shot] ${errFile}`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
