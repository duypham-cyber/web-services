import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fmt, uuidV4 } from '@/components/leads/client-utils';
import { UTM_KEYS as CLIENT_UTM_KEYS } from '@/components/leads/utm';
import {
  B2B_FIELD_ORDER,
  EMPTY_B2B,
  EMPTY_TECHNICIAN,
  b2bPayloadFields,
  errorFromDetail,
  technicianPayloadFields,
  validateAll,
  validateB2BField,
  validateTechnicianField,
  type B2BValues,
} from '@/components/leads/validation';
import { LEAD_DETAIL_CODES, LEAD_ERROR_CODES, PROVINCE_CODES, UTM_KEYS } from '@/lib/leads/rules';
import { LeadB2BFields, LeadTechnicianFields } from '@/lib/leads/schema';
import vi from '@/messages/vi/leads.json';
import en from '@/messages/en/leads.json';

/**
 * Form lead phía trình duyệt (components/leads) — contracts/lead-b2b.md mục 3.1 + Rule 7, lead-technician.md Rule T1.
 * Kiểm: luật inline khớp server (Zod ở lib/leads/schema.ts), payload đúng shape, mã lỗi API nào cũng có câu VI/EN,
 * không dùng API chỉ có ở ngữ cảnh an toàn (bản xem trước chạy HTTP qua IP).
 */
const valid: B2BValues = {
  fullName: 'Nguyễn Văn An',
  company: 'Công ty Điện máy Thử',
  jobTitle: '',
  phone: '0902 808 049',
  workEmail: 'an@congty-thu.vn',
  customerType: 'brand',
  monthlyVolume: 'unknown',
  provinces: ['79', '01'],
  note: '',
};

describe('kiểm inline form B2B', () => {
  it('dữ liệu hợp lệ → không lỗi; payload qua được Zod của server', () => {
    expect(validateAll(B2B_FIELD_ORDER, valid, validateB2BField)).toEqual({});
    const fields = b2bPayloadFields(valid, 'demo');
    expect(LeadB2BFields.safeParse(fields).success).toBe(true);
    expect(fields).toMatchObject({ intent: 'demo', jobTitle: null, note: null, provinces: ['01', '79'] });
  });

  it('form trống → lỗi bắt buộc đúng loại (ô chữ / ô chọn / tỉnh), trường tùy chọn không lỗi', () => {
    const errs = validateAll(B2B_FIELD_ORDER, EMPTY_B2B, validateB2BField);
    expect(errs).toEqual({
      fullName: { key: 'required' },
      company: { key: 'required' },
      phone: { key: 'required' },
      workEmail: { key: 'required' },
      customerType: { key: 'requiredChoice' },
      monthlyVolume: { key: 'requiredChoice' },
      provinces: { key: 'requiredProvinces' },
    });
  });

  it.each([
    ['abc', 'invalid_phone'],
    ['028 3812 3456', 'invalid_phone'],
    ['+1 415 555 0100', 'invalid_phone'],
    ['84902808049', 'invalid_phone'],
    ['09028080499', 'invalid_phone'],
  ])('SĐT %s → %s (AC-B4, AC-B6)', (phone, key) => {
    expect(validateB2BField('phone', { ...valid, phone })).toEqual({ key });
  });

  it.each(['0902 808 049', '0902.808.049', '+84 902 808 049', '(090) 2808-049'])('SĐT %s hợp lệ (AC-B5)', (phone) => {
    expect(validateB2BField('phone', { ...valid, phone })).toBeNull();
  });

  it('họ tên: chỉ khoảng trắng → too_short, có chữ số/emoji → invalidName, 101 ký tự → too_long', () => {
    expect(validateB2BField('fullName', { ...valid, fullName: '   ' })).toEqual({ key: 'too_short', params: { min: 2 } });
    expect(validateB2BField('fullName', { ...valid, fullName: 'An 2' })).toEqual({ key: 'invalidName' });
    expect(validateB2BField('fullName', { ...valid, fullName: 'An 🙂' })).toEqual({ key: 'invalidName' });
    expect(validateB2BField('fullName', { ...valid, fullName: 'a'.repeat(101) })).toEqual({ key: 'too_long', params: { max: 100 } });
  });

  it('công ty có < > hoặc :// → invalidCompany; email sai → invalid_email; ghi chú > 1.000 → too_long', () => {
    expect(validateB2BField('company', { ...valid, company: '<b>ACME</b>' })).toEqual({ key: 'invalidCompany' });
    expect(validateB2BField('company', { ...valid, company: 'https://acme.vn' })).toEqual({ key: 'invalidCompany' });
    expect(validateB2BField('workEmail', { ...valid, workEmail: 'an@congty' })).toEqual({ key: 'invalid_email' });
    expect(validateB2BField('workEmail', { ...valid, workEmail: 'an@gmail.com' })).toBeNull(); // D-03: nhận
    expect(validateB2BField('note', { ...valid, note: 'x'.repeat(1001) })).toEqual({ key: 'too_long', params: { max: 1000 } });
  });

  it('"Toàn quốc" = đủ 34 mã và vẫn hợp lệ ở server (AC-B9)', () => {
    const fields = b2bPayloadFields({ ...valid, provinces: [...PROVINCE_CODES] }, 'quote');
    expect(fields.provinces).toHaveLength(34);
    expect(LeadB2BFields.safeParse(fields).success).toBe(true);
  });
});

