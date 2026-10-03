/**
 * Zod cho POST /api/v1/leads — contracts/lead-b2b.md mục 3.1 (đặc tả Zod) + lead-technician.md mục 3.
 * `fields`, `consent`: CHẶT (sai → 400). `utm`, `pagePath`, `locale`, `filmTier`: LỎNG, đi qua sanitizeMeta() (Rule 5).
 * Không có Node API: dùng được cả ở server lẫn trình duyệt (nhưng Zod nặng ~15 KB gz — form nên dùng rules.ts để kiểm inline).
 */
import { z } from 'zod';
import {
  B2B_INTENTS,
  CUSTOMER_TYPES,
  FILM_TIERS,
  LEAD_LOCALES,
  LIMITS,
  MONTHLY_VOLUMES,
  PERSON_NAME,
  PHONE_VN,
  PRIMARY_SKILLS,
  PROVINCE_CODES,
  UTM_KEYS,
  cleanMultiline,
  cleanText,
  compactPhone,
  hasMarkupOrUrl,
  stripControl,
  toE164,
  uniqueSorted,
  type FilmTier,
  type LeadDetailCode,
  type LeadErrorDetail,
  type LeadLocale,
} from './rules';

const personName = z
  .string()
  .max(LIMITS.fullName.max * 2)
  .transform(cleanText)
  .pipe(z.string().min(LIMITS.fullName.min).max(LIMITS.fullName.max).regex(PERSON_NAME));

const phoneVN = z
  .string()
  .max(LIMITS.phoneInput)
  .transform(compactPhone)
  .pipe(z.string().regex(PHONE_VN))
  .transform(toE164);

const provinceCode = z.enum(PROVINCE_CODES as [string, ...string[]]);

/** Chuỗi tùy chọn: rỗng sau chuẩn hóa → null; thiếu → null (AC-B10). */
const optionalText = (min: number, max: number) =>
  z
    .string()
    .max(max * 3)
    .transform(cleanText)
    .transform((s) => (s === '' ? null : s))
    .pipe(z.string().min(min).max(max).nullable())
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const LeadB2BFields = z.strictObject({
  intent: z.enum(B2B_INTENTS),
  fullName: personName,
  company: z
    .string()
    .max(LIMITS.company.max * 3)
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(LIMITS.company.min)
        .max(LIMITS.company.max)
        .refine((s) => !hasMarkupOrUrl(s), { message: 'Company must not contain "<", ">" or "://"' }),
    ),
  jobTitle: optionalText(LIMITS.jobTitle.min, LIMITS.jobTitle.max),
  phone: phoneVN,
  workEmail: z.string().trim().toLowerCase().max(LIMITS.email).pipe(z.email()),
  customerType: z.enum(CUSTOMER_TYPES),
  monthlyVolume: z.enum(MONTHLY_VOLUMES),
  provinces: z.array(provinceCode).min(LIMITS.provinces.min).max(LIMITS.provinces.max).transform(uniqueSorted),
  note: z
    .string()
    .max(LIMITS.note * 3)
    .transform(cleanMultiline)
    .transform((s) => (s === '' ? null : s))
    .pipe(z.string().max(LIMITS.note).nullable())
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

export const LeadTechnicianFields = z.strictObject({
  fullName: personName,
  phone: phoneVN,
  province: provinceCode,
  primarySkill: z.enum(PRIMARY_SKILLS),
});

const Consent = z.strictObject({
  version: z.string().max(LIMITS.consentVersion),
  purposes: z.array(z.string().max(LIMITS.consentPurposeCode)).max(LIMITS.consentPurposes),
});

const common = {
  consent: Consent,
  utm: z.unknown().optional(),
  pagePath: z.unknown().optional(),
  locale: z.unknown().optional(),
  filmTier: z.unknown().optional(),
  hp: z.string().max(LIMITS.hp).optional(),
  turnstileToken: z.string().max(LIMITS.turnstileToken).optional(),
};

export const LeadRequest = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('lead_b2b'), fields: LeadB2BFields, ...common }),
  z.strictObject({ type: z.literal('lead_technician'), fields: LeadTechnicianFields, ...common }),
]);

