import { notFound } from 'next/navigation';
import { isLocale, type Locale } from './routing';

/** Đọc `locale` từ params của page/layout (Next 16: params là Promise) và kiểm hợp lệ. */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
