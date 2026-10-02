import { getTranslations } from 'next-intl/server';
import { DraftNote } from '@/components/partners/DraftNote';
import { SectionHeader } from '@/components/partners/SectionHeader';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Section } from '@/components/ui/Section';
import { TableScroll } from '@/components/ui/TableScroll';
import { legacyServiceHours } from '@/content/legal';
import { slaItems } from '@/content/sla';
import type { LocalizedText } from '@/content/schemas';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';

const SLA_IDS = ['hotline-hours', 'order-intake-hours'] as const;

type Row = { id: string; label: LocalizedText; value: LocalizedText | null; current: LocalizedText };

/**
 * /lien-he#gio-lam-viec — bảng giờ hoạt động. Giờ trên site cũ tự mâu thuẫn (24/7 vs 9–18h) → mọi dòng là nháp:
 *   - production: chỉ dòng đã duyệt (content/sla.ts approved); chưa có dòng nào → đoạn trung tính.
 *   - bản xem trước: liệt kê mọi mốc giờ đang ghi (sla.ts + chính sách cũ) kèm nhãn Nháp để anh Duy chốt.
 */
export async function HoursTable({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'contact' });
  const preview = isDraftPreview();

  const slaRows: Row[] = SLA_IDS.flatMap((id) => {
    const item = slaItems.find((s) => s.id === id);
    if (!item) return [];
    const approved = item.status === 'approved' && item.value !== null;
    return [{ id: item.id, label: item.label, value: approved ? item.value : null, current: item.current }];
  });
  const legacyRows: Row[] = legacyServiceHours.map((h) => ({ id: h.id, label: h.label, value: null, current: h.current }));
  const rows = [...slaRows, ...legacyRows].filter((row) => row.value !== null || preview);
  const tableLabel = preview ? t('hours.tableLabel') : t('hours.title');

  return (
    <Section id="gio-lam-viec" aria-labelledby="gio-lam-viec-title">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <SectionHeader id="gio-lam-viec-title" eyebrow={t('hours.eyebrow')} title={t('hours.title')} />
        <div className="min-w-0">
          {rows.length > 0 ? (
            <TableScroll label={tableLabel}>
              <table className={`w-full border-collapse text-left ${preview ? 'min-w-[30rem]' : 'min-w-[20rem]'}`}>
                <caption className="sr-only">{tableLabel}</caption>
                <thead className="bg-blue-50 text-small text-navy-900">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      {t('hours.colItem')}
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      {preview ? t('hours.colCurrent') : t('hours.colHours')}
                    </th>
                    {preview ? (
                      <th scope="col" className="px-4 py-3 font-semibold">
                        {t('hours.colStatus')}
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-300 align-top">
                      <th scope="row" className="px-4 py-4 text-body font-medium text-ink-900">
                        {row.label[locale]}
                      </th>
                      <td className="px-4 py-4 text-small text-ink-900 tabular">{(row.value ?? row.current)[locale]}</td>
                      {preview ? (
                        <td className="px-4 py-4">
                          {row.value ? null : (
                            <span className="inline-flex flex-wrap items-center gap-2 text-small text-slate-600">
                              {t('hours.pendingValue')} <DraftBadge />
                            </span>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          ) : (
            <p className="text-lead text-(--surface-fg)">{t('hours.fallback')}</p>
          )}
          <DraftNote className="mt-6">{t('hours.pendingNote')}</DraftNote>
        </div>
      </div>
    </Section>
  );
}
