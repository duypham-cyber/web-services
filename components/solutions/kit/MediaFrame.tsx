import { Photo } from '@/components/media/Photo';
import { Badge } from '@/components/ui/Badge';
import { PHOTOS, type PhotoAsset } from '@/content/photos';
import { cn } from '@/lib/cn';
import { Illustration, type IllustrationKey } from './illustrations';

export type MediaRatio = '4/3' | '16/10' | '3/2' | '1/1';

const RATIO: Record<MediaRatio, string> = {
  '4/3': 'aspect-[4/3]',
  '16/10': 'aspect-[16/10]',
  '3/2': 'aspect-[3/2]',
  '1/1': 'aspect-square',
};

/**
 * Ảnh mặc định theo khóa minh họa (D-31). Khóa chưa có ảnh → minh họa SVG. Một ảnh có thể dùng ở nhiều trang, nhưng
 * KHÔNG lặp trong cùng một trang: /giai-phap/hang-dien-may có hero `dashboard` + 5 bước, /giai-phap có hero `hub-flow` +
 * thẻ `dashboard`, `integration`.
 */
const KIT_PHOTOS: Partial<Record<IllustrationKey, PhotoAsset>> = {
  'hub-flow': PHOTOS['phong-dieu-phoi'],
  dashboard: PHOTOS['kho-hang-dien-may'],
  integration: PHOTOS['tho-huong-dan-khach'],
  'ac-split': PHOTOS['tho-lap-dieu-hoa'],
  maintenance: PHOTOS['ve-sinh-loc-may-lanh'],
  'step-intake': PHOTOS['phong-dieu-phoi'],
  'step-dispatch': PHOTOS['tho-nhan-don-xe-may'],
  'step-confirm': PHOTOS['tho-huong-dan-khach'],
  'step-install': PHOTOS['tho-lap-dieu-hoa'],
};

type MediaFrameProps = {
  /** Minh họa SVG giữ chỗ (không logo, không chữ) khi chưa có ảnh. */
  illustration: IllustrationKey;
  ratio?: MediaRatio;
  /**
   * Ảnh của content/photos.ts thay cho ảnh mặc định của khóa minh họa (vd hero /dich-vu). null = luôn dùng minh họa SVG.
   * Quy tắc ảnh (docs/03 mục 11.4, D-31): ảnh AI/stock luôn có nhãn "Ảnh minh họa", không dùng ở mục công trình.
   */
  photo?: PhotoAsset | null;
  sizes?: string;
  /** Ảnh ở màn đầu (hero): tải ngay thay vì lazy. */
  priority?: boolean;
  /** Nhãn nhỏ góc khung, CHỈ truyền khi DRAFT_PREVIEW (vd "Ảnh minh họa, ảnh thật sẽ chụp sau"). */
  previewLabel?: string | null;
  className?: string;
};

/**
 * Khung ảnh dùng chung cho trang B2B (giải pháp, dịch vụ). Một chỗ duy nhất để thay ảnh: content/photos.ts + KIT_PHOTOS.
 * Chưa có ảnh: minh họa SVG trên nền token (lưới chấm xanh nhạt) đúng tỉ lệ → không lệch bố cục khi thay ảnh.
 * Minh họa là trang trí (aria-hidden); ảnh có alt. Không animate (khung có thể nằm ở màn đầu trang con).
 * Ảnh render <picture> thuần (components/media/Photo.tsx), không next/image: next/image là client component, thêm ~5 KB
 * gz JS tải đầu cho MỌI trang dùng khung này (đo bằng safe-build 02/10/2026).
 */
export function MediaFrame({
  illustration,
  ratio = '4/3',
  photo,
  sizes = '(min-width: 1024px) 560px, 100vw',
  priority = false,
  previewLabel,
  className,
}: MediaFrameProps) {
  const shown = photo === undefined ? KIT_PHOTOS[illustration] : photo;
  if (shown) {
    return (
      <div className={cn('relative overflow-hidden rounded-lg bg-blue-50', RATIO[ratio], className)}>
        <Photo photo={shown} sizes={sizes} priority={priority} />
      </div>
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
