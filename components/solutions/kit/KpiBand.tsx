import { getTranslations } from 'next-intl/server';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { KpiTile } from '@/components/ui/KpiTile';
import { Section } from '@/components/ui/Section';
import type { StatId } from '@/content/schemas';
import { statsWithValue } from '@/content/stats';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { formatDate } from '@/lib/format';

type KpiBandProps = {
  locale: Locale;
  ids: readonly StatId[];
  /** Tiêu đề (sr-only khi có số) — H2 của dải. */
  title: string;
  /** Câu báo ô đang ẩn, đã điền {ids} (chỉ bản xem trước). */
  hiddenNote: string;
};

/**
 * Dải KPI cho landing giải pháp (K3, K5, K6 — docs/03 mục 14.2, R-KPI). Số đọc từ content/stats.ts:
 * ô null bị ẩn, cả dải trống thì không render (production) hoặc chỉ hiện ghi chú Nháp (bản xem trước).
 * Không có số → KHÔNG bịa, không placeholder số.
 */
export async function KpiBand({ locale, ids, title, hiddenNote }: KpiBandProps) {
  const tc = await getTranslations({ locale, namespace: 'common' });
  const kpis = statsWithValue(ids);
  if (kpis.length > 0) {
    return (
      <Section tone="navy" spacing="compact" aria-labelledby="kpi-title">
        <h2 id="kpi-title" className="sr-only">
          {title}
        </h2>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-3">
          {kpis.map((k) => (
            <KpiTile
              key={k.id}
              value={k.value}
              format={k.format}
              locale={locale}
              unit={tc('units.hours')}
              label={k.label[locale]}
              note={k.updatedAt ? `${k.definition[locale]} · ${formatDate(k.updatedAt, locale)}` : k.definition[locale]}
              animate
            />
          ))}
        </div>
      </Section>
    );
  }
  if (!isDraftPreview()) return null;
  return (
    <Section tone="light" spacing="none" aria-labelledby="kpi-title" className="pt-10">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 px-5 py-4">
        <h2 id="kpi-title" className="text-small font-semibold text-navy-900">
          {title}
        </h2>
        <DraftBadge />
        <p className="text-small text-slate-600">{hiddenNote}</p>
      </div>
    </Section>
  );
}
