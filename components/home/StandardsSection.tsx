import { GraduationCap, ShieldCheck, UserRoundCheck, Wrench, type LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Card } from '@/components/ui/Card';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Heading } from '@/components/ui/Heading';
import { Section, type SectionTone } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import type { Locale } from '@/i18n/routing';
import { claim } from '@/lib/claims';
import { SectionHeader } from './SectionHeader';

type GroupKey = 'qualification' | 'skills' | 'conduct' | 'safety';

const GROUPS: readonly { key: GroupKey; icon: LucideIcon }[] = [
  { key: 'qualification', icon: GraduationCap },
  { key: 'skills', icon: Wrench },
  { key: 'conduct', icon: UserRoundCheck },
  { key: 'safety', icon: ShieldCheck },
];

const POINTS = ['a', 'b', 'c'] as const;

/**
 * P6 TIÊU CHUẨN THỢ (P1, docs/03 mục 13.4): 4 nhóm dạng badge — chữ viết lại từ trang /worker-map của site cũ.
 * Số hiệu TCVN 5687:2024 / QCVN 25:2025/BKHCN CHƯA kiểm chứng → chỉ hiện qua claim('home.standards-citation')
 * (production ẩn; bản xem trước hiện kèm nhãn Nháp và ghi chú "chưa kiểm chứng").
 */
export async function StandardsSection({ locale, tone }: { locale: Locale; tone: SectionTone }) {
  const t = await getTranslations('home');
  const citation = claim('home.standards-citation', locale);

  return (
    <Section id="tieu-chuan-tho" tone={tone} aria-labelledby="tieu-chuan-tho-title">
      <SectionHeader
        id="tieu-chuan-tho-title"
        eyebrow={t('standards.eyebrow')}
        title={t('standards.title')}
        lead={t('standards.lead')}
        action={
          <TextLink href="/doi-tac-tho" variant="arrow">
            {t('standards.cta')}
          </TextLink>
        }
      />

      <StaggerGrid as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4" itemClassName="flex">
        {GROUPS.map(({ key, icon: Icon }) => (
          <Card key={key} padding="md" className="flex w-full flex-col">
            <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-5">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-pill bg-blue-100 text-blue-600">
                <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
              </span>
              <Heading level={3}>{t(`standards.groups.${key}.title`)}</Heading>
            </div>
            <ul className="mt-4 space-y-2.5 text-small text-slate-600">
              {POINTS.map((p) => (
                <li key={p} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-pill bg-orange-500" />
                  <span>{t(`standards.groups.${key}.${p}`)}</span>
                </li>
              ))}
            </ul>
            {key === 'safety' && citation ? (
              <p className="mt-5 border-t border-slate-300 pt-4 text-small text-ink-900">
                <span className="flex flex-wrap items-center gap-2">
                  <span>{citation.text}</span>
                  {citation.draft ? <DraftBadge /> : null}
                </span>
                {citation.draft ? <span className="mt-1 block text-slate-600">{t('standards.citationNote')}</span> : null}
              </p>
            ) : null}
          </Card>
        ))}
      </StaggerGrid>
    </Section>
  );
}
