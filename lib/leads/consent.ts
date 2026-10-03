/**
 * Câu chữ đồng ý có phiên bản (contracts/lead-b2b.md Rule 2 + Rule 3, bước 9 của bảng 3.1).
 * Kiểm content/consent.ts bằng Zod ngay khi import (sai → lỗi khi build/test, không đợi tới lúc có người gửi form).
 */
import { z } from 'zod';
import { consentVersions, type ConsentVersion } from '../../content/consent';
import { LEAD_TYPES, type LeadErrorDetail, type LeadType } from './rules';
import { detail } from './schema';

/** Chỗ trống chờ pháp chế, vd "[thời hạn lưu — chờ pháp chế]". Version còn chỗ trống không được duyệt. */
const PLACEHOLDER = /\[[^\]]*(chờ pháp chế|pending legal review)[^\]]*\]/i;
export const PREVIOUS_VERSION_GRACE_MS = 24 * 60 * 60 * 1000;

const purposeSchema = z.strictObject({
  code: z.string().regex(/^[a-z][a-z0-9_]{2,47}$/),
  required: z.boolean(),
  textVi: z.string().trim().min(20),
  textEn: z.string().trim().min(20),
});

const versionSchema = z
  .strictObject({
    version: z.string().regex(/^[a-z0-9][a-z0-9-]{2,31}$/),
    type: z.enum(LEAD_TYPES),
    effectiveFrom: z.iso.datetime({ offset: true }),
    textVi: z.string().trim().min(80),
    textEn: z.string().trim().min(80),
    purposes: z.array(purposeSchema).min(1).max(10),
    policyUrl: z.strictObject({ vi: z.string().regex(/^\/[a-z0-9/-]*$/), en: z.string().regex(/^\/en\/[a-z0-9/-]*$/) }),
    approvedBy: z.string().trim().min(2).nullable(),
    approvedAt: z.iso.date().nullable(),
    note: z.string(),
  })
  .superRefine((v, ctx) => {
    if ((v.approvedBy === null) !== (v.approvedAt === null)) {
      ctx.addIssue({ code: 'custom', message: `${v.version}: approvedBy và approvedAt phải cùng có hoặc cùng trống` });
    }
    const texts = [v.textVi, v.textEn, ...v.purposes.flatMap((p) => [p.textVi, p.textEn])];
    if (v.approvedBy !== null && texts.some((t) => PLACEHOLDER.test(t))) {
      ctx.addIssue({ code: 'custom', message: `${v.version}: đã có approvedBy nhưng câu chữ còn chỗ "[… chờ pháp chế]"` });
    }
    if (!v.purposes.some((p) => p.required)) {
      ctx.addIssue({ code: 'custom', message: `${v.version}: cần ít nhất một mục đích bắt buộc` });
    }
    if (new Set(v.purposes.map((p) => p.code)).size !== v.purposes.length) {
      ctx.addIssue({ code: 'custom', message: `${v.version}: mã mục đích bị trùng` });
    }
  });

/** Kiểm toàn bộ danh sách; ném lỗi nếu sai. Export để test chạy với dữ liệu giả. */
export function validateConsentVersions(list: readonly ConsentVersion[]): readonly ConsentVersion[] {
  z.array(versionSchema).parse(list);
  const keys = list.map((v) => v.version);
  if (new Set(keys).size !== keys.length) throw new Error('content/consent.ts: version bị trùng');
  for (const type of LEAD_TYPES) {
    if (!list.some((v) => v.type === type)) throw new Error(`content/consent.ts: thiếu version cho ${type}`);
  }
  return list;
}

const VERSIONS = validateConsentVersions(consentVersions);

export function isConsentApproved(v: Pick<ConsentVersion, 'approvedBy' | 'approvedAt'>): boolean {
  return v.approvedBy !== null && v.approvedAt !== null;
}

