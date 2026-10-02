import { getTranslations } from 'next-intl/server';
import { DraftLine } from '@/components/ui/DraftLine';
import { StatTile } from '@/components/ui/StatTile';
import type { StatId } from '@/content/schemas';
import type { Locale } from '@/i18n/routing';
import { pendingStats, statViews } from '@/lib/stats';

/**
 * Có ô KPI nào hiển thị được không: số đo thật (content/stats.ts) hoặc — CHỈ bản xem trước — số site cũ (lib/stats.ts).
 * Production + mọi số null → false → section/dải chứa KPI tự ẩn (AC-DATA-1: "cả dải trống thì ẩn dải").
 */
export function hasVisibleKpis(ids: readonly StatId[]): boolean {
  return statViews(ids).length > 0;
}

type KpiGroupProps = {
  locale: Locale;
  ids: readonly StatId[];
  /** Lưới chứa các ô (vd "grid grid-cols-2 gap-6"). */
  className?: string;
  /** Class cho từng ô (vạch kẻ trái, padding). */
  tileClassName?: string;
};

/**
 * Nhóm ô KPI đọc từ content/stats.ts qua lib/stats.ts (KHÔNG bịa số):
 *   - số đo thật → StatTile (count-up, số cuối có sẵn trong HTML) + định nghĩa + ngày cập nhật;
 *   - bản xem trước, chưa có số đo → số site cũ kèm nhãn "Nháp · số site cũ"; KPI không có số nào → gom vào MỘT dòng
 *     "Chờ số liệu: …" dưới lưới (không còn ô "—");
 *   - production: chỉ số đo thật; không có → không render gì.
 */
export async function KpiGroup({ locale, ids, className, tileClassName }: KpiGroupProps) {
  const tc = await getTranslations({ locale, namespace: 'common' });
  const views = statViews(ids);
  const pending = pendingStats(ids);
  if (views.length === 0 && pending.length === 0) return null;

  return (
    <>
      {views.length > 0 ? (
        <div className={className}>
          {views.map((view) => (
            <StatTile key={view.stat.id} view={view} locale={locale} animate className={tileClassName} />
          ))}
        </div>
      ) : null}
      {pending.length > 0 ? (
        <DraftLine className={views.length > 0 ? 'mt-6' : undefined}>
          {tc('kpi.pending', { items: pending.map((s) => s.label[locale]).join(' · ') })}
        </DraftLine>
      ) : null}
    </>
  );
}
