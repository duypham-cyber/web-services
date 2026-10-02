import { getTranslations } from 'next-intl/server';
import { DraftLine } from '@/components/ui/DraftLine';
import { Section } from '@/components/ui/Section';
import { StatTile } from '@/components/ui/StatTile';
import type { StatId } from '@/content/schemas';
import type { Locale } from '@/i18n/routing';
import { pendingStats, statViews } from '@/lib/stats';

type KpiBandProps = {
  locale: Locale;
  ids: readonly StatId[];
  /** Tiêu đề (sr-only khi có số) — H2 của dải. */
  title: string;
  /** Câu báo ô đang ẩn, đã điền {ids} (chỉ bản xem trước, khi không có ô nào để hiện). */
  hiddenNote: string;
};

/**
 * Dải KPI cho landing giải pháp (K3, K5, K6 — docs/03 mục 14.2, R-KPI). Số đọc từ content/stats.ts qua lib/stats.ts:
 *   - production: chỉ số đo thật; không có ô nào → không render;
 *   - bản xem trước: thêm số site cũ (nhãn "Nháp · số site cũ"); KPI không có số nào gom vào MỘT dòng "Chờ số liệu";
 *     không có ô nào → chỉ một dòng ghi chú (không khung nét đứt).
 * Không có số → KHÔNG bịa, không placeholder số.
 */
export async function KpiBand({ locale, ids, title, hiddenNote }: KpiBandProps) {
  const tc = await getTranslations({ locale, namespace: 'common' });
  const views = statViews(ids);
  const pending = pendingStats(ids);

  if (views.length > 0) {
    return (
      <Section tone="navy" spacing="compact" aria-labelledby="kpi-title">
        <h2 id="kpi-title" className="sr-only">
          {title}
        </h2>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-3">
          {views.map((view) => (
            <StatTile key={view.stat.id} view={view} locale={locale} animate />
          ))}
        </div>
        {pending.length > 0 ? (
          <DraftLine className="mt-8">{tc('kpi.pending', { items: pending.map((s) => s.label[locale]).join(' · ') })}</DraftLine>
        ) : null}
      </Section>
    );
  }
  if (pending.length === 0) return null;
  return (
    <Section as="div" tone="light" spacing="none" className="pt-10">
      <DraftLine label={title}>{hiddenNote}</DraftLine>
    </Section>
  );
}
