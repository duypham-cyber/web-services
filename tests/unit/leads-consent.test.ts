/**
 * Form lead — câu chữ đồng ý có phiên bản (Rule 2, Rule 3), AC-C10, trạng thái form cho trang. Không cần DB/mạng.
 */
import { describe, expect, it } from 'vitest';
import { consentVersions, type ConsentVersion } from '../../content/consent';
import { site } from '../../content/site';
import {
  activeConsentVersions,
  checkConsent,
  isConsentApproved,
  toPublicConsent,
  validateConsentVersions,
} from '../../lib/leads/consent';
import { getLeadFormState } from '../../lib/leads/form-state';

const NOW = new Date('2026-10-04T03:00:00Z');

function approved(version: string, effectiveFrom: string, overrides: Partial<ConsentVersion> = {}): ConsentVersion {
  const base = consentVersions.find((v) => v.type === 'lead_b2b');
  if (!base) throw new Error('thiếu version b2b');
  return {
    ...base,
    version,
    effectiveFrom,
    textVi: 'Câu chữ đã duyệt dành cho test, đủ dài để qua kiểm tra độ dài tối thiểu của schema đồng ý. '.repeat(2),
    textEn: 'Approved wording used only in tests, long enough to pass the minimum length rule of the consent schema. '.repeat(2),
    purposes: base.purposes.map((p) => ({ ...p, textVi: `${p.code} — câu đã duyệt cho test`, textEn: `${p.code} — approved for tests` })),
    approvedBy: 'Pháp chế (test)',
    approvedAt: '2026-10-03',
    ...overrides,
  };
}

describe('content/consent.ts', () => {
  it('qua schema; mỗi type có một version; mục đích đúng PC-02 đề xuất', () => {
    expect(() => validateConsentVersions(consentVersions)).not.toThrow();
    const b2b = consentVersions.find((v) => v.type === 'lead_b2b');
    const tech = consentVersions.find((v) => v.type === 'lead_technician');
    expect(b2b?.purposes.map((p) => [p.code, p.required])).toEqual([
      ['b2b_sales_contact', true],
      ['b2b_marketing', false],
    ]);
    expect(tech?.purposes.map((p) => [p.code, p.required])).toEqual([
      ['tech_partner_contact', true],
      ['tech_job_alerts', false],
    ]);
  });
  it('bản nháp CHƯA duyệt (D-26: chờ pháp chế) và còn đánh dấu chỗ chờ pháp chế', () => {
    for (const v of consentVersions) {
      expect(isConsentApproved(v)).toBe(false);
      expect(v.textVi).toMatch(/chờ pháp chế/);
      expect(v.textEn).toMatch(/pending legal review/);
      // Tên pháp nhân không dịch (CLAUDE.md); ngoài tên đó, bản EN không có chữ tiếng Việt
      const en = [v.textEn, ...v.purposes.map((p) => p.textEn)].join(' ').replace(site.legalName.titleCase, '');
      expect(en).not.toMatch(/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i);
    }
  });
  it('tên pháp nhân lấy từ content/site.ts; link chính sách đúng route VI/EN', () => {
    for (const v of consentVersions) {
      expect(v.textVi).toContain(site.legalName.titleCase);
      expect(v.textEn).toContain(site.legalName.titleCase);
      expect(v.policyUrl).toEqual({ vi: '/chinh-sach-bao-mat', en: '/en/privacy-policy' });
    }
  });
  it('schema từ chối: duyệt mà còn chỗ trống, thiếu approvedAt, version trùng, không có mục đích bắt buộc', () => {
    const draft = consentVersions.find((v) => v.type === 'lead_b2b') as ConsentVersion;
    const tech = consentVersions.find((v) => v.type === 'lead_technician') as ConsentVersion;
    expect(() => validateConsentVersions([{ ...draft, approvedBy: 'X', approvedAt: '2026-10-03' }, tech])).toThrow();
    expect(() => validateConsentVersions([{ ...draft, approvedBy: 'X' }, tech])).toThrow();
    expect(() => validateConsentVersions([draft, draft, tech])).toThrow();
    expect(() =>
      validateConsentVersions([{ ...draft, purposes: draft.purposes.map((p) => ({ ...p, required: false })) }, tech]),
    ).toThrow();
    expect(() => validateConsentVersions([draft])).toThrow(/lead_technician/);
  });
});

