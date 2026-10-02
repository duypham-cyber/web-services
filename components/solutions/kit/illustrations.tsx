import type { ReactNode } from 'react';

/**
 * Minh họa SVG thiết bị và nghiệp vụ cho khung ảnh giữ chỗ (docs/03 mục 11.4 lớp "Minh họa thiết bị"):
 * nét đơn giản, KHÔNG logo, KHÔNG kiểu dáng nhận diện của hãng nào, KHÔNG chữ/số trong hình (raster text không dịch được).
 * Màu chỉ từ token (class fill-*, stroke-* của Tailwind sinh từ styles/tokens.css). Thuần trang trí: aria-hidden.
 * Thay bằng ảnh thật: truyền `src` cho <MediaFrame> (components/solutions/kit/MediaFrame.tsx), không sửa file này.
 */
export type IllustrationKey =
  | 'ac-split'
  | 'appliances'
  | 'maintenance'
  | 'robot'
  | 'dashboard'
  | 'integration'
  | 'step-intake'
  | 'step-dispatch'
  | 'step-confirm'
  | 'step-install'
  | 'step-reconcile';

const LINE = 'fill-none stroke-blue-600';
const SOFT = 'fill-none stroke-blue-600 opacity-35';

function Svg({ viewBox, children }: { viewBox: string; children: ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="block size-full"
    >
      {children}
    </svg>
  );
}

/** Thẻ checklist nổi (nghiệm thu) — dùng lại ở vài cảnh. */
function ChecklistCard({ x, y, w = 128 }: { x: number; y: number; w?: number }) {
  return (
    <g>
      <rect x={x} y={y + 4} width={w} height={92} rx={12} className="fill-blue-100" />
      <rect x={x} y={y} width={w} height={92} rx={12} className="fill-white stroke-blue-600" strokeWidth={2} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={x + 20} cy={y + 24 + i * 24} r={7} className={i < 2 ? 'fill-blue-600' : 'fill-white stroke-blue-600'} strokeWidth={2} />
          {i < 2 ? (
            <path d={`M${x + 16.5} ${y + 24 + i * 24} l2.5 2.5 l5 -5`} className="fill-none stroke-white" strokeWidth={2} />
          ) : null}
          <rect x={x + 36} y={y + 20 + i * 24} width={w - 56 - i * 12} height={8} rx={4} className="fill-blue-100" />
        </g>
      ))}
    </g>
  );
}

function AcIndoor({ x, y, w = 236, h = 76, led = true }: { x: number; y: number; w?: number; h?: number; led?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 3.8} className="fill-white stroke-blue-600" strokeWidth={2} />
      <path d={`M${x + 16} ${y + h * 0.63} H${x + w - 16}`} className="fill-none stroke-blue-100" strokeWidth={2} />
      <rect x={x + 32} y={y + h * 0.74} width={w - 64} height={h * 0.13} rx={h * 0.065} className="fill-blue-100" />
      {led ? <circle cx={x + w - 24} cy={y + h * 0.26} r={4} className="fill-orange-500" /> : null}
    </g>
  );
}

function AcSplit() {
  const pipe = 'M308 122 H318 Q330 122 330 134 V238 Q330 250 342 250 H360';
  return (
    <Svg viewBox="0 0 480 360">
      <path d="M36 52 H300" className="fill-none stroke-slate-300" strokeWidth={2} />
      <g className="fill-none stroke-slate-500" strokeWidth={1.5}>
        <path d="M54 58 V82" strokeDasharray="3 4" />
        <path d="M48 58 H60 M48 82 H60" />
      </g>
      <AcIndoor x={72} y={84} />
      <g className={SOFT} strokeWidth={2}>
        {[120, 160, 200, 240].map((cx) => (
          <path key={cx} d={`M${cx} 176 q18 16 0 32`} />
        ))}
      </g>
      <path d={pipe} className="fill-none stroke-blue-100" strokeWidth={11} />
      <path d={pipe} className={LINE} strokeWidth={2} />
      <ellipse cx={410} cy={322} rx={64} ry={7} className="fill-blue-100" />
      <rect x={360} y={222} width={100} height={88} rx={10} className="fill-white stroke-blue-600" strokeWidth={2} />
      <circle cx={398} cy={266} r={31} className="fill-blue-50 stroke-blue-600" strokeWidth={2} />
      <circle cx={398} cy={266} r={19} className={SOFT} strokeWidth={2} />
      <path d="M398 247 V285 M379 266 H417 M385 253 L411 279 M411 253 L385 279" className={SOFT} strokeWidth={1.5} />
      <circle cx={398} cy={266} r={4} className="fill-blue-600" />
      <g className="fill-none stroke-slate-300" strokeWidth={2}>
        {[240, 252, 264, 276, 288].map((yy) => (
          <path key={yy} d={`M438 ${yy} H448`} />
        ))}
      </g>
      <path d="M372 310 V318 M448 310 V318" className={LINE} strokeWidth={3} />
      <ChecklistCard x={330} y={40} />
    </Svg>
  );
}

