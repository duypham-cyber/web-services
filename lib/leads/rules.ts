/**
 * Hằng số và hàm chuẩn hóa của form lead — contracts/lead-b2b.md mục 3.1 + Rule 4, lead-technician.md mục 3.
 *
 * File này AN TOÀN cho trình duyệt: không Zod, không Node API, không biến môi trường. Form (bước frontend) import trực tiếp
 * để kiểm inline cùng một luật với server (server vẫn kiểm lại bằng Zod ở schema.ts, không tin kết quả của FE).
 * Chỉ import tương đối (script Node nạp file này bằng type stripping, xem script-runtime.mjs).
 */
import { provinces } from '../../content/provinces';

export const LEAD_TYPES = ['lead_b2b', 'lead_technician'] as const;
export type LeadType = (typeof LEAD_TYPES)[number];

export const B2B_INTENTS = ['quote', 'demo', 'integration'] as const;
export type B2BIntent = (typeof B2B_INTENTS)[number];

/** D-06: chỉ 3 loại (anh Duy duyệt mặc định, D-26). */
export const CUSTOMER_TYPES = ['brand', 'marketplace', 'retail_chain'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

/** D-07: mốc sản lượng đơn lắp/tháng. */
export const MONTHLY_VOLUMES = ['lt_100', '100_499', '500_1999', 'gte_2000', 'unknown'] as const;
export type MonthlyVolume = (typeof MONTHLY_VOLUMES)[number];

/** D-08: 8 kỹ năng chính của form thợ (contract đặt nguồn ở content/skills.ts; nhãn UI ở messages leads.json). */
export const PRIMARY_SKILLS = [
  'air_conditioner',
  'washer_dryer',
  'tv_mounting',
  'water_appliances',
  'kitchen_appliances',
  'electrical_plumbing',
  'robot_vacuum',
  'other',
] as const;
export type PrimarySkill = (typeof PRIMARY_SKILLS)[number];

export const FILM_TIERS = ['T-FULL', 'T-LITE', 'T-SEQ', 'T-STILL'] as const;
export type FilmTier = (typeof FILM_TIERS)[number];

export const LEAD_LOCALES = ['vi', 'en'] as const;
export type LeadLocale = (typeof LEAD_LOCALES)[number];

/** 34 mã tỉnh/thành, theo thứ tự tăng dần (content/provinces.ts). "Toàn quốc" = gửi đủ cả 34 mã. */
export const PROVINCE_CODES = provinces.map((p) => p.code).sort() as readonly string[];
export const ALL_PROVINCES_COUNT = PROVINCE_CODES.length;

export const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const;

/** Body tối đa 16 KB (openresty client_max_body_size + kiểm lại trong app). */
export const MAX_BODY_BYTES = 16 * 1024;

export const LIMITS = {
  fullName: { min: 2, max: 100 },
  company: { min: 2, max: 150 },
  jobTitle: { min: 2, max: 100 },
  phoneInput: 20,
  email: 254,
  note: 1000,
  provinces: { min: 1, max: 34 },
  utmValue: 100,
  pagePath: 512,
  hp: 200,
  turnstileToken: 2048,
  consentVersion: 32,
  consentPurposes: 10,
  consentPurposeCode: 48,
} as const;

/** Chỉ di động VN (D-04: không nhận số bàn 02x). Kiểm SAU khi bỏ ký tự phân cách. */
export const PHONE_VN = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const PHONE_SEPARATORS = /[\s.\-()]/g;

export const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'\-]*$/u;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
// Ký tự điều khiển C0/C1 trừ xuống dòng (\n). Tab được đổi thành khoảng trắng trước khi lọc.
const CONTROL_EXCEPT_LF = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g;
const CONTROL_ALL = /[\u0000-\u001F\u007F-\u009F]/g;
// Ký tự định hướng văn bản (bidi): ALM, LRM, RLM, nhúng/ghi đè U+202A–202E, cô lập U+2066–2069. Vô hình nhưng đảo được
// thứ tự chữ khi hiển thị (giả mạo tên công ty trong email/CRM) → bỏ khỏi mọi chuỗi người dùng nhập.
const BIDI_CONTROLS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
// Nửa cặp surrogate đứng lẻ: JSON cho phép "\ud800" nhưng Postgres JSONB từ chối → không bao giờ để tới DB.
const LONE_SURROGATE = /\p{Cs}/gu;

/**
 * Rule 4: NFC, bỏ zero-width, gộp khoảng trắng, trim. Thêm (review M2): bỏ ký tự điều khiển C0/C1 (NUL làm Postgres báo
 * "unsupported Unicode escape sequence" → 500), ký tự định hướng và surrogate lẻ. Khoảng trắng (tab, xuống dòng) được gộp
 * TRƯỚC khi bỏ ký tự điều khiển để "a\tb" thành "a b", không dính chữ.
 */
export function cleanText(input: string): string {
  return input
    .replace(LONE_SURROGATE, '')
    .normalize('NFC')
    .replace(ZERO_WIDTH, '')
    .replace(/\s+/g, ' ')
    .replace(CONTROL_ALL, '')
    .replace(BIDI_CONTROLS, '')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/**
 * Ghi chú: NFC, bỏ zero-width, ký tự điều khiển (giữ xuống dòng \n), ký tự định hướng và surrogate lẻ, trim.
 * Lưu nguyên văn, không bao giờ render như HTML.
 */
export function cleanMultiline(input: string): string {
  return input
    .replace(LONE_SURROGATE, '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(ZERO_WIDTH, '')
    .replace(CONTROL_EXCEPT_LF, '')
    .replace(BIDI_CONTROLS, '')
    .trim();
}

/** Bỏ ký tự điều khiển, zero-width, định hướng và surrogate lẻ (dùng cho siêu dữ liệu utm). */
export function stripControl(input: string): string {
  return input.replace(LONE_SURROGATE, '').replace(CONTROL_ALL, '').replace(ZERO_WIDTH, '').replace(BIDI_CONTROLS, '');
}

/** Công ty: không chứa '<', '>' hay '://'. */
export function hasMarkupOrUrl(input: string): boolean {
  return /[<>]/.test(input) || input.includes('://');
}

/** '0902 808 049' | '0902.808.049' | '+84 902 808 049' → '+84902808049'; không hợp lệ → null. */
export function normalizePhoneVN(raw: string): string | null {
  if (raw.length > LIMITS.phoneInput) return null;
  const compact = raw.replace(PHONE_SEPARATORS, '');
  if (!PHONE_VN.test(compact)) return null;
  return compact.startsWith('0') ? `+84${compact.slice(1)}` : compact;
}

/** Phần sau khi bỏ ký tự phân cách (để Zod kiểm regex). */
export function compactPhone(raw: string): string {
  return raw.replace(PHONE_SEPARATORS, '');
}

/** Số đã kiểm (0… hoặc +84…) → E.164. */
export function toE164(compact: string): string {
  return compact.startsWith('0') ? `+84${compact.slice(1)}` : compact;
}

/** '+84902808049' → '0902808049' (link Zalo, tra cứu). */
export function e164ToLocal(e164: string): string {
  return e164.startsWith('+84') ? `0${e164.slice(3)}` : e164;
}

/** '+84902808049' → '0902 808 049' (cách viết của docs/03 mục 11.5). */
export function formatPhoneVN(e164: string): string {
  const local = e164ToLocal(e164);
  return /^0\d{9}$/.test(local) ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : local;
}

/** Bỏ trùng, sắp tăng dần (Rule 4). */
export function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

/** D-03: nhận email tên miền miễn phí nhưng gắn cờ meta.emailFreeDomain + nhãn "Email cá nhân" trong thông báo. */
export const FREE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.com.vn',
  'ymail.com',
  'rocketmail.com',
  'outlook.com',
  'outlook.com.vn',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'zoho.com',
  'zohomail.com',
  'yandex.com',
  'yandex.ru',
  'mail.ru',
  'qq.com',
  '163.com',
  '126.com',
]);

export function isFreeEmailDomain(email: string): boolean {
  const at = email.lastIndexOf('@');
  return at !== -1 && FREE_EMAIL_DOMAINS.has(email.slice(at + 1).toLowerCase());
}

export function isLeadType(value: unknown): value is LeadType {
  return typeof value === 'string' && (LEAD_TYPES as readonly string[]).includes(value);
}

/** Mã tham chiếu (Rule 10): 8 ký tự hex đầu của id, in hoa. */
export function leadReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/** Mã lỗi ở `error.code` (contract mục 3.1). FE ánh xạ sang leads.errors.<CODE>. */
export const LEAD_ERROR_CODES = [
  'INVALID_JSON',
  'VALIDATION_ERROR',
  'FORBIDDEN_ORIGIN',
  'CAPTCHA_FAILED',
  'CONSENT_VERSION_OUTDATED',
  'PAYLOAD_TOO_LARGE',
  'CONSENT_REQUIRED',
  'EMAIL_DOMAIN_NOT_ALLOWED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'LEADS_DISABLED',
] as const;
export type LeadErrorCode = (typeof LEAD_ERROR_CODES)[number];

/** Mã ở `error.details[].code`. FE ánh xạ sang leads.fieldErrors.<code>. */
export const LEAD_DETAIL_CODES = [
  'required',
  'too_short',
  'too_long',
  'invalid_format',
  'invalid_phone',
  'invalid_email',
  'invalid_option',
  'too_many',
  'unknown_field',
  'unknown_purpose',
] as const;
export type LeadDetailCode = (typeof LEAD_DETAIL_CODES)[number];

export type LeadErrorDetail = { field: string; code: LeadDetailCode; message: string };
