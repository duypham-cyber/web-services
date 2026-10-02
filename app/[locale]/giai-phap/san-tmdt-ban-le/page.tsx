import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
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

/** KHUNG — Agent trang B2B sẽ dựng trang này (docs/03 mục 13.5). */
export default async function SolutionsRetailPage({ params }: PageProps<'/[locale]/giai-phap/san-tmdt-ban-le'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'solutions' });
  return (
    <PagePlaceholder
      routeKey="solutions.retail"
      eyebrow={t('retail.eyebrow')}
      title={t('retail.title')}
      lead={t('retail.lead')}
      plan={[
        "Hero + video loop báo cáo đối soát (agent phim cung cấp loop).",
        "Sơ đồ tích hợp: đơn từ sàn → Bluebolt → thợ → trạng thái trả về sàn (SVG animate, không WebGL).",
        "Khung giá theo nhóm thiết bị → SLA → khiếu nại / đổi thợ.",
        "Form \"Thảo luận tích hợp\": CHỈ sau contract APPROVED.",
      ]}
    />
  );
}
