import {
  AirVent,
  ArrowDown,
  Bot,
  ClipboardCheck,
  CookingPot,
  Droplets,
  MessageSquareWarning,
  Refrigerator,
  SearchCheck,
  Tv,
  WashingMachine,
} from 'lucide-react';
import type { Metadata } from 'next';
import { getMessages, getTranslations } from 'next-intl/server';
import { INTEGRATION_HREF } from '@/components/layout/Header';
import { LeadB2BBlock } from '@/components/leads/LeadBlocks';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { IntegrationDiagram } from '@/components/solutions/IntegrationDiagram';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { ClaimGroup, ClaimList, PendingPanel } from '@/components/solutions/kit/draft';
import { EndCta } from '@/components/solutions/kit/EndCta';
import { buildFaqEntries, type FaqSpec } from '@/components/solutions/kit/faq-entries';
import { FaqList } from '@/components/solutions/kit/FaqList';
import { KpiBand } from '@/components/solutions/kit/KpiBand';
import { MediaFrame } from '@/components/solutions/kit/MediaFrame';
import { SectionIntro } from '@/components/solutions/kit/SectionIntro';
import { SlaSection } from '@/components/solutions/kit/SlaSection';
import { SubpageHero } from '@/components/solutions/kit/SubpageHero';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { site } from '@/content/site';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { isDraftPreview } from '@/lib/env';
import { serviceJsonLd } from '@/lib/jsonld';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/giai-phap/san-tmdt-ban-le'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'solutions' });
  return buildMetadata({
    routeKey: 'solutions.retail',
    locale,
    title: t('retail.meta.title'),
    description: t('retail.meta.description'),
  });
}

/**
 * Nhóm thiết bị cho "Khung giá theo nhóm thiết bị". hasPartsTable = có dòng trong content/pricing.ts.
 * Chưa có phí theo nhóm được duyệt → một câu (lead) + hàng chip 7 nhóm, không lặp 7 thẻ "Theo hợp đồng" giống hệt nhau.
 * Khi có bảng phí theo nhóm và vùng: dựng lại thành bảng/thẻ có số.
 */
const GROUPS = [
  { key: 'ac', icon: AirVent, hasPartsTable: true },
  { key: 'laundry', icon: WashingMachine, hasPartsTable: false },
  { key: 'fridge', icon: Refrigerator, hasPartsTable: false },
  { key: 'tv', icon: Tv, hasPartsTable: false },
  { key: 'kitchen', icon: CookingPot, hasPartsTable: false },
  { key: 'water', icon: Droplets, hasPartsTable: false },
  { key: 'robot', icon: Bot, hasPartsTable: false },
] as const;

const COMPLAINT_STEPS = [
  { key: 'receive', icon: MessageSquareWarning },
  { key: 'verify', icon: SearchCheck },
  { key: 'resolve', icon: ClipboardCheck },
] as const;

const FAQ: readonly FaqSpec[] = [
  { id: 'channel', claims: ['b2b.integration.channels'] },
  { id: 'status', claims: ['b2b.platform.realtime-tracking'] },
  { id: 'support', claims: ['b2b.complaints.support-response'] },
  { id: 'materials', href: '/bang-gia', claims: ['b2b.billing.materials-no-invoice'] },
  { id: 'urgent', claims: ['b2b.sla.urgent-orders'], claimOnly: true },
  { id: 'remote', claims: ['b2b.sla.special-areas-definition'], claimOnly: true },
];

/**
 * /giai-phap/san-tmdt-ban-le — landing cho Sàn TMĐT & chuỗi bán lẻ (T-SOLUTION, docs/03 mục 13.5):
 * hero → sơ đồ tích hợp (SVG, chuyển động nhẹ một lần) → khung giá theo nhóm thiết bị → SLA → khiếu nại/đổi thợ
 * → FAQ → một khối CTA cuối "Thảo luận tích hợp" → /lien-he#kinh-doanh (form: chờ contract lead APPROVED).
 */
