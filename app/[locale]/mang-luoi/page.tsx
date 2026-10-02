import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { VietnamMap } from '@/components/map/VietnamMap';
import { Section } from '@/components/ui/Section';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/mang-luoi'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'network' });
  return buildMetadata({
    routeKey: 'network',
    locale,
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

/** KHUNG — Agent bản đồ sẽ dựng trang này (docs/03 mục 13.5). */
export default async function NetworkPage({ params }: PageProps<'/[locale]/mang-luoi'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'network' });
  return (
    <PagePlaceholder
      routeKey="network"
      eyebrow={t('eyebrow')}
      title={t('title')}
      lead={t('lead')}
      plan={[
        "Bản đồ 34 tỉnh (P0: SVG + bảng; P1: WebGL tương tác hover/tap tỉnh, sau cờ).",
        "Bảng 34 tỉnh có tìm kiếm, đọc content/provinces.ts (technicianCount null → \"chưa có số\").",
        "SLA theo vùng (content/sla.ts) → CTA \"Triển khai tại tỉnh của bạn\".",
        "NFR-MAP-01: Hoàng Sa, Trường Sa luôn trong khung ở 9 breakpoint, nhãn ≥ 11px, không bị che; pháp chế ký ảnh 360px.",
      ]}
    >
      <Section aria-label={t('mapTitle')}>
        <VietnamMap locale={locale} variant="network" title={t('mapTitle')} />
      </Section>
    </PagePlaceholder>
  );
}
