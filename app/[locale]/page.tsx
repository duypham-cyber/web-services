import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Fragment, type ReactNode } from 'react';
import { FilmHero } from '@/components/film/FilmHero';
import { ChallengeSection } from '@/components/home/ChallengeSection';
import { DoorsSection } from '@/components/home/DoorsSection';
import { FinalCta } from '@/components/home/FinalCta';
import { KnowledgeSection } from '@/components/home/KnowledgeSection';
import { NetworkSection } from '@/components/home/NetworkSection';
import { ProcessSection } from '@/components/home/ProcessSection';
import { ProofSection, proofVisible } from '@/components/home/ProofSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { StandardsSection } from '@/components/home/StandardsSection';
import { TechnologySection } from '@/components/home/TechnologySection';
import { TrustBand, trustBandVisible } from '@/components/home/TrustBand';
import { QUOTE_HREF, TECHNICIAN_SIGNUP_HREF } from '@/components/layout/Header';
import type { SectionTone } from '@/components/ui/Section';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { claim } from '@/lib/claims';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'home' });
  return buildMetadata({
    routeKey: 'home',
    locale,
    title: t('meta.title'),
    description: t('meta.description'),
    absoluteTitle: true,
  });
}

type FlowItem = {
  key: string;
  /** Tông cố định (dải navy). Không đặt → tự xen kẽ trắng / xanh nhạt theo section hiển thị liền trước. */
  tone?: SectionTone;
  render: (tone: SectionTone) => ReactNode;
};

/**
 * Gán tông nền xen kẽ cho các section ĐANG hiển thị (section ẩn — dải tin cậy, bằng chứng — không làm hai section
 * cùng màu đứng cạnh nhau). Phần tử trước section đầu tiên là hero (navy).
 */
function renderFlow(items: readonly FlowItem[]): ReactNode[] {
  let previous: SectionTone = 'navy';
  return items.map((item) => {
    const tone = item.tone ?? (previous === 'light' ? 'blue-50' : 'light');
    previous = tone;
    return <Fragment key={item.key}>{item.render(tone)}</Fragment>;
  });
}

/**
 * TRANG CHỦ. Phần đầu = <FilmHero/> (agent phim thay ruột — phim A+ hoặc hero khác — GIỮ FilmHeroProps, nên trang này
 * không phải sửa khi đổi hero). Sau hero = các section HTML cuộn native theo contracts/site-shell-p0.md (T-HOME) và
 * docs/03 mục 13.4: Ba cửa vào (#ba-cua-vao) → bản đồ 34 tỉnh → dải tin cậy → vấn đề/giải pháp → quy trình 5 bước →
 * công nghệ → dịch vụ → bằng chứng → tiêu chuẩn thợ → kiến thức → CTA cuối (một khối, chưa có form).
 * Số liệu: content/stats.ts; câu khẳng định: claim(); production ẩn mọi thứ chưa duyệt.
 */
export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations('home');
  const tc = await getTranslations('common');

  // Eyebrow hero: câu phạm vi tỉnh CHỈ khi claim được phép; chưa duyệt → câu dự phòng không có số (AC-S0-6)
  const coverage = claim('coverage.provinces-34', locale);
  const eyebrow = coverage
    ? { text: coverage.text, draft: coverage.draft }
    : { text: t('hero.eyebrowFallback'), draft: false };

  const flow: FlowItem[] = [
    { key: 'doors', render: (tone) => <DoorsSection tone={tone} /> },
    { key: 'network', render: (tone) => <NetworkSection locale={locale} tone={tone} /> },
    ...(trustBandVisible(locale) ? [{ key: 'trust', tone: 'navy' as const, render: () => <TrustBand locale={locale} /> }] : []),
    { key: 'challenge', render: (tone) => <ChallengeSection locale={locale} tone={tone} /> },
    { key: 'process', render: (tone) => <ProcessSection locale={locale} tone={tone} /> },
    { key: 'technology', tone: 'navy', render: () => <TechnologySection locale={locale} /> },
    { key: 'services', render: (tone) => <ServicesSection locale={locale} tone={tone} /> },
    ...(proofVisible() ? [{ key: 'proof', render: (tone: SectionTone) => <ProofSection tone={tone} /> }] : []),
    { key: 'standards', render: (tone) => <StandardsSection locale={locale} tone={tone} /> },
    { key: 'knowledge', render: (tone) => <KnowledgeSection locale={locale} tone={tone} /> },
    { key: 'cta', render: (tone) => <FinalCta locale={locale} tone={tone} /> },
  ];

  return (
    <>
      <FilmHero
        locale={locale}
        eyebrow={eyebrow}
        title={t('hero.title')}
        lead={t('hero.lead')}
        primaryCta={{ label: tc('cta.quoteBusiness'), href: QUOTE_HREF }}
        secondaryCta={{ label: tc('cta.registerTechnician'), href: TECHNICIAN_SIGNUP_HREF }}
        skipLabel={t('hero.skipIntro')}
      />
      {renderFlow(flow)}
    </>
  );
}
