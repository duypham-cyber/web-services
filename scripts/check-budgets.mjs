#!/usr/bin/env node
/**
 * check-budgets.mjs — cổng ngân sách hiệu năng. MỌI ngưỡng nằm ở budgets.json (nguồn số duy nhất, đừng ghi số ở đây).
 * Nguồn ngưỡng: CLAUDE.md mục Ngân sách · docs/04 mục 3.4–3.5, 7.1 (NFR-PERF-06…10) · contracts/site-shell-p0.md
 * AC-PERF-1/3/4 · contracts/film-home.md mục 1.7 (ngân sách) + mục 3 (public/film/manifest.json).
 *
 *   npm run budget                                    bản build .next-* mới nhất (scripts/safe-build.sh)
 *   npm run budget -- .next-check-12345               chỉ định bản build
 *   npm run budget -- --live http://localhost:3096    + byte truyền trang chủ mobile (Playwright, server ĐANG CHẠY)
 *   npm run budget -- --json                          in JSON (báo cáo luôn được ghi ở <dist>/budget-report.json)
 *   npm run budget -- --film-dir <thư mục>            kiểm một thư mục phim khác public/film (thử manifest)
 *
 * TĨNH (đọc bản build, không cần server):
 *   1. JS tải đầu mỗi trang: gzip -9 các <script src> + <link rel=preload|modulepreload as=script> trong HTML prerender,
 *      bỏ script noModule (polyfill) — cùng cách scripts/route-sizes.mjs.
 *   2. CSS mỗi trang (gzip -9 các <link rel=stylesheet>); HTML (gzip -9, gồm payload RSC).
 *   3. Font: đúng N <link rel=preload as=font>; file đó phải là mặt chữ đúng họ/weight/subset trong budgets.json VÀ là
 *      mặt chữ được dùng thật (không bị @font-face khai báo sau ghi đè → tải 2 lần); @font-face chỉ họ/weight cho phép.
 *   4. Ảnh: ≤ N preload ảnh/trang; ảnh lớn nhất mỗi trang ở từng khung tham chiếu (chọn ứng viên srcset/sizes/<picture>
 *      như Chrome; ảnh /_next/image được MÔ PHỎNG đúng bộ tối ưu của Next 16 — sharp, AVIF, effort 3 — cache ở
 *      .cache/budgets); <img> phải có width/height hoặc là ảnh fill (CLS).
 *   5. Không tải tài nguyên bên thứ ba từ HTML (script/link/iframe/img/video…); cảnh báo URL CDN nằm trong JS.
 *   6. three/R3F/GSAP KHÔNG có trong JS tải đầu; "chunk 3D" = các nhóm import động có three/R3F (+ import lồng bên
 *      trong), tổng gzip -9 ≤ ngân sách.
 *   7. Thư mục phim (public/film) nếu có file: bắt buộc manifest.json; đo FILE THẬT (không tin số trong manifest):
 *      GLB (byte, tam giác, draw call, texture KTX2 nhúng), texture màn hình, HDRI, poster, video mobile (đọc hộp MP4:
 *      thời lượng, khung hình, GOP từ stss), tổng phim desktop (chunk 3D + GLB + texture + HDRI).
 * SỐNG (--live): byte truyền (header + body đã nén) của trang chủ mobile tới load + N s, không tương tác (NFR-PERF-08).
 *   Đo qua `next start` là gzip; staging/production qua openresty có brotli sẽ nhỏ hơn một chút.
 *
 * Exit 1 nếu có mục mức "fail" vượt ngưỡng ("warn" chỉ in) · exit 2 nếu sai tham số/thiếu bản build. KB = 1024 byte.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KB = 1024;
const kb = (bytes) => (bytes == null ? null : Math.round((bytes / KB) * 10) / 10);
const rel = (p) => relative(ROOT, p).split(sep).join('/');

// ------------------------------------------------------------------------------------------------
// Tham số
// ------------------------------------------------------------------------------------------------
const argv = process.argv.slice(2);
const opts = { json: false, live: null, filmDir: null, dist: null, budgetsPath: join(ROOT, 'budgets.json') };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--json') opts.json = true;
  else if (a === '--live') {
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      opts.live = next;
      i++;
    } else opts.live = process.env.BASE_URL ?? '';
  } else if (a.startsWith('--live=')) opts.live = a.slice('--live='.length);
  else if (a === '--film-dir') opts.filmDir = resolve(argv[++i] ?? '');
  else if (a === '--budgets') opts.budgetsPath = resolve(argv[++i] ?? '');
  else if (a === '--help' || a === '-h') {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    process.exit(0);
  } else if (a.startsWith('--')) die(`tham số lạ: ${a} (xem --help)`);
  else opts.dist = a;
}
if (opts.live === '') die('--live cần URL (vd --live http://localhost:3096) hoặc biến BASE_URL');

function die(msg) {
  console.error(`[budget] ${msg}`);
  process.exit(2);
}

const B = JSON.parse(readFileSync(opts.budgetsPath, 'utf8'));

// ------------------------------------------------------------------------------------------------
// Kết quả
// ------------------------------------------------------------------------------------------------
/** @type {{area:string,id?:string,subject:string,actual?:number|null,limit?:number|null,unit?:string,level:'fail'|'warn'|'info',ok:boolean,note?:string}[]} */
const checks = [];
function measure({ area, id, subject, actual, limit, unit = 'KB', level = 'fail', note }) {
  const ok = actual == null || limit == null ? true : actual <= limit;
  const r = { area, id, subject, actual, limit, unit, level, ok, note };
  checks.push(r);
  return r;
}
function violation({ area, id, subject, level = 'fail', note }) {
  checks.push({ area, id, subject, level, ok: false, note });
}
const notes = []; // dòng thông tin in cuối báo cáo

