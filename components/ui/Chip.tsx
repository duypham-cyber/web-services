import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ChipVariant = 'blue' | 'orange' | 'neutral' | 'on-dark';

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: ChipVariant;
  icon?: ReactNode;
  children: ReactNode;
};

const VARIANT: Record<ChipVariant, string> = {
  blue: 'bg-blue-100 text-blue-600', // 7,13:1
  orange: 'bg-orange-50 text-orange-700', // 5,09:1
  neutral: 'bg-white text-slate-600 border border-slate-300', // 7,58:1
  'on-dark': 'bg-transparent text-blue-300 border border-blue-300', // 6,89:1 trên navy
};

/** Nhãn phân loại (thiết bị, vùng, nhóm bài viết). Bo `sm` 8px. Không phải nút: muốn lọc thì bọc trong <button>. */
export function Chip({ variant = 'blue', icon, className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-small font-medium', VARIANT[variant], className)}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
