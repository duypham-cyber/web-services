/**
 * Chunk cảnh của hero bản đồ (import ĐỘNG từ runtime/boot.ts — cùng nhóm với three.js, KHÔNG vào JS tải đầu).
 * contracts/hero-map.md mục 3.4 và 3.6:
 *   - dựng cảnh ngay (giải mã, mặt nạ biển, hình học); riêng bước biên dịch shader + khung đầu chờ cuộn đứng ≥ 150 ms, chờ tối
 *     đa 1 s (D-35: vuốt trackpad liên tục vẫn có cảnh giữa chừng); canvas hiện đè poster khi khung đầu xong;
 *   - một rAF: setProgress(p) → renderIfNeeded(now) → nhãn chiếu từ project(); vòng tự dừng khi không còn gì để vẽ;
 *   - hiệu ứng nền chỉ khi hero trong khung nhìn + tab hiện, tắt sau ~8 s không tương tác;
 *   - ra khỏi vùng hero → dừng hẳn; > 20 s (tab ẩn > 10 s) thì giải phóng cảnh (texture, WebGL context); quay lại → dựng lại ở
 *     đúng tiến độ;
 *   - webglcontextlost / FPS guard hết bậc ở ≤ 20 hình/s → T-STILL tại chỗ (giữ chiều cao track, panel vẫn theo tiến độ);
 *   - minimap (desktop) khi một quần đảo ra khỏi khung, vẽ đủ hai quần đảo có tên, né vùng chấm đảo.
 */
import { createMapScene, type MapScene, type ProjectedFrame, type RawHeroMap } from '@/components/film/map3d';
import { SCENE_IDS, type Band, type HeroState, type SceneKey } from './boot';
import { guardVerdict } from './fps-guard';
import { createLabels } from './labels';

type Box = [number, number, number, number];

