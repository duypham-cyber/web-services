// Chụp 3 "màn hình" HTML làm texture cho cảnh 3D: node scripts/shoot-textures.mjs http://127.0.0.1:9621
import { chromium } from '/tmp/claude-1000/-home-bbsw/ee28fbb7-d651-4847-a095-3dfaa7266689/scratchpad/pw/node_modules/playwright-core/index.mjs';
const base = process.argv[2] || 'http://127.0.0.1:9621';
const b = await chromium.launch({ executablePath: '/home/bbsw/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome' });
for (const [name, w, h] of [['hero', 1600, 900], ['dispatch', 1440, 900], ['phone', 540, 1170]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(`${base}/?tex=${name}`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  await p.screenshot({ path: `public/tex/${name}.jpg`, type: 'jpeg', quality: 86 });
  await p.close();
  console.log('ok', name);
}
await b.close();
