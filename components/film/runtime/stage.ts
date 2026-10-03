/**
 * Chunk cảnh của hero bản đồ (import ĐỘNG từ runtime/boot.ts — cùng nhóm với three.js, KHÔNG vào JS tải đầu).
 * contracts/hero-map.md mục 3.4 và 3.6:
 *   - dựng cảnh khi cuộn đã đứng ≥ 150 ms (cấm biên dịch shader khi tiến độ đang đổi); canvas hiện đè poster khi khung đầu xong;
 *   - một rAF: setProgress(p) → renderIfNeeded(now) → nhãn chiếu từ project(); vòng tự dừng khi không còn gì để vẽ;
 *   - hiệu ứng nền chỉ khi hero trong khung nhìn + tab hiện, tắt sau ~8 s không tương tác;
 *   - ra khỏi vùng hero → dừng hẳn; > 3 s thì giải phóng cảnh (texture, WebGL context); quay lại → dựng lại ở đúng tiến độ;
 *   - webglcontextlost / FPS guard hết bậc → T-STILL tại chỗ (giữ chiều cao track, panel vẫn theo tiến độ);
 *   - minimap (desktop) khi một quần đảo ra khỏi khung, vẽ đủ hai quần đảo có tên, né vùng chấm đảo.
 */
import { createMapScene, type MapScene, type ProjectedFrame, type RawHeroMap } from '@/components/film/map3d';
import { SCENE_IDS, type Band, type HeroState, type SceneKey } from './boot';
import { createLabels } from './labels';

type Box = [number, number, number, number];

const SETTLE_MS = 150;
const AMBIENT_MS = 8000;
const RELEASE_MS = 3000;
/** FPS guard (AC-T-2): p90 thời gian khung > 25 ms trong 2 s ĐANG cuộn → hạ một bậc. */
const GUARD_WINDOW_MS = 2000;
const GUARD_P90_MS = 25;
const SVG_NS = 'http://www.w3.org/2000/svg';

const absTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;

/**
 * Mobile: tiến độ theo vị trí đọc. Mỗi panel đi qua tâm "cửa sổ đọc" (phần màn hình dưới bản đồ dính) ↔ đoạn đứng [b, c] của
 * cảnh đó; giữa hai panel máy bay. Trả các mốc (scrollY → p) tăng dần.
 */
function readingKnots(root: HTMLElement, stage: HTMLElement, panels: HTMLElement[], weights: Band[]): [number, number][] {
  const vh = window.innerHeight;
  const hm = stage.offsetHeight;
  const center = hm + (vh - hm) / 2;
  const knots: [number, number][] = [[absTop(root), 0]];
  for (const el of panels) {
    const b = weights[SCENE_IDS.indexOf(el.dataset.scene as SceneKey)];
    if (!b) continue;
    const mid = absTop(el) + el.offsetHeight / 2 - center;
    const half = Math.min(el.offsetHeight * 0.3, (vh - hm) * 0.3);
    knots.push([mid - half, b[1] ?? 0], [b[2] === null ? mid : mid + half, b[2] ?? 1]);
  }
  for (let i = 1; i < knots.length; i += 1) knots[i]![0] = Math.max(knots[i]![0], knots[i - 1]![0] + 1);
  return knots;
}

function knotP(knots: [number, number][], y: number): number {
  if (!knots.length || y <= knots[0]![0]) return 0;
  for (let i = 1; i < knots.length; i += 1) {
    const [y1, p1] = knots[i]!;
    if (y <= y1) {
      const [y0, p0] = knots[i - 1]!;
      return p0 + ((p1 - p0) * (y - y0)) / (y1 - y0);
    }
  }
  return knots[knots.length - 1]![1];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function rel(el: Element | null, origin: DOMRect, pad = 0): Box | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return [r.left - origin.left - pad, r.top - origin.top - pad, r.width + 2 * pad, r.height + 2 * pad];
}

