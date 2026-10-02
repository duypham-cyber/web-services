import type { ReactNode } from 'react';
import { DraftBadge } from '@/components/ui/DraftBadge';
import type { ClaimText } from '@/lib/claims';
import { cn } from '@/lib/cn';
import { isDraftPreview } from '@/lib/env';

/**
 * Ghi chú cho người duyệt (anh Duy, pháp chế, vận hành): CHỈ render khi DRAFT_PREVIEW=1, viền đứt + nhãn "Nháp".
 * Dùng cho: chỗ chờ số liệu, form chờ contract, mâu thuẫn cần chốt. Production không có gì trong HTML.
 */
export async function DraftNote({ children, className }: { children: ReactNode; className?: string }) {
  if (!isDraftPreview()) return null;
  return (
    <div
      className={cn(
        'flex flex-wrap items-start gap-x-3 gap-y-2 rounded-md border border-dashed border-warning-text bg-orange-50 px-4 py-3 text-small text-ink-900',
        className,
      )}
    >
      <DraftBadge className="mt-0.5" />
      <div className="min-w-0 flex-1 basis-60">{children}</div>
    </div>
  );
}

/**
 * Một câu khẳng định (đã qua `claim(id, locale)`): chữ + nhãn "Nháp" nếu đang là nháp. null → không render.
 *   <ClaimLine c={claim('partner.payout-per-job', locale)} />
 */
export async function ClaimLine({
  c,
  as: Tag = 'p',
  className,
}: {
  c: ClaimText | null;
  as?: 'p' | 'span' | 'li' | 'div';
  className?: string;
}) {
  if (!c) return null;
  return (
    <Tag className={className}>
      {c.text}
      {c.draft ? (
        <>
          {' '}
          <DraftBadge />
        </>
      ) : null}
    </Tag>
  );
}
