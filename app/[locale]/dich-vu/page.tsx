import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
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

/** KHUNG — Agent trang B2B sẽ dựng trang này (docs/03 mục 13.5). */
export default async function ServicesHubPage({ params }: PageProps<'/[locale]/dich-vu'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'services' });
  return (
    <PagePlaceholder
      routeKey="services"
      eyebrow={t('hub.eyebrow')}
      title={t('hub.title')}
      lead={t('hub.lead')}
      plan={[
        "Hub 4 nhóm dịch vụ đọc từ content/services.ts (card + icon, stagger-grid).",
        "View transition card → trang chi tiết (page-transition, docs/03 mục 12.2) nếu trình duyệt hỗ trợ.",
        "Không tự ghi giá; giá tham khảo nằm ở /bang-gia.",
      ]}
    />
  );
}
