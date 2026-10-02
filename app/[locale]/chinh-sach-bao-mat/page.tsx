import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/chinh-sach-bao-mat'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'legal' });
  return buildMetadata({
    routeKey: 'legal.privacy',
    locale,
    title: t('privacy.meta.title'),
    description: t('privacy.meta.description'),
  });
}

/** KHUNG — Agent trang thợ & công ty dựng template; NỘI DUNG do pháp chế viết (docs/03 mục 15 dòng 19). */
export default async function PrivacyPolicyPage({ params }: PageProps<'/[locale]/chinh-sach-bao-mat'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'legal' });
  return (
    <PagePlaceholder
      routeKey="legal.privacy"
      eyebrow={t('eyebrow')}
      title={t('privacy.title')}
      lead={t('pendingNotice')}
      plan={[
        "Template văn bản có mục lục (components/ui/Prose).",
        "Nội dung do pháp chế viết theo Luật BVDLCN 91/2025/QH15 và nghị định hướng dẫn (pháp chế xác nhận số hiệu).",
        "Liệt kê bên xử lý dữ liệu (Turnstile, Sentry, SMTP...) trước khi bật form. KHÔNG animate nội dung pháp lý.",
      ]}
    />
  );
}
