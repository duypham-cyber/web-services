/**
 * Bộ nạp hero bản đồ — phần nằm trong JS tải đầu (contracts/hero-map.md AC-L-1, ≤ 3 KB gz cùng MapHeroStage).
 * KHÔNG import three, motion/map-camera hay chunk cảnh: trọng số cảnh truyền từ server qua props.
 *
 *   1. Chọn tầng MỘT lần (AC-T-1): ?tier= (chỉ bản xem trước/dev) → reduced-motion → Save-Data → probe WebGL2 + renderer
 *      thật → heuristic GPU không mạng (renderer, deviceMemory, hardwareConcurrency, kích thước màn) → mobile tối đa lite.
 *   2. T-FULL/T-LITE và khối chữ vừa khung → thêm .film-armed (track cao, khung sticky, panel theo tiến độ).
 *   3. Tiến độ cuộn: getBoundingClientRect trong rAF (chỉ khi có cuộn/resize) → state.p + biến CSS/data-attribute. Không setState.
 *   4. import() chunk cảnh (runtime/stage.ts + components/film/map3d) sau ý định đầu tiên hoặc load + 2 s rảnh.
 *   5. Hạ tại chỗ (giữ chiều cao track): reduced-motion đổi giữa phiên, đổi bố cục dọc ↔ ngang, mất WebGL, FPS guard.
 */

/** Ghi tầng lên track (data-tier) và lên <html data-film-tier> (T-FULL|T-LITE|T-STILL) cho analytics form lead (contract mục 3.7). */
function markTier(root: HTMLElement, tier: 'full' | 'lite' | 'still'): void {
  root.dataset.tier = tier;
  document.documentElement.dataset.filmTier = tier === 'full' ? 'T-FULL' : tier === 'lite' ? 'T-LITE' : 'T-STILL';
}
export type Band = [number | null, number | null, number | null, number | null];
export type HeroTier = 'full' | 'lite' | 'still';
export type HeroBootConfig = {
  /** Khung chứa canvas (runtime tạo canvas mới mỗi lần dựng cảnh). */
  host: HTMLElement;
  /** Trọng số 5 cảnh theo thứ tự national, north, central, south, network (MAP_CAMERA.weights). */
  weights: Band[];
  night: [number, number];
  /** Cho phép ?tier=, ?fpsguard=0, ?ambient=0, ?shot=1, ?scene=0 (dev và bản xem trước — test/ảnh soát). */
  allowQuery: boolean;
};

export type HeroState = {
  root: HTMLElement;
  frame: HTMLElement;
  stage: HTMLElement;
  host: HTMLElement;
  copy: HTMLElement;
  panels: HTMLElement[];
  tier: HeroTier;
  mobile: boolean;
  /** Tiến độ cuộn đích của track [0..1]. */
  p: number;
  /** performance.now() của lần cuộn gần nhất (FPS guard chỉ đo khi đang cuộn; dựng cảnh khi cuộn đã đứng ≥ 150 ms). */
  lastScroll: number;
  /** performance.now() của tương tác gần nhất (hiệu ứng nền tắt sau ~8 s không tương tác). */
  lastInput: number;
  query: URLSearchParams | null;
  /** Gọi mỗi khi p đổi (chunk cảnh đăng ký). */
  listeners: Set<() => void>;
  /** Tiến độ theo vị trí đọc (mobile — chunk cảnh cài); null = tuyến tính theo track dính (desktop). */
  progress: (() => number) | null;
  /** Hẹn tính lại tiến độ ở rAF kế tiếp. */
  schedule: () => void;
  toStill(reason: string): void;
};

export const SCENE_IDS = ['national', 'north', 'central', 'south', 'network'] as const;
export type SceneKey = (typeof SCENE_IDS)[number];

const SOFTWARE = /swiftshader|llvmpipe|software|basic render|microsoft basic/i;
/** GPU đời cũ/yếu → T-STILL (thay benchmark detect-gpu, không gọi mạng). */
const WEAK = /mali-(t|[2-4]\d\d)|adreno \(tm\) [1-4]\d\d\b|powervr sgx|intel[^,)]*(gma|hd graphics [2-4]\d{3})|vivante|videocore/i;
/** GPU rời/đời mới đủ cho T-FULL ở desktop. */
const STRONG = /nvidia|geforce|quadro|rtx|radeon (rx|pro)|apple (m\d|gpu)|iris\(r\) xe|intel[^,)]*arc/i;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
function band([a, b, c, d]: Band, p: number) {
  return (a === null || b === null ? 1 : smooth(a, b, p)) * (1 - (c === null || d === null ? 0 : smooth(c, d, p)));
}

