import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Minh họa GIỮ CHỖ cho khung ảnh trang chủ (MediaFrame) khi chưa có ảnh thật (docs/03 mục 11.4).
 * Quy tắc: thiết bị cách điệu, KHÔNG logo, KHÔNG kiểu dáng nhận ra được hãng nào, KHÔNG KHANG, KHÔNG chữ trong hình
 * (chữ raster/SVG không dịch được). Chỉ màu token (var(--color-*)). Nét chính 2,5 navy, mảng phẳng.
 * viewBox 480×300 (16:10), `slice` để phủ được khung 4:3 hoặc 3:2 mà vẫn giữ chủ thể ở giữa.
 */
export type IllustrationName = 'brands' | 'technicians' | 'consumers';

const C = {
  white: 'var(--color-white)',
  navy: 'var(--color-navy-900)',
  blue: 'var(--color-blue-600)',
  blueDark: 'var(--color-blue-700)',
  blue300: 'var(--color-blue-300)',
  blue100: 'var(--color-blue-100)',
  blue50: 'var(--color-blue-50)',
  orange: 'var(--color-orange-500)',
  slate300: 'var(--color-slate-300)',
  slate500: 'var(--color-slate-500)',
  success: 'var(--color-success-700)',
} as const;

const STROKE = { stroke: C.navy, strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Nền chung: xanh rất nhạt + lưới chấm + một mảng tròn lớn phía sau chủ thể + bóng đổ mặt đất. */
function Backdrop({ id, blobX, blobY }: { id: string; blobX: number; blobY: number }) {
  return (
    <>
      <defs>
        <pattern id={`${id}-dots`} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill={C.blue300} opacity="0.35" />
        </pattern>
      </defs>
      <rect width="480" height="300" fill={C.blue50} />
      <rect width="480" height="300" fill={`url(#${id}-dots)`} />
      <circle cx={blobX} cy={blobY} r="128" fill={C.blue100} />
      <ellipse cx="240" cy="250" rx="214" ry="9" fill={C.blue100} />
    </>
  );
}

function Check({ x, y, size = 1, color = C.white }: { x: number; y: number; size?: number; color?: string }) {
  return (
    <path
      d={`M${x - 5 * size} ${y} l${4 * size} ${4 * size} l${7 * size} ${-8 * size}`}
      fill="none"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** Hãng & Sàn: dashboard của hãng → tuyến điều phối → dàn nóng điều hòa cạnh nhà khách. */
function Brands() {
  return (
    <>
      <Backdrop id="hi-brands" blobX={262} blobY={156} />
      <g transform="translate(22 26) scale(0.92)">
      {/* Thẻ "đơn mới" nổi phía trên */}
      <g transform="translate(176 26)">
        <rect x="5" y="7" width="160" height="60" rx="13" fill={C.blue100} />
        <rect width="160" height="60" rx="13" fill={C.white} {...STROKE} />
        <rect x="12" y="13" width="34" height="34" rx="10" fill={C.blue} />
        <Check x={29} y={31} size={1.15} />
        <rect x="56" y="17" width="76" height="8" rx="4" fill={C.navy} />
        <rect x="56" y="34" width="44" height="7" rx="3.5" fill={C.slate300} />
        <rect x="108" y="32" width="38" height="11" rx="5.5" fill={C.orange} />
      </g>
      {/* Laptop: bảng đơn của hãng */}
      <g transform="translate(40 100)">
        <rect width="168" height="106" rx="10" fill={C.white} {...STROKE} />
        <rect x="11" y="12" width="146" height="10" rx="5" fill={C.blue100} />
        {[
          { y: 31, dot: C.success, pill: C.blue },
          { y: 54, dot: C.blue, pill: C.orange },
          { y: 77, dot: C.orange, pill: C.slate300 },
        ].map((row) => (
          <g key={row.y}>
            <rect x="11" y={row.y} width="146" height="18" rx="6" fill={C.blue50} />
            <circle cx="22" cy={row.y + 9} r="4" fill={row.dot} />
            <rect x="32" y={row.y + 6} width="66" height="6" rx="3" fill={C.slate300} />
            <rect x="122" y={row.y + 5} width="28" height="8" rx="4" fill={row.pill} />
          </g>
        ))}
        <path d="M-16 112 H184 L172 124 H-4 Z" fill={C.blue100} {...STROKE} />
        <rect x="68" y="112" width="32" height="4" rx="2" fill={C.navy} />
      </g>
      {/* Tuyến điều phối + ghim vị trí */}
      <path
        d="M216 160 C244 160 256 138 288 138 C316 138 324 170 332 192"
        fill="none"
        stroke={C.orange}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray="0.5 11"
      />
      <g transform="translate(288 96)">
        <path d="M0 0 C-12 0 -21 9 -21 21 C-21 37 0 44 0 44 C0 44 21 37 21 21 C21 9 12 0 0 0 Z" fill={C.blue} {...STROKE} />
        <circle cx="0" cy="21" r="7.5" fill={C.white} />
      </g>
      {/* Dàn nóng điều hòa */}
      <g transform="translate(316 198)">
        <rect width="46" height="40" rx="6" fill={C.white} {...STROKE} />
        <circle cx="17" cy="20" r="11.5" fill={C.blue100} stroke={C.navy} strokeWidth="2" />
        <path d="M11 20 H23 M17 14 V26" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M34 11 H40 M34 17 H40 M34 23 H40 M34 29 H40" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round" />
      </g>
      {/* Nhà khách hàng */}
      <g transform="translate(370 120)">
        <path d="M-6 54 L50 6 L106 54 Z" fill={C.blue} {...STROKE} />
        <rect x="6" y="50" width="88" height="68" fill={C.white} {...STROKE} />
        <rect x="18" y="76" width="22" height="42" rx="3" fill={C.blue100} stroke={C.navy} strokeWidth="2" />
        <rect x="52" y="66" width="30" height="26" rx="3" fill={C.blue100} stroke={C.navy} strokeWidth="2" />
        <path d="M67 66 V92 M52 79 H82" stroke={C.navy} strokeWidth="1.8" />
      </g>
      <circle cx="160" cy="40" r="4" fill={C.orange} />
      <circle cx="356" cy="58" r="3" fill={C.blue} />
      </g>
    </>
  );
}

/** Thợ kỹ thuật: app thợ trên điện thoại + hộp đồ nghề, cờ lê, đồng hồ đo gas. */
function Technicians() {
  return (
    <>
      <Backdrop id="hi-tech" blobX={186} blobY={150} />
      {/* Điện thoại: app thợ */}
      <g transform="translate(112 30)">
        <rect width="120" height="228" rx="20" fill={C.navy} />
        <rect x="7" y="8" width="106" height="212" rx="14" fill={C.white} />
        <path d="M7 50 V22 A14 14 0 0 1 21 8 H99 A14 14 0 0 1 113 22 V50 Z" fill={C.blue} />
        <rect x="18" y="26" width="54" height="7" rx="3.5" fill={C.white} />
        <circle cx="98" cy="30" r="7" fill={C.blue300} />
        <rect x="15" y="60" width="90" height="80" rx="10" fill={C.blue50} stroke={C.blue100} strokeWidth="2" />
        <rect x="23" y="70" width="32" height="9" rx="4.5" fill={C.orange} />
        <rect x="23" y="87" width="66" height="7" rx="3.5" fill={C.navy} />
        <rect x="23" y="100" width="48" height="6" rx="3" fill={C.slate300} />
        <rect x="23" y="117" width="40" height="15" rx="7.5" fill={C.orange} />
        <rect x="67" y="117" width="30" height="15" rx="7.5" fill={C.white} stroke={C.slate300} strokeWidth="2" />
        {[154, 174].map((y) => (
          <g key={y}>
            <circle cx="24" cy={y} r="6.5" fill={C.success} />
            <Check x={24.5} y={y + 0.5} size={0.6} />
            <rect x="37" y={y - 3} width="58" height="6" rx="3" fill={C.slate300} />
          </g>
        ))}
        <circle cx="24" cy="194" r="6" fill={C.white} stroke={C.slate500} strokeWidth="2" />
        <rect x="37" y="191" width="44" height="6" rx="3" fill={C.slate300} />
      </g>
      {/* Đồng hồ đo gas + ống */}
      <path d="M404 100 C404 128 382 132 382 158" fill="none" stroke={C.blue} strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(404 72)">
        <circle r="30" fill={C.white} {...STROKE} />
        <path d="M-20 10 A22 22 0 1 1 20 10" fill="none" stroke={C.blue300} strokeWidth="4" strokeLinecap="round" />
        <path d="M0 0 L14 -12" stroke={C.orange} strokeWidth="3" strokeLinecap="round" />
        <circle r="4" fill={C.navy} />
      </g>
      {/* Cờ lê dựa vào hộp đồ nghề */}
      <g transform="translate(318 118) rotate(-34)">
        <rect x="-62" y="-8" width="106" height="16" rx="8" fill={C.white} {...STROKE} />
        <circle cx="-51" cy="0" r="3.5" fill={C.blue100} stroke={C.navy} strokeWidth="1.6" />
        <path d="M70.7 -6.7 L50 -6.7 L50 6.7 L70.7 6.7 A18 18 0 1 1 70.7 -6.7 Z" fill={C.white} {...STROKE} />
      </g>
      {/* Hộp đồ nghề */}
      <g transform="translate(270 150)">
        <path d="M50 18 V5 H104 V18" fill="none" stroke={C.navy} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="4" y="40" width="146" height="60" rx="6" fill={C.blueDark} {...STROKE} />
        <rect x="0" y="16" width="154" height="28" rx="6" fill={C.blue} {...STROKE} />
        <rect x="67" y="35" width="20" height="15" rx="3" fill={C.orange} stroke={C.navy} strokeWidth="2" />
      </g>
      <circle cx="258" cy="60" r="4" fill={C.orange} />
      <circle cx="84" cy="206" r="3" fill={C.blue} />
    </>
  );
}

/** Khách lẻ: phòng khách có dàn lạnh treo tường, điện thoại gọi hỗ trợ, khiên bảo hành. */
function Consumers() {
  return (
    <>
      <Backdrop id="hi-home" blobX={292} blobY={140} />
      <rect y="238" width="480" height="62" fill={C.blue100} />
      {/* Cửa sổ */}
      <g transform="translate(40 60)">
        <rect width="92" height="116" rx="6" fill={C.blue100} {...STROKE} />
        <path d="M46 0 V116 M0 58 H92" stroke={C.navy} strokeWidth="2" />
      </g>
      {/* Chậu cây */}
      <g transform="translate(70 196)">
        <path d="M-2 -22 C-16 -30 -18 -44 -8 -50 C2 -40 2 -30 -2 -22 Z" fill={C.blue300} stroke={C.navy} strokeWidth="2" />
        <path d="M4 -22 C14 -34 26 -34 30 -26 C22 -18 12 -18 4 -22 Z" fill={C.blue300} stroke={C.navy} strokeWidth="2" />
        <path d="M-12 -20 H22 L18 42 H-8 Z" fill={C.orange} {...STROKE} />
      </g>
      {/* Dàn lạnh treo tường + luồng gió */}
      <g transform="translate(176 48)">
        <rect width="180" height="52" rx="16" fill={C.white} {...STROKE} />
        <rect x="16" y="33" width="148" height="8" rx="4" fill={C.blue100} />
        <circle cx="162" cy="17" r="4" fill={C.blue} />
      </g>
      {[206, 252, 298].map((x, i) => (
        <path
          key={x}
          d={`M${x} ${118 + i * 4} q8 -7 16 0 t16 0 t16 0`}
          fill="none"
          stroke={C.blue300}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ))}
      {/* Sofa */}
      <g transform="translate(150 160)">
        <rect x="12" y="0" width="156" height="52" rx="14" fill={C.blue300} {...STROKE} />
        <rect x="0" y="40" width="180" height="38" rx="12" fill={C.blue} {...STROKE} />
        <rect x="-6" y="28" width="26" height="52" rx="10" fill={C.blue300} {...STROKE} />
        <rect x="160" y="28" width="26" height="52" rx="10" fill={C.blue300} {...STROKE} />
        <rect x="16" y="78" width="9" height="10" rx="2" fill={C.navy} />
        <rect x="155" y="78" width="9" height="10" rx="2" fill={C.navy} />
      </g>
      {/* Bong bóng hội thoại + điện thoại + khiên bảo hành */}
      <g transform="translate(330 70)">
        <rect width="100" height="42" rx="13" fill={C.white} {...STROKE} />
        <path d="M70 41 L80 54 L84 41" fill={C.white} {...STROKE} />
        <rect x="72" y="38" width="14" height="5" fill={C.white} />
        {[30, 50, 70].map((cx) => (
          <circle key={cx} cx={cx} cy="21" r="4.5" fill={C.blue} />
        ))}
      </g>
      <g transform="translate(372 124)">
        <rect width="68" height="122" rx="13" fill={C.navy} />
        <rect x="6" y="9" width="56" height="104" rx="9" fill={C.white} />
        <circle cx="34" cy="48" r="15" fill={C.success} />
        <path d="M27 41 C27 49 32 56 41 56" fill="none" stroke={C.white} strokeWidth="3.5" strokeLinecap="round" />
        <rect x="16" y="76" width="36" height="6" rx="3" fill={C.slate300} />
        <rect x="21" y="88" width="26" height="6" rx="3" fill={C.slate300} />
      </g>
      <g transform="translate(346 206)">
        <path d="M22 0 L42 8 V22 C42 35 33 44 22 48 C11 44 2 35 2 22 V8 Z" fill={C.blue} {...STROKE} />
        <Check x={22} y={24} size={1.05} />
      </g>
    </>
  );
}

const SCENES: Record<IllustrationName, () => ReactNode> = {
  brands: Brands,
  technicians: Technicians,
  consumers: Consumers,
};

export function HomeIllustration({ name, className }: { name: IllustrationName; className?: string }) {
  const Scene = SCENES[name];
  return (
    <svg
      viewBox="0 0 480 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={cn('block size-full', className)}
    >
      <Scene />
    </svg>
  );
}
