import { BadgeCheck, CalendarClock, Gauge, ReceiptText, Users } from 'lucide-react';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { getMessages, getTranslations } from 'next-intl/server';
import { DEMO_HREF, QUOTE_HREF } from '@/components/layout/Header';
import { LeadB2BBlock } from '@/components/leads/LeadBlocks';
import { BillingSplit } from '@/components/solutions/BillingSplit';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { CompareTable } from '@/components/solutions/kit/CompareTable';
import { getCompareData } from '@/components/solutions/kit/compare-data';
import { ClaimGroup, ClaimList, PendingPanel, PreviewNote } from '@/components/solutions/kit/draft';
import { EndCta } from '@/components/solutions/kit/EndCta';
import { buildFaqEntries, type FaqSpec } from '@/components/solutions/kit/faq-entries';
import { FaqList } from '@/components/solutions/kit/FaqList';
import { KpiBand } from '@/components/solutions/kit/KpiBand';
import { MediaFrame } from '@/components/solutions/kit/MediaFrame';
import { ProcessTimeline } from '@/components/solutions/kit/ProcessTimeline';
import { SectionIntro } from '@/components/solutions/kit/SectionIntro';
import { SlaSection } from '@/components/solutions/kit/SlaSection';
import { slaTableVisible } from '@/components/solutions/kit/SlaRegionTable';
import { SubpageHero } from '@/components/solutions/kit/SubpageHero';
import { Button } from '@/components/ui/Button';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { claim } from '@/lib/claims';
import { isDraftPreview } from '@/lib/env';
import { serviceJsonLd } from '@/lib/jsonld';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/giai-phap/hang-dien-may'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'solutions' });
  return buildMetadata({
    routeKey: 'solutions.brands',
    locale,
    title: t('brands.meta.title'),
    description: t('brands.meta.description'),
  });
}

const PAINS = [
  { key: 'people', icon: Users },
  { key: 'quality', icon: BadgeCheck },
  { key: 'speed', icon: CalendarClock },
  { key: 'cost', icon: ReceiptText },
  { key: 'sla', icon: Gauge },
] as const;

const FAQ: readonly FaqSpec[] = [
  { id: 'channel', claims: ['b2b.integration.channels'] },
  { id: 'devices', href: '/dich-vu' },
  { id: 'coverage', href: '/mang-luoi', claims: ['coverage.provinces-34'] },
  { id: 'responsibility', claims: ['b2b.warranty.responsibility-split', 'b2b.warranty.brand-fallback'] },
  { id: 'warranty', href: '/chinh-sach-bao-hanh', claims: ['warranty.new-installation-term'] },
  { id: 'materials', href: '/bang-gia', claims: ['b2b.billing.materials-no-invoice'] },
  { id: 'tracking', claims: ['b2b.platform.realtime-tracking'] },
];

/**
 * /giai-phap/hang-dien-may — landing cho Hãng điện máy (T-SOLUTION, docs/03 mục 13.5; site-shell-p0 mục 1.3):
 * hero B2B + CTA demo → nỗi đau → (KPI K3/K5/K6 khi có số) → SLA theo vùng → quy trình 5 bước (ảnh tĩnh) →
 * đối soát & VAT → so sánh → FAQ → một khối CTA cuối (chưa form: chờ contracts/lead-b2b.md APPROVED).
 * Case study: P1, ẩn tới khi có văn bản đồng ý (AC-DATA-4).
 */
