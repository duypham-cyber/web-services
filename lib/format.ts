import type { Locale } from '@/i18n/routing';

export type StatFormat = 'integer' | 'of-34' | 'percent' | 'hours';

const INTL_LOCALE: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US' };

/**
 * Định dạng số KPI theo ngôn ngữ: vi "1.234" · en "1,234"; "27/34"; "96,4%"; "4 giờ" / "4 h".
 * Dùng chung cho KpiTile (server) và CountUp (client) để chuỗi SSR và chuỗi cuối của hiệu ứng trùng khớp.
 */
export function formatStatValue(value: number, format: StatFormat, locale: Locale, unit?: string): string {
  const nf = new Intl.NumberFormat(INTL_LOCALE[locale], {
    maximumFractionDigits: format === 'percent' || format === 'hours' ? 1 : 0,
  });
  switch (format) {
    case 'of-34':
      return `${nf.format(value)}/34`;
    case 'percent':
      return `${nf.format(value)}%`;
    case 'hours':
      return unit ? `${nf.format(value)} ${unit}` : nf.format(value);
    default:
      return nf.format(value);
  }
}

/** Ngày YYYY-MM-DD → dd/mm/yyyy (vi) hoặc "2 Oct 2026" (en). */
export function formatDate(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  if (locale === 'vi') {
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}
