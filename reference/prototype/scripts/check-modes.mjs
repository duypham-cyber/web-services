// Kiểm tra 3 chế độ: desktop 3D, reduced-motion (poster tĩnh), mobile (video scrub) + liệt kê tài nguyên tải
import fs from 'node:fs';
import { chromium } from '/tmp/claude-1000/-home-bbsw/ee28fbb7-d651-4847-a095-3dfaa7266689/scratchpad/pw/node_modules/playwright-core/index.mjs';
const base = process.argv[2] || 'http://127.0.0.1:9620';
const b = await chromium.launch({ executablePath: '/home/bbsw/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const out = {};
for (const [name, vp, opts] of [
  ['desktop', { width: 1280, height: 720 }, {}],
  ['reduced-motion', { width: 1280, height: 720 }, { reducedMotion: 'reduce' }],
  ['mobile', { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
]) {
  const ctx = await b.newContext({ viewport: vp, ...opts });
  const page = await ctx.newPage();
  const res = []; const errs = [];
  page.on('response', async (r) => { try { const buf = await r.body(); res.push({ url: r.url().replace(base, ''), kb: +(buf.length / 1024).toFixed(1) }); } catch { /* bỏ qua */ } });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(name === 'desktop' ? 6000 : 1500);
  await page.screenshot({ path: `shots/mode-${name}.png` });
  if (name === 'mobile') {
    const y = await page.evaluate(() => { const t = document.querySelector('.scene-track'); return t.offsetTop + (t.offsetHeight - innerHeight) * 0.5; });
    await page.evaluate((yy) => scrollTo(0, yy), y); await page.waitForTimeout(1200);
    await page.screenshot({ path: `shots/mode-mobile-scrub50.png` });
    out.mobileVideoTime = await page.evaluate(() => document.querySelector('video')?.currentTime);
  }
  out[name] = { requests: res.length, totalKB: +res.reduce((a, r) => a + r.kb, 0).toFixed(1), files: res.filter((r) => r.kb > 5), hasCanvas: await page.evaluate(() => !!document.querySelector('canvas')), errs };
  await ctx.close();
}
fs.writeFileSync('shots/modes.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
await b.close();