export default async function SolutionsBrandsPage({ params }: PageProps<'/[locale]/giai-phap/hang-dien-may'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'solutions' });
  const messages = await getMessages({ locale });
  const preview = isDraftPreview();
  const compare = await getCompareData(locale);
  // Chưa ô SLA nào được hiện (production trước khi duyệt) → nút và tiêu đề không hứa "SLA theo vùng" (CD-10)
  const slaShown = slaTableVisible(locale);
  // "Lắp đúng chuẩn kỹ thuật của hãng" chỉ hiện khi claim đã duyệt (bản xem trước: kèm Nháp) — CD-02
  const brandStandard = claim('quality.brand-standard', locale);
  const faq = buildFaqEntries(FAQ, messages.solutions.brands.faq.items, locale);
  const billingRows = (k: 'fee' | 'materials') =>
    (['scope', 'price', 'settle'] as const).map((r) => ({
      label: t(`brands.billing.${k}.rows.${r}.label`),
      value: t(`brands.billing.${k}.rows.${r}.value`),
    }));

  return (
    <>
      <JsonLd data={serviceJsonLd({ routeKey: 'solutions.brands', locale })} />
      <SubpageHero
        breadcrumb={<Breadcrumbs routeKey="solutions.brands" locale={locale} />}
        eyebrow={t('brands.eyebrow')}
        title={t('brands.title')}
        lead={t('brands.lead')}
        actions={
          <>
            <Button href={DEMO_HREF} variant="primary" size="lg">
              {t('kit.cta.demo')}
            </Button>
            <Button externalHref="#sla" variant="ghost" size="lg">
              {slaShown ? t('brands.toSla') : t('brands.toSlaContract')}
            </Button>
          </>
        }
        highlights={<ClaimList ids={['coverage.provinces-34', 'quality.brand-standard', 'technician.ekyc']} locale={locale} />}
        media={<MediaFrame illustration="dashboard" ratio="4/3" previewLabel={preview ? t('kit.imagePending') : null} />}
      />

      <Section aria-labelledby="van-de-title">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
            <SectionIntro eyebrow={t('brands.pains.eyebrow')} title={t('brands.pains.title')} titleId="van-de-title" lead={t('brands.pains.lead')} />
          </div>
          <ol className="flex flex-col gap-4">
            {PAINS.map(({ key, icon: Icon }, i) => (
              <li
                key={key}
                data-motion-item="rise"
                style={{ '--i': i } as CSSProperties}
                className="grid gap-5 rounded-lg border border-slate-300 bg-white p-5 shadow-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:p-6"
              >
                <div className="flex items-start gap-4">
                  <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                    <Icon size={22} strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-h3 text-navy-900">{t(`brands.pains.items.${key}.title`)}</h3>
                    <p className="mt-1.5 text-small text-slate-600">{t(`brands.pains.items.${key}.body`)}</p>
                  </div>
                </div>
                <div className="rounded-md bg-blue-50 p-4">
                  <p className="eyebrow text-orange-700">{t('brands.pains.answerLabel')}</p>
                  <p className="mt-1.5 text-small text-ink-900">{t(`brands.pains.items.${key}.answer`)}</p>
                  {key === 'quality' && brandStandard ? (
                    <p className="mt-1.5 text-small text-ink-900">
                      {brandStandard.text}
                      {brandStandard.draft ? <DraftBadge className="ml-2" /> : null}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <KpiBand locale={locale} ids={['K3', 'K5', 'K6']} title={t('brands.kpi.title')} hiddenNote={t('kit.kpiHidden', { ids: 'K3, K5, K6' })} />

      <SlaSection
        locale={locale}
        eyebrow={t('brands.sla.eyebrow')}
        title={slaShown ? t('brands.sla.title') : t('brands.sla.titleContract')}
        lead={t('brands.sla.lead')}
      />

      <Section id="quy-trinh" aria-labelledby="quy-trinh-title">
        <SectionIntro eyebrow={t('brands.process.eyebrow')} title={t('brands.process.title')} titleId="quy-trinh-title" lead={t('brands.process.lead')}>
          <PreviewNote className="mt-4">{t('kit.process.pending')}</PreviewNote>
        </SectionIntro>
        <div className="mt-10">
          <ProcessTimeline
            locale={locale}
            stepLabel={(n) => t('kit.process.step', { n })}
            triggerLabel={t('kit.process.trigger')}
            stillLabel={preview ? t('kit.stillPending') : null}
          />
        </div>
      </Section>

      <Section id="doi-soat" tone="navy" aria-labelledby="doi-soat-title">
        <SectionIntro eyebrow={t('brands.billing.eyebrow')} title={t('brands.billing.title')} titleId="doi-soat-title" lead={t('brands.billing.lead')} />
        <BillingSplit
          className="mt-10"
          fee={{ title: t('brands.billing.fee.title'), payer: t('brands.billing.fee.payer'), rows: billingRows('fee') }}
          materials={{ title: t('brands.billing.materials.title'), payer: t('brands.billing.materials.payer'), rows: billingRows('materials') }}
        />
        <ClaimGroup
          className="mt-10"
          title={t('brands.billing.claimsTitle')}
          ids={['b2b.billing.tax-compliant-costs', 'b2b.billing.materials-no-invoice', 'b2b.scope.standard-site-conditions', 'b2b.pricing.no-surprise-costs']}
          locale={locale}
          tone="navy"
        />
        <TextLink href="/bang-gia" variant="arrow" className="mt-8">
          {t('kit.cta.pricing')}
        </TextLink>
      </Section>

      <Section id="so-sanh" aria-labelledby="so-sanh-title">
        <SectionIntro eyebrow={t('brands.compare.eyebrow')} title={t('brands.compare.title')} titleId="so-sanh-title" lead={t('brands.compare.lead')} />
        <CompareTable className="mt-10" {...compare} />
      </Section>

      <Section id="cau-hoi" tone="blue-50" aria-labelledby="cau-hoi-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <SectionIntro eyebrow={t('kit.faqEyebrow')} title={t('brands.faq.title')} titleId="cau-hoi-title" />
          <FaqList items={faq} />
        </div>
      </Section>

      <EndCta
        locale={locale}
        eyebrow={t('kit.cta.eyebrow')}
        title={t('brands.cta.title')}
        body={t('brands.cta.body')}
        callLabel={t('kit.callPrefix')}
        actions={
          <>
            <Button href={DEMO_HREF} variant="primary" size="lg">
              {t('kit.cta.demo')}
            </Button>
            <Button href={QUOTE_HREF} variant="on-dark" size="lg">
              {t('kit.cta.quote')}
            </Button>
          </>
        }
        note={<LeadB2BBlock locale={locale} intents={['quote', 'demo']} />}
      />

      {preview ? (
        <Section spacing="none" className="pb-16">
          <PendingPanel
            title={t('kit.pendingTitle')}
            intro={t('kit.pendingIntro')}
            items={[
              t('brands.pending.sla'),
              t('brands.pending.billing'),
              t('brands.pending.channel'),
              t('brands.pending.kpi'),
              t('brands.pending.images'),
              t('kit.process.pending'),
            ]}
          />
        </Section>
      ) : null}
    </>
  );
}
