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
 * - BẤT BIẾN TRIỂN KHAI (docs/LEADS-RUNBOOK.md mục 9): chỉ proxy tin cậy (openresty / proxy 9515) được nối X-Forwarded-For
 *   và app không bao giờ nhận kết nối trực tiếp từ ngoài máy. Vi phạm → client tự đặt phần tử cuối, né được rate-limit.
 *
 * GOM IPv6 THEO /64 (review L4): một thuê bao IPv6 thường được cấp cả khối /64 và tự đổi địa chỉ trong khối (privacy
 * extensions) → băm từng địa chỉ thì mỗi request là một "người" mới, rate-limit vô dụng. `hashIp` băm tiền tố /64 cho IPv6;
 * IPv4 giữ nguyên (hash IPv4 không đổi so với trước).
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

/** IPv6 → 8 nhóm hex đủ 4 chữ số (bỏ zone `%eth0`, đổi đuôi IPv4 nhúng); không phải IPv6 hợp lệ → null. */
function expandIpv6(ip: string): string[] | null {
  if (isIP(ip) !== 6) return null;
  let s = ip.toLowerCase();
  const zone = s.indexOf('%');
  if (zone !== -1) s = s.slice(0, zone);
  const v4 = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number) as [number, number, number, number];
    s = `${s.slice(0, v4.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head = '', tail] = s.split('::');
  const left = head ? head.split(':') : [];
  const right = tail === undefined ? null : tail ? tail.split(':') : [];
  const groups = right === null ? left : [...left, ...Array<string>(8 - left.length - right.length).fill('0'), ...right];
  return groups.length === 8 ? groups.map((g) => g.padStart(4, '0')) : null;
}

/**
 * Khóa gom IP cho rate-limit và ip_hash: IPv4 giữ nguyên; IPv6 → tiền tố /64 ("2001:0db8:0001:0002::/64");
 * IPv4-mapped viết dạng hex (::ffff:0102:0304) → IPv4 tương ứng. Chuỗi khác (vd "unknown") giữ nguyên.
 */
export function ipBucket(ip: string): string {
  const g = expandIpv6(ip);
  if (!g) return ip;
  if (g.slice(0, 5).every((x) => x === '0000') && g[5] === 'ffff') {
    const n = (x: string) => parseInt(x, 16);
    const [hi, lo] = [n(g[6] ?? '0'), n(g[7] ?? '0')];
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  return `${g.slice(0, 4).join(':')}::/64`;
}

/** HMAC-SHA256 của khóa gom (ipBucket) — dùng cho cả rate-limit và cột ip_hash. */
export function hashIp(ip: string, secret: string): string {
  return createHmac('sha256', secret).update(ipBucket(ip)).digest('hex');
}
