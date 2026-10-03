'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ArchipelagoId, MapScene, MapTier, ProjectedFrame, RawHeroMap } from '@/components/film/map3d/types';
import { layoutFor, type SceneId } from '@/motion/map-camera';
import styles from './HeroMapDev.module.css';

/**
 * Bàn soát cảnh 3D hero bản đồ — CHỈ cho trang nội bộ /dev/hero-map (contracts/hero-map.md bước 1).
 * Nhãn ở đây là bản phác để soát project(); nhãn thật (chống chồng, minimap, panel tour) làm ở FilmHero (bước 2).
 */
export type HeroMapDevLabels = {
  provinces: Record<string, { name: string; major: boolean }>;
  archipelagos: Record<ArchipelagoId, string>;
  sea: string;
  hqRole: string;
  legend: string;
};

type Box = [number, number, number, number];
type DevApi = {
  set(p: number): Promise<void>;
  frame(): ProjectedFrame | null;
  stats(): ReturnType<MapScene['stats']> | null;
  labels(): { id: string; box: Box; shown: boolean }[];
};

declare global {
  interface Window {
    __heroMapDev?: DevApi;
  }
}

const REGION_SCENE: SceneId[] = ['north', 'central', 'south'];
/** Tỉnh có nhãn ở cảnh toàn quốc/toàn mạng lưới (như bản mẫu): Hà Nội, Đà Nẵng. */
const NATIONAL_CODES = new Set(['01', '48']);

const noopSubscribe = () => () => {};

function readQuery(search: string) {
  const q = new URLSearchParams(search);
  const num = (k: string, d: number) => {
    const v = Number(q.get(k));
    return q.has(k) && Number.isFinite(v) ? v : d;
  };
  const tier: MapTier = q.get('tier') === 'lite' ? 'lite' : 'full';
  const layout = q.get('layout');
  return {
    p: Math.min(1, Math.max(0, num('p', 0))),
    tier,
    shot: q.get('shot') === '1',
    labels: q.get('labels') !== '0',
    ambient: q.get('ambient') === '1',
    mobile: layout === 'mobile' ? true : layout === 'desktop' ? false : layoutFor(window.innerWidth, window.innerHeight) === 'mobile',
  };
}

