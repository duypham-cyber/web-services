#!/usr/bin/env node
/**
 * gen-og-images.mjs — sinh ảnh Open Graph 1200×630 (≤ 300 KB, không KHANG, không claim) — AC-SEO-4.
 *
 *   node scripts/gen-og-images.mjs                 # tất cả: ảnh OG mặc định VI/EN + ảnh OG bài viết + logo PNG
 *   node scripts/gen-og-images.mjs --only articles # chỉ ảnh bài viết (không cần dev server)
 *
 * 1) public/images/og/bluebolt-services-{vi,en}-v2.jpg — ảnh mặc định, KHÔNG in tên miền (dùng chung cho mọi tên miền đang
 *    phục vụ — D-30; đổi hậu tố -vN mỗi lần sinh lại vì Facebook/Zalo cache ảnh theo URL). Dựng bằng HTML trên dev server dùng chung
 *    ($BASE_URL, mặc định http://127.0.0.1:3091) để có đúng font Be Vietnam Pro + logo <symbol>, chụp bằng Chromium
 *    rev 1234 (CLAUDE.local.md), nén bằng sharp. Khi poster phim có trong public/film/, lib/seo.ts tự dùng poster.
 * 2) public/images/news/og/<key>.jpg — cắt ảnh đầu bài (content/articles/<key>.ts → hero) về 1200×630.
 * 3) public/images/logo-bluebolt-services-512.png — logo vuông nền trắng cho JSON-LD Organization.logo.
 * Trình duyệt luôn đóng trong finally (máy dùng chung RAM).
 */
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { loadTs, ROOT } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : 'all';
const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3091').replace(/\/$/, '');
const EXECUTABLE =
  process.env.CHROMIUM_PATH || '/home/bbsw/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const LIBS = process.env.LD_LIBRARY_PATH || '/home/bbsw/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu';
const MAX_BYTES = 300 * 1024;

const pub = (p) => join(ROOT, 'public', p.replace(/^\//, ''));

function report(file) {
  const bytes = statSync(file).size;
  const flag = bytes > MAX_BYTES ? '  ← VƯỢT 300 KB' : '';
  console.log(`[og] ${file.replace(`${ROOT}/`, '')} ${(bytes / 1024).toFixed(0)} KB${flag}`);
  if (bytes > MAX_BYTES) process.exitCode = 1;
}

/** Điểm neo khi cắt ảnh đầu bài về 1200×630 (mặc định sharp 'attention'); bài nào cắt mất mặt người thì neo riêng. */
const ARTICLE_POSITION = { 'chuyen-doi-so-trong-lap-dat-toan-quoc': 'north' };

async function articleImages() {
  const { ARTICLE_CONTENT } = await loadTs('content/articles/all.ts');
  for (const [key, content] of Object.entries(ARTICLE_CONTENT)) {
    if (!content.ogImage) continue;
    if (!content.hero) throw new Error(`${key}: có ogImage nhưng không có hero để cắt`);
    const out = pub(content.ogImage.src);
    mkdirSync(join(out, '..'), { recursive: true });
    await sharp(pub(content.hero.src))
      .resize(1200, 630, { fit: 'cover', position: ARTICLE_POSITION[key] ?? 'attention' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(out);
    report(out);
  }
}

async function logoPng() {
  const svg = readFileSync(pub('/images/logo-bluebolt-services.svg'));
  const logo = await sharp(svg, { density: 1200 }).resize({ width: 432 }).png().toBuffer();
  const meta = await sharp(logo).metadata();
  const out = pub('/images/logo-bluebolt-services-512.png');
  await sharp({ create: { width: 512, height: 512, channels: 4, background: '#ffffff' } })
    .composite([{ input: logo, left: Math.round((512 - meta.width) / 2), top: Math.round((512 - meta.height) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  report(out);
}

const COPY = {
  vi: {
    lang: 'vi',
    headline: 'Lắp đặt điện máy cho hãng và sàn thương mại điện tử',
    sub: 'Nhận đơn · điều phối thợ · nghiệm thu · đối soát',
  },
  en: {
    lang: 'en',
    headline: 'Appliance installation for brands and marketplaces',
    sub: 'Order intake · technician dispatch · sign-off · reconciliation',
  },
};

function overlayHtml({ lang, headline, sub }) {
  return `
<div id="og-card" lang="${lang}" style="position:fixed;inset:0 auto auto 0;width:1200px;height:630px;z-index:2147483647;
  overflow:hidden;background:var(--color-navy-900);color:#fff;font-family:var(--font-sans);box-sizing:border-box;padding:72px 80px;
  display:flex;flex-direction:column;justify-content:space-between">
  <div aria-hidden="true" style="position:absolute;right:-180px;top:-220px;width:720px;height:720px;border-radius:999px;
    background:radial-gradient(closest-side,rgb(0 74 173 / .75),rgb(0 74 173 / 0));"></div>
  <div aria-hidden="true" style="position:absolute;inset:0;opacity:.18;background-size:48px 48px;
    background-image:linear-gradient(to right,var(--color-blue-300) 1px,transparent 1px),linear-gradient(to bottom,var(--color-blue-300) 1px,transparent 1px);
    mask-image:linear-gradient(to left,#000 10%,transparent 70%);"></div>
  <svg viewBox="0 0 136 44" width="272" height="88" style="position:relative;--logo-blue:#ffffff;--logo-bolt:var(--color-orange-500);--logo-sub:var(--color-slate-300)">
    <use href="#bb-logo"></use></svg>
  <div style="position:relative;max-width:920px">
    <div style="width:96px;height:8px;border-radius:999px;background:var(--color-orange-500);margin-bottom:32px"></div>
    <p style="margin:0;font-family:var(--font-display);font-weight:700;font-size:62px;line-height:1.12;letter-spacing:-0.015em">${headline}</p>
    <p style="margin:28px 0 0;font-size:26px;line-height:1.4;color:var(--color-slate-300)">${sub}</p>
  </div>
  <div aria-hidden="true" style="position:relative;height:30px"></div>
</div>`;
}

async function defaultImages() {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({ executablePath: EXECUTABLE, env: { ...process.env, LD_LIBRARY_PATH: LIBS } });
  try {
    const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    for (const locale of ['vi', 'en']) {
      const res = await page.goto(`${BASE}${locale === 'en' ? '/en/knowledge' : '/kien-thuc'}`, {
        waitUntil: 'networkidle',
        timeout: 120_000,
      });
      if (!res || res.status() !== 200) throw new Error(`dev server trả ${res?.status()} — cần BASE_URL đang chạy`);
      await page.evaluate((html) => document.body.insertAdjacentHTML('beforeend', html), overlayHtml(COPY[locale]));
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });
      const out = pub(`/images/og/bluebolt-services-${locale}-v2.jpg`);
      mkdirSync(join(out, '..'), { recursive: true });
      await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
      report(out);
    }
    await context.close();
  } finally {
    await browser.close();
  }
}

if (only === 'all' || only === 'articles') await articleImages();
if (only === 'all' || only === 'logo') await logoPng();
if (only === 'all' || only === 'default') await defaultImages();
