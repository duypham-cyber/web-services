import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { statSchema, type Stat } from '@/content/schemas';
import { getStat, stats } from '@/content/stats';
import { isDraftPreview } from '@/lib/env';
import { formatRegionCount, legacyRegionCounts, pendingStats, regionCounts, statView, statViews } from '@/lib/stats';

const ALL_IDS = stats.map((s) => s.id);
const REGIONS = ['north', 'central', 'south'] as const;
const APPROVED_SOURCE = 'Anh Duy duyệt 03/10/2026 (D-26) — số đang công bố trên lapdattoanquoc.vn, bộ NOI-DUNG.md mục 13';

const short = (v: { stat: Stat; value: number; plus: boolean; format: string; kind: string }) =>
  `${v.stat.id}=${v.value}${v.plus ? '+' : ''}:${v.format}:${v.kind}`;

/** K1 như trước ngày duyệt (03/10/2026): chưa có value, chỉ có số site cũ → đại diện cho mọi "số nháp". */
function k1BeforeApproval(): Stat {
  const { basis: _basis, plus: _plus, byRegion: _byRegion, ...rest } = getStat('K1');
  return { ...rest, value: null, updatedAt: null, source: null };
}

/**
 * Hai loại số được hiện ở MỌI môi trường: số đo thật (basis "measured") và số công bố/mốc cam kết anh Duy đã duyệt
 * (basis "published", D-26: 500+ thợ, 34/34 tỉnh, 60 phút, số thợ theo miền). Số ĐANG GHI trên site cũ (legacy*) chỉ được
 * hiện ở bản xem trước (DRAFT_PREVIEW=1, kèm nhãn "Nháp · số site cũ") và chỉ khi KPI chưa có số duyệt. Production KHÔNG
 * BAO GIỜ hiện số nháp — chứng minh ở 2 lớp:
 *   1. cổng lib/stats.ts không trả 'legacy' khi không phải bản xem trước (đọc env như lúc build);
 *   2. không file nào ngoài cổng đọc thẳng trường legacy* (dò mã nguồn app/, components/, lib/, i18n/).
 * Lớp 3 (HTML thật): scripts/check-no-draft.mjs dò bản build production.
 */
describe('content/stats.ts — bộ số anh Duy duyệt 03/10/2026 (D-26, D-27)', () => {
  it('K1 500+, K2 34/34, K6 60 phút là số công bố đã duyệt; K3, K4, K5 vẫn null', () => {
    expect(stats.filter((s) => s.value !== null).map((s) => [s.id, s.value, s.format, s.basis, s.plus === true])).toEqual([
      ['K1', 500, 'integer', 'published', true],
      ['K2', 34, 'of-34', 'published', false],
      ['K6', 60, 'minutes', 'published', false],
    ]);
    for (const id of ['K1', 'K2', 'K6'] as const) {
      expect(getStat(id)).toMatchObject({ updatedAt: '2026-10-03', source: APPROVED_SOURCE });
    }
    for (const id of ['K3', 'K4', 'K5'] as const) {
      expect(getStat(id)).toMatchObject({ value: null, updatedAt: null, source: null });
    }
  });

  it('số theo miền đã duyệt: Bắc 120+ · Trung 80+ · Nam 200+ · Mekong 60+ (Mekong đặt vào vùng south)', () => {
    expect(getStat('K1').byRegion?.map((r) => `${r.region}:${r.label.vi}=${r.value}${r.plus ? '+' : ''}`)).toEqual([
      'north:Miền Bắc=120+',
      'central:Miền Trung=80+',
      'south:Miền Nam=200+',
      'south:Mekong=60+',
    ]);
  });

  it('số công bố không được gọi là số đo: nhãn/định nghĩa không nói "đang hoạt động", "90 ngày", "trung bình"', () => {
    const MEASURED_WORDING = /hoạt động|90 ngày|trung bình|\bactive\b|90 days|average/i;
    for (const s of stats.filter((x) => x.basis === 'published')) {
      for (const text of [s.label.vi, s.label.en, s.definition.vi, s.definition.en]) {
        expect(text, `${s.id}: "${text}"`).not.toMatch(MEASURED_WORDING);
      }
    }
  });
});

