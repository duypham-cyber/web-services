import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/bang-gia'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return buildMetadata({
    routeKey: 'pricing',
    locale,
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

/** KHUNG — Agent trang B2B sẽ dựng trang này (docs/03 mục 13.5). */
export default async function PricingPage({ params }: PageProps<'/[locale]/bang-gia'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return (
    <PagePlaceholder
      routeKey="pricing"
      eyebrow={t('eyebrow')}
      title={t('title')}
      lead={t('lead')}
      plan={[
        "Khung giá vật tư tham khảo (thợ thu tại chỗ): bảng lọc theo thiết bị / vùng, VAT, ngày hiệu lực, tải PDF.",
        "Giá theo hợp đồng cho B2B + form (chờ contract APPROVED).",
        "Link sang /chinh-sach-bao-hanh. Chính sách 4 phần cũ tách sang trang pháp lý.",
        "KHÔNG motion, KHÔNG shot, KHÔNG Lenis; không animate giá.",
      ]}
    />
  );
}
