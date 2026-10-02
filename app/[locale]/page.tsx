import { Building2, Headset, Wrench } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FilmHero } from '@/components/film/FilmHero';
import { QUOTE_HREF, TECHNICIAN_SIGNUP_HREF } from '@/components/layout/Header';
import { DevNotes, showDevNotes } from '@/components/layout/PagePlaceholder';
import { VietnamMap } from '@/components/map/VietnamMap';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import type { AppHref } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { KpiTile } from '@/components/ui/KpiTile';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { PROCESS_PENDING_NOTE, processSteps } from '@/content/process';
import { statsWithValue } from '@/content/stats';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { claim } from '@/lib/claims';
import { isDraftPreview } from '@/lib/env';
import { formatDate } from '@/lib/format';
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

/**
 * TRANG CHỦ (khung). Phần đầu = FilmHero (agent phim thay ruột, giữ props). Sau phim = các section HTML
 * cuộn native (agent B2B hoàn thiện theo docs/03 mục 13.4). Bản đồ 34 tỉnh là section HTML 2.5D sau phim (A+).
 */
export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations('home');
  const tc = await getTranslations('common');
  const tn = await getTranslations('network');
  const preview = isDraftPreview();
  const coverage = claim('coverage.provinces-34', locale);
  const kpis = statsWithValue(['K1', 'K2', 'K3', 'K4']);
  const trigger = processSteps.find((s) => s.isTrigger);
  const steps = processSteps.filter((s) => !s.isTrigger);

  const doors: { key: 'brands' | 'technicians' | 'consumers'; icon: typeof Building2; href: AppHref }[] = [
    { key: 'brands', icon: Building2, href: '/giai-phap/hang-dien-may' },
    { key: 'technicians', icon: Wrench, href: '/doi-tac-tho' },
    { key: 'consumers', icon: Headset, href: '/ho-tro-khach-hang' },
  ];

  return (
    <>
      <FilmHero
        locale={locale}
        eyebrow={coverage ? { text: coverage.text, draft: coverage.draft } : null}
        title={t('hero.title')}
        lead={t('hero.lead')}
        primaryCta={{ label: tc('cta.quoteBusiness'), href: QUOTE_HREF }}
        secondaryCta={{ label: tc('cta.registerTechnician'), href: TECHNICIAN_SIGNUP_HREF }}
        skipLabel={t('hero.skipIntro')}
      />

      {/* Đích của link "Bỏ qua phần giới thiệu" và của handoff (H2, không phải H1) */}
      <Section id="ba-cua-vao" aria-labelledby="ba-cua-vao-title">
        <Eyebrow>{t('doors.eyebrow')}</Eyebrow>
        <Heading level={2} id="ba-cua-vao-title" className="mt-3">
          {t('doors.title')}
        </Heading>
        <StaggerGrid as="ul" className="mt-10 grid gap-6 md:grid-cols-3">
          {doors.map(({ key, icon: Icon, href }) => (
            <Card key={key} interactive padding="lg" className="flex h-full flex-col">
              <span className="inline-flex size-12 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
              </span>
              <Heading level={3} className="mt-6">
                {t(`doors.${key}.title`)}
              </Heading>
              <p className="mt-3 flex-1 text-body text-(--surface-muted)">{t(`doors.${key}.body`)}</p>
              <TextLink href={href} variant="arrow" className="mt-6 after:absolute after:inset-0 after:rounded-lg">
                {t(`doors.${key}.cta`)}
              </TextLink>
            </Card>
          ))}
        </StaggerGrid>
      </Section>

      {/* 5 bước = <ol> server render (NFR-A11Y-04: tắt JS vẫn đủ H1, 5 bước, KPI, CTA) */}
      <Section tone="blue-50" aria-labelledby="quy-trinh-title">
        <Eyebrow>{t('process.eyebrow')}</Eyebrow>
        <Heading level={2} id="quy-trinh-title" className="mt-3">
          {t('process.title')}
        </Heading>
        {trigger ? (
          <p className="mt-6 text-small text-(--surface-muted)">
            <span className="tabular font-semibold">{trigger.id}</span> · {trigger.title[locale]} — {trigger.description[locale]}
          </p>
        ) : null}
        <StaggerGrid as="ol" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step) => (
            <div key={step.id} className="flex h-full flex-col border-t-2 border-blue-600 pt-5">
              <p className="tabular text-h2 font-semibold text-blue-600" aria-hidden="true">
                {step.id}
              </p>
              <h3 className="mt-3 text-h3 text-(--surface-heading)">
                <span className="sr-only">{t('process.stepLabel', { n: step.id })}: </span>
                {step.title[locale]}
              </h3>
              <p className="mt-1 text-small font-medium text-(--surface-accent)">{step.actor[locale]}</p>
              <p className="mt-3 text-small text-(--surface-muted)">{step.description[locale]}</p>
            </div>
          ))}
        </StaggerGrid>
        {preview ? (
          <p className="mt-8 flex flex-wrap items-center gap-2 text-small text-(--surface-muted)" lang="vi">
            <DraftBadge /> {PROCESS_PENDING_NOTE}
          </p>
        ) : null}
      </Section>

      {/* KPI K1–K4: ô nào chưa có số thì ẩn; cả dải ẩn khi chưa có số nào */}
      {kpis.length > 0 ? (
        <Section tone="navy" aria-labelledby="kpi-title">
          <Heading level={2} id="kpi-title" className="sr-only">
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
      ) : preview ? (
        <Section tone="navy" spacing="compact" aria-labelledby="kpi-title">
          <Heading level={2} id="kpi-title" size="h3">
            {t('kpi.title')}
          </Heading>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-small text-(--surface-muted)">
            <DraftBadge /> {t('kpi.hiddenNote')}
          </p>
        </Section>
      ) : null}

      <Section aria-labelledby="mang-luoi-title">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>{t('map.eyebrow')}</Eyebrow>
            <Heading level={2} id="mang-luoi-title" className="mt-3">
              {t('map.title')}
            </Heading>
            <p className="mt-5 max-w-text text-lead text-(--surface-muted)">{t('map.body')}</p>
            <TextLink href="/mang-luoi" variant="arrow" className="mt-8">
              {t('map.cta')}
            </TextLink>
          </div>
          <VietnamMap locale={locale} variant="home" title={tn('mapTitle')} />
        </div>
      </Section>

      {showDevNotes() ? (
        <DevNotes
          routeKey="home"
          plan={[
            'Agent phim: thay ruột FilmHero bằng phim A+ (shot 0 POV ban ngày → dolly-in, phòng tối dần → screen-hold website cuộn trên màn hình → push-through/handoff sang HeroScreen H2 → "Ba cửa vào"). Giữ props, giữ H1 ở shot 0, đặt data-film-zone lên cả track cuộn.',
            'Section sau phim theo docs/03 mục 13.4: P1 Ba cửa vào (đã có khung), P2 dải tin cậy (KPI K1–K4 + logo khi có phép), P3 vấn đề → giải pháp, P4 dịch vụ (stagger-grid), P5 bằng chứng (P1), P6 tiêu chuẩn thợ (P1), P7 kiến thức (P1), P8 CTA cuối (form chờ contract).',
            'Bản đồ 34 tỉnh: section HTML 2.5D (agent bản đồ thay VietnamMap, giữ props). Không WebGL trên trang chủ với A+.',
            'Câu khẳng định (34 tỉnh, chuẩn hãng, E-KYC, bảo hành, 24/7) chỉ đọc qua claim(); production ẩn nếu chưa duyệt.',
          ]}
        />
      ) : null}
    </>
  );
}
