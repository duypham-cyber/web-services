import { Check, LayoutDashboard, Smartphone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Rise } from '@/components/motion/Rise';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Badge } from '@/components/ui/Badge';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import type { Locale } from '@/i18n/routing';
import { claim } from '@/lib/claims';
import { DashboardMockup, PhoneMockup } from './Mockups';
import { SectionHeader } from './SectionHeader';

type Feature = { text: string; draft?: boolean };

/**
 * CÔNG NGHỆ: dashboard cho Hãng/Sàn + app cho thợ (NOI-DUNG.md mục 9, docs/03 mục 5 "nền tảng được trình diễn").
 * Hình là GIAO DIỆN MINH HỌA dựng bằng HTML/CSS (không phải ảnh chụp app thật), luôn kèm nhãn "Giao diện minh họa".
 * Nội dung thật (cho trình đọc màn hình, Googlebot) nằm ở hai danh sách tính năng bên dưới.
 * Nền navy cố định; motion: một hiệu ứng lớn (rise cả khối hình), danh sách stagger.
 */
export async function TechnologySection({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');
  const ekyc = claim('technician.ekyc', locale);

  const groups: { key: 'dashboard' | 'app'; icon: typeof LayoutDashboard; features: Feature[] }[] = [
    {
      key: 'dashboard',
      icon: LayoutDashboard,
      features: [
        { text: t('technology.dashboard.features.status') },
        { text: t('technology.dashboard.features.photos') },
        { text: t('technology.dashboard.features.payments') },
      ],
    },
    {
      key: 'app',
      icon: Smartphone,
      features: [
        { text: t('technology.app.features.jobs') },
        { text: t('technology.app.features.signoff') },
        { text: t('technology.app.features.earnings') },
        ...(ekyc ? [{ text: ekyc.text, draft: ekyc.draft }] : []),
      ],
    },
  ];

  return (
    <Section id="cong-nghe" tone="navy" aria-labelledby="cong-nghe-title" className="overflow-clip">
      <SectionHeader id="cong-nghe-title" eyebrow={t('technology.eyebrow')} title={t('technology.title')} lead={t('technology.lead')} />

      <Rise as="figure" className="mt-12 lg:mt-16">
        <div className="flex flex-col items-center sm:flex-row sm:items-end">
          <DashboardMockup className="w-full max-sm:pb-10 sm:min-w-0 sm:flex-1" reserveEnd="max-sm:hidden sm:w-14 lg:w-16" />
          <PhoneMockup className="relative z-10 -mt-14 w-60 shrink-0 sm:-mb-12 sm:-ml-10 sm:mt-0 sm:w-56 lg:-ml-12 lg:w-64" />
        </div>
        <figcaption className="mt-8 flex flex-wrap items-center gap-3 sm:mt-20">
          <Badge variant="illustration">{t('technology.caption')}</Badge>
          <span className="text-small text-(--surface-muted)">{t('technology.captionNote')}</span>
        </figcaption>
      </Rise>

      <StaggerGrid as="ul" className="mt-12 grid gap-6 md:grid-cols-2" itemClassName="flex">
        {groups.map(({ key, icon: Icon, features }) => (
          <div key={key} className="w-full rounded-lg border border-(--surface-border) p-6 md:p-8">
            <span className="inline-flex size-12 items-center justify-center rounded-md bg-blue-600 text-white">
              <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
            </span>
            <Heading level={3} className="mt-5">
              {t(`technology.${key}.title`)}
            </Heading>
            <ul className="mt-4 space-y-3">
              {features.map((f) => (
                <li key={f.text} className="flex gap-3 text-body text-(--surface-fg)">
                  <Check aria-hidden="true" size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-blue-300" />
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{f.text}</span>
                    {f.draft ? <DraftBadge /> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </StaggerGrid>
    </Section>
  );
}
