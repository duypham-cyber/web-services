// Cuộn trang từ đầu đến cuối và chụp từng khung (bằng chứng + nguồn video mobile).
// node scripts/capture.mjs <baseUrl> <width> <height> <frames> <outDir> [p0] [p1] [extraQuery]
import fs from 'node:fs';
import { chromium } from '/tmp/claude-1000/-home-bbsw/ee28fbb7-d651-4847-a095-3dfaa7266689/scratchpad/pw/node_modules/playwright-core/index.mjs';

const [base = 'http://127.0.0.1:9620', W = '1280', H = '720', N = '72', out = 'shots/frames', P0 = '0', P1 = '1', extra = ''] = process.argv.slice(2);
const w = +W, h = +H, n = +N, p0 = +P0, p1 = +P1;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/home/bbsw/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
const t0 = Date.now();
await page.goto(`${base}/?capture&mode=scene${extra}`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__sceneReady === true, null, { timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
const readyMs = Date.now() - t0;
const range = await page.evaluate(() => {
  const t = document.querySelector('.scene-track');
  return { top: t.offsetTop, len: t.offsetHeight - innerHeight };
});
const frameTimes = [];
for (let i = 0; i < n; i++) {
  const p = p0 + (p1 - p0) * (n === 1 ? 0 : i / (n - 1));
  const s = Date.now();
  await page.evaluate(async ({ y, t }) => {
    window.__t = t;
    window.scrollTo(0, y);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));
  }, { y: Math.round(range.top + p * range.len), t: i / 12 });
  frameTimes.push(Date.now() - s);
  await page.screenshot({ path: `${out}/f_${String(i).padStart(3, '0')}.png` });
}
// số đo renderer (draw call, tam giác, texture) ở khung đầu
await page.evaluate(async () => { window.scrollTo(0, 0); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); });
const info = await page.evaluate(() => {
  const { gl, scene } = window.__three || {};
  if (!gl) return null;
  const r = gl.info.render; const tex = [];
  scene.traverse((o) => { const m = o.material; if (m && m.map && m.map.image) tex.push({ name: o.type, w: m.map.image.width, h: m.map.image.height }); });
  let tris = 0; scene.traverse((o) => { if (o.isMesh && o.geometry) { const g = o.geometry; const c = g.index ? g.index.count : g.attributes.position.count; tris += (c / 3) * (o.isInstancedMesh ? o.count : 1); } });
  return { calls: r.calls, triangles: r.triangles, sceneTriangles: Math.round(tris), geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, maps: tex };
});
// FPS thô trên SwiftShader (không đại diện máy thật)
const fps = await page.evaluate(() => new Promise((res) => { let f = 0; const s = performance.now(); const loop = () => { f++; if (performance.now() - s < 3000) requestAnimationFrame(loop); else res(f / ((performance.now() - s) / 1000)); }; requestAnimationFrame(loop); }));
fs.writeFileSync(`${out}/capture-info.json`, JSON.stringify({ w, h, n, readyMs, frameMsAvg: frameTimes.reduce((a, b) => a + b, 0) / n, info, swiftshaderFps: fps, logs: logs.slice(0, 30) }, null, 2));
console.log(JSON.stringify({ readyMs, info, fps, errors: logs.filter((l) => /error/i.test(l)).slice(0, 5) }));
await browser.close();
