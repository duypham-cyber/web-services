import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { IllustrativeLabel } from '@/components/media/Photo';
import { Badge } from '@/components/ui/Badge';
import type { ImageAsset } from '@/content/articles/types';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

type MediaFrameProps = {
  /** Ảnh trong public/. null → bìa dựng từ token đúng tỉ lệ (chưa có ảnh đạt). */
  image: ImageAsset | null;
  locale: Locale;
  /** Tỉ lệ khung CSS, vd "16 / 9". Mặc định: tỉ lệ thật của ảnh; bìa token: 16 / 9. */
  ratio?: string;
  /** Thuộc tính sizes của next/image (bắt buộc với ảnh fill để tải đúng cỡ). */
  sizes: string;
  /** Ảnh LCP (ảnh đầu bài): tải ngay, ưu tiên cao. Mỗi trang tối đa 1 ảnh (AC-PERF-3). */
  priority?: boolean;
  /** Icon Lucide cho bìa token. */
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
 *  - Có ảnh: next/image (AVIF/WebP, đúng cỡ theo `sizes`), `fit` cover (ảnh chụp) hoặc contain (infographic). Ảnh chụp
 *    phủ một lớp navy-900 10% để các ảnh bài thành một họ ảnh (docs/03 mục 11.4). Ảnh minh họa AI/stock
 *    (`illustrative`) có nhãn "Ảnh minh họa" (D-31).
 *  - Không có ảnh (CHỈ thẻ bài — trang bài không dựng khung khi hero = null): bìa dựng từ token (nền blue-600, vệt sáng
 *    blue-300, tia chớp nét blue-300, icon của bài), aria-hidden, không chữ trong ảnh. Không còn "khung giữ chỗ" lưới.
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
      <div aria-hidden="true" className={cn(frame, 'bg-blue-600')} style={{ aspectRatio: ratio ?? '16 / 9' }}>
        <div className="absolute -right-16 -top-20 size-72 rounded-pill bg-[radial-gradient(circle,var(--color-blue-300)_0%,transparent_70%)] opacity-40" />
        <svg viewBox="0 0 120 200" className="absolute -bottom-6 right-[8%] h-[115%] w-auto text-blue-300 opacity-25">
          <path d="M72 4 L20 112 H58 L44 196 L104 76 H64 Z" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
        </svg>
        <span className="absolute bottom-5 left-5 flex size-14 items-center justify-center rounded-md border border-blue-300/50 bg-blue-700/70 md:bottom-6 md:left-6 md:size-16">
          <Icon size={30} strokeWidth={1.5} className="text-blue-300" />
        </span>
        {previewNote ? (
          <span className="absolute left-3 top-3">
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
      {fit === 'cover' ? <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-navy-900/10" /> : null}
      {image.illustrative ? <IllustrativeLabel /> : null}
    </div>
  );
}
