import { Check, GraduationCap, Handshake, ShieldCheck, Wrench, type LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Card } from '@/components/ui/Card';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Section } from '@/components/ui/Section';
import type { Locale } from '@/i18n/routing';
import { claim, type ClaimText } from '@/lib/claims';
import { DraftNote } from './DraftNote';
import { SectionHeader } from './SectionHeader';

const ITEM_KEYS = ['i1', 'i2', 'i3', 'i4'] as const;
const TOOL_KEYS = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'] as const;
type GroupKey = 'qualification' | 'skills' | 'conduct' | 'safety';

/**
 * /doi-tac-tho#tieu-chuan — tiêu chuẩn thợ 4 nhóm (bằng cấp · kỹ năng · tác phong · an toàn), docs/03 mục 13.4 P6.
 * Nội dung lấy từ /worker-map và /system-map cũ, viết lại theo giọng văn 11.5. Các chi tiết chưa kiểm chứng
 * (số năm kinh nghiệm đang mâu thuẫn, số hiệu TCVN/QCVN) đi qua claim → chỉ hiện ở bản xem trước, kèm nhãn Nháp.
 */
export async function StandardsSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'partners' });

  const groups: { key: GroupKey; icon: LucideIcon; extra: (ClaimText | null)[] }[] = [
    { key: 'qualification', icon: GraduationCap, extra: [claim('partner.experience-requirement', locale)] },
    { key: 'skills', icon: Wrench, extra: [claim('partner.standard-tcvn-5687', locale)] },
    { key: 'conduct', icon: Handshake, extra: [] },
    { key: 'safety', icon: ShieldCheck, extra: [claim('partner.standard-qcvn-25', locale)] },
  ];
  const anyStandardClaim = groups.some((g) => g.extra.some((c) => c !== null && c.draft));

  return (
    <Section id="tieu-chuan" aria-labelledby="tieu-chuan-title">
      <SectionHeader
        id="tieu-chuan-title"
        eyebrow={t('standards.eyebrow')}
        title={t('standards.title')}
        lead={t('standards.lead')}
      />

      <StaggerGrid as="ul" className="mt-10 grid gap-6 md:grid-cols-2">
        {groups.map(({ key, icon: Icon, extra }) => (
          <Card key={key} padding="lg" className="h-full">
            <div className="flex items-center gap-4">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
              </span>
              <h3 className="text-h3 text-(--surface-heading)">{t(`standards.groups.${key}.title`)}</h3>
            </div>
            <ul className="mt-5 flex flex-col gap-3">
              {ITEM_KEYS.map((item) => (
                <li key={item} className="flex gap-3 text-body text-(--surface-fg)">
                  <Check aria-hidden="true" size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-success-700" />
                  <span>{t(`standards.groups.${key}.${item}`)}</span>
                </li>
              ))}
              {extra.map((c) =>
                c ? (
                  <li key={c.text} className="flex gap-3 text-body text-(--surface-fg)">
                    <Check aria-hidden="true" size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-success-700" />
                    <span>
                      {c.text}
                      {c.draft ? (
                        <>
                          {' '}
                          <DraftBadge />
                        </>
                      ) : null}
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
          </Card>
        ))}
      </StaggerGrid>

      <div className="mt-10 rounded-lg border border-slate-300 bg-blue-50 p-6 md:p-8" data-tone="blue-50">
        <h3 className="text-h3 text-(--surface-heading)">{t('standards.tools.title')}</h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {TOOL_KEYS.map((tool) => (
            <li key={tool} className="rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-small font-medium text-ink-900">
              {t(`standards.tools.${tool}`)}
            </li>
          ))}
        </ul>
      </div>

      {anyStandardClaim ? <DraftNote className="mt-8">{t('standards.standardsNote')}</DraftNote> : null}
    </Section>
  );
}
