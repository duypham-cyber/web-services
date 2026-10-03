import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { formatDate } from '@/lib/format';
import type { StatView } from '@/lib/stats';
import { Badge } from './Badge';
import { KpiTile } from './KpiTile';

type StatTileProps = {
  /** Kết quả của statView()/statViews() (lib/stats.ts) — KHÔNG tự dựng từ content/stats.ts. */
  view: StatView;
  locale: Locale;
  /** Count-up khi vào khung nhìn. Áp dụng cho số được duyệt (đo thật hoặc công bố); số site cũ (bản xem trước) đứng yên. */
  animate?: boolean;
  className?: string;
};

/**
 * Ô KPI đọc từ content/stats.ts (Server Component):
 *   - số đo thật → KpiTile + định nghĩa + "cập nhật dd/mm/yyyy" (ngày đo) (+ count-up nếu animate);
 *   - số công bố / mốc cam kết đã duyệt ("500+", "60 phút") → KpiTile + "+" nếu số duyệt có "+" + CHỈ định nghĩa. Không ghi
 *     "cập nhật …": updatedAt của số công bố là ngày duyệt, ghi ra sẽ đọc như số vừa đo lại (kiểm định 03/10/2026, D-27).
 *   Cả hai hiện ở mọi môi trường, không nhãn nháp;
 *   - số site cũ → KpiTile + hậu tố "+" như site cũ ghi + nhãn "Nháp · số site cũ" (chỉ có khi DRAFT_PREVIEW=1 — lib/stats.ts).
 */
export async function StatTile({ view, locale, animate, className }: StatTileProps) {
  const tc = await getTranslations({ locale, namespace: 'common' });
  const { stat } = view;
  const unit = view.format === 'minutes' ? tc('units.minutes') : tc('units.hours');
  const suffix = view.plus ? '+' : undefined;

  if (view.kind !== 'legacy') {
    const note =
      view.kind === 'measured' && stat.updatedAt
        ? `${stat.definition[locale]} · ${tc('kpi.updated', { date: formatDate(stat.updatedAt, locale) })}`
        : stat.definition[locale];
    return (
      <KpiTile
        value={view.value}
        format={view.format}
        suffix={suffix}
        locale={locale}
        unit={unit}
        label={stat.label[locale]}
        note={note}
        animate={animate}
        className={className}
      />
    );
  }

  return (
    <KpiTile
      value={view.value}
      format={view.format}
      suffix={suffix}
      locale={locale}
      unit={unit}
      label={stat.label[locale]}
      note={stat.definition[locale]}
      badge={<Badge variant="draft">{tc('status.draftLegacy')}</Badge>}
      className={className}
    />
  );
}
