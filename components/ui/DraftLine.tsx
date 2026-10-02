import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { isDraftPreview } from '@/lib/env';
import { DraftBadge } from './DraftBadge';

type DraftLineProps = {
  /** Tên khối đang chờ (đậm), vd "Logo hãng & sàn". */
  label?: ReactNode;
  /** Điều kiện để bật / việc đang chờ — một câu ngắn. */
  children: ReactNode;
  className?: string;
};

/**
 * Ghi chú MỘT DÒNG cho người duyệt, CHỈ ở bản xem trước (DRAFT_PREVIEW=1), kèm nhãn "Nháp" — thay cho khung giữ chỗ
 * nét đứt cỡ lớn (logo, bằng chứng, case study, mốc phát triển...). Production: null (không có gì trong HTML).
 * Màu chữ theo tông của Section chứa nó (--surface-*), dùng được trên nền sáng và navy.
 */
export function DraftLine({ label, children, className }: DraftLineProps) {
  if (!isDraftPreview()) return null;
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-(--surface-muted)', className)}>
      <DraftBadge />
      {label ? <span className="font-semibold text-(--surface-fg)">{label}</span> : null}
      <span>{children}</span>
    </p>
  );
}
