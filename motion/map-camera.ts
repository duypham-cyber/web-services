/**
 * Đường máy + nhịp cảnh của hero bản đồ (Mẫu 02, contracts/hero-map.md). NGUỒN DUY NHẤT về camera: cảnh three.js
 * (components/film/map3d) và lớp HTML (panel tour, nhãn, poster) đều đọc từ đây — không hardcode camera ở chỗ khác.
 * Không import three: chỉ toán thuần, dùng được ở trình duyệt, Node (script poster) và Vitest.
 *
 * Khung hình kiểu "poster": mỗi bố cục có một khung chuẩn refAspect (desktop 16:10, mobile 9:16). Camera dựng ảnh của
 * khung chuẩn rồi đặt khung đó vào viewport như CSS `object-fit: cover; object-position: anchor` (three: setViewOffset),
 * TRỪ KHI cover cắt mất vùng nội dung `safe` (đất liền + hai quần đảo) hoặc lấn vào cột chữ `textInset`: khi đó khung
 * thu nhỏ vừa đủ (lộ thêm biển ở mép — cảnh 3D vẽ tiếp, poster tô màu nền). Ở tỉ lệ thiết kế (desktop 1,54–1,87,
 * điện thoại dọc) đó là cover thuần nên poster chụp ở khung chuẩn khớp từng điểm ảnh với khung 3D p = 0; mọi tỉ lệ khác
 * vẫn giữ trọn hai quần đảo (NFR-MAP-01). Lớp HTML đặt poster theo đúng viewWindow() (rộng fullWidth, lệch −cropX/−cropY).
 */
import config from './map-camera.json' with { type: 'json' };

export type LayoutId = 'desktop' | 'mobile';
export type SceneId = 'national' | 'north' | 'central' | 'south' | 'network';
export type Vec3 = [number, number, number];

export type CameraKeyframe = {
  p: number;
  ll: [number, number];
  d: number;
  el: number;
  az: number;
  sx: number;
  sy: number;
  bump?: number;
  /** Keyframe phải chứa trọn hai quần đảo trong vùng safe (NFR-MAP-01; tests/hero/map-camera.test.ts kiểm). */
  fit?: boolean;
};

export type CameraLayout = {
  refAspect: number;
  /** object-position của khung thật trong khung chuẩn: [0..1, 0..1]. */
  anchor: [number, number];
  /** FOV dọc của khung chuẩn (độ). */
  fov: number;
  /** Độ cao điểm nhìn (mặt đất 0,34). */
  targetY: number;
  /** Vùng nội dung (toạ độ chuẩn hoá của khung chuẩn, đã dịch sx/sy) luôn nằm trọn trong viewport: đất liền + hai quần đảo
   * ở keyframe fit; viewWindow() thu nhỏ khung nếu cover cắt vào vùng này. */
  safe: { x: [number, number]; y: [number, number] };
  /** Desktop: phần bên trái viewport dành cho cột chữ — mép trái vùng safe không lấn vào (tỉ lệ bề ngang viewport). */
  textInset?: number;
  keyframes: CameraKeyframe[];
};

type Band = [number | null, number | null, number | null, number | null];

export type MapCameraConfig = {
  version: number;
  scenes: SceneId[];
  weights: Record<SceneId, Band>;
  night: [number, number];
  /** Hệ số làm mượt tiến độ (1/s): pS += (p − pS)·(1 − e^(−dt·k)). */
  smoothing: number;
  layouts: Record<LayoutId, CameraLayout>;
};

/** Toạ độ cảnh của [kinh, vĩ] — trùng components/film/map3d/projection.ts (test kiểm). */
const LON0 = 108.4;
const LAT0 = 15.6;
const KX = Math.cos((16 * Math.PI) / 180);
const DEG = Math.PI / 180;

export const MAP_CAMERA: MapCameraConfig = validate(config as unknown as MapCameraConfig);

