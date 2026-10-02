import { BadgeCheck, FileSearch, Zap, type LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CompanyFacts } from '@/components/about/CompanyFacts';
import { QUOTE_HREF, TECHNICIAN_SIGNUP_HREF } from '@/components/layout/Header';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { FinalCta } from '@/components/partners/FinalCta';
import { MediaFrame } from '@/components/partners/MediaFrame';
import { PageHero } from '@/components/partners/PageHero';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { SectionHeader } from '@/components/partners/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { DraftLine } from '@/components/ui/DraftLine';
import { Section } from '@/components/ui/Section';
import { StatTile } from '@/components/ui/StatTile';
import { partnersWithConsent } from '@/content/partners';
import { stats } from '@/content/stats';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { isDraftPreview } from '@/lib/env';
import { buildMetadata } from '@/lib/seo';
import { statViews } from '@/lib/stats';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/ve-chung-toi'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'about' });
  return buildMetadata({
    routeKey: 'about',
    locale,
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

const VALUES: { key: 'fast' | 'standard' | 'transparent'; icon: LucideIcon }[] = [
  { key: 'fast', icon: Zap },
  { key: 'standard', icon: BadgeCheck },
  { key: 'transparent', icon: FileSearch },
];

/**
 * /ve-chung-toi — T-ABOUT (docs/03 mục 13.5; đích 301 của /intro). Nội dung viết lại từ research/raw/intro.txt:
 * sứ mệnh → cách làm việc (Nhanh – Chuẩn – Minh bạch) → KPI (content/stats.ts qua lib/stats.ts, null → ẩn) → mốc phát
 * triển (chỉ mốc có nguồn: hiện chưa có → bản xem trước chỉ còn dòng ghi chú) → pháp nhân, MST, văn phòng → đối tác
 * (ẩn tới khi có phép)
 * → CTA cuối. Ảnh: khung giữ chỗ (MediaFrame) — thay bằng ảnh thật/khung phim khi có, không dùng KHANG.
 */
export default async function AboutPage({ params }: PageProps<'/[locale]/ve-chung-toi'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'about' });
  const tp = await getTranslations({ locale, namespace: 'partners' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const preview = isDraftPreview();
  const kpis = statViews(stats.filter((s) => s.showOn.includes('about')).map((s) => s.id));
  const partners = partnersWithConsent();

  return (
    <>
      <PageHero
        breadcrumb={<Breadcrumbs routeKey="about" locale={locale} />}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        aside={<MediaFrame motif="team" ratio="4/3" pendingNote={`${tp('media.photoPending')}: ${t('media.team')}`} />}
      />

      <Section id="cau-chuyen" aria-labelledby="cau-chuyen-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <SectionHeader id="cau-chuyen-title" eyebrow={t('story.eyebrow')} title={t('story.title')} />
          <div className="flex max-w-[66ch] flex-col gap-5 text-body text-(--surface-fg) md:text-lead md:font-normal">
            <p>{t('story.p1')}</p>
            <p>{t('story.p2')}</p>
            <p>{t('story.p3')}</p>
          </div>
        </div>
      </Section>

      <Section tone="blue-50" aria-labelledby="cach-lam-viec-title">
        <SectionHeader id="cach-lam-viec-title" eyebrow={t('values.eyebrow')} title={t('values.title')} />
        <StaggerGrid as="ul" className="mt-10 grid gap-6 md:grid-cols-3">
          {VALUES.map(({ key, icon: Icon }) => (
            <Card key={key} padding="lg" className="h-full">
              <span className="inline-flex size-12 items-center justify-center rounded-md bg-orange-500 text-navy-900">
                <Icon aria-hidden="true" size={24} strokeWidth={1.75} />
              </span>
              <h3 className="mt-6 text-h3 text-(--surface-heading)">{t(`values.${key}.title`)}</h3>
              <p className="mt-3 text-body text-(--surface-muted)">{t(`values.${key}.body`)}</p>
            </Card>
          ))}
        </StaggerGrid>
      </Section>

      {kpis.length > 0 ? (
        <Section tone="navy" aria-labelledby="con-so-title">
          <Heading level={2} id="con-so-title" className="sr-only">
            {t('kpi.title')}
          </Heading>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {kpis.map((view) => (
              <StatTile key={view.stat.id} view={view} locale={locale} animate />
            ))}
          </div>
        </Section>
      ) : null}

      {/* Bản xem trước: mốc phát triển / số liệu / logo đối tác chưa có nguồn → dòng ghi chú gọn (không còn khung nét
          đứt chiếm cả section). Production: không có gì (DraftLine trả null). */}
      {preview ? (
        <Section as="div" tone="blue-50" spacing="none" className="pb-12 md:pb-16">
          <div className="flex flex-col gap-2">
            <DraftLine label={t('milestones.title')}>{t('milestones.pending')}</DraftLine>
            {kpis.length === 0 ? <DraftLine label={t('kpi.title')}>{t('kpi.pending')}</DraftLine> : null}
            {partners.length === 0 ? <DraftLine label={t('partners.title')}>{t('partners.pending')}</DraftLine> : null}
          </div>
        </Section>
      ) : null}

      <CompanyFacts locale={locale} />

      {partners.length > 0 ? (
        <Section tone="blue-50" spacing="compact" aria-labelledby="doi-tac-title">
          <SectionHeader id="doi-tac-title" title={t('partners.title')} />
          <ul className="mt-8 flex flex-wrap items-center gap-10">
            {partners.map((p) => (
              <li key={p.name}>
                {/* eslint-disable-next-line @next/next/no-img-element -- logo SVG/AVIF nhỏ trong /public, kích thước cố định */}
                <img src={p.logo} alt={p.name} width={140} height={48} className="h-12 w-auto" />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <FinalCta
        id="hop-tac"
        eyebrow={t('final.eyebrow')}
        title={t('final.title')}
        body={t('final.body')}
        actions={
          <>
            <Button href={QUOTE_HREF} variant="primary" size="lg">
              {tc('cta.quoteBusiness')}
            </Button>
            <Button href={TECHNICIAN_SIGNUP_HREF} variant="on-dark" size="lg">
              {tc('cta.registerTechnician')}
            </Button>
          </>
        }
      />
    </>
  );
}