function Appliances() {
  return (
    <Svg viewBox="0 0 480 360">
      <path d="M36 328 H444" className="fill-none stroke-slate-300" strokeWidth={2} />
      {/* TV treo tường */}
      <rect x={130} y={164} width={40} height={8} rx={3} className="fill-slate-300" />
      <rect x={48} y={44} width={204} height={122} rx={10} className="fill-navy-900" />
      <rect x={57} y={53} width={186} height={104} rx={5} className="fill-blue-600" />
      <path d="M57 120 L150 53 H196 L86 157 H57 Z" className="fill-white opacity-10" />
      {/* Máy giặt cửa trước */}
      <ellipse cx={135} cy={330} rx={84} ry={6} className="fill-blue-100" />
      <rect x={60} y={196} width={150} height={130} rx={12} className="fill-white stroke-blue-600" strokeWidth={2} />
      <path d="M60 224 H210" className={LINE} strokeWidth={2} />
      <rect x={76} y={205} width={42} height={10} rx={5} className="fill-blue-100" />
      <circle cx={190} cy={210} r={7} className="fill-white stroke-blue-600" strokeWidth={2} />
      <circle cx={135} cy={276} r={40} className="fill-blue-50 stroke-blue-600" strokeWidth={2} />
      <circle cx={135} cy={276} r={28} className="fill-white stroke-blue-100" strokeWidth={2} />
      <path d="M109 286 q13 -8 26 0 t26 0 V292 a28 28 0 0 1 -52 0 Z" className="fill-blue-100" />
      <circle cx={192} cy={210} r={2.5} className="fill-orange-500" />
      {/* Tủ lạnh */}
      <ellipse cx={356} cy={330} rx={76} ry={6} className="fill-blue-100" />
      <rect x={292} y={60} width={130} height={266} rx={14} className="fill-white stroke-blue-600" strokeWidth={2} />
      <path d="M292 142 H422" className={LINE} strokeWidth={2} />
      <rect x={402} y={84} width={6} height={40} rx={3} className="fill-blue-600" />
      <rect x={402} y={162} width={6} height={64} rx={3} className="fill-blue-600" />
      <rect x={310} y={80} width={46} height={18} rx={5} className="fill-blue-100" />
      <circle cx={347} cy={89} r={2.5} className="fill-orange-500" />
    </Svg>
  );
}

function Maintenance() {
  return (
    <Svg viewBox="0 0 480 360">
      {/* Dàn lạnh mở nắp, lưới lọc */}
      <path d="M66 74 L304 74 L292 30 L78 30 Z" className="fill-blue-50 stroke-blue-600" strokeWidth={2} />
      <rect x={60} y={72} width={250} height={82} rx={20} className="fill-white stroke-blue-600" strokeWidth={2} />
      <rect x={88} y={86} width={194} height={36} rx={5} className="fill-blue-50 stroke-blue-600" strokeWidth={1.5} />
      <g className={SOFT} strokeWidth={1.25}>
        {Array.from({ length: 15 }, (_, i) => (
          <path key={i} d={`M${100 + i * 12} 88 V120`} />
        ))}
        <path d="M90 98 H280 M90 110 H280" />
      </g>
      <rect x={92} y={134} width={186} height={9} rx={4.5} className="fill-blue-100" />
      <path d="M322 40 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z" className="fill-orange-500" />
      <path d="M346 70 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" className="fill-orange-500" />
      {/* Lịch định kỳ */}
      <rect x={70} y={198} width={156} height={124} rx={12} className="fill-white stroke-blue-600" strokeWidth={2} />
      <path d="M70 210 a12 12 0 0 1 12 -12 H214 a12 12 0 0 1 12 12 V226 H70 Z" className="fill-blue-600" />
      <path d="M104 190 V206 M192 190 V206" className="fill-none stroke-navy-900" strokeWidth={4} />
      {Array.from({ length: 12 }, (_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        return (
          <rect
            key={i}
            x={86 + col * 32}
            y={238 + row * 26}
            width={24}
            height={18}
            rx={4}
            className={i === 6 ? 'fill-orange-500' : 'fill-blue-50'}
          />
        );
      })}
      {/* Danh mục kiểm tra */}
      <rect x={300} y={178} width={128} height={150} rx={12} className="fill-white stroke-blue-600" strokeWidth={2} />
      <rect x={336} y={170} width={56} height={18} rx={5} className="fill-blue-600" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect
            x={316}
            y={206 + i * 28}
            width={14}
            height={14}
            rx={3}
            className={i < 3 ? 'fill-blue-600' : 'fill-white stroke-blue-600'}
            strokeWidth={2}
          />
          {i < 3 ? <path d={`M319 ${213 + i * 28} l3 3 l5 -6`} className="fill-none stroke-white" strokeWidth={2} /> : null}
          <rect x={340} y={209 + i * 28} width={72 - (i % 2) * 18} height={8} rx={4} className="fill-blue-100" />
        </g>
      ))}
    </Svg>
  );
}

