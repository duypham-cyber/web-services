import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { legalMetadata } from '@/components/legal/legal-metadata';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/chinh-sach-bao-mat'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return legalMetadata('privacy', locale);
}

/**
 * T-LEGAL (contracts/site-shell-p0.md AC-LEGAL-1). Chính sách bảo mật: KHUNG MỤC, nội dung do pháp chế soạn theo Luật BVDLCN 91/2025/QH15 (NFR-PDP-01).
 * Điều kiện launch: phải có bản pháp chế duyệt (content/legal.ts → status "approved").
 */
export default async function PrivacyPolicyPage({ params }: PageProps<'/[locale]/chinh-sach-bao-mat'>) {
  const locale = await resolveLocale(params);
  return <LegalDocument locale={locale} docKey="privacy" />;
}
