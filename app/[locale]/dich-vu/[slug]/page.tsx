import { ArrowDown, CircleCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { QUOTE_HREF } from '@/components/layout/Header';
import { IncludedExcluded } from '@/components/services/IncludedExcluded';
import { SCOPE_CLAIMS, SERVICE_PRESENTATION, WARRANTY_CLAIMS } from '@/components/services/service-config';
import { Breadcrumb } from '@/components/solutions/kit/Breadcrumb';
import { ClaimGroup, ClaimList, PendingPanel, PreviewNote } from '@/components/solutions/kit/draft';
import { EndCta } from '@/components/solutions/kit/EndCta';
import { buildFaqEntries } from '@/components/solutions/kit/faq-entries';
import { FaqList } from '@/components/solutions/kit/FaqList';
import { MediaFrame } from '@/components/solutions/kit/MediaFrame';
import { ProcessTimeline } from '@/components/solutions/kit/ProcessTimeline';
import { SectionIntro } from '@/components/solutions/kit/SectionIntro';
import { SubpageHero } from '@/components/solutions/kit/SubpageHero';
import { WarrantyTable } from '@/components/solutions/kit/WarrantyTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { services } from '@/content/services';
import { resolveLocale } from '@/i18n/params';
import { isLocale, type Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { buildMetadata } from '@/lib/seo';

/** Chỉ 4 slug trong content/services.ts (slug VI cho /dich-vu/…, slug EN cho /en/services/…); còn lại 404. */
export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'vi';
  return services.map((s) => ({ slug: s.slug[locale] }));
}

function findService(locale: Locale, slug: string) {
  return services.find((s) => s.slug[locale] === slug);
}

export async function generateMetadata({ params }: PageProps<'/[locale]/dich-vu/[slug]'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const service = findService(locale, slug);
  if (!service) notFound();
  const t = await getTranslations({ locale, namespace: 'services' });
  return buildMetadata({
    routeKey: `services.${service.key}`,
    locale,
    title: t(`items.${service.key}.metaTitle`),
    description: t(`items.${service.key}.description`),
  });
}

/**
 * /dich-vu/[slug] — trang chi tiết dịch vụ (T-SERVICE, docs/03 mục 13.5; site-shell-p0 mục 1.3):
 * hero → phạm vi & thiết bị → đã gồm / chưa gồm → bảo hành (bảng SLA chung content/sla.ts) → quy trình 5 bước
 * → FAQ → dịch vụ khác → một khối CTA cuối. Chữ: messages services.items.<key>; cấu trúc: components/services/service-config.ts.
 */
export default async function ServiceDetailPage({ params }: PageProps<'/[locale]/dich-vu/[slug]'>) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const service = findService(locale, slug);
  if (!service) notFound();

  const t = await getTranslations({ locale, namespace: 'services' });
  const ts = await getTranslations({ locale, namespace: 'solutions' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const messages = await getMessages({ locale });
  const preview = isDraftPreview();
  const item = messages.services.items[service.key];
  const p = SERVICE_PRESENTATION[service.key];
  const faq = buildFaqEntries(p.faq, item.faq, locale);
  const others = services.filter((s) => s.key !== service.key);
  const pendingItems = Object.values(item.pending);

  return (
    <>
      <SubpageHero
        breadcrumb={
          <Breadcrumb
            label={ts('kit.breadcrumbLabel')}
            items={[
              { label: ts('kit.home'), href: '/' },
              { label: t('hub.eyebrow'), href: '/dich-vu' },
              { label: service.title[locale] },
            ]}
          />
        }
        eyebrow={t('eyebrow')}
        title={service.title[locale]}
        lead={item.lead}
        actions={
          <>
            <Button href={QUOTE_HREF} variant="primary" size="lg">
              {ts('kit.cta.quote')}
            </Button>
            <Button externalHref="#pham-vi" variant="ghost" size="lg" iconEnd={<ArrowDown aria-hidden="true" size={18} strokeWidth={1.75} />}>
              {t('detail.toScope')}
            </Button>
          </>
        }
        highlights={<ClaimList ids={p.heroClaims} locale={locale} />}
        media={<MediaFrame illustration={p.illustration} ratio="4/3" previewLabel={preview ? ts('kit.imagePending') : null} />}
      />

      <Section id="pham-vi" aria-labelledby="pham-vi-title">
        <SectionIntro eyebrow={t('detail.devicesEyebrow')} title={t('detail.devicesTitle')} titleId="pham-vi-title" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <ul className="flex flex-col gap-4">
            {Object.entries(item.devices).map(([key, d]) => (
              <li key={key}>
                <Card className="flex items-start gap-4">
                  <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                    <p.icon size={22} strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-h3 text-navy-900">{d.title}</h3>
                    <p className="mt-1.5 text-small text-slate-600">{d.body}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <div>
            <h3 className="text-h3 text-(--surface-heading)">{item.scopeTitle}</h3>
            {'scopeIntro' in item ? <p className="mt-3 text-body text-(--surface-muted)">{item.scopeIntro}</p> : null}
            <ol className="mt-6 flex flex-col">
              {Object.entries(item.scope).map(([key, text], i) => (
                <li key={key} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-t border-slate-300 py-4 last:border-b">
                  <span aria-hidden="true" className="tabular pt-0.5 text-small font-semibold text-blue-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-body text-ink-900">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section id="da-gom" tone="blue-50" aria-labelledby="da-gom-title">
        <SectionIntro eyebrow={t('detail.includedEyebrow')} title={t('detail.includedTitle')} titleId="da-gom-title" />
        <IncludedExcluded
          className="mt-10"
          includedTitle={t('detail.included')}
          excludedTitle={t('detail.excluded')}
          included={Object.values(item.included)}
          excluded={Object.values(item.excluded)}
        />
        <ClaimGroup className="mt-10" title={ts('brands.billing.claimsTitle')} ids={SCOPE_CLAIMS} locale={locale} />
        <TextLink href="/bang-gia" variant="arrow" className="mt-8">
          {t('detail.materialsLink')}
        </TextLink>
      </Section>

      <Section id="bao-hanh" aria-labelledby="bao-hanh-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <SectionIntro eyebrow={t('detail.warrantyEyebrow')} title={t('detail.warrantyTitle')} titleId="bao-hanh-title" lead={t('detail.warrantyLead')} />
            <TextLink href="/chinh-sach-bao-hanh" variant="arrow" className="mt-6">
              {t('detail.warrantyPolicyLink')}
            </TextLink>
          </div>
          <div className="min-w-0">
            <WarrantyTable
              locale={locale}
              caption={t('detail.warrantyTable.caption')}
              itemLabel={t('detail.warrantyTable.item')}
              valueLabel={t('detail.warrantyTable.value')}
              pendingValueLabel={t('detail.warrantyTable.pendingValue')}
              draftCaption={t('detail.warrantyTable.draftCaption')}
              fallback={
                <div className="flex items-start gap-4 rounded-lg border border-slate-300 bg-white p-6 shadow-1">
                  <CircleCheck aria-hidden="true" size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-blue-600" />
                  <p className="text-body text-ink-900">{t('detail.warrantyTable.fallback')}</p>
                </div>
              }
            />
            <ClaimGroup className="mt-8" title={t('detail.warrantyClaimsTitle')} ids={WARRANTY_CLAIMS} locale={locale} />
          </div>
        </div>
      </Section>

      <Section id="quy-trinh" tone="blue-50" aria-labelledby="quy-trinh-title">
        <SectionIntro eyebrow={t('detail.processEyebrow')} title={t('detail.processTitle')} titleId="quy-trinh-title">
          <PreviewNote className="mt-4">{ts('kit.process.pending')}</PreviewNote>
        </SectionIntro>
        <div className="mt-8">
          <ProcessTimeline
            locale={locale}
            variant="compact"
            stepLabel={(n) => ts('kit.process.step', { n })}
            triggerLabel={ts('kit.process.trigger')}
          />
        </div>
      </Section>

      <Section id="cau-hoi" aria-labelledby="cau-hoi-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <SectionIntro eyebrow={ts('kit.faqEyebrow')} title={t('detail.faqTitle')} titleId="cau-hoi-title" />
          <FaqList items={faq} />
        </div>
      </Section>

      <Section tone="blue-50" spacing="compact" aria-labelledby="dich-vu-khac-title">
        <h2 id="dich-vu-khac-title" className="text-h3 text-navy-900">
          {t('detail.otherTitle')}
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {others.map((o) => {
            const op = SERVICE_PRESENTATION[o.key];
            return (
              <li key={o.key}>
                <Card interactive className="flex h-full items-start gap-4">
                  <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                    <op.icon size={20} strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <TextLink
                      href={{ pathname: '/dich-vu/[slug]', params: { slug: o.slug[locale] } }}
                      variant="arrow"
                      className="after:absolute after:inset-0 after:rounded-lg"
                    >
                      {o.title[locale]}
                    </TextLink>
                    <p className="mt-1 text-small text-slate-600">{t(`items.${o.key}.card`)}</p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </Section>

      <EndCta
        locale={locale}
        eyebrow={ts('kit.cta.eyebrow')}
        title={item.cta.title}
        body={item.cta.body}
        callLabel={ts('kit.callPrefix')}
        actions={
          <>
            <Button href={QUOTE_HREF} variant="primary" size="lg">
              {tc('cta.quote')}
            </Button>
            <Button href="/bang-gia" variant="on-dark" size="lg">
              {ts('kit.cta.pricing')}
            </Button>
          </>
        }
        note={preview ? <p className="text-small text-(--surface-muted)">{ts('kit.formPending')}</p> : null}
      />

      {preview ? (
        <Section spacing="none" className="pb-16">
          <PendingPanel
            title={ts('kit.pendingTitle')}
            intro={ts('kit.pendingIntro')}
            items={[...pendingItems, ts('kit.process.pending'), ts('kit.formPending')]}
          />
        </Section>
      ) : null}
    </>
  );
}