function Robot() {
  return (
    <Svg viewBox="0 0 480 360">
      <rect x={36} y={36} width={408} height={288} rx={16} className="fill-white stroke-slate-300" strokeWidth={2} />
      <path d="M36 176 H176 M244 36 V132 M244 196 V324" className="fill-none stroke-slate-300" strokeWidth={6} />
      {/* Đường dọn */}
      <path
        d="M64 64 H216 V84 H64 V104 H216 V124 H64 V144 H216"
        className="fill-none stroke-blue-600 opacity-40"
        strokeWidth={2}
        strokeDasharray="2 7"
      />
      {/* Vùng cấm ảo */}
      <rect x={292} y={60} width={124} height={62} rx={8} className="fill-orange-50 stroke-orange-500" strokeWidth={2} strokeDasharray="6 6" />
      {/* Robot */}
      <ellipse cx={300} cy={282} rx={46} ry={6} className="fill-blue-100" />
      <circle cx={300} cy={232} r={46} className="fill-white stroke-blue-600" strokeWidth={2} />
      <circle cx={300} cy={232} r={36} className="fill-none stroke-blue-100" strokeWidth={2} />
      <path d="M262 206 A46 46 0 0 1 338 206" className="fill-none stroke-navy-900" strokeWidth={5} />
      <circle cx={300} cy={222} r={11} className="fill-navy-900" />
      <circle cx={300} cy={222} r={3} className="fill-orange-500" />
      <path d="M262 262 l-14 8 M266 268 l-8 14 M258 258 l-16 0" className={LINE} strokeWidth={2} />
      {/* Dock sạc + Wi-Fi */}
      <rect x={392} y={196} width={36} height={74} rx={8} className="fill-blue-50 stroke-blue-600" strokeWidth={2} />
      <circle cx={410} cy={212} r={3} className="fill-orange-500" />
      <g className={LINE} strokeWidth={2}>
        <path d="M398 176 a17 17 0 0 1 24 0" />
        <path d="M391 168 a27 27 0 0 1 38 0" className="opacity-60" />
        <circle cx={410} cy={183} r={2} className="fill-blue-600" />
      </g>
    </Svg>
  );
}

