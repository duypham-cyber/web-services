/**
 * Kiểm inline phía trình duyệt — CÙNG luật với server (lib/leads/rules.ts, contract mục 3.1). Server vẫn kiểm lại bằng
 * Zod và không tin kết quả ở đây; FE kiểm để báo lỗi ngay khi rời ô và không gửi request chắc chắn hỏng.
 * Kết quả là KHÓA câu chữ trong messages leads.fieldErrors (+ tham số), không phải câu chữ.
 */
import {
  B2B_INTENTS,
  CUSTOMER_TYPES,
  LIMITS,
  MONTHLY_VOLUMES,
  PERSON_NAME,
  PRIMARY_SKILLS,
  PROVINCE_CODES,
  cleanMultiline,
  cleanText,
  hasMarkupOrUrl,
  normalizePhoneVN,
  type B2BIntent,
  type LeadDetailCode,
} from '@/lib/leads/rules';
import type { AppMessages } from '@/i18n/types';

export type FieldErrorKey = keyof AppMessages['leads']['fieldErrors'];
export type FieldError = { key: FieldErrorKey; params?: Record<string, number> };
export type FieldErrors<K extends string> = Partial<Record<K | 'consent', FieldError>>;

export type B2BValues = {
  fullName: string;
  company: string;
  jobTitle: string;
  phone: string;
  workEmail: string;
  customerType: string;
  monthlyVolume: string;
  provinces: string[];
  note: string;
};
export type B2BField = keyof B2BValues;
export const B2B_FIELD_ORDER: readonly B2BField[] = [
  'fullName',
  'company',
  'jobTitle',
  'phone',
  'workEmail',
  'customerType',
  'monthlyVolume',
  'provinces',
  'note',
];
export const EMPTY_B2B: B2BValues = {
  fullName: '',
  company: '',
  jobTitle: '',
  phone: '',
  workEmail: '',
  customerType: '',
  monthlyVolume: '',
  provinces: [],
  note: '',
};

export type TechnicianValues = { fullName: string; phone: string; province: string; primarySkill: string };
export type TechnicianField = keyof TechnicianValues;
export const TECHNICIAN_FIELD_ORDER: readonly TechnicianField[] = ['fullName', 'phone', 'province', 'primarySkill'];
export const EMPTY_TECHNICIAN: TechnicianValues = { fullName: '', phone: '', province: '', primarySkill: '' };

const CHOICE_FIELDS = new Set(['customerType', 'monthlyVolume', 'province', 'primarySkill']);

// Email: một @, không khoảng trắng, phần tên miền có dấu chấm (Zod .email() ở server chặt hơn — server là chuẩn)
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/;

function lengthError(value: string, limits: { min: number; max: number }): FieldError | null {
  if (value.length < limits.min) return { key: 'too_short', params: { min: limits.min } };
  if (value.length > limits.max) return { key: 'too_long', params: { max: limits.max } };
  return null;
}

function nameError(raw: string): FieldError | null {
  const v = cleanText(raw);
  if (raw.length === 0) return { key: 'required' };
  return lengthError(v, LIMITS.fullName) ?? (PERSON_NAME.test(v) ? null : { key: 'invalidName' });
}

function phoneError(raw: string): FieldError | null {
  if (raw.trim() === '') return { key: 'required' };
  return normalizePhoneVN(raw.trim()) ? null : { key: 'invalid_phone' };
}

function choiceError(value: string, options: readonly string[]): FieldError | null {
  if (value === '') return { key: 'requiredChoice' };
  return options.includes(value) ? null : { key: 'invalid_option' };
}

