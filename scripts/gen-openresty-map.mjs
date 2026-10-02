#!/usr/bin/env node
/**
 * gen-openresty-map.mjs — sinh cấu hình openresty + bảng kiểm kê URL từ content/redirects.ts (nguồn duy nhất).
 *
 *   node scripts/gen-openresty-map.mjs                 # ghi deploy/openresty/lapdattoanquoc.conf + redirect-inventory.csv
 *   node scripts/gen-openresty-map.mjs --check         # chỉ so sánh; khác file đang có → exit 1 (CI, tests/seo)
 *   node scripts/gen-openresty-map.mjs --legacy-http2  # nginx < 1.25.1: "listen 443 ssl http2" thay cho "http2 on"
 *
 * Cấu hình theo mẫu docs/04 mục 2.7, ĐÃ SỬA 2 lỗi contracts/lead-b2b.md mục 3.8:
 *   1. limit_req_zone rate=5r/10m không hợp lệ → rate=1r/m + burst=4 nodelay (lớp thô; giới hạn đúng 5 lần/10 phút ở app).
 *   2. location = /api/v1/leads không có proxy_set_header → app không thấy IP thật → thêm X-Real-IP/X-Forwarded-For.
 * Mọi chuyển hướng là 301 ĐÚNG 1 HOP: http→https, www→apex, "/" cuối và URL cũ → mới gộp trong một lần trả lời.
 * File sinh ra được include TRONG khối http{} (vd /etc/openresty/conf.d/ hoặc sites-enabled/).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadTs, ROOT } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const LEGACY_HTTP2 = args.includes('--legacy-http2');

const APEX = 'lapdattoanquoc.vn';
const CONF_PATH = join(ROOT, 'deploy/openresty/lapdattoanquoc.conf');
const CSV_PATH = join(ROOT, 'redirect-inventory.csv');

const { legacyRedirects, legacyAssets } = await loadTs('content/redirects.ts');

// ---------------------------------------------------------------------------------------------
// Kiểm dữ liệu trước khi sinh (không phụ thuộc zod — chạy được ở máy deploy chỉ có node + typescript)
// ---------------------------------------------------------------------------------------------
const problems = [];
const seen = new Set();
const pathOk = (p) => typeof p === 'string' && /^\/[A-Za-z0-9/_.-]*$/.test(p) && (p === '/' || !p.endsWith('/'));
for (const r of [...legacyRedirects, ...legacyAssets]) {
  if (!pathOk(r.from)) problems.push(`from không hợp lệ: ${r.from}`);
  if (seen.has(r.from)) problems.push(`trùng from: ${r.from}`);
  seen.add(r.from);
  if (r.kind === 'redirect' && (!pathOk(r.to) || r.to === r.from)) problems.push(`redirect thiếu đích: ${r.from}`);
  if (r.kind === 'gone' && r.to !== null) problems.push(`gone phải có to = null: ${r.from}`);
  if (r.kind === 'keep' && r.to !== r.from) problems.push(`keep phải có to = from: ${r.from}`);
}
// Không có chuỗi chuyển hướng: đích của dòng redirect không được là nguồn của dòng redirect/gone khác
const sources = new Map([...legacyRedirects, ...legacyAssets].map((r) => [r.from, r.kind]));
for (const r of [...legacyRedirects, ...legacyAssets]) {
  if (r.kind === 'redirect' && ['redirect', 'gone'].includes(sources.get(r.to))) problems.push(`chuỗi 2 hop: ${r.from} → ${r.to}`);
}
if (problems.length > 0) {
  console.error(`[gen-openresty-map] content/redirects.ts không hợp lệ:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------------------------
// redirect-inventory.csv
// ---------------------------------------------------------------------------------------------
const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const statusOf = (kind) => (kind === 'redirect' ? 301 : kind === 'gone' ? 410 : 200);
const csvRows = [
  ['id', 'source', 'from', 'to', 'expected_status', 'kind', 'note'],
  ...legacyRedirects.map((r) => [`S${String(r.n).padStart(2, '0')}`, 'sitemap', r.from, r.to ?? '', statusOf(r.kind), r.kind, r.note ?? '']),
  ...legacyAssets.map((r, i) => [`A${String(i + 1).padStart(2, '0')}`, 'og-image', r.from, r.to ?? '', statusOf(r.kind), r.kind, r.note]),
];
const csv = `${csvRows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;

// ---------------------------------------------------------------------------------------------
// deploy/openresty/lapdattoanquoc.conf
// ---------------------------------------------------------------------------------------------
const pad = (s, n) => (s.length >= n ? `${s} ` : s.padEnd(n));
const redirects = [...legacyRedirects, ...legacyAssets].filter((r) => r.kind === 'redirect');
const gones = [...legacyRedirects, ...legacyAssets].filter((r) => r.kind === 'gone');
const width = Math.max(...redirects.map((r) => r.from.length), ...gones.map((r) => r.from.length)) + 2;
const maxKey = width - 2;

const listen443 = LEGACY_HTTP2
  ? '    listen 443 ssl http2;\n    listen [::]:443 ssl http2;'
  : '    listen 443 ssl;\n    listen [::]:443 ssl;\n    http2 on;';

const GONE_HTML = {
  vi:
    '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>410 — Trang đã được gỡ</title></head>' +
    '<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;color:#0F172A"><h1>Trang này đã được gỡ</h1>' +
    '<p>Nội dung không còn trên lapdattoanquoc.vn.</p><p><a href="/" style="color:#004AAD">Về trang chủ Bluebolt Services</a></p></body></html>',
  en:
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>410 — Page removed</title></head>' +
    '<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;color:#0F172A"><h1>This page has been removed</h1>' +
    '<p>This content is no longer available on lapdattoanquoc.vn.</p><p><a href="/en" style="color:#004AAD">Go to the Bluebolt Services home page</a></p></body></html>',
};
const nginxString = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const conf = `# =============================================================================================================
# lapdattoanquoc.vn — openresty (nginx) — TỆP SINH TỰ ĐỘNG, KHÔNG SỬA TAY
# Nguồn: content/redirects.ts → node scripts/gen-openresty-map.mjs (kiểm: --check). Mẫu: docs/04 mục 2.7.
# Include TRONG khối http{}. Trước khi áp: \`openresty -V\` (nginx ≥ 1.25.1 mới hiểu "http2 on;", bản cũ hơn chạy lại
# script với --legacy-http2), \`openresty -t\`, rồi \`openresty -s reload\`. Sau khi áp: scripts/check-redirects.mjs.
# Cần thêm: deploy/openresty/snippets/*.conf → /etc/openresty/snippets/ (đường dẫn include bên dưới), chứng chỉ có SAN www.
# =============================================================================================================

# Khóa map dài (≤ ${maxKey} ký tự) → tăng bucket (nếu nginx.conf chính đã đặt directive này thì xóa dòng dưới)
map_hash_bucket_size 128;

# --- Chuẩn hóa "/" cuối trước khi tra bảng: /news/ và /en/intro/ cũng chỉ 1 hop --------------------------------
map $uri $bb_norm {
    ~^(?<bb_p>.+?)/+$ $bb_p;
    default $uri;
}

# --- URL cũ → mới (${redirects.length} dòng: ${legacyRedirects.filter((r) => r.kind === 'redirect').length} trang từ sitemap cũ + ${legacyAssets.filter((r) => r.kind === 'redirect').length} ảnh og:image) ---
map $bb_norm $bb_new_uri {
    default "";
${redirects.map((r) => `    ${pad(r.from, width)}${r.to};`).join('\n')}
}

# --- 410 Gone (${gones.length} dòng: bài AI VI/EN — giả định Q10, chờ anh Duy — và ảnh đã gỡ) ------------------------
map $bb_norm $bb_gone {
    default 0;
${gones.map((r) => `    ${pad(r.from, width)}1;`).join('\n')}
}

# --- Đích cuối cho http→https / www→apex: URL cũ thì về URL mới, còn lại giữ đường dẫn đã bỏ "/" cuối ----------
map $bb_new_uri $bb_dest {
    "" $bb_norm;
    default $bb_new_uri;
}

# --- Đường dẫn (khác "/") kết thúc bằng "/" → 301 về bản không "/" (AC-R-4) --------------------------------------
map $uri $bb_trailing_slash {
    ~^/.+/$ 1;
    default 0;
}

# --- Ngôn ngữ của trang 410 ------------------------------------------------------------------------------------
map $bb_norm $bb_gone_lang {
    ~^/en(/|$) en;
    default vi;
}

# --- Rate limit form lead (contracts/lead-b2b.md 3.8): lớp THÔ ở openresty; giới hạn chính xác 5 lần/10 phút ở app.
#     rate=5r/10m KHÔNG hợp lệ (limit_req_zone chỉ nhận số nguyên r/s hoặc r/m) → 1r/m + burst 4 = 5 request dồn ngay.
limit_req_zone $binary_remote_addr zone=bb_leads:1m rate=1r/m;

upstream bb_web {
    server 127.0.0.1:3000;   # Next standalone (Docker) — chỉ loopback, không mở cổng ra Internet
    keepalive 16;
}

# --- :80 → https apex, 1 hop, áp luôn bảng URL cũ ---------------------------------------------------------------
server {
    listen 80;
    listen [::]:80;
    server_name ${APEX} www.${APEX};
    server_tokens off;

    error_page 410 @bb_gone;
    if ($bb_gone) { return 410; }
    return 301 https://${APEX}$bb_dest$is_args$args;

    location @bb_gone {
        default_type text/html;
        charset utf-8;
        add_header X-Robots-Tag "noindex" always;
        if ($bb_gone_lang = en) { return 410 ${nginxString(GONE_HTML.en)}; }
        return 410 ${nginxString(GONE_HTML.vi)};
    }
}

# --- www → apex (hiện trả 502). Cần chứng chỉ có SAN www -----------------------------------------------------------
server {
${listen443}
    server_name www.${APEX};
    server_tokens off;
    ssl_certificate     /etc/ssl/${APEX}/fullchain.pem;
    ssl_certificate_key /etc/ssl/${APEX}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    include snippets/bb-security-headers.conf;

    error_page 410 @bb_gone;
    if ($bb_gone) { return 410; }
    return 301 https://${APEX}$bb_dest$is_args$args;

    location @bb_gone {
        default_type text/html;
        charset utf-8;
        include snippets/bb-security-headers.conf;
        add_header X-Robots-Tag "noindex" always;
        if ($bb_gone_lang = en) { return 410 ${nginxString(GONE_HTML.en)}; }
        return 410 ${nginxString(GONE_HTML.vi)};
    }
}

# --- apex: site chính ---------------------------------------------------------------------------------------------
server {
${listen443}
    server_name ${APEX};
    server_tokens off;
    ssl_certificate     /etc/ssl/${APEX}/fullchain.pem;
    ssl_certificate_key /etc/ssl/${APEX}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # HSTS nâng dần: 300 → 86400 (sau 1 tuần) → 31536000 (sau 1 tháng, khi chắc www/subdomain đều https) — trong snippet
    include snippets/bb-security-headers.conf;
    proxy_hide_header X-Powered-By;

    error_page 410 @bb_gone;
    if ($bb_gone)                { return 410; }
    if ($bb_new_uri != "")       { return 301 https://${APEX}$bb_new_uri$is_args$args; }
    if ($bb_trailing_slash)      { return 301 https://${APEX}$bb_norm$is_args$args; }

    location @bb_gone {
        default_type text/html;
        charset utf-8;
        include snippets/bb-security-headers.conf;
        add_header X-Robots-Tag "noindex" always;
        if ($bb_gone_lang = en) { return 410 ${nginxString(GONE_HTML.en)}; }
        return 410 ${nginxString(GONE_HTML.vi)};
    }

    location /_next/static/ {                     # KHÔNG đặt expires: Next tự trả "immutable"
        include snippets/bb-proxy-headers.conf;
        proxy_pass http://bb_web;
    }

    location /film/ {                             # GLB, KTX2, video, poster (tên có hash)
        include snippets/bb-proxy-headers.conf;
        proxy_pass http://bb_web;
        include snippets/bb-security-headers.conf; # bắt buộc: location có add_header riêng không kế thừa từ server
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    # Form lead — chỉ có tác dụng khi /api/v1/leads được build (contracts/lead-b2b.md phải APPROVED trước)
    location = /api/v1/leads {
        limit_req zone=bb_leads burst=4 nodelay;
        limit_req_status 429;                     # mặc định nginx trả 503
        client_max_body_size 16k;
        error_page 429 = @leads_429;
        error_page 413 = @leads_413;
        include snippets/bb-proxy-headers.conf;   # X-Real-IP = $remote_addr: app CHỈ đọc header này (sửa lỗi 3.8 #2)
        proxy_set_header X-Correlation-Id $http_x_correlation_id;
        proxy_pass http://bb_web;
    }
    location @leads_429 {
        default_type application/json;
        include snippets/bb-security-headers.conf;
        add_header Retry-After 60 always;
        return 429 '{"success":false,"error":{"code":"RATE_LIMITED","message":"Too many requests","details":[]}}';
    }
    location @leads_413 {
        default_type application/json;
        include snippets/bb-security-headers.conf;
        return 413 '{"success":false,"error":{"code":"PAYLOAD_TOO_LARGE","message":"Payload too large","details":[]}}';
    }

    location / {
        include snippets/bb-proxy-headers.conf;
        proxy_pass http://bb_web;
    }
}
`;

// ---------------------------------------------------------------------------------------------
// Ghi hoặc kiểm
// ---------------------------------------------------------------------------------------------
const outputs = [
  [CONF_PATH, conf],
  [CSV_PATH, csv],
];
if (CHECK) {
  const stale = outputs.filter(([file, text]) => {
    try {
      return readFileSync(file, 'utf8') !== text;
    } catch {
      return true;
    }
  });
  if (stale.length > 0) {
    console.error(`[gen-openresty-map] chưa cập nhật: ${stale.map(([f]) => f.replace(`${ROOT}/`, '')).join(', ')} — chạy node scripts/gen-openresty-map.mjs`);
    process.exit(1);
  }
  console.log('[gen-openresty-map] deploy/openresty/lapdattoanquoc.conf và redirect-inventory.csv khớp content/redirects.ts');
} else {
  for (const [file, text] of outputs) writeFileSync(file, text);
  console.log(
    `[gen-openresty-map] ${redirects.length} redirect · ${gones.length} gone · ${csvRows.length - 1} dòng kiểm kê → ` +
      'deploy/openresty/lapdattoanquoc.conf, redirect-inventory.csv',
  );
}