function Dashboard() {
  const pills = ['fill-blue-100', 'fill-orange-50', 'fill-blue-100', 'fill-blue-50'];
  const dots = ['fill-blue-600', 'fill-orange-500', 'fill-blue-600', 'fill-slate-300'];
  return (
    <Svg viewBox="0 0 480 360">
      <ellipse cx={240} cy={318} rx={210} ry={9} className="fill-blue-100" />
      <rect x={58} y={34} width={364} height={236} rx={16} className="fill-navy-900" />
      <rect x={70} y={46} width={340} height={212} rx={6} className="fill-white" />
      <path d="M26 272 H454 L434 302 H46 Z" className="fill-blue-100 stroke-blue-600" strokeWidth={2} />
      <rect x={210} y={272} width={60} height={8} rx={4} className="fill-blue-600 opacity-40" />
      {/* Thanh bên */}
      <rect x={70} y={46} width={62} height={212} className="fill-blue-50" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={82} y={66 + i * 24} width={38} height={10} rx={5} className={i === 1 ? 'fill-blue-600' : 'fill-blue-100'} />
      ))}
      {/* Tiêu đề */}
      <rect x={146} y={60} width={110} height={10} rx={5} className="fill-blue-100" />
      <circle cx={394} cy={65} r={7} className="fill-blue-100" />
      {/* Ô chỉ số (không số) */}
      {[146, 236, 326].map((x, i) => (
        <g key={x}>
          <rect x={x} y={82} width={74} height={50} rx={7} className="fill-blue-50 stroke-blue-100" strokeWidth={1.5} />
          <rect x={x + 10} y={93} width={34} height={6} rx={3} className="fill-blue-100" />
          <rect x={x + 10} y={107} width={i === 1 ? 30 : 46} height={13} rx={4} className={i === 1 ? 'fill-orange-500' : 'fill-blue-600'} />
        </g>
      ))}
      {/* Danh sách đơn */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={146} y={146 + i * 26} width={254} height={20} rx={5} className="fill-white stroke-slate-300" strokeWidth={1.25} />
          <rect x={156} y={153 + i * 26} width={60 + (i % 3) * 18} height={6} rx={3} className="fill-blue-100" />
          <rect x={330} y={150 + i * 26} width={60} height={12} rx={6} className={pills[i]} />
          <circle cx={340} cy={156 + i * 26} r={3} className={dots[i]} />
        </g>
      ))}
    </Svg>
  );
}

function Integration() {
  return (
    <Svg viewBox="0 0 480 360">
      {/* Sàn: trang bán hàng */}
      <ellipse cx={122} cy={292} rx={92} ry={7} className="fill-blue-100" />
      <rect x={34} y={68} width={176} height={212} rx={14} className="fill-white stroke-blue-600" strokeWidth={2} />
      <path d="M34 96 V82 a14 14 0 0 1 14 -14 H196 a14 14 0 0 1 14 14 V96 Z" className="fill-blue-50" />
      <path d="M34 96 H210" className={LINE} strokeWidth={2} />
      {[50, 62, 74].map((cx) => (
        <circle key={cx} cx={cx} cy={82} r={3.5} className="fill-blue-100" />
      ))}
      {[0, 1, 2, 3].map((i) => {
        const x = 50 + (i % 2) * 76;
        const y = 110 + Math.floor(i / 2) * 82;
        return (
          <g key={i}>
            <rect x={x} y={y} width={68} height={70} rx={8} className="fill-blue-50" />
            <rect x={x + 12} y={y + 16} width={44} height={16} rx={6} className="fill-white stroke-blue-600" strokeWidth={1.5} />
            <rect x={x + 12} y={y + 46} width={30} height={6} rx={3} className={i === 0 ? 'fill-orange-500' : 'fill-blue-100'} />
          </g>
        );
      })}
      {/* Mũi tên: đơn sang Bluebolt, trạng thái về sàn */}
      <path d="M220 150 H286" className={LINE} strokeWidth={2.5} />
      <path d="M280 142 L290 150 L280 158" className={LINE} strokeWidth={2.5} />
      <path d="M290 222 H224" className="fill-none stroke-orange-500" strokeWidth={2.5} strokeDasharray="6 6" />
      <path d="M230 214 L220 222 L230 230" className="fill-none stroke-orange-500" strokeWidth={2.5} />
      {/* Điện thoại: dòng trạng thái */}
      <ellipse cx={370} cy={318} rx={66} ry={6} className="fill-blue-100" />
      <rect x={300} y={34} width={140} height={278} rx={24} className="fill-navy-900" />
      <rect x={310} y={52} width={120} height={244} rx={14} className="fill-white" />
      <rect x={326} y={68} width={64} height={9} rx={4.5} className="fill-blue-100" />
      <path d="M336 108 V246" className="fill-none stroke-blue-100" strokeWidth={3} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle
            cx={336}
            cy={108 + i * 46}
            r={8}
            className={i < 3 ? 'fill-blue-600' : 'fill-white stroke-orange-500'}
            strokeWidth={3}
          />
          <rect x={352} y={102 + i * 46} width={62 - (i % 2) * 14} height={7} rx={3.5} className="fill-blue-100" />
          <rect x={352} y={114 + i * 46} width={40} height={5} rx={2.5} className="fill-blue-50" />
        </g>
      ))}
    </Svg>
  );
}

