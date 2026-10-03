import {
  Color,
  DirectionalLight,
  HemisphereLight,
  NeutralToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
  type Object3D,
  type Texture,
} from 'three';
import {
  MAP_CAMERA,
  cameraPose,
  nightAt,
  sceneWeights,
  transitAt,
  viewWindow,
  type LayoutId,
  type SceneId,
} from '@/motion/map-camera';
import { buildArcs } from './arcs';
import { buildClouds } from './clouds';
import { decodeHeroMap, loadHeroMap } from './data';
import { buildLand } from './land';
import { buildSeaMask } from './mask';
import { scenePalette } from './palette';
import { PIN_H, PIN_Y, buildPins } from './pins';
import { buildIslands, buildSea, buildShadowCatcher } from './sea';
import type {
  MapScene,
  MapSceneOptions,
  MapSceneStats,
  ProjectedArchipelago,
  ProjectedFrame,
  ProjectedPoint,
} from './types';
import { mulberry32, yieldToMain } from './util';

/** Seed mặc định của bố cục (đường cung, mây) — giống bản mẫu; poster chụp với đúng seed này. */
export const DEFAULT_SEED = 3402;
/** Thời gian "đứng" của chế độ chụp/giảm chuyển động (giây) — vị trí đầu sao chổi khớp poster. */
export const SHOT_TIME = 6;

const DPR_CAP = { full: 2, lite: 1.5 } as const;
/** Bậc hạ chất lượng tại chỗ (FPS guard): DPR tối đa + tắt bớt mây. Không đổi define shader → không biên dịch lại. */
const QUALITY = {
  full: [
    { dpr: 2, wisp: true, fly: true, ringKeep: 1 },
    { dpr: 1.5, wisp: true, fly: true, ringKeep: 1 },
    { dpr: 1.25, wisp: false, fly: false, ringKeep: 1 },
    { dpr: 1, wisp: false, fly: false, ringKeep: 0.5 },
  ],
  lite: [
    { dpr: 1.5, wisp: true, fly: false, ringKeep: 1 },
    { dpr: 1.25, wisp: false, fly: false, ringKeep: 1 },
    { dpr: 1, wisp: false, fly: false, ringKeep: 0.5 },
  ],
} as const;


/**
 * Dựng cảnh hero bản đồ (Mẫu 02) trên `canvas`. Resolve SAU KHI đã biên dịch mọi shader và vẽ khung đầu ở tiến độ 0 —
 * bước 2 chỉ gỡ poster sau đó, và không có biên dịch shader nào trong lúc cuộn (contracts/hero-map.md AC-L-3).
 * Vòng vẽ do bên gọi điều khiển: gọi `renderIfNeeded(now)` mỗi rAF; cảnh chỉ vẽ khi tiến độ/khung đổi hoặc ambient bật.
 */