function buildMinimap(fig: HTMLElement, raw: RawHeroMap) {
  const svg = fig.querySelector('svg');
  if (!svg || svg.childElementCount > 0) return;
  const m = raw.minimap;
  const add = (tag: string, attrs: Record<string, string | number>, text?: string) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    if (text) el.textContent = text;
    svg.appendChild(el);
    return el;
  };
  for (const [region, d] of Object.entries(m.regions)) add('path', { d, 'data-region': region });
  for (const [cx, cy, rx, ry, rot] of m.rings) {
    add('ellipse', { cx, cy, rx, ry, transform: `rotate(${((rot * 180) / Math.PI).toFixed(1)} ${cx} ${cy})`, 'data-ring': '' });
  }
  for (const [cx, cy] of m.dots) add('circle', { cx, cy, r: 1.4, 'data-dot': '' });
  add('circle', { cx: m.hq[0], cy: m.hq[1], r: 2.6, 'data-hq': '' });
  const names = { 'hoang-sa': fig.dataset.archHs ?? '', 'truong-sa': fig.dataset.archTs ?? '' };
  for (const id of ['hoang-sa', 'truong-sa'] as const) {
    const [, y] = m.labels[id];
    const ring = m.rings[id === 'hoang-sa' ? 0 : 1];
    // tên quần đảo căn phải ngay dưới elip của nhóm (≥ 11 px CSS khi minimap rộng ≥ 210 px)
    const ty = ring ? ring[1] + ring[3] + 11 : y;
    add('text', { x: 197, y: Math.min(ty, m.h - 4).toFixed(1), 'text-anchor': 'end' }, names[id]);
  }
}

