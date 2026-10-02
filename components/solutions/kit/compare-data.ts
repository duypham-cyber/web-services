import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import type { CompareColumn, CompareRow } from './CompareTable';

const COLUMNS = ['self', 'local', 'bluebolt'] as const;
const ROWS = ['coverage', 'fixedCost', 'quality', 'tracking', 'billing', 'expansion'] as const;

/**
 * Dữ liệu bảng so sánh "tự quản thợ / đơn vị địa phương / Bluebolt" — một nguồn cho /giai-phap và
 * /giai-phap/hang-dien-may (messages solutions.kit.compare). Chỉ mô tả khác biệt, không số liệu.
 */
export async function getCompareData(locale: Locale): Promise<{
  caption: string;
  criterionLabel: string;
  columns: CompareColumn[];
  rows: CompareRow[];
}> {
  const t = await getTranslations({ locale, namespace: 'solutions' });
  return {
    caption: t('kit.compare.caption'),
    criterionLabel: t('kit.compare.criterion'),
    columns: COLUMNS.map((key) => ({ key, label: t(`kit.compare.columns.${key}`), highlight: key === 'bluebolt' })),
    rows: ROWS.map((key) => ({
      key,
      label: t(`kit.compare.rows.${key}.label`),
      cells: Object.fromEntries(COLUMNS.map((c) => [c, t(`kit.compare.rows.${key}.${c}`)])),
    })),
  };
}
