/**
 * utm_* lúc vào site (contracts/lead-b2b.md mục 3.1: "lấy từ URL lúc vào site (sessionStorage), không lấy query hiện tại").
 * File này cố ý KHÔNG import gì: thanh dính đáy (có ở mọi trang, chunk layout) gọi captureUtm() → không kéo hằng số và
 * danh sách tỉnh của lib/leads/rules.ts vào JS tải đầu của mọi trang. UTM_KEYS phải khớp rules.ts (tests/unit/leads-form.test.ts).
 */
export const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const;

const UTM_STORAGE_KEY = 'bb:utm';
const UTM_MAX = 100;

/**
 * Ghi utm_* của URL LÚC VÀO SITE vào sessionStorage (một lần mỗi phiên tab). Gọi từ component có mặt ở mọi trang
 * (thanh dính đáy) và từ form. Không ghi đè khi phiên đã có utm.
 */
export function captureUtm(): void {
  try {
    if (window.sessionStorage.getItem(UTM_STORAGE_KEY) !== null) return;
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const v = params.get(`utm_${key}`);
      if (v) utm[key] = v.slice(0, UTM_MAX);
    }
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // sessionStorage bị chặn: bỏ qua utm (siêu dữ liệu lỏng, không ảnh hưởng lead)
  }
}

export function readUtm(): Record<string, string> | undefined {
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return undefined;
    const out: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const v = (parsed as Record<string, unknown>)[key];
      if (typeof v === 'string' && v) out[key] = v.slice(0, UTM_MAX);
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}

