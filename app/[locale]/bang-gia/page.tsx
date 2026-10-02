import { BadgeCheck, FileText, Info, Layers, ReceiptText } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QUOTE_HREF } from '@/components/layout/Header';
import { assertPricingValid } from '@/components/pricing/pricing-schema';
import { PriceTable, type PriceTableRow } from '@/components/pricing/PriceTable';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { PendingPanel } from '@/components/solutions/kit/draft';
import { SectionIntro } from '@/components/solutions/kit/SectionIntro';
import { SubpageHero } from '@/components/solutions/kit/SubpageHero';
import { Button } from '@/components/ui/Button';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { AC_CAPACITIES_BTU, PRICE_REGIONS, pricingPublishable, pricingTable } from '@/content/pricing';
import { site } from '@/content/site';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { formatDate } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/bang-gia'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return buildMetadata({
    routeKey: 'pricing',
    locale,
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

const NUMBER_LOCALE: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US' };
const POLICY_PARTS = ['general', 'customers', 'technicians', 'brands'] as const;

/**
 * /bang-gia — "Khung giá vật tư tham khảo (thợ thu tại chỗ)" (T-PRICING, docs/03 mục 13.5; site-shell-p0 mục 1.3).
 * KHÔNG motion, KHÔNG shot, KHÔNG Lenis, không animate giá. Bảng server render đủ, lọc theo thiết bị/vùng ở client.
 * Dữ liệu: content/pricing.ts (Zod ở components/pricing/pricing-schema.ts, build fail nếu sai).
 * Production: bảng CHỈ hiện khi có ngày hiệu lực + đã duyệt (site-shell-p0 mục 5) → nếu chưa, hiện khối "đang cập nhật".
 * Chính sách 4 phần của trang giá cũ: chỉ tóm tắt + link /chinh-sach-bao-hanh (trang pháp lý của agent partner).
 */
