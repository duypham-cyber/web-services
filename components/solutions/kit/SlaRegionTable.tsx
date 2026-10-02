import type { ReactNode } from 'react';
import { DraftBadge } from '@/components/ui/DraftBadge';
import type { ClaimId } from '@/content/claims';
import type { Locale } from '@/i18n/routing';
import { claim } from '@/lib/claims';
import { cn } from '@/lib/cn';

export const SLA_REGIONS = ['inner', 'outer', 'provinces', 'special'] as const;
export type SlaRegion = (typeof SLA_REGIONS)[number];
export const SLA_MILESTONES = ['confirm', 'completion', 'fix'] as const;
export type SlaMilestone = (typeof SLA_MILESTONES)[number];

/**
 * Ma trận SLA theo vùng: mỗi ô là MỘT câu khẳng định (content/claims/b2b.ts) → production chỉ hiện ô đã duyệt.
 * Nguồn các ô: chính sách hiện hành Phần 1, 3, 4 và trang /services cũ (chi tiết trong từng claim).
 * Khi anh Duy chốt SLA: duyệt claim tương ứng (hoặc đổi id ở đây) — không sửa component.
 * Đề xuất nền móng: gộp vào content/sla.ts (thêm trường theo vùng) khi chốt cấu trúc SLA.
 */
export const SLA_MATRIX = {
  confirm: {
    inner: 'b2b.sla.confirm-60-minutes',
    outer: 'b2b.sla.confirm-60-minutes',
    provinces: 'b2b.sla.confirm-60-minutes',
    special: 'b2b.sla.special-areas-case-by-case',
  },
  completion: {
    inner: 'b2b.sla.completion-48-hours',
    outer: 'b2b.sla.completion-48-hours',
    provinces: 'b2b.sla.completion-48-hours',
    special: 'b2b.sla.special-areas-case-by-case',
  },
  fix: {
    inner: 'b2b.sla.fix-24-business-hours',
    outer: 'b2b.sla.fix-36-business-hours',
    provinces: 'b2b.sla.fix-36-business-hours',
    special: 'b2b.sla.special-areas-case-by-case',
  },
} as const satisfies Record<SlaMilestone, Record<SlaRegion, ClaimId>>;

type SlaRegionTableProps = {
  locale: Locale;
  caption: string;
  milestoneLabel: string;
  regions: Record<SlaRegion, string>;
  milestones: Record<SlaMilestone, { label: string; hint: string }>;
  /** Chữ cho ô chưa có cam kết được hiện (vd "Theo hợp đồng"). */
  emptyCell: string;
  /** Câu giải thích khi có ô nháp (chỉ bản xem trước). */
  draftCaption: string;
  /** Khối thay thế khi KHÔNG có ô nào được hiện (production trước khi duyệt). */
  fallback: ReactNode;
  className?: string;
};

export function SlaRegionTable({
  locale,
  caption,
  milestoneLabel,
  regions,
  milestones,
  emptyCell,
  draftCaption,
  fallback,
  className,
}: SlaRegionTableProps) {
  const cells = SLA_MILESTONES.map((m) => ({
    milestone: m,
    values: SLA_REGIONS.map((r) => ({ region: r, value: claim(SLA_MATRIX[m][r], locale) })),
  }));
  const anyVisible = cells.some((row) => row.values.some((v) => v.value !== null));
  if (!anyVisible) return <>{fallback}</>;
  const anyDraft = cells.some((row) => row.values.some((v) => v.value?.draft));

  return (
    <div className={className}>
      {anyDraft ? (
        <p className="mb-4 flex flex-wrap items-center gap-2 text-small text-(--surface-muted)">
          <DraftBadge />
          <span>{draftCaption}</span>
        </p>
      ) : null}
      <div className="md:overflow-clip md:rounded-lg md:border md:border-slate-300 md:bg-white md:shadow-1">
        <table role="table" className="w-full border-collapse text-left max-md:block md:table-fixed">
          <caption className="sr-only">{caption}</caption>
          <thead role="rowgroup" className="max-md:sr-only">
            <tr role="row" className="bg-navy-900 text-white">
              <th role="columnheader" scope="col" className="w-[24%] px-5 py-4 align-bottom text-small font-semibold">
                {milestoneLabel}
              </th>
              {SLA_REGIONS.map((r) => (
                <th key={r} role="columnheader" scope="col" className="px-5 py-4 align-bottom text-small font-semibold">
                  {regions[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup" className="max-md:flex max-md:flex-col max-md:gap-4">
            {cells.map((row) => (
              <tr
                key={row.milestone}
                role="row"
                className="border-t border-slate-300 first:border-t-0 max-md:flex max-md:flex-col max-md:overflow-clip max-md:rounded-lg max-md:border max-md:bg-white max-md:shadow-1"
              >
                <th
                  role="rowheader"
                  scope="row"
                  className="px-5 py-4 align-top max-md:border-b max-md:border-slate-300 max-md:bg-blue-50"
                >
                  <span className="block text-body font-semibold text-navy-900">{milestones[row.milestone].label}</span>
                  <span className="mt-0.5 block text-small font-normal text-slate-600">{milestones[row.milestone].hint}</span>
                </th>
                {row.values.map(({ region, value }) => (
                  <td
                    key={region}
                    role="cell"
                    className="px-5 py-4 align-top max-md:flex max-md:items-baseline max-md:justify-between max-md:gap-4 max-md:border-b max-md:border-slate-300 max-md:py-3 max-md:last:border-b-0"
                  >
                    <span aria-hidden="true" className="text-small text-slate-600 md:hidden">
                      {regions[region]}
                    </span>
                    <span
                      className={cn(
                        'tabular max-md:shrink-0 max-md:whitespace-nowrap max-md:text-right',
                        value ? 'text-body font-semibold text-navy-900' : 'text-small text-slate-600',
                        value?.draft && 'underline decoration-warning-text decoration-dashed underline-offset-4',
                      )}
                    >
                      {value ? value.text : emptyCell}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
