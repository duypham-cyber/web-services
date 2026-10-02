import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
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

/** KHUNG — Agent trang thợ & công ty sẽ dựng trang này (docs/03 mục 13.5). */
export default async function AboutPage({ params }: PageProps<'/[locale]/ve-chung-toi'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'about' });
  return (
    <PagePlaceholder
      routeKey="about"
      eyebrow={t('eyebrow')}
      title={t('title')}
      lead={t('lead')}
      plan={[
        "Hero: ảnh tĩnh phòng điều phối (khung cuối shot 0, agent phim cung cấp).",
        "Sứ mệnh → KPI (K4) → mốc phát triển → đội ngũ, văn phòng (ảnh thật) → pháp nhân, MST (content/site.ts) → đối tác (logo chỉ khi có phép).",
      ]}
    />
  );
}
