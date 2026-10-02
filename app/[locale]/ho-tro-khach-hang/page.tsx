import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/ho-tro-khach-hang'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'support' });
  return buildMetadata({
    routeKey: 'support',
    locale,
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

/** KHUNG — Agent trang thợ & công ty sẽ dựng trang này (docs/03 mục 13.5). */
export default async function SupportPage({ params }: PageProps<'/[locale]/ho-tro-khach-hang'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'support' });
  return (
    <PagePlaceholder
      routeKey="support"
      eyebrow={t('eyebrow')}
      title={t('title')}
      lead={t('lead')}
      plan={[
        "Gọi / Zalo (Zalo đang draft trong content/site.ts).",
        "Đăng ký bảo hành 7 ngày (form P1, chờ contract) → thời hạn bảo hành (content/sla.ts, chỉ khi approved).",
        "Dòng \"Bluebolt không yêu cầu chuyển khoản cá nhân cho thợ\".",
      ]}
    />
  );
}
