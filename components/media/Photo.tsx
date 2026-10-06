import { getLocale, getTranslations } from 'next-intl/server';
import { photoSrc, photoWidths, type PhotoAsset } from '@/content/photos';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

type PhotoProps = {
  photo: PhotoAsset;
  /** Thuộc tính sizes: trình duyệt dựa vào đây để chọn bản trong srcset (640 / 1024 / gốc). */
  sizes: string;
  /** Ảnh nằm ở màn đầu (hero): tải ngay, ưu tiên cao. Mặc định lazy. Không thêm <link rel=preload> (ngân sách 1 preload/trang). */
  priority?: boolean;
  className?: string;
};

/**
 * Ảnh đã xuất sẵn của content/photos.ts, phủ kín khung cha (cha phải `relative`, có tỉ lệ và `overflow-hidden`).
 * <picture> thuần AVIF → WebP, không qua next/image để không thêm JS tải đầu (xem components/solutions/kit/MediaFrame.tsx).
 * Ảnh minh họa (AI/stock) luôn có nhãn "Ảnh minh họa" (D-31): người xem không nhầm đó là thợ hay văn phòng thật của Bluebolt.
 */
export async function Photo({ photo, sizes, priority = false, className }: PhotoProps) {
  const locale = (await getLocale()) as Locale;
  const widths = photoWidths(photo);
  const srcSet = (ext: 'avif' | 'webp') => widths.map((w) => `${photoSrc(photo, w, ext)} ${w}w`).join(', ');
  const fallback = widths.find((w) => w >= 1024) ?? photo.width;
  return (
    <>
      <picture>
        <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
        <img
          src={photoSrc(photo, fallback, 'webp')}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          alt={photo.alt[locale]}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className={cn('absolute inset-0 size-full object-cover', className)}
          style={photo.position ? { objectPosition: photo.position } : undefined}
        />
      </picture>
      {photo.illustrative ? <IllustrativeLabel /> : null}
    </>
  );
}

/**
 * Nhãn "Ảnh minh họa" góc dưới trái của khung ảnh (cha `relative`). Dùng chung cho ảnh đầu bài Kiến thức.
 * Nhỏ hơn Badge (11 px) để không che ảnh ở khung hẹp (5 bước quy trình ~240 px); slate-600 trên trắng 7,58:1.
 */
export async function IllustrativeLabel() {
  const t = await getTranslations('common.media');
  return (
    <span className="pointer-events-none absolute bottom-2 left-2 rounded-pill border border-slate-300 bg-white px-1.5 text-[0.6875rem] leading-4 font-medium text-slate-600">
      {t('illustrative')}
    </span>
  );
}
