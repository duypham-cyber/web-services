// Proxy trước `next start` cho hai bản chạy trên bbsw (docs/PREVIEW.md, D-21, D-30):
//   - bản trưng bày công khai (services.bluebolt.software qua openresty): :9515 → localhost:3092, PREVIEW_AUTH=off
//   - bản nháp nội bộ có mật khẩu: :9516 → localhost:3097, PREVIEW_AUTH=basic (Basic Auth cho TOÀN site, kể cả /_next/* và
//     ảnh, để trình duyệt không bật hộp đăng nhập giữa chừng khi Next nạp trước trang)
// Cả hai luôn gắn X-Robots-Tag noindex (tắt bằng PREVIEW_NOINDEX=0 khi tên miền này thành tên miền chính thức).
// Chỉ dùng module có sẵn của Node. Cấu hình đọc từ biến môi trường (systemd nạp từ .env.public / .env.preview, không commit):
//   PREVIEW_PORT, PREVIEW_LISTEN_HOST (mặc định 0.0.0.0), PREVIEW_TARGET_HOST/PORT, PREVIEW_AUTH=basic|off,
//   PREVIEW_USER/PASSWORD, PREVIEW_NOINDEX, PREVIEW_TRUSTED_PROXIES (IP được tin X-Forwarded-*/X-Real-IP, vd openresty),
//   PREVIEW_HSTS (vd "max-age=300"; chỉ gửi khi proxy tin cậy báo https).
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.PREVIEW_PORT || 9515);
const LISTEN_HOST = process.env.PREVIEW_LISTEN_HOST || '0.0.0.0';
const TARGET_HOST = process.env.PREVIEW_TARGET_HOST || 'localhost'; // localhost, không phải 127.0.0.1 (D-09)
const TARGET_PORT = Number(process.env.PREVIEW_TARGET_PORT || 3092);
const AUTH = (process.env.PREVIEW_AUTH || 'basic').toLowerCase();
const USER = process.env.PREVIEW_USER || 'bluebolt';
const PASS = process.env.PREVIEW_PASSWORD;
const NOINDEX = process.env.PREVIEW_NOINDEX === '0' ? null : 'noindex, nofollow, noarchive';
const TRUSTED = new Set(
  (process.env.PREVIEW_TRUSTED_PROXIES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);
const HSTS = process.env.PREVIEW_HSTS || '';
const MAX_TARGET = 2048; // URL dài hơn → 414 (tránh header phản hồi phình làm openresty trả 502)
const UPSTREAM_TIMEOUT_MS = 30_000;
const MIN_CSP = "frame-ancestors 'self'; object-src 'none'; base-uri 'self'";
// Header nối chuyển (RFC 9110 §7.6.1) + header client tự khai về proxy — không chuyển lên upstream
const HOP_BY_HOP = ['connection', 'keep-alive', 'proxy-authorization', 'proxy-connection', 'te', 'trailer', 'upgrade'];
const CLIENT_FORWARDING = ['x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host', 'x-forwarded-port', 'x-real-ip', 'forwarded'];

if (AUTH !== 'off' && AUTH !== 'basic') {
  console.error(`[preview] PREVIEW_AUTH phải là "basic" hoặc "off" (đang là "${AUTH}")`);
  process.exit(1);
}
if (AUTH === 'basic' && (!PASS || PASS.length < 16)) {
  console.error('[preview] Thiếu PREVIEW_PASSWORD (≥ 16 ký tự) khi PREVIEW_AUTH=basic');
  process.exit(1);
}

const expected = AUTH === 'basic' ? Buffer.from('Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64')) : null;
const authorized = (header) => {
  if (!expected) return true;
  if (!header) return false;
  const got = Buffer.from(header);
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
};
// Location tuyệt đối trỏ về chính upstream → đổi thành đường dẫn tương đối (neo ranh giới cổng để không ăn lẹm "/…")
const upstreamOrigin = new RegExp(`^https?://(localhost|127\\.0\\.0\\.1):${TARGET_PORT}(?=[/?#]|$)`);
const withNoindex = (h) => (NOINDEX ? { ...h, 'x-robots-tag': NOINDEX } : h);
const peer = (req) => (req.socket.remoteAddress || '').replace(/^::ffff:/, '');