describe('lib/stats.ts — số đã duyệt hiện ở production, số nháp không', () => {
  const saved = process.env.DRAFT_PREVIEW;
  afterEach(() => {
    if (saved === undefined) delete process.env.DRAFT_PREVIEW;
    else process.env.DRAFT_PREVIEW = saved;
  });

  it('production (không đặt DRAFT_PREVIEW): hiện đúng số đã duyệt, không ô "legacy", không ghi chú "chờ số"', () => {
    delete process.env.DRAFT_PREVIEW;
    expect(isDraftPreview()).toBe(false);
    for (const s of stats) {
      const view = statView(s);
      expect(view?.kind, s.id).not.toBe('legacy');
      if (s.value === null) expect(view, s.id).toBeNull();
      else expect(view, s.id).toMatchObject({ kind: 'published', value: s.value, format: s.format });
    }
    expect(statViews(ALL_IDS).map(short)).toEqual(['K1=500+:integer:published', 'K2=34:of-34:published', 'K6=60:minutes:published']);
    expect(pendingStats(ALL_IDS)).toEqual([]);
    for (const r of REGIONS) expect(legacyRegionCounts(r), r).toEqual([]);
  });

  it('production: số nháp (KPI chưa có số duyệt, chỉ có số site cũ) vẫn ẩn hẳn', () => {
    delete process.env.DRAFT_PREVIEW;
    expect(statView(k1BeforeApproval())).toBeNull();
    expect(statView({ ...getStat('K3'), legacyValue: 1200, legacyPlus: true })).toBeNull();
  });

  it('chỉ đúng chuỗi "1" mới bật bản xem trước', () => {
    for (const value of ['0', 'true', 'yes', '', ' 1']) {
      process.env.DRAFT_PREVIEW = value;
      expect(statView(k1BeforeApproval()), JSON.stringify(value)).toBeNull();
      expect(statViews(ALL_IDS).some((v) => v.kind === 'legacy'), JSON.stringify(value)).toBe(false);
      for (const r of REGIONS) expect(legacyRegionCounts(r)).toEqual([]);
    }
  });

  it('bản xem trước: số đã duyệt thắng số site cũ (không nhãn nháp); KPI chưa có số nào → dòng "Chờ số liệu"', () => {
    expect(statViews(ALL_IDS, { draftPreview: true }).map(short)).toEqual([
      'K1=500+:integer:published',
      'K2=34:of-34:published',
      'K6=60:minutes:published',
    ]);
    expect(pendingStats(ALL_IDS, { draftPreview: true }).map((s) => s.id)).toEqual(['K3', 'K4', 'K5']);
    // K1 đã có số duyệt → số theo miền site cũ không còn hiện ở đâu (kể cả bản xem trước); dùng regionCounts()
    for (const r of REGIONS) expect(legacyRegionCounts(r, { draftPreview: true }), r).toEqual([]);
  });

  it('bản xem trước: KPI chưa có số duyệt mà site cũ có số → ô "legacy" đúng số, định dạng, dấu "+"', () => {
    expect(statView(k1BeforeApproval(), { draftPreview: true })).toMatchObject({ kind: 'legacy', value: 500, format: 'integer', plus: true });
    expect(statView({ ...getStat('K3'), legacyValue: 1200 }, { draftPreview: true })).toMatchObject({
      kind: 'legacy',
      value: 1200,
      plus: false,
    });
  });

  it('số đo thật (basis mặc định) → kind "measured", không "+", thắng số site cũ ở mọi môi trường', () => {
    const measured = { ...getStat('K3'), value: 1234, updatedAt: '2026-10-01', source: 'Vận hành, đối soát 12 tháng', legacyValue: 999 };
    expect(statSchema.safeParse(measured).success).toBe(true);
    expect(statView(measured, { draftPreview: true })).toMatchObject({ kind: 'measured', value: 1234, plus: false });
    expect(statView(measured, { draftPreview: false })).toMatchObject({ kind: 'measured', value: 1234, plus: false });
  });
});

