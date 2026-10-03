import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { decodeHeroMap, ringSignedArea } from '@/components/film/map3d/data';
import type { RawHeroMap } from '@/components/film/map3d/types';
import { archipelagos, provinces } from '@/content/provinces';

const text = readFileSync('public/data/hero-map.json', 'utf8');
const raw = JSON.parse(text) as RawHeroMap & { source: string; license: string };
const map = decodeHeroMap(raw);
const REGION = { north: 0, central: 1, south: 2 } as const;

function inside(x: number, z: number, pts: Float32Array) {
  let ok = false;
  const n = pts.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const xi = pts[i * 2]!;
    const zi = pts[i * 2 + 1]!;
    const xj = pts[j * 2]!;
    const zj = pts[j * 2 + 1]!;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ok = !ok;
  }
  return ok;
}

describe('public/data/hero-map.json', () => {
  it('khớp nguồn (node scripts/make-hero-map.mjs --check)', () => {
    const r = spawnSync(process.execPath, ['scripts/make-hero-map.mjs', '--check'], { encoding: 'utf8' });
    expect(r.status, r.stderr).toBe(0);
  });

  it('≤ 60 KB gzip, có nguồn + giấy phép', () => {
    expect(gzipSync(text, { level: 9 }).length).toBeLessThanOrEqual(60 * 1024);
    expect(raw.source).toMatch(/vn34\.topo\.json/);
    expect(raw.license).toMatch(/MIT/);
    expect(raw.license).toMatch(/Hoàng Sa/);
    expect(raw.license).toMatch(/Trường Sa/);
  });

  it('34 tỉnh đúng mã + miền của content/provinces.ts, điểm neo nằm trong tỉnh', () => {
    expect(map.provinces).toHaveLength(34);
    for (const p of provinces) {
      const m = map.provinces.find((x) => x.code === p.code);
      expect(m, p.code).toBeDefined();
      expect(m!.region).toBe(REGION[p.region]);
      expect(
        m!.rings.some((r) => inside(m!.anchor[0], m!.anchor[1], r.pts)),
        `${p.code} neo ngoài tỉnh`,
      ).toBe(true);
      for (const r of m!.rings) {
        expect(r.pts.length / 2).toBeGreaterThanOrEqual(3);
        expect(Math.abs(ringSignedArea(r.pts))).toBeGreaterThan(0);
      }
    }
  });

  it('văn phòng TP.HCM nằm trong TP.HCM và trùng điểm neo tỉnh 79', () => {
    const hcm = map.provinces.find((p) => p.code === '79')!;
    expect(hcm.rings.some((r) => inside(map.hq[0], map.hq[1], r.pts))).toBe(true);
    expect(hcm.anchor).toEqual(map.hq);
  });

  it('hai quần đảo đủ chấm, chấm trong elip nằm trong elip', () => {
    expect(map.archipelagos.map((a) => a.id).sort()).toEqual(archipelagos.map((a) => a.id).sort());
    for (const a of map.archipelagos) {
      expect(a.dots.length).toBeGreaterThanOrEqual(a.id === 'hoang-sa' ? 5 : 20);
      const { cx, cz, rx, rz, rot } = a.ring;
      a.dots.forEach(([x, z], i) => {
        if (!a.inRing[i]) return;
        const u = (x - cx) * Math.cos(rot) + (z - cz) * Math.sin(rot);
        const v = -(x - cx) * Math.sin(rot) + (z - cz) * Math.cos(rot);
        expect(Math.hypot(u / rx, v / rz)).toBeLessThanOrEqual(1.001);
      });
    }
  });

  it('biên ngoài: mỗi arc có cờ, có cả bờ biển lẫn ranh giới trong', () => {
    expect(map.outer).toHaveLength(map.arcs.length);
    expect(map.outer.filter(Boolean).length).toBeGreaterThan(10);
    expect(map.outer.filter((v) => !v).length).toBeGreaterThan(30);
  });
});
