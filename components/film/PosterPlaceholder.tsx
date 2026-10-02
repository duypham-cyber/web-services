/**
 * POSTER TẠM của phim trang chủ: hình minh họa vector "bàn điều phối nhìn từ người ngồi" dựng bằng token màu,
 * inline SVG (không request, không phải ứng viên LCP). KHÔNG có KHANG, KHÔNG logo hãng, KHÔNG bản đồ
 * (mọi biểu diễn bản đồ phải qua NFR-MAP-01). Agent phim thay bằng <picture> poster AVIF chụp từ cảnh A+
 * (fetchpriority="high", khung dọc ≤ 767px) theo docs/04 mục 2.3.
 */
export function PosterPlaceholder({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id="pp-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-navy-900)" />
          <stop offset="1" stopColor="var(--color-blue-700)" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="pp-window" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-blue-100)" stopOpacity="0.38" />
          <stop offset="1" stopColor="var(--color-blue-300)" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="pp-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-blue-600)" />
          <stop offset="1" stopColor="var(--color-blue-700)" />
        </linearGradient>
        <linearGradient id="pp-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-blue-700)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--color-navy-900)" />
        </linearGradient>
        <radialGradient id="pp-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--color-blue-300)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--color-blue-300)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pp-vignette" cx="0.62" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="var(--color-navy-900)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--color-navy-900)" stopOpacity="0.85" />
        </radialGradient>
      </defs>

      {/* Tường + cửa sổ ánh ngày dịu */}
      <rect width="1600" height="900" fill="url(#pp-wall)" />
      <g transform="translate(1240 70)">
        <rect width="300" height="430" rx="10" fill="url(#pp-window)" />
        <path d="M150 0v430M0 215h300" stroke="var(--color-navy-900)" strokeOpacity="0.55" strokeWidth="10" />
        <rect width="300" height="430" rx="10" fill="none" stroke="var(--color-navy-900)" strokeOpacity="0.6" strokeWidth="12" />
      </g>
      <ellipse cx="1390" cy="560" rx="360" ry="120" fill="url(#pp-glow)" opacity="0.5" />

      {/* Dàn lạnh treo tường, thấy trọn ở góc trên (không logo, không kiểu dáng hãng nào) */}
      <g transform="translate(780 78)">
        <rect width="330" height="92" rx="22" fill="var(--color-white)" opacity="0.92" />
        <rect x="18" y="62" width="294" height="12" rx="6" fill="var(--color-slate-300)" />
        <circle cx="300" cy="28" r="5" fill="var(--color-blue-300)" />
      </g>

      {/* Màn hình lớn: dashboard điều phối minh họa (không bản đồ) */}
      <ellipse cx="1040" cy="420" rx="420" ry="250" fill="url(#pp-glow)" />
      <path d="M770 238 1312 206 1322 566 778 584Z" fill="var(--color-navy-900)" />
      <path d="M786 252 1298 222 1307 552 794 568Z" fill="url(#pp-screen)" />
      <g opacity="0.9">
        <path d="M806 270 1280 243" stroke="var(--color-white)" strokeOpacity="0.35" strokeWidth="10" strokeLinecap="round" />
        <path d="M812 312 1000 302M812 346 980 337M812 380 1010 371M812 414 960 406" stroke="var(--color-white)" strokeOpacity="0.22" strokeWidth="14" strokeLinecap="round" />
        <path d="M1046 470v-80M1086 468v-120M1126 466v-60M1166 464v-140M1206 462v-96M1246 460v-120" stroke="var(--color-blue-300)" strokeWidth="22" strokeLinecap="round" />
        <rect x="812" y="448" width="196" height="76" rx="12" fill="var(--color-white)" transform="rotate(-3 812 448)" />
        <path d="M832 474h120M832 500h80" stroke="var(--color-slate-300)" strokeWidth="10" strokeLinecap="round" transform="rotate(-3 812 448)" />
        <rect x="960" y="486" width="34" height="18" rx="9" fill="var(--color-orange-500)" transform="rotate(-3 812 448)" />
      </g>
      <path d="M1010 576h70l26 70h-122Z" fill="var(--color-navy-900)" />

      {/* Mặt bàn, ánh xanh màn hình hắt xuống */}
      <path d="M0 668 1600 612V900H0Z" fill="url(#pp-desk)" />
      <ellipse cx="1030" cy="660" rx="460" ry="70" fill="url(#pp-glow)" opacity="0.8" />

      {/* Laptop tiền cảnh, chéo góc, bị cắt mép dưới */}
      <g transform="rotate(-6 820 760)">
        <path d="M600 610 1040 596 1052 842 610 858Z" fill="var(--color-navy-900)" />
        <path d="M616 624 1026 611 1037 828 625 842Z" fill="var(--color-white)" opacity="0.94" />
        <path d="M640 652h150M640 690h330M640 724h300M640 758h340M640 792h260" stroke="var(--color-blue-100)" strokeWidth="14" strokeLinecap="round" />
        <path d="M640 652h70" stroke="var(--color-blue-600)" strokeWidth="14" strokeLinecap="round" />
        <rect x="880" y="640" width="120" height="30" rx="15" fill="var(--color-orange-500)" />
        <path d="M570 858 1080 840 1130 930 520 950Z" fill="var(--color-slate-300)" opacity="0.85" />
      </g>

      {/* Ly cà phê, sổ tay: dấu vết "có người đang làm" */}
      <g transform="translate(1210 700)">
        <rect width="62" height="74" rx="10" fill="var(--color-white)" opacity="0.85" />
        <path d="M62 18c22 0 22 34 0 34" fill="none" stroke="var(--color-white)" strokeOpacity="0.85" strokeWidth="8" />
      </g>
      <rect x="330" y="720" width="190" height="120" rx="8" fill="var(--color-blue-100)" opacity="0.18" transform="rotate(-8 330 720)" />

      <rect width="1600" height="900" fill="url(#pp-vignette)" />
    </svg>
  );
}
