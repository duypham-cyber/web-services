import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ProseProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode };

/**
 * Khối văn bản dài: bài viết /kien-thuc/*, 3 trang pháp lý. Định dạng h2/h3/p/ul/ol/table/blockquote/a
 * nằm ở `.prose-bb` (app/globals.css), bề rộng tối đa 720px. KHÔNG animate nội dung pháp lý.
 */
export function Prose({ className, children, ...rest }: ProseProps) {
  return (
    <div className={cn('prose-bb', className)} {...rest}>
      {children}
    </div>
  );
}