export async function startStage(
  state: HeroState,
  dataPromise: Promise<unknown>,
  signal: AbortSignal,
  weights: Band[],
): Promise<() => void> {
  const { root, stage, host, copy } = state;
  const q = state.query;
  const guardOn = q?.get('fpsguard') !== '0';
  /** ?shot=1 (ảnh soát/test): không làm mượt tiến độ, thời gian đứng yên, không hiệu ứng nền — khung tất định. */
  const shot = q?.get('shot') === '1';
  const ambientAllowed = !shot && q?.get('ambient') !== '0';
  let frames = 0;
  const raw = (await dataPromise) as RawHeroMap;
  const layer = root.querySelector<HTMLElement>('[data-hero-labels]');
  const fig = root.querySelector<HTMLElement>('[data-hero-minimap]');
  const labels = layer ? createLabels(layer, state.mobile) : null;

  let scene: MapScene | null = null;
  let building = false;
  let stopped = false;
  let raf = 0;
  let inView = true;
  let visible = document.visibilityState === 'visible';
  let ambientOn = false;
  let lastTick = -1;
  let releaseTimer = 0;
  let samples: { t: number; dt: number }[] = [];
  let lastFrame: ProjectedFrame | null = null;
  const cleanups: (() => void)[] = [];

  const isStill = () => state.tier === 'still';
  const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
  const size = () => ({ width: stage.clientWidth, height: stage.clientHeight, dpr: window.devicePixelRatio || 1 });

  async function build() {
    if (building || scene || stopped || isStill()) return;
    building = true;
    try {
      while (performance.now() - state.lastScroll < SETTLE_MS) await sleep(SETTLE_MS);
      if (stopped || isStill() || !inView) return;
      // canvas MỚI mỗi lần dựng: canvas cũ đã dispose() → forceContextLoss() không lấy lại context được
      host.querySelector('canvas')?.remove();
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.dataset.heroCanvas = '';
      host.appendChild(canvas);
      const s = await createMapScene(canvas, {
        tier: state.tier === 'full' ? 'full' : 'lite',
        mobile: state.mobile,
        data: raw,
        progress: state.p,
        shot,
        size: size(),
        signal,
        onContextLost: () => state.toStill('context-lost'),
      });
      if (stopped || isStill() || !canvas.isConnected) {
        s.dispose();
        canvas.remove();
        return;
      }
      scene = s;
      await document.fonts?.ready;
      labels?.measure();
      root.dataset.live = '';
      placeOverlay(s);
      lastTick = -1;
      wake();
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') state.toStill('scene-error');
    } finally {
      building = false;
    }
  }

  function release() {
    scene?.dispose();
    scene = null;
    host.querySelector('canvas')?.remove();
    delete root.dataset.live;
    labels?.hide();
    if (fig) delete fig.dataset.on;
  }

  /** Khung tránh nhãn/minimap: khối chữ (khi hiện), panel đang hiện + thẻ đơn minh hoạ — toạ độ của stage. */
  function avoidBoxes(origin: DOMRect): Box[] {
    const out: Box[] = [];
    if (state.mobile) return out;
    if (copy.dataset.vis !== undefined) {
      const b = rel(copy, origin, 8);
      if (b) out.push(b);
    }
    for (const el of state.panels) {
      if (el.dataset.vis === undefined) continue;
      const b = rel(el, origin, 10);
      if (b) out.push(b);
      const o = rel(el.querySelector('[data-order]'), origin, 8);
      if (o) out.push(o);
    }
    return out;
  }

  function placeMinimap(f: ProjectedFrame, origin: DOMRect): Box | null {
    if (!fig) return null;
    const show = !state.mobile && f.archipelagos.some((a) => !a.inView);
    if (!show) {
      delete fig.dataset.on;
      return null;
    }
    buildMinimap(fig, raw);
    const w = f.weights;
    const regions = ['north', 'central', 'south'] as const;
    const best = regions.reduce((a, b) => (w[b] > w[a] ? b : a), 'north');
    fig.dataset.region = w[best] > 0.3 ? best : '';
    fig.dataset.on = '';
    // góc không đè vùng chấm đảo đang còn trong khung: phải-dưới → phải-trên → trái-dưới (vùng bản đồ)
    const fw = fig.offsetWidth;
    const fh = fig.offsetHeight;
    const W = f.width;
    const H = f.height;
    const m = 24;
    const top = headerH() + 16;
    const corners: [string, Box][] = [
      ['br', [W - m - fw, H - m - fh, fw, fh]],
      ['tr', [W - m - fw, top, fw, fh]],
      ['bl', [Math.round(W * 0.42), H - m - fh, fw, fh]],
    ];
    const islands: Box[] = f.archipelagos
      .filter((a) => a.box.right >= 0 && a.box.left <= W && a.box.bottom >= 0 && a.box.top <= H)
      .map((a) => [a.box.left - 16, a.box.top - 40, a.box.right - a.box.left + 32, a.box.bottom - a.box.top + 56]);
    const avoid = avoidBoxes(origin);
    const pick =
      corners.find(([, b]) => !islands.some((i) => b[0] < i[0] + i[2] && b[0] + b[2] > i[0] && b[1] < i[1] + i[3] && b[1] + b[3] > i[1]) && !avoid.some((i) => b[0] < i[0] + i[2] && b[0] + b[2] > i[0] && b[1] < i[1] + i[3] && b[1] + b[3] > i[1])) ??
      corners[0]!;
    fig.dataset.corner = pick[0];
    return pick[1];
  }

  function guard(now: number, dt: number) {
    if (!guardOn || !scene) return;
    if (now - state.lastScroll > 200) {
      samples = [];
      return;
    }
    samples.push({ t: now, dt });
    while (samples.length && now - samples[0]!.t > GUARD_WINDOW_MS) samples.shift();
    if (samples.length < 8 || now - samples[0]!.t < GUARD_WINDOW_MS * 0.9) return;
    const sorted = samples.map((s) => s.dt).sort((a, b) => a - b);
    const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 0;
    if (p90 <= GUARD_P90_MS) return;
    samples = [];
    if (!scene.degrade()) state.toStill('fps-guard');
    else root.dataset.quality = String(scene.stats().quality);
  }

  /** Nhãn + minimap theo khung vừa vẽ. */
  function placeOverlay(sc: MapScene) {
    const f = sc.project();
    lastFrame = f;
    const origin = stage.getBoundingClientRect();
    const avoid = avoidBoxes(origin);
    const mm = placeMinimap(f, origin);
    if (mm) avoid.push(mm);
    labels?.place(f, avoid, headerH() + 4);
    if (q) root.dataset.heroFrame = String((frames += 1));
  }

  function tick(now: number) {
    raf = 0;
    if (stopped || !scene || !inView || !visible) return;
    const dt = lastTick < 0 ? 0 : now - lastTick;
    lastTick = now;
    const wantAmbient = ambientAllowed && now - state.lastInput < AMBIENT_MS;
    if (wantAmbient !== ambientOn) {
      ambientOn = wantAmbient;
      scene.setAmbient(wantAmbient);
    }
    scene.setProgress(state.p);
    const drew = scene.renderIfNeeded(now);
    if (drew) {
      placeOverlay(scene);
      if (dt > 0) guard(now, dt);
      raf = requestAnimationFrame(tick);
    } else {
      lastTick = -1;
      // không còn gì để vẽ: dừng vòng tới khi tiến độ/khung/tương tác đổi; hẹn thức khi hiệu ứng nền hết hạn
      if (ambientOn) raf = requestAnimationFrame(tick);
    }
  }

  function wake() {
    if (stopped) return;
    if (!scene) {
      if (inView) void build();
      return;
    }
    if (!raf && inView && visible) raf = requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------- mobile: tiến độ theo vị trí đọc của panel
  if (state.mobile) {
    let knots: [number, number][] | null = null;
    state.progress = () => knotP((knots ??= readingKnots(root, stage, state.panels, weights)), window.scrollY);
    const kro = new ResizeObserver(() => {
      knots = null;
      state.schedule();
    });
    kro.observe(root);
    cleanups.push(() => {
      kro.disconnect();
      state.progress = null;
    });
    window.addEventListener('resize', onResizeKnots, { passive: true });
    cleanups.push(() => window.removeEventListener('resize', onResizeKnots));
    function onResizeKnots() {
      knots = null;
    }
    state.schedule();
  }

  // ---------------------------------------------------------------- sự kiện
  state.listeners.add(wake);
  cleanups.push(() => state.listeners.delete(wake));
  const onInput = (e: Event) => {
    state.lastInput = performance.now();
    if (e.type === 'pointermove' && scene) {
      const pe = e as PointerEvent;
      scene.setPointer(pe.clientX / window.innerWidth - 0.5, pe.clientY / window.innerHeight - 0.5);
    }
    wake();
  };
  for (const type of ['pointermove', 'keydown', 'touchstart', 'wheel'] as const) {
    window.addEventListener(type, onInput, { passive: true });
    cleanups.push(() => window.removeEventListener(type, onInput));
  }
  const onVis = () => {
    visible = document.visibilityState === 'visible';
    if (visible) {
      lastTick = -1;
      wake();
    } else if (scene && ambientOn) {
      ambientOn = false;
      scene.setAmbient(false);
    }
  };
  document.addEventListener('visibilitychange', onVis);
  cleanups.push(() => document.removeEventListener('visibilitychange', onVis));

  const io = new IntersectionObserver(([entry]) => {
    inView = entry?.isIntersecting ?? true;
    clearTimeout(releaseTimer);
    if (inView) {
      lastTick = -1;
      wake();
    } else {
      if (scene && ambientOn) {
        ambientOn = false;
        scene.setAmbient(false);
      }
      releaseTimer = window.setTimeout(release, RELEASE_MS);
    }
  });
  io.observe(root);
  cleanups.push(() => io.disconnect());

  const ro = new ResizeObserver(() => {
    if (!scene) return;
    const s = size();
    scene.resize(s.width, s.height, s.dpr);
    labels?.measure();
    wake();
  });
  ro.observe(stage);
  cleanups.push(() => ro.disconnect());

  // Móc cho test/ảnh soát (chỉ khi cho phép query — dev/bản xem trước)
  if (q) {
    (window as Window & { __heroMap?: unknown }).__heroMap = {
      frame: () => lastFrame,
      stats: () => scene?.stats() ?? null,
      tier: () => state.tier,
    };
  }

  void build();

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    clearTimeout(releaseTimer);
    cleanups.splice(0).forEach((fn) => fn());
    release();
  };
}
