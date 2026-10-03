import type { DecodedHeroMap, MapArchipelago, MapProvince, MapRing, RawHeroMap } from './types';

export const HERO_MAP_URL = '/data/hero-map.json';

/** Tải + kiểm sơ bộ hero-map.json (không kéo Zod vào chunk 3D: chỉ kiểm phiên bản và các trường bắt buộc). */
export async function loadHeroMap(url = HERO_MAP_URL, signal?: AbortSignal): Promise<RawHeroMap> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`hero-map: HTTP ${res.status}`);
  const raw = (await res.json()) as RawHeroMap;
  if (raw.v !== 1 || !Array.isArray(raw.arcs) || raw.provinces?.length !== 34 || raw.archipelagos?.length !== 2) {
    throw new Error('hero-map: dữ liệu sai định dạng');
  }
  return raw;
}

export function decodeHeroMap(raw: RawHeroMap): DecodedHeroMap {
  const k = 1 / raw.quant;
  const arcs = raw.arcs.map((flat) => {
    const out = new Float32Array(flat.length);
    let x = 0;
    let z = 0;
    for (let i = 0; i < flat.length; i += 2) {
      x = i === 0 ? flat[0]! : x + flat[i]!;
      z = i === 0 ? flat[1]! : z + flat[i + 1]!;
      out[i] = x * k;
      out[i + 1] = z * k;
    }
    return out;
  });
  const outer = Array.from(raw.outer, (c) => c === '1');

  const ring = (refs: number[], islet: boolean): MapRing => {
    const xs: number[] = [];
    const flags: number[] = [];
    for (const ref of refs) {
      const idx = ref < 0 ? ~ref : ref;
      const a = arcs[idx];
      if (!a) throw new Error(`hero-map: arc ${idx} không tồn tại`);
      const n = a.length / 2;
      const isOuter = outer[idx] ? 1 : 0;
      // điểm đầu arc trùng điểm cuối arc trước → bỏ (trừ arc đầu tiên)
      for (let j = xs.length === 0 ? 0 : 1; j < n; j += 1) {
        const p = ref < 0 ? n - 1 - j : j;
        xs.push(a[p * 2]!, a[p * 2 + 1]!);
        if (xs.length > 2) flags.push(isOuter);
      }
    }
    // khép vòng: điểm cuối trùng điểm đầu → bỏ, cạnh cuối (n-1 → 0) thuộc arc cuối
    const m = xs.length / 2;
    if (m > 1 && xs[0] === xs[(m - 1) * 2] && xs[1] === xs[(m - 1) * 2 + 1]) xs.length -= 2;
    const pts = new Float32Array(xs);
    const count = pts.length / 2;
    const edge = new Uint8Array(count);
    for (let i = 0; i < count; i += 1) edge[i] = flags[i] ?? flags[flags.length - 1] ?? 0;
    return { pts, outer: edge, islet };
  };

  const provinces: MapProvince[] = raw.provinces.map((p) => ({
    code: p.code,
    region: p.region,
    anchor: [p.anchor[0] * k, p.anchor[1] * k],
    rings: p.rings.map((refs, i) => ring(refs, p.islet?.[i] === 1)),
  }));

  const archipelagos: MapArchipelago[] = raw.archipelagos.map((a) => ({
    id: a.id,
    dots: a.dots.map(([x, z]) => [x * k, z * k] as [number, number]),
    inRing: a.inRing.map((v) => v === 1),
    ring: { cx: a.ring[0] * k, cz: a.ring[1] * k, rx: a.ring[2] * k, rz: a.ring[3] * k, rot: a.ring[4] },
    label: [a.label[0] * k, a.label[1] * k],
  }));

  return {
    provinces,
    arcs,
    outer,
    hq: [raw.hq[0] * k, raw.hq[1] * k],
    sea: [raw.sea[0] * k, raw.sea[1] * k],
    archipelagos,
    bbox: [raw.bbox[0] * k, raw.bbox[1] * k, raw.bbox[2] * k, raw.bbox[3] * k],
    minimap: raw.minimap,
  };
}

/** Diện tích có dấu của vòng (x,z xen kẽ). Dương = ngược chiều kim đồng hồ khi nhìn từ trên (trục z hướng xuống màn hình). */
export function ringSignedArea(pts: Float32Array): number {
  let a = 0;
  const n = pts.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) a += pts[j * 2]! * pts[i * 2 + 1]! - pts[i * 2]! * pts[j * 2 + 1]!;
  return a / 2;
}
