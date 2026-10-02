import Image from 'next/image';
import type { CSSProperties, ElementType } from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { isDraftPreview } from '@/lib/env';
import { HomeIllustration, type IllustrationName } from './illustrations';

const RATIO = {
  '16/10': 'aspect-[16/10]',
  '16/9': 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '1/1': 'aspect-square',
} as const;

export type MediaRatio = keyof typeof RATIO;

/** Ảnh thật: đường dẫn trong public/ (vd "/images/news/...") + kích thước gốc. alt="" khi ảnh chỉ minh họa cho chữ bên cạnh. */
export type MediaImage = { src: string; width: number; height: number; alt: string };

type MediaFrameProps = {
  ratio?: MediaRatio;
  /** Ảnh thật — có thì luôn ưu tiên. */
  image?: MediaImage | null;
  /** Minh họa SVG giữ chỗ (docs/03 mục 11.4: thiết bị cách điệu, không logo). */
  illustration?: IllustrationName;
  /** Hoặc icon Lucide giữ chỗ trên nền token. */
  icon?: ElementType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>;
  /** Nhãn "Ảnh thật sẽ chụp" — CHỈ hiện ở bản xem trước (DRAFT_PREVIEW=1), khi đang dùng ảnh giữ chỗ. */
  pendingLabel?: string;
  /** Thuộc tính sizes của ảnh thật (responsive). */
  sizes?: string;
  /** Khung tự bo góc `lg`; đặt false khi nằm trong Card đã bo và cắt sẵn. */
  rounded?: boolean;
  className?: string;
};

const DOTS: CSSProperties = {
  backgroundImage: 'radial-gradient(var(--color-blue-100) 1.3px, transparent 1.3px)',
  backgroundSize: '16px 16px',
};

/**
 * KHUNG ẢNH CHUNG của trang chủ — một chỗ để thay ảnh thật sau này (truyền `image`), không phải sửa section.
 * Chưa có ảnh thật: giữ ĐÚNG tỉ lệ khung, hiện minh họa SVG hoặc icon trên nền token; bản xem trước gắn nhãn
 * "Ảnh thật sẽ chụp". Không dùng stock lạc đề, không KHANG (docs/03 mục 11.4, docs/DECISIONS.md D-03).
 */
export function MediaFrame({
  ratio = '16/10',
  image,
  illustration,
  icon: Icon,
  pendingLabel,
  sizes = '(min-width: 1024px) 33vw, 100vw',
  rounded = true,
  className,
}: MediaFrameProps) {
  const showPending = !image && Boolean(pendingLabel) && isDraftPreview();
  return (
    <div className={cn('relative w-full overflow-hidden bg-blue-50', RATIO[ratio], rounded && 'rounded-lg', className)}>
      {image ? (
        <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes={sizes} className="size-full object-cover" />
      ) : illustration ? (
        <HomeIllustration name={illustration} />
      ) : Icon ? (
        <div className="flex size-full items-center justify-center" style={DOTS}>
          <span className="inline-flex size-16 items-center justify-center rounded-lg bg-white text-blue-600 shadow-1">
            <Icon aria-hidden="true" size={30} strokeWidth={1.5} />
          </span>
        </div>
      ) : null}
      {showPending ? (
        <Badge variant="draft" className="absolute left-3 top-3">
          {pendingLabel}
        </Badge>
      ) : null}
    </div>
  );
}
