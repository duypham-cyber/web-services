import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/chinh-sach-bao-hanh'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'legal' });
  return buildMetadata({
    routeKey: 'legal.warranty',
    locale,
    title: t('warranty.meta.title'),
    description: t('warranty.meta.description'),
  });
}

/** KHUNG — Agent trang thợ & công ty dựng template; NỘI DUNG do pháp chế viết (docs/03 mục 15 dòng 19). */
export default async function WarrantyPolicyPage({ params }: PageProps<'/[locale]/chinh-sach-bao-hanh'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'legal' });
  return (
    <PagePlaceholder
      routeKey="legal.warranty"
      eyebrow={t('eyebrow')}
      title={t('warranty.title')}
      lead={t('pendingNotice')}
      plan={[
        "Template văn bản có mục lục; thời hạn bảo hành đọc từ content/sla.ts (chỉ khi approved).",
        "Gộp phần chính sách 4 phần của /prices cũ (Phần 2: khách hàng, Phần 4: hãng).",
      ]}
    />
  );
}