describe('activeConsentVersions — AC-C10 + cửa sổ 24 giờ (Rule 2)', () => {
  it('site thật: version nháp không dùng được → form tắt', () => {
    expect(activeConsentVersions('lead_b2b', { now: NOW, draftPreview: false })).toEqual([]);
    expect(activeConsentVersions('lead_technician', { now: NOW, draftPreview: false })).toEqual([]);
  });
  it('bản xem trước: version nháp dùng được', () => {
    expect(activeConsentVersions('lead_b2b', { now: NOW, draftPreview: true }).map((v) => v.version)).toEqual(['b2b-2026-10-v1']);
  });
  it('version liền trước còn nhận trong 24 giờ kể từ effectiveFrom của version hiện hành, sau đó → chỉ version hiện hành', () => {
    const versions = [approved('b2b-test-v1', '2026-10-01T00:00:00Z'), approved('b2b-test-v2', '2026-10-04T00:00:00Z')];
    const at = (iso: string) =>
      activeConsentVersions('lead_b2b', { now: new Date(iso), draftPreview: false, versions }).map((v) => v.version);
    expect(at('2026-10-03T12:00:00Z')).toEqual(['b2b-test-v1']);
    expect(at('2026-10-04T10:00:00Z')).toEqual(['b2b-test-v2', 'b2b-test-v1']);
    expect(at('2026-10-04T23:59:59Z')).toEqual(['b2b-test-v2', 'b2b-test-v1']);
    expect(at('2026-10-05T00:00:00Z')).toEqual(['b2b-test-v2']);
    expect(at('2026-10-05T06:00:00Z')).toEqual(['b2b-test-v2']);
  });
  it('review L3: khởi động lại server không mở lại cửa sổ — ngữ cảnh không có mốc giờ khởi động nào', () => {
    const versions = [approved('b2b-test-v1', '2026-10-01T00:00:00Z'), approved('b2b-test-v2', '2026-10-04T00:00:00Z')];
    // Trường lạ (vd serverStartedAt cũ) bị bỏ qua: kết quả chỉ phụ thuộc now + effectiveFrom
    const ctx = { now: new Date('2026-10-05T06:00:00Z'), draftPreview: false, versions, serverStartedAt: new Date('2026-10-05T05:00:00Z') };
    expect(activeConsentVersions('lead_b2b', ctx).map((v) => v.version)).toEqual(['b2b-test-v2']);
    expect(checkConsent('lead_b2b', { version: 'b2b-test-v1', purposes: ['b2b_sales_contact'] }, ctx)).toMatchObject({ status: 409 });
    expect(checkConsent('lead_b2b', { version: 'b2b-test-v2', purposes: ['b2b_sales_contact'] }, ctx)).toMatchObject({ ok: true });
  });
});

describe('checkConsent — bước 9', () => {
  const ctx = { now: NOW, draftPreview: true };
  it('version lạ/cũ → 409', () => {
    expect(checkConsent('lead_b2b', { version: 'b2b-2025-01-v1', purposes: ['b2b_sales_contact'] }, ctx)).toMatchObject({
      ok: false,
      status: 409,
      code: 'CONSENT_VERSION_OUTDATED',
    });
    // version của type khác cũng là "không có trong danh sách hiệu lực của type"
    expect(checkConsent('lead_b2b', { version: 'tech-2026-10-v1', purposes: [] }, ctx)).toMatchObject({ status: 409 });
  });
  it('mục đích lạ → 400 unknown_purpose; thiếu bắt buộc → 422', () => {
    expect(checkConsent('lead_b2b', { version: 'b2b-2026-10-v1', purposes: ['b2b_sales_contact', 'sell_data'] }, ctx)).toMatchObject({
      status: 400,
      details: [{ field: 'consent.purposes', code: 'unknown_purpose' }],
    });
    expect(checkConsent('lead_b2b', { version: 'b2b-2026-10-v1', purposes: ['b2b_marketing'] }, ctx)).toMatchObject({
      status: 422,
      code: 'CONSENT_REQUIRED',
    });
    expect(checkConsent('lead_technician', { version: 'tech-2026-10-v1', purposes: [] }, ctx)).toMatchObject({ status: 422 });
  });
  it('hợp lệ → mảng mục đích theo thứ tự của version, bỏ trùng', () => {
    const r = checkConsent(
      'lead_b2b',
      { version: 'b2b-2026-10-v1', purposes: ['b2b_marketing', 'b2b_sales_contact', 'b2b_marketing'] },
      ctx,
    );
    expect(r.ok && r.accepted).toEqual(['b2b_sales_contact', 'b2b_marketing']);
  });
});

describe('toPublicConsent + getLeadFormState (trang có form)', () => {
  const env = (o: Record<string, string | undefined>) => ({
    LEADS_FORM_ENABLED: 'true',
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: '0x4AAAAAAAreal',
    ...o,
  });
  it('câu chữ theo ngôn ngữ, link chính sách theo ngôn ngữ, cờ draft', () => {
    const v = consentVersions[0] as ConsentVersion;
    const en = toPublicConsent(v, 'en');
    expect(en.policyUrl).toBe('/en/privacy-policy');
    expect(en.notice).toBe(v.textEn);
    expect(en.purposes[0]).toEqual({ code: v.purposes[0]?.code, required: true, text: v.purposes[0]?.textEn });
    expect(en.draft).toBe(true);
    expect(toPublicConsent(v, 'vi').policyUrl).toBe('/chinh-sach-bao-mat');
  });
  it('công tắc tắt → không render form', () => {
    expect(getLeadFormState('lead_b2b', 'vi', env({ LEADS_FORM_ENABLED: 'false' }), NOW)).toEqual({
      enabled: false,
      type: 'lead_b2b',
      reason: 'switch_off',
    });
  });
  it('production + câu đồng ý nháp → form tắt (AC-C10)', () => {
    expect(getLeadFormState('lead_technician', 'vi', env({ NODE_ENV: 'production' }), NOW)).toMatchObject({
      enabled: false,
      reason: 'consent_unapproved',
    });
  });
  it('bản xem trước (DRAFT_PREVIEW=1) → form bật với câu nháp + nhãn Nháp', () => {
    const s = getLeadFormState('lead_b2b', 'en', env({ NODE_ENV: 'production', DRAFT_PREVIEW: '1' }), NOW);
    expect(s).toMatchObject({ enabled: true, draft: true, endpoint: '/api/v1/leads', turnstileSiteKey: '0x4AAAAAAAreal' });
    if (s.enabled) expect(s.consent.version).toBe('b2b-2026-10-v1');
  });
  it('thiếu site key, hoặc site key test trên site thật → misconfigured', () => {
    expect(getLeadFormState('lead_b2b', 'vi', env({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: '' }), NOW)).toMatchObject({
      reason: 'misconfigured',
    });
    expect(
      getLeadFormState('lead_b2b', 'vi', env({ NODE_ENV: 'production', NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA' }), NOW),
    ).toMatchObject({ reason: 'misconfigured' });
  });
});
