#!/usr/bin/env node
/**
 * hero-poster.mjs — poster T-STILL + ảnh LCP an toàn của hero bản đồ (contracts/hero-map.md mục 3.4, 3.7).
 *
 *   flock /tmp/bluebolt-web-browser.lock node scripts/hero-poster.mjs [--base http://127.0.0.1:3091]
 *
 * Chụp trang nội bộ /dev/hero-map ở p = 0 (shot=1: seed cố định, thời gian đứng, không nhãn) bằng Chromium headless
 * SwiftShader, đúng KHUNG CHUẨN của từng bố cục (motion/map-camera.json refAspect) để poster khớp từng điểm ảnh với
 * khung 3D đầu tiên:
 *   desktop  T-FULL  khung 1440×900 (16:10) render DPR 2 → xuất 1920×1200   ≤ 150 KB (AVIF, WebP dự phòng)
 *   mobile   T-LITE  khung 432×768 (9:16)   render DPR 2 → xuất 576×1024    ≤ 90 KB
 * (khung CSS gần cỡ hiển thị thật để nét viền/đường cung — tính theo px CSS — khớp canvas khi crossfade)
 * Ảnh lấy thẳng từ canvas (toDataURL, preserveDrawingBuffer ở chế độ chụp) → không dính lớp phủ dev của Next.
 * Kèm public/images/hero/hero-poster.json: vị trí nhãn (% khung poster) cho 34 tỉnh, văn phòng TP.HCM, Biển Đông,
 * hai quần đảo (+ khung chấm đảo), màu mép ảnh (tô phần viewport poster không phủ), hash để bước 2 gắn ?v=, và 33 đường
 * cung điều phối chiếu ra % khung (`routes`: 13 điểm/đường) cho lớp chấm chạy SVG của poster T-STILL (FilmHero).
 * Script FAIL nếu một trong hai quần đảo không nằm trọn trong khung, hoặc ảnh vượt ngân sách ở chất lượng thấp nhất.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { cliArgs, launch, openHeroDev } from './hero-lib.mjs';

const { opt } = cliArgs();
const BASE = opt('base', process.env.BASE_URL || 'http://127.0.0.1:3091').replace(/\/$/, '');
const OUT_DIR = 'public/images/hero';
const camera = JSON.parse(readFileSync('motion/map-camera.json', 'utf8'));

const TARGETS = [
  { id: 'desktop', tier: 'full', width: 1440, height: 900, outW: 1920, outH: 1200, maxKb: 150 },
  { id: 'mobile', tier: 'lite', width: 432, height: 768, outW: 576, outH: 1024, maxKb: 90 },
];

const pct = (v, total) => Math.round((v / total) * 10000) / 100;

/** Mã hoá giảm dần chất lượng tới khi vừa ngân sách. */
async function encode(png, format, maxBytes) {
  const steps = format === 'avif' ? [66, 60, 55, 50, 45, 40, 35, 30] : [84, 80, 75, 70, 64, 58, 52, 46];
  for (const quality of steps) {
    const buf =
      format === 'avif'
        ? await sharp(png).avif({ quality, effort: 6, chromaSubsampling: '4:2:0' }).toBuffer()
        : await sharp(png).webp({ quality, effort: 6, smartSubsample: true }).toBuffer();
    if (buf.length <= maxBytes) return { buf, quality };
  }
  throw new Error(`${format}: vượt ${maxBytes} byte ở chất lượng thấp nhất`);
}

async function edgeColors(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const avg = (x0, y0, x1, y1) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = (y * info.width + x) * info.channels;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n += 1;
      }
    }
    const hex = (v) => Math.round(v / n).toString(16).padStart(2, '0');
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  };
  const { width: w, height: h } = info;
  const s = 6;
  return { top: avg(0, 0, w, s), bottom: avg(0, h - s, w, h), left: avg(0, 0, s, h), right: avg(w - s, 0, w, h) };
}

