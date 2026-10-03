/**
 * Form lead — Zod, chuẩn hóa (Rule 4), SĐT, mã lỗi details (contracts/lead-b2b.md mục 3.1, lead-technician.md mục 3).
 * Không cần DB/mạng.
 */
import { describe, expect, it } from 'vitest';
import {
  ALL_PROVINCES_COUNT,
  PROVINCE_CODES,
  cleanMultiline,
  cleanText,
  formatPhoneVN,
  isFreeEmailDomain,
  leadReference,
  normalizePhoneVN,
} from '../../lib/leads/rules';
import { LeadRequest, issuesToDetails, sanitizeMeta } from '../../lib/leads/schema';
import { b2bBody, techBody } from '../leads/fixtures';

function details(body: unknown) {
  const r = LeadRequest.safeParse(body);
  expect(r.success).toBe(false);
  return r.success ? [] : issuesToDetails(r.error.issues, body);
}
const codeOf = (body: unknown, field: string) => details(body).find((d) => d.field === field)?.code;

describe('SĐT di động Việt Nam (AC-B4, B5, B6)', () => {
  it.each(['0902 808 049', '0902.808.049', '+84 902 808 049', '(0902) 808-049', '0902808049'])('chuẩn hóa %s → E.164', (raw) => {
    expect(normalizePhoneVN(raw)).toBe('+84902808049');
  });
  it.each(['abc', '028 3823 4567', '0283823456', '+1 415 555 0100', '09028080491', '84902808049', '0102808049', ''])(
    'từ chối %s',
    (raw) => {
      expect(normalizePhoneVN(raw)).toBeNull();
    },
  );
  it('hiển thị dạng 0902 808 049', () => {
    expect(formatPhoneVN('+84902808049')).toBe('0902 808 049');
  });
});

