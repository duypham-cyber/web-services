import { readFileSync } from 'node:fs';
import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { decodeHeroMap } from '@/components/film/map3d/data';
import { KX, LAT0, LON0, LAND_TOP, toXZ } from '@/components/film/map3d/projection';
import type { RawHeroMap } from '@/components/film/map3d/types';
import {
  MAP_CAMERA,
  SAFE_MARGIN_PX,
  cameraPose,
  layoutFor,
  nightAt,
  projectPoint,
  sceneWeights,
  viewWindow,
  type LayoutId,
  type Vec3,
} from '@/motion/map-camera';

const map = decodeHeroMap(JSON.parse(readFileSync('public/data/hero-map.json', 'utf8')) as RawHeroMap);
const islandPts: Vec3[] = map.archipelagos.flatMap((a) => a.dots.map(([x, z]) => [x, 0.1, z] as Vec3));
const landPts: Vec3[] = map.provinces.flatMap((p) =>
  p.rings.flatMap((r) => Array.from({ length: r.pts.length / 2 }, (_, i) => [r.pts[i * 2]!, LAND_TOP, r.pts[i * 2 + 1]!] as Vec3)),
);

/** Viewport phải giữ trọn hai quần đảo (NFR-MAP-01 a) — gồm các tỉ lệ lệch chuẩn (4:3, ultrawide, điện thoại ngang, svh). */
const VIEWPORTS: Record<LayoutId, [number, number][]> = {
  desktop: [
    [1024, 768],
    [1280, 800],
    [1280, 1024],
    [1366, 768],
    [1440, 900],
    [1512, 982],
    [1536, 864],
    [1920, 1080],
    [2560, 1080],
    [844, 390],
    [1000, 1000],
  ],
  mobile: [
    [360, 640],
    [360, 800],
    [390, 664],
    [390, 844],
    [412, 915],
    [430, 932],
    [600, 960],
    [768, 1024],
    [800, 801],
  ],
};

