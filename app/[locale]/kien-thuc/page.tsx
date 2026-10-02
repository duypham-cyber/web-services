import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/kien-thuc'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  return buildMetadata({
    routeKey: 'knowledge',
    locale,
    title: t('hub.meta.title'),
    description: t('hub.meta.description'),
  });
}

/** KHUNG — Agent nội dung & SEO sẽ dựng trang này (docs/03 mục 13.5). */
export default async function KnowledgeHubPage({ params }: PageProps<'/[locale]/kien-thuc'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  return (
    <PagePlaceholder
      routeKey="knowledge"
      eyebrow={t('hub.eyebrow')}
      title={t('hub.title')}
      lead={t('hub.lead')}
      plan={[
        "Hub 3 nhóm: hướng dẫn lắp đặt · kiến thức kỹ thuật · vận hành cho doanh nghiệp (content/articles.ts).",
        "Card bài: nhóm · ngày · thời gian đọc · excerpt 2 dòng.",
        "Chuyển 6 bài từ site cũ (gộp 2 bài robot, bài AI 410 theo giả định Q10).",
      ]}
    />
  );
}
