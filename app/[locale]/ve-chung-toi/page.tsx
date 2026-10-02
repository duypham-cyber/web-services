import { BadgeCheck, FileSearch, Zap, type LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CompanyFacts } from '@/components/about/CompanyFacts';
import { QUOTE_HREF, TECHNICIAN_SIGNUP_HREF } from '@/components/layout/Header';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { DraftNote } from '@/components/partners/DraftNote';
import { FinalCta } from '@/components/partners/FinalCta';
import { MediaFrame } from '@/components/partners/MediaFrame';
import { PageHero } from '@/components/partners/PageHero';
import { SectionHeader } from '@/components/partners/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { KpiTile } from '@/components/ui/KpiTile';
import { Section } from '@/components/ui/Section';
import { partnersWithConsent } from '@/content/partners';
import { stats } from '@/content/stats';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { isDraftPreview } from '@/lib/env';
import { formatDate } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';

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
 * sứ mệnh → cách làm việc (Nhanh – Chuẩn – Minh bạch) → KPI (content/stats.ts, null → ẩn) → mốc phát triển (chỉ mốc
 * có nguồn: hiện chưa có → chỉ ô giữ chỗ ở bản xem trước) → pháp nhân, MST, văn phòng → đối tác (ẩn tới khi có phép)
 * → CTA cuối. Ảnh: khung giữ chỗ (MediaFrame) — thay bằng ảnh thật/khung phim khi có, không dùng KHANG.
 */
export default async function AboutPage({ params }: PageProps<'/[locale]/ve-chung-toi'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'about' });
  const tp = await getTranslations({ locale, namespace: 'partners' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const preview = isDraftPreview();
  const kpis = stats.filter((s) => s.showOn.includes('about') && s.value !== null);
  const partners = partnersWithConsent();

  return (
    <>
      <PageHero
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
            {kpis.map((k) => (
              <KpiTile
                key={k.id}
                value={k.value}
                format={k.format}
                locale={locale}
                unit={tc('units.hours')}
                label={k.label[locale]}
                note={k.updatedAt ? `${k.definition[locale]} · ${formatDate(k.updatedAt, locale)}` : k.definition[locale]}
                animate
              />
            ))}
          </div>
        </Section>
      ) : null}

      {preview ? (
        <Section spacing="compact" aria-labelledby="moc-phat-trien-title">
          <SectionHeader id="moc-phat-trien-title" eyebrow={t('milestones.eyebrow')} title={t('milestones.title')} />
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <li key={n} className="rounded-lg border-2 border-dashed border-slate-500 px-5 py-6 text-small font-medium text-slate-600">
                {t('milestones.slot', { n })}
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-col gap-3">
            <DraftNote>{t('milestones.pending')}</DraftNote>
            {kpis.length === 0 ? <DraftNote>{t('kpi.pending')}</DraftNote> : null}
            {partners.length === 0 ? <DraftNote>{t('partners.pending')}</DraftNote> : null}
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
