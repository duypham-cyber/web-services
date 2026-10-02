import type { ReactNode } from 'react';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { slaItems } from '@/content/sla';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';

/** Hạng mục bảo hành trong content/sla.ts dùng cho "bảng SLA chung" của trang dịch vụ (docs/03 mục 13.5). */
export const WARRANTY_SLA_IDS = [
  'warranty-new-installation',
  'warranty-repair',
  'warranty-cleaning',
  'warranty-registration-window',
  'fix-response-time',
] as const;

type WarrantyTableProps = {
  locale: Locale;
  caption: string;
  itemLabel: string;
  valueLabel: string;
  /** Đầu cột giá trị ở bản xem trước (đang ghi theo chính sách cũ). */
  pendingValueLabel: string;
  draftCaption: string;
  /** Khối thay thế khi chưa có giá trị nào được duyệt (production). */
  fallback: ReactNode;
};

/**
 * Bảng SLA bảo hành dùng chung cho 4 trang dịch vụ, đọc content/sla.ts:
 *   - production: chỉ dòng status "approved" (value); chưa có dòng nào → `fallback` (link chính sách bảo hành);
 *   - DRAFT_PREVIEW: dòng chưa duyệt hiện cột "đang ghi" (current) kèm nhãn Nháp để anh Duy đối chiếu — KHÔNG phải cam kết.
 */
export function WarrantyTable({ locale, caption, itemLabel, valueLabel, pendingValueLabel, draftCaption, fallback }: WarrantyTableProps) {
  const preview = isDraftPreview();
  const rows = WARRANTY_SLA_IDS.flatMap((id) => {
    const item = slaItems.find((s) => s.id === id);
    if (!item) return [];
    if (item.status === 'approved' && item.value) return [{ id, label: item.label[locale], text: item.value[locale], draft: false }];
    if (preview) return [{ id, label: item.label[locale], text: item.current[locale], draft: true }];
    return [];
  });
  if (rows.length === 0) return <>{fallback}</>;
  const anyDraft = rows.some((r) => r.draft);

  return (
    <div>
      {anyDraft ? (
        <p className="mb-4 flex flex-wrap items-center gap-2 text-small text-(--surface-muted)">
          <DraftBadge />
          <span>{draftCaption}</span>
        </p>
      ) : null}
      <div className="overflow-clip rounded-lg border border-slate-300 bg-white shadow-1">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-blue-50">
              <th scope="col" className="w-2/5 px-5 py-3 text-small font-semibold text-slate-600">
                {itemLabel}
              </th>
              <th scope="col" className="px-5 py-3 text-small font-semibold text-slate-600">
                {anyDraft ? pendingValueLabel : valueLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-300 align-top">
                <th scope="row" className="px-5 py-4 text-small font-semibold text-navy-900 md:text-body">
                  {r.label}
                </th>
                <td className="px-5 py-4 text-small text-ink-900 md:text-body">{r.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