export type LeadRequestData = z.output<typeof LeadRequest>;
export type LeadB2BPayload = z.output<typeof LeadB2BFields>;
export type LeadTechnicianPayload = z.output<typeof LeadTechnicianFields>;
export type LeadPayload = LeadB2BPayload | LeadTechnicianPayload;

// ---------------------------------------------------------------------------------------------------------------------
// Siêu dữ liệu lỏng (Rule 5): sai thì sửa/bỏ, ghi tên trường vào meta.sanitized, KHÔNG làm hỏng lead thật
// ---------------------------------------------------------------------------------------------------------------------
export type SanitizedMeta = {
  utm: Partial<Record<(typeof UTM_KEYS)[number], string>>;
  pagePath: string;
  locale: LeadLocale;
  filmTier: FilmTier | null;
  sanitized: string[];
};

const PAGE_PATH = /^\/[A-Za-z0-9\-._~/%]*$/;

export function sanitizeMeta(body: Record<string, unknown>): SanitizedMeta {
  const sanitized: string[] = [];
  const utm: SanitizedMeta['utm'] = {};

  if (body.utm !== undefined && body.utm !== null) {
    if (typeof body.utm !== 'object' || Array.isArray(body.utm)) {
      sanitized.push('utm');
    } else {
      const raw = body.utm as Record<string, unknown>;
      if (Object.keys(raw).some((k) => !(UTM_KEYS as readonly string[]).includes(k))) sanitized.push('utm.unknown_keys');
      for (const key of UTM_KEYS) {
        const value = raw[key];
        if (value === undefined || value === null || value === '') continue;
        if (typeof value !== 'string') {
          sanitized.push(`utm.${key}`);
          continue;
        }
        // Cắt theo đơn vị UTF-16 có thể tách đôi một cặp surrogate (emoji ở vị trí 100) → lọc lại sau khi cắt
        const cut = stripControl(stripControl(value).trim().slice(0, LIMITS.utmValue));
        if (cut !== value) sanitized.push(`utm.${key}`);
        if (cut !== '') utm[key] = cut;
      }
    }
  }

  let pagePath = '/';
  if (body.pagePath !== undefined) {
    if (typeof body.pagePath === 'string' && body.pagePath.length <= LIMITS.pagePath && PAGE_PATH.test(body.pagePath)) {
      pagePath = body.pagePath;
    } else {
      sanitized.push('pagePath');
    }
  }

  let locale: LeadLocale = 'vi';
  if (body.locale !== undefined) {
    if ((LEAD_LOCALES as readonly unknown[]).includes(body.locale)) locale = body.locale as LeadLocale;
    else sanitized.push('locale');
  }

  let filmTier: FilmTier | null = null;
  if (body.filmTier !== undefined && body.filmTier !== null) {
    if ((FILM_TIERS as readonly unknown[]).includes(body.filmTier)) filmTier = body.filmTier as FilmTier;
    else sanitized.push('filmTier');
  }

  return { utm, pagePath, locale, filmTier, sanitized };
}

// ---------------------------------------------------------------------------------------------------------------------
// Zod issue → error.details[] (contract: field + code; message cho developer; KHÔNG chép giá trị người dùng)
// ---------------------------------------------------------------------------------------------------------------------
const DETAIL_MESSAGES: Record<LeadDetailCode, string> = {
  required: 'Field is required',
  too_short: 'Value is too short',
  too_long: 'Value is too long',
  invalid_format: 'Value has an invalid format',
  invalid_phone: 'Phone must match ^(0|\\+84)(3|5|7|8|9)\\d{8}$ after removing spaces, dots, dashes and brackets',
  invalid_email: 'Email address is invalid',
  invalid_option: 'Value is not one of the allowed options',
  too_many: 'Too many items',
  unknown_field: 'Unknown field',
  unknown_purpose: 'Purpose is not part of this consent version',
};

