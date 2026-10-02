import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/dieu-khoan-su-dung'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'legal' });
  return buildMetadata({
    routeKey: 'legal.terms',
    locale,
    title: t('terms.meta.title'),
    description: t('terms.meta.description'),
  });
}

/** KHUNG — Agent trang thợ & công ty dựng template; NỘI DUNG do pháp chế viết (docs/03 mục 15 dòng 19). */
export default async function TermsPage({ params }: PageProps<'/[locale]/dieu-khoan-su-dung'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'legal' });
  return (
    <PagePlaceholder
      routeKey="legal.terms"
      eyebrow={t('eyebrow')}
      title={t('terms.title')}
      lead={t('pendingNotice')}
      plan={[
        "Template văn bản có mục lục (components/ui/Prose). Nội dung do pháp chế viết.",
      ]}
    />
  );
}
