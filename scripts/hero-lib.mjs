/**
 * hero-lib.mjs — tiện ích chung cho scripts/hero-shots.mjs và scripts/hero-poster.mjs (hero bản đồ, contracts/hero-map.md).
 * Mở trang nội bộ /dev/hero-map bằng Chromium headless + SwiftShader (WebGL chạy trên CPU, tất định), đợi cảnh dựng xong,
 * đặt tiến độ qua window.__heroMapDev. Chromium: $CHROMIUM_PATH + $LD_LIBRARY_PATH (CLAUDE.local.md). Luôn đóng trình duyệt.
 * Bọc mọi lệnh dùng file này bằng: flock /tmp/bluebolt-web-browser.lock <lệnh> (máy dùng chung RAM).
 */
import { chromium } from '@playwright/test';

export const EXECUTABLE =
  process.env.CHROMIUM_PATH || '/home/bbsw/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
export const LIBS = process.env.LD_LIBRARY_PATH || '/home/bbsw/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu';

export function cliArgs(argv = process.argv.slice(2)) {
  const opt = (name, fallback) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
  };
  return { opt, flag: (name) => argv.includes(`--${name}`) };
}

export async function launch() {
  return chromium.launch({
    executablePath: EXECUTABLE,
    env: { ...process.env, LD_LIBRARY_PATH: LIBS },
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
  });
}

/**
 * Mở /dev/hero-map ở khung width×height (DPR 1). Trả { page, stats, ms } khi cảnh đã vẽ khung đầu.
 * q: { p, tier, layout, shot, labels, locale }.
 */
export async function openHeroDev(browser, base, { width, height, dpr = 1, ...q }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  const params = new URLSearchParams();
  params.set('p', String(q.p ?? 0));
  params.set('tier', q.tier ?? 'full');
  if (q.layout) params.set('layout', q.layout);
  if (q.shot !== false) params.set('shot', '1');
  if (q.labels === false) params.set('labels', '0');
  if (q.maxDpr) params.set('dpr', String(q.maxDpr));
  const prefix = q.locale === 'en' ? '/en' : '';
  const t0 = Date.now();
  const res = await page.goto(`${base}${prefix}/dev/hero-map?${params}`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  if (!res || res.status() !== 200) throw new Error(`/dev/hero-map trả ${res?.status()} (dev server chưa chạy hoặc DEV_PAGES tắt?)`);
  await page.waitForFunction(() => document.documentElement.dataset.heroReady, null, { timeout: 240_000, polling: 250 });
  const ready = await page.evaluate(() => document.documentElement.dataset.heroReady);
  if (ready !== '1') throw new Error(`cảnh lỗi: ${errors.join(' | ')}`);
  const stats = await page.evaluate(() => window.__heroMapDev.stats());
  return { page, stats, ms: Date.now() - t0, errors };
}

/** Đặt tiến độ và đợi cảnh vẽ xong khung đó. Trả thời gian (ms). */
export async function setProgress(page, p) {
  const t0 = Date.now();
  await page.evaluate((v) => Promise.race([window.__heroMapDev.set(v), new Promise((r) => setTimeout(r, 30_000))]), p);
  // hai khung trình duyệt để lớp nhãn HTML kịp vẽ
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  return Date.now() - t0;
}
