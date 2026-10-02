import { getTranslations } from 'next-intl/server';
import { DraftNote } from '@/components/partners/DraftNote';
import { SectionHeader } from '@/components/partners/SectionHeader';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Section } from '@/components/ui/Section';
import { TableScroll } from '@/components/ui/TableScroll';
import { TextLink } from '@/components/ui/TextLink';
import { slaItems } from '@/content/sla';
import type { Locale } from '@/i18n/routing';
import { claim } from '@/lib/claims';
import { isDraftPreview } from '@/lib/env';

const TERM_IDS = ['warranty-new-installation', 'warranty-repair', 'warranty-cleaning'] as const;

/**
 * /ho-tro-khach-hang#thoi-han-bao-hanh — thời hạn bảo hành theo loại dịch vụ, đọc content/sla.ts (một nguồn).
 * Đang mâu thuẫn (lắp đặt mới 02 tháng ở chính sách vs 12 tháng ở bài viết) → mọi dòng là nháp:
 *   - production: không có dòng nào đã duyệt → đoạn trung tính + link chính sách bảo hành;
 *   - bản xem trước: bảng "chính sách cũ ghi …" kèm nhãn Nháp + ghi chú mâu thuẫn để anh Duy chốt.
 */
export async function WarrantyTerms({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'support' });
  const preview = isDraftPreview();
  const rows = TERM_IDS.map((id) => slaItems.find((s) => s.id === id)).filter(
    (row): row is NonNullable<typeof row> => row !== undefined,
  );
  const visible = rows.filter((row) => (row.status === 'approved' && row.value !== null) || preview);
  const exclusions = claim('support.warranty-exclusions', locale);
  const split = claim('support.responsibility-split', locale);

  return (
    <Section id="thoi-han-bao-hanh" aria-labelledby="thoi-han-bao-hanh-title">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <SectionHeader id="thoi-han-bao-hanh-title" eyebrow={t('terms.eyebrow')} title={t('terms.title')} />
        <div className="min-w-0">
          {visible.length > 0 ? (
            <TableScroll label={t('terms.tableLabel')}>
              <table className="w-full min-w-[20rem] border-collapse text-left text-body">
                <caption className="sr-only">{t('terms.tableLabel')}</caption>
                <thead className="bg-blue-50 text-small text-navy-900">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      {t('terms.colItem')}
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      {t('terms.colTerm')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => {
                    const approved = row.status === 'approved' && row.value !== null;
                    return (
                      <tr key={row.id} className="border-t border-slate-300">
                        <th scope="row" className="px-4 py-4 align-top font-medium text-ink-900">
                          {row.label[locale]}
                        </th>
                        <td className="px-4 py-4 align-top text-ink-900">
                          {approved && row.value ? (
                            <span className="font-semibold tabular">{row.value[locale]}</span>
                          ) : (
                            <span className="text-small text-slate-600">
                              {t('terms.currentValue', { value: row.current[locale] })} <DraftBadge />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableScroll>
          ) : (
            <p className="text-lead text-(--surface-fg)">{t('terms.fallback')}</p>
          )}

          {split || exclusions ? (
            <ul className="mt-6 flex flex-col gap-3 text-body text-(--surface-fg)">
              {[split, exclusions].map((c) =>
                c ? (
                  <li key={c.text} className="border-l-2 border-blue-600 pl-4">
                    {c.text}
                    {c.draft ? (
                      <>
                        {' '}
                        <DraftBadge />
                      </>
                    ) : null}
                  </li>
                ) : null,
              )}
            </ul>
          ) : null}

          <TextLink href="/chinh-sach-bao-hanh" variant="arrow" className="mt-6 py-1">
            {t('terms.policyLink')}
          </TextLink>
          <DraftNote className="mt-6">{t('terms.conflictNote')}</DraftNote>
        </div>
      </div>
    </Section>
  );
}
