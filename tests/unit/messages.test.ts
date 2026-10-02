import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NAMESPACES, pickClientMessages, SERVER_ONLY_COMMON_KEYS } from '@/i18n/messages';
import type { AppMessages } from '@/i18n/types';

type Tree = { [k: string]: string | Tree };

function load(locale: string, ns: string): Tree {
  return JSON.parse(readFileSync(`messages/${locale}/${ns}.json`, 'utf8')) as Tree;
}

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else Object.assign(out, flatten(v, key));
  }
  return out;
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort();

// Ký tự chỉ có trong tiếng Việt (không gồm chữ Latin cơ bản)
const VIETNAMESE = /[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵÀÁẢÃẠẰẮẲẴẶẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤỪỨỬỮỰỲÝỶỸỴ]/;
// Ngoại lệ có chủ đích: tên ngôn ngữ viết bằng chính ngôn ngữ đó
const EN_ALLOW_VIETNAMESE = new Set(['common.language.viName']);

describe.each(NAMESPACES.map((ns) => [ns]))('messages/*/%s.json', (ns) => {
  const vi = flatten(load('vi', ns));
  const en = flatten(load('en', ns));

  it('VI và EN có đúng cùng bộ khóa', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort());
  });

  it('không có chuỗi rỗng', () => {
    for (const [k, v] of [...Object.entries(vi), ...Object.entries(en)]) expect(v.trim(), k).not.toBe('');
  });

  it('cùng biến ICU {…} ở hai ngôn ngữ', () => {
    for (const k of Object.keys(vi)) expect(placeholders(en[k] ?? ''), k).toEqual(placeholders(vi[k] ?? ''));
  });

  it('bản EN không chứa chữ tiếng Việt (docs/04 G6)', () => {
    for (const [k, v] of Object.entries(en)) {
      if (EN_ALLOW_VIETNAMESE.has(`${ns}.${k}`)) continue;
      expect(VIETNAMESE.test(v), `${ns}.${k}: "${v}"`).toBe(false);
    }
  });

  it('không viết hoa cả câu giữa dòng, không "!!" hay "?!" (docs/03 mục 11.5)', () => {
    for (const [k, v] of [...Object.entries(vi), ...Object.entries(en)]) {
      expect(/!!|\?!/.test(v), k).toBe(false);
    }
  });
});

describe('payload messages gửi xuống trình duyệt (i18n/messages.ts → pickClientMessages)', () => {
  it('không mang nhánh chỉ-server của common (status, dev, kpi) — production không có chữ "Nháp" trong payload RSC', () => {
    for (const locale of ['vi', 'en'] as const) {
      const all = Object.fromEntries(NAMESPACES.map((ns) => [ns, load(locale, ns)])) as unknown as AppMessages;
      const client = pickClientMessages(all);
      expect(Object.keys(client).sort()).toEqual(['common', 'errors']);
      for (const key of SERVER_ONLY_COMMON_KEYS) expect(client.common, `${locale}: common.${key}`).not.toHaveProperty(key);
      const payload = JSON.stringify(client);
      for (const value of Object.values(flatten(load(locale, 'common').status as Tree))) {
        expect(payload, `${locale}: "${value}"`).not.toContain(`"${value}"`);
      }
      expect(client.common.cta.quote).toBe(all.common.cta.quote);
    }
  });
});
