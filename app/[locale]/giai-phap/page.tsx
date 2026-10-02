import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
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

/** KHUNG — Agent trang B2B sẽ dựng trang này (docs/03 mục 13.5). */
export default async function SolutionsHubPage({ params }: PageProps<'/[locale]/giai-phap'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'solutions' });
  return (
    <PagePlaceholder
      routeKey="solutions"
      eyebrow={t('hub.eyebrow')}
      title={t('hub.title')}
      lead={t('hub.lead')}
      plan={[
        "Hub so sánh (P1): hai thẻ lớn \"Hãng điện máy\" và \"Sàn TMĐT & bán lẻ\" dẫn sang 2 landing.",
        "Bảng so sánh: tự quản đội thợ / đơn vị địa phương / Bluebolt (không tự khen suông, mỗi dòng một bằng chứng).",
        "Motion 2.5D: rise, stagger-grid. Không shot phim.",
      ]}
    />
  );
}
