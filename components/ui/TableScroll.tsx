import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type TableScrollProps = {
  /** BẮT BUỘC: tên vùng cho trình đọc màn hình, vd "Bảng giá vật tư". */
  label: string;
  className?: string;
  children: ReactNode;
};

/**
 * Bọc bảng rộng (bảng giá, bảng 34 tỉnh, SLA) để cuộn ngang TRONG khung trên mobile — trang không tràn ngang.
 * Vùng cuộn được focus bằng bàn phím (tabIndex 0 + role region), đạt axe "scrollable-region-focusable".
 */
export function TableScroll({ label, className, children }: TableScrollProps) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn('overflow-x-auto rounded-md border border-slate-300', className)}
    >
      {children}
    </div>
  );
}