describe('chuẩn hóa chuỗi (Rule 4)', () => {
  it('NFC, bỏ zero-width, gộp khoảng trắng, trim', () => {
    const decomposed = 'Nguyễn  ​Văn\t An ';
    expect(cleanText(decomposed)).toBe('Nguyễn Văn An'.normalize('NFC'));
    expect(cleanText('  a   b  ')).toBe('a b');
  });
  it('ghi chú giữ xuống dòng, bỏ ký tự điều khiển', () => {
    expect(cleanMultiline(' dòng 1\r\ndòng 2\u0007\u0000 ')).toBe('dòng 1\ndòng 2');
  });
  it('review M2: bỏ ký tự điều khiển C0/C1, ký tự định hướng, surrogate lẻ; tab/xuống dòng thành khoảng trắng', () => {
    expect(cleanText('Cong\u0000 ty\u0007 ABC')).toBe('Cong ty ABC');
    expect(cleanText('a \u0000 b')).toBe('a b');
    expect(cleanText('a\tb\nc\r\nd\u0085e')).toBe('a b c de');
    expect(cleanText('\u202Egnub\u202C ABC')).toBe('gnub ABC');
    for (const bidi of ['\u061C', '\u200E', '\u200F', '\u202A', '\u202B', '\u202C', '\u202D', '\u202E', '\u2066', '\u2067', '\u2068', '\u2069']) {
      expect(cleanText(`A${bidi}B`), bidi.codePointAt(0)?.toString(16)).toBe('AB');
    }
    expect(cleanText('Cong ty \ud800 lone \udfff')).toBe('Cong ty lone');
    // Cặp surrogate hợp lệ (emoji) KHÔNG bị bỏ; chữ Việt tổ hợp vẫn về NFC
    expect(cleanText('Shop 😀')).toBe('Shop 😀');
    expect(cleanText('Nguyễn\u0000')).toBe('Nguyễn'.normalize('NFC'));
    expect(cleanText('\u0000\u0007\u202E')).toBe('');
  });
  it('review M2: ghi chú giữ xuống dòng hợp lệ, bỏ NUL/BEL/định hướng/surrogate lẻ', () => {
    expect(cleanMultiline('dong 1\u0000\u0007\n\u202Edong 2\u2067\r\ndong 3\tx\ud800')).toBe('dong 1\ndong 2\ndong 3 x');
  });
  it('review M2: Zod — company/jobTitle/note có ký tự lạ → dữ liệu sạch (không lỗi, không ký tự điều khiển)', () => {
    const r = LeadRequest.safeParse(
      b2bBody({
        fields: {
          company: 'Cong\u0000 ty\u0007 \u202EABC\u202C',
          jobTitle: 'Truong\u0000 phong\u2066',
          note: 'dong 1\u0000\ndong 2\u202E',
          fullName: 'Nguyen\u0000 Van\u202E An',
        },
      }),
    );
    expect(r.success).toBe(true);
    if (!r.success || r.data.type !== 'lead_b2b') return;
    expect(r.data.fields).toMatchObject({ company: 'Cong ty ABC', jobTitle: 'Truong phong', note: 'dong 1\ndong 2', fullName: 'Nguyen Van An' });
    expect(JSON.stringify(r.data.fields)).not.toMatch(/\\u00[01][0-9a-f]|[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/);
    // Chỉ còn ký tự lạ → coi như trống: company bắt buộc → required/too_short; jobTitle tùy chọn → null
    expect(codeOf(b2bBody({ fields: { company: '\u0000\u0007' } }), 'fields.company')).toBe('too_short');
    const j = LeadRequest.safeParse(b2bBody({ fields: { jobTitle: '\u0000\u202E' } }));
    expect(j.success && j.data.type === 'lead_b2b' && j.data.fields.jobTitle).toBeNull();
  });
  it('mã tham chiếu = 8 hex đầu in hoa', () => {
    expect(leadReference('0b9f3c2e-6d1a-4c55-9a7e-2f4d8b1c9e01')).toBe('0B9F3C2E');
  });
  it('34 mã tỉnh, tăng dần', () => {
    expect(ALL_PROVINCES_COUNT).toBe(34);
    expect([...PROVINCE_CODES]).toEqual([...PROVINCE_CODES].sort());
  });
  it('tên miền email miễn phí (D-03: nhận + gắn cờ)', () => {
    expect(isFreeEmailDomain('a@gmail.com')).toBe(true);
    expect(isFreeEmailDomain('a@congty.vn')).toBe(false);
  });
});

describe('LeadRequest — B2B hợp lệ', () => {
  it('chuẩn hóa payload đúng mục 2.1', () => {
    const r = LeadRequest.safeParse(
      b2bBody({
        fields: {
          fullName: '  Nguyễn   Văn An ',
          phone: '+84 902 808 049',
          workEmail: ' An.Nguyen@ABC.vn ',
          provinces: ['79', '01', '79'],
          jobTitle: '   ',
          note: '',
        },
      }),
    );
    expect(r.success).toBe(true);
    if (!r.success || r.data.type !== 'lead_b2b') return;
    expect(r.data.fields).toMatchObject({
      fullName: 'Nguyễn Văn An',
      phone: '+84902808049',
      workEmail: 'an.nguyen@abc.vn',
      provinces: ['01', '79'],
      jobTitle: null,
      note: null,
    });
  });
  it('AC-B10: thiếu chức danh và ghi chú → null', () => {
    const body = b2bBody();
    delete (body.fields as Record<string, unknown>).jobTitle;
    delete (body.fields as Record<string, unknown>).note;
    const r = LeadRequest.safeParse(body);
    expect(r.success && r.data.type === 'lead_b2b' && [r.data.fields.jobTitle, r.data.fields.note]).toEqual([null, null]);
  });
  it('AC-B9: "Toàn quốc" = 34 mã', () => {
    const r = LeadRequest.safeParse(b2bBody({ fields: { provinces: [...PROVINCE_CODES].reverse() } }));
    expect(r.success && r.data.type === 'lead_b2b' && r.data.fields.provinces.length).toBe(34);
  });
  it.each(['quote', 'demo', 'integration'])('intent %s hợp lệ (AC-B1…B3)', (intent) => {
    expect(LeadRequest.safeParse(b2bBody({ fields: { intent } })).success).toBe(true);
  });
});

describe('LeadRequest — mã lỗi details (contract mục 3.1)', () => {
  it('AC-B4: SĐT abc → fields.phone invalid_phone', () => {
    expect(details(b2bBody({ fields: { phone: 'abc' } }))[0]).toMatchObject({ field: 'fields.phone', code: 'invalid_phone' });
  });
  it('AC-B6: số bàn, số +1, 11 chữ số → invalid_phone', () => {
    for (const phone of ['028 3823 4567', '+1 415 555 0100', '09028080491']) {
      expect(codeOf(b2bBody({ fields: { phone } }), 'fields.phone')).toBe('invalid_phone');
    }
  });
  it('AC-B7: email sai → fields.workEmail invalid_email', () => {
    expect(codeOf(b2bBody({ fields: { workEmail: 'khong-phai-email' } }), 'fields.workEmail')).toBe('invalid_email');
  });
  it('thiếu từng trường bắt buộc → required đúng tên trường', () => {
    for (const key of ['intent', 'fullName', 'company', 'phone', 'workEmail', 'customerType', 'monthlyVolume', 'provinces']) {
      const body = b2bBody();
      delete (body.fields as Record<string, unknown>)[key];
      expect(codeOf(body, `fields.${key}`), key).toBe('required');
    }
  });
  it('họ tên: 1 ký tự, 101 ký tự, chỉ khoảng trắng, có emoji/chữ số', () => {
    expect(codeOf(b2bBody({ fields: { fullName: 'A' } }), 'fields.fullName')).toBe('too_short');
    expect(codeOf(b2bBody({ fields: { fullName: 'A'.repeat(101) } }), 'fields.fullName')).toBe('too_long');
    expect(codeOf(b2bBody({ fields: { fullName: '    ' } }), 'fields.fullName')).toBe('too_short');
    expect(codeOf(b2bBody({ fields: { fullName: 'An 😀' } }), 'fields.fullName')).toBe('invalid_format');
    expect(codeOf(b2bBody({ fields: { fullName: 'An 123' } }), 'fields.fullName')).toBe('invalid_format');
  });
  it('công ty chứa < > :// → lỗi', () => {
    expect(codeOf(b2bBody({ fields: { company: '<b>ABC</b>' } }), 'fields.company')).toBe('invalid_format');
    expect(codeOf(b2bBody({ fields: { company: 'https://abc.vn' } }), 'fields.company')).toBe('invalid_format');
  });
  it('tỉnh: rỗng → required, 35 phần tử → too_many, mã lạ → invalid_option', () => {
    expect(codeOf(b2bBody({ fields: { provinces: [] } }), 'fields.provinces')).toBe('required');
    expect(codeOf(b2bBody({ fields: { provinces: [...PROVINCE_CODES, '01'] } }), 'fields.provinces')).toBe('too_many');
    expect(codeOf(b2bBody({ fields: { provinces: ['99'] } }), 'fields.provinces')).toBe('invalid_option');
  });
  it('enum lạ → invalid_option', () => {
    expect(codeOf(b2bBody({ fields: { customerType: 'other' } }), 'fields.customerType')).toBe('invalid_option');
    expect(codeOf(b2bBody({ fields: { monthlyVolume: 'lots' } }), 'fields.monthlyVolume')).toBe('invalid_option');
    expect(codeOf(b2bBody({ fields: { intent: 'buy' } }), 'fields.intent')).toBe('invalid_option');
  });
  it('khóa lạ ở gốc, trong fields, trong consent → unknown_field (mục 6.2)', () => {
    expect(codeOf(b2bBody({ status: 'qualified' }), 'status')).toBe('unknown_field');
    expect(codeOf(b2bBody({ ipHash: 'x' }), 'ipHash')).toBe('unknown_field');
    expect(codeOf(b2bBody({ fields: { id: 'x' } }), 'fields.id')).toBe('unknown_field');
    expect(codeOf(b2bBody({ consent: { version: 'b2b-2026-10-v1', purposes: [], at: 'x' } }), 'consent.at')).toBe('unknown_field');
  });
  it('type lạ hoặc thiếu → lỗi ở trường type', () => {
    expect(codeOf({ ...b2bBody(), type: 'warranty_registration' }, 'type')).toBe('invalid_option');
    const noType: Record<string, unknown> = b2bBody();
    delete noType.type;
    expect(details(noType).length).toBeGreaterThan(0);
  });
  it('ghi chú > 1.000 ký tự → too_long', () => {
    expect(codeOf(b2bBody({ fields: { note: 'x'.repeat(1001) } }), 'fields.note')).toBe('too_long');
  });
});

describe('LeadRequest — form thợ (lead-technician.md)', () => {
  it('AC-T2/T5: hợp lệ, đúng 4 khóa, other hợp lệ', () => {
    const r = LeadRequest.safeParse(techBody({ fields: { primarySkill: 'other', phone: '0912 345 678' } }));
    expect(r.success).toBe(true);
    if (r.success) expect(Object.keys(r.data.fields).sort()).toEqual(['fullName', 'phone', 'primarySkill', 'province']);
  });
  it('AC-T3: SĐT abc → invalid_phone', () => {
    expect(details(techBody({ fields: { phone: 'abc' } }))[0]).toMatchObject({ field: 'fields.phone', code: 'invalid_phone' });
  });
  it('AC-T4: thiếu tỉnh → required; 99 → invalid_option; mảng → invalid_format', () => {
    const missing = techBody();
    delete (missing.fields as Record<string, unknown>).province;
    expect(codeOf(missing, 'fields.province')).toBe('required');
    expect(codeOf(techBody({ fields: { province: '99' } }), 'fields.province')).toBe('invalid_option');
    expect(codeOf(techBody({ fields: { province: ['79', '01'] } }), 'fields.province')).toBe('invalid_format');
  });
  it('AC-T6: trường thứ 5 → unknown_field', () => {
    for (const key of ['email', 'dateOfBirth', 'address', 'idNumber']) {
      expect(codeOf(techBody({ fields: { [key]: 'x' } }), `fields.${key}`), key).toBe('unknown_field');
    }
  });
  it('kỹ năng lạ → invalid_option', () => {
    expect(codeOf(techBody({ fields: { primarySkill: 'plumbing_pro' } }), 'fields.primarySkill')).toBe('invalid_option');
  });
});

describe('sanitizeMeta — siêu dữ liệu lỏng (Rule 5)', () => {
  it('sửa/bỏ giá trị sai, ghi meta.sanitized, không làm hỏng lead', () => {
    const m = sanitizeMeta({
      utm: { source: 'a'.repeat(500), medium: 'cpc\u0007', evil: 'x' },
      pagePath: 'https://evil.example',
      filmTier: 'X',
      locale: 'fr',
    });
    expect(m.utm.source).toHaveLength(100);
    expect(m.utm.medium).toBe('cpc');
    expect(m.utm).not.toHaveProperty('evil');
    expect(m.pagePath).toBe('/');
    expect(m.filmTier).toBeNull();
    expect(m.locale).toBe('vi');
    expect(m.sanitized).toEqual(expect.arrayContaining(['utm.unknown_keys', 'utm.source', 'utm.medium', 'pagePath', 'filmTier', 'locale']));
  });
  it('review M2: utm bỏ NUL/định hướng/surrogate lẻ; cắt 100 ký tự không để lại nửa cặp surrogate', () => {
    const m = sanitizeMeta({ utm: { source: 'zalo\u0000\udfff', campaign: 'c\u202E', content: `${'a'.repeat(99)}😀` } });
    expect(m.utm).toEqual({ source: 'zalo', campaign: 'c', content: 'a'.repeat(99) });
    expect(m.sanitized).toEqual(expect.arrayContaining(['utm.source', 'utm.campaign', 'utm.content']));
  });
  it('giá trị đúng giữ nguyên, sanitized rỗng', () => {
    const m = sanitizeMeta({ utm: { source: 'zalo' }, pagePath: '/en/contact', filmTier: 'T-LITE', locale: 'en' });
    expect(m).toEqual({ utm: { source: 'zalo' }, pagePath: '/en/contact', filmTier: 'T-LITE', locale: 'en', sanitized: [] });
  });
});
