import {
  Building2,
  CalendarCheck,
  Camera,
  ClipboardCheck,
  Headset,
  MapPin,
  MessageCircle,
  Phone,
  Smartphone,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { Photo } from '@/components/media/Photo';
import { Badge } from '@/components/ui/Badge';
import type { PhotoAsset } from '@/content/photos';
import { cn } from '@/lib/cn';
import { isDraftPreview } from '@/lib/env';

/**
 * KHUNG ẢNH DÙNG CHUNG của khu vực partner (/doi-tac-tho, /ho-tro-khach-hang, /ve-chung-toi, /lien-he).
 *
 * - Có ảnh → truyền `photo` (content/photos.ts, xuất sẵn AVIF/WebP nhiều cỡ): render <picture> thuần
 *   (components/media/Photo.tsx), KHÔNG kéo next/image (component client ~6 KB gz) vào JS tải đầu của trang. Ảnh minh họa
 *   AI/stock tự kèm nhãn "Ảnh minh họa" (D-31).
 * - Chưa có ảnh → khung giữ chỗ đúng tỉ lệ, dựng bằng token + icon Lucide (không stock, không mascot, không logo hãng —
 *   docs/03 mục 11.4). Ghi chú "Ảnh thật sẽ chụp: …" CHỈ hiện ở bản xem trước (DRAFT_PREVIEW=1).
 *
 * Thay ảnh thật sau này: sửa content/photos.ts (hoặc prop `photo` ở nơi gọi), bố cục giữ nguyên (cùng tỉ lệ khung).
 */
export type MediaMotif = 'team' | 'office' | 'technician' | 'support';
export type MediaRatio = '4/3' | '3/2' | '16/10' | '1/1' | '4/5';

type MediaFrameProps = {
  motif: MediaMotif;
  ratio?: MediaRatio;
  /** Ảnh của content/photos.ts (đã nén sẵn, không qua /_next/image). */
  photo?: PhotoAsset | null;
  /** Thuộc tính sizes của ảnh. */
  sizes?: string;
  /** Ghi chú bản xem trước, vd "Ảnh thật sẽ chụp: đội điều phối". */
  pendingNote?: string;
  /** Ưu tiên tải (ảnh hero ở màn đầu). Chỉ có tác dụng khi có ảnh. */
  priority?: boolean;
  className?: string;
};

const RATIO_CLASS: Record<MediaRatio, string> = {
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '16/10': 'aspect-[16/10]',
  '1/1': 'aspect-square',
  '4/5': 'aspect-[4/5]',
};

/** Icon chính + 3 icon phụ (bố cục cố định quanh tâm) cho từng chủ đề. */
const MOTIFS: Record<MediaMotif, { main: LucideIcon; accents: [LucideIcon, LucideIcon, LucideIcon] }> = {
  team: { main: Users, accents: [Headset, MapPin, ClipboardCheck] },
  office: { main: Building2, accents: [MapPin, Phone, CalendarCheck] },
  technician: { main: Wrench, accents: [Smartphone, Camera, MapPin] },
  support: { main: Headset, accents: [Phone, MessageCircle, ClipboardCheck] },
};

const DOTS: CSSProperties = {
  backgroundImage: 'radial-gradient(var(--color-blue-300) 1.5px, transparent 1.5px)',
  backgroundSize: '22px 22px',
};

export function MediaFrame({
  motif,
  ratio = '4/3',
  photo,
  sizes = '(min-width: 1024px) 560px, 100vw',
  pendingNote,
  priority,
  className,
}: MediaFrameProps) {
  const frame = cn('relative overflow-hidden rounded-xl', RATIO_CLASS[ratio], className);

  if (photo) {
    return (
      <div className={cn(frame, 'bg-blue-100')}>
        <Photo photo={photo} sizes={sizes} priority={priority} />
      </div>
    );
  }

  const { main: Main, accents } = MOTIFS[motif];
  const [A1, A2, A3] = accents;
  const preview = isDraftPreview();

  return (
    <div className={cn(frame, 'border border-blue-100 bg-blue-100 shadow-1')}>
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 opacity-40" style={DOTS} />
        <div className="absolute left-1/2 top-1/2 aspect-square h-[86%] -translate-x-1/2 -translate-y-1/2 rounded-pill bg-blue-50" />
        <div className="absolute left-1/2 top-1/2 aspect-square h-[58%] -translate-x-1/2 -translate-y-1/2 rounded-pill border border-blue-300/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex size-24 items-center justify-center rounded-pill bg-white text-blue-600 shadow-2 md:size-28">
            <Main size={44} strokeWidth={1.5} />
          </span>
        </div>
        <span className="absolute left-[16%] top-[20%] inline-flex size-12 items-center justify-center rounded-md bg-white text-blue-600 shadow-1">
          <A1 size={22} strokeWidth={1.5} />
        </span>
        <span className="absolute right-[15%] top-[30%] inline-flex size-11 items-center justify-center rounded-pill bg-orange-500 text-navy-900 shadow-1">
          <A2 size={20} strokeWidth={1.75} />
        </span>
        <span className="absolute bottom-[18%] right-[24%] inline-flex size-12 items-center justify-center rounded-md bg-blue-700 text-white shadow-2">
          <A3 size={22} strokeWidth={1.5} />
        </span>
      </div>
      {preview && pendingNote ? (
        <p className="absolute bottom-3 left-3 right-3">
          <Badge variant="draft" className="max-w-full whitespace-normal text-left">
            {pendingNote}
          </Badge>
        </p>
      ) : null}
    </div>
  );
}