mkdirSync(OUT_DIR, { recursive: true });
const manifest = {
  v: 1,
  generator: 'scripts/hero-poster.mjs — KHÔNG sửa tay; chạy lại khi đổi cảnh, dữ liệu hoặc motion/map-camera.json',
  progress: 0,
  note: 'Vị trí nhãn = % khung poster (khung chuẩn của bố cục). Đặt poster theo viewWindow() của motion/map-camera.ts.',
};
const problems = [];
const browser = await launch();
try {
  for (const t of TARGETS) {
    const L = camera.layouts[t.id];
    const ratio = t.width / t.height;
    if (Math.abs(ratio - L.refAspect) > 0.002) throw new Error(`${t.id}: khung ${t.width}×${t.height} lệch refAspect ${L.refAspect}`);
    const { page, stats } = await openHeroDev(browser, BASE, {
      width: t.width,
      height: t.height,
      dpr: 2,
      maxDpr: 2,
      tier: t.tier,
      p: 0,
      labels: false,
      layout: t.id,
    });
    const frame = await page.evaluate(() => window.__heroMapDev.frame());
    const arcs = await page.evaluate(() => window.__heroMapDev.arcs(12));
    if (!arcs || arcs.length !== 33) problems.push(`${t.id}: cần 33 đường cung, nhận ${arcs ? arcs.length : 0}`);
    const dataUrl = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
    await page.close();
    if (frame.layout !== t.id) problems.push(`${t.id}: trang dựng bố cục ${frame.layout}`);
    for (const a of frame.archipelagos) if (!a.inView) problems.push(`${t.id}: ${a.id} không nằm trọn trong poster`);

    const raw = Buffer.from(dataUrl.split(',')[1], 'base64');
    const png = await sharp(raw).resize(t.outW, t.outH, { kernel: 'lanczos3' }).png().toBuffer();
    const avif = await encode(png, 'avif', t.maxKb * 1024);
    const webp = await encode(png, 'webp', t.maxKb * 1024);
    const base = `hero-map-${t.id}`;
    writeFileSync(join(OUT_DIR, `${base}.avif`), avif.buf);
    writeFileSync(join(OUT_DIR, `${base}.webp`), webp.buf);
    const hash = createHash('sha256').update(avif.buf).update(webp.buf).digest('hex').slice(0, 10);

    const W = frame.width;
    const H = frame.height;
    const pt = (q) => [pct(q.x, W), pct(q.y, H)];
    manifest[t.id] = {
      tier: t.tier,
      width: t.outW,
      height: t.outH,
      captureCss: [t.width, t.height],
      refAspect: L.refAspect,
      files: { avif: `/images/hero/${base}.avif`, webp: `/images/hero/${base}.webp` },
      bytes: { avif: avif.buf.length, webp: webp.buf.length },
      quality: { avif: avif.quality, webp: webp.quality },
      hash,
      edge: await edgeColors(png),
      labels: {
        hq: pt(frame.hq),
        sea: pt(frame.sea),
        archipelagos: Object.fromEntries(
          frame.archipelagos.map((a) => [
            a.id,
            { label: pt(a), box: [pct(a.box.left, W), pct(a.box.top, H), pct(a.box.right, W), pct(a.box.bottom, H)] },
          ]),
        ),
        provinces: Object.fromEntries(frame.provinces.map((p) => [p.code, pt(p)])),
      },
      routes: (arcs ?? []).map((a) => ({ code: a.code, speed: Math.round(a.speed * 1000) / 1000, d: a.pts.map(pt) })),
      scene: { drawCalls: stats.firstFrameDrawCalls, triangles: stats.firstFrameTriangles, initMs: stats.initMs },
    };
    console.log(
      `${t.id}: AVIF ${(avif.buf.length / 1024).toFixed(1)} KB (q${avif.quality}) · WebP ${(webp.buf.length / 1024).toFixed(1)} KB (q${webp.quality}) · ` +
        frame.archipelagos.map((a) => `${a.id} ${a.inView ? 'trong khung' : 'NGOÀI KHUNG'}`).join(' · '),
    );
  }
} finally {
  await browser.close();
}

if (problems.length) {
  console.error(`[hero-poster] LỖI:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
writeFileSync(join(OUT_DIR, 'hero-poster.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`[hero-poster] ghi ${OUT_DIR}/hero-poster.json`);
