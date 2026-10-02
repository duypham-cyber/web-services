import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type EyebrowProps = HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'div';
  children: ReactNode;
};

/**
 * Nhãn section ≤ 4 từ, VIẾT HOA, tracking 0.14em — chỗ duy nhất được viết hoa (docs/03 mục 11.2).
 * Màu: orange-700 trên nền sáng, orange-200 trên navy (tự theo data-tone).
 */
export function Eyebrow({ as: Tag = 'p', className, children, ...rest }: EyebrowProps) {
  return (
    <Tag className={cn('eyebrow text-(--surface-accent)', className)} {...rest}>
      {children}
    </Tag>
  );
}
