import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/giai-phap/hang-dien-may'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'solutions' });
  return buildMetadata({
    routeKey: 'solutions.brands',
    locale,
    title: t('brands.meta.title'),
    description: t('brands.meta.description'),
  });
}

/** KHUNG — Agent trang B2B sẽ dựng trang này (docs/03 mục 13.5). */
export default async function SolutionsBrandsPage({ params }: PageProps<'/[locale]/giai-phap/hang-dien-may'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'solutions' });
  return (
    <PagePlaceholder
      routeKey="solutions.brands"
      eyebrow={t('brands.eyebrow')}
      title={t('brands.title')}
      lead={t('brands.lead')}
      plan={[
        "Hero B2B + CTA \"Đặt lịch demo 30 phút\"; hero là video loop dolly-in vào laptop dashboard (agent phim cung cấp loop + poster).",
        "Nỗi đau của hãng → bảng SLA theo vùng (content/sla.ts, chỉ hiện giá trị đã approved).",
        "Quy trình 5 bước (content/process.ts, ảnh tĩnh từ phim) → đối soát và VAT (giải thích hóa đơn vật tư).",
        "Case study (chờ văn bản đồng ý) → so sánh tự quản / địa phương / Bluebolt → FAQ B2B.",
        "KPI K3, K5, K6 bằng KpiTile + count-up, ẩn khi value = null.",
        "Form B2B: CHỈ code sau khi contracts/lead-b2b.md có STATUS: APPROVED.",
      ]}
    />
  );
}
