import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { statSchema } from '@/content/schemas';
import { getStat, stats } from '@/content/stats';
import { isDraftPreview } from '@/lib/env';
import { legacyRegionCounts, pendingStats, statView, statViews } from '@/lib/stats';

const ALL_IDS = stats.map((s) => s.id);
const REGIONS = ['north', 'central', 'south'] as const;

/**
 * Số ĐANG GHI trên site cũ (content/stats.ts → legacyValue, legacyByRegion) chỉ được hiện ở bản xem trước
 * (DRAFT_PREVIEW=1, kèm nhãn "Nháp · số site cũ"). Production KHÔNG BAO GIỜ hiện — chứng minh ở 2 lớp:
 *   1. cổng lib/stats.ts không trả 'legacy' khi không phải bản xem trước (đọc env như lúc build);
 *   2. không file nào ngoài cổng đọc thẳng trường legacy* (dò mã nguồn app/, components/, lib/, i18n/).
 * Lớp 3 (HTML thật): scripts/check-no-draft.mjs dò bản build production.
 */
describe('lib/stats.ts — số site cũ không lên production', () => {
  const saved = process.env.DRAFT_PREVIEW;
  afterEach(() => {
    if (saved === undefined) delete process.env.DRAFT_PREVIEW;
    else process.env.DRAFT_PREVIEW = saved;
  });

  it('production (không đặt DRAFT_PREVIEW): không ô "legacy", KPI chưa đo không render, không ghi chú "chờ số"', () => {
    delete process.env.DRAFT_PREVIEW;
    expect(isDraftPreview()).toBe(false);
    for (const s of stats) {
      const view = statView(s);
      expect(view?.kind, s.id).not.toBe('legacy');
      if (s.value === null) expect(view, s.id).toBeNull();
    }
    expect(statViews(ALL_IDS).filter((v) => v.kind === 'legacy')).toEqual([]);
    expect(pendingStats(ALL_IDS)).toEqual([]);
    for (const r of REGIONS) expect(legacyRegionCounts(r), r).toEqual([]);
  });

  it('chỉ đúng chuỗi "1" mới bật bản xem trước', () => {
    for (const value of ['0', 'true', 'yes', '', ' 1']) {
      process.env.DRAFT_PREVIEW = value;
      expect(statViews(ALL_IDS).some((v) => v.kind === 'legacy'), JSON.stringify(value)).toBe(false);
      for (const r of REGIONS) expect(legacyRegionCounts(r)).toEqual([]);
    }
  });

  it('bản xem trước: KPI chưa đo mà site cũ có số → ô "legacy" đúng số, định dạng, dấu "+"', () => {
    for (const s of stats) {
      const view = statView(s, { draftPreview: true });
      if (s.value !== null) expect(view?.kind).toBe('measured');
      else if (s.legacyValue === null) expect(view).toBeNull();
      else {
        expect(view).toMatchObject({
          kind: 'legacy',
          value: s.legacyValue,
          format: s.legacyFormat ?? s.format,
          plus: s.legacyPlus === true,
        });
      }
    }
    // Bộ đã thống nhất (website-services-3d/noi-dung/NOI-DUNG.md mục 13): 500+ thợ · 34 tỉnh · 60 phút xác nhận lịch
    expect(statViews(ALL_IDS, { draftPreview: true }).map((v) => `${v.stat.id}=${v.value}${v.plus ? '+' : ''}:${v.format}`)).toEqual([
      'K1=500+:integer',
      'K2=34:of-34',
      'K6=60:minutes',
    ]);
    expect(pendingStats(ALL_IDS, { draftPreview: true }).map((s) => s.id)).toEqual(['K3', 'K4', 'K5']);
    expect(legacyRegionCounts('south', { draftPreview: true }).map((r) => `${r.label.vi}=${r.value}`)).toEqual([
      'Miền Nam=200',
      'Mekong=60',
    ]);
  });

  it('có số đo thật thì số thật thắng ở mọi môi trường (legacyValue bị bỏ qua)', () => {
    const measured = { ...getStat('K1'), value: 412, updatedAt: '2026-10-01', source: 'Vận hành, đối soát 90 ngày' };
    expect(statView(measured, { draftPreview: true })).toMatchObject({ kind: 'measured', value: 412, plus: false });
    expect(statView(measured, { draftPreview: false })).toMatchObject({ kind: 'measured', value: 412, plus: false });
    expect(statSchema.safeParse(measured).success).toBe(true);
  });

  it('schema: số site cũ phải có nguồn; legacyPlus/legacyFormat chỉ đi cùng legacyValue', () => {
    expect(statSchema.safeParse({ ...getStat('K1'), legacySource: null }).success).toBe(false);
    expect(statSchema.safeParse({ ...getStat('K3'), legacyPlus: true }).success).toBe(false);
    expect(statSchema.safeParse({ ...getStat('K2'), legacyValue: 63 }).success).toBe(false); // of-34: ≤ 34
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