describe('form thợ', () => {
  it('payload ĐÚNG 4 khóa và qua được Zod strict (Rule T1)', () => {
    const values = { fullName: 'Trần Văn Bình', phone: '0912.345.678', province: '79', primarySkill: 'other' };
    expect(validateAll(['fullName', 'phone', 'province', 'primarySkill'], values, validateTechnicianField)).toEqual({});
    const fields = technicianPayloadFields(values);
    expect(Object.keys(fields).sort()).toEqual(['fullName', 'phone', 'primarySkill', 'province']);
    expect(LeadTechnicianFields.safeParse(fields).success).toBe(true);
  });

  it('trống → bắt buộc; tỉnh/kỹ năng lạ → invalid_option', () => {
    expect(validateTechnicianField('province', EMPTY_TECHNICIAN)).toEqual({ key: 'requiredChoice' });
    expect(validateTechnicianField('province', { ...EMPTY_TECHNICIAN, province: '99' })).toEqual({ key: 'invalid_option' });
    expect(validateTechnicianField('primarySkill', { ...EMPTY_TECHNICIAN, primarySkill: 'plumbing_pro' })).toEqual({
      key: 'invalid_option',
    });
  });
});

describe('ánh xạ lỗi của API', () => {
  it('details[].field/code → lỗi của từng ô', () => {
    expect(errorFromDetail('fields.phone', 'invalid_phone')).toEqual({ field: 'phone', error: { key: 'invalid_phone' } });
    expect(errorFromDetail('fields.province', 'required')).toEqual({ field: 'province', error: { key: 'requiredChoice' } });
    expect(errorFromDetail('fields.provinces', 'required')).toEqual({ field: 'provinces', error: { key: 'requiredProvinces' } });
    expect(errorFromDetail('fields.fullName', 'invalid_format')).toEqual({ field: 'fullName', error: { key: 'invalidName' } });
    expect(errorFromDetail('consent.purposes', 'required')).toEqual({ field: 'consent', error: { key: 'requiredConsent' } });
    expect(errorFromDetail('headers.Idempotency-Key', 'invalid_format')).toBeNull();
  });

  it('mọi mã lỗi API và mã details đều có câu VI/EN (FE không hiện error.message)', () => {
    for (const messages of [vi, en]) {
      for (const code of [...LEAD_ERROR_CODES, 'NETWORK_ERROR', 'CLIENT_VALIDATION', 'CONSENT_RESTORED'] as const) {
        expect(messages.errors[code], code).toBeTruthy();
      }
      for (const code of LEAD_DETAIL_CODES) expect(messages.fieldErrors[code], code).toBeTruthy();
    }
  });
});

describe('tiện ích trình duyệt', () => {
  it('uuidV4 dùng getRandomValues, đúng dạng v4 (Idempotency-Key), không trùng', () => {
    const ids = new Set(Array.from({ length: 200 }, () => uuidV4()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('components/leads/utm.ts (không import gì, nằm trong chunk layout) giữ đúng UTM_KEYS của rules.ts', () => {
    expect([...CLIENT_UTM_KEYS]).toEqual([...UTM_KEYS]);
    expect(readFileSync('components/leads/utm.ts', 'utf8')).not.toMatch(/^import /m);
  });

  it('fmt thay {biến}, giữ nguyên biến không có giá trị', () => {
    expect(fmt('Thử lại sau {minutes} phút hoặc gọi {phone}.', { minutes: 3, phone: '0902 808 049' })).toBe(
      'Thử lại sau 3 phút hoặc gọi 0902 808 049.',
    );
    expect(fmt('Mã {code}')).toBe('Mã {code}');
  });

  it('components/leads không dùng crypto.randomUUID / crypto.subtle / clipboard (ngữ cảnh HTTP không an toàn)', () => {
    const dir = 'components/leads';
    for (const name of readdirSync(dir)) {
      // Bỏ chú thích (chú thích được nhắc tên các API này để giải thích vì sao không dùng)
      const src = readFileSync(join(dir, name), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      expect(src, name).not.toMatch(/randomUUID\s*\(|crypto\.subtle|navigator\.clipboard/);
    }
  });
});
