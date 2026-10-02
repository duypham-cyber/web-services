import { cn } from '@/lib/cn';

export type CompareColumn = { key: string; label: string; highlight?: boolean };
export type CompareRow = { key: string; label: string; cells: Record<string, string> };

type CompareTableProps = {
  caption: string;
  criterionLabel: string;
  columns: CompareColumn[];
  rows: CompareRow[];
  className?: string;
};

/**
 * Bảng so sánh "tự quản thợ / đơn vị địa phương / Bluebolt" (docs/03 mục 13.5).
 * Một <table> duy nhất cho mọi bề rộng (không nhân đôi nội dung):
 *   - ≥ 768px: bảng thường, cột được nhấn (Bluebolt) nền blue-50, đầu cột blue-600;
 *   - < 768px: mỗi tiêu chí thành một thẻ, mỗi ô có nhãn cột hiện bằng chữ (aria-hidden — trình đọc màn hình
 *     dùng đầu cột thật). Vai trò ARIA (table/row/cell…) đặt tường minh để giữ ngữ nghĩa khi đổi display.
 * Không tự khen: ô chỉ mô tả khác biệt, không dấu ✓/✗ đánh giá.
 */
export function CompareTable({ caption, criterionLabel, columns, rows, className }: CompareTableProps) {
  return (
    <div className={cn('md:overflow-clip md:rounded-lg md:border md:border-slate-300 md:bg-white md:shadow-1', className)}>
      <table role="table" className="w-full border-collapse text-left max-md:block md:table-fixed">
        <caption className="sr-only">{caption}</caption>
        <thead role="rowgroup" className="max-md:sr-only">
          <tr role="row">
            <th role="columnheader" scope="col" className="w-[22%] px-5 py-4 align-bottom text-small font-semibold text-slate-600">
              {criterionLabel}
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                role="columnheader"
                scope="col"
                className={cn(
                  'px-5 py-4 align-bottom text-body font-semibold',
                  c.highlight ? 'bg-blue-600 text-white' : 'text-navy-900',
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup" className="max-md:flex max-md:flex-col max-md:gap-4">
          {rows.map((r) => (
            <tr
              key={r.key}
              role="row"
              className="border-t border-slate-300 max-md:flex max-md:flex-col max-md:overflow-clip max-md:rounded-lg max-md:border max-md:bg-white max-md:shadow-1"
            >
              <th
                role="rowheader"
                scope="row"
                className="px-5 py-4 align-top text-body font-semibold text-navy-900 max-md:border-b max-md:border-slate-300 max-md:bg-blue-50"
              >
                {r.label}
              </th>
              {columns.map((c) => (
                <td
                  key={c.key}
                  role="cell"
                  className={cn(
                    'px-5 py-4 align-top text-small text-ink-900 max-md:flex max-md:flex-col max-md:gap-0.5 max-md:py-3',
                    c.highlight
                      ? 'bg-blue-50 font-medium text-navy-900 md:border-x md:border-blue-100 max-md:border-l-4 max-md:border-blue-600'
                      : '',
                  )}
                >
                  <span aria-hidden="true" className="text-eyebrow font-semibold tracking-normal text-slate-600 md:hidden">
                    {c.label}
                  </span>
                  {r.cells[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
