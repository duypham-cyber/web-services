import { ArrowDown, Camera, ListOrdered, ReceiptText, ShieldCheck, Snowflake, Sparkles, Tv } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QUOTE_HREF } from '@/components/layout/Header';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { ServiceCard } from '@/components/services/ServiceCard';
import { SERVICE_PRESENTATION } from '@/components/services/service-config';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { PendingPanel } from '@/components/solutions/kit/draft';
import { EndCta } from '@/components/solutions/kit/EndCta';
import { MediaFrame } from '@/components/solutions/kit/MediaFrame';
import { SectionIntro } from '@/components/solutions/kit/SectionIntro';
import { SubpageHero } from '@/components/solutions/kit/SubpageHero';
import { Button, type AppHref } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { PHOTOS } from '@/content/photos';
import { services } from '@/content/services';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { isDraftPreview } from '@/lib/env';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/dich-vu'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'services' });
  return buildMetadata({
    routeKey: 'services',
    locale,
    title: t('hub.meta.title'),
    description: t('hub.meta.description'),
  });
}

const DEVICE_GROUPS = [
  { key: 'cooling', icon: Snowflake },
  { key: 'home', icon: Tv },
  { key: 'smart', icon: Sparkles },
] as const;

const COMMON: { key: 'process' | 'signoff' | 'materials' | 'warranty'; icon: typeof Camera; href?: AppHref; linkKey?: 'pricing' | 'warranty' }[] = [
  { key: 'process', icon: ListOrdered },
  { key: 'signoff', icon: Camera },
  { key: 'materials', icon: ReceiptText, href: '/bang-gia', linkKey: 'pricing' },
  { key: 'warranty', icon: ShieldCheck, href: '/chinh-sach-bao-hanh', linkKey: 'warranty' },
];

/**
 * /dich-vu — hub 4 nhóm dịch vụ (T-HUB, docs/03 mục 13.5). Mỗi thẻ có neo #<slug VI> và dẫn tới trang chi tiết
 * (cả 4 trang đã dựng nên không cần neo dự phòng của R-LINK). Một khối CTA cuối, chưa form.
 */
export default async function ServicesHubPage({ params }: PageProps<'/[locale]/dich-vu'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'services' });
  const ts = await getTranslations({ locale, namespace: 'solutions' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const preview = isDraftPreview();

  return (
    <>
      <SubpageHero
        breadcrumb={<Breadcrumbs routeKey="services" locale={locale} />}
        eyebrow={t('hub.eyebrow')}
        title={t('hub.title')}
        lead={t('hub.lead')}
        actions={
          <>
            <Button href={QUOTE_HREF} variant="primary" size="lg">
              {ts('kit.cta.quote')}
            </Button>
            <Button externalHref="#thiet-bi" variant="ghost" size="lg" iconEnd={<ArrowDown aria-hidden="true" size={18} strokeWidth={1.75} />}>
              {t('hub.toDevices')}
            </Button>
          </>
        }
        media={
          <MediaFrame
            illustration="appliances"
            photo={PHOTOS['tho-nhan-don-xe-may']}
            ratio="4/3"
            priority
            previewLabel={preview ? ts('kit.imagePending') : null}
          />
        }
      />

      <Section aria-labelledby="nhom-dich-vu-title">
        <SectionIntro eyebrow={t('hub.grid.eyebrow')} title={t('hub.grid.title')} titleId="nhom-dich-vu-title" />
        <StaggerGrid as="ul" className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((s) => {
            const p = SERVICE_PRESENTATION[s.key];
            return (
              <ServiceCard
                key={s.key}
                id={s.key}
                href={{ pathname: '/dich-vu/[slug]', params: { slug: s.slug[locale] } }}
                icon={p.icon}
                illustration={p.illustration}
                title={s.title[locale]}
                body={t(`items.${s.key}.card`)}
                cta={tc('cta.learnMore')}
                previewLabel={preview ? ts('kit.imagePending') : null}
              />
            );
          })}
        </StaggerGrid>
      </Section>

      <Section id="thiet-bi" tone="blue-50" aria-labelledby="thiet-bi-title">
        <SectionIntro eyebrow={t('hub.devices.eyebrow')} title={t('hub.devices.title')} titleId="thiet-bi-title" lead={t('hub.devices.lead')} />
        <StaggerGrid as="ul" className="mt-10 grid gap-4 md:grid-cols-3">
          {DEVICE_GROUPS.map(({ key, icon: Icon }) => (
            <Card key={key} className="flex h-full items-start gap-4">
              <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                <Icon size={22} strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <h3 className="text-h3 text-navy-900">{t(`hub.devices.groups.${key}.title`)}</h3>
                <p className="mt-1.5 text-small text-slate-600">{t(`hub.devices.groups.${key}.items`)}</p>
              </div>
            </Card>
          ))}
        </StaggerGrid>
      </Section>

      <Section aria-labelledby="moi-dich-vu-title">
        <SectionIntro eyebrow={t('hub.common.eyebrow')} title={t('hub.common.title')} titleId="moi-dich-vu-title" />
        <StaggerGrid as="ul" className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {COMMON.map(({ key, icon: Icon, href, linkKey }) => (
            <div key={key} className="flex h-full flex-col border-t-2 border-blue-600 pt-5">
              <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                <Icon size={20} strokeWidth={1.5} />
              </span>
              <h3 className="mt-4 text-h3 text-navy-900">{t(`hub.common.items.${key}.title`)}</h3>
              <p className="mt-2 text-small text-slate-600">{t(`hub.common.items.${key}.body`)}</p>
              {href && linkKey ? (
                <TextLink href={href} variant="arrow" className="mt-4">
                  {linkKey === 'pricing' ? ts('kit.cta.pricing') : t('detail.warrantyPolicyLink')}
                </TextLink>
              ) : null}
            </div>
          ))}
        </StaggerGrid>
        <p className="mt-12 max-w-text text-small text-slate-600">
          {t('hub.audience')}{' '}
          <TextLink href="/ho-tro-khach-hang">{t('hub.audienceLink')}</TextLink>
        </p>
      </Section>

      <EndCta
        locale={locale}
        eyebrow={ts('kit.cta.eyebrow')}
        title={t('hub.cta.title')}
        body={t('hub.cta.body')}
        callLabel={ts('kit.callPrefix')}
        actions={
          <>
            <Button href={QUOTE_HREF} variant="primary" size="lg">
              {ts('kit.cta.quote')}
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
          <PendingPanel title={ts('kit.pendingTitle')} intro={ts('kit.pendingIntro')} items={[t('hub.pending.images'), ts('kit.formPending')]} />
        </Section>
      ) : null}
    </>
  );
}
