#!/usr/bin/env node
/**
 * hero-page-shots.mjs — ảnh tự soát hero bản đồ TRÊN TRANG CHỦ (contracts/hero-map.md, bước 2) ở nhiều tiến độ cuộn.
 *
 *   flock /tmp/bluebolt-web-browser.lock node scripts/hero-page-shots.mjs
 *   ... --sizes 1440x900,390x844 --tiers lite,still --ps 0,0.3,0.56,0.82,1 --locales vi --base http://127.0.0.1:3091
 *
 * Tầng 3D ép bằng ?tier=…&shot=1&fpsguard=0 (chỉ dev/bản xem trước cho phép query). Chromium SwiftShader (CPU): khung
 * tất định, chậm (vài trăm ms/khung). Ảnh: .cache/hero/page/<locale>-<tier>-<w>x<h>-p<p>.png. Luôn đóng trình duyệt.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { cliArgs, launch } from './hero-lib.mjs';

const { opt } = cliArgs();
const BASE = opt('base', process.env.BASE_URL || 'http://127.0.0.1:3091').replace(/\/$/, '');
const OUT = opt('out', '.cache/hero/page');
const SIZES = opt('sizes', '1440x900,390x844').split(',').map((s) => s.split('x').map(Number));
const TIERS = opt('tiers', 'lite').split(',');
const PS = opt('ps', '0,0.3,0.56,0.82,1').split(',').map(Number);
const LOCALES = opt('locales', 'vi').split(',');

mkdirSync(OUT, { recursive: true });

/**
 * Cuộn tới tiến độ p của hero. Khi runtime đã gắn (.film-armed, có data-p — chỉ dev/bản xem trước): tìm nhị phân scrollY
 * theo data-p (desktop: tuyến tính theo track; mobile: theo vị trí đọc của panel). Chưa gắn (T-STILL): cuộn theo tỉ lệ track.
 */
async function scrollToP(page, p) {
  return page.evaluate(async (target) => {
    const root = document.querySelector('[data-hero-map]');
    const top = Math.round(root.getBoundingClientRect().top + window.scrollY);
    const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const go = async (y) => {
      window.scrollTo(0, y);
      await frames();
      return Number(root.dataset.p ?? NaN);
    };
    const first = await go(top);
    if (target <= 0) return top;
    if (Number.isNaN(first)) {
      const y = Math.round(top + target * Math.max(0, root.offsetHeight - window.innerHeight));
      await go(y);
      return y;
    }
    let lo = top;
    let hi = top + root.offsetHeight;
    for (let i = 0; i < 24 && hi - lo > 1; i += 1) {
      const mid = Math.round((lo + hi) / 2);
      if ((await go(mid)) < target - 1e-4) lo = mid;
      else hi = mid;
    }
    await go(hi);
    return hi;
  }, p);
}
const browser = await launch();
try {
  for (const locale of LOCALES) {
    for (const tier of TIERS) {
      for (const [width, height] of SIZES) {
        const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768 });
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
        const prefix = locale === 'en' ? '/en' : '';
        await page.goto(`${BASE}${prefix}/?tier=${tier}&shot=1&fpsguard=0`, { waitUntil: 'load', timeout: 180_000 });
        await page.waitForSelector('[data-hero-map][data-tier]', { timeout: 60_000 });
        const t = await page.evaluate(() => document.querySelector('[data-hero-map]').dataset);
        const live = t.tier !== 'still';
        if (live) {
          await page.mouse.move(width / 2, height / 2);
          await page.waitForSelector('[data-hero-map][data-live]', { timeout: 240_000 });
        }
        for (const p of PS) {
          const before = await page.evaluate(() => document.querySelector('[data-hero-map]').dataset.heroFrame ?? '0');
          const y = await scrollToP(page, p);
          if (live) {
            await page
              .waitForFunction((b) => (document.querySelector('[data-hero-map]').dataset.heroFrame ?? '0') !== b, before, { timeout: 60_000, polling: 100 })
              .catch(() => {});
          }
          await page.waitForTimeout(400);
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
          const file = join(OUT, `${locale}-${tier}-${width}x${height}-p${String(p).replace('.', '')}.png`);
          await page.screenshot({ path: file });
          const ds = await page.evaluate(() => ({ ...document.querySelector('[data-hero-map]').dataset }));
          console.log(`${file} y=${y} tier=${ds.tier} reason=${ds.tierReason ?? ''} scene=${ds.heroScene ?? ''} live=${ds.live !== undefined}`);
        }
        if (errors.length) console.log(`  lỗi trang: ${errors.slice(0, 5).join(' | ')}`);
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
