import { CalendarClock, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { QUOTE_HREF } from '@/components/layout/Header';
import { Rise } from '@/components/motion/Rise';
import { Button } from '@/components/ui/Button';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section, type SectionTone } from '@/components/ui/Section';
import { site } from '@/content/site';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';

/** Tia chớp + vòng tròn trang trí (thương hiệu Bluebolt), chỉ token màu, aria-hidden, nằm trong khung overflow-clip. */
function BoltArt() {
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute -right-24 top-1/2 size-[26rem] -translate-y-1/2 max-lg:hidden xl:-right-[7.5rem] xl:size-[30rem]"
    >
      <circle cx="200" cy="200" r="194" fill="none" stroke="var(--color-blue-300)" strokeOpacity="0.12" strokeWidth="2" />
      <circle cx="200" cy="200" r="142" fill="none" stroke="var(--color-blue-300)" strokeOpacity="0.12" strokeWidth="2" />
      <circle cx="200" cy="200" r="92" fill="var(--color-blue-600)" fillOpacity="0.22" />
      <path
        d="M224 70 L132 214 H196 L172 330 L270 172 H204 Z"
        fill="var(--color-blue-600)"
        fillOpacity="0.5"
        stroke="var(--color-blue-300)"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * P8 CTA CUỐI — MỘT khối duy nhất của trang (AC-SH-7). Chưa có form: form B2B là phần động, chờ
 * contracts/lead-b2b.md APPROVED (docs/DECISIONS.md D-04, D-19). Hai nút dẫn tới /lien-he#kinh-doanh (QUOTE_HREF,
 * nguồn duy nhất ở Header — đổi đích một chỗ khi form được duyệt), nút Gọi là tel:. Hotline/nút KHÔNG animate.
 */
export async function FinalCta({ locale, tone }: { locale: Locale; tone: SectionTone }) {
  const t = await getTranslations('home');
  const phone = site.hotline.display[locale];

  return (
    <Section id="hop-tac" tone={tone} aria-labelledby="hop-tac-title">
      <div data-tone="navy" className="relative isolate overflow-clip rounded-xl bg-navy-900 px-6 py-12 sm:px-10 md:px-14 md:py-16 lg:py-20 lg:pl-20 lg:pr-56 xl:pr-60">
        <BoltArt />
        <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
          <Rise className="lg:col-span-7">
            <Eyebrow>{t('cta.eyebrow')}</Eyebrow>
            <Heading level={2} id="hop-tac-title" className="mt-3">
              {t('cta.title')}
            </Heading>
            <p className="mt-5 max-w-[38rem] text-lead text-(--surface-muted)">{t('cta.lead')}</p>
          </Rise>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:col-span-5 lg:flex-col lg:flex-nowrap">
            <Button href={QUOTE_HREF} variant="primary" size="lg" className="w-full sm:w-auto lg:w-full">
              {t('cta.quote')}
            </Button>
            <Button
              href={QUOTE_HREF}
              variant="on-dark"
              size="lg"
              className="w-full sm:w-auto lg:w-full"
              iconStart={<CalendarClock aria-hidden="true" size={20} strokeWidth={1.75} />}
            >
              {t('cta.demo')}
            </Button>
            <Button
              externalHref={`tel:${site.hotline.tel}`}
              variant="on-dark"
              size="lg"
              className="w-full sm:w-auto lg:w-full"
              iconStart={<Phone aria-hidden="true" size={20} strokeWidth={1.75} />}
            >
              {t('cta.call', { phone })}
            </Button>
          </div>
        </div>
        {isDraftPreview() ? (
          <p className="relative mt-10 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-blue-300 p-4 text-small text-(--surface-muted)">
            <DraftBadge />
            <span>{t('cta.formPending')}</span>
          </p>
        ) : null}
      </div>
    </Section>
  );
}
