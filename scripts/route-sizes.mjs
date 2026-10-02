#!/usr/bin/env node
/**
 * route-sizes.mjs <distDir> — "JS tải đầu" thật của từng trang đã prerender (Next 16 bỏ cột First Load JS).
 * Cách đo: đọc <distDir>/server/app/**\/*.html, lấy mọi <script src="/_next/static/..."> (BỎ script noModule =
 * polyfill chỉ trình duyệt cũ tải) và <link rel=stylesheet>, cộng gzip -9 từng file (không tính trùng trong trang).
 * Ghi thêm <distDir>/route-sizes.json.
 * Ngân sách (docs/04 NFR-PERF-06): JS tải đầu mỗi route ≤ 170 KB gz. Đây là số đo build, chưa qua brotli/openresty.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = process.argv[2] || '.next';
const appDir = join(dist, 'server', 'app');
const BUDGET_KB = 170;

if (!existsSync(appDir)) {
  console.error(`[route-sizes] không thấy ${appDir}`);
  process.exit(1);
}

const gzCache = new Map();
function gz(file) {
  if (!gzCache.has(file)) gzCache.set(file, existsSync(file) ? gzipSync(readFileSync(file), { level: 9 }).length : 0);
  return gzCache.get(file);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const rows = [];
for (const file of walk(appDir)) {
  const html = readFileSync(file, 'utf8');
  const route = '/' + relative(appDir, file).replace(/\.html$/, '').replace(/index$/, '');
  const scripts = new Set(
    [...html.matchAll(/<script([^>]*)>/g)]
      .map((m) => m[1] ?? '')
      .filter((attrs) => !/\bnoModule\b/i.test(attrs))
      .map((attrs) => /\bsrc="([^"]+)"/.exec(attrs)?.[1])
      .filter((u) => typeof u === 'string'),
  );
  const styles = new Set([...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => m[1]));
  const toFile = (u) => join(dist, 'static', decodeURIComponent(u.replace(/^\/_next\/static\//, '').split('?')[0]));
  const js = [...scripts].filter((u) => u.startsWith('/_next/static/')).reduce((a, u) => a + gz(toFile(u)), 0);
  const css = [...styles].filter((u) => u.startsWith('/_next/static/')).reduce((a, u) => a + gz(toFile(u)), 0);
  const htmlGz = gzipSync(Buffer.from(html), { level: 9 }).length;
  rows.push({ route, jsKb: +(js / 1024).toFixed(1), cssKb: +(css / 1024).toFixed(1), htmlKb: +(htmlGz / 1024).toFixed(1), scripts: scripts.size });
}

rows.sort((a, b) => a.route.localeCompare(b.route));
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
console.log(`\n[route-sizes] ${dist} — ${rows.length} trang prerender (gzip -9, KB)`);
console.log(`${pad('route (đường dẫn nội bộ)', 72)}${padL('JS', 8)}${padL('CSS', 7)}${padL('HTML', 7)}${padL('#js', 5)}`);
for (const r of rows) {
  const flag = r.jsKb > BUDGET_KB ? '  > NGÂN SÁCH' : '';
  console.log(`${pad(r.route, 72)}${padL(r.jsKb, 8)}${padL(r.cssKb, 7)}${padL(r.htmlKb, 7)}${padL(r.scripts, 5)}${flag}`);
}
const maxJs = Math.max(...rows.map((r) => r.jsKb));
console.log(`JS tải đầu lớn nhất: ${maxJs} KB gz (ngân sách ${BUDGET_KB} KB gz/route)\n`);
writeFileSync(join(dist, 'route-sizes.json'), JSON.stringify({ dist, budgetKb: BUDGET_KB, rows }, null, 2));
