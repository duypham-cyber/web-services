#!/usr/bin/env node
/**
 * hero-shots.mjs — ảnh tự soát cảnh 3D hero bản đồ (contracts/hero-map.md, bước 1) + số đo trên SwiftShader.
 *
 *   flock /tmp/bluebolt-web-browser.lock node scripts/hero-shots.mjs
 *   ... --sizes 1440x900,390x844 --tiers full,lite --ps 0,0.25,0.5,0.75,1 --locale vi --labels 1 --base http://127.0.0.1:3091
 *
 * Ảnh: .cache/hero/<tier>-<w>x<h>-p<p>.png · số đo: .cache/hero/measure.json (draw call, tam giác, dựng, ms/khung).
 * Số khung hình SwiftShader (CPU) KHÔNG đại diện GPU thật — chỉ để so sánh tương đối giữa các bản.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cliArgs, launch, openHeroDev, setProgress } from './hero-lib.mjs';

const { opt } = cliArgs();
const BASE = opt('base', process.env.BASE_URL || 'http://127.0.0.1:3091').replace(/\/$/, '');
const OUT = opt('out', '.cache/hero');
const SIZES = opt('sizes', '1440x900,390x844').split(',').map((s) => s.split('x').map(Number));
const TIERS = opt('tiers', 'full,lite').split(',');
const PS = opt('ps', '0,0.25,0.5,0.75,1').split(',').map(Number);
const LOCALE = opt('locale', 'vi');
const LABELS = opt('labels', '1') !== '0';

mkdirSync(OUT, { recursive: true });
const browser = await launch();
const measure = [];
try {
  for (const tier of TIERS) {
    for (const [width, height] of SIZES) {
      const { page, stats, ms, errors } = await openHeroDev(browser, BASE, { width, height, tier, p: PS[0], labels: LABELS, locale: LOCALE });
      const row = { tier, size: `${width}x${height}`, openMs: ms, initMs: stats.initMs, first: stats, frames: [] };
      for (const p of PS) {
        const frameMs = p === PS[0] ? 0 : await setProgress(page, p);
        const file = join(OUT, `${LOCALE}-${tier}-${width}x${height}-p${String(p).replace('.', '')}.png`);
        await page.screenshot({ path: file });
        const s = await page.evaluate(() => window.__heroMapDev.stats());
        const f = await page.evaluate(() => window.__heroMapDev.frame());
        row.frames.push({
          p,
          frameMs,
          drawCalls: s.drawCalls,
          triangles: s.triangles,
          archInView: f.archipelagos.map((a) => `${a.id}:${a.inView ? 'in' : 'out'}`).join(' '),
          file,
        });
        console.log(`${tier} ${width}x${height} p=${p} · ${s.drawCalls} draw · ${s.triangles} tam giác · ${frameMs} ms · ${row.frames.at(-1).archInView}`);
      }
      if (errors.length) row.errors = errors;
      measure.push(row);
      console.log(`  dựng ${stats.initMs} ms (mở trang ${ms} ms) · khung đầu ${stats.firstFrameDrawCalls} draw / ${stats.firstFrameTriangles} tam giác · program ${stats.programs}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
writeFileSync(join(OUT, 'measure.json'), `${JSON.stringify(measure, null, 2)}\n`);