function StepIntake() {
  return (
    <Svg viewBox="0 0 480 300">
      {[2, 1, 0].map((i) => (
        <g key={i} transform={`translate(${70 + i * 22} ${54 + i * 18})`}>
          <rect width={180} height={120} rx={12} className={i === 0 ? 'fill-white stroke-blue-600' : 'fill-blue-50 stroke-blue-100'} strokeWidth={2} />
          {i === 0 ? (
            <>
              <rect x={16} y={16} width={70} height={10} rx={5} className="fill-blue-600" />
              <rect x={16} y={40} width={148} height={7} rx={3.5} className="fill-blue-100" />
              <rect x={16} y={56} width={120} height={7} rx={3.5} className="fill-blue-100" />
              <rect x={16} y={72} width={134} height={7} rx={3.5} className="fill-blue-100" />
              <rect x={16} y={92} width={52} height={14} rx={7} className="fill-orange-50" />
              <circle cx={26} cy={99} r={3} className="fill-orange-500" />
            </>
          ) : null}
        </g>
      ))}
      <path d="M302 150 H346" className={LINE} strokeWidth={2.5} />
      <path d="M340 142 L350 150 L340 158" className={LINE} strokeWidth={2.5} />
      <path d="M362 120 H426 L440 158 V196 a10 10 0 0 1 -10 10 H358 a10 10 0 0 1 -10 -10 V158 Z" className="fill-white stroke-blue-600" strokeWidth={2} />
      <path d="M348 158 H378 l8 14 H404 l8 -14 H440" className={LINE} strokeWidth={2} />
      <ellipse cx={394} cy={222} rx={52} ry={6} className="fill-blue-100" />
    </Svg>
  );
}

function StepDispatch() {
  return (
    <Svg viewBox="0 0 480 300">
      <rect x={40} y={30} width={400} height={240} rx={16} className="fill-white stroke-slate-300" strokeWidth={2} />
      <path d="M40 110 H440 M40 190 H440 M170 30 V270 M310 30 V270" className="fill-none stroke-blue-50" strokeWidth={10} />
      <path d="M80 70 q60 -30 120 10 t110 20" className="fill-none stroke-blue-100" strokeWidth={3} />
      <path
        d="M110 214 C150 214 160 150 210 150 S290 92 352 92"
        className="fill-none stroke-blue-600"
        strokeWidth={3}
        strokeDasharray="2 9"
      />
      {/* Thợ */}
      <circle cx={110} cy={214} r={16} className="fill-orange-500" />
      <circle cx={110} cy={214} r={6} className="fill-white" />
      <circle cx={110} cy={214} r={28} className="fill-none stroke-orange-500 opacity-35" strokeWidth={2} />
      {/* Nhà khách */}
      <path d="M332 104 L352 86 L372 104 V126 H332 Z" className="fill-white stroke-blue-600" strokeWidth={2} />
      <rect x={346} y={110} width={12} height={16} rx={2} className="fill-blue-100" />
      <path d="M352 52 a14 14 0 0 1 14 14 c0 10 -14 22 -14 22 s-14 -12 -14 -22 a14 14 0 0 1 14 -14 Z" className="fill-blue-600" />
      <circle cx={352} cy={66} r={5} className="fill-white" />
    </Svg>
  );
}

function StepConfirm() {
  return (
    <Svg viewBox="0 0 480 300">
      <ellipse cx={240} cy={282} rx={70} ry={6} className="fill-blue-100" />
      <rect x={180} y={20} width={120} height={256} rx={22} className="fill-navy-900" />
      <rect x={190} y={36} width={100} height={224} rx={12} className="fill-white" />
      <rect x={202} y={52} width={76} height={20} rx={6} className="fill-blue-600" />
      {Array.from({ length: 15 }, (_, i) => (
        <rect
          key={i}
          x={204 + (i % 5) * 15}
          y={84 + Math.floor(i / 5) * 18}
          width={11}
          height={12}
          rx={3}
          className={i === 8 ? 'fill-orange-500' : 'fill-blue-50'}
        />
      ))}
      <rect x={202} y={150} width={76} height={36} rx={8} className="fill-blue-50 stroke-blue-100" strokeWidth={1.5} />
      <rect x={212} y={160} width={44} height={6} rx={3} className="fill-blue-600" />
      <rect x={212} y={172} width={30} height={5} rx={2.5} className="fill-blue-100" />
      <circle cx={240} cy={226} r={16} className="fill-blue-600" />
      <path d="M233 223 q3 -6 7 -1 l-2 3 q2 4 6 6 l3 -2 q5 4 -1 7 q-12 -2 -13 -13 Z" className="fill-white" />
      {/* Bong bóng hội thoại */}
      <path d="M70 70 h86 a12 12 0 0 1 12 12 v34 a12 12 0 0 1 -12 12 h-58 l-16 14 v-14 h-12 a12 12 0 0 1 -12 -12 v-34 a12 12 0 0 1 12 -12 Z" className="fill-white stroke-blue-600" strokeWidth={2} />
      <rect x={76} y={88} width={70} height={7} rx={3.5} className="fill-blue-100" />
      <rect x={76} y={102} width={48} height={7} rx={3.5} className="fill-blue-100" />
      <path d="M324 150 h86 a12 12 0 0 1 12 12 v34 a12 12 0 0 1 -12 12 h-12 v14 l-16 -14 h-58 a12 12 0 0 1 -12 -12 v-34 a12 12 0 0 1 12 -12 Z" className="fill-blue-50 stroke-blue-600" strokeWidth={2} />
      <circle cx={344} cy={180} r={9} className="fill-blue-600" />
      <path d="M340 180 l3 3 l5 -6" className="fill-none stroke-white" strokeWidth={2} />
      <rect x={360} y={176} width={50} height={8} rx={4} className="fill-blue-100" />
    </Svg>
  );
}