describe('lib/stats.ts — regionCounts(): số thợ theo miền đã duyệt (API cho trang /mang-luoi và hero bản đồ)', () => {
  const saved = process.env.DRAFT_PREVIEW;
  afterEach(() => {
    if (saved === undefined) delete process.env.DRAFT_PREVIEW;
    else process.env.DRAFT_PREVIEW = saved;
  });

  it('đọc được ở mọi môi trường, đúng thứ tự, Mekong là dòng riêng trong vùng south', () => {
    for (const draftPreview of [undefined, '1']) {
      if (draftPreview === undefined) delete process.env.DRAFT_PREVIEW;
      else process.env.DRAFT_PREVIEW = draftPreview;
      expect(regionCounts('north').map((r) => `${r.label.vi}=${r.value}${r.plus ? '+' : ''}`)).toEqual(['Miền Bắc=120+']);
      expect(regionCounts('central').map((r) => `${r.label.en}=${r.value}`)).toEqual(['Central region=80']);
      expect(regionCounts('south').map((r) => `${r.region}:${r.label.vi}=${r.value}`)).toEqual(['south:Miền Nam=200', 'south:Mekong=60']);
      expect(regionCounts().map((r) => r.value)).toEqual([120, 80, 200, 60]);
    }
  });

  it('formatRegionCount: định dạng số theo ngôn ngữ + dấu "+"', () => {
    expect(formatRegionCount({ value: 120, plus: true }, 'vi')).toBe('120+');
    expect(formatRegionCount({ value: 1200, plus: true }, 'vi')).toBe('1.200+');
    expect(formatRegionCount({ value: 1200, plus: false }, 'en')).toBe('1,200');
  });
});

describe('content/schemas.ts — statSchema', () => {
  it('số site cũ phải có nguồn; legacyPlus/legacyFormat chỉ đi cùng legacyValue', () => {
    expect(statSchema.safeParse({ ...getStat('K1'), legacySource: null }).success).toBe(false);
    expect(statSchema.safeParse({ ...getStat('K3'), legacyPlus: true }).success).toBe(false);
    expect(statSchema.safeParse({ ...getStat('K2'), legacyValue: 63 }).success).toBe(false); // of-34: ≤ 34
  });

  it('dấu "+" và số theo miền có "+" chỉ dùng cho số công bố đã duyệt (basis "published")', () => {
    const k3 = { ...getStat('K3'), value: 10, updatedAt: '2026-10-03', source: 'x' };
    expect(statSchema.safeParse({ ...k3, plus: true }).success).toBe(false);
    expect(statSchema.safeParse({ ...k3, basis: 'measured', plus: true }).success).toBe(false);
    expect(statSchema.safeParse({ ...k3, basis: 'published', plus: true }).success).toBe(true);
    expect(statSchema.safeParse({ ...getStat('K1'), basis: 'measured', plus: undefined }).success).toBe(false); // byRegion có "+"
  });

  it('basis/plus/byRegion chỉ dùng khi có value; có value thì bắt buộc ngày + nguồn', () => {
    expect(statSchema.safeParse({ ...getStat('K3'), basis: 'published' }).success).toBe(false);
    expect(statSchema.safeParse({ ...getStat('K3'), plus: false }).success).toBe(false);
    expect(statSchema.safeParse({ ...getStat('K1'), value: null }).success).toBe(false); // còn basis/plus/byRegion
    expect(statSchema.safeParse(k1BeforeApproval()).success).toBe(true);
    expect(statSchema.safeParse({ ...getStat('K2'), updatedAt: null }).success).toBe(false);
    expect(statSchema.safeParse({ ...getStat('K6'), source: null }).success).toBe(false);
  });
});

describe('Không nơi nào đọc thẳng trường legacy* — mọi đường hiển thị đi qua lib/stats.ts', () => {
  const LEGACY_FIELD = /\blegacy(Value|Plus|Format|Source|ByRegion)\b/;
  const ALLOWED = new Set([join('lib', 'stats.ts')]);

  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return walk(path);
      return /\.(ts|tsx|mts|mjs)$/.test(name) ? [path] : [];
    });
  }

  it('app/, components/, lib/, i18n/, proxy.ts không nhắc tới trường legacy* (trừ lib/stats.ts)', () => {
    const files = [...walk('app'), ...walk('components'), ...walk('lib'), ...walk('i18n'), 'proxy.ts'];
    const offenders = files.filter((f) => !ALLOWED.has(f) && LEGACY_FIELD.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
