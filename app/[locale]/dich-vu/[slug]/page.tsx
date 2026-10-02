import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { services } from '@/content/services';
import { resolveLocale } from '@/i18n/params';
import { isLocale, type Locale } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';

/** Chỉ 4 slug trong content/services.ts (slug VI cho /dich-vu/…, slug EN cho /en/services/…); còn lại 404. */
export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'vi';
  return services.map((s) => ({ slug: s.slug[locale] }));
}

function findService(locale: Locale, slug: string) {
  return services.find((s) => s.slug[locale] === slug);
}

export async function generateMetadata({ params }: PageProps<'/[locale]/dich-vu/[slug]'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const service = findService(locale, slug);
  if (!service) notFound();
  const t = await getTranslations({ locale, namespace: 'services' });
  return buildMetadata({
    routeKey: `services.${service.key}`,
    locale,
    title: service.title[locale],
    description: t(`items.${service.key}.description`),
  });
}

/** KHUNG — Agent trang B2B sẽ dựng trang chi tiết dịch vụ (docs/03 mục 13.5). */
export default async function ServiceDetailPage({ params }: PageProps<'/[locale]/dich-vu/[slug]'>) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const service = findService(locale, slug);
  if (!service) notFound();
  const t = await getTranslations({ locale, namespace: 'services' });
  return (
    <PagePlaceholder
      routeKey={`services.${service.key}`}
      eyebrow={t('eyebrow')}
      title={service.title[locale]}
      lead={t(`items.${service.key}.lead`)}
      plan={[
        'Phạm vi → thiết bị → đã gồm / chưa gồm → bảo hành (bảng SLA chung, content/sla.ts) → quy trình (content/process.ts) → FAQ → CTA.',
        'Hero /dich-vu/lap-dat-dieu-hoa: video loop orbit quanh dàn lạnh (agent phim cung cấp). Các dịch vụ khác: motion 2.5D.',
        `Ưu tiên ${service.priority}. Slug EN: ${service.slug.en} (content/services.ts).`,
      ]}
    />
  );
}
