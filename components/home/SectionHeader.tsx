import type { ReactNode } from 'react';
import { Rise } from '@/components/motion/Rise';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { cn } from '@/lib/cn';

type SectionHeaderProps = {
  /** id của H2 — Section dùng aria-labelledby trỏ tới. */
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  /** Link phụ bên phải (≥ 1024px), vd "Xem tất cả dịch vụ →". Trên mobile nằm dưới đoạn dẫn. */
  action?: ReactNode;
  className?: string;
};

/**
 * Đầu section dùng chung của trang chủ: eyebrow (≤ 4 từ) → H2 → đoạn dẫn, motion `rise` (docs/03 mục 12.2).
 * Mọi section sau phim dùng H2 (H1 duy nhất ở FilmHero).
 */
export function SectionHeader({ id, eyebrow, title, lead, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16', className)}>
      <Rise className="max-w-[46rem]">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading level={2} id={id} className="mt-3">
          {title}
        </Heading>
        {lead ? <p className="mt-5 text-lead text-(--surface-muted)">{lead}</p> : null}
      </Rise>
      {action ? <Rise className="flex shrink-0 flex-wrap items-center gap-x-8 gap-y-3 lg:pb-2">{action}</Rise> : null}
    </div>
  );
}
