import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { Illustration, type IllustrationKey } from './illustrations';

export type MediaRatio = '4/3' | '16/10' | '3/2' | '1/1';

const RATIO: Record<MediaRatio, string> = {
  '4/3': 'aspect-[4/3]',
  '16/10': 'aspect-[16/10]',
  '3/2': 'aspect-[3/2]',
  '1/1': 'aspect-square',
};

type MediaFrameProps = {
  /** Minh họa SVG giữ chỗ (không logo, không chữ) khi chưa có ảnh thật. */
  illustration: IllustrationKey;
  ratio?: MediaRatio;
  /**
   * Ảnh thật (đường dẫn trong public/ hoặc import tĩnh) — khi có thì thay minh họa. BẮT BUỘC kèm `alt`.
   * Quy tắc ảnh (docs/03 mục 11.4): chỉ ảnh thật của Bluebolt (thợ, điều phối, công trình), không stock lạc đề.
   */
  src?: string;
  alt?: string;
  /** Kích thước gốc của ảnh thật (tránh CLS). */
  width?: number;
  height?: number;
  sizes?: string;
  /** Nhãn nhỏ góc khung, CHỈ truyền khi DRAFT_PREVIEW (vd "Ảnh minh họa, ảnh thật sẽ chụp sau"). */
  previewLabel?: string | null;
  className?: string;
};

/**
 * Khung ảnh dùng chung cho trang B2B (giải pháp, dịch vụ). Một chỗ duy nhất để thay ảnh thật về sau:
 * hiện tại render minh họa SVG trên nền token (lưới chấm xanh nhạt) đúng tỉ lệ → không lệch bố cục khi thay ảnh.
 * Minh họa là trang trí (aria-hidden); ảnh thật có alt. Không animate (khung có thể nằm ở màn đầu trang con).
 */
export function MediaFrame({
  illustration,
  ratio = '4/3',
  src,
  alt,
  width,
  height,
  sizes = '(min-width: 1024px) 560px, 100vw',
  previewLabel,
  className,
}: MediaFrameProps) {
  if (src) {
    return (
      <figure className={cn('relative overflow-hidden rounded-lg bg-blue-50', RATIO[ratio], className)}>
        <Image src={src} alt={alt ?? ''} width={width} height={height} sizes={sizes} className="size-full object-cover" />
      </figure>
    );
  }
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-blue-100 bg-blue-50',
        'bg-[radial-gradient(var(--color-blue-100)_1.2px,transparent_1.2px)] bg-size-[18px_18px]',
        RATIO[ratio],
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-white)_0%,transparent_70%)] opacity-80" aria-hidden="true" />
      <div className="absolute inset-[6%]">
        <Illustration name={illustration} />
      </div>
      {previewLabel ? (
        <Badge variant="illustration" className="absolute bottom-3 left-3">
          {previewLabel}
        </Badge>
      ) : null}
    </div>
  );
}