export type ConsentContext = {
  now: Date;
  /** Bản xem trước (DRAFT_PREVIEW=1): version nháp cũng có hiệu lực. Production: chỉ version đã duyệt. */
  draftPreview: boolean;
  /** Lúc tiến trình server khởi động (≈ lúc deploy) — cửa sổ 24 giờ của version liền trước tính từ max(effectiveFrom, mốc này). */
  serverStartedAt?: Date;
  versions?: readonly ConsentVersion[];
};

/** Version còn hiệu lực của type: [hiện hành, (liền trước nếu còn trong 24 giờ)]. Rỗng = form phải tắt. */
export function activeConsentVersions(type: LeadType, ctx: ConsentContext): ConsentVersion[] {
  const nowMs = ctx.now.getTime();
  const eligible = (ctx.versions ?? VERSIONS)
    .filter((v) => v.type === type && Date.parse(v.effectiveFrom) <= nowMs && (ctx.draftPreview || isConsentApproved(v)))
    .sort((a, b) => Date.parse(b.effectiveFrom) - Date.parse(a.effectiveFrom));
  const [current, previous] = eligible;
  if (!current) return [];
  if (!previous) return [current];
  const windowStart = Math.max(Date.parse(current.effectiveFrom), ctx.serverStartedAt?.getTime() ?? 0);
  return nowMs < windowStart + PREVIOUS_VERSION_GRACE_MS ? [current, previous] : [current];
}

export function currentConsentVersion(type: LeadType, ctx: ConsentContext): ConsentVersion | null {
  return activeConsentVersions(type, ctx)[0] ?? null;
}

export function findConsentVersion(version: string, versions: readonly ConsentVersion[] = VERSIONS): ConsentVersion | null {
  return versions.find((v) => v.version === version) ?? null;
}

export type ConsentCheck =
  | { ok: true; version: ConsentVersion; accepted: string[] }
  | { ok: false; status: 409; code: 'CONSENT_VERSION_OUTDATED' }
  | { ok: false; status: 400; code: 'VALIDATION_ERROR'; details: LeadErrorDetail[] }
  | { ok: false; status: 422; code: 'CONSENT_REQUIRED'; details: LeadErrorDetail[] };

/** Bước 9: version còn hiệu lực (409) → mục đích lạ (400 unknown_purpose) → thiếu mục đích bắt buộc (422). */
export function checkConsent(
  type: LeadType,
  consent: { version: string; purposes: readonly string[] },
  ctx: ConsentContext,
): ConsentCheck {
  const version = activeConsentVersions(type, ctx).find((v) => v.version === consent.version);
  if (!version) return { ok: false, status: 409, code: 'CONSENT_VERSION_OUTDATED' };

  const known = new Set(version.purposes.map((p) => p.code));
  if (consent.purposes.some((p) => !known.has(p))) {
    return { ok: false, status: 400, code: 'VALIDATION_ERROR', details: [detail('consent.purposes', 'unknown_purpose')] };
  }
  const given = new Set(consent.purposes);
  const missing = version.purposes.filter((p) => p.required && !given.has(p.code));
  if (missing.length > 0) {
    return { ok: false, status: 422, code: 'CONSENT_REQUIRED', details: [detail('consent.purposes', 'required')] };
  }
  // Lưu theo thứ tự của version, bỏ trùng
  return { ok: true, version, accepted: version.purposes.filter((p) => given.has(p.code)).map((p) => p.code) };
}

/** Câu chữ đồng ý theo ngôn ngữ, để page truyền xuống form (client component không đọc content trực tiếp). */
export type PublicConsent = {
  version: string;
  notice: string;
  purposes: { code: string; required: boolean; text: string }[];
  policyUrl: string;
  /** true = chưa duyệt (chỉ hiện ở bản xem trước, kèm nhãn "Nháp"). */
  draft: boolean;
};

export function toPublicConsent(v: ConsentVersion, locale: 'vi' | 'en'): PublicConsent {
  return {
    version: v.version,
    notice: locale === 'en' ? v.textEn : v.textVi,
    purposes: v.purposes.map((p) => ({ code: p.code, required: p.required, text: locale === 'en' ? p.textEn : p.textVi })),
    policyUrl: v.policyUrl[locale],
    draft: !isConsentApproved(v),
  };
}
