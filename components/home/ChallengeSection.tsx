import { CircleAlert } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Rise } from '@/components/motion/Rise';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Section, type SectionTone } from '@/components/ui/Section';
import type { ClaimId } from '@/content/claims';
import type { Locale } from '@/i18n/routing';
import { ClaimLines } from './ClaimLines';
import { SectionHeader } from './SectionHeader';

type PainKey = 'quality' | 'visibility' | 'cost';
type BenefitKey = 'onePartner' | 'matching' | 'photoProof' | 'reconcile';

const PAINS: readonly PainKey[] = ['quality', 'visibility', 'cost'];

/** Mỗi lợi ích gắn câu khẳng định làm bằng chứng — chỉ hiện khi claim() cho phép (production: đã duyệt). */
const BENEFITS: readonly { key: BenefitKey; evidence: readonly ClaimId[] }[] = [
  { key: 'onePartner', evidence: ['coverage.provinces-34'] },
  { key: 'matching', evidence: ['technician.ekyc', 'quality.brand-standard'] },
  { key: 'photoProof', evidence: ['home.photo-sign-off'] },
  { key: 'reconcile', evidence: ['home.compliant-costs'] },
];

/**
 * P3 VẤN ĐỀ → GIẢI PHÁP (docs/03 mục 13.4; thay "6 ô xanh rỗng" của site cũ, UX-17).
 * Trái: H2 dạng câu hỏi + 3 nỗi đau (dính khi cuộn ở ≥1024). Phải: 4 lợi ích đánh số, mỗi lợi ích có dòng bằng chứng.
 */
export async function ChallengeSection({ locale, tone }: { locale: Locale; tone: SectionTone }) {
  const t = await getTranslations('home');

  return (
    <Section id="van-de-giai-phap" tone={tone} aria-labelledby="van-de-title">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+2.5rem)] lg:col-span-5 lg:self-start">
          <SectionHeader id="van-de-title" eyebrow={t('challenge.eyebrow')} title={t('challenge.title')} lead={t('challenge.lead')} />
          <Rise className="mt-10">
            <p className="text-small font-semibold text-(--surface-heading)">{t('challenge.painsLabel')}</p>
            <ul className="mt-4 divide-y divide-(--surface-border) border-y border-(--surface-border)">
              {PAINS.map((key) => (
                <li key={key} className="flex gap-3 py-4 text-body text-(--surface-fg)">
                  <CircleAlert aria-hidden="true" size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-orange-700" />
                  <span>{t(`challenge.pains.${key}`)}</span>
                </li>
              ))}
            </ul>
          </Rise>
        </div>

        <div className="lg:col-span-7">
          <Rise as="p" className="eyebrow text-(--surface-accent)">
            {t('challenge.solutionLabel')}
          </Rise>
          <StaggerGrid as="ol" className="mt-5 grid gap-5 sm:grid-cols-2" itemClassName="flex">
            {BENEFITS.map((b, i) => (
              <Card key={b.key} padding="lg" className="flex w-full flex-col">
                <p className="font-display text-h3 tabular text-blue-600" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <Heading level={3} className="mt-3">
                  {t(`challenge.benefits.${b.key}.title`)}
                </Heading>
                <p className="mt-3 flex-1 text-body text-(--surface-muted)">{t(`challenge.benefits.${b.key}.body`)}</p>
                <ClaimLines
                  ids={b.evidence}
                  locale={locale}
                  label={t('challenge.evidenceLabel')}
                  className="mt-6 border-t border-(--surface-border) pt-4"
                />
              </Card>
            ))}
          </StaggerGrid>
        </div>
      </div>
    </Section>
  );
}
