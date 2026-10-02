import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'info' | 'warranty' | 'success' | 'danger' | 'draft' | 'illustration';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

const VARIANT: Record<BadgeVariant, string> = {
  info: 'bg-blue-100 text-blue-600 border-blue-100', // 7,13:1
  warranty: 'bg-orange-50 text-orange-700 border-orange-50', // 5,09:1 — nền badge "Bảo hành" (11.1)
  success: 'bg-white text-success-700 border-success-700', // 5,38:1
  danger: 'bg-white text-danger-700 border-danger-700', // 6,54:1
  // "Nháp": nội dung chưa duyệt, chỉ hiện ở bản xem trước (DRAFT_PREVIEW=1). Viền đứt để khác badge thật.
  draft: 'bg-orange-50 text-warning-text border-warning-text border-dashed', // 5,47:1
  // "Minh họa": số liệu/giao diện minh họa (màn hình trong cảnh, số mẫu)
  illustration: 'bg-white text-slate-600 border-slate-500', // 7,58:1
};

/** Nhãn trạng thái dạng viên thuốc, chữ nhỏ 12px đậm. */
export function Badge({ variant = 'info', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-pill border px-2 py-0.5 align-middle text-eyebrow font-semibold tracking-normal normal-case',
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
