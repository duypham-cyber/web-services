import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { DraftNote } from '@/components/partners/DraftNote';
import { MediaFrame } from '@/components/partners/MediaFrame';
import { SectionHeader } from '@/components/partners/SectionHeader';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { PHOTOS } from '@/content/photos';
import { site } from '@/content/site';
import type { Locale } from '@/i18n/routing';

/**
 * /ve-chung-toi#phap-nhan — pháp nhân, MST, văn phòng (content/site.ts, một nguồn với footer và JSON-LD).
 * Tên pháp nhân KHÔNG dịch (lang="vi" trên bản EN). Không STK ngân hàng, không chi nhánh "sẽ cập nhật".
 */
export async function CompanyFacts({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'about' });
  const tp = await getTranslations({ locale, namespace: 'partners' });

  const rows: { term: string; value: ReactNode }[] = [
    {
      term: t('company.legalName'),
      value: (
        <span lang="vi" className="font-semibold">
          {site.legalName.upper}
        </span>
      ),
    },
    { term: t('company.brand'), value: site.brandName },
    { term: t('company.taxCode'), value: <span className="tabular">{site.taxCode}</span> },
    { term: t('company.office'), value: site.address.text[locale] },
    {
      term: t('company.hotline'),
      value: (
        <a href={`tel:${site.hotline.tel}`} className="font-semibold text-(--surface-link) tabular hover:underline">
          {site.hotline.display[locale]}
        </a>
      ),
    },
    {
      term: t('company.email'),
      value: (
        <a href={`mailto:${site.email}`} className="text-(--surface-link) hover:underline">
          {site.email}
        </a>
      ),
    },
  ];

  return (
    <Section id="phap-nhan" aria-labelledby="phap-nhan-title">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-16">
        <div className="min-w-0">
          <SectionHeader id="phap-nhan-title" eyebrow={t('company.eyebrow')} title={t('company.title')} />
          <dl className="mt-8 divide-y divide-slate-300 border-y border-slate-300">
            {rows.map((row) => (
              <div key={row.term} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-6">
                <dt className="text-small font-medium text-(--surface-muted)">{row.term}</dt>
                <dd className="min-w-0 break-words text-body text-(--surface-fg)">{row.value}</dd>
              </div>
            ))}
          </dl>
          <DraftNote className="mt-6">{t('company.addressNote')}</DraftNote>
        </div>
        <div className="min-w-0">
          <MediaFrame
            motif="office"
            ratio="4/3"
            photo={PHOTOS['van-phong']}
            sizes="(min-width: 1024px) 480px, 100vw"
            pendingNote={`${tp('media.photoPending')}: ${t('media.office')}`}
          />
          <TextLink href={{ pathname: '/lien-he', hash: 'van-phong' }} variant="arrow" className="mt-5 py-1">
            {t('company.contactLink')}
          </TextLink>
        </div>
      </div>
    </Section>
  );
}
