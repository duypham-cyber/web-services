// Bản xem trước có mật khẩu cho anh Duy (D-21): lắng nghe 0.0.0.0:9515, chuyển tiếp tới `next start` ở localhost:3092.
// Basic Auth cho TOÀN site (kể cả /_next/*, ảnh) để trình duyệt không bật hộp đăng nhập giữa chừng khi Next nạp trước trang.
// Chỉ dùng module có sẵn của Node. Cấu hình đọc từ biến môi trường (systemd nạp từ .env.preview, không commit).
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.PREVIEW_PORT || 9515);
const TARGET_HOST = process.env.PREVIEW_TARGET_HOST || 'localhost'; // localhost, không phải 127.0.0.1 (D-09)
const TARGET_PORT = Number(process.env.PREVIEW_TARGET_PORT || 3092);
const USER = process.env.PREVIEW_USER || 'bluebolt';
const PASS = process.env.PREVIEW_PASSWORD;

if (!PASS || PASS.length < 16) {
  console.error('[preview] Thiếu PREVIEW_PASSWORD (≥ 16 ký tự) trong .env.preview');
  process.exit(1);
}

const expected = Buffer.from('Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64'));
const authorized = (header) => {
  if (!header) return false;
  const got = Buffer.from(header);
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
};
const NOINDEX = 'noindex, nofollow, noarchive';
const upstreamOrigin = new RegExp(`^https?://(localhost|127\\.0\\.0\\.1):${TARGET_PORT}`);

const server = http.createServer((req, res) => {
  if (!authorized(req.headers.authorization)) {
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="Bluebolt Services - ban xem truoc", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': NOINDEX,
      'Cache-Control': 'no-store',
    });
    res.end('Cần đăng nhập để xem bản xem trước.');
    return;
  }
  const headers = { ...req.headers };
  delete headers.authorization;
  const clientIp = req.socket.remoteAddress || '';
  headers['x-forwarded-for'] = headers['x-forwarded-for'] ? `${headers['x-forwarded-for']}, ${clientIp}` : clientIp;
  headers['x-forwarded-proto'] = 'http';
  headers['x-forwarded-host'] = req.headers.host || '';

  const upstream = http.request(
    { host: TARGET_HOST, port: TARGET_PORT, method: req.method, path: req.url, headers },
    (up) => {
      const out = { ...up.headers, 'x-robots-tag': NOINDEX };
      if (out.location) out.location = String(out.location).replace(upstreamOrigin, '');
      res.writeHead(up.statusCode || 502, out);
      up.pipe(res);
    },
  );
  upstream.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': NOINDEX });
    }
    res.end(`Bản xem trước chưa chạy (${TARGET_HOST}:${TARGET_PORT}): ${err.code || err.message}`);
  });
  req.pipe(upstream);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[preview] 0.0.0.0:${PORT} → http://${TARGET_HOST}:${TARGET_PORT} (Basic Auth, user "${USER}")`);
});
