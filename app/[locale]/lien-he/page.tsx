import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/lien-he'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'contact' });
  return buildMetadata({
    routeKey: 'contact',
    locale,
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

/** KHUNG — Agent trang thợ & công ty sẽ dựng trang này (docs/03 mục 13.5). */
export default async function ContactPage({ params }: PageProps<'/[locale]/lien-he'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'contact' });
  return (
    <PagePlaceholder
      routeKey="contact"
      eyebrow={t('eyebrow')}
      title={t('title')}
      lead={t('lead')}
      plan={[
        "3 kênh theo bộ phận: #kinh-doanh (B2B, đích của nút \"Nhận báo giá\") · #tuyen-tho · #cskh.",
        "Địa chỉ chữ + bản đồ facade (chỉ tải khi bấm) từ content/site.ts.",
        "Bảng giờ hoạt động từ content/sla.ts (chỉ khi approved; đang mâu thuẫn 24/7 và 9–18h).",
      ]}
    />
  );
}