export function detail(field: string, code: LeadDetailCode): LeadErrorDetail {
  return { field, code, message: DETAIL_MESSAGES[code] };
}

function valueAt(root: unknown, path: readonly PropertyKey[]): unknown {
  let cur: unknown = root;
  for (const key of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<PropertyKey, unknown>)[key];
  }
  return cur;
}

// Thiếu hẳn hoặc chuỗi rỗng = `required`. Chuỗi chỉ có khoảng trắng KHÔNG tính là thiếu: theo luật độ dài/mẫu
// (vd họ tên "   " → too_short, contract mục 5 edge case).
const isBlank = (v: unknown) => v === undefined || v === null || v === '';

type IssueLike = { code: string; path: readonly PropertyKey[]; origin?: string; format?: string; keys?: string[] };

/** Một trường lỗi nhiều luật (vd rỗng: vừa quá ngắn vừa sai mẫu) → giữ một mã, theo thứ tự ưu tiên này. */
const DETAIL_PRIORITY: readonly LeadDetailCode[] = [
  'required',
  'unknown_field',
  'invalid_phone',
  'invalid_email',
  'invalid_option',
  'too_short',
  'too_long',
  'too_many',
  'invalid_format',
  'unknown_purpose',
];

/** Ánh xạ issue của Zod sang mã details của contract. `body` là JSON gốc (để biết trường thiếu hay sai). */
export function issuesToDetails(issues: readonly IssueLike[], body: unknown): LeadErrorDetail[] {
  const byField = new Map<string, LeadDetailCode>();
  const push = (field: string, code: LeadDetailCode) => {
    const prev = byField.get(field);
    if (prev === undefined || DETAIL_PRIORITY.indexOf(code) < DETAIL_PRIORITY.indexOf(prev)) byField.set(field, code);
  };

  for (const issue of issues) {
    // Bỏ chỉ số mảng: fields.provinces.3 → fields.provinces
    const named = issue.path.filter((p): p is string => typeof p === 'string');
    const field = named.join('.') || 'body';
    const raw = valueAt(body, issue.path);

    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys ?? []) push(named.length ? `${field}.${key}` : key, 'unknown_field');
      continue;
    }
    if (field === 'body') {
      push('body', 'invalid_format');
      continue;
    }

    const isElement = issue.path.length > named.length; // lỗi ở phần tử mảng
    const blank = !isElement && isBlank(raw);

    let code: LeadDetailCode;
    switch (issue.code) {
      case 'invalid_union': // discriminator `type` thiếu hoặc lạ
        code = 'invalid_option';
        break;
      case 'invalid_value':
        code = raw !== null && typeof raw === 'object' ? 'invalid_format' : 'invalid_option';
        break;
      case 'too_small':
        code = issue.origin === 'array' ? 'required' : 'too_short';
        break;
      case 'too_big':
        code = issue.origin === 'array' ? 'too_many' : 'too_long';
        break;
      case 'invalid_format':
        code = issue.format === 'email' ? 'invalid_email' : 'invalid_format';
        break;
      default: // invalid_type, custom (refine)…
        code = 'invalid_format';
    }
    if (blank && issue.code !== 'too_big') code = 'required';
    // SĐT: mọi lỗi trừ "thiếu" là invalid_phone (AC-B4, AC-T3). Email: sai định dạng → invalid_email (AC-B7).
    if (field === 'fields.phone' && code !== 'required') code = 'invalid_phone';
    if (field === 'fields.workEmail' && (code === 'invalid_format' || code === 'too_short')) code = 'invalid_email';
    push(field, code);
  }
  return [...byField].map(([field, code]) => detail(field, code));
}

/** Tên trường lỗi (không giá trị) cho log `lead_rejected`. */
export function detailFields(details: readonly LeadErrorDetail[]): string[] {
  return [...new Set(details.map((d) => d.field))];
}
