/**
 * IP người gửi → ip_hash (contracts/lead-b2b.md mục 2: HMAC-SHA256(ip, LEAD_IP_HASH_SECRET), hex). CHỈ SERVER.
 * IP thô chỉ sống trong bộ nhớ của request: KHÔNG lưu DB, KHÔNG log, KHÔNG gửi ra ngoài (siteverify không có remoteip).
 *
 * TIN HEADER NÀO (ghi rõ theo yêu cầu bảo mật):
 * - App Next chỉ bind `localhost` (D-09) → mọi kết nối TCP tới app là tiến trình trên chính máy đó: proxy bản xem trước
 *   (deploy/preview/proxy.mjs, cổng 9515) hoặc openresty (production). Không ai ngoài máy gọi thẳng được app.
 * - proxy 9515 NỐI địa chỉ socket của trình duyệt vào CUỐI `X-Forwarded-For` (giữ phần client tự khai ở đầu).
 *   openresty ghi đè `X-Real-IP = $remote_addr` và cũng nối `$remote_addr` vào cuối `X-Forwarded-For`
 *   (deploy/openresty/snippets/bb-proxy-headers.conf).
 * - Gọi thẳng app không qua proxy (curl trên máy, dev 3091): Next tự đặt `X-Forwarded-For` = địa chỉ socket nếu request
 *   chưa có header này (node_modules/next/dist/server/base-server.js) → 127.0.0.1.
 * ⇒ `xff-last` (mặc định, dev + bản xem trước + production): lấy phần tử CUỐI của X-Forwarded-For — luôn do proxy tin cậy
 *   (hoặc Next) thêm vào; KHÔNG BAO GIỜ lấy phần tử đầu (client tự khai, giả mạo được).
 *   `x-real-ip` (tùy chọn cho production sau openresty, đúng câu chữ contract mục 6.7): đọc X-Real-IP do openresty ghi đè;
 *   KHÔNG dùng sau proxy 9515 vì proxy này chuyển nguyên header X-Real-IP client tự gửi.
 * - Có Cloudflare proxy đứng trước openresty: phải bật real_ip_header CF-Connecting-IP ở openresty (contract mục 3.8).
 */
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import type { ClientIpSource } from './config';

export const UNKNOWN_IP = 'unknown';

/** Chuẩn hóa một địa chỉ: bỏ [ ] và cổng, đổi ::ffff:a.b.c.d → a.b.c.d. Không hợp lệ → null. */
export function normalizeIp(value: string | null | undefined): string | null {
  if (!value) return null;
  let s = value.trim().toLowerCase();
  if (s.startsWith('[')) {
    const end = s.indexOf(']');
    s = end > 0 ? s.slice(1, end) : s;
  }
  const v4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(s);
  if (v4WithPort?.[1]) s = v4WithPort[1];
  if (s.startsWith('::ffff:') && isIP(s.slice(7)) === 4) s = s.slice(7);
  return isIP(s) ? s : null;
}

export function clientIpFromHeaders(headers: Headers, source: ClientIpSource): string {
  if (source === 'x-real-ip') {
    const real = normalizeIp(headers.get('x-real-ip'));
    if (real) return real;
  }
  const hops = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return normalizeIp(hops[hops.length - 1]) ?? UNKNOWN_IP;
}

export function hashIp(ip: string, secret: string): string {
  return createHmac('sha256', secret).update(ip).digest('hex');
}
