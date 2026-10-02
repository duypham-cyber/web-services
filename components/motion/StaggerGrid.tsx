import { Children, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type StaggerGridProps = {
  /** ul/ol cho danh sách có nghĩa (card dịch vụ, bước), div cho lưới trình bày. */
  as?: 'ul' | 'ol' | 'div';
  /** Class lưới, vd "grid gap-6 md:grid-cols-2 lg:grid-cols-4". */
  className?: string;
  itemClassName?: string;
  children: ReactNode;
};

/**
 * `stagger-grid` (docs/03 mục 12.2): mỗi phần tử con `rise` lần lượt, trễ --i × 60 ms.
 * Server Component: chỉ gắn data-motion-item + biến --i; MotionRuntime lo phần còn lại.
 */
export function StaggerGrid({ as = 'div', className, itemClassName, children }: StaggerGridProps) {
  const Tag = as;
  const ItemTag = as === 'div' ? 'div' : 'li';
  return (
    <Tag className={cn(className)}>
      {Children.toArray(children).map((child, i) => (
        <ItemTag key={i} data-motion-item="rise" className={itemClassName} style={{ '--i': i } as CSSProperties}>
          {child}
        </ItemTag>
      ))}
    </Tag>
  );
}
