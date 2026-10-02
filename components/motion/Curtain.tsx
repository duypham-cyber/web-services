import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CurtainProps = HTMLAttributes<HTMLDivElement> & {
  /** Thường là một <Image>/<picture>/<img> phủ kín khung. */
  children: ReactNode;
};

/**
 * `curtain` (docs/03 mục 12.2): ảnh vén từ dưới lên bằng clip-path inset(100% 0 0 0) → 0, kèm scale 1,05 → 1,
 * 880 ms ease-entry. Reduced-motion/không JS: ảnh hiện ngay. Không dùng cho poster/LCP.
 * Khung tự clip (overflow-hidden) nên không gây tràn ngang; bo `lg` như mọi ảnh.
 */
export function Curtain({ className, children, ...rest }: CurtainProps) {
  // IntersectionObserver quan sát khung ngoài; clip-path đặt ở lớp trong (phần tử bị clip 100% sẽ không bao giờ
  // được IO báo là "đang giao" trên Chrome).
  return (
    <div data-motion-item="curtain" className={cn('overflow-hidden rounded-lg', className)} {...rest}>
      <div data-curtain-mask="" className="size-full">
        {children}
      </div>
    </div>
  );
}