export function HeroMapDev({ labels }: { labels: HeroMapDevLabels }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const statsRef = useRef<HTMLPreElement>(null);
  // query đọc ở client (trang vẫn prerender tĩnh); server snapshot = null → chưa dựng cảnh
  const search = useSyncExternalStore(noopSubscribe, () => window.location.search, () => null);
  const cfg = useMemo(() => (search === null ? null : readQuery(search)), [search]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cfg) return;
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ac = new AbortController();
    let scene: MapScene | null = null;
    let raf = 0;
    let frames = 0;
    let waiters: (() => void)[] = [];
    let lastBoxes: { id: string; box: Box; shown: boolean }[] = [];
    const sizes = new Map<string, [number, number]>();
    const labelEls = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLElement>('[data-label-id]').forEach((el) => labelEls.set(el.dataset.labelId!, el));
    const measure = () => {
      labelEls.forEach((el, id) => sizes.set(id, [el.offsetWidth || 80, el.offsetHeight || 24]));
    };

    const placeLabels = (f: ProjectedFrame) => {
      if (!cfg.labels) return;
      const W = f.width;
      const placed: Box[] = [];
      const panel = root.querySelector<HTMLElement>('[data-dev-panel]');
      if (panel) {
        const r = panel.getBoundingClientRect();
        placed.push([r.left - 8, r.top - 8, r.width + 16, r.height + 16]);
      }
      // NFR-MAP-01 (b): không nhãn nào đè lên vùng chấm đảo của hai quần đảo
      for (const a of f.archipelagos) placed.push([a.box.left - 10, a.box.top - 10, a.box.right - a.box.left + 20, a.box.bottom - a.box.top + 20]);
      const w = f.weights;
      type Item = { id: string; x: number; y: number; vis: boolean; weight: number; prio: number; kind: 'arch' | 'city' | 'sea' | 'hq' };
      const items: Item[] = [];
      // quần đảo: luôn hiện khi còn chấm đảo nào trong khung (kéo nhãn vào trong mép); ra hẳn khỏi khung → minimap (bước 2)
      for (const a of f.archipelagos) {
        const any = a.box.right >= 0 && a.box.left <= f.width && a.box.bottom >= 0 && a.box.top <= f.height;
        items.push({ id: `arch-${a.id}`, x: a.x, y: a.y, vis: any, weight: 1, prio: 100, kind: 'arch' });
      }
      items.push({ id: 'hq', x: f.hq.x, y: f.hq.y, vis: f.hq.visible, weight: Math.max(w.national, w.south, w.network), prio: 90, kind: 'hq' });
      items.push({ id: 'sea', x: f.sea.x, y: f.sea.y, vis: f.sea.visible, weight: Math.max(w.national, w.central, w.network), prio: 40, kind: 'sea' });
      for (const p of f.provinces) {
        if (p.code === '79') continue;
        const meta = labels.provinces[p.code];
        const regionW = w[REGION_SCENE[p.region]!];
        const nat = NATIONAL_CODES.has(p.code) ? Math.max(w.national, w.network) : 0;
        items.push({ id: `p-${p.code}`, x: p.x, y: p.y, vis: p.visible, weight: Math.max(regionW, nat), prio: meta?.major ? 60 : 30, kind: 'city' });
      }
      items.sort((a, b) => b.prio - a.prio);
      const boxes: typeof lastBoxes = [];
      for (const it of items) {
        const el = labelEls.get(it.id);
        if (!el) continue;
        const [lw, lh] = sizes.get(it.id) ?? [80, 24];
        let box: Box =
          it.kind === 'hq' ? [it.x + 14, it.y + 10, lw, lh] : it.kind === 'sea' ? [it.x - lw / 2, it.y - lh / 2, lw, lh] : [it.x - lw / 2, it.y - (it.kind === 'arch' ? 14 : 10) - lh, lw, lh];
        box = [Math.min(Math.max(box[0], 8), W - 8 - lw), it.kind === 'arch' ? Math.min(Math.max(box[1], 8), f.height - 8 - lh) : box[1], lw, lh];
        let op = it.weight > 0.01 && it.vis ? it.weight : 0;
        if (it.kind === 'arch') op = it.vis ? 1 : 0;
        const hit = op > 0 && it.kind !== 'arch' && placed.some((b) => box[0] < b[0] + b[2] && box[0] + box[2] > b[0] && box[1] < b[1] + b[3] && box[1] + box[3] > b[1]);
        if (hit) op = 0;
        if (op > 0) placed.push(box);
        el.style.transform = `translate(${Math.round(box[0])}px, ${Math.round(box[1])}px)`;
        el.style.opacity = op.toFixed(3);
        el.style.visibility = op > 0.01 ? 'visible' : 'hidden';
        boxes.push({ id: it.id, box, shown: op > 0.01 });
      }
      lastBoxes = boxes;
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!scene) return;
      if (scene.renderIfNeeded(now)) {
        frames += 1;
        placeLabels(scene.project());
        document.documentElement.dataset.heroFrame = String(frames);
        const w = waiters;
        waiters = [];
        w.forEach((fn) => fn());
      }
    };

    const onResize = () => {
      if (!scene) return;
      scene.resize(root.clientWidth, root.clientHeight, window.devicePixelRatio || 1);
      measure();
    };
    const onPointer = (e: PointerEvent) => scene?.setPointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);

    (async () => {
      try {
        const [mod, data] = await Promise.all([
          import('@/components/film/map3d'),
          fetch('/data/hero-map.json', { signal: ac.signal }).then((r) => r.json() as Promise<RawHeroMap>),
        ]);
        await document.fonts?.ready;
        measure();
        scene = await mod.createMapScene(canvas, {
          tier: cfg.tier,
          mobile: cfg.mobile,
          shot: cfg.shot,
          data,
          progress: cfg.p,
          size: { width: root.clientWidth, height: root.clientHeight, dpr: window.devicePixelRatio || 1 },
          signal: ac.signal,
          onContextLost: () => setError('webglcontextlost → bước 2 chuyển T-STILL'),
        });
        scene.setAmbient(cfg.ambient && !cfg.shot);
        frames = 1;
        placeLabels(scene.project());
        document.documentElement.dataset.heroFrame = '1';
        document.documentElement.dataset.heroReady = '1';
        raf = requestAnimationFrame(loop);
        window.addEventListener('resize', onResize);
        window.addEventListener('pointermove', onPointer, { passive: true });
        window.__heroMapDev = {
          set(p) {
            if (sliderRef.current) sliderRef.current.value = String(p);
            return new Promise<void>((resolve) => {
              waiters.push(resolve);
              scene?.setProgress(p);
            });
          },
          frame: () => scene?.project() ?? null,
          stats: () => scene?.stats() ?? null,
          labels: () => lastBoxes,
        };
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError(String((e as Error).message ?? e));
          document.documentElement.dataset.heroReady = 'error';
        }
      }
    })();

    const statsTimer = window.setInterval(() => {
      if (!scene || !statsRef.current) return;
      const s = scene.stats();
      statsRef.current.textContent =
        `tầng ${s.tier} · ${scene.layout} · dpr ${s.dpr} · bậc ${s.quality}\n` +
        `draw call ${s.drawCalls} (khung đầu ${s.firstFrameDrawCalls}) · tam giác ${s.triangles} (${s.firstFrameTriangles})\n` +
        `program ${s.programs} · geometry ${s.geometries} · texture ${s.textures} · dựng ${s.initMs} ms`;
    }, 500);

    return () => {
      ac.abort();
      cancelAnimationFrame(raf);
      window.clearInterval(statsTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      scene?.dispose();
      delete window.__heroMapDev;
      delete document.documentElement.dataset.heroReady;
    };
  }, [cfg, labels]);

  const archIds = Object.keys(labels.archipelagos) as ArchipelagoId[];
  const hqName = labels.provinces['79']?.name ?? '';

  return (
    <div ref={rootRef} className={styles.root} data-shot={cfg?.shot ? '' : undefined}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      {cfg?.labels !== false && (
        <div className={styles.labels} aria-hidden="true">
          {archIds.map((id) => (
            <div key={id} data-label-id={`arch-${id}`} className={`${styles.label} ${styles.arch}`}>
              <i />
              {labels.archipelagos[id]}
            </div>
          ))}
          <div data-label-id={'hq'} className={`${styles.label} ${styles.hq}`}>
            <b>{hqName}</b>
            <span>{labels.hqRole}</span>
          </div>
          <div data-label-id={'sea'} className={`${styles.label} ${styles.sea}`}>
            {labels.sea}
          </div>
          {Object.entries(labels.provinces)
            .filter(([code]) => code !== '79')
            .map(([code, p]) => (
              <div key={code} data-label-id={`p-${code}`} className={`${styles.label} ${styles.city}`}>
                {p.name}
              </div>
            ))}
        </div>
      )}
      {cfg && !cfg.shot ? (
        <aside className={styles.panel} data-dev-panel="">
          <h1 className={styles.title}>Hero bản đồ 3D · nội bộ</h1>
          <label className={styles.row}>
            <span>Tiến độ p</span>
            <input
              ref={sliderRef}
              type="range"
              min={0}
              max={1}
              step={0.005}
              defaultValue={cfg.p}
              onChange={(e) => window.__heroMapDev?.set(Number(e.currentTarget.value))}
            />
          </label>
          <p className={styles.row}>
            Tầng:{' '}
            <a href={`?tier=full&p=${cfg.p}`} aria-current={cfg.tier === 'full' ? 'true' : undefined}>
              full
            </a>{' '}
            ·{' '}
            <a href={`?tier=lite&p=${cfg.p}`} aria-current={cfg.tier === 'lite' ? 'true' : undefined}>
              lite
            </a>{' '}
            · <a href={`?tier=${cfg.tier}&ambient=${cfg.ambient ? 0 : 1}`}>hiệu ứng nền {cfg.ambient ? 'tắt' : 'bật'}</a>
          </p>
          <pre ref={statsRef} className={styles.stats} />
          <p className={styles.legend}>{labels.legend}</p>
          {error && <p className={styles.error}>{error}</p>}
        </aside>
      ) : (
        <h1 className="sr-only">Hero bản đồ 3D</h1>
      )}
    </div>
  );
}
