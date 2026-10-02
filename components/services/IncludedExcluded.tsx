import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

type IncludedExcludedProps = {
  includedTitle: string;
  excludedTitle: string;
  included: string[];
  excluded: string[];
  className?: string;
};

/**
 * "Đã gồm / chưa gồm" của một dịch vụ (docs/03 mục 13.5, T-SERVICE). Hai danh sách thật (<ul>), không dấu ✗
 * đỏ gây hiểu nhầm là lỗi: mục chưa gồm dùng dấu gạch, nghĩa là "tính hoặc xử lý riêng".
 */
export function IncludedExcluded({ includedTitle, excludedTitle, included, excluded, className }: IncludedExcludedProps) {
  const blocks = [
    { key: 'in', title: includedTitle, items: included, positive: true },
    { key: 'out', title: excludedTitle, items: excluded, positive: false },
  ];
  return (
    <div className={cn('grid gap-6 lg:grid-cols-2', className)}>
      {blocks.map((b) => (
        <div key={b.key} className="rounded-lg border border-slate-300 bg-white p-6 shadow-1 md:p-8">
          <h3 className="flex items-center gap-3 text-h3 text-navy-900">
            <span
              aria-hidden="true"
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-pill',
                b.positive ? 'bg-blue-600 text-white' : 'border-2 border-slate-500 text-slate-600',
              )}
            >
              {b.positive ? <Check size={18} strokeWidth={2.25} /> : <Minus size={18} strokeWidth={2.25} />}
            </span>
            {b.title}
          </h3>
          <ul className="mt-6 flex flex-col divide-y divide-slate-300 border-t border-slate-300">
            {b.items.map((item) => (
              <li key={item} className="flex items-start gap-3 py-3 text-body text-ink-900">
                <span
                  aria-hidden="true"
                  className={cn('mt-2.5 size-1.5 shrink-0 rounded-pill', b.positive ? 'bg-blue-600' : 'bg-slate-500')}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
