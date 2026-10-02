import { getTranslations } from 'next-intl/server';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { KpiTile } from '@/components/ui/KpiTile';
import type { StatId } from '@/content/schemas';
import { getStat } from '@/content/stats';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { isDraftPreview } from '@/lib/env';
import { formatDate } from '@/lib/format';

/**
 * Có ô KPI nào hiển thị được không: số thật (content/stats.ts) hoặc ô nháp ở bản xem trước.
 * Production + mọi số null → false → section/dải chứa KPI tự ẩn (AC-DATA-1: "cả dải trống thì ẩn dải").
 */
export function hasVisibleKpis(ids: readonly StatId[]): boolean {
  return isDraftPreview() || ids.some((id) => getStat(id).value !== null);
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
 * Nhóm ô KPI đọc từ content/stats.ts (KHÔNG bịa số):
 *   - value có số → KpiTile (count-up, số cuối có sẵn trong HTML) + định nghĩa + ngày cập nhật;
 *   - value null  → production: ẩn ô; bản xem trước: ô nháp "—" kèm nhãn Nháp, định nghĩa, "chờ số liệu".
 */
export async function KpiGroup({ locale, ids, className, tileClassName }: KpiGroupProps) {
  const t = await getTranslations('home');
  const tc = await getTranslations('common');
  const preview = isDraftPreview();
  const items = ids.map(getStat).filter((s) => s.value !== null || preview);
  if (items.length === 0) return null;

  return (
    <div className={className}>
      {items.map((s) =>
        s.value !== null ? (
          <KpiTile
            key={s.id}
            value={s.value}
            format={s.format}
            locale={locale}
            unit={tc('units.hours')}
            label={s.label[locale]}
            note={
              s.updatedAt
                ? `${s.definition[locale]} · ${t('kpi.updated', { date: formatDate(s.updatedAt, locale) })}`
                : s.definition[locale]
            }
            animate
            className={tileClassName}
          />
        ) : (
          <div key={s.id} className={cn('flex flex-col gap-2', tileClassName)}>
            <p className="font-display text-kpi text-(--surface-muted)">
              <span aria-hidden="true">—</span>
              <span className="sr-only">{t('kpi.pendingValue')}</span>
            </p>
            <p className="flex flex-wrap items-center gap-2 text-small font-semibold text-(--surface-fg)">
              <span>{s.label[locale]}</span>
              <DraftBadge />
            </p>
            <p className="text-small text-(--surface-muted)">{s.definition[locale]}</p>
            <p className="text-small text-(--surface-muted)">{t('kpi.pendingNote')}</p>
          </div>
        ),
      )}
    </div>
  );
}
