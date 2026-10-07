import type { LayoutId, SceneId } from '@/motion/map-camera';

/** public/data/hero-map.json (scripts/make-hero-map.mjs). Toạ độ nguyên theo 1/quant đơn vị cảnh. */
export type RawHeroMap = {
  v: 1;
  quant: number;
  /** Mỗi arc: [x0, z0, dx1, dz1, …] (delta). */
  arcs: number[][];
  /** "0"/"1" theo từng arc: 1 = bờ biển hoặc biên giới quốc gia (dùng bởi đúng một tỉnh). */
  outer: string;
  provinces: RawProvince[];
  hq: [number, number];
  sea: [number, number];
  archipelagos: RawArchipelago[];
  bbox: [number, number, number, number];
  minimap: HeroMinimap;
};

export type RawProvince = {
  code: string;
  /** 0 = Miền Bắc, 1 = Miền Trung, 2 = Miền Nam (content/provinces.ts). */
  region: 0 | 1 | 2;
  anchor: [number, number];
  /** Vòng theo chỉ số arc; ~i = đi ngược arc i. */
  rings: number[][];
  /** Cờ đảo nhỏ theo từng vòng (thiếu = không có đảo nhỏ). */
  islet?: number[];
};

export type ArchipelagoId = 'hoang-sa' | 'truong-sa';

export type RawArchipelago = {
  id: ArchipelagoId;
  parent: string;
  dots: [number, number][];
  /** 1 = chấm nằm trong elip nhóm. */
  inRing: number[];
  /** [cx, cz, rx, rz] (nguyên) + góc xoay (radian). */
  ring: [number, number, number, number, number];
  label: [number, number];
};

export type HeroMinimap = {
  w: number;
  h: number;
  regions: { north: string; central: string; south: string };
  dots: [number, number][];
  rings: [number, number, number, number, number][];
  labels: Record<ArchipelagoId, [number, number]>;
  hq: [number, number];
};

/** Vòng đã giải mã: pts = x,z xen kẽ (không lặp điểm đầu), outer[i] = cạnh i → i+1 là biên ngoài. */
export type MapRing = { pts: Float32Array; outer: Uint8Array; islet: boolean };

export type MapProvince = {
  code: string;
  region: 0 | 1 | 2;
  anchor: [number, number];
  rings: MapRing[];
};

export type MapArchipelago = {
  id: ArchipelagoId;
  dots: [number, number][];
  inRing: boolean[];
  ring: { cx: number; cz: number; rx: number; rz: number; rot: number };
  label: [number, number];
};

export type DecodedHeroMap = {
  provinces: MapProvince[];
  /** Arc đã giải mã (x,z xen kẽ) + cờ biên ngoài — để vẽ viền ngoài và ranh giới tỉnh không trùng đoạn. */
  arcs: Float32Array[];
  outer: boolean[];
  hq: [number, number];
  sea: [number, number];
  archipelagos: MapArchipelago[];
  bbox: [number, number, number, number];
  minimap: HeroMinimap;
};

export type MapTier = 'full' | 'lite';

export type MapSceneOptions = {
  tier: MapTier;
  /** Bố cục mobile (bản đồ trên, chữ dưới) hay desktop (chữ trái, bản đồ phải) — chọn bộ keyframe camera. */
  mobile: boolean;
  /** Seed bố cục ngẫu nhiên (đường cung, mây). Giữ mặc định để khung đầu khớp poster. */
  seed?: number;
  /** Giảm chuyển động: không làm mượt tiến độ, không rung máy, thời gian đứng yên. */
  reducedMotion?: boolean;
  /** Chế độ chụp tất định (poster, ảnh soát): như reducedMotion và luôn vẽ khi được gọi. */
  shot?: boolean;
  /** webglcontextlost → bước 2 chuyển T-STILL tại chỗ. */
  onContextLost?: () => void;
  /** Dữ liệu đã tải sẵn (song song với import chunk); thiếu thì fetch dataUrl. */
  data?: RawHeroMap;
  dataUrl?: string;
  /** Ghi đè DPR tối đa của tầng (full 2, lite 1,5). */
  maxDpr?: number;
  /** Tiến độ của khung đầu (vd người dùng đã cuộn giữa track khi chunk về). Mặc định 0 = khung poster. */
  progress?: number;
  /** Kích thước khung đầu (px CSS); thiếu thì đọc canvas.clientWidth/clientHeight + devicePixelRatio. */
  size?: { width: number; height: number; dpr: number };
  /**
   * Gọi sau phần dựng trên CPU, ngay trước khi biên dịch shader + vẽ khung đầu (bước 2: chờ cuộn đứng). Reject → huỷ dựng,
   * giải phóng phần đã tạo.
   */
  beforeCompile?: () => Promise<void>;
  signal?: AbortSignal;
};

