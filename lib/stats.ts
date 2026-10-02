import type { RegionId } from '@/content/provinces';
import type { LocalizedText, Stat, StatId } from '@/content/schemas';
import { getStat } from '@/content/stats';
import { isDraftPreview } from './env';
import type { StatFormat } from './format';

/**
 * CỔNG DUY NHẤT để hiển thị KPI (content/stats.ts). Server Component gọi statView/statViews rồi render <StatTile/>;
 * KHÔNG đọc trực tiếp các trường legacy* của content/stats.ts ở nơi khác (tests/unit/stats.test.ts dò mã nguồn).
 *
 *   value có số thật                       → { kind: 'measured' }  (mọi môi trường, có count-up, ghi ngày cập nhật)
 *   value null + legacyValue + bản xem trước → { kind: 'legacy' }    (số site cũ, kèm nhãn "Nháp · số site cũ")
 *   còn lại                                → null                   (không render ô)
 *
 * Production (DRAFT_PREVIEW không bật lúc build) KHÔNG BAO GIỜ trả 'legacy' — có unit test chứng minh.
 */
export type StatView = {
  kind: 'measured' | 'legacy';
  stat: Stat;
  value: number;
  format: StatFormat;
  /** Hậu tố "+" như site cũ ghi ("500+"). Luôn false với số đo thật. */
  plus: boolean;
};

type GateOptions = {
  /** Mặc định đọc DRAFT_PREVIEW lúc build (lib/env.ts). Truyền vào để test. */
  draftPreview?: boolean;
};

export function statView(stat: Stat, options?: GateOptions): StatView | null {
  if (stat.value !== null) {
    return { kind: 'measured', stat, value: stat.value, format: stat.format, plus: false };
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
 * KPI chưa có số nào để hiện (không số thật, cũng không số site cũ) — CHỈ dùng cho dòng ghi chú "Chờ số liệu: …" ở bản
 * xem trước. Production: [] (không nhắc tới KPI vắng mặt).
 */
export function pendingStats(ids: readonly StatId[], options?: GateOptions): Stat[] {
  const preview = options?.draftPreview ?? isDraftPreview();
  if (!preview) return [];
  return ids.map(getStat).filter((s) => statView(s, { draftPreview: true }) === null);
}

export type LegacyRegionCount = { label: LocalizedText; value: number; plus: boolean };

/**
 * Số thợ theo miền site cũ ghi (/system-map, K1.legacyByRegion) cho thẻ vùng ở /mang-luoi — CHỈ bản xem trước và chỉ
 * khi K1 chưa có số đo thật. Production: [].
 */
export function legacyRegionCounts(region: RegionId, options?: GateOptions): LegacyRegionCount[] {
  const preview = options?.draftPreview ?? isDraftPreview();
  const k1 = getStat('K1');
  if (!preview || k1.value !== null) return [];
  return (k1.legacyByRegion ?? [])
    .filter((r) => r.region === region)
    .map((r) => ({ label: r.label, value: r.value, plus: r.plus }));
}
