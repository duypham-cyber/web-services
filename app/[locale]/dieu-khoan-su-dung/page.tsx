import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { legalMetadata } from '@/components/legal/legal-metadata';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/dieu-khoan-su-dung'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return legalMetadata('terms', locale);
}

/**
 * T-LEGAL (contracts/site-shell-p0.md AC-LEGAL-1). Điều khoản sử dụng: KHUNG MỤC, nội dung do pháp chế soạn và duyệt.
 */
export default async function TermsPage({ params }: PageProps<'/[locale]/dieu-khoan-su-dung'>) {
  const locale = await resolveLocale(params);
  return <LegalDocument locale={locale} docKey="terms" />;
}
