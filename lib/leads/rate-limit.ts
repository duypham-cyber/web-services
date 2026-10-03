/**
 * Rate-limit trong app: cửa sổ trượt chính xác, mặc định 5 request / 600 giây / ip_hash (contracts/lead-b2b.md bước 4,
 * mục 6.5; D-14). CHỈ SERVER.
 *
 * NƠI LƯU: bộ nhớ của tiến trình — đúng contract mục 3.4 (side effect 3: "bộ đếm rate-limit trong bộ nhớ của instance") và
 * bảng edge case (blue/green 2 instance → giới hạn nới gấp đôi vài phút: chấp nhận; muốn chặt hơn thì Redis). Không thêm
 * bảng Postgres vì SECTION 2 của contract đã duyệt không có bảng này (đổi schema = sửa contract). Site chạy MỘT tiến trình
 * Next (bbsw: dev 3091 và bản xem trước 3092 là hai tiến trình riêng, mỗi cái một bộ đếm).
 * Bộ đếm gắn vào globalThis để HMR của dev và module bị nhân bản trong bundle production vẫn dùng chung một bộ đếm.
 *
 * Request bị từ chối ở bước 4 (429) KHÔNG được ghi thêm (nếu ghi, client cứ gửi là không bao giờ hết bị chặn);
 * request bị từ chối ở bước sau bước 4 vẫn tính (contract mục 3.4).
 */

export type RateLimitResult = { allowed: true; remaining: number } | { allowed: false; retryAfterSec: number };

export type RateLimiter = {
  hit(key: string, nowMs: number, max: number, windowMs: number): RateLimitResult;
  reset(): void;
};

const STORE_KEY = Symbol.for('bluebolt-web.leads.rate-limit');
const MAX_KEYS = 50_000;

type Store = Map<string, number[]>;

function globalStore(): Store {
  const g = globalThis as unknown as Record<symbol, Store | undefined>;
  if (!g[STORE_KEY]) g[STORE_KEY] = new Map();
  return g[STORE_KEY];
}

export function createRateLimiter(store: Store = globalStore()): RateLimiter {
  let hitsSincePrune = 0;

  const prune = (nowMs: number, windowMs: number) => {
    for (const [key, times] of store) {
      if ((times[times.length - 1] ?? 0) <= nowMs - windowMs) store.delete(key);
    }
    // Vẫn quá nhiều khóa (bị dội từ rất nhiều IP): bỏ khóa cũ nhất theo thứ tự chèn của Map
    for (const key of store.keys()) {
      if (store.size <= MAX_KEYS) break;
      store.delete(key);
    }
  };

  return {
    hit(key, nowMs, max, windowMs) {
      hitsSincePrune += 1;
      if (hitsSincePrune >= 1000 || store.size > MAX_KEYS) {
        hitsSincePrune = 0;
        prune(nowMs, windowMs);
      }
      const recent = (store.get(key) ?? []).filter((t) => t > nowMs - windowMs);
      if (recent.length >= max) {
        store.set(key, recent);
        const oldest = recent[recent.length - max] ?? nowMs;
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000)) };
      }
      recent.push(nowMs);
      store.set(key, recent);
      return { allowed: true, remaining: max - recent.length };
    },
    reset() {
      store.clear();
    },
  };
}