export default async function PricingPage({ params }: PageProps<'/[locale]/bang-gia'>) {
  const locale = await resolveLocale(params);
  assertPricingValid();
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const ts = await getTranslations({ locale, namespace: 'solutions' });
  const preview = isDraftPreview();
  const showTable = pricingPublishable() || preview;
  const tableIsDraft = !pricingPublishable();
  const nf = new Intl.NumberFormat(NUMBER_LOCALE[locale], { maximumFractionDigits: 0 });
  const phone = site.hotline.display[locale];

  const rows: PriceTableRow[] = pricingTable.items.map((it) => ({
    id: it.id,
    label: it.item[locale],
    capacityKey: it.capacityBtu === null ? 'unknown' : String(it.capacityBtu),
    capacityLabel: it.capacityBtu === null ? t('table.capacityUnknown') : t('table.capacityValue', { capacity: nf.format(it.capacityBtu) }),
    unknownCapacity: it.capacityBtu === null,
    unitLabel: t('table.perMetre'),
    prices: Object.fromEntries(PRICE_REGIONS.map((r) => [r, nf.format(it.prices[r])])),
  }));
  const capacities = AC_CAPACITIES_BTU.filter((c) => pricingTable.items.some((it) => it.capacityBtu === c));

  const facts = [
    { key: 'unit', icon: Layers, label: t('facts.unit'), value: t('facts.unitValue'), draft: false },
    {
      key: 'vat',
      icon: ReceiptText,
      label: t('facts.vat'),
      value: pricingTable.vatIncluded ? t('facts.vatIncluded') : t('facts.vatExcluded'),
      draft: false,
    },
    {
      key: 'effective',
      icon: BadgeCheck,
      label: t('facts.effective'),
      value: pricingTable.effectiveFrom ? formatDate(pricingTable.effectiveFrom, locale) : t('facts.effectivePending'),
      draft: pricingTable.effectiveFrom === null,
    },
    { key: 'collected', icon: Info, label: t('facts.collected'), value: t('facts.collectedValue'), draft: false },
  ];

  return (
    <>
      <SubpageHero
        breadcrumb={<Breadcrumbs routeKey="pricing" locale={locale} />}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        footer={
          showTable ? (
            <dl aria-label={t('facts.label')} className="grid gap-px overflow-clip rounded-lg border border-blue-100 bg-blue-100 sm:grid-cols-2 lg:grid-cols-4">
              {facts.map(({ key, icon: Icon, label, value, draft }) => (
                <div key={key} className="flex items-start gap-3 bg-white p-4 md:p-5">
                  <Icon aria-hidden="true" size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-blue-600" />
                  <div className="min-w-0">
                    <dt className="text-small text-slate-600">{label}</dt>
                    <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-body font-semibold text-navy-900">
                      {value}
                      {draft ? <DraftBadge /> : null}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          ) : null
        }
      />

      <Section id="bang-vat-tu" aria-labelledby="bang-vat-tu-title">
        {showTable ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>{t('table.eyebrow')}</Eyebrow>
                <Heading level={2} id="bang-vat-tu-title" className="mt-3">
                  {t('table.title')}
                </Heading>
              </div>
              {tableIsDraft ? (
                <p className="flex items-center gap-2 text-small text-slate-600">
                  <DraftBadge />
                  {t('pending.effective')}
                </p>
              ) : null}
            </div>
            <div className="mt-8">
              <PriceTable
                rows={rows}
                regions={PRICE_REGIONS.map((r) => ({ key: r, label: t(`table.regions.${r}`) }))}
                deviceOptions={[
                  { value: 'all', label: t('filters.allDevices') },
                  ...capacities.map((c) => ({ value: String(c), label: t('filters.acCapacity', { capacity: nf.format(c) }) })),
                ]}
                regionOptions={[
                  { value: 'all', label: t('filters.allRegions') },
                  ...PRICE_REGIONS.map((r) => ({ value: r, label: t(`table.regions.${r}`) })),
                ]}
                labels={{
                  legend: t('filters.legend'),
                  device: t('filters.device'),
                  region: t('filters.region'),
                  countTemplate: t.raw('filters.count') as string,
                  reset: t('filters.reset'),
                  empty: t('filters.empty'),
                  caption: t('table.caption'),
                  item: t('table.item'),
                  capacity: t('table.capacity'),
                  unit: t('table.unit'),
                  footnoteUnknown: t('table.noteCapacityUnknown'),
                  unknownIncluded: t('filters.unknownIncluded'),
                }}
              />
            </div>
            <div className="mt-8 grid gap-6 rounded-lg bg-blue-50 p-6 md:grid-cols-[auto_minmax(0,1fr)] md:p-8">
              <Info aria-hidden="true" size={22} strokeWidth={1.5} className="text-blue-600" />
              <div>
                <h3 className="text-body font-semibold text-navy-900">{t('notes.title')}</h3>
                <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-small text-ink-900 marker:text-blue-600">
                  <li>{t('notes.reference')}</li>
                  <li>{t('notes.agree')}</li>
                  <li>{t('table.specialAreas')}</li>
                  <li>
                    {t.rich('notes.quote', {
                      phone,
                      tel: (chunks) => (
                        <a href={`tel:${site.hotline.tel}`} className="font-semibold text-blue-600 tabular underline-offset-4 hover:underline">
                          {chunks}
                        </a>
                      ),
                    })}
                  </li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="flex max-w-text items-start gap-4 rounded-lg border border-slate-300 bg-white p-6 shadow-1 md:p-8">
            <FileText aria-hidden="true" size={24} strokeWidth={1.5} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <Heading level={2} id="bang-vat-tu-title" size="h3">
                {t('hidden.title')}
              </Heading>
              <p className="mt-2 text-body text-slate-600">{t('hidden.body', { phone })}</p>
            </div>
          </div>
        )}
      </Section>

      <Section id="gia-hop-dong" spacing="compact" aria-labelledby="gia-hop-dong-title" className="pb-16 md:pb-24">
        <div data-tone="navy" className="relative overflow-clip rounded-xl bg-navy-900 px-6 py-12 md:px-12 md:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-pill bg-[radial-gradient(circle,var(--color-blue-600)_0%,transparent_70%)] opacity-60"
          />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center">
            <div className="min-w-0">
              <Eyebrow>{t('contract.eyebrow')}</Eyebrow>
              <Heading level={2} id="gia-hop-dong-title" className="mt-3 max-w-[26ch]">
                {t('contract.title')}
              </Heading>
              <p className="mt-5 max-w-[60ch] text-lead text-(--surface-muted)">{t('contract.body')}</p>
              <ul className="mt-6 flex flex-col gap-2.5">
                {(['groups', 'settle', 'separate'] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2.5 text-body text-white">
                    <BadgeCheck aria-hidden="true" size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-orange-200" />
                    {t(`contract.points.${k}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              <Button href={QUOTE_HREF} variant="primary" size="lg" className="self-start">
                {ts('kit.cta.quote')}
              </Button>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <TextLink href="/giai-phap/hang-dien-may" variant="arrow">
                  {t('contract.brands')}
                </TextLink>
                <TextLink href="/giai-phap/san-tmdt-ban-le" variant="arrow">
                  {t('contract.retail')}
                </TextLink>
              </div>
              <p className="text-small text-(--surface-muted)">
                {ts('kit.callPrefix')}{' '}
                <a href={`tel:${site.hotline.tel}`} className="font-semibold text-white tabular underline-offset-4 hover:underline">
                  {phone}
                </a>
              </p>
              {preview ? <p className="text-small text-(--surface-muted)">{ts('kit.formPending')}</p> : null}
            </div>
          </div>
        </div>
      </Section>

      <Section id="chinh-sach" tone="blue-50" aria-labelledby="chinh-sach-title">
        <SectionIntro eyebrow={t('policy.eyebrow')} title={t('policy.title')} titleId="chinh-sach-title" lead={t('policy.lead')} />
        <ol className="mt-10 grid gap-4 md:grid-cols-2">
          {POLICY_PARTS.map((k) => (
            <li key={k} className="rounded-lg border border-slate-300 bg-white p-6 shadow-1">
              <h3 className="text-h3 text-navy-900">{t(`policy.parts.${k}.title`)}</h3>
              <p className="mt-2 text-small text-slate-600">{t(`policy.parts.${k}.body`)}</p>
            </li>
          ))}
        </ol>
        <TextLink href="/chinh-sach-bao-hanh" variant="arrow" className="mt-8">
          {t('policy.link')}
        </TextLink>
      </Section>

      {preview ? (
        <Section spacing="compact">
          <PendingPanel
            title={ts('kit.pendingTitle')}
            intro={ts('kit.pendingIntro')}
            items={[t('pending.effective'), t('pending.capacity'), t('pending.service'), t('pending.pdf'), ts('kit.formPending')]}
          />
        </Section>
      ) : null}
    </>
  );
}
