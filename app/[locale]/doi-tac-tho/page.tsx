import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/doi-tac-tho'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'partners' });
  return buildMetadata({
    routeKey: 'partners',
    locale,
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

/** KHUNG — Agent trang thợ & công ty sẽ dựng trang này (docs/03 mục 13.5). */
export default async function PartnersPage({ params }: PageProps<'/[locale]/doi-tac-tho'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'partners' });
  return (
    <PagePlaceholder
      routeKey="partners"
      eyebrow={t('eyebrow')}
      title={t('title')}
      lead={t('lead')}
      plan={[
        "Hero thợ + \"Đơn ổn định, thu nhập minh bạch\" (ưu tiên ảnh/video thật thợ cầm app).",
        "Thu nhập tham khảo (số thật) → cách nhận tiền, phí nền tảng, ví → lộ trình gia nhập 4 bước (Đăng ký → E-KYC → Đào tạo → Nhận đơn).",
        "Tiêu chuẩn (#tieu-chuan) → việc đang tuyển (#viec-dang-tuyen) → lời chứng thực → FAQ.",
        "Form 4 trường (#dang-ky): CHỈ sau contracts/lead-technician.md APPROVED; link tải app.",
        "Thanh hành động mobile tự đổi nút phải thành \"Đăng ký thợ\" trên trang này.",
      ]}
    />
  );
}
