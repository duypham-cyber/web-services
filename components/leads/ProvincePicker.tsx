'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { fmt } from './client-utils';
import { CheckboxRow } from './parts';
import type { ProvinceOption } from './types';

type Region = ProvinceOption['region'];
const REGIONS: readonly Region[] = ['north', 'central', 'south'];

const BOX_CHECKBOX = 'mt-0.5 size-5 shrink-0 cursor-pointer accent-blue-600';

/** Ô đánh dấu của một miền: chọn/bỏ cả miền, "một phần" khi chỉ chọn vài tỉnh (indeterminate). */
function RegionCheckbox({
  id,
  label,
  state,
  onChange,
}: {
  id: string;
  label: string;
  state: 'all' | 'some' | 'none';
  onChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'some';
  }, [state]);
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-small font-semibold text-(--surface-heading)">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={BOX_CHECKBOX}
        checked={state === 'all'}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * Tỉnh/thành triển khai (form B2B, contract mục 3.1): chọn nhiều, có "Toàn quốc" (= đủ 34 mã) và chọn theo miền.
 * fieldset + legend thật; danh sách 34 tỉnh nằm trong khung cuộn có viền (không kéo dài form trên điện thoại).
 * "Toàn quốc" rồi bỏ vài tỉnh → gửi đúng danh sách còn lại (contract mục 5).
 */
export function ProvincePicker({
  idPrefix,
  options,
  value,
  onChange,
  onBlur,
  copy,
  requiredMark,
  error,
}: {
  idPrefix: string;
  options: ProvinceOption[];
  value: string[];
  onChange: (next: string[]) => void;
  onBlur: () => void;
  copy: {
    label: string;
    hint: string;
    all: string;
    selected: string;
    regions: Record<Region, string>;
  };
  requiredMark: string;
  error?: string;
}) {
  const selected = new Set(value);
  const total = options.length;
  const allChecked = total > 0 && options.every((o) => selected.has(o.code));
  const hintId = `${idPrefix}-hint`;
  const errorId = `${idPrefix}-error`;
  const describedBy = [hintId, error ? errorId : null].filter(Boolean).join(' ');
  const allRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = !allChecked && value.length > 0;
  }, [allChecked, value.length]);

  const setMany = (codes: string[], checked: boolean) => {
    const next = new Set(selected);
    for (const c of codes) {
      if (checked) next.add(c);
      else next.delete(c);
    }
    onChange(options.map((o) => o.code).filter((c) => next.has(c)));
  };

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-2"
      aria-describedby={describedBy}
      onBlur={(e) => {
        // Chỉ khi focus rời hẳn cả nhóm
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onBlur();
      }}
    >
      <legend className="mb-1.5 text-small font-semibold text-(--surface-heading)">
        {copy.label}
        <span className="ml-1 font-normal text-(--surface-muted)">({requiredMark})</span>
      </legend>
      <p id={hintId} className="text-small text-(--surface-muted)">
        {copy.hint} <span className="tabular">{fmt(copy.selected, { count: value.length, total })}</span>
      </p>
      <div
        className={cn(
          'rounded-sm border bg-white',
          error ? 'border-2 border-danger-700' : 'border-slate-500',
        )}
      >
        <div className="border-b border-slate-300 px-3 py-2.5">
          <label htmlFor={`${idPrefix}-all`} className="flex cursor-pointer items-start gap-3 text-body font-semibold text-ink-900">
            <input
              ref={allRef}
              id={`${idPrefix}-all`}
              type="checkbox"
              className={BOX_CHECKBOX}
              checked={allChecked}
              onChange={(e) => setMany(options.map((o) => o.code), e.currentTarget.checked)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
            />
            <span>{fmt(copy.all, { total })}</span>
          </label>
        </div>
        <div className="max-h-64 overflow-y-auto px-3 py-3">
          {REGIONS.map((region) => {
            const inRegion = options.filter((o) => o.region === region);
            if (inRegion.length === 0) return null;
            const count = inRegion.filter((o) => selected.has(o.code)).length;
            const state = count === 0 ? 'none' : count === inRegion.length ? 'all' : 'some';
            return (
              <div key={region} className="mb-4 last:mb-0">
                <RegionCheckbox
                  id={`${idPrefix}-region-${region}`}
                  label={`${copy.regions[region]} (${inRegion.length})`}
                  state={state}
                  onChange={(checked) => setMany(inRegion.map((o) => o.code), checked)}
                />
                <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 pl-8 min-[420px]:grid-cols-2 lg:grid-cols-3">
                  {inRegion.map((o) => (
                    <li key={o.code}>
                      <CheckboxRow
                        id={`${idPrefix}-${o.code}`}
                        checked={selected.has(o.code)}
                        onChange={(checked) => setMany([o.code], checked)}
                        className="py-1"
                      >
                        {o.name}
                      </CheckboxRow>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      {error ? (
        <p id={errorId} className="text-small font-medium text-danger-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
