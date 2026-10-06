import { Photo } from '@/components/media/Photo';
import { Badge } from '@/components/ui/Badge';
import type { PhotoAsset } from '@/content/photos';
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

type MediaFrameProps = {
  ratio?: MediaRatio;
  /** Ảnh của content/photos.ts — có thì luôn ưu tiên (ảnh minh họa tự kèm nhãn "Ảnh minh họa", D-31). */
  photo?: PhotoAsset | null;
  /** Minh họa SVG giữ chỗ khi chưa có ảnh (docs/03 mục 11.4: thiết bị cách điệu, không logo, không chữ). */
  illustration: IllustrationName;
  /** Nhãn "Ảnh thật sẽ chụp" — CHỈ hiện ở bản xem trước (DRAFT_PREVIEW=1), khi đang dùng ảnh giữ chỗ. */
  pendingLabel?: string;
  /** Thuộc tính sizes của ảnh (responsive). */
  sizes?: string;
  /** Khung tự bo góc `lg`; đặt false khi nằm trong Card đã bo và cắt sẵn. */
  rounded?: boolean;
  /**
   * Hiệu ứng `curtain` (docs/03 mục 12.2): ảnh vén từ dưới lên khi vào khung nhìn — dùng chung bộ máy motion của
   * nền móng (thuộc tính data, MotionRuntime + CSS ở app/globals.css). Reduced-motion/không JS: ảnh hiện ngay.
   * KHÔNG bật cho ảnh LCP.
   */
  reveal?: boolean;
  className?: string;
};

/**
 * KHUNG ẢNH CHUNG của trang chủ — một chỗ để thay ảnh (truyền `photo`), không phải sửa section.
 * Chưa có ảnh: giữ ĐÚNG tỉ lệ khung, hiện minh họa SVG trên nền token; bản xem trước gắn nhãn
 * "Ảnh thật sẽ chụp". Không dùng stock lạc đề, không KHANG (docs/03 mục 11.4, docs/DECISIONS.md D-03, D-31).
 */
export function MediaFrame({
  ratio = '16/10',
  photo,
  illustration,
  pendingLabel,
  sizes = '(min-width: 1024px) 33vw, 100vw',
  rounded = true,
  reveal = false,
  className,
}: MediaFrameProps) {
  const showPending = !photo && Boolean(pendingLabel) && isDraftPreview();
  return (
    <div
      data-motion-item={reveal ? 'curtain' : undefined}
      className={cn('relative w-full overflow-hidden bg-blue-50', RATIO[ratio], rounded && 'rounded-lg', className)}
    >
      <div data-curtain-mask={reveal ? '' : undefined} className="absolute inset-0">
        {photo ? <Photo photo={photo} sizes={sizes} /> : <HomeIllustration name={illustration} />}
      </div>
      {showPending ? (
        <Badge variant="draft" className="absolute left-3 top-3">
          {pendingLabel}
        </Badge>
      ) : null}
    </div>
  );
}