// ------------------------------------------------------------------------------------------------
// Bản build
// ------------------------------------------------------------------------------------------------
function resolveDist(arg) {
  if (arg) {
    const p = resolve(ROOT, arg);
    if (!existsSync(join(p, 'server', 'app'))) die(`không thấy ${rel(join(p, 'server', 'app'))} — đây có phải bản build?`);
    return p;
  }
  const dirs = readdirSync(ROOT)
    .filter((d) => d.startsWith('.next-') && existsSync(join(ROOT, d, 'BUILD_ID')) && existsSync(join(ROOT, d, 'server', 'app')))
    .map((d) => ({ d, t: statSync(join(ROOT, d, 'BUILD_ID')).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (dirs.length === 0) die('không có bản build production .next-* — chạy scripts/safe-build.sh trước (KHÔNG dùng .next của dev server)');
  return join(ROOT, dirs[0].d);
}
const DIST = resolveDist(opts.dist);
const APP_DIR = join(DIST, 'server', 'app');
const STATIC_DIR = join(DIST, 'static');
const PUBLIC_DIR = join(ROOT, 'public');

const textCache = new Map();
const text = (file) => {
  if (!textCache.has(file)) textCache.set(file, readFileSync(file, 'utf8'));
  return textCache.get(file);
};
const gzCache = new Map();
const gzSize = (file) => {
  if (!gzCache.has(file)) gzCache.set(file, existsSync(file) ? gzipSync(readFileSync(file), { level: 9 }).length : 0);
  return gzCache.get(file);
};
const stripQuery = (u) => u.split(/[?#]/)[0];
/** '/_next/static/chunks/x.js?dpl=…' → đường dẫn tuyệt đối trong <dist>/static, ngoài ra null */
function staticFile(url) {
  const clean = decodeURIComponent(stripQuery(url));
  if (!clean.startsWith('/_next/static/')) return null;
  const p = resolve(STATIC_DIR, clean.slice('/_next/static/'.length));
  return p.startsWith(STATIC_DIR + sep) ? p : null;
}
function publicFile(pathname) {
  const p = resolve(PUBLIC_DIR, '.' + decodeURIComponent(stripQuery(pathname)));
  return p.startsWith(PUBLIC_DIR + sep) ? p : null;
}
function walk(dir, pred, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, pred, out);
    else if (pred(p)) out.push(p);
  }
  return out;
}

// ------------------------------------------------------------------------------------------------
// HTML: thẻ + thuộc tính (HTML do React sinh: thuộc tính trong nháy kép, ký tự đặc biệt đã escape)
// ------------------------------------------------------------------------------------------------
const ENTITIES = { '&amp;': '&', '&quot;': '"', '&#x27;': "'", '&#39;': "'", '&lt;': '<', '&gt;': '>' };
const decodeEntities = (s) => s.replace(/&(?:amp|quot|#x27|#39|lt|gt);/g, (m) => ENTITIES[m]);
function parseAttrs(tag) {
  const out = {};
  const body = tag.replace(/^<\s*[a-zA-Z][\w-]*/, '').replace(/\/?>$/, '');
  for (const m of body.matchAll(/([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    out[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return out;
}
function tags(html, name) {
  const re = new RegExp(`<${name}\\b[^>]*>`, 'gi');
  return [...html.matchAll(re)].map((m) => ({ index: m.index, attrs: parseAttrs(m[0]) }));
}
/** Bỏ thân <script>/<style> inline (payload RSC, JSON-LD) để không dò nhầm thẻ trong chuỗi. */
const stripInlineBodies = (html) => html.replace(/(<(script|style)\b[^>]*>)[\s\S]*?(<\/\2>)/gi, '$1$3');
const relsOf = (attrs) => (attrs.rel ?? '').toLowerCase().split(/\s+/).filter(Boolean);

// ------------------------------------------------------------------------------------------------
// CSS: media query, độ dài (sizes), srcset — đủ cho HTML của repo (px/rem/em/vw/vh, calc/min/max/clamp)
// ------------------------------------------------------------------------------------------------
const unknownCss = new Set();
function splitTopLevel(str, ch) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const c of str) {
    if (c === '(') depth++;
    else if (c === ')') depth--;
    if (c === ch && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}
function evalCss(src, vp) {
  const toks = src.toLowerCase().match(/(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?[a-z%]*|[a-z-]+\(|[()+\-*/,]/g) ?? [];
  let i = 0;
  const peek = () => toks[i];
  const next = () => toks[i++];
  const close = () => {
    if (next() !== ')') throw new Error('thiếu )');
  };
  const unit = (tok) => {
    const m = /^((?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*)$/.exec(tok ?? '');
    if (!m) throw new Error(`không hiểu "${tok}"`);
    const n = parseFloat(m[1]);
    switch (m[2]) {
      case '':
      case 'px':
        return n;
      case 'vw':
      case 'svw':
      case 'lvw':
      case 'dvw':
        return (n * vp.width) / 100;
      case 'vh':
      case 'svh':
      case 'lvh':
      case 'dvh':
        return (n * vp.height) / 100;
      case 'vmin':
        return (n * Math.min(vp.width, vp.height)) / 100;
      case 'vmax':
        return (n * Math.max(vp.width, vp.height)) / 100;
      case 'rem':
      case 'em':
        return n * 16;
      default:
        throw new Error(`đơn vị lạ "${m[2]}"`);
    }
  };
  const factor = () => {
    const t = next();
    if (t === '-') return -factor();
    if (t === '(' || t === 'calc(') {
      const v = expr();
      close();
      return v;
    }
    if (t === 'min(' || t === 'max(' || t === 'clamp(') {
      const args = [expr()];
      while (peek() === ',') {
        next();
        args.push(expr());
      }
      close();
      if (t === 'min(') return Math.min(...args);
      if (t === 'max(') return Math.max(...args);
      return Math.min(Math.max(args[0], args[1]), args[2]);
    }
    return unit(t);
  };
  const term = () => {
    let v = factor();
    while (peek() === '*' || peek() === '/') v = next() === '*' ? v * factor() : v / factor();
    return v;
  };
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') v = next() === '+' ? v + term() : v - term();
    return v;
  }
  const v = expr();
  if (i !== toks.length) throw new Error(`thừa "${toks.slice(i).join(' ')}"`);
  return v;
}
function matchMediaOne(raw, vp) {
  let q = raw.trim().toLowerCase();
  let negate = false;
  if (q.startsWith('not ')) {
    negate = true;
    q = q.slice(4);
  }
  q = q.replace(/^only\s+/, '');
  let res = true;
  for (const part of q.split(/\s+and\s+/)) {
    const p = part.trim();
    if (p === '' || p === 'all' || p === 'screen') continue;
    if (p === 'print') {
      res = false;
      continue;
    }
    const range = /^\(\s*(width|height)\s*(<=|>=|<|>|=)\s*([^)]+)\)$/.exec(p);
    if (range) {
      const a = range[1] === 'width' ? vp.width : vp.height;
      const b = evalCss(range[3], vp);
      res &&= { '<=': a <= b, '>=': a >= b, '<': a < b, '>': a > b, '=': a === b }[range[2]];
      continue;
    }
    const m = /^\(\s*([a-z-]+)\s*(?::\s*([^)]+))?\)$/.exec(p);
    const feat = m?.[1];
    const val = m?.[2]?.trim();
    const dppx = (v) => (/dpi$/.test(v) ? parseFloat(v) / 96 : parseFloat(v));
    switch (feat) {
      case 'min-width':
        res &&= vp.width >= evalCss(val, vp);
        break;
      case 'max-width':
        res &&= vp.width <= evalCss(val, vp);
        break;
      case 'min-height':
        res &&= vp.height >= evalCss(val, vp);
        break;
      case 'max-height':
        res &&= vp.height <= evalCss(val, vp);
        break;
      case 'orientation':
        res &&= (val === 'portrait') === vp.height >= vp.width;
        break;
      case 'min-resolution':
      case '-webkit-min-device-pixel-ratio':
        res &&= vp.dpr >= dppx(val);
        break;
      case 'max-resolution':
      case '-webkit-max-device-pixel-ratio':
        res &&= vp.dpr <= dppx(val);
        break;
      case 'prefers-reduced-motion':
        res &&= val === 'no-preference';
        break;
      case 'pointer':
      case 'any-pointer':
        res &&= val === (vp.mobile ? 'coarse' : 'fine');
        break;
      case 'hover':
      case 'any-hover':
        res &&= val === (vp.mobile ? 'none' : 'hover');
        break;
      default:
        unknownCss.add(`media "${p}"`);
        res = false;
    }
  }
  return negate ? !res : res;
}
const matchMedia = (query, vp) => splitTopLevel(query, ',').some((q) => matchMediaOne(q, vp));
function evalSizes(sizes, vp) {
  if (!sizes || sizes.trim() === 'auto') return vp.width;
  for (const entry of splitTopLevel(sizes, ',')) {
    const e = entry.trim();
    if (!e) continue;
    let media = '';
    let length = e;
    if (e.endsWith(')')) {
      let depth = 0;
      let k = e.length - 1;
      for (; k >= 0; k--) {
        if (e[k] === ')') depth++;
        else if (e[k] === '(' && --depth === 0) break;
      }
      let s = k;
      while (s > 0 && /[a-z-]/i.test(e[s - 1])) s--;
      if (s < k) {
        media = e.slice(0, s).trim();
        length = e.slice(s);
      }
    } else {
      const idx = e.lastIndexOf(' ');
      if (idx > 0) {
        media = e.slice(0, idx).trim();
        length = e.slice(idx + 1);
      }
    }
    try {
      if (media && !matchMedia(media, vp)) continue;
      return evalCss(length, vp);
    } catch (err) {
      unknownCss.add(`sizes "${e}" (${err.message})`);
      return vp.width;
    }
  }
  return vp.width;
}
function parseSrcset(srcset) {
  if (!srcset) return [];
  return srcset
    .split(/,\s+/)
    .map((c) => c.trim().replace(/,$/, ''))
    .filter(Boolean)
    .map((c) => {
      const [url, desc = ''] = c.split(/\s+/);
      const w = /^(\d+)w$/.exec(desc);
      const x = /^(\d*\.?\d+)x$/.exec(desc);
      return { url, w: w ? Number(w[1]) : null, x: x ? Number(x[1]) : w ? null : 1 };
    });
}
/** Chrome: ứng viên nhỏ nhất có mật độ ≥ DPR (không có thì lớn nhất). */
function pickCandidate(srcset, sizes, vp) {
  const cands = parseSrcset(srcset);
  if (cands.length === 0) return null;
  if (cands.some((c) => c.w)) {
    const target = evalSizes(sizes, vp) * vp.dpr;
    const sorted = cands.filter((c) => c.w).sort((a, b) => a.w - b.w);
    return sorted.find((c) => c.w >= target) ?? sorted.at(-1);
  }
  const sorted = [...cands].sort((a, b) => a.x - b.x);
  return sorted.find((c) => c.x >= vp.dpr) ?? sorted.at(-1);
}
const SUPPORTED_IMAGE_TYPES = new Set(['image/avif', 'image/webp', 'image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/gif']);

// ------------------------------------------------------------------------------------------------
// Ảnh: byte thật mà trình duyệt tải (mô phỏng /_next/image bằng đúng tham số của Next 16.3.8)
// ------------------------------------------------------------------------------------------------
const IMG_CACHE_FILE = join(ROOT, '.cache', 'budgets', 'next-image.json');
let imgCache = {};
let imgCacheDirty = false;
try {
  imgCache = JSON.parse(readFileSync(IMG_CACHE_FILE, 'utf8'));
} catch {
  imgCache = {};
}
let sharpMod = null;
async function getSharp() {
  if (!sharpMod) {
    sharpMod = (await import('sharp')).default;
    sharpMod.concurrency(2); // máy dùng chung
    sharpMod.cache(false);
  }
  return sharpMod;
}
/** node_modules/next/dist/server/image-optimizer.js → optimizeImage(): rotate → resize(w, withoutEnlargement) → encode. */
async function nextImageBytes(file, w, q, format) {
  const st = statSync(file);
  const key = [rel(file), st.size, Math.round(st.mtimeMs), w, q, format].join('|');
  if (imgCache[key] != null) return imgCache[key];
  const ext = extname(file).toLowerCase();
  let bytes;
  if (ext === '.svg' || ext === '.gif') bytes = st.size; // Next không tối ưu (bypass)
  else {
    const sharp = await getSharp();
    let t = sharp(readFileSync(file)).rotate().resize(w, undefined, { withoutEnlargement: true });
    if (format === 'avif') t = t.avif({ quality: Math.max(Math.round((q * 50) / 80), 1), effort: 3 });
    else if (format === 'webp') t = t.webp({ quality: q });
    else t = t.jpeg({ quality: q, mozjpeg: true });
    bytes = (await t.toBuffer()).length;
  }
  imgCache[key] = bytes;
  imgCacheDirty = true;
  return bytes;
}
async function imageBytes(url) {
  if (url.startsWith('data:')) return { bytes: url.length, source: 'data:' };
  const u = new URL(url, 'http://same-origin.invalid');
  if (u.origin !== 'http://same-origin.invalid') return { bytes: null, source: url, external: true };
  if (u.pathname === '/_next/image') {
    const src = u.searchParams.get('url') ?? '';
    const w = Number(u.searchParams.get('w'));
    const q = Number(u.searchParams.get('q') ?? 75);
    const file = src.startsWith('/') ? publicFile(src) : null;
    if (!file || !existsSync(file)) return { bytes: null, source: src, missing: true };
    return { bytes: await nextImageBytes(file, w, q, B.images.nextImageFormat), source: src, via: `/_next/image w=${w} q=${q}` };
  }
  const file = u.pathname.startsWith('/_next/static/') ? staticFile(u.pathname) : publicFile(u.pathname);
  if (!file || !existsSync(file)) return { bytes: null, source: u.pathname, missing: true };
  const bytes = extname(file).toLowerCase() === '.svg' ? gzSize(file) : statSync(file).size;
  return { bytes, source: u.pathname, direct: true };
}

// ------------------------------------------------------------------------------------------------
// Font: @font-face trong CSS của trang
// ------------------------------------------------------------------------------------------------
function normFamily(raw) {
  let f = (raw ?? '').trim().replace(/^['"]|['"]$/g, '');
  const fallback = / fallback$/i.test(f);
  f = f.replace(/ fallback$/i, '');
  if (f.startsWith('__')) f = f.replace(/^_+/, '').replace(/_[0-9a-f]{6,}$/i, '').replace(/_/g, ' '); // dạng webpack cũ
  return { family: f, fallback };
}
const faceCache = new Map();
function fontFaces(cssHref) {
  if (faceCache.has(cssHref)) return faceCache.get(cssHref);
  const file = staticFile(cssHref);
  const faces = [];
  if (file && existsSync(file)) {
    for (const m of text(file).matchAll(/@font-face\s*\{([^}]*)\}/g)) {
      const block = m[1];
      const prop = (name) => new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`, 'i').exec(block)?.[1]?.trim();
      const urls = [...block.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)].map((u) => new URL(u[2], `http://x${cssHref}`).pathname);
      const { family, fallback } = normFamily(prop('font-family'));
      faces.push({
        family,
        fallback,
        weight: prop('font-weight') ?? '400',
        style: prop('font-style') ?? 'normal',
        range: (prop('unicode-range') ?? '').toUpperCase().replace(/\s+/g, ''),
        urls,
        css: cssHref,
      });
    }
  }
  faceCache.set(cssHref, faces);
  return faces;
}

// ------------------------------------------------------------------------------------------------
// JS: chữ ký thư viện + nhóm import động (Turbopack: e.v(t=>Promise.all(["static/chunks/a.js",…].map(e.l))…))
// ------------------------------------------------------------------------------------------------
const CHUNKS_DIR = join(STATIC_DIR, 'chunks');
const allJs = walk(CHUNKS_DIR, (p) => p.endsWith('.js'));
const sigCache = new Map();
/** @returns {string[]} tên thư viện có chữ ký trong file (budgets.json → signatures) */
function sigHits(file) {
  if (!sigCache.has(file)) {
    const src = existsSync(file) ? text(file) : '';
    sigCache.set(
      file,
      Object.entries(B.signatures)
        .filter(([, needles]) => needles.some((n) => src.includes(n)))
        .map(([name]) => name),
    );
  }
  return sigCache.get(file);
}
const groupsByFile = new Map(); // file → [[abs chunk paths], …] (nhóm import động khai báo trong file)
for (const f of allJs) {
  const src = text(f);
  const groups = [];
  for (const m of src.matchAll(/(otherChunks\s*:\s*)?\[((?:\s*"static\/chunks\/[^"]+"\s*,?)+)\]/g)) {
    if (m[1]) continue; // danh sách chunk tải đầu của runtime, không phải import động
    groups.push([...m[2].matchAll(/"(static\/chunks\/[^"]+)"/g)].map((x) => join(DIST, x[1])));
  }
  groupsByFile.set(f, groups);
}

// ------------------------------------------------------------------------------------------------
// 1–5. Từng trang
// ------------------------------------------------------------------------------------------------
const exclude = (B.pages?.exclude ?? []).map((s) => new RegExp(s));
const pageFiles = walk(APP_DIR, (p) => p.endsWith('.html'));
const pages = [];
const firstLoadAll = new Set();
let previewBuild = false;

for (const file of pageFiles) {
  const route = '/' + relative(APP_DIR, file).split(sep).join('/').replace(/\.html$/, '');
  if (exclude.some((re) => re.test(route))) continue;
  const html = text(file);
  if (html.includes('data-draft-preview')) previewBuild = true;
  const body = stripInlineBodies(html);
  const links = tags(body, 'link');
  const scripts = tags(body, 'script').filter((t) => t.attrs.src && !('nomodule' in t.attrs));

  // JS + CSS tải đầu
  const jsUrls = new Set(
    [
      ...scripts.map((t) => t.attrs.src),
      ...links
        .filter((t) => {
          const r = relsOf(t.attrs);
          return r.includes('modulepreload') || (r.includes('preload') && t.attrs.as === 'script');
        })
        .map((t) => t.attrs.href),
    ]
      .filter(Boolean)
      .map(stripQuery),
  );
  const cssUrls = [...new Set(links.filter((t) => relsOf(t.attrs).includes('stylesheet')).map((t) => stripQuery(t.attrs.href ?? '')).filter(Boolean))];
  const jsFiles = [...jsUrls].map((u) => staticFile(u) ?? publicFile(u)).filter((p) => p && existsSync(p));
  jsFiles.forEach((f) => firstLoadAll.add(f));
  const jsGz = jsFiles.reduce((a, f) => a + gzSize(f), 0);
  const cssGz = cssUrls.map(staticFile).filter((p) => p && existsSync(p)).reduce((a, f) => a + gzSize(f), 0);
  const htmlGz = gzipSync(Buffer.from(html), { level: 9 }).length;

  const page = { route, jsGzKb: kb(jsGz), cssGzKb: kb(cssGz), htmlGzKb: kb(htmlGz), jsFiles: jsFiles.length, fontPreloads: 0, imagePreloads: 0, largest: {} };
  pages.push(page);

  measure({ area: 'js', id: B.firstLoadJs.id, subject: `${route} JS tải đầu`, actual: page.jsGzKb, limit: B.firstLoadJs.maxGzKb, level: B.firstLoadJs.level });
  measure({ area: 'css', id: B.css.id, subject: `${route} CSS`, actual: page.cssGzKb, limit: B.css.maxGzKb, level: B.css.level });
  measure({ area: 'html', id: B.html.id, subject: `${route} HTML`, actual: page.htmlGzKb, limit: B.html.maxGzKb, level: B.html.level });

  // three/R3F/GSAP không được vào JS tải đầu
  for (const f of jsFiles) {
    const hits = sigHits(f).filter((s) => B.firstLoadForbidden.libraries.includes(s));
    if (hits.length) violation({ area: 'js', id: B.firstLoadForbidden.id, subject: `${route}: ${hits.join(', ')} nằm trong JS tải đầu (${rel(f)})`, level: B.firstLoadForbidden.level });
  }

  // Font preload: đúng N file, đúng mặt chữ, và là mặt chữ được dùng thật
  const faces = cssUrls.flatMap(fontFaces);
  const fontPreloads = links.filter((t) => relsOf(t.attrs).includes('preload') && t.attrs.as === 'font').map((t) => stripQuery(t.attrs.href ?? ''));
  page.fontPreloads = fontPreloads.length;
  const F = B.fonts;
  if (fontPreloads.length !== F.preloadCount) {
    violation({ area: 'font', id: F.id, subject: `${route}: ${fontPreloads.length} font preload (phải đúng ${F.preloadCount})`, level: F.level });
  }
  for (const href of fontPreloads) {
    const face = faces.find((f) => f.urls.includes(href));
    if (!face) {
      violation({ area: 'font', id: F.id, subject: `${route}: font preload ${href} không thuộc @font-face nào (tải thừa)`, level: F.level });
      continue;
    }
    const want = F.preloadFace;
    if (face.family !== want.family || String(face.weight) !== String(want.weight) || !face.range.includes(want.unicodeRangeMarker.toUpperCase())) {
      violation({ area: 'font', id: F.id, subject: `${route}: font preload là ${face.family} ${face.weight} (range ${face.range.slice(0, 24)}…), phải là ${want.family} ${want.weight} ${want.subset}`, level: F.level });
    }
    // Cùng họ/weight/style/unicode-range: @font-face khai báo SAU thắng → preload phải là mặt chữ cuối
    const same = faces.filter((f) => !f.fallback && f.family === face.family && f.weight === face.weight && f.style === face.style && f.range === face.range);
    if (same.length && !same.at(-1).urls.includes(href)) {
      violation({ area: 'font', id: F.id, subject: `${route}: font preload ${basename(href)} bị @font-face khai báo sau (${basename(same.at(-1).urls[0] ?? '')}) ghi đè → tải 2 lần`, level: F.level });
    }
  }
  for (const f of faces) {
    if (f.fallback && f.urls.length === 0) continue; // mặt chữ dự phòng local(Arial) của next/font
    if (!F.allowedFamilies.includes(f.family)) violation({ area: 'font', id: F.id, subject: `${route}: họ font "${f.family}" ngoài danh sách cho phép (${f.css})`, level: F.level });
    if (!F.allowedWeights.map(String).includes(String(f.weight))) violation({ area: 'font', id: F.id, subject: `${route}: weight ${f.weight} của "${f.family}" ngoài danh sách cho phép`, level: F.level });
  }

  // Tài nguyên bên thứ ba trong HTML
  const T = B.thirdParty;
  const resourceUrls = [
    ...scripts.map((t) => ['script', t.attrs.src]),
    ...links
      .filter((t) => relsOf(t.attrs).some((r) => T.linkRels.includes(r)))
      .flatMap((t) => [t.attrs.href, ...parseSrcset(t.attrs.imagesrcset).map((c) => c.url)].filter(Boolean).map((u) => [`link[${relsOf(t.attrs).join(' ')}]`, u])),
    ...['iframe', 'img', 'source', 'video', 'audio', 'embed', 'track'].flatMap((n) =>
      tags(body, n).flatMap((t) => [t.attrs.src, t.attrs.poster, ...parseSrcset(t.attrs.srcset).map((c) => c.url)].filter(Boolean).map((u) => [n, u])),
    ),
    ...tags(body, 'object').map((t) => ['object', t.attrs.data]),
  ];
  for (const [kind, u] of resourceUrls) {
    if (!u || !/^(https?:)?\/\//i.test(u)) continue;
    const host = new URL(u, 'https://x.invalid').hostname;
    if (T.firstPartyHosts.includes(host) || T.allowHosts.includes(host)) continue;
    violation({ area: 'third-party', id: T.id, subject: `${route}: ${kind} tải từ ${host} (${u.slice(0, 80)})`, level: T.level });
  }

  // Ảnh
  const I = B.images;
  const imagePreloads = links.filter((t) => relsOf(t.attrs).includes('preload') && t.attrs.as === 'image');
  page.imagePreloads = imagePreloads.length;
  if (imagePreloads.length > I.maxPreload) violation({ area: 'image', id: I.preloadId, subject: `${route}: ${imagePreloads.length} ảnh preload (tối đa ${I.maxPreload})`, level: I.level });

  const pictures = [...body.matchAll(/<picture\b[^>]*>([\s\S]*?)<\/picture>/gi)].map((m) => ({ start: m.index, end: m.index + m[0].length, inner: m[1] }));
  const elements = pictures.map((p) => ({ sources: tags(p.inner, 'source').map((t) => t.attrs), img: tags(p.inner, 'img')[0]?.attrs ?? {} }));
  for (const t of tags(body, 'img')) if (!pictures.some((p) => t.index >= p.start && t.index < p.end)) elements.push({ sources: [], img: t.attrs });

  for (const el of elements) {
    const a = el.img;
    const hasDims = (a.width && a.height) || a['data-nimg'] === 'fill' || /position\s*:\s*absolute/i.test(a.style ?? '');
    if (I.requireDimensions && !hasDims && !(a.src ?? '').startsWith('data:')) {
      violation({ area: 'image', id: I.dimensionsId, subject: `${route}: <img> thiếu width/height (${(a.src || a.srcset || '').slice(0, 70)})`, level: I.level });
    }
  }
  for (const vp of I.viewports) {
    const seen = new Map();
    for (const el of elements) {
      let url = null;
      for (const s of el.sources) {
        if (s.type && !SUPPORTED_IMAGE_TYPES.has(s.type.toLowerCase())) continue;
        if (s.media && !matchMedia(s.media, vp)) continue;
        url = pickCandidate(s.srcset, s.sizes, vp)?.url ?? null;
        if (url) break;
      }
      url ??= pickCandidate(el.img.srcset, el.img.sizes, vp)?.url ?? el.img.src ?? null;
      if (!url || seen.has(url)) continue;
      seen.set(url, await imageBytes(url));
    }
    const list = [...seen.entries()].map(([url, r]) => ({ url, ...r }));
    for (const r of list) {
      if (r.missing) violation({ area: 'image', id: I.id, subject: `${route}: ảnh ${r.source} không có trong public/ hay bản build`, level: 'warn' });
      if (r.direct && /\.(jpe?g|png)$/i.test(r.source) && vp === I.viewports[0]) {
        violation({ area: 'image', id: I.formatId, subject: `${route}: ảnh ${r.source} phục vụ thẳng dạng ${extname(r.source).slice(1)} — nên AVIF/WebP`, level: 'warn' });
      }
    }
    const top = list.filter((r) => r.bytes != null).sort((x, y) => y.bytes - x.bytes)[0];
    page.largest[vp.name] = top ? { kb: kb(top.bytes), source: top.source, via: top.via ?? 'tĩnh' } : null;
    if (top) {
      measure({ area: 'image', id: I.id, subject: `${route} ảnh lớn nhất @${vp.name} (${basename(top.source)}${top.via ? ', ' + top.via : ''})`, actual: kb(top.bytes), limit: I.maxKb[vp.name], level: I.level });
    }
  }
}
if (pages.length === 0) die(`không có trang HTML nào trong ${rel(APP_DIR)}`);
if (previewBuild) notes.push('Bản build có DRAFT_PREVIEW (data-draft-preview) — HTML/ảnh khác production; gate thật chạy trên bản build không cờ.');

// Runtime "otherChunks" = tải đầu
for (const f of allJs) {
  for (const m of text(f).matchAll(/otherChunks\s*:\s*\[([^\]]*)\]/g)) {
    for (const x of m[1].matchAll(/"(static\/chunks\/[^"]+)"/g)) firstLoadAll.add(join(DIST, x[1]));
  }
}

// ------------------------------------------------------------------------------------------------
// 6. Chunk 3D: nhóm import động có three/R3F + mọi import lồng bên trong
// ------------------------------------------------------------------------------------------------
const C3 = B.chunk3d;
const allGroups = [...groupsByFile.entries()].flatMap(([from, groups]) => groups.map((files) => ({ from, files })));
const is3dGroup = (g) => g.files.some((f) => !firstLoadAll.has(f) && sigHits(f).some((s) => C3.libraries.includes(s)));
const chunk3d = new Set();
const queue = allGroups.filter(is3dGroup).flatMap((g) => g.files);
while (queue.length) {
  const f = queue.pop();
  if (!f.endsWith('.js') || firstLoadAll.has(f) || chunk3d.has(f)) continue;
  chunk3d.add(f);
  for (const g of groupsByFile.get(f) ?? []) queue.push(...g);
}
const chunk3dGz = [...chunk3d].reduce((a, f) => a + gzSize(f), 0);
const chunk3dInfo = {
  groups: allGroups.length,
  groups3d: allGroups.filter(is3dGroup).length,
  files: [...chunk3d].map((f) => ({ file: rel(f), gzKb: kb(gzSize(f)), libs: sigHits(f) })).sort((a, b) => b.gzKb - a.gzKb),
  gzKb: kb(chunk3dGz),
};
if (chunk3d.size > 0) {
  measure({ area: 'chunk3d', id: C3.id, subject: `chunk 3D (${chunk3d.size} file, ${chunk3dInfo.groups3d} nhóm import động có ${C3.libraries.join('/')})`, actual: kb(chunk3dGz), limit: C3.maxGzKb, level: C3.level });
}
// JS bất kỳ có URL CDN (decoder Draco của drei, benchmark của detect-gpu…) → cảnh báo
for (const f of allJs) {
  const src = text(f);
  for (const pat of B.thirdParty.jsCdnPatterns) {
    if (src.includes(pat)) {
      violation({ area: 'third-party', id: B.thirdParty.id, subject: `${rel(f)} (${firstLoadAll.has(f) ? 'tải đầu' : 'import động'}) chứa "${pat}" — chỉ hợp lệ nếu đã override sang tài nguyên tự host`, level: 'warn' });
    }
  }
}

// ------------------------------------------------------------------------------------------------
// 7. Phim: public/film + manifest.json (contracts/film-home.md mục 3)
// ------------------------------------------------------------------------------------------------
const FILM = B.film;
const filmDir = opts.filmDir ?? join(ROOT, FILM.dir);
const filmFiles = walk(filmDir, (p) => !basename(p).startsWith('.'));
const filmInfo = { dir: rel(filmDir) || filmDir, files: filmFiles.length };

function readBoxes(buf, start, end) {
  const out = [];
  let off = start;
  while (off + 8 <= end) {
    let size = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    let header = 8;
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(off + 8));
      header = 16;
    } else if (size === 0) size = end - off;
    if (size < header || off + size > end) break;
    out.push({ type, start: off, end: off + size, data: off + header });
    off += size;
  }
  return out;
}
const childBox = (buf, box, type) => box && readBoxes(buf, box.data, box.end).find((b) => b.type === type);
/** MP4 (ISO-BMFF, không phân mảnh): track video → codec, khung, thời lượng, số mẫu, GOP lớn nhất (stss). */
function inspectMp4(file) {
  const buf = readFileSync(file);
  const moov = readBoxes(buf, 0, buf.length).find((b) => b.type === 'moov');
  if (!moov) return { error: 'không có hộp moov' };
  for (const trak of readBoxes(buf, moov.data, moov.end).filter((b) => b.type === 'trak')) {
    const mdia = childBox(buf, trak, 'mdia');
    const hdlr = childBox(buf, mdia, 'hdlr');
    if (!hdlr || buf.toString('latin1', hdlr.data + 8, hdlr.data + 12) !== 'vide') continue;
    const mdhd = childBox(buf, mdia, 'mdhd');
    const v1 = buf[mdhd.data] === 1;
    const timescale = buf.readUInt32BE(mdhd.data + (v1 ? 20 : 12));
    const duration = v1 ? Number(buf.readBigUInt64BE(mdhd.data + 24)) : buf.readUInt32BE(mdhd.data + 16);
    const stbl = childBox(buf, childBox(buf, mdia, 'minf'), 'stbl');
    const stsd = childBox(buf, stbl, 'stsd');
    const entry = stsd ? stsd.data + 8 : null;
    const codec = entry ? buf.toString('latin1', entry + 4, entry + 8) : '?';
    const width = entry ? buf.readUInt16BE(entry + 32) : null;
    const height = entry ? buf.readUInt16BE(entry + 34) : null;
    const stsz = childBox(buf, stbl, 'stsz');
    const samples = stsz ? buf.readUInt32BE(stsz.data + 8) : 0;
    if (!samples) return { codec, width, height, durationS: duration / timescale, error: 'MP4 phân mảnh hoặc không có mẫu — không đọc được GOP' };
    const stss = childBox(buf, stbl, 'stss');
    let gop = 1;
    if (stss) {
      const n = buf.readUInt32BE(stss.data + 4);
      const sync = Array.from({ length: n }, (_, k) => buf.readUInt32BE(stss.data + 8 + k * 4));
      gop = Math.max(...sync.map((s, k) => (k + 1 < sync.length ? sync[k + 1] : samples + 1) - s));
    }
    return { codec, width, height, durationS: duration / timescale, samples, gop };
  }
  return { error: 'không có track video' };
}
const KTX2_ID = Buffer.from([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]);
const ktx2Dims = (buf, off = 0) => (buf.subarray(off, off + 12).equals(KTX2_ID) ? { w: buf.readUInt32LE(off + 20), h: buf.readUInt32LE(off + 24) } : null);
/** GLB 2.0: tam giác + draw call theo đồ thị scene (kể cả EXT_mesh_gpu_instancing), ảnh KTX2 nhúng. */
function inspectGlb(file) {
  const buf = readFileSync(file);
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67) return { error: 'không phải GLB' };
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  const binStart = 20 + jsonLen + 8;
  const acc = gltf.accessors ?? [];
  const nodes = gltf.nodes ?? [];
  const sceneRoots = gltf.scenes?.[gltf.scene ?? 0]?.nodes ?? nodes.map((_, k) => k).filter((k) => !nodes.some((n) => n.children?.includes(k)));
  let triangles = 0;
  let drawCalls = 0;
  const visit = (k, depth) => {
    const node = nodes[k];
    if (!node || depth > 64) return;
    if (node.mesh != null) {
      const inst = node.extensions?.EXT_mesh_gpu_instancing?.attributes;
      const count = inst ? acc[Object.values(inst)[0]]?.count ?? 1 : 1;
      for (const p of gltf.meshes?.[node.mesh]?.primitives ?? []) {
        const mode = p.mode ?? 4;
        const n = p.indices != null ? acc[p.indices]?.count ?? 0 : acc[p.attributes?.POSITION]?.count ?? 0;
        triangles += (mode === 4 ? n / 3 : mode === 5 || mode === 6 ? Math.max(n - 2, 0) : 0) * count;
        drawCalls += 1;
      }
    }
    for (const c of node.children ?? []) visit(c, depth + 1);
  };
  sceneRoots.forEach((k) => visit(k, 0));
  const ktx2 = [];
  for (const img of gltf.images ?? []) {
    if (img.bufferView == null) continue;
    const bv = gltf.bufferViews[img.bufferView];
    const d = ktx2Dims(buf, binStart + (bv.byteOffset ?? 0));
    if (d) ktx2.push({ name: img.name ?? `image ${ktx2.length}`, ...d, bytes: bv.byteLength });
  }
  return { triangles: Math.round(triangles), drawCalls, ktx2, extensions: gltf.extensionsUsed ?? [] };
}

if (filmFiles.length === 0) {
  notes.push(`Phim: ${filmInfo.dir} trống — bỏ qua kiểm asset phim (GLB, texture, poster, video).`);
} else {
  const manifestPath = join(filmDir, 'manifest.json');
  const fileOf = (f) => (f.startsWith('/film/') ? join(filmDir, f.slice('/film/'.length)) : join(filmDir, f));
  const bytesOf = (f) => (existsSync(f) ? statSync(f).size : null);
  if (!existsSync(manifestPath)) {
    violation({ area: 'film', id: FILM.id, subject: `${filmInfo.dir} có ${filmFiles.length} file nhưng thiếu manifest.json (contracts/film-home.md mục 3)`, level: 'fail' });
  } else {
    const M = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const referenced = new Set([manifestPath]);
    const need = (f, what) => {
      const p = fileOf(f);
      referenced.add(p);
      if (!existsSync(p)) violation({ area: 'film', id: FILM.id, subject: `manifest: ${what} ${f} không tồn tại`, level: 'fail' });
      return existsSync(p) ? p : null;
    };
    const sharp = await getSharp();
    const meta = async (p) => {
      try {
        return await sharp(p).metadata();
      } catch {
        return null;
      }
    };
    let desktopBytes = chunk3dGz;
    let largeKtx2 = 0;
    // GLB
    const glbPath = M.desktop?.glb?.file ? need(M.desktop.glb.file, 'GLB') : null;
    if (glbPath) {
      const g = inspectGlb(glbPath);
      const bytes = bytesOf(glbPath);
      desktopBytes += bytes;
      measure({ area: 'film', id: FILM.glb.id, subject: `GLB ${basename(glbPath)}`, actual: kb(bytes), limit: FILM.glb.maxKb });
      if (g.error) violation({ area: 'film', id: FILM.glb.id, subject: `GLB ${basename(glbPath)}: ${g.error}` });
      else {
        measure({ area: 'film', id: FILM.glb.id, subject: `GLB tam giác`, actual: g.triangles, limit: FILM.glb.maxTriangles, unit: 'tam giác' });
        measure({ area: 'film', id: FILM.glb.id, subject: `GLB draw call`, actual: g.drawCalls, limit: FILM.glb.maxDrawCalls, unit: 'draw call' });
        for (const t of g.ktx2) {
          measure({ area: 'film', id: FILM.ktx2.id, subject: `KTX2 nhúng "${t.name}" ${t.w}×${t.h}`, actual: Math.max(t.w, t.h), limit: FILM.ktx2.maxSize, unit: 'px' });
          if (Math.max(t.w, t.h) >= FILM.ktx2.largeAt) largeKtx2++;
        }
        if (g.extensions.includes('KHR_draco_mesh_compression')) violation({ area: 'film', id: FILM.glb.id, subject: 'GLB dùng Draco — cần decoder (cấm CDN); quy ước là meshopt', level: 'warn' });
      }
    }
    for (const f of filmFiles.filter((p) => p.endsWith('.ktx2'))) {
      const d = ktx2Dims(readFileSync(f));
      if (!d) continue;
      measure({ area: 'film', id: FILM.ktx2.id, subject: `KTX2 ${basename(f)} ${d.w}×${d.h}`, actual: Math.max(d.w, d.h), limit: FILM.ktx2.maxSize, unit: 'px' });
      if (Math.max(d.w, d.h) >= FILM.ktx2.largeAt) largeKtx2++;
      if (!referenced.has(f)) desktopBytes += bytesOf(f);
      referenced.add(f);
    }
    measure({ area: 'film', id: FILM.ktx2.id, subject: `số texture KTX2 lớn (cạnh ≥ ${FILM.ktx2.largeAt})`, actual: largeKtx2, limit: FILM.ktx2.maxLarge, unit: 'texture' });
    // Texture màn hình (AVIF/JPG, không KTX2) — tổng theo locale
    const texByLocale = new Map();
    for (const t of M.desktop?.textures ?? []) {
      const p = need(t.file, `texture ${t.id}`);
      if (!p) continue;
      const S = FILM.screenTextures;
      if (!S.formats.includes(extname(p).slice(1).toLowerCase())) violation({ area: 'film', id: S.id, subject: `texture ${t.id} ${basename(p)}: định dạng ${extname(p)} (chỉ ${S.formats.join('/')})` });
      const m = await meta(p);
      const limit = t.id === 'screenHold' ? S.screenHoldMax : S.screenMax;
      if (m && (m.width > limit.width || m.height > limit.height)) {
        violation({ area: 'film', id: S.id, subject: `texture ${t.id} ${basename(p)} ${m.width}×${m.height} > ${limit.width}×${limit.height}` });
      }
      const locales = t.locale ? [t.locale] : (M.locales ?? ['vi']);
      for (const l of locales) texByLocale.set(l, (texByLocale.get(l) ?? 0) + bytesOf(p));
    }
    for (const [l, bytes] of texByLocale) measure({ area: 'film', id: FILM.screenTextures.id, subject: `texture màn hình (${l})`, actual: kb(bytes), limit: FILM.screenTextures.totalKb });
    desktopBytes += Math.max(0, ...texByLocale.values());
    // HDRI
    if (M.desktop?.hdri?.file) {
      const p = need(M.desktop.hdri.file, 'HDRI');
      if (p) {
        desktopBytes += bytesOf(p);
        measure({ area: 'film', id: FILM.hdri.id, subject: `HDRI ${basename(p)}`, actual: kb(bytesOf(p)), limit: FILM.hdri.maxKb });
      }
    }
    // Tổng phim desktop (chặn trên: tầng T-FULL tải tối đa chừng này; T-LITE tải cùng bộ asset nếu manifest không tách)
    measure({ area: 'film', id: FILM.desktopTotal.id, subject: 'phim desktop T-FULL (chunk 3D + GLB + KTX2 + texture 1 locale + HDRI)', actual: kb(desktopBytes), limit: FILM.desktopTotal.tFullKb });
    measure({ area: 'film', id: FILM.desktopTotal.id, subject: 'phim desktop T-LITE (manifest không tách tầng → cùng bộ asset)', actual: kb(desktopBytes), limit: FILM.desktopTotal.tLiteKb, level: 'warn' });
    // Poster
    for (const p0 of M.posters ?? []) {
      const p = need(p0.file, `poster ${p0.id}`);
      if (!p) continue;
      const orient = p0.orientation === 'portrait' ? 'portrait' : 'landscape';
      const isAvif = /\.avif$/i.test(p) || p0.format === 'avif';
      measure({ area: 'film', id: FILM.posters.id, subject: `poster ${p0.id} ${orient} ${basename(p)}`, actual: kb(bytesOf(p)), limit: isAvif ? FILM.posters.maxKb[orient] : FILM.posters.maxKb[orient] * FILM.posters.jpgFactor, level: isAvif ? 'fail' : 'warn' });
    }
    // Video mobile: đọc file thật
    const V = FILM.mobileVideo;
    const firstSeen = new Set();
    for (const v of M.mobile ?? []) {
      const p = need(v.file, `video ${v.shot ?? ''}`);
      if (!p) continue;
      const info = inspectMp4(p);
      const bytes = bytesOf(p);
      const tag = `video ${basename(p)}`;
      if (info.error) violation({ area: 'film', id: V.id, subject: `${tag}: ${info.error}`, level: info.durationS ? 'warn' : 'fail' });
      if (info.durationS) measure({ area: 'film', id: V.id, subject: `${tag} tốc độ bit (${info.durationS.toFixed(2)} s)`, actual: kb(bytes / info.durationS), limit: V.maxKbPerSecond, unit: 'KB/s' });
      if (info.gop != null) measure({ area: 'film', id: V.id, subject: `${tag} GOP lớn nhất`, actual: info.gop, limit: V.maxGop, unit: 'khung' });
      if (info.width && !V.allowedSizes.some(([w, h]) => w === info.width && h === info.height)) {
        violation({ area: 'film', id: V.id, subject: `${tag}: khung ${info.width}×${info.height} (cho phép ${V.allowedSizes.map((s) => s.join('×')).join(', ')})` });
      }
      const key = `${v.locale ?? '*'}|${v.codec ?? info.codec}`;
      if (!firstSeen.has(key)) {
        firstSeen.add(key);
        measure({ area: 'film', id: V.id, subject: `${tag} = file đầu (${key})`, actual: kb(bytes), limit: V.firstShotKb });
      }
    }
    for (const f of filmFiles) {
      if (!referenced.has(f)) violation({ area: 'film', id: FILM.id, subject: `${rel(f) || f} không có trong manifest.json (asset ngoài ngân sách)`, level: 'warn' });
    }
  }
}

// ------------------------------------------------------------------------------------------------
// SỐNG: byte truyền trang chủ mobile (NFR-PERF-08)
// ------------------------------------------------------------------------------------------------
const live = [];
if (opts.live) {
  const L = B.live;
  const base = new URL(opts.live);
  if (L.blockedHosts.some((h) => base.hostname === h || base.hostname.endsWith(`.${h}`)) || /prod/i.test(base.hostname)) {
    die(`--live ${base.origin}: KHÔNG đo trên production — chỉ localhost/staging`);
  }
  const { chromium } = await import('playwright-core');
  const executablePath = process.env.CHROMIUM_PATH ?? L.chromiumPath;
  const LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH ?? L.ldLibraryPath;
  const browser = await chromium.launch({ executablePath, env: { ...process.env, LD_LIBRARY_PATH }, args: ['--no-sandbox'] });
  try {
    for (const path of L.paths) {
      for (const prof of L.profiles) {
        try {
          const context = await browser.newContext({
            viewport: prof.viewport,
            deviceScaleFactor: prof.deviceScaleFactor,
            isMobile: prof.isMobile,
            hasTouch: prof.hasTouch,
            userAgent: prof.userAgent,
            serviceWorkers: 'block',
          });
          const page = await context.newPage();
          const pending = [];
          let counting = true;
          page.on('requestfinished', (req) => {
            if (!counting) return;
            pending.push(
              req
                .sizes()
                .then((s) => ({ url: req.url(), type: req.resourceType(), bytes: s.responseBodySize + s.responseHeadersSize }))
                .catch(() => null),
            );
          });
          const url = new URL(path, base).href;
          const res = await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
          await page.waitForTimeout(L.waitAfterLoadMs);
          counting = false;
          const rows = (await Promise.all(pending)).filter(Boolean);
          await context.close();
          const total = rows.reduce((a, r) => a + r.bytes, 0);
          const byTypeBytes = {};
          for (const r of rows) byTypeBytes[r.type] = (byTypeBytes[r.type] ?? 0) + r.bytes;
          const byType = Object.fromEntries(Object.entries(byTypeBytes).sort((a, b) => b[1] - a[1]).map(([t, v]) => [t, kb(v)]));
          const top = [...rows].sort((a, b) => b.bytes - a.bytes).slice(0, 6).map((r) => ({ kb: kb(r.bytes), type: r.type, url: r.url.replace(base.origin, '') }));
          live.push({ path, profile: prof.name, status: res?.status(), requests: rows.length, kb: kb(total), byType, top });
          measure({ area: 'live', id: L.id, subject: `${path} @${prof.name}: byte truyền tới load + ${L.waitAfterLoadMs / 1000} s (${rows.length} request)`, actual: kb(total), limit: L.homeMobileMaxKb, level: L.level });
        } catch (err) {
          violation({ area: 'live', id: L.id, subject: `${path} @${prof.name}: không đo được (${err.message.split('\n')[0]})`, level: L.level });
        }
      }
    }
  } finally {
    await browser.close();
  }
}

// ------------------------------------------------------------------------------------------------
// Báo cáo
// ------------------------------------------------------------------------------------------------
if (imgCacheDirty) {
  mkdirSync(dirname(IMG_CACHE_FILE), { recursive: true });
  writeFileSync(IMG_CACHE_FILE, JSON.stringify(imgCache, null, 1));
}
if (unknownCss.size) notes.push(`CSS không hiểu (coi như không khớp/100vw): ${[...unknownCss].slice(0, 5).join(' · ')}`);
notes.push('Không kiểm tĩnh được: T-LITE/shot 0–1 thật, VRAM, frame time, tua video (NFR-PERF-09…13) — đo bằng Playwright/máy thật.');

const fails = checks.filter((c) => !c.ok && c.level === 'fail');
const warns = checks.filter((c) => !c.ok && c.level === 'warn');
const report = {
  dist: rel(DIST),
  budgets: { file: rel(opts.budgetsPath), version: B.version, updated: B.updated },
  generatedAt: new Date().toISOString(),
  pages: pages.sort((a, b) => a.route.localeCompare(b.route)),
  chunk3d: chunk3dInfo,
  film: filmInfo,
  live,
  failures: fails,
  warnings: warns,
  notes,
  checks,
};
writeFileSync(join(DIST, 'budget-report.json'), JSON.stringify(report, null, 2));

if (opts.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const pad = (s, n) => String(s ?? '—').padEnd(n);
  const padL = (s, n) => String(s ?? '—').padStart(n);
  const [vm, vd] = B.images.viewports.map((v) => v.name);
  console.log(`\n[budget] ${rel(DIST)} · ${pages.length} trang · ${rel(opts.budgetsPath)} v${B.version} (${B.updated}) · KB = 1024 byte, gz = gzip -9`);
  console.log(
    `${pad('trang (đường dẫn nội bộ)', 60)}${padL('JS', 7)}${padL('CSS', 6)}${padL('HTML', 7)}${padL(`ảnh ${vm}`, 12)}${padL(`ảnh ${vd}`, 13)}${padL('font', 6)}${padL('ảnh pl', 8)}`,
  );
  console.log(
    `${pad(`ngân sách (fail/warn)`, 60)}${padL(B.firstLoadJs.maxGzKb, 7)}${padL(B.css.maxGzKb, 6)}${padL(`${B.html.maxGzKb}w`, 7)}${padL(B.images.maxKb[vm], 12)}${padL(B.images.maxKb[vd], 13)}${padL(`=${B.fonts.preloadCount}`, 6)}${padL(`≤${B.images.maxPreload}`, 8)}`,
  );
  for (const p of pages) {
    const mark = (v, lim) => (v != null && lim != null && v > lim ? '*' : ' ');
    const img = (x, lim) => (x ? `${x.kb}${mark(x.kb, lim)}` : '—');
    console.log(
      `${pad(p.route, 60)}${padL(p.jsGzKb + mark(p.jsGzKb, B.firstLoadJs.maxGzKb), 7)}${padL(p.cssGzKb + mark(p.cssGzKb, B.css.maxGzKb), 6)}${padL(
        p.htmlGzKb + mark(p.htmlGzKb, B.html.maxGzKb),
        7,
      )}${padL(img(p.largest[vm], B.images.maxKb[vm]), 12)}${padL(img(p.largest[vd], B.images.maxKb[vd]), 13)}${padL(p.fontPreloads, 6)}${padL(p.imagePreloads, 8)}`,
    );
  }
  console.log(
    chunk3d.size
      ? `\nChunk 3D: ${chunk3dInfo.gzKb} KB gz (ngân sách ${C3.maxGzKb}) — ${chunk3dInfo.files.map((f) => `${basename(f.file)} ${f.gzKb}${f.libs.length ? ' [' + f.libs.join(',') + ']' : ''}`).join(' · ')}`
      : `\nChunk 3D: chưa có (${chunk3dInfo.groups} nhóm import động, không nhóm nào chứa ${C3.libraries.join('/')})`,
  );
  for (const l of live) {
    console.log(`Live ${l.path} @${l.profile}: ${l.kb} KB / ${l.requests} request (HTTP ${l.status}) · ${Object.entries(l.byType).map(([t, v]) => `${t} ${v}`).join(' · ')}`);
    for (const t of l.top) console.log(`    ${padL(t.kb, 7)} KB  ${pad(t.type, 11)}${t.url.slice(0, 100)}`);
  }
  for (const n of notes) console.log(`Ghi chú: ${n}`);
  const fmt = (c) => `${c.id ? `[${c.id}] ` : ''}${c.subject}${c.actual != null ? `: ${c.actual} ${c.unit} > ${c.limit} ${c.unit}` : ''}${c.note ? ` — ${c.note}` : ''}`;
  if (warns.length) {
    console.log(`\nCẢNH BÁO (${warns.length}):`);
    for (const c of warns) console.log(`  WARN ${fmt(c)}`);
  }
  if (fails.length) {
    console.log(`\nVƯỢT NGÂN SÁCH (${fails.length}):`);
    for (const c of fails) console.log(`  FAIL ${fmt(c)}`);
  }
  console.log(`\n[budget] ${fails.length ? 'FAIL' : 'PASS'} — ${checks.length} mục kiểm, ${fails.length} fail, ${warns.length} cảnh báo · báo cáo: ${rel(join(DIST, 'budget-report.json'))}\n`);
}
process.exit(fails.length ? 1 : 0);
