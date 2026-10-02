import { getTranslations } from 'next-intl/server';
import { formerNames, provinces, regions, searchAliases } from '@/content/provinces';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { formatDate, formatStatValue } from '@/lib/format';
import { ProvinceFilter, type ProvinceFilterRow } from './ProvinceFilter';
import { foldVietnamese, stripVietnameseMarks } from './search';

const REGION_BAR = {
  north: 'bg-blue-600',
  central: 'bg-blue-300',
  south: 'bg-navy-900',
} as const;

/**
 * Bảng 34 tỉnh (P0 /mang-luoi): server render ĐỦ 34 dòng trong HTML (Googlebot, không JS — AC-NOJS-1, AC-MAP-1).
 * Một bảng mỗi vùng (H3 + <table> có caption), xếp hai cột từ 1024px (Bắc | Trung + Nam ≈ 18 | 16 dòng).
 * Cột số thợ: technicianCount hoặc "chưa có số" (không suy ra 0). Ô tìm + lọc vùng (ProvinceFilter) chỉ ẩn/hiện dòng.
 */
export async function ProvinceTable({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'network' });

  const rows: ProvinceFilterRow[] = provinces.map((p) => ({
    code: p.code,
    region: p.region,
    search: foldVietnamese(
      [p.name.vi, p.name.en, ...(formerNames[p.code] ?? []), ...(searchAliases[p.code] ?? [])].join(' | '),
    ),
  }));

  const formerLine = (code: string) => {
    const names = formerNames[code];
    if (!names?.length) return null;
    const shown = locale === 'vi' ? names : names.map(stripVietnameseMarks);
    return t('table.former', { names: shown.join(', ') });
  };

  return (
    <ProvinceFilter
      rows={rows}
      regions={regions.map((r) => ({ id: r.id, label: r.name[locale] }))}
      labels={{
        search: t('table.searchLabel'),
        searchHint: t('table.searchHint'),
        regionFilter: t('table.regionFilter'),
        allRegions: t('table.allRegions'),
        resultCount: t.raw('table.resultCount') as string,
        empty: t('table.empty'),
        clear: t('table.clear'),
      }}
    >
      <div className="gap-8 lg:columns-2">
        {regions.map((region) => {
          const list = provinces.filter((p) => p.region === region.id);
          const headingId = `bang-${region.id}`;
          return (
            <div key={region.id} data-region-group={region.id} className="mb-8 break-inside-avoid last:mb-0">
              <h3 id={headingId} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-2.5 text-h3 text-(--surface-heading)">
                  <span aria-hidden="true" className={cn('h-4 w-1.5 rounded-pill', REGION_BAR[region.id])} />
                  {region.name[locale]}
                </span>
                <span className="text-small font-normal text-(--surface-muted)">
                  {region.scope[locale]} · {t('regions.provinceCount', { count: list.length })}
                </span>
              </h3>
              <div className="mt-3 overflow-hidden rounded-md border border-slate-300 bg-white">
                <table aria-labelledby={headingId} className="w-full border-collapse text-left text-small">
                  <thead>
                    <tr className="border-b border-slate-300 bg-blue-50">
                      <th scope="col" className="px-4 py-2.5 font-semibold text-navy-900">
                        {t('table.colProvince')}
                      </th>
                      <th scope="col" className="px-4 py-2.5 text-right font-semibold text-navy-900">
                        {t('table.colTechnicians')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => {
                      const former = formerLine(p.code);
                      return (
                        <tr key={p.code} data-province-row={p.code} className="border-b border-slate-300 last:border-b-0">
                          <th scope="row" className="px-4 py-3 align-top font-normal">
                            <span className="block font-semibold text-ink-900">{p.name[locale]}</span>
                            <span className="mt-0.5 block text-slate-600">
                              {p.isCentralCity ? t('table.typeCity') : t('table.typeProvince')}
                              {former ? ` · ${former}` : ''}
                            </span>
                          </th>
                          <td className="px-4 py-3 text-right align-top whitespace-nowrap tabular">
                            {p.technicianCount === null ? (
                              <span className="text-slate-600">{t('map.noCount')}</span>
                            ) : (
                              <>
                                <span className="font-semibold text-ink-900">
                                  {formatStatValue(p.technicianCount, 'integer', locale)}
                                </span>
                                {p.updatedAt ? (
                                  <span className="block text-slate-600">
                                    {t('map.updated', { date: formatDate(p.updatedAt, locale) })}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </ProvinceFilter>
  );
}