export default async function SolutionsRetailPage({ params }: PageProps<'/[locale]/giai-phap/san-tmdt-ban-le'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'solutions' });
  const messages = await getMessages({ locale });
  const preview = isDraftPreview();
  const faq = buildFaqEntries(FAQ, messages.solutions.retail.faq.items, locale, { phone: site.hotline.display[locale] });

  return (
    <>
      <JsonLd data={serviceJsonLd({ routeKey: 'solutions.retail', locale })} />
      <SubpageHero
        breadcrumb={<Breadcrumbs routeKey="solutions.retail" locale={locale} />}
        eyebrow={t('retail.eyebrow')}
        title={t('retail.title')}
        lead={t('retail.lead')}
        actions={
          <>
            <Button href={INTEGRATION_HREF} variant="primary" size="lg">
              {t('kit.cta.integration')}
            </Button>
            <Button externalHref="#tich-hop" variant="ghost" size="lg" iconEnd={<ArrowDown aria-hidden="true" size={18} strokeWidth={1.75} />}>
              {t('retail.toDiagram')}
            </Button>
          </>
        }
        highlights={<ClaimList ids={['b2b.retail.onsite-within-24h', 'coverage.provinces-34']} locale={locale} />}
        media={<MediaFrame illustration="integration" ratio="4/3" previewLabel={preview ? t('kit.imagePending') : null} />}
      />

      <Section id="tich-hop" aria-labelledby="tich-hop-title">
        <SectionIntro eyebrow={t('retail.diagram.eyebrow')} title={t('retail.diagram.title')} titleId="tich-hop-title" lead={t('retail.diagram.lead')} />
        <IntegrationDiagram
          className="mt-12"
          label={t('retail.diagram.label')}
          nodes={[
            { key: 'marketplace', title: t('retail.diagram.nodes.marketplace.title'), body: t('retail.diagram.nodes.marketplace.body') },
            { key: 'bluebolt', title: t('retail.diagram.nodes.bluebolt.title'), body: t('retail.diagram.nodes.bluebolt.body') },
            { key: 'technician', title: t('retail.diagram.nodes.technician.title'), body: t('retail.diagram.nodes.technician.body') },
            { key: 'customer', title: t('retail.diagram.nodes.customer.title'), body: t('retail.diagram.nodes.customer.body') },
          ]}
          returnTitle={t('retail.diagram.returnTitle')}
          statuses={(['received', 'assigned', 'scheduled', 'done'] as const).map((s) => t(`retail.diagram.statuses.${s}`))}
          statusesNote={t('retail.diagram.statusesNote')}
        />
        <ClaimGroup
          className="mt-10"
          title={t('retail.diagram.claimsTitle')}
          ids={['b2b.integration.channels', 'b2b.platform.realtime-tracking']}
          locale={locale}
        />
      </Section>

      <KpiBand locale={locale} ids={['K3', 'K5', 'K6']} title={t('brands.kpi.title')} hiddenNote={t('kit.kpiHidden', { ids: 'K3, K5, K6' })} />

      <Section id="khung-gia" tone="blue-50" aria-labelledby="khung-gia-title">
        <SectionIntro eyebrow={t('retail.groups.eyebrow')} title={t('retail.groups.title')} titleId="khung-gia-title" lead={t('retail.groups.lead')} />
        <ul aria-label={t('retail.groups.listLabel')} className="mt-8 flex flex-wrap gap-3">
          {GROUPS.map(({ key, icon: Icon, hasPartsTable }) => (
            <li
              key={key}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-slate-300 bg-white px-3.5 py-2 text-small shadow-1"
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.5} className="shrink-0 text-blue-600" />
              <span className="font-semibold text-navy-900">{t(`retail.groups.items.${key}.title`)}</span>
              {hasPartsTable ? <span className="text-slate-600">· {t('retail.groups.materialsTable')}</span> : null}
            </li>
          ))}
        </ul>
        <TextLink href="/bang-gia" variant="arrow" className="mt-8">
          {t('kit.cta.pricing')}
        </TextLink>
      </Section>

      <SlaSection
        locale={locale}
        tone="light"
        eyebrow={t('retail.sla.eyebrow')}
        title={t('retail.sla.title')}
        lead={t('retail.sla.lead')}
        extraClaims={['b2b.retail.onsite-within-24h']}
      />

      <Section id="khieu-nai" tone="blue-50" aria-labelledby="khieu-nai-title">
        <SectionIntro eyebrow={t('retail.complaints.eyebrow')} title={t('retail.complaints.title')} titleId="khieu-nai-title" lead={t('retail.complaints.lead')} />
        <StaggerGrid as="ol" className="mt-10 grid gap-4 md:grid-cols-3">
          {COMPLAINT_STEPS.map(({ key, icon: Icon }, i) => (
            <Card key={key} className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <span aria-hidden="true" className="inline-flex size-11 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                  <Icon size={22} strokeWidth={1.5} />
                </span>
                <span aria-hidden="true" className="tabular text-small font-semibold text-slate-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-4 text-h3 text-navy-900">{t(`retail.complaints.steps.${key}.title`)}</h3>
              <p className="mt-2 text-small text-slate-600">{t(`retail.complaints.steps.${key}.body`)}</p>
            </Card>
          ))}
        </StaggerGrid>
        <ClaimGroup
          className="mt-10"
          title={t('retail.complaints.claimsTitle')}
          ids={[
            'b2b.complaints.change-technician',
            'b2b.complaints.technician-sanctions',
            'b2b.complaints.property-damage',
            'b2b.complaints.support-response',
          ]}
          locale={locale}
        />
      </Section>

      <Section id="cau-hoi" aria-labelledby="cau-hoi-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <SectionIntro eyebrow={t('kit.faqEyebrow')} title={t('retail.faq.title')} titleId="cau-hoi-title" />
          <FaqList items={faq} />
        </div>
      </Section>

      <EndCta
        locale={locale}
        eyebrow={t('kit.cta.eyebrow')}
        title={t('retail.cta.title')}
        body={t('retail.cta.body')}
        callLabel={t('kit.callPrefix')}
        actions={
          <>
            <Button href={INTEGRATION_HREF} variant="primary" size="lg">
              {t('kit.cta.integration')}
            </Button>
            <Button href="/bang-gia" variant="on-dark" size="lg">
              {t('kit.cta.pricing')}
            </Button>
          </>
        }
        note={<LeadB2BBlock locale={locale} intents={['integration']} />}
      />

      {preview ? (
        <Section spacing="none" className="pb-16">
          <PendingPanel
            title={t('kit.pendingTitle')}
            intro={t('kit.pendingIntro')}
            items={[
              t('retail.pending.diagram'),
              t('retail.pending.groups'),
              t('retail.pending.sla'),
              t('retail.pending.complaints'),
            ]}
          />
        </Section>
      ) : null}
    </>
  );
}