function StepInstall() {
  return (
    <Svg viewBox="0 0 480 300">
      <AcIndoor x={120} y={92} w={240} h={78} />
      <g className="fill-none stroke-blue-600 opacity-35" strokeWidth={2}>
        {[170, 210, 250, 290].map((cx) => (
          <path key={cx} d={`M${cx} 186 q16 14 0 28`} />
        ))}
      </g>
      {/* Khung ảnh nghiệm thu */}
      <g className="fill-none stroke-orange-500" strokeWidth={3}>
        <path d="M96 70 V52 H116 M364 52 H384 V70 M384 220 V238 H364 M116 238 H96 V220" />
      </g>
      {/* Cờ lê */}
      <g transform="translate(392 196) rotate(-35)">
        <rect x={-6} y={0} width={12} height={70} rx={6} className="fill-blue-600" />
        <path d="M-16 -2 a16 16 0 1 1 32 0 l-8 -10 h-16 Z" className="fill-blue-600" />
      </g>
    </Svg>
  );
}

function StepReconcile() {
  return (
    <Svg viewBox="0 0 480 300">
      {/* Biên bản/hóa đơn có mép răng cưa */}
      <ellipse cx={170} cy={278} rx={96} ry={6} className="fill-blue-100" />
      <path
        d="M90 30 H250 V262 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-10 8 Z"
        className="fill-white stroke-blue-600"
        strokeWidth={2}
      />
      <rect x={110} y={52} width={80} height={10} rx={5} className="fill-blue-600" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={110} y={86 + i * 30} width={74} height={7} rx={3.5} className="fill-blue-100" />
          <rect x={198} y={86 + i * 30} width={32} height={7} rx={3.5} className="fill-blue-100" />
        </g>
      ))}
      <path d="M110 208 H230" className={LINE} strokeWidth={2} />
      <rect x={180} y={220} width={50} height={10} rx={5} className="fill-navy-900" />
      {/* Biểu đồ đối soát */}
      <rect x={286} y={64} width={160} height={150} rx={14} className="fill-white stroke-blue-600" strokeWidth={2} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={306 + i * 26}
          y={186 - [40, 64, 52, 86, 72][i]!}
          width={16}
          height={[40, 64, 52, 86, 72][i]!}
          rx={4}
          className={i === 3 ? 'fill-orange-500' : 'fill-blue-600'}
        />
      ))}
      <path d="M302 192 H430" className="fill-none stroke-slate-300" strokeWidth={2} />
      <circle cx={430} cy={62} r={18} className="fill-blue-600" />
      <path d="M422 62 l6 6 l10 -12" className="fill-none stroke-white" strokeWidth={3} />
    </Svg>
  );
}

const ILLUSTRATIONS: Record<IllustrationKey, () => ReactNode> = {
  'ac-split': AcSplit,
  appliances: Appliances,
  maintenance: Maintenance,
  robot: Robot,
  dashboard: Dashboard,
  integration: Integration,
  'step-intake': StepIntake,
  'step-dispatch': StepDispatch,
  'step-confirm': StepConfirm,
  'step-install': StepInstall,
  'step-reconcile': StepReconcile,
};

export function Illustration({ name }: { name: IllustrationKey }) {
  const Comp = ILLUSTRATIONS[name];
  return <Comp />;
}
