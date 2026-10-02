'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';

export type PriceTableRegion = { key: string; label: string };

export type PriceTableRow = {
  id: string;
  label: string;
  /** Giá trị lọc thiết bị ('9000', '12000'…), 'unknown' = nguồn không ghi công suất (luôn hiện kèm ghi chú). */
  capacityKey: string;
  capacityLabel: string;
  unknownCapacity: boolean;
  unitLabel: string;
  /** Giá đã định dạng theo ngôn ngữ, theo khóa vùng. */
  prices: Record<string, string>;
};

export type PriceTableLabels = {
  legend: string;
  device: string;
  region: string;
  /** Mẫu "Đang hiện {shown} trên {total} dòng" (thay biến ở client). */
  countTemplate: string;
  reset: string;
  empty: string;
  caption: string;
  item: string;
  capacity: string;
  unit: string;
  footnoteUnknown: string;
  unknownIncluded: string;
};

type PriceTableProps = {
  rows: PriceTableRow[];
  regions: PriceTableRegion[];
  deviceOptions: { value: string; label: string }[];
  regionOptions: { value: string; label: string }[];
  labels: PriceTableLabels;
};

const CHIP =
  'inline-flex min-h-11 cursor-pointer select-none items-center rounded-pill border border-slate-500 bg-white px-4 text-small font-medium text-navy-900 ' +
  'transition-colors duration-(--dur-fast) ease-glide hover:border-blue-600 hover:bg-blue-50 ' +
  'peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white ' +
  'peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600 peer-focus-visible:outline-solid';

function ChipGroup({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-small font-semibold text-navy-900">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="relative inline-flex">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span className={CHIP}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Bảng khung giá vật tư có lọc theo thiết bị (công suất máy) và vùng — /bang-gia (docs/03 mục 13.5).
 * Server render ĐỦ bảng (trạng thái mặc định "Tất cả"), lọc ở client: không JS vẫn đọc đủ mọi dòng.
 * KHÔNG animate giá (docs/03 mục 12.2 luật 3). Số dòng sau khi lọc đọc qua aria-live.
 * Bảng là một <table> cho mọi bề rộng: < 768px mỗi dòng thành thẻ có giá 2 × 2 (không cuộn ngang).
 */
export function PriceTable({ rows, regions, deviceOptions, regionOptions, labels }: PriceTableProps) {
  const uid = useId();
  const [device, setDevice] = useState('all');
  const [region, setRegion] = useState('all');

  const visibleRows = rows.filter((r) => device === 'all' || r.capacityKey === device || r.unknownCapacity);
  const visibleRegions = region === 'all' ? regions : regions.filter((r) => r.key === region);
  const singleRegion = visibleRegions.length === 1;
  const filtered = device !== 'all' || region !== 'all';
  const countText = labels.countTemplate.replace('{shown}', String(visibleRows.length)).replace('{total}', String(rows.length));
  const showFootnote = visibleRows.some((r) => r.unknownCapacity);

  return (
    <div>
      <div role="group" aria-label={labels.legend} className="flex flex-col gap-6 rounded-lg border border-slate-300 bg-white p-5 shadow-1 md:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:gap-10">
          <ChipGroup name={`${uid}-device`} legend={labels.device} options={deviceOptions} value={device} onChange={setDevice} />
          <ChipGroup name={`${uid}-region`} legend={labels.region} options={regionOptions} value={region} onChange={setRegion} />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <p aria-live="polite" className="text-small text-slate-600 tabular">
            {countText}
          </p>
          {filtered ? (
            <button
              type="button"
              onClick={() => {
                setDevice('all');
                setRegion('all');
              }}
              className="inline-flex min-h-11 items-center rounded-pill px-3 text-small font-semibold text-blue-600 underline-offset-4 hover:underline"
            >
              {labels.reset}
            </button>
          ) : null}
        </div>
      </div>
      {device !== 'all' ? <p className="mt-3 text-small text-slate-600">{labels.unknownIncluded}</p> : null}

      <div className="mt-6 md:overflow-clip md:rounded-lg md:border md:border-slate-300 md:bg-white md:shadow-1">
        <table role="table" className="w-full border-collapse text-left max-md:block">
          <caption className="sr-only">{labels.caption}</caption>
          <thead role="rowgroup" className="max-md:sr-only">
            <tr role="row" className="bg-navy-900 text-white">
              <th role="columnheader" scope="col" className="px-5 py-4 text-small font-semibold">
                {labels.item}
              </th>
              <th role="columnheader" scope="col" className="px-5 py-4 text-small font-semibold">
                {labels.capacity}
              </th>
              <th role="columnheader" scope="col" className="px-5 py-4 text-small font-semibold">
                {labels.unit}
              </th>
              {visibleRegions.map((r) => (
                <th key={r.key} role="columnheader" scope="col" className="px-5 py-4 text-right text-small font-semibold">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup" className="max-md:flex max-md:flex-col max-md:gap-4">
            {visibleRows.length === 0 ? (
              <tr role="row">
                <td role="cell" colSpan={3 + visibleRegions.length} className="px-5 py-8 text-center text-body text-slate-600">
                  {labels.empty}
                </td>
              </tr>
            ) : (
              visibleRows.map((r) => (
                <tr
                  key={r.id}
                  role="row"
                  className={cn(
                    'border-t border-slate-300 first:border-t-0 md:even:bg-blue-50',
                    'max-md:grid max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3 max-md:rounded-lg max-md:border max-md:bg-white max-md:p-4 max-md:shadow-1',
                  )}
                >
                  <th role="rowheader" scope="row" className="px-5 py-4 align-middle text-body font-semibold text-navy-900 max-md:col-span-2 max-md:p-0">
                    {r.label}
                  </th>
                  <td role="cell" className="px-5 py-4 align-middle text-small text-ink-900 max-md:col-span-2 max-md:p-0">
                    <span aria-hidden="true" className="text-slate-600 md:hidden">
                      {labels.capacity}:{' '}
                    </span>
                    <span className={cn('tabular', r.unknownCapacity && 'text-slate-600')}>{r.capacityLabel}</span>
                    {r.unknownCapacity ? (
                      <span aria-hidden="true" className="ml-0.5 text-warning-text">
                        *
                      </span>
                    ) : null}
                  </td>
                  <td role="cell" className="px-5 py-4 align-middle text-small text-slate-600 max-md:hidden">
                    {r.unitLabel}
                  </td>
                  {visibleRegions.map((reg) => (
                    <td
                      key={reg.key}
                      role="cell"
                      className={cn(
                        'px-5 py-4 text-right align-middle max-md:flex max-md:flex-col max-md:items-start max-md:gap-0.5 max-md:rounded-md max-md:bg-blue-50 max-md:px-3 max-md:py-2 max-md:text-left',
                        singleRegion && 'max-md:col-span-2',
                      )}
                    >
                      <span aria-hidden="true" className="text-eyebrow font-semibold tracking-normal text-slate-600 md:hidden">
                        {reg.label}
                      </span>
                      <span className="text-body font-semibold text-navy-900 tabular">{r.prices[reg.key]}</span>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showFootnote ? (
        <p className="mt-3 text-small text-slate-600">
          <span aria-hidden="true" className="text-warning-text">
            *{' '}
          </span>
          {labels.footnoteUnknown}
        </p>
      ) : null}
    </div>
  );
}
