import { AirVent, Bot, CalendarCheck2, WashingMachine, type LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Section, type SectionTone } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { services, type ServiceKey } from '@/content/services';
import type { Locale } from '@/i18n/routing';
import { SectionHeader } from './SectionHeader';

const ICONS: Record<ServiceKey, LucideIcon> = {
  'lap-dat-dieu-hoa': AirVent,
  'lap-dat-dien-may': WashingMachine,
  'bao-tri-dinh-ky': CalendarCheck2,
  'lap-dat-robot-hut-bui': Bot,
};

/**
 * P4 DỊCH VỤ: 4 card từ content/services.ts (nguồn slug VI/EN, chỉ đọc) → /dich-vu/<slug>, icon Lucide, stagger-grid.
 * Cả thẻ bấm được (link chính phủ thẻ bằng ::after).
 */
export async function ServicesSection({ locale, tone }: { locale: Locale; tone: SectionTone }) {
  const t = await getTranslations('home');

  return (
    <Section id="dich-vu" tone={tone} aria-labelledby="dich-vu-title">
      <SectionHeader
        id="dich-vu-title"
        eyebrow={t('services.eyebrow')}
        title={t('services.title')}
        lead={t('services.lead')}
        action={
          <>
            <TextLink href="/dich-vu" variant="arrow">
              {t('services.all')}
            </TextLink>
            <TextLink href="/bang-gia" variant="arrow">
              {t('services.pricing')}
            </TextLink>
          </>
        }
      />

      <StaggerGrid as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4" itemClassName="flex">
        {services.map((s) => {
          const Icon = ICONS[s.key];
          return (
            <Card key={s.key} interactive padding="lg" className="flex w-full items-start gap-5 sm:flex-col sm:items-stretch sm:gap-6">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600 sm:size-14">
                <Icon aria-hidden="true" size={28} strokeWidth={1.5} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <Heading level={3}>{s.title[locale]}</Heading>
                <p className="mt-3 flex-1 text-body text-(--surface-muted)">{t(`services.items.${s.key}.body`)}</p>
                <TextLink
                  href={{ pathname: '/dich-vu/[slug]', params: { slug: s.slug[locale] } }}
                  variant="arrow"
                  className="mt-5 after:absolute after:inset-0 after:rounded-lg sm:mt-6"
                >
                  {t('services.cta')}
                  <span className="sr-only">: {s.title[locale]}</span>
                </TextLink>
              </div>
            </Card>
          );
        })}
      </StaggerGrid>
    </Section>
  );
}