const isMobileLayout = () => matchMedia('(orientation: portrait)').matches;

function pickTier(q: URLSearchParams | null, mobile: boolean): [HeroTier, string] {
  const forced = q?.get('tier');
  if (forced === 'full' || forced === 'lite' || forced === 'still') return [mobile && forced === 'full' ? 'lite' : forced, 'query'];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return ['still', 'reduced-motion'];
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return ['still', 'save-data'];
  let renderer = '';
  try {
    const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return ['still', 'no-webgl2'];
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    renderer = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    return ['still', 'no-webgl2'];
  }
  if (!renderer || SOFTWARE.test(renderer)) return ['still', 'software-renderer'];
  if (WEAK.test(renderer)) return ['still', 'weak-gpu'];
  const mem = nav.deviceMemory ?? 0;
  const cores = nav.hardwareConcurrency ?? 0;
  if ((mem && mem < 2) || (cores && cores < 4)) return ['still', 'low-end'];
  if (mobile || matchMedia('(pointer: coarse)').matches) return ['lite', 'mobile'];
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const pixels = screen.width * screen.height * dpr * dpr;
  if (STRONG.test(renderer) && (!mem || mem >= 8) && cores >= 8 && pixels <= 3840 * 2160 * 1.05) return ['full', 'strong-gpu'];
  return ['lite', 'gpu'];
}

/**
 * Desktop: khối chữ phải trọn trong khung dính 100svh (padding đã gồm dải header + lề). Mobile không cần: bản đồ dính trên
 * cùng, chữ và panel cuộn theo dòng chảy bên dưới (FilmHero.module.css).
 */
function fits(state: HeroState): boolean {
  return state.mobile || state.copy.offsetHeight + 8 <= window.innerHeight;
}