export function validateB2BField(field: B2BField, values: B2BValues): FieldError | null {
  switch (field) {
    case 'fullName':
      return nameError(values.fullName);
    case 'company': {
      const v = cleanText(values.company);
      if (values.company.length === 0) return { key: 'required' };
      return lengthError(v, LIMITS.company) ?? (hasMarkupOrUrl(v) ? { key: 'invalidCompany' } : null);
    }
    case 'jobTitle': {
      const v = cleanText(values.jobTitle);
      return v === '' ? null : lengthError(v, LIMITS.jobTitle);
    }
    case 'phone':
      return phoneError(values.phone);
    case 'workEmail': {
      const v = values.workEmail.trim();
      if (v === '') return { key: 'required' };
      if (v.length > LIMITS.email) return { key: 'too_long', params: { max: LIMITS.email } };
      return EMAIL.test(v) ? null : { key: 'invalid_email' };
    }
    case 'customerType':
      return choiceError(values.customerType, CUSTOMER_TYPES);
    case 'monthlyVolume':
      return choiceError(values.monthlyVolume, MONTHLY_VOLUMES);
    case 'provinces':
      if (values.provinces.length === 0) return { key: 'requiredProvinces' };
      return values.provinces.every((c) => PROVINCE_CODES.includes(c)) ? null : { key: 'invalid_option' };
    case 'note':
      return cleanMultiline(values.note).length > LIMITS.note ? { key: 'too_long', params: { max: LIMITS.note } } : null;
  }
}

export function validateTechnicianField(field: TechnicianField, values: TechnicianValues): FieldError | null {
  switch (field) {
    case 'fullName':
      return nameError(values.fullName);
    case 'phone':
      return phoneError(values.phone);
    case 'province':
      return choiceError(values.province, PROVINCE_CODES);
    case 'primarySkill':
      return choiceError(values.primarySkill, PRIMARY_SKILLS);
  }
}

export function validateAll<K extends string, V>(
  order: readonly K[],
  values: V,
  one: (field: K, values: V) => FieldError | null,
): FieldErrors<K> {
  const out: FieldErrors<K> = {};
  for (const field of order) {
    const e = one(field, values);
    if (e) out[field] = e;
  }
  return out;
}

/** `fields` của request B2B (contract mục 3.1): chuỗi rỗng của trường tùy chọn → null. */
export function b2bPayloadFields(values: B2BValues, intent: B2BIntent) {
  const jobTitle = cleanText(values.jobTitle);
  const note = cleanMultiline(values.note);
  return {
    intent: (B2B_INTENTS as readonly string[]).includes(intent) ? intent : 'quote',
    fullName: cleanText(values.fullName),
    company: cleanText(values.company),
    jobTitle: jobTitle === '' ? null : jobTitle,
    phone: values.phone.trim(),
    workEmail: values.workEmail.trim(),
    customerType: values.customerType,
    monthlyVolume: values.monthlyVolume,
    provinces: [...new Set(values.provinces)].sort(),
    note: note === '' ? null : note,
  };
}

/** `fields` của request thợ: ĐÚNG 4 khóa (Rule T1). */
export function technicianPayloadFields(values: TechnicianValues) {
  return {
    fullName: cleanText(values.fullName),
    phone: values.phone.trim(),
    province: values.province,
    primarySkill: values.primarySkill,
  };
}

const MIN_MAX: Record<string, { min: number; max: number }> = {
  fullName: LIMITS.fullName,
  company: LIMITS.company,
  jobTitle: LIMITS.jobTitle,
  note: { min: 0, max: LIMITS.note },
  workEmail: { min: 0, max: LIMITS.email },
  provinces: LIMITS.provinces,
};

/** details[] của API ('fields.phone' + 'invalid_phone') → lỗi của từng ô. Trường lạ → null (hiện lỗi chung). */
export function errorFromDetail(field: string, code: LeadDetailCode): { field: string; error: FieldError } | null {
  if (field === 'consent.purposes') {
    return { field: 'consent', error: { key: code === 'required' ? 'requiredConsent' : 'unknown_purpose' } };
  }
  if (!field.startsWith('fields.')) return null;
  const name = field.slice('fields.'.length);
  const limits = MIN_MAX[name];
  switch (code) {
    case 'required':
      return {
        field: name,
        error: { key: name === 'provinces' ? 'requiredProvinces' : CHOICE_FIELDS.has(name) ? 'requiredChoice' : 'required' },
      };
    case 'too_short':
      return { field: name, error: { key: 'too_short', params: { min: limits?.min ?? 2 } } };
    case 'too_long':
      return { field: name, error: { key: 'too_long', params: { max: limits?.max ?? 100 } } };
    case 'invalid_format':
      return {
        field: name,
        error: { key: name === 'fullName' ? 'invalidName' : name === 'company' ? 'invalidCompany' : 'invalid_format' },
      };
    default:
      return { field: name, error: { key: code } };
  }
}
