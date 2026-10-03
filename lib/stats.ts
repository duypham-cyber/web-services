import type { RegionId } from '@/content/provinces';
import type { LocalizedText, Stat, StatId } from '@/content/schemas';
import { getStat } from '@/content/stats';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from './env';
import { formatStatValue, type StatFormat } from './format';

/**
 * CỔNG DUY NHẤT để hiển thị KPI (content/stats.ts). Server Component gọi statView/statViews/regionCounts rồi render
 * <StatTile/>; KHÔNG đọc trực tiếp các trường legacy* của content/stats.ts ở nơi khác (tests/unit/stats.test.ts dò mã nguồn).
 *
 *   value + basis "measured" (mặc định)       → { kind: 'measured' }   số đo thật — mọi môi trường
 *   value + basis "published"                 → { kind: 'published' }  số công bố/mốc cam kết đã duyệt ("500+", "60 phút")
 *                                                                       — mọi môi trường, có "+" nếu số duyệt có "+"
 *   value null + legacyValue + bản xem trước   → { kind: 'legacy' }     số site cũ, kèm nhãn "Nháp · số site cũ"
 *   còn lại                                    → null                   (không render ô)
 *
 * Production (DRAFT_PREVIEW không bật lúc build) KHÔNG BAO GIỜ trả 'legacy' — có unit test chứng minh.
 * 'measured' và 'published' đều là số được phép hiện ở production; kiểm "được hiện chưa" bằng kind !== 'legacy'.
 */
export type StatView = {
  kind: 'measured' | 'published' | 'legacy';
  stat: Stat;
  value: number;
  format: StatFormat;
  /** Hậu tố "+": số công bố đã duyệt có "+" ("500+") hoặc số site cũ ghi "+". Luôn false với số đo thật. */
  plus: boolean;
};

type GateOptions = {
  /** Mặc định đọc DRAFT_PREVIEW lúc build (lib/env.ts). Truyền vào để test. */
  draftPreview?: boolean;
};

export function statView(stat: Stat, options?: GateOptions): StatView | null {
  if (stat.value !== null) {
    const published = stat.basis === 'published';
    return {
      kind: published ? 'published' : 'measured',
      stat,
      value: stat.value,
      format: stat.format,
      plus: published && stat.plus === true,
    };
  }
  const preview = options?.draftPreview ?? isDraftPreview();
  if (!preview || stat.legacyValue === null) return null;
  return {
    kind: 'legacy',
    stat,
    value: stat.legacyValue,
    format: stat.legacyFormat ?? stat.format,
    plus: stat.legacyPlus === true,
  };
}

/** Các ô KPI hiển thị được, theo thứ tự yêu cầu (ô không có số nào bị bỏ). */
export function statViews(ids: readonly StatId[], options?: GateOptions): StatView[] {
  return ids.map(getStat).flatMap((s) => {
    const view = statView(s, options);
    return view ? [view] : [];
  });
}

/**
 * KPI chưa có số nào để hiện (không số được duyệt, cũng không số site cũ) — CHỈ dùng cho dòng ghi chú "Chờ số liệu: …"
 * ở bản xem trước. Production: [] (không nhắc tới KPI vắng mặt).
 */
export function pendingStats(ids: readonly StatId[], options?: GateOptions): Stat[] {
  const preview = options?.draftPreview ?? isDraftPreview();
  if (!preview) return [];
  return ids.map(getStat).filter((s) => statView(s, { draftPreview: true }) === null);
}

/** Một dòng số thợ theo miền đã duyệt. `label` giữ tên miền như nguồn ghi ("Mekong" tách khỏi Miền Nam). */
export type RegionCount = { region: RegionId; label: LocalizedText; value: number; plus: boolean };

/**
 * Số thợ theo miền ĐÃ DUYỆT (K1.byRegion — anh Duy duyệt 03/10/2026, D-26): hiện ở MỌI môi trường, KHÔNG kèm nhãn nháp.
 *   regionCounts('north')  → [Miền Bắc 120+]
 *   regionCounts('south')  → [Miền Nam 200+, Mekong 60+]   (hai dòng như nguồn ghi — KHÔNG cộng thành số mới)
 *   regionCounts()         → cả 4 dòng theo thứ tự Bắc, Trung, Nam, Mekong
 * K1 chưa có số duyệt hoặc không có byRegion → []. Dùng ở Server Component; truyền kết quả (dữ liệu thuần) xuống client
 * qua props, đừng import file này vào client component.
 */
export function regionCounts(region?: RegionId): RegionCount[] {
  const k1 = getStat('K1');
  if (k1.value === null) return [];
  return (k1.byRegion ?? [])
    .filter((r) => region === undefined || r.region === region)
    .map((r) => ({ region: r.region, label: r.label, value: r.value, plus: r.plus }));
}

/** Chữ số của một dòng theo miền: vi "120+" · "1.200+", en "1,200+" (cùng cách định dạng với ô KPI). */
export function formatRegionCount(count: Pick<RegionCount, 'value' | 'plus'>, locale: Locale): string {
  return `${formatStatValue(count.value, 'integer', locale)}${count.plus ? '+' : ''}`;
}

export type LegacyRegionCount = { label: LocalizedText; value: number; plus: boolean };

/**
 * Số thợ theo miền site cũ ghi (/system-map, K1.legacyByRegion) — CHỈ bản xem trước và chỉ khi K1 chưa có số được duyệt.
 * Production: []. Từ 03/10/2026 K1 đã có số duyệt (D-26) nên hàm này luôn trả [] — số theo miền đọc bằng regionCounts().
 * Giữ hàm để code cũ không vỡ.
 */
export function legacyRegionCounts(region: RegionId, options?: GateOptions): LegacyRegionCount[] {
  const preview = options?.draftPreview ?? isDraftPreview();
  const k1 = getStat('K1');
  if (!preview || k1.value !== null) return [];
  return (k1.legacyByRegion ?? [])
    .filter((r) => r.region === region)
    .map((r) => ({ label: r.label, value: r.value, plus: r.plus }));
}
