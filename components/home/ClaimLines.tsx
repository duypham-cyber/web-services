import { BadgeCheck } from 'lucide-react';
import { DraftBadge } from '@/components/ui/DraftBadge';
import type { ClaimId } from '@/content/claims';
import type { Locale } from '@/i18n/routing';
import { claim } from '@/lib/claims';
import { cn } from '@/lib/cn';

type ClaimLinesProps = {
  ids: readonly ClaimId[];
  locale: Locale;
  /** Nhãn cho trình đọc màn hình đặt trước danh sách, vd "Bằng chứng". */
  label?: string;
  className?: string;
};

/**
 * Danh sách câu khẳng định làm "bằng chứng" cho một lợi ích. CHỈ đọc qua claim() (lib/claims.ts):
 * production → chỉ câu đã duyệt; bản xem trước → cả câu nháp, kèm nhãn "Nháp". Không còn câu nào → không render gì.
 */
export function ClaimLines({ ids, locale, label, className }: ClaimLinesProps) {
  const items = ids.flatMap((id) => {
    const c = claim(id, locale);
    return c ? [{ id, ...c }] : [];
  });
  if (items.length === 0) return null;

  return (
    <div className={className}>
      {label ? <p className="sr-only">{label}</p> : null}
      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.id} className="flex gap-2 text-small text-(--surface-fg)">
            <BadgeCheck aria-hidden="true" size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-(--surface-link)" />
            <span className={cn('flex flex-wrap items-center gap-x-2 gap-y-1')}>
              <span>{c.text}</span>
              {c.draft ? <DraftBadge /> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