export async function createMapScene(canvas: HTMLCanvasElement, opts: MapSceneOptions): Promise<MapScene> {
  const t0 = performance.now();
  const { tier, mobile, signal } = opts;
  const full = tier === 'full';
  const shot = opts.shot === true;
  const still = shot || opts.reducedMotion === true;
  const rand = mulberry32(opts.seed ?? DEFAULT_SEED);
  const layout: LayoutId = mobile ? 'mobile' : 'desktop';
  const L = MAP_CAMERA.layouts[layout];

  const raw = opts.data ?? (await loadHeroMap(opts.dataUrl, signal));
  const map = decodeHeroMap(raw);
  const palette = scenePalette();
  await yieldToMain(signal);

  // ------------------------------------------------------------------ renderer
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    stencil: false,
    powerPreference: full ? 'high-performance' : 'default',
    preserveDrawingBuffer: shot,
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = full;
  renderer.shadowMap.type = PCFShadowMap;
  // cảnh tĩnh, mặt trời cố định → vẽ shadow map MỘT lần (khung đầu), các khung sau không tốn pass bóng
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  let lost = false;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    opts.onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const scene = new Scene();
  scene.background = palette.sky.clone();
  /** Texture không gắn trực tiếp vào material (mặt nạ, atlas mây) — giải phóng riêng. */
  const ownTextures = new Set<Texture>();
  // Huỷ giữa chừng (AbortSignal, StrictMode gắn/gỡ 2 lần ở dev): giải phóng phần đã dựng, không rò WebGL context
  const step = async <T,>(p: Promise<T>): Promise<T> => {
    try {
      const v = await p;
      if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
      return v;
    } catch (e) {
      releaseScene();
      throw e;
    }
  };
  function releaseScene() {
    canvas.removeEventListener('webglcontextlost', onLost);
    const geos = new Set<BufferGeometry>();
    const mats = new Set<Material>();
    scene.traverse((o: Object3D) => {
      const m = o as Object3D & { geometry?: BufferGeometry; material?: Material | Material[] };
      if (m.geometry) geos.add(m.geometry);
      if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => mats.add(x));
    });
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    ownTextures.forEach((t) => t.dispose());
    sun.shadow.map?.dispose();
    renderer.renderLists.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }
  const camera = new PerspectiveCamera(L.fov, L.refAspect, 0.1, 600);

  // ------------------------------------------------------------------ ánh sáng (giữ của bản mẫu)
  scene.add(new HemisphereLight(0xe4eeff, 0xf4e6d4, 1.45));
  const sun = new DirectionalLight(0xfff1dc, 2.35);
  sun.position.set(-7.5, 11, 6);
  sun.castShadow = full;
  if (full) {
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 4;
  }
  scene.add(sun, sun.target);
  const fill = new DirectionalLight(0xd3e3ff, 0.55);
  fill.position.set(7, 5, 9);
  scene.add(fill);

  // ------------------------------------------------------------------ thành phần
  const U = {
    uTime: { value: SHOT_TIME },
    uNight: { value: 0 },
    uHaze: { value: new Vector2(30, 60) },
    uPx: { value: 1 },
  };
  const mask = await step(buildSeaMask(map, full ? 1024 : 512, signal));
  ownTextures.add(mask.texture);
  const land = buildLand(map, palette, mask.texture, mobile);
  land.top.castShadow = full;
  land.top.receiveShadow = full;
  land.walls.castShadow = full;
  land.walls.receiveShadow = full;
  scene.add(land.top, land.walls, land.borders, land.outline);
  scene.add(buildSea(map, palette, mask.texture, tier, U));
  if (full) scene.add(buildShadowCatcher(palette));
  const islands = buildIslands(map, palette, rand, tier);
  scene.add(islands.body, islands.caps);
  await step(yieldToMain(signal));
  const pins = buildPins(map, palette, U.uTime, rand, tier);
  scene.add(pins.stems, pins.heads, pins.bases, pins.rings, pins.beam);
  const arcs = buildArcs(map, palette, { uTime: U.uTime, uNight: U.uNight }, rand, { tier, mobile });
  scene.add(arcs.glow, arcs.core, arcs.dots);
  const clouds = buildClouds(map, mask, { uTime: U.uTime, uNight: U.uNight }, rand, { tier, mobile });
  scene.add(clouds.mesh);
  ownTextures.add(clouds.texture);
  await step(yieldToMain(signal));

  // ------------------------------------------------------------------ trạng thái
  let W = Math.max(1, Math.round(opts.size?.width ?? (canvas.clientWidth || canvas.width)));
  let H = Math.max(1, Math.round(opts.size?.height ?? (canvas.clientHeight || canvas.height)));
  let dprIn = opts.size?.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  let quality = 0;
  const levels = QUALITY[tier];
  const p0 = Math.min(1, Math.max(0, opts.progress ?? 0));
  let pTarget = p0;
  let pShown = p0;
  let lastP = -1;
  let dirty = true;
  let ambientOn = false;
  let amb = 0;
  let time = SHOT_TIME;
  let last = -1;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let weights: Record<SceneId, number> = sceneWeights(0);
  let night = 0;
  let lastStats = { calls: 0, triangles: 0, firstCalls: 0, firstTriangles: 0 };
  let initMs = 0;
  const skyDay = palette.sky.clone();
  const skyNight = palette.seaMistNight.clone();
  const bg = scene.background as Color;
  const lookTarget = new Vector3();

  function effectiveDpr() {
    return Math.min(dprIn, opts.maxDpr ?? DPR_CAP[tier], levels[quality]!.dpr);
  }

  function applySize() {
    renderer.setPixelRatio(effectiveDpr());
    renderer.setSize(W, H, false);
    arcs.dotsMaterial.uniforms.uPR!.value = renderer.getPixelRatio();
    U.uPx.value = renderer.getPixelRatio();
    dirty = true;
  }

  function applyQuality() {
    const q = levels[quality]!;
    clouds.uniforms.uRingKeep.value = q.ringKeep;
    applySize();
  }

  function update(p: number) {
    weights = sceneWeights(p);
    night = nightAt(p);
    U.uNight.value = night;
    const transit = transitAt(p);
    // tô sáng miền theo ranh giới tỉnh thật (aRegion của từng tỉnh)
    const wr = [weights.north, weights.central, weights.south];
    const fw = Math.max(...wr);
    land.uniforms.uRegionW.value.set(wr[0]! / (fw || 1), wr[1]! / (fw || 1), wr[2]! / (fw || 1), fw * 0.85);
    const q = levels[quality]!;
    clouds.uniforms.uKind.value.set(q.wisp ? 1 - fw * 0.6 : 0, q.fly ? transit : 0);
    bg.copy(skyDay).lerp(skyNight, night);

    const wob = amb > 0 ? { az: amb * (Math.sin(time * 0.12) * 1.2 + pointer.sx * 3), el: amb * (Math.sin(time * 0.09) * 0.5 - pointer.sy * 2) } : undefined;
    const pose = cameraPose(layout, p, wob);
    camera.position.set(...pose.position);
    camera.lookAt(lookTarget.set(...pose.target));
    camera.fov = pose.fov;
    camera.aspect = L.refAspect;
    const win = viewWindow(layout, pose, W, H);
    camera.setViewOffset(win.fullWidth, win.fullHeight, win.x, win.y, win.width, win.height);
    camera.updateProjectionMatrix();
    U.uHaze.value.set(pose.distance * 1.12, pose.distance * 2.1);
    U.uTime.value = time;
    arcs.update(time);
  }

  function draw() {
    renderer.render(scene, camera);
    lastStats = {
      ...lastStats,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    };
  }

  // ------------------------------------------------------------------ khởi động: biên dịch + khung đầu
  applySize();
  update(p0);
  await step(renderer.compileAsync(scene, camera));
  draw();
  lastStats.firstCalls = lastStats.calls;
  lastStats.firstTriangles = lastStats.triangles;
  lastP = p0;
  dirty = false;
  initMs = performance.now() - t0;

  // ------------------------------------------------------------------ giải phóng
  function disposeAll() {
    releaseScene();
  }

  function projectAt(x: number, y: number, z: number, v: Vector3): ProjectedPoint {
    v.set(x, y, z).project(camera);
    const px = Math.round(((v.x + 1) / 2) * W);
    const py = Math.round(((1 - v.y) / 2) * H);
    const front = v.z < 1 && v.z > -1;
    return { x: px, y: py, visible: front && px >= 0 && px <= W && py >= 0 && py <= H };
  }

  let disposed = false;
  const tmp = new Vector3();

  return {
    layout,
    tier,
    setProgress(p) {
      pTarget = Math.min(1, Math.max(0, Number.isFinite(p) ? p : 0));
    },
    resize(width, height, dpr) {
      const w = Math.max(1, Math.round(width));
      const h = Math.max(1, Math.round(height));
      if (w === W && h === H && dpr === dprIn) return;
      W = w;
      H = h;
      dprIn = dpr;
      applySize();
    },
    renderIfNeeded(now) {
      if (disposed || lost) return false;
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      // ambient (đường cung chạy, sóng ghim, mây trôi, rung máy) bật/tắt dần ~1,5 s để máy không giật
      const ambT = ambientOn && !still ? 1 : 0;
      if (amb !== ambT) {
        amb += (ambT - amb) * (1 - Math.exp(-dt * 2.5));
        if (Math.abs(ambT - amb) < 0.003) amb = ambT;
      }
      if (amb > 0) {
        time += dt;
        pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
        pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
      }
      if (still) pShown = pTarget;
      else {
        pShown += (pTarget - pShown) * (1 - Math.exp(-dt * MAP_CAMERA.smoothing));
        if (Math.abs(pTarget - pShown) < 1e-4) pShown = pTarget;
      }
      if (!dirty && pShown === lastP && amb === 0) return false;
      update(pShown);
      draw();
      lastP = pShown;
      dirty = false;
      return true;
    },
    project(): ProjectedFrame {
      const provinces = map.provinces.map((p) => {
        const h = p.code === '79' ? PIN_Y + 0.02 : PIN_Y + PIN_H + 0.04;
        return { code: p.code, region: p.region, ...projectAt(p.anchor[0], h, p.anchor[1], tmp) };
      });
      const archipelagos: ProjectedArchipelago[] = map.archipelagos.map((a) => {
        const lbl = projectAt(a.label[0], 0.12, a.label[1], tmp);
        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;
        let all = true;
        for (const [x, z] of a.dots) {
          const q = projectAt(x, 0.1, z, tmp);
          left = Math.min(left, q.x);
          top = Math.min(top, q.y);
          right = Math.max(right, q.x);
          bottom = Math.max(bottom, q.y);
          if (!(q.x >= 4 && q.x <= W - 4 && q.y >= 4 && q.y <= H - 4 && tmp.z < 1)) all = false;
        }
        return { id: a.id, ...lbl, box: { left, top, right, bottom }, inView: all };
      });
      return {
        width: W,
        height: H,
        layout,
        progress: pShown,
        weights: { ...weights },
        night,
        provinces,
        hq: projectAt(map.hq[0], PIN_Y + 0.02, map.hq[1], tmp),
        sea: projectAt(map.sea[0], 0.05, map.sea[1], tmp),
        archipelagos,
      };
    },
    setAmbient(on) {
      ambientOn = on;
    },
    setPointer(nx, ny) {
      pointer.x = Math.max(-0.5, Math.min(0.5, nx));
      pointer.y = Math.max(-0.5, Math.min(0.5, ny));
    },
    degrade() {
      if (quality >= levels.length - 1) return false;
      quality += 1;
      applyQuality();
      return true;
    },
    stats(): MapSceneStats {
      const info = renderer.info;
      return {
        drawCalls: lastStats.calls,
        triangles: lastStats.triangles,
        firstFrameDrawCalls: lastStats.firstCalls,
        firstFrameTriangles: lastStats.firstTriangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        programs: info.programs?.length ?? 0,
        initMs: Math.round(initMs),
        dpr: renderer.getPixelRatio(),
        tier,
        quality,
        clouds: clouds.counts,
        arcs: arcs.count,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeAll();
    },
  };
}

