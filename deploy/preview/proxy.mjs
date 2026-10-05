// Proxy trước `next start` cho hai bản chạy trên bbsw (docs/PREVIEW.md, D-21, D-30):
//   - bản trưng bày công khai (services.bluebolt.software qua openresty): 0.0.0.0:9515 → localhost:3092, PREVIEW_AUTH=off
//   - bản nháp nội bộ có mật khẩu: 0.0.0.0:9516 → localhost:3097, PREVIEW_AUTH=basic (Basic Auth cho TOÀN site, kể cả
//     /_next/* và ảnh, để trình duyệt không bật hộp đăng nhập giữa chừng khi Next nạp trước trang)
// Cả hai luôn gắn X-Robots-Tag noindex (tắt bằng PREVIEW_NOINDEX=0 khi tên miền này thành tên miền chính thức).
// Chỉ dùng module có sẵn của Node. Cấu hình đọc từ biến môi trường (systemd nạp từ .env.public / .env.preview, không commit).
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.PREVIEW_PORT || 9515);
const TARGET_HOST = process.env.PREVIEW_TARGET_HOST || 'localhost'; // localhost, không phải 127.0.0.1 (D-09)
const TARGET_PORT = Number(process.env.PREVIEW_TARGET_PORT || 3092);
const AUTH = (process.env.PREVIEW_AUTH || 'basic').toLowerCase();
const USER = process.env.PREVIEW_USER || 'bluebolt';
const PASS = process.env.PREVIEW_PASSWORD;
const NOINDEX = process.env.PREVIEW_NOINDEX === '0' ? null : 'noindex, nofollow, noarchive';

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
const upstreamOrigin = new RegExp(`^https?://(localhost|127\\.0\\.0\\.1):${TARGET_PORT}`);
const withNoindex = (h) => (NOINDEX ? { ...h, 'x-robots-tag': NOINDEX } : h);

const server = http.createServer((req, res) => {
  if (!authorized(req.headers.authorization)) {
    res.writeHead(
      401,
      withNoindex({
        'WWW-Authenticate': 'Basic realm="Bluebolt Services - ban nhap noi bo", charset="UTF-8"',
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      }),
    );
    res.end('Cần đăng nhập để xem bản nháp nội bộ.');
    return;
  }
  const headers = { ...req.headers };
  delete headers.authorization;
  const clientIp = req.socket.remoteAddress || '';
  headers['x-forwarded-for'] = headers['x-forwarded-for'] ? `${headers['x-forwarded-for']}, ${clientIp}` : clientIp;
  // openresty kết thúc TLS và báo giao thức/tên miền gốc — giữ nguyên nếu có, không thì là HTTP trực tiếp
  headers['x-forwarded-proto'] = req.headers['x-forwarded-proto'] || 'http';
  headers['x-forwarded-host'] = req.headers['x-forwarded-host'] || req.headers.host || '';

  const upstream = http.request(
    { host: TARGET_HOST, port: TARGET_PORT, method: req.method, path: req.url, headers },
    (up) => {
      const out = withNoindex({ ...up.headers });
      if (out.location) out.location = String(out.location).replace(upstreamOrigin, '');
      res.writeHead(up.statusCode || 502, out);
      up.pipe(res);
    },
  );
  upstream.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, withNoindex({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }));
    }
    res.end(`Website đang khởi động lại, vui lòng tải lại trang sau ít giây (${err.code || 'upstream'}).`);
  });
  req.pipe(upstream);
});

server.listen(PORT, '0.0.0.0', () => {
  const mode = AUTH === 'basic' ? `Basic Auth, user "${USER}"` : 'công khai, không mật khẩu';
  process.stdout.write(`[preview] 0.0.0.0:${PORT} → http://${TARGET_HOST}:${TARGET_PORT} (${mode}${NOINDEX ? ', noindex' : ''})\n`);
});
