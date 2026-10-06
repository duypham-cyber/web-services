import { ArrowDown, BookOpenText, MapIcon, ReceiptText } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DEMO_HREF, QUOTE_HREF } from '@/components/layout/Header';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { CompareTable } from '@/components/solutions/kit/CompareTable';
import { ClaimList, PendingPanel } from '@/components/solutions/kit/draft';
import { EndCta } from '@/components/solutions/kit/EndCta';
import { MediaFrame } from '@/components/solutions/kit/MediaFrame';
import { SectionIntro } from '@/components/solutions/kit/SectionIntro';
import { SubpageHero } from '@/components/solutions/kit/SubpageHero';
import { getCompareData } from '@/components/solutions/kit/compare-data';
import { Button, type AppHref } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { isDraftPreview } from '@/lib/env';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/giai-phap'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'solutions' });
  return buildMetadata({
    routeKey: 'solutions',
    locale,
    title: t('hub.meta.title'),
    description: t('hub.meta.description'),
  });
}

/**
 * /giai-phap — hub giải pháp (T-HUB, docs/03 mục 13.5): hai thẻ lớn (Hãng · Sàn) + bảng so sánh
 * "tự quản thợ / đơn vị địa phương / Bluebolt" + tài liệu nên xem + một khối CTA cuối (chưa form).
 */
export default async function SolutionsHubPage({ params }: PageProps<'/[locale]/giai-phap'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'solutions' });
  const preview = isDraftPreview();
  const compare = await getCompareData(locale);

  const cards = [
    { key: 'brands', href: '/giai-phap/hang-dien-may', illustration: 'dashboard' },
    { key: 'retail', href: '/giai-phap/san-tmdt-ban-le', illustration: 'integration' },
  ] as const;

  const resources: { key: 'services' | 'pricing' | 'network'; href: AppHref; icon: typeof MapIcon }[] = [
    { key: 'services', href: '/dich-vu', icon: BookOpenText },
    { key: 'pricing', href: '/bang-gia', icon: ReceiptText },
    { key: 'network', href: '/mang-luoi', icon: MapIcon },
  ];

  return (
    <>
      <SubpageHero
        breadcrumb={<Breadcrumbs routeKey="solutions" locale={locale} />}
        eyebrow={t('hub.eyebrow')}
        title={t('hub.title')}
        lead={t('hub.lead')}
        actions={
          <>
            <Button href={QUOTE_HREF} variant="primary" size="lg">
              {t('kit.cta.quote')}
            </Button>
            <Button externalHref="#so-sanh" variant="ghost" size="lg" iconEnd={<ArrowDown aria-hidden="true" size={18} strokeWidth={1.75} />}>
              {t('hub.toCompare')}
            </Button>
          </>
        }
        highlights={<ClaimList ids={['coverage.provinces-34']} locale={locale} />}
        media={<MediaFrame illustration="hub-flow" ratio="4/3" priority previewLabel={preview ? t('kit.imagePending') : null} />}
      />

      <Section aria-labelledby="hai-mo-hinh-title">
        <SectionIntro eyebrow={t('hub.cards.eyebrow')} title={t('hub.cards.title')} titleId="hai-mo-hinh-title" lead={t('hub.cards.lead')} />
        <StaggerGrid as="ul" className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {cards.map((c) => (
            <Card key={c.key} as="article" interactive padding="none" className="flex h-full flex-col overflow-clip">
              <MediaFrame
                illustration={c.illustration}
                ratio="16/10"
                sizes="(min-width: 1024px) 600px, 100vw"
                className="rounded-none border-0 border-b border-blue-100"
                previewLabel={preview ? t('kit.imagePending') : null}
              />
              <div className="flex flex-1 flex-col p-6 md:p-8">
                <Eyebrow>{t(`hub.cards.${c.key}.eyebrow`)}</Eyebrow>
                <Heading level={3} className="mt-3">
                  {t(`hub.cards.${c.key}.title`)}
                </Heading>
                <p className="mt-3 text-body text-(--surface-muted)">{t(`hub.cards.${c.key}.body`)}</p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {(['a', 'b', 'c'] as const).map((p) => (
                    <li key={p} className="flex items-start gap-3 text-small text-ink-900">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-pill bg-orange-500" />
                      {t(`hub.cards.${c.key}.points.${p}`)}
                    </li>
                  ))}
                </ul>
                <TextLink href={c.href} variant="arrow" className="mt-auto pt-8 after:absolute after:inset-0 after:rounded-lg">
                  {t(`hub.cards.${c.key}.cta`)}
                </TextLink>
              </div>
            </Card>
          ))}
        </StaggerGrid>
      </Section>

      <Section id="so-sanh" tone="blue-50" aria-labelledby="so-sanh-title">
        <SectionIntro eyebrow={t('hub.compare.eyebrow')} title={t('hub.compare.title')} titleId="so-sanh-title" lead={t('hub.compare.lead')} />
        <CompareTable className="mt-10" {...compare} />
      </Section>

      <Section aria-labelledby="tai-lieu-title" spacing="compact">
        <Eyebrow>{t('hub.resources.eyebrow')}</Eyebrow>
        <Heading level={2} id="tai-lieu-title" size="h3" className="mt-3">
          {t('hub.resources.title')}
        </Heading>
        <StaggerGrid as="ul" className="mt-8 grid gap-4 md:grid-cols-3">
          {resources.map(({ key, href, icon: Icon }) => (
            <Card key={key} interactive className="flex h-full items-start gap-4">
              <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                <Icon size={22} strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <TextLink href={href} variant="arrow" className="after:absolute after:inset-0 after:rounded-lg">
                  {t(`hub.resources.${key}.title`)}
                </TextLink>
                <p className="mt-1 text-small text-(--surface-muted)">{t(`hub.resources.${key}.body`)}</p>
              </div>
            </Card>
          ))}
        </StaggerGrid>
      </Section>

      <EndCta
        locale={locale}
        eyebrow={t('kit.cta.eyebrow')}
        title={t('hub.cta.title')}
        body={t('hub.cta.body')}
        callLabel={t('kit.callPrefix')}
        actions={
          <>
            <Button href={QUOTE_HREF} variant="primary" size="lg">
              {t('kit.cta.quote')}
            </Button>
            <Button href={DEMO_HREF} variant="on-dark" size="lg">
              {t('kit.cta.demo')}
            </Button>
          </>
        }
        note={preview ? <p className="text-small text-(--surface-muted)">{t('kit.formPending')}</p> : null}
      />

      {preview ? (
        <Section spacing="none" className="pb-16">
          <PendingPanel
            title={t('kit.pendingTitle')}
            intro={t('kit.pendingIntro')}
            items={[t('hub.pending.compare'), t('hub.pending.images'), t('kit.formPending')]}
          />
        </Section>
      ) : null}
    </>
  );
}