export function bootHero({ host, weights, night, allowQuery }: HeroBootConfig): () => void {
  const root = host.closest<HTMLElement>('[data-hero-map]');
  const stage = host.closest<HTMLElement>('[data-hero-stage]');
  const copy = root?.querySelector<HTMLElement>('[data-hero-copy]');
  const frame = root?.firstElementChild as HTMLElement | null;
  if (!root || !stage || !copy || !frame) return () => {};

  const query = allowQuery ? new URLSearchParams(location.search) : null;
  const mobile = isMobileLayout();
  const [tier, reason] = pickTier(query, mobile);
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-tour] [data-scene]'));
  const cleanups: (() => void)[] = [];
  const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, opts: AddEventListenerOptions = { passive: true }) => {
    window.addEventListener(type, fn, opts);
    cleanups.push(() => window.removeEventListener(type, fn, opts));
  };

  let stop: (() => void) | null = null;
  const state: HeroState = {
    root,
    frame,
    stage,
    host,
    copy,
    panels,
    tier,
    mobile,
    p: 0,
    lastScroll: -1e9,
    lastInput: performance.now(),
    query,
    listeners: new Set(),
    progress: null,
    schedule: () => {},
    toStill(why) {
      if (state.tier === 'still') return;
      state.tier = 'still';
      markTier(root, 'still');
      root.dataset.stillReason = why;
      delete root.dataset.live;
      stop?.();
      stop = null;
    },
  };
  markTier(root, tier);
  root.dataset.tierReason = reason;

  const disarm = () => {
    cleanups.splice(0).forEach((fn) => fn());
    stop?.();
    stop = null;
    root.classList.remove('film-armed');
    for (const k of ['tier', 'tierReason', 'stillReason', 'live', 'night', 'heroScene', 'p']) delete root.dataset[k];
    root.style.removeProperty('--night');
    root.style.removeProperty('--wn');
    for (const el of [copy, ...panels]) {
      el.style.removeProperty('--w');
      delete el.dataset.vis;
      delete el.dataset.on;
    }
  };
  if (tier === 'still') return disarm;
  if (!fits(state)) {
    state.tier = 'still';
    markTier(root, 'still');
    root.dataset.tierReason = 'no-fit';
    return disarm;
  }

  // ---------------------------------------------------------------- arm (giữ vị trí cuộn nếu người dùng đã ở dưới hero)
  const before = root.getBoundingClientRect();
  root.classList.add('film-armed');
  const after = root.getBoundingClientRect();
  if (before.bottom <= 0) window.scrollBy(0, after.height - before.height);

  // ---------------------------------------------------------------- tiến độ → biến CSS / data-attribute
  const last = new Map<HTMLElement, number>();
  const setW = (el: HTMLElement, w: number) => {
    if (Math.abs((last.get(el) ?? -1) - w) < 0.002) return;
    last.set(el, w);
    el.style.setProperty('--w', w.toFixed(3));
    if (w > 0.01) el.dataset.vis = '';
    else delete el.dataset.vis;
    if (w > 0.5) el.dataset.on = '';
    else delete el.dataset.on;
  };
  let raf = 0;
  let lastNight = -1;
  const apply = () => {
    raf = 0;
    const range = root.offsetHeight - frame.offsetHeight;
    const p = clamp01(state.progress ? state.progress() : range > 0 ? -root.getBoundingClientRect().top / range : 0);
    state.p = p;
    if (query) root.dataset.p = p.toFixed(4);
    const w = weights.map((b) => band(b, p));
    setW(copy, w[0] ?? 0);
    for (const el of panels) setW(el, w[SCENE_IDS.indexOf(el.dataset.scene as SceneKey)] ?? 0);
    let best = 0;
    w.forEach((v, i) => {
      if (v > (w[best] ?? 0)) best = i;
    });
    root.dataset.heroScene = SCENE_IDS[best];
    const n = smooth(night[0], night[1], p);
    if (Math.abs(n - lastNight) > 0.002) {
      lastNight = n;
      root.style.setProperty('--night', n.toFixed(3));
      if (n > 0.5) root.dataset.night = '';
      else delete root.dataset.night;
    }
    root.style.setProperty('--wn', (w[0] ?? 0).toFixed(3));
    state.listeners.forEach((fn) => fn());
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(apply);
  };
  state.schedule = schedule;
  on('scroll', () => {
    state.lastScroll = state.lastInput = performance.now();
    schedule();
  });
  on('resize', () => {
    if (isMobileLayout() !== mobile) state.toStill('layout-change');
    schedule();
  });
  apply();
  cleanups.push(() => cancelAnimationFrame(raf));

  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const onRm = () => rm.matches && state.toStill('reduced-motion');
  rm.addEventListener('change', onRm);
  cleanups.push(() => rm.removeEventListener('change', onRm));

  // Bàn phím/trình đọc màn hình vào chữ đang mờ → cuộn track tới cảnh chứa nó (AC-TR-5)
  const onFocus = (e: FocusEvent) => {
    const el = e.target as HTMLElement;
    const scene = copy.contains(el) ? 'national' : (el.closest<HTMLElement>('[data-scene]')?.dataset.scene as SceneKey | undefined);
    if (!scene) return;
    if (mobile) return; // mobile: chữ theo dòng chảy, trình duyệt tự cuộn tới phần tử nhận focus
    const i = SCENE_IDS.indexOf(scene);
    const b = weights[i];
    if (!b || band(b, state.p) > 0.5) return;
    const mid = b[1] === null ? 0 : b[2] === null ? 1 : (b[1] + b[2]) / 2;
    const top = root.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + mid * (root.offsetHeight - frame.offsetHeight), behavior: 'instant' });
  };
  root.addEventListener('focusin', onFocus);
  cleanups.push(() => root.removeEventListener('focusin', onFocus));

  // ---------------------------------------------------------------- chunk cảnh: ý định đầu tiên hoặc load + 2 s rảnh
  let requested = false;
  let disposed = false;
  const ac = new AbortController();
  cleanups.push(() => ac.abort());
  const load = () => {
    // ?scene=0 (test bố cục): giữ .film-armed + poster, không tải chunk cảnh
    if (requested || state.tier === 'still' || query?.get('scene') === '0') return;
    requested = true;
    // dữ liệu bản đồ tải song song với chunk (AC-L-2)
    const data = fetch('/data/hero-map.json', { signal: ac.signal }).then((r) => {
      if (!r.ok) throw new Error(`hero-map ${r.status}`);
      return r.json() as Promise<unknown>;
    });
    data.catch(() => {});
    import('./stage')
      .then((m) => m.startStage(state, data, ac.signal, weights))
      .then((s) => {
        if (disposed || state.tier === 'still') s();
        else stop = s;
      })
      .catch((e: unknown) => {
        if ((e as Error)?.name !== 'AbortError') state.toStill('chunk-error');
      });
  };
  const intents = ['wheel', 'scroll', 'pointermove', 'keydown', 'touchstart'] as const;
  const onIntent = () => {
    state.lastInput = performance.now();
    load();
  };
  intents.forEach((type) => on(type, onIntent));
  let timer = 0;
  const idle = () => {
    timer = window.setTimeout(() => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (ric) ric(load, { timeout: 2000 });
      else load();
    }, 2000);
  };
  if (document.readyState === 'complete') idle();
  else on('load', idle, { once: true });
  cleanups.push(() => clearTimeout(timer));

  return () => {
    disposed = true;
    disarm();
  };
}
