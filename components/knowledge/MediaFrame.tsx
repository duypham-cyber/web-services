import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import type { ImageAsset } from '@/content/articles/types';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

type MediaFrameProps = {
  /** Ảnh trong public/. null → khung giữ chỗ đúng tỉ lệ (chưa có ảnh thật). */
  image: ImageAsset | null;
  locale: Locale;
  /** Tỉ lệ khung CSS, vd "16 / 9". Mặc định: tỉ lệ thật của ảnh; khung giữ chỗ: 16 / 9. */
  ratio?: string;
  /** Thuộc tính sizes của next/image (bắt buộc với ảnh fill để tải đúng cỡ). */
  sizes: string;
  /** Ảnh LCP (ảnh đầu bài): tải ngay, ưu tiên cao. Mỗi trang tối đa 1 ảnh (AC-PERF-3). */
  priority?: boolean;
  /** Icon Lucide cho khung giữ chỗ. */
  placeholderIcon: LucideIcon;
  /** Ghi chú "ảnh thật sẽ chụp" — CHỈ truyền khi DRAFT_PREVIEW (trang quyết định), production để null. */
  previewNote?: string | null;
  /** Bo góc lg (mặc định) hoặc không bo (ảnh tràn mép trong card). */
  rounded?: boolean;
  className?: string;
};

/**
 * Khung ảnh chung của khu vực Kiến thức (thẻ bài, ảnh đầu bài, ảnh trong bài). Thay ảnh thật sau này = đổi `src`
 * trong content/articles/<key>.ts, không sửa component.
 *  - Có ảnh: next/image (AVIF/WebP, đúng cỡ theo `sizes`), `fit` cover (ảnh chụp) hoặc contain (infographic).
 *  - Không có ảnh: nền token + họa tiết lưới + icon Lucide, aria-hidden (trang trí), không chữ trong ảnh.
 */
export function MediaFrame({
  image,
  locale,
  ratio,
  sizes,
  priority,
  placeholderIcon: Icon,
  previewNote,
  rounded = true,
  className,
}: MediaFrameProps) {
  const frame = cn('relative w-full overflow-clip', rounded && 'rounded-lg', className);

  if (!image) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          frame,
          'border border-blue-100 bg-blue-50 bg-size-[24px_24px]',
          'bg-[linear-gradient(to_right,var(--color-blue-100)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-blue-100)_1px,transparent_1px)]',
        )}
        style={{ aspectRatio: ratio ?? '16 / 9' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-16 items-center justify-center rounded-pill bg-white shadow-1 md:size-20">
            <Icon size={32} strokeWidth={1.5} className="text-blue-600" />
          </span>
        </div>
        {previewNote ? (
          <span className="absolute bottom-3 left-3">
            <Badge variant="illustration">{previewNote}</Badge>
          </span>
        ) : null}
      </div>
    );
  }

  const fit = image.fit ?? 'cover';
  return (
    <div
      className={cn(frame, fit === 'contain' ? 'border border-slate-300 bg-white' : 'bg-blue-50')}
      style={{ aspectRatio: ratio ?? `${image.width} / ${image.height}` }}
    >
      <Image
        src={image.src}
        alt={image.alt[locale]}
        fill
        sizes={sizes}
        {...(priority ? { preload: true } : {})}
        className={fit === 'contain' ? 'object-contain p-2' : 'object-cover'}
      />
    </div>
  );
}
