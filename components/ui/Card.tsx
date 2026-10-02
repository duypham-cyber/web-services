import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CardTone = 'white' | 'blue-50' | 'navy';

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  tone?: CardTone;
  /** md = 24px · lg = 32px (desktop) · none = tự lo (vd ảnh tràn mép) */
  padding?: 'md' | 'lg' | 'none';
  /** Nổi bóng khi hover (card có link bao trùm). Chỉ đổi box-shadow. */
  interactive?: boolean;
  children: ReactNode;
};

const TONE: Record<CardTone, { cls: string; dataTone: 'light' | 'blue-50' | 'navy' }> = {
  white: { cls: 'bg-white border border-slate-300', dataTone: 'light' },
  'blue-50': { cls: 'bg-blue-50 border border-blue-100', dataTone: 'blue-50' },
  navy: { cls: 'bg-navy-900 border border-navy-900', dataTone: 'navy' },
};

const PADDING = { md: 'p-6', lg: 'p-6 md:p-8', none: '' } as const;

/**
 * Thẻ nội dung bo `lg` (20px) — ảnh và card bo cùng `lg` (docs/03 mục 11.3).
 * Card cả khối bấm được: đặt link chính bên trong với class "after:absolute after:inset-0" và card `relative`.
 */
export function Card({ as: Tag = 'div', tone = 'white', padding = 'md', interactive, className, children, ...rest }: CardProps) {
  const t = TONE[tone];
  return (
    <Tag
      data-tone={t.dataTone}
      className={cn(
        'relative rounded-lg shadow-1',
        t.cls,
        PADDING[padding],
        interactive && 'transition-shadow duration-(--dur-base) ease-glide hover:shadow-2 focus-within:shadow-2',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