const SETTLE_MS = 150;
/** Chờ cuộn đứng tối đa chừng này trước khi biên dịch shader (D-35). */
const SETTLE_MAX_MS = 1000;
const AMBIENT_MS = 8000;
/** Ra khỏi hero quá lâu → giải phóng cảnh. Đủ dài để cuộn xuống xem rồi quay lên không phải dựng lại (D-35). */
const RELEASE_MS = 20_000;
const HIDDEN_RELEASE_MS = 10_000;
/** FPS guard (AC-T-2): cửa sổ 2 s ĐANG cuộn; ngưỡng ở fps-guard.ts. */
const GUARD_WINDOW_MS = 2000;
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
  /** ?slowms=40 (test FPS guard): giả lập máy chậm bằng cách giữ luồng chính thêm N ms mỗi khung vẽ. */
  const slowMs = Math.min(200, Number(q?.get('slowms') ?? 0) || 0);
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

  /** Trước bước biên dịch shader: chờ cuộn đứng ≥ 150 ms (tối đa 1 s); hero đã ra khỏi khung thì huỷ, quay lại sẽ dựng lại. */
  async function settle() {
    const t0 = performance.now();
    while (performance.now() - state.lastScroll < SETTLE_MS && performance.now() - t0 < SETTLE_MAX_MS) await sleep(SETTLE_MS / 3);
    if (stopped || isStill() || !inView) throw new DOMException('hero out of view', 'AbortError');
  }

  async function build() {
    if (building || scene || stopped || isStill()) return;
    building = true;
    try {
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
        beforeCompile: settle,
        onContextLost: () => state.toStill('context-lost'),
      });
      if (stopped || isStill() || !canvas.isConnected) {
        s.dispose();
        canvas.remove();
        return;
      }
      scene = s;
      // khung có thể đã đổi cỡ trong lúc dựng/chờ cuộn đứng (ResizeObserver bỏ qua khi chưa có cảnh)
      const z = size();
      s.resize(z.width, z.height, z.dpr);
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

  /**
   * Khối chữ: khung từng DÒNG chữ + nút (không lấy cả hộp .copy — hộp rộng tới mép vùng an toàn của bản đồ, sẽ ẩn oan thẻ số
   * thợ theo miền ở cảnh toàn quốc). Toạ độ của stage, chừa 8 px.
   */
  function copyBoxes(origin: DOMRect): Box[] {
    const out: Box[] = [];
    const range = document.createRange();
    const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim()) continue;
      range.selectNodeContents(n);
      for (const r of Array.from(range.getClientRects())) out.push([r.left - origin.left - 8, r.top - origin.top - 8, r.width + 16, r.height + 16]);
    }
    copy.querySelectorAll('a, button').forEach((el) => {
      const b = rel(el, origin, 8);
      if (b) out.push(b);
    });
    return out;
  }

  /** Khung tránh nhãn/minimap: khối chữ (khi hiện), panel đang hiện + thẻ đơn minh hoạ — toạ độ của stage. */
  function avoidBoxes(origin: DOMRect): Box[] {
    const out: Box[] = [];
    if (state.mobile) return out;
    if (copy.dataset.vis !== undefined) out.push(...copyBoxes(origin));
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
      // chấm đảo + elip nét đứt + quầng nước nông (~48 px quanh chấm) + nhãn phía trên
      .map((a) => [a.box.left - 48, a.box.top - 72, a.box.right - a.box.left + 96, a.box.bottom - a.box.top + 120]);
    const avoid = avoidBoxes(origin);
    const pick =
      corners.find(([, b]) => !islands.some((i) => b[0] < i[0] + i[2] && b[0] + b[2] > i[0] && b[1] < i[1] + i[3] && b[1] + b[3] > i[1]) && !avoid.some((i) => b[0] < i[0] + i[2] && b[0] + b[2] > i[0] && b[1] < i[1] + i[3] && b[1] + b[3] > i[1])) ??
      corners[0]!;
    fig.dataset.corner = pick[0];
    return pick[1];
  }

  /**
   * FPS guard: chỉ gọi khi đang cuộn, dt = khoảng giữa hai lần rAF liên tiếp. Khung chậm → hạ một bậc; hết bậc thì chỉ về
   * T-STILL khi ≤ 20 hình/s, còn lại giữ bậc thấp nhất (máy hơi giật vẫn có bản đồ 3D).
   */
  function guard(now: number, dt: number) {
    if (!guardOn || !scene) return;
    samples.push({ t: now, dt });
    while (samples.length && now - samples[0]!.t > GUARD_WINDOW_MS) samples.shift();
    // đủ ~2 s đang cuộn (máy rất chậm chỉ có vài khung trong 2 s — chính là lúc phải hạ)
    if (samples.length < 3 || now - samples[0]!.t < GUARD_WINDOW_MS * 0.9) return;
    const verdict = guardVerdict(samples.map((s) => s.dt));
    if (verdict === 'ok') return;
    samples = [];
    if (scene.degrade()) root.dataset.quality = String(scene.stats().quality);
    else if (verdict === 'slow') state.toStill('fps-guard');
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
      if (slowMs) for (const end = performance.now() + slowMs; performance.now() < end; );
    }
    // Đang cuộn: giữ vòng rAF liên tục để đo nhịp khung thật (khoảng giữa hai lần rAF), kể cả khung không có gì mới để vẽ
    // khung rất chậm (> 200 ms) chỉ có một sự kiện cuộn mỗi khung → cửa sổ "đang cuộn" giãn theo nhịp khung
    const scrolling = now - state.lastScroll < Math.max(200, dt * 1.5);
    if (scrolling && dt > 0) guard(now, dt);
    else if (!scrolling) samples = [];
    if (drew || ambientOn || scrolling) raf = requestAnimationFrame(tick);
    // không còn gì để vẽ: dừng vòng tới khi tiến độ/khung/tương tác đổi
    else lastTick = -1;
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
  const releaseAfter = (ms: number) => {
    clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(release, ms);
  };
  const onVis = () => {
    visible = document.visibilityState === 'visible';
    if (visible) {
      if (inView) clearTimeout(releaseTimer);
      else releaseAfter(RELEASE_MS);
      lastTick = -1;
      wake();
    } else {
      if (scene && ambientOn) {
        ambientOn = false;
        scene.setAmbient(false);
      }
      // tab ẩn: trả bộ nhớ GPU sớm (MacBook Air 8 GB nhiều tab)
      if (scene) releaseAfter(HIDDEN_RELEASE_MS);
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
      releaseAfter(visible ? RELEASE_MS : HIDDEN_RELEASE_MS);
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
