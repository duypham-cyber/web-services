#!/usr/bin/env node
/**
 * check-redirects.mjs — kiểm N/N URL trong redirect-inventory.csv (NFR-SEO-01, AC-301-1…3, AC-R-4).
 * Chạy được với BASE_URL bất kỳ; chỉ dùng node:http/https (không phụ thuộc gói ngoài).
 *
 *   node scripts/check-redirects.mjs                                    # dev server dùng chung (tầng Next)
 *   BASE_URL=http://127.0.0.1:3092 node scripts/check-redirects.mjs     # bản build production (next start)
 *   BASE_URL=https://lapdattoanquoc.vn node scripts/check-redirects.mjs # production qua openresty: 4 biến thể
 *   BASE_URL=https://lapdattoanquoc.vn node scripts/check-redirects.mjs --connect-to=127.0.0.1 --http-port=18080 \
 *     --https-port=18443 --insecure                                      # thử cấu hình openresty ở máy local
 *
 * Với mỗi dòng: biến thể http/https × www/apex (chỉ khi BASE_URL là tên miền thật, --variants=all) × có/không "/" cuối
 * (+ một lần có query ?utm_source=check để kiểm giữ query):
 *   - redirect → 301, ĐÚNG 1 hop, Location = https://<apex><to> (giữ query); đích trả 200 (tắt: --no-targets)
 *   - gone     → 410 ở mọi biến thể
 *   - keep     → URL chuẩn trả 200; biến thể khác 301 một hop về URL chuẩn
 * Tầng Next (BASE_URL là 127.0.0.1/localhost, --next): biến thể "/" cuối được phép đi 2 bước (308 rồi 301) và ảnh
 * "gone" được phép 404 — openresty xử lý 1 hop/410 ở production (docs/DECISIONS.md D-17).
 * Tùy chọn khác: --only=S10,A01 · --json · --concurrency=4. Exit 1 nếu có dòng sai.
 */
import { readFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};

const BASE = new URL(process.env.BASE_URL || 'http://127.0.0.1:3091');
const LOCAL = ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(BASE.hostname);
const NEXT_MODE = opt('next', false) === true || LOCAL;
const VARIANTS = opt('variants', LOCAL ? 'base' : 'all');
const CONNECT_TO = opt('connect-to', null);
const HTTP_PORT = Number(opt('http-port', 80));
const HTTPS_PORT = Number(opt('https-port', 443));
const INSECURE = opt('insecure', false) === true;
const CHECK_TARGETS = opt('no-targets', false) !== true;
const ONLY = typeof opt('only', null) === 'string' ? new Set(String(opt('only')).split(',')) : null;
const JSON_OUT = opt('json', false) === true;
const CONCURRENCY = Number(opt('concurrency', 4));

const APEX = BASE.hostname.replace(/^www\./, '');
const CANONICAL_ORIGIN = VARIANTS === 'all' ? `https://${APEX}` : BASE.origin;

// ---------------------------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------------------------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell || row.length) rows.push([...row, cell]);
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

const inventory = parseCsv(readFileSync(join(ROOT, 'redirect-inventory.csv'), 'utf8')).filter(
  (r) => !ONLY || ONLY.has(r.id),
);

// ---------------------------------------------------------------------------------------------
// HTTP (không theo redirect)
// ---------------------------------------------------------------------------------------------
function request(url, method = 'GET') {
  const u = new URL(url);
  const secure = u.protocol === 'https:';
  const lib = secure ? https : http;
  const port = CONNECT_TO ? (secure ? HTTPS_PORT : HTTP_PORT) : Number(u.port || (secure ? 443 : 80));
  return new Promise((resolve) => {
    const req = lib.request(
      {
        host: CONNECT_TO || u.hostname,
        port,
        method,
        path: `${u.pathname}${u.search}`,
        headers: { Host: u.host, 'User-Agent': 'bluebolt-check-redirects/1.0', Accept: '*/*' },
        servername: u.hostname,
        rejectUnauthorized: !INSECURE,
        timeout: 60_000,
      },
      (res) => {
        res.resume();
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, location: res.headers.location ?? null, type: res.headers['content-type'] ?? '' }),
        );
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (err) => resolve({ status: 0, location: null, type: '', error: err.message }));
    req.end();
  });
}

const absolute = (location, from) => (location ? new URL(location, from).href : null);

// ---------------------------------------------------------------------------------------------
// Biến thể và kỳ vọng
// ---------------------------------------------------------------------------------------------
function origins() {
  if (VARIANTS !== 'all') return [{ origin: BASE.origin, canonical: true }];
  return [
    { origin: `https://${APEX}`, canonical: true },
    { origin: `http://${APEX}`, canonical: false },
    { origin: `https://www.${APEX}`, canonical: false },
    { origin: `http://www.${APEX}`, canonical: false },
  ];
}