export type ProjectedPoint = { x: number; y: number; visible: boolean };

export type ProjectedArchipelago = ProjectedPoint & {
  id: ArchipelagoId;
  /** Khung các chấm đảo trên màn hình (px). */
  box: { left: number; top: number; right: number; bottom: number };
  /** Mọi chấm đảo nằm trong viewport (trừ lề 4 px). false → bước 2 bật minimap. */
  inView: boolean;
};

export type ProjectedFrame = {
  width: number;
  height: number;
  layout: LayoutId;
  /** Tiến độ đã làm mượt đang vẽ. */
  progress: number;
  weights: Record<SceneId, number>;
  night: number;
  provinces: (ProjectedPoint & { code: string; region: 0 | 1 | 2 })[];
  hq: ProjectedPoint;
  sea: ProjectedPoint;
  archipelagos: ProjectedArchipelago[];
};

export type MapSceneStats = {
  /** Khung gần nhất (không gồm pass bóng — shadow map chỉ vẽ ở khung đầu). */
  drawCalls: number;
  triangles: number;
  /** Khung đầu, gồm pass bóng của T-FULL. */
  firstFrameDrawCalls: number;
  firstFrameTriangles: number;
  geometries: number;
  textures: number;
  programs: number;
  /** Thời gian dựng cảnh (ms, gồm biên dịch shader + khung đầu). */
  initMs: number;
  dpr: number;
  tier: MapTier;
  /** Bậc hạ chất lượng hiện tại (0 = đủ). */
  quality: number;
  clouds: { ring: number; wisp: number; fly: number };
  arcs: number;
};

export type ProjectedArc = { code: string; speed: number; seed: number; pts: { x: number; y: number }[] };

export type MapScene = {
  readonly layout: LayoutId;
  readonly tier: MapTier;
  /** Đặt tiến độ đích p ∈ [0, 1] (cảnh tự làm mượt, trừ reducedMotion/shot). */
  setProgress(p: number): void;
  resize(width: number, height: number, dpr: number): void;
  /** Vẽ nếu tiến độ/khung đổi hoặc hiệu ứng nền đang bật. Trả true nếu đã vẽ. */
  renderIfNeeded(now: number): boolean;
  /** Vị trí px của tâm tỉnh, văn phòng TP.HCM, hai quần đảo, Biển Đông ở khung hiện tại. */
  project(): ProjectedFrame;
  /**
   * Đường cung điều phối chiếu ra px ở khung hiện tại (mỗi đường `samples + 1` điểm, từ TP.HCM tới tâm tỉnh) — để
   * scripts/hero-poster.mjs ghi vào hero-poster.json cho lớp chấm chạy bằng SVG trên poster T-STILL.
   */
  projectArcs(samples: number): ProjectedArc[];
  /** Hiệu ứng nền theo thời gian (đường cung chạy, sóng ghim, mây trôi, rung máy rất nhẹ). */
  setAmbient(on: boolean): void;
  /** Toạ độ con trỏ chuẩn hoá [-0,5; 0,5] cho thị sai nhẹ (chỉ khi ambient). */
  setPointer(nx: number, ny: number): void;
  /** Hạ chất lượng một bậc tại chỗ, không biên dịch lại shader. false = đã hết bậc → bước 2 chuyển T-STILL. */
  degrade(): boolean;
  stats(): MapSceneStats;
  dispose(): void;
};
