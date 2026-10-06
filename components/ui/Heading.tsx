import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { keepCompounds } from '@/lib/vn-wrap';

export type HeadingSize = 'display' | 'h1' | 'h2' | 'h3';

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Cấp thẻ (ngữ nghĩa). MỖI TRANG ĐÚNG MỘT level={1}. */
  level: 1 | 2 | 3 | 4;
  /** Cỡ hiển thị theo token (docs/03 mục 11.2). Mặc định theo level. */
  size?: HeadingSize;
  children: ReactNode;
};

const DEFAULT_SIZE: Record<HeadingProps['level'], HeadingSize> = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h3' };

const SIZE_CLASS: Record<HeadingSize, string> = {
  // 700 → token --font-display (cùng bộ font hệ thống, D-32)
  display: 'font-display text-display',
  h1: 'font-display text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
};

/** Chuỗi con giữ từ ghép tiếng Việt cùng dòng (lib/vn-wrap.ts); phần tử React giữ nguyên. */
function wrapText(children: ReactNode): ReactNode {
  if (typeof children === 'string') return keepCompounds(children);
  if (Array.isArray(children)) return children.map((c: ReactNode) => (typeof c === 'string' ? keepCompounds(c) : c));
  return children;
}

/**
 * Tiêu đề dùng token chữ; màu theo tông bề mặt (navy → trắng). Chữ đi qua keepCompounds (NBSP giữa âm tiết của từ ghép)
 * để `text-wrap: balance` không ngắt "thu | nhập", "lắp | đặt".
 * CHỈ dùng trong Server Component (từ điển từ ghép không vào JS tải đầu) — client component viết thẻ h với class tương ứng.
 */
export function Heading({ level, size, className, children, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag className={cn(SIZE_CLASS[size ?? DEFAULT_SIZE[level]], 'text-(--surface-heading)', className)} {...rest}>
      {wrapText(children)}
    </Tag>
  );
}