function cases(row) {
  const list = [];
  const hasExt = /\.[a-z0-9]+$/i.test(row.from);
  for (const o of origins()) {
    list.push({ url: `${o.origin}${row.from}`, canonical: o.canonical, slash: false, query: '' });
    if (row.from !== '/' && !hasExt) list.push({ url: `${o.origin}${row.from}/`, canonical: false, slash: true, query: '' });
  }
  list.push({ url: `${CANONICAL_ORIGIN}${row.from}?utm_source=check`, canonical: true, slash: false, query: '?utm_source=check' });
  return list;
}

const targetCache = new Map();
async function targetOk(url) {
  if (!CHECK_TARGETS) return { ok: true };
  if (!targetCache.has(url)) targetCache.set(url, request(url));
  const res = await targetCache.get(url);
  return res.status === 200 ? { ok: true } : { ok: false, why: `đích ${url} trả ${res.status}${res.location ? ` → ${res.location}` : ''}` };
}

async function checkCase(row, c) {
  const res = await request(c.url);
  if (res.error) return { ok: false, why: `lỗi kết nối: ${res.error}` };
  const loc = absolute(res.location, c.url);
  const expectedTo = (to) => `${CANONICAL_ORIGIN}${to}${c.query}`;

  if (row.kind === 'gone') {
    if (res.status === 410) return { ok: true };
    if (NEXT_MODE && res.status === 404 && /\.[a-z0-9]+$/i.test(row.from)) return { ok: true, note: '404 ở tầng Next (openresty trả 410)' };
    if (NEXT_MODE && c.slash && res.status === 308 && loc === `${BASE.origin}${row.from}`) {
      const second = await request(loc);
      return second.status === 410 ? { ok: true, note: '308 → 410 (2 bước ở tầng Next)' } : { ok: false, why: `308 → ${second.status}` };
    }
    return { ok: false, why: `trả ${res.status}, cần 410` };
  }

  const want = row.kind === 'redirect' ? expectedTo(row.to) : c.canonical && !c.slash ? null : expectedTo(row.from === '/' ? '/' : row.from);

  if (row.kind === 'keep' && want === null) {
    if (res.status !== 200) return { ok: false, why: `URL chuẩn trả ${res.status}${loc ? ` → ${loc}` : ''}, cần 200` };
    if (row.source === 'og-image' && !/^image\//.test(res.type)) return { ok: false, why: `content-type ${res.type}, cần image/*` };
    return { ok: true };
  }

  // Cần 301 một hop tới `want`
  if (res.status === 301 && loc === want) {
    const t = await targetOk(want);
    return t.ok ? { ok: true } : { ok: false, why: t.why };
  }
  if (NEXT_MODE && c.slash && (res.status === 308 || res.status === 301) && loc) {
    // Tầng Next: bỏ "/" cuối (308) rồi mới tới bảng 301 → chấp nhận 2 bước nếu bước 2 đúng
    const second = await request(loc);
    const loc2 = absolute(second.location, loc);
    if (loc === want && res.status === 308) return { ok: true, note: '308 thay vì 301 (tầng Next; openresty trả 301)' };
    if (second.status === 301 && loc2 === want) return { ok: true, note: '2 bước ở tầng Next (openresty: 1 hop)' };
    return { ok: false, why: `${res.status} → ${loc} → ${second.status} ${loc2 ?? ''}, cần → ${want}` };
  }
  return { ok: false, why: `trả ${res.status}${loc ? ` → ${loc}` : ''}, cần 301 → ${want}` };
}

// ---------------------------------------------------------------------------------------------
// Chạy song song có giới hạn
// ---------------------------------------------------------------------------------------------
const jobs = inventory.flatMap((row) => cases(row).map((c) => ({ row, c })));
const results = [];
let cursor = 0;
await Promise.all(
  Array.from({ length: Math.max(1, CONCURRENCY) }, async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor];
      cursor += 1;
      const outcome = await checkCase(job.row, job.c);
      results.push({ id: job.row.id, kind: job.row.kind, url: job.c.url, ...outcome });
    }
  }),
);

results.sort((a, b) => a.id.localeCompare(b.id) || a.url.localeCompare(b.url));
const failed = results.filter((r) => !r.ok);
const notes = results.filter((r) => r.ok && r.note);
if (JSON_OUT) {
  console.log(JSON.stringify({ base: BASE.origin, variants: VARIANTS, next: NEXT_MODE, total: results.length, failed, notes }, null, 2));
} else {
  console.log(
    `[check-redirects] ${BASE.origin} · biến thể: ${VARIANTS}${NEXT_MODE ? ' · tầng Next' : ''}${CONNECT_TO ? ` · connect-to ${CONNECT_TO}` : ''}`,
  );
  console.log(`[check-redirects] ${inventory.length} dòng · ${results.length} request · ${failed.length} lỗi · ${notes.length} ghi chú`);
  for (const f of failed) console.log(`  ✗ ${f.id} ${f.url} — ${f.why}`);
  if (notes.length > 0) {
    const grouped = new Map();
    for (const n of notes) grouped.set(n.note, (grouped.get(n.note) ?? 0) + 1);
    for (const [note, count] of grouped) console.log(`  · ${count}× ${note}`);
  }
}
process.exit(failed.length > 0 ? 1 : 0);