function validate(c: MapCameraConfig): MapCameraConfig {
  const fail = (m: string) => {
    throw new Error(`motion/map-camera.json: ${m}`);
  };
  if (c.version !== 1) fail('version phải là 1');
  for (const id of ['desktop', 'mobile'] as const) {
    const l = c.layouts[id];
    if (!l || !(l.refAspect > 0) || !(l.fov > 0 && l.fov < 90)) fail(`${id}: refAspect/fov sai`);
    const kf = l.keyframes;
    if (kf.length < 2 || kf[0]?.p !== 0 || kf[kf.length - 1]?.p !== 1) fail(`${id}: keyframe phải bắt đầu ở p=0, kết thúc ở p=1`);
    for (let i = 1; i < kf.length; i += 1) if (!(kf[i]!.p > kf[i - 1]!.p)) fail(`${id}: p phải tăng dần`);
  }
  return c;
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function bandWeight([a, b, c, d]: Band, p: number): number {
  const rise = a === null || b === null ? 1 : smoothstep(a, b, p);
  const fall = c === null || d === null ? 0 : smoothstep(c, d, p);
  return rise * (1 - fall);
}

/** Trọng số hiện của 5 cảnh tại p (0..1 mỗi cảnh) — panel tour HTML và tô vùng trong cảnh dùng chung. */
export function sceneWeights(p: number, cfg: MapCameraConfig = MAP_CAMERA): Record<SceneId, number> {
  return {
    national: bandWeight(cfg.weights.national, p),
    north: bandWeight(cfg.weights.north, p),
    central: bandWeight(cfg.weights.central, p),
    south: bandWeight(cfg.weights.south, p),
    network: bandWeight(cfg.weights.network, p),
  };
}

/** Mức "đêm" của biển (0 ngày → 1 đêm) ở cảnh toàn mạng lưới. */
export function nightAt(p: number, cfg: MapCameraConfig = MAP_CAMERA): number {
  return smoothstep(cfg.night[0], cfg.night[1], p);
}

/** Đoạn bay giữa hai cảnh: 1 − trọng số lớn nhất (mây tiền cảnh chỉ hiện khi đang bay). */
export function transitAt(p: number, cfg: MapCameraConfig = MAP_CAMERA): number {
  const w = sceneWeights(p, cfg);
  return 1 - Math.max(w.national, w.north, w.central, w.south, w.network);
}

export type CameraPose = {
  position: Vec3;
  target: Vec3;
  /** FOV dọc của khung chuẩn (độ). */
  fov: number;
  sx: number;
  sy: number;
  /** Khoảng cách tới điểm nhìn (dùng cho sương xa của biển). */
  distance: number;
};

/** Lệch nhỏ quanh tư thế máy (độ) — rung nhẹ khi bật hiệu ứng nền, 0 ở chế độ chụp/giảm chuyển động. */
export type Wobble = { az: number; el: number };

/** Tư thế máy tại p theo keyframe của bố cục (nội suy easeInOutCubic từng đoạn, "cú bay" nâng máy giữa đoạn). */
export function cameraPose(layoutId: LayoutId, p: number, wobble?: Wobble, cfg: MapCameraConfig = MAP_CAMERA): CameraPose {
  const kf = cfg.layouts[layoutId].keyframes;
  const pp = clamp01(p);
  let i = 0;
  while (i < kf.length - 2 && pp > kf[i + 1]!.p) i += 1;
  const a = kf[i]!;
  const b = kf[i + 1]!;
  const t = easeInOutCubic(clamp01((pp - a.p) / (b.p - a.p)));
  const bump = (b.bump ?? 0) * Math.sin(Math.PI * t);
  const lon = lerp(a.ll[0], b.ll[0], t);
  const lat = lerp(a.ll[1], b.ll[1], t);
  const d = lerp(a.d, b.d, t) + bump;
  const el = (lerp(a.el, b.el, t) + bump * 0.6 + (wobble?.el ?? 0)) * DEG;
  const az = (lerp(a.az, b.az, t) + (wobble?.az ?? 0)) * DEG;
  const x = (lon - LON0) * KX;
  const z = -(lat - LAT0);
  const ty = cfg.layouts[layoutId].targetY;
  return {
    position: [x + Math.sin(az) * Math.cos(el) * d, ty + Math.sin(el) * d, z + Math.cos(az) * Math.cos(el) * d],
    target: [x, ty, z],
    fov: cfg.layouts[layoutId].fov,
    sx: lerp(a.sx, b.sx, t),
    sy: lerp(a.sy, b.sy, t),
    distance: d,
  };
}

export type ViewWindow = {
  /** Kích thước khung chuẩn đã đặt vào viewport (px CSS) — poster vẽ đúng kích thước này. */
  fullWidth: number;
  fullHeight: number;
  /** Góc trên-trái của viewport trong khung chuẩn (px), ĐÃ cộng dịch khung sx/sy — truyền thẳng cho setViewOffset. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Góc trên-trái của viewport trong khung chuẩn (px, chưa cộng sx/sy): poster đặt ở left = −cropX, top = −cropY.
   * Âm = khung không phủ hết viewport ở phía đó (lộ màu nền). */
  cropX: number;
  cropY: number;
};

/** Lề tối thiểu (px) giữa vùng safe và mép viewport. */
export const SAFE_MARGIN_PX = 4;

/**
 * Cửa sổ nhìn của khung chuẩn trong viewport W×H: cover tại anchor, nhưng không cắt vùng safe và không lấn cột chữ.
 * Chỉ phụ thuộc kích thước viewport (cộng dịch khung sx/sy của tư thế) → cùng một phép đặt cho mọi p.
 */
export function viewWindow(layoutId: LayoutId, pose: Pick<CameraPose, 'sx' | 'sy'>, W: number, H: number, cfg: MapCameraConfig = MAP_CAMERA): ViewWindow {
  const l = cfg.layouts[layoutId];
  const A = l.refAspect;
  const m = SAFE_MARGIN_PX;
  const [bx0, bx1] = l.safe.x;
  const [by0, by1] = l.safe.y;
  const left = (l.textInset ?? 0) * W;
  let fullWidth = Math.max(W, H * A);
  fullWidth = Math.min(fullWidth, (W - left - 2 * m) / (bx1 - bx0), ((H - 2 * m) * A) / (by1 - by0));
  const fullHeight = fullWidth / A;
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));
  const cropX = clamp((fullWidth - W) * l.anchor[0], bx1 * fullWidth - (W - m), bx0 * fullWidth - left - m);
  const cropY = clamp((fullHeight - H) * l.anchor[1], by1 * fullHeight - (H - m), by0 * fullHeight - m);
  return {
    fullWidth,
    fullHeight,
    x: cropX - pose.sx * fullWidth,
    y: cropY + pose.sy * fullHeight,
    width: W,
    height: H,
    cropX,
    cropY,
  };
}

