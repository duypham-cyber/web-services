'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Field, TextInput } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import { foldVietnamese, matchesQuery } from './search';

type RegionOption = { id: string; label: string };

export type ProvinceFilterRow = {
  code: string;
  region: string;
  /** Chuỗi tra cứu đã chuẩn hóa (tên VI + EN + tên cũ + tên gọi khác). */
  search: string;
};

type ProvinceFilterProps = {
  rows: readonly ProvinceFilterRow[];
  regions: readonly RegionOption[];
  labels: {
    search: string;
    searchHint: string;
    regionFilter: string;
    allRegions: string;
    /** Mẫu thô có {count} và {total} (client không có namespace "network"). */
    resultCount: string;
    empty: string;
    clear: string;
  };
  /** Bảng 34 tỉnh do server render (đủ trong HTML cho Googlebot/không JS); client chỉ ẩn/hiện dòng. */
  children: ReactNode;
};

/**
 * Ô tìm + lọc vùng cho bảng 34 tỉnh (P0: lọc ở client, không gửi đi đâu — không phải form lead).
 * Bảng là Server Component truyền qua children; ở đây chỉ bật/tắt thuộc tính hidden của từng dòng theo mã tỉnh.
 * Không JS: bảng hiện đủ 34 dòng, ô tìm không có tác dụng.
 */
export function ProvinceFilter({ rows, regions, labels, children }: ProvinceFilterProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');

  const folded = foldVietnamese(query);
  const visible = new Set(
    rows.filter((r) => (region === 'all' || r.region === region) && matchesQuery(r.search, folded)).map((r) => r.code),
  );
  const count = visible.size;

  // Áp kết quả lọc lên DOM của bảng server render (không setState trong effect)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-province-row]').forEach((row) => {
      row.hidden = !visible.has(row.dataset.provinceRow ?? '');
    });
    root.querySelectorAll<HTMLElement>('[data-region-group]').forEach((group) => {
      group.hidden = !group.querySelector('[data-province-row]:not([hidden])');
    });
  });

  const resultText = labels.resultCount.replace('{count}', String(count)).replace('{total}', String(rows.length));
  const options: RegionOption[] = [{ id: 'all', label: labels.allRegions }, ...regions];

  return (
    <div ref={rootRef}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        <Field id={`${id}-q`} label={labels.search} hint={labels.searchHint} className="md:max-w-[26rem]">
          {(control) => (
            <div className="relative">
              <Search
                aria-hidden="true"
                size={20}
                strokeWidth={1.75}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500"
              />
              <TextInput
                {...control}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-12 pl-10 [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={labels.clear}
                  className="absolute top-1/2 right-1 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-sm text-slate-600 hover:text-ink-900"
                >
                  <X aria-hidden="true" size={18} strokeWidth={1.75} />
                </button>
              ) : null}
            </div>
          )}
        </Field>

        <fieldset className="min-w-0">
          <legend className="text-small font-semibold text-(--surface-heading)">{labels.regionFilter}</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {options.map((o) => (
              <label
                key={o.id}
                className={cn(
                  'inline-flex min-h-11 cursor-pointer items-center rounded-pill border px-4 text-small font-semibold select-none',
                  'transition-[background-color,border-color,color] duration-(--dur-fast) ease-glide',
                  'border-slate-500 bg-white text-ink-900 hover:border-blue-600',
                  'has-checked:border-blue-600 has-checked:bg-blue-600 has-checked:text-white',
                  'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600',
                )}
              >
                <input
                  type="radio"
                  name={`${id}-region`}
                  value={o.id}
                  checked={region === o.id}
                  onChange={() => setRegion(o.id)}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <p role="status" className="mt-6 text-small font-medium text-(--surface-muted)">
        {count === 0 ? labels.empty : resultText}
      </p>

      <div className="mt-3" hidden={count === 0}>
        {children}
      </div>
    </div>
  );
}
