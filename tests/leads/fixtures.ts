/**
 * Dữ liệu mẫu cho test form lead (unit: tests/unit/leads-*.test.ts · tích hợp: tests/leads/*.test.ts).
 * Giá trị ĐÁNH DẤU (sentinel) để kiểm AC-C8: không xuất hiện trong log ứng dụng/script (contract mục 7, BẢO MẬT / LOG).
 */
import { TURNSTILE_DUMMY_TOKEN, TURNSTILE_TEST_SECRETS } from '../../lib/leads/turnstile';

export const SENTINEL = {
  fullName: 'Sentinel Tên Thử',
  company: 'Sentinel Công Ty Thử',
  jobTitle: 'Sentinel Chức Danh',
  phone: '0987654321',
  phoneE164: '+84987654321',
  workEmail: 'sentinel@congty-thu.vn',
  note: 'SENTINEL-NOTE <img src=x onerror=alert(1)>',
  ip: '203.0.113.77',
} as const;

/** Mọi chuỗi không được xuất hiện trong log (họ tên, SĐT ở mọi dạng, email, công ty, chức danh, ghi chú, IP thô). */
export const SENTINEL_NEEDLES = [
  'Sentinel Tên',
  'Sentinel Công',
  'Sentinel Chức',
  '0987654321',
  '+84987654321',
  '987654321',
  'sentinel@congty-thu.vn',
  'SENTINEL-NOTE',
  '203.0.113.77',
];

export const B2B_CONSENT = 'b2b-2026-10-v1';
export const TECH_CONSENT = 'tech-2026-10-v1';

export function b2bBody(overrides: { fields?: Record<string, unknown>; [key: string]: unknown } = {}) {
  const { fields, ...rest } = overrides;
  return {
    type: 'lead_b2b',
    fields: {
      intent: 'quote',
      fullName: SENTINEL.fullName,
      company: SENTINEL.company,
      jobTitle: SENTINEL.jobTitle,
      phone: SENTINEL.phone,
      workEmail: SENTINEL.workEmail,
      customerType: 'brand',
      monthlyVolume: '500_1999',
      provinces: ['79', '01'],
      note: SENTINEL.note,
      ...fields,
    },
    consent: { version: B2B_CONSENT, purposes: ['b2b_sales_contact'] },
    utm: { source: 'zalo', campaign: 'thu-nghiem' },
    pagePath: '/lien-he',
    locale: 'vi',
    filmTier: 'T-FULL',
    hp: '',
    turnstileToken: TURNSTILE_DUMMY_TOKEN,
    ...rest,
  };
}

export function techBody(overrides: { fields?: Record<string, unknown>; [key: string]: unknown } = {}) {
  const { fields, ...rest } = overrides;
  return {
    type: 'lead_technician',
    fields: {
      fullName: SENTINEL.fullName,
      phone: SENTINEL.phone,
      province: '79',
      primarySkill: 'air_conditioner',
      ...fields,
    },
    consent: { version: TECH_CONSENT, purposes: ['tech_partner_contact'] },
    pagePath: '/doi-tac-tho',
    locale: 'vi',
    hp: '',
    turnstileToken: TURNSTILE_DUMMY_TOKEN,
    ...rest,
  };
}

/** Env tối thiểu hợp lệ cho handler (dev, câu đồng ý nháp dùng được). Test ghi đè DATABASE_URL… theo nhu cầu. */
export function baseEnv(overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return {
    NODE_ENV: 'test',
    LEADS_FORM_ENABLED: 'true',
    DATABASE_URL: 'postgres://unused:unused@127.0.0.1:1/unused',
    LEAD_IP_HASH_SECRET: 'test-secret-0123456789abcdef0123456789abcdef',
    LEAD_ALLOWED_ORIGINS: 'http://127.0.0.1:3091,https://lapdattoanquoc.vn',
    LEAD_CLIENT_IP_SOURCE: 'xff-last',
    TURNSTILE_SECRET_KEY: 'real-looking-secret',
    TURNSTILE_ALLOWED_HOSTNAMES: 'lapdattoanquoc.vn,localhost',
    LEAD_NOTIFY_EMAIL_B2B: 'kinh-doanh@congty-nhan.test',
    LEAD_NOTIFY_EMAIL_TECHNICIAN: 'tuyen-tho@congty-nhan.test',
    SMTP_FROM: 'Bluebolt Website <no-reply@lapdattoanquoc.test>',
    ...overrides,
  };
}

export { TURNSTILE_DUMMY_TOKEN, TURNSTILE_TEST_SECRETS };

/** Request POST tới handler, mặc định có Origin hợp lệ, IP đánh dấu ở cuối X-Forwarded-For. */
export function leadRequest(
  body: unknown,
  options: { headers?: Record<string, string | undefined>; raw?: string; ip?: string } = {},
): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    origin: 'http://127.0.0.1:3091',
    'x-forwarded-for': `198.51.100.9, ${options.ip ?? SENTINEL.ip}`,
  };
  for (const [k, v] of Object.entries(options.headers ?? {})) {
    if (v === undefined) delete headers[k];
    else headers[k] = v;
  }
  return new Request('http://localhost:3091/api/v1/leads', {
    method: 'POST',
    headers,
    body: options.raw ?? JSON.stringify(body),
  });
}

export function uuid(): string {
  // crypto.randomUUID có sẵn trong Node (test chạy server-side)
  return globalThis.crypto.randomUUID();
}
