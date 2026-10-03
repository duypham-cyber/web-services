/**
 * Tiện ích phía trình duyệt cho form lead (contracts/lead-b2b.md Rule 7, mục 3.1 "utm", 3.7 analytics).
 * KHÔNG dùng crypto.randomUUID / crypto.subtle / clipboard: bản xem trước chạy HTTP qua IP (ngữ cảnh không an toàn,
 * trình duyệt không có các API đó). Mọi truy cập sessionStorage bọc try/catch (trình duyệt riêng tư, webview chặn).
 */
import { FILM_TIERS, UTM_KEYS, type FilmTier, type LeadType } from '@/lib/leads/rules';

type UmamiProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: UmamiProps) => void };
  }
}

/** UUID v4 bằng crypto.getRandomValues (có ở mọi ngữ cảnh, kể cả HTTP). */
export function uuidV4(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Umami tự host (không cookie): gọi an toàn, chưa cài script thì bỏ qua. Thuộc tính KHÔNG BAO GIỜ chứa dữ liệu cá nhân
 * (contract mục 3.7): chỉ type, intent, locale, filmTier, code.
 */
export function track(event: 'lead_submit' | 'lead_error', data: UmamiProps): void {
  try {
    window.umami?.track(event, data);
  } catch {
    // analytics không được làm hỏng form
  }
}

/** Tầng hero đang chạy (agent HERO gắn <html data-film-tier>); không có hoặc lạ → null. */
export function readFilmTier(): FilmTier | null {
  const v = document.documentElement.dataset.filmTier;
  return v && (FILM_TIERS as readonly string[]).includes(v) ? (v as FilmTier) : null;
}

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

/** Thay {tên} trong chuỗi messages (chữ truyền từ server qua props, không qua next-intl ở client). */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

const draftKey = (type: LeadType) => `bb:lead-draft:${type}`;

/** 409 CONSENT_VERSION_OUTDATED: lưu dữ liệu đã nhập (KHÔNG lưu đồng ý) trước khi tải lại trang. */
export function saveDraft(type: LeadType, values: unknown): boolean {
  try {
    window.sessionStorage.setItem(draftKey(type), JSON.stringify(values));
    return true;
  } catch {
    return false;
  }
}

/** Lấy dữ liệu đã lưu (một lần, rồi xóa). */
export function takeDraft(type: LeadType): Record<string, unknown> | null {
  try {
    const raw = window.sessionStorage.getItem(draftKey(type));
    if (raw === null) return null;
    window.sessionStorage.removeItem(draftKey(type));
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Trình duyệt trong app Zalo / Facebook / Messenger / Instagram (A12 — Turnstile có thể không chạy). */
export function isInAppBrowser(): boolean {
  return /\bZalo\b|FBAN|FBAV|FB_IAB|Messenger|Instagram/i.test(navigator.userAgent);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Cuộn tới khối form rồi focus ô đầu (AC-T9: không cuộn mượt khi reduced-motion). */
export function scrollToAndFocus(block: HTMLElement, field: HTMLElement | null): void {
  block.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  field?.focus({ preventScroll: true });
}
