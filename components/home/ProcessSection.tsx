import { getTranslations } from 'next-intl/server';
import { Fragment } from 'react';
import { Rise } from '@/components/motion/Rise';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Chip } from '@/components/ui/Chip';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Section, type SectionTone } from '@/components/ui/Section';
import { processSteps } from '@/content/process';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { isDraftPreview } from '@/lib/env';
import { SectionHeader } from './SectionHeader';

/**
 * QUY TRÌNH 5 BƯỚC (docs/03 mục 14.1, content/process.ts — nguồn duy nhất, chỉ đọc).
 * BẮT BUỘC có trên trang chủ: phim A+ không có chữ từng bước (NFR-A11Y-04: tắt JS / Googlebot không cuộn vẫn đọc đủ
 * 5 bước) → <ol> server render. Bước 00 "Khách mua hàng" là sự kiện kích hoạt: hiển thị nhạt, nằm NGOÀI <ol>.
 * ≥1024: dòng thời gian ngang 5 cột; nhỏ hơn: dọc, vạch nối bên trái.
 */
export async function ProcessSection({ locale, tone }: { locale: Locale; tone: SectionTone }) {
  const t = await getTranslations('home');
  const trigger = processSteps.find((s) => s.isTrigger);
  const steps = processSteps.filter((s) => !s.isTrigger);

  return (
    <Section id="quy-trinh" tone={tone} aria-labelledby="quy-trinh-title">
      <SectionHeader id="quy-trinh-title" eyebrow={t('process.eyebrow')} title={t('process.title')} lead={t('process.lead')} />

      {trigger ? (
        <Rise className="mt-12 flex max-w-[46rem] items-start gap-5 rounded-lg border border-dashed border-slate-500 p-5">
          <span
            aria-hidden="true"
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-pill border-2 border-dashed border-slate-500 font-display text-body tabular text-slate-600"
          >
            {trigger.id}
          </span>
          <div>
            <p className="text-body font-semibold text-(--surface-heading)">
              <span className="sr-only">{t('process.stepLabel', { n: trigger.id })}: </span>
              {trigger.title[locale]}
              <span className="font-normal text-(--surface-muted)"> · {t('process.triggerLabel')}</span>
            </p>
            <p className="mt-1 text-small text-(--surface-muted)">{trigger.description[locale]}</p>
          </div>
        </Rise>
      ) : null}

      <StaggerGrid
        as="ol"
        className="mt-10 grid lg:mt-14 lg:grid-cols-5 lg:gap-6"
        itemClassName="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-5 lg:block"
      >
        {steps.map((step, i) => {
          const last = i === steps.length - 1;
          return (
            <Fragment key={step.id}>
              <div className="flex flex-col items-center lg:flex-row">
                <span
                  aria-hidden="true"
                  className="relative z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-pill border-2 border-blue-600 bg-white font-display text-body tabular text-blue-600"
                >
                  {step.id}
                </span>
                {last ? null : (
                  <span aria-hidden="true" className="w-0.5 flex-1 bg-blue-300 lg:-mr-6 lg:ml-3 lg:h-0.5 lg:w-auto" />
                )}
              </div>
              <div className={cn('pb-10 lg:pb-0 lg:pt-6', last && 'pb-0')}>
                <h3 className="text-h3 text-(--surface-heading)">
                  <span className="sr-only">{t('process.stepLabel', { n: step.id })}: </span>
                  {step.title[locale]}
                </h3>
                <p className="mt-3">
                  <Chip variant="neutral">{step.actor[locale]}</Chip>
                </p>
                <p className="mt-3 text-small text-(--surface-muted)">{step.description[locale]}</p>
              </div>
            </Fragment>
          );
        })}
      </StaggerGrid>

      {isDraftPreview() ? (
        <p className="mt-10 flex flex-wrap items-center gap-2 text-small text-(--surface-muted)">
          <DraftBadge />
          <span>{t('process.pendingNote')}</span>
        </p>
      ) : null}
    </Section>
  );
}