describe('motion/map-camera.json', () => {
  it('keyframe tăng dần, bắt đầu 0 kết thúc 1, trọng số cảnh hợp lệ', () => {
    for (const id of ['desktop', 'mobile'] as const) {
      const kf = MAP_CAMERA.layouts[id].keyframes;
      expect(kf[0]!.p).toBe(0);
      expect(kf.at(-1)!.p).toBe(1);
      for (let i = 1; i < kf.length; i += 1) expect(kf[i]!.p).toBeGreaterThan(kf[i - 1]!.p);
    }
    for (const band of Object.values(MAP_CAMERA.weights)) {
      const nums = band.filter((v): v is number => v !== null);
      for (let i = 1; i < nums.length; i += 1) expect(nums[i]!).toBeGreaterThan(nums[i - 1]!);
    }
    expect(MAP_CAMERA.scenes).toEqual(['national', 'north', 'central', 'south', 'network']);
  });

  it('cảnh 1 rõ ở p=0, cảnh 5 + đêm ở p=1, mỗi miền rõ giữa đoạn của mình', () => {
    expect(sceneWeights(0).national).toBe(1);
    expect(sceneWeights(1).network).toBe(1);
    expect(nightAt(0)).toBe(0);
    expect(nightAt(1)).toBe(1);
    expect(sceneWeights(0.3).north).toBe(1);
    expect(sceneWeights(0.56).central).toBe(1);
    expect(sceneWeights(0.82).south).toBe(1);
  });

  it('phép chiếu trùng components/film/map3d/projection.ts', () => {
    const pose = cameraPose('desktop', 0.3);
    const kf = MAP_CAMERA.layouts.desktop.keyframes.find((k) => k.p === 0.24)!;
    expect(LON0).toBe(108.4);
    expect(LAT0).toBe(15.6);
    const [x, z] = toXZ(kf.ll[0], kf.ll[1]);
    const at = cameraPose('desktop', kf.p);
    expect(at.target[0]).toBeCloseTo(x, 9);
    expect(at.target[2]).toBeCloseTo(z, 9);
    expect(KX).toBeCloseTo(Math.cos((16 * Math.PI) / 180), 12);
    expect(pose.fov).toBe(MAP_CAMERA.layouts.desktop.fov);
  });

  it('projectPoint khớp three PerspectiveCamera + setViewOffset (≤ 0,5 px)', () => {
    for (const [layout, W, H, p] of [
      ['desktop', 1440, 900, 0],
      ['desktop', 1920, 1080, 0.55],
      ['mobile', 390, 844, 0.3],
    ] as const) {
      const L = MAP_CAMERA.layouts[layout];
      const pose = cameraPose(layout, p);
      const win = viewWindow(layout, pose, W, H);
      const cam = new PerspectiveCamera(pose.fov, L.refAspect, 0.1, 600);
      cam.position.set(...pose.position);
      cam.lookAt(new Vector3(...pose.target));
      cam.setViewOffset(win.fullWidth, win.fullHeight, win.x, win.y, win.width, win.height);
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();
      for (const pt of [map.hq, map.sea, ...map.archipelagos.map((a) => a.label)]) {
        const world: Vec3 = [pt[0], 0.3, pt[1]];
        const v = new Vector3(...world).project(cam);
        const ours = projectPoint(pose, win, L.refAspect, world);
        expect(Math.abs(((v.x + 1) / 2) * W - ours.x)).toBeLessThan(0.5);
        expect(Math.abs(((1 - v.y) / 2) * H - ours.y)).toBeLessThan(0.5);
      }
    }
  });

  it('NFR-MAP-01: mọi keyframe fit giữ trọn hai quần đảo + đất liền trong vùng safe của khung chuẩn', () => {
    for (const layout of ['desktop', 'mobile'] as const) {
      const L = MAP_CAMERA.layouts[layout];
      for (const kf of L.keyframes.filter((k) => k.fit)) {
        const pose = cameraPose(layout, kf.p);
        const win = viewWindow(layout, pose, 1000 * L.refAspect, 1000);
        for (const pt of [...islandPts, ...landPts]) {
          const q = projectPoint(pose, win, L.refAspect, pt);
          expect(q.u, `${layout} p=${kf.p} u`).toBeGreaterThanOrEqual(L.safe.x[0] - 0.002);
          expect(q.u, `${layout} p=${kf.p} u`).toBeLessThanOrEqual(L.safe.x[1] + 0.002);
          expect(q.v, `${layout} p=${kf.p} v`).toBeGreaterThanOrEqual(L.safe.y[0] - 0.002);
          expect(q.v, `${layout} p=${kf.p} v`).toBeLessThanOrEqual(L.safe.y[1] + 0.002);
        }
      }
    }
  });

  it('NFR-MAP-01: ở mọi viewport hỗ trợ, keyframe fit giữ mọi chấm đảo trong khung (lề ≥ 3 px)', () => {
    for (const layout of ['desktop', 'mobile'] as const) {
      const L = MAP_CAMERA.layouts[layout];
      for (const [W, H] of VIEWPORTS[layout]) {
        for (const kf of L.keyframes.filter((k) => k.fit)) {
          const pose = cameraPose(layout, kf.p);
          const win = viewWindow(layout, pose, W, H);
          for (const pt of islandPts) {
            const q = projectPoint(pose, win, L.refAspect, pt);
            const tag = `${layout} ${W}x${H} p=${kf.p}`;
            expect(q.x, tag).toBeGreaterThanOrEqual(SAFE_MARGIN_PX - 1);
            expect(q.x, tag).toBeLessThanOrEqual(W - SAFE_MARGIN_PX + 1);
            expect(q.y, tag).toBeGreaterThanOrEqual(SAFE_MARGIN_PX - 1);
            expect(q.y, tag).toBeLessThanOrEqual(H - SAFE_MARGIN_PX + 1);
          }
        }
      }
    }
  });

  it('16:10 là cover thuần (poster khớp từng điểm ảnh); mọi viewport: không lấn cột chữ, không lấn header', () => {
    for (const [W, H] of [
      [1440, 900],
      [1280, 800],
      [1680, 1050],
    ]) {
      const win = viewWindow('desktop', { sx: 0, sy: 0 }, W!, H!);
      expect(win.fullWidth).toBeCloseTo(Math.max(W!, H! * MAP_CAMERA.layouts.desktop.refAspect), 3);
    }
    for (const layout of ['desktop', 'mobile'] as const) {
      const L = MAP_CAMERA.layouts[layout];
      for (const [W, H] of VIEWPORTS[layout]) {
        const win = viewWindow(layout, { sx: 0, sy: 0 }, W, H);
        expect(L.safe.x[0] * win.fullWidth - win.cropX, `${layout} ${W}x${H} chữ`).toBeGreaterThanOrEqual((L.textInset ?? 0) * W - 0.5);
        expect(L.safe.y[0] * win.fullHeight - win.cropY, `${layout} ${W}x${H} header`).toBeGreaterThanOrEqual((L.topInset ?? 0) - 0.5);
      }
    }
  });

  it('layoutFor: dọc → mobile, ngang → desktop', () => {
    expect(layoutFor(390, 844)).toBe('mobile');
    expect(layoutFor(768, 1024)).toBe('mobile');
    expect(layoutFor(1024, 768)).toBe('desktop');
    expect(layoutFor(844, 390)).toBe('desktop');
  });
});
