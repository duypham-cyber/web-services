import type { ElementType, HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type ContainerSize = 'content' | 'bleed' | 'text';

type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  /** content = 1280px (mặc định) · bleed = 1440px (dải full-bleed) · text = 720px (đoạn văn, bài viết) */
  size?: ContainerSize;
};

const MAX_WIDTH: Record<ContainerSize, string> = {
  content: 'max-w-content',
  bleed: 'max-w-bleed',
  text: 'max-w-text',
};

/**
 * Khung nội dung: căn giữa, lề hai bên clamp(16px, 4vw, 64px) — đúng 16px ở 360–390px (docs/03 mục 11.3).
 * box-content: bề rộng nội dung tối đa đúng 1280px, lề nằm ngoài. KHÔNG thêm w-full (sẽ tràn ngang).
 */
export function Container({ as: Tag = 'div', size = 'content', className, ...rest }: ContainerProps) {
  return <Tag className={cn('mx-auto box-content px-gutter', MAX_WIDTH[size], className)} {...rest} />;
}
