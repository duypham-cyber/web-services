import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { legalMetadata } from '@/components/legal/legal-metadata';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/chinh-sach-bao-hanh'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return legalMetadata('warranty', locale);
}

/**
 * T-LEGAL (contracts/site-shell-p0.md AC-LEGAL-1). Chính sách bảo hành: chính sách 4 phần của website cũ (tách từ /prices), sắp xếp lại; banner
 * "Bản đang áp dụng theo website cũ — chờ pháp chế rà soát" ở bản xem trước. Production: "đang cập nhật" tới khi duyệt.
 */
export default async function WarrantyPolicyPage({ params }: PageProps<'/[locale]/chinh-sach-bao-hanh'>) {
  const locale = await resolveLocale(params);
  return <LegalDocument locale={locale} docKey="warranty" />;
}
