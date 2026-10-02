import { MapPinned } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

/**
 * CHỮ KÝ PROPS CỐ ĐỊNH — agent bản đồ thay ruột (SVG từ public/data/vn34.topo.json + d3-geo, bảng 34 tỉnh,
 * map-rise; WebGL tương tác cho /mang-luoi là P1) nhưng GIỮ props này.
 * Luật bắt buộc (docs/04 NFR-MAP-01): Hoàng Sa và Trường Sa LUÔN nằm trọn trong khung, có nhãn ≥ 11px,
 * tương phản ≥ 4,5:1, không phần tử nào che — ở mọi breakpoint 360–1920 và mọi biểu diễn (SVG, WebGL, ảnh, OG).
 * Nhãn lấy từ content/provinces.ts (archipelagos). Số thợ lấy từ provinces[].technicianCount (null = "chưa có số").
 */
export type VietnamMapProps = {
  locale: Locale;
  /** home = section 2.5D trên trang chủ (A+: KHÔNG WebGL) · network = trang /mang-luoi */
  variant?: 'home' | 'network';
  /** Tên truy cập (role="img" aria-label), từ messages network.mapTitle. */
  title: string;
  className?: string;
};

/**
 * STUB: khung giữ chỗ KÍCH THƯỚC CỐ ĐỊNH (tỉ lệ 3:4, rộng tối đa 560px) để bố cục trang không nhảy khi agent
 * bản đồ thay ruột. Không vẽ hình nước Việt Nam giả (tránh sai chủ quyền) — chỉ khung + nhãn chờ.
 */
export function VietnamMap({ variant = 'home', title, className }: VietnamMapProps) {
  return (
    <figure
      role="img"
      aria-label={title}
      data-map-variant={variant}
      className={cn(
        'relative mx-auto flex aspect-[3/4] w-full max-w-[35rem] flex-col items-center justify-center gap-3 overflow-clip rounded-lg',
        'border-2 border-dashed border-blue-300 bg-blue-50 text-center',
        className,
      )}
    >
      <MapPinned aria-hidden="true" size={40} strokeWidth={1.5} className="text-blue-600" />
      <figcaption aria-hidden="true" className="max-w-[18rem] px-4 text-small text-slate-600">
        {title}
      </figcaption>
    </figure>
  );
}
