import type { ReactNode } from 'react';
import { CountUp } from '@/components/motion/CountUp';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { formatStatValue, type StatFormat } from '@/lib/format';

type KpiTileProps = {
  /** null → KHÔNG render gì (docs/03 mục 14.2: thiếu số thì ẩn ô, không dùng số ước). */
  value: number | null;
  format?: StatFormat;
  locale: Locale;
  /** Đơn vị cho format "hours" (từ messages, vd "giờ" / "h"). */
  unit?: string;
  label: string;
  /** Định nghĩa + ngày cập nhật, vd "Thợ có ≥ 1 đơn trong 90 ngày · cập nhật 02/10/2026". */
  note?: string;
  /** Chạy count-up khi vào khung nhìn (giá trị cuối vẫn có sẵn trong HTML). */
  animate?: boolean;
  /** Nhãn cạnh số, vd <DraftBadge/> hoặc <Badge variant="illustration">Minh họa</Badge>. */
  badge?: ReactNode;
  className?: string;
};

/**
 * Ô số liệu: số lớn tabular-nums (token `kpi`), nhãn, ghi chú. Đọc số từ content/stats.ts:
 *   const k1 = getStat('K1');
 *   <KpiTile value={k1.value} format={k1.format} locale={locale} label={k1.label[locale]} note={...} animate />
 */
export function KpiTile({ value, format = 'integer', locale, unit, label, note, animate, badge, className }: KpiTileProps) {
  if (value === null) return null;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="font-display text-kpi tabular text-(--surface-heading)">
        {animate ? (
          <CountUp value={value} format={format} locale={locale} unit={unit} />
        ) : (
          formatStatValue(value, format, locale, unit)
        )}
      </p>
      <p className="flex flex-wrap items-center gap-2 text-small font-semibold text-(--surface-fg)">
        <span>{label}</span>
        {badge}
      </p>
      {note ? <p className="text-small text-(--surface-muted)">{note}</p> : null}
    </div>
  );
}