function plain(res, status, text, extra = {}) {
  if (!res.headersSent) {
    res.writeHead(status, withNoindex({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...extra }));
  }
  res.end(text);
}

function validTarget(url) {
  if (!url || url[0] !== '/' || url.startsWith('//') || url.length > MAX_TARGET) return false;
  try {
    decodeURIComponent(url.split('?')[0]);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  if (!authorized(req.headers.authorization)) {
    plain(res, 401, 'Cần đăng nhập để xem bản nháp nội bộ.', {
      'WWW-Authenticate': 'Basic realm="Bluebolt Services - ban nhap noi bo", charset="UTF-8"',
    });
    return;
  }
  if (!validTarget(req.url)) {
    plain(res, req.url && req.url.length > MAX_TARGET ? 414 : 400, 'Đường dẫn không hợp lệ.');
    return;
  }

  const ip = peer(req);
  const trusted = TRUSTED.has(ip);
  const headers = { ...req.headers };
  delete headers.authorization;
  const connectionListed = String(req.headers.connection || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  for (const h of [...HOP_BY_HOP, ...connectionListed]) delete headers[h];
  if (!trusted) for (const h of CLIENT_FORWARDING) delete headers[h];
  // chuỗi X-Forwarded-For: chỉ nối thêm IP của bên vừa gọi tới proxy; phần trước chỉ giữ khi bên đó là proxy tin cậy
  headers['x-forwarded-for'] = headers['x-forwarded-for'] ? `${headers['x-forwarded-for']}, ${ip}` : ip;
  headers['x-forwarded-proto'] = (trusted && req.headers['x-forwarded-proto']) || 'http';
  headers['x-forwarded-host'] = (trusted && req.headers['x-forwarded-host']) || req.headers.host || '';
  if (!trusted) headers['x-real-ip'] = ip;
  const https = headers['x-forwarded-proto'] === 'https';

  const upstream = http.request(
    { host: TARGET_HOST, port: TARGET_PORT, method: req.method, path: req.url, headers },
    (up) => {
      const out = withNoindex({ ...up.headers });
      if (out.location) {
        let loc = String(out.location).replace(upstreamOrigin, '');
        if (loc === '') loc = '/';
        if (/^\/[/\\]/.test(loc)) loc = '/'; // không bao giờ trả "//miền-khác" (protocol-relative) hay "/\…"
        out.location = loc;
      }
      if (AUTH === 'off') {
        if (!out['content-security-policy']) out['content-security-policy'] = MIN_CSP;
        if (HSTS && https) out['strict-transport-security'] = HSTS;
      }
      res.writeHead(up.statusCode || 502, out);
      up.pipe(res);
    },
  );
  upstream.setTimeout(UPSTREAM_TIMEOUT_MS, () => upstream.destroy(Object.assign(new Error('upstream timeout'), { code: 'ETIMEDOUT' })));
  upstream.on('error', (err) => {
    console.error(`[preview] upstream ${TARGET_HOST}:${TARGET_PORT} lỗi: ${err.code || err.message}`);
    plain(res, err.code === 'ETIMEDOUT' ? 504 : 502, 'Website đang khởi động lại, vui lòng tải lại trang sau ít giây.');
  });
  res.on('close', () => {
    if (!res.writableFinished) upstream.destroy();
  });
  req.pipe(upstream);
});

server.listen(PORT, LISTEN_HOST, () => {
  const mode = AUTH === 'basic' ? `Basic Auth, user "${USER}"` : 'công khai, không mật khẩu';
  const extra = [NOINDEX ? 'noindex' : null, TRUSTED.size ? `tin X-Forwarded-* từ ${[...TRUSTED].join(',')}` : null, HSTS ? 'HSTS' : null]
    .filter(Boolean)
    .join(', ');
  process.stdout.write(`[preview] ${LISTEN_HOST}:${PORT} → http://${TARGET_HOST}:${TARGET_PORT} (${mode}${extra ? ', ' + extra : ''})\n`);
});
