import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { HeroMapDev, type HeroMapDevLabels } from '@/components/film/HeroMapDev';
import { archipelagos, provinces } from '@/content/provinces';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { devPagesEnabled } from '@/lib/env';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/dev/hero-map'>): Promise<Metadata> {
  if (!devPagesEnabled()) notFound();
  const locale = await resolveLocale(params);
  return buildMetadata({
    routeKey: 'dev.hero-map',
    locale,
    title: 'Hero bản đồ 3D (nội bộ)',
    description: 'Trang nội bộ để soát cảnh 3D hero "Bản đồ sống 34 tỉnh" theo tiến độ và tầng, chụp poster. Không index.',
  });
}

/**
 * Trang soát cảnh 3D hero bản đồ (contracts/hero-map.md). Query (đọc ở client, trang vẫn tĩnh):
 *   ?p=0.5          tiến độ 0..1        ?tier=full|lite     tầng          ?layout=desktop|mobile  ép bố cục
 *   ?shot=1         chụp tất định: seed cố định, thời gian đứng, không làm mượt, ẩn bảng điều khiển, phủ cả header
 *   ?labels=0       ẩn nhãn HTML (poster chụp không có chữ)       ?ambient=1   bật hiệu ứng nền
 * scripts/hero-poster.mjs và ảnh soát dùng window.__heroMapDev (set(p), frame(), stats()).
 */
export default async function DevHeroMapPage({ params }: PageProps<'/[locale]/dev/hero-map'>) {
  if (!devPagesEnabled()) notFound();
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'film' });
  const labels: HeroMapDevLabels = {
    provinces: Object.fromEntries(provinces.map((p) => [p.code, { name: p.name[locale], major: p.isCentralCity }])),
    archipelagos: Object.fromEntries(archipelagos.map((a) => [a.id, a.label[locale]])) as HeroMapDevLabels['archipelagos'],
    sea: t('map.sea'),
    hqRole: t('map.hqRole'),
    legend: t('map.legend'),
  };
  return <HeroMapDev labels={labels} />;
}
