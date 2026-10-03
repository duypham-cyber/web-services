#!/usr/bin/env node
/**
 * hero-budget.mjs — ngân sách hero bản đồ (contracts/hero-map.md mục 3.7). Ngưỡng ở budgets.json → heroMap (nguồn số duy nhất).
 *
 *   node scripts/hero-budget.mjs            kiểm tĩnh, không cần server/bản build
 *   node scripts/hero-budget.mjs --json     in JSON
 *
 * Kiểm: (1) bộ nạp client trong JS tải đầu (components/film/MapHeroStage.tsx + runtime/boot.ts, bundle bằng rolldown
 * minify, không tính react, chunk cảnh để ngoài) ≤ loader.maxGzKb; (2) public/data/hero-map.json ≤ data.maxGzKb;
 * (3) poster mỗi bố cục × định dạng ≤ posters.maxKb; (4) số draw call / tam giác của khung đầu (hero-poster.json) ≤ scene.
 * JS tải đầu cả trang và chunk 3D (three) đo ở scripts/check-budgets.mjs trên bản build. Exit 1 nếu vượt ngưỡng.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KB = 1024;
const kb = (b) => Math.round((b / KB) * 10) / 10;
const json = process.argv.includes('--json');
const B = JSON.parse(readFileSync(join(ROOT, 'budgets.json'), 'utf8')).heroMap;
if (!B) {
  console.error('[hero-budget] budgets.json thiếu khối heroMap');
  process.exit(2);
}

const rows = [];
const add = (subject, actual, limit, unit = 'KB') => rows.push({ subject, actual, limit, unit, ok: actual !== null && actual <= limit });

// 1. bộ nạp
try {
  const { rolldown } = await import('rolldown');
  const bundle = await rolldown({
    input: join(ROOT, B.loader.entry),
    external: (id) => id === 'react' || id.startsWith('react/') || /(^|[\\/])stage(\.ts)?$/.test(id),
    transform: { jsx: 'react-jsx' },
    logLevel: 'silent',
  });
  const { output } = await bundle.generate({ format: 'esm', minify: true });
  const code = output.filter((o) => o.type === 'chunk').map((o) => o.code).join('\n');
  add(`bộ nạp ${B.loader.entry} (gzip -9)`, kb(gzipSync(code, { level: 9 }).length), B.loader.maxGzKb);
} catch (e) {
  rows.push({ subject: 'bộ nạp: không bundle được bằng rolldown', actual: null, limit: B.loader.maxGzKb, unit: 'KB', ok: false, note: String(e?.message ?? e) });
}

// 2. dữ liệu bản đồ
const dataFile = join(ROOT, B.data.file);
add(`${B.data.file} (gzip -9)`, existsSync(dataFile) ? kb(gzipSync(readFileSync(dataFile), { level: 9 }).length) : null, B.data.maxGzKb);

// 3 + 4. poster + cảnh khung đầu
const manifest = JSON.parse(readFileSync(join(ROOT, B.posters.manifest), 'utf8'));
for (const layout of ['desktop', 'mobile']) {
  const m = manifest[layout];
  for (const fmt of B.posters.formats) {
    const rel = m?.files?.[fmt];
    const file = rel ? join(ROOT, 'public', rel.replace(/^\//, '')) : null;
    add(`poster ${layout} ${fmt}`, file && existsSync(file) ? kb(statSync(file).size) : null, B.posters.maxKb[layout]);
  }
  const lim = B.scene[m.tier];
  if (lim && m.scene) {
    add(`cảnh ${m.tier} (${layout}, khung đầu): draw call`, m.scene.drawCalls, lim.maxDrawCalls, '');
    add(`cảnh ${m.tier} (${layout}, khung đầu): tam giác`, m.scene.triangles, lim.maxTriangles, '');
  }
}

const fail = rows.filter((r) => !r.ok);
if (json) console.log(JSON.stringify({ rows, ok: fail.length === 0 }, null, 2));
else {
  for (const r of rows) {
    console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.subject}: ${r.actual ?? '—'}${r.unit ? ` ${r.unit}` : ''} / ${r.limit}${r.unit ? ` ${r.unit}` : ''}${r.note ? ` (${r.note})` : ''}`);
  }
  console.log(fail.length ? `[hero-budget] ${fail.length} mục vượt ngưỡng` : '[hero-budget] mọi mục trong ngưỡng');
}
process.exit(fail.length ? 1 : 0);