/**
 * Chiếu điểm thế giới → px của viewport (cùng phép tính với three PerspectiveCamera + setViewOffset).
 * Trả thêm u, v = toạ độ chuẩn hoá trong khung chuẩn (0..1, chưa cắt) để kiểm vùng safe và xuất vị trí nhãn poster.
 */
export function projectPoint(pose: CameraPose, win: ViewWindow, refAspect: number, point: Vec3) {
  const [cx, cy, cz] = pose.position;
  const f = normalize([pose.target[0] - cx, pose.target[1] - cy, pose.target[2] - cz]);
  const r = normalize(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const rel: Vec3 = [point[0] - cx, point[1] - cy, point[2] - cz];
  const zv = dot(rel, f);
  const tanHalf = Math.tan((pose.fov * DEG) / 2);
  const ndcX = dot(rel, r) / (zv * tanHalf * refAspect);
  const ndcY = dot(rel, u) / (zv * tanHalf);
  // khung chuẩn (đã dịch sx/sy): toạ độ chuẩn hoá 0..1
  const uu = (ndcX + 1) / 2 + pose.sx;
  const vv = (1 - ndcY) / 2 - pose.sy;
  return { x: uu * win.fullWidth - win.cropX, y: vv * win.fullHeight - win.cropY, u: uu, v: vv, depth: zv, inFront: zv > 0 };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a: Vec3, b: Vec3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function normalize(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/**
 * Bố cục theo viewport: dọc (W < H) → mobile (bản đồ trên, chữ dưới); ngang → desktop (chữ trái, bản đồ phải), kể cả
 * điện thoại xoay ngang (viewWindow tự thu khung để hai quần đảo và cột chữ không chồng nhau).
 */
export function layoutFor(W: number, H: number): LayoutId {
  return W < H ? 'mobile' : 'desktop';
}
