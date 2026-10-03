import {
  CanvasTexture,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  type IUniform,
} from 'three';
import { MAP_CENTER } from './sea';
import type { SeaMask } from './mask';
import { toXZ } from './projection';
import type { DecodedHeroMap, MapTier } from './types';
import { mulberry32 } from './util';

/**
 * Mây thủ tục (contracts/hero-map.md mục 3.8). Bốn texture đốm gradient vẽ trên canvas gộp thành atlas 2×2, MỘT
 * InstancedMesh cho mọi đám mây (1 draw call): trôi nhẹ tính trong vertex shader theo uTime, độ mờ theo loại:
 *   ring  biển mây quanh bản đồ (tránh đất liền + hai quần đảo, dò bằng mặt nạ)   FULL 22 · LITE 12
 *   wisp  dải mỏng trên đất liền, mờ đi khi đang xem một miền                      FULL 5 · LITE 2
 *   fly   mây tiền cảnh, chỉ hiện khi máy đang bay giữa hai miền                  FULL 5 · LITE 0
 * Instance xếp theo độ cao tăng dần (máy luôn nhìn từ trên xuống → mây cao vẽ sau, không cần sort mỗi khung).
 */
export type CloudUniforms = { uTime: IUniform<number>; uNight: IUniform<number> };

const KIND = { ring: 0, wisp: 1, fly: 2 } as const;
type Kind = keyof typeof KIND;

function cloudAtlas(): CanvasTexture {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = S * 2;
  canvas.height = S * 2;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('hero-map: không có canvas 2D');
  for (let tile = 0; tile < 4; tile += 1) {
    const r = mulberry32(17 + tile * 31);
    const ox = (tile % 2) * S;
    const oy = Math.floor(tile / 2) * S;
    g.save();
    g.beginPath();
    g.rect(ox, oy, S, S);
    g.clip();
    for (let i = 0; i < 110; i += 1) {
      const a = r() * Math.PI * 2;
      const d = Math.pow(r(), 0.7);
      const x = ox + S / 2 + Math.cos(a) * d * S * 0.31;
      const y = oy + S / 2 + Math.sin(a) * d * S * 0.2;
      const rad = S * (0.035 + r() * 0.09) * (1.25 - d * 0.6);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,0.5)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.24)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    g.restore();
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

type CloudSpec = { x: number; y: number; z: number; s: number; flip: number; depth: number; op: number; kind: Kind; tile: number };

export function buildClouds(
  map: DecodedHeroMap,
  mask: SeaMask,
  u: CloudUniforms,
  rand: () => number,
  opts: { tier: MapTier; mobile: boolean },
) {
  const lite = opts.tier === 'lite' || opts.mobile;
  const specs: CloudSpec[] = [];
  const add = (x: number, y: number, z: number, s: number, op: number, kind: Kind) => {
    specs.push({ x, y, z, s, flip: rand() < 0.5 ? -1 : 1, depth: 0.8 + rand() * 0.4, op, kind, tile: Math.floor(rand() * 4) });
  };
  const arch = map.archipelagos.map((a) => ({ cx: a.ring.cx, cz: a.ring.cz, rx: a.ring.rx, rz: a.ring.rz }));

  // biển mây quanh bản đồ
  const nRing = lite ? 12 : 22;
  let tries = 0;
  let placed = 0;
  while (placed < nRing && tries < 400) {
    tries += 1;
    const a = rand() * Math.PI * 2;
    const r = 8.2 + rand() * 7.5;
    const x = MAP_CENTER.x + Math.cos(a) * r;
    const z = MAP_CENTER.y + Math.sin(a) * r * 1.12;
    const s = 5 + rand() * 5;
    if (mask.at(x, z, 3) > 0.02) continue;
    if (arch.some((ar) => Math.hypot((x - ar.cx) / (ar.rx + s * 0.4), (z - ar.cz) / (ar.rz + s * 0.3)) < 1)) continue;
    add(x, 0.35 + rand() * 0.6, z, s, 0.55 + rand() * 0.35, 'ring');
    placed += 1;
  }
  // dải mây mỏng trên đất liền (kinh, vĩ độ)
  const wisps: [number, number][] = lite
    ? [
        [104.4, 22.6],
        [107.3, 13.6],
      ]
    : [
        [104.0, 22.8],
        [106.8, 19.2],
        [107.3, 13.8],
        [104.6, 11.6],
        [109.6, 18.2],
      ];
  for (const [lon, lat] of wisps) {
    const [x, z] = toXZ(lon, lat);
    add(x, 1.5 + rand() * 0.8, z, 2.2 + rand() * 1.6, 0.34 + rand() * 0.14, 'wisp');
  }
  // mây tiền cảnh khi bay (chỉ T-FULL desktop)
  if (!lite) {
    const fly: [number, number, number][] = [
      [105.0, 18.6, 4.6],
      [107.6, 18.0, 5.4],
      [107.0, 13.3, 4.8],
      [109.3, 12.9, 5.6],
      [106.0, 13.9, 6.2],
    ];
    for (const [lon, lat, y] of fly) {
      const [x, z] = toXZ(lon, lat);
      add(x, y, z, 4.5 + rand() * 3, 0.85, 'fly');
    }
  }
  specs.sort((a, b) => a.y - b.y);

  const geometry = new PlaneGeometry(1, 0.62);
  geometry.rotateX(-Math.PI / 2);
  const n = specs.length;
  const aOp = new Float32Array(n);
  const aKind = new Float32Array(n);
  const aTile = new Float32Array(n);
  const aPhase = new Float32Array(n);
  const aRank = new Float32Array(n);
  const ringOrder = specs.filter((c) => c.kind === 'ring');
  specs.forEach((c, i) => {
    aOp[i] = c.op;
    aKind[i] = KIND[c.kind];
    aTile[i] = c.tile;
    aPhase[i] = c.z;
    aRank[i] = c.kind === 'ring' ? (ringOrder.indexOf(c) % 2) * 0.5 + 0.25 : 0;
  });
  geometry.setAttribute('aOp', new InstancedBufferAttribute(aOp, 1));
  geometry.setAttribute('aKind', new InstancedBufferAttribute(aKind, 1));
  geometry.setAttribute('aTile', new InstancedBufferAttribute(aTile, 1));
  geometry.setAttribute('aPhase', new InstancedBufferAttribute(aPhase, 1));
  geometry.setAttribute('aRank', new InstancedBufferAttribute(aRank, 1));

  const atlas = cloudAtlas();
  const uniforms = {
    uMap: { value: atlas },
    uTime: u.uTime,
    uNight: u.uNight,
    uSun: { value: new Vector2(-0.8, -0.6) },
    /** x: hệ số mây dải (1 − 0,6·tô miền), y: hệ số mây tiền cảnh (đang bay), z: giữ mây biển có aRank ≤ z (hạ chất lượng). */
    uKind: { value: new Vector2(1, 0) },
    uRingKeep: { value: 1 },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `attribute float aOp, aKind, aTile, aPhase, aRank;
uniform float uTime, uRingKeep; uniform vec2 uKind;
varying vec2 vUv; varying float vFade; varying float vOp; varying vec2 vTile;
void main(){
  // ô atlas tính ở vertex: floor()/mod() trên varying nội suy ở fragment lật ô từng điểm ảnh (vân ca-rô)
  vUv = uv; vTile = vec2(mod(aTile + 0.25, 2.0) - 0.25, floor(aTile * 0.5 + 0.25));
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  float drift = aKind < 0.5 ? sin(uTime * 0.02 + aPhase) * 0.6 : (aKind < 1.5 ? sin(uTime * 0.05 + aPhase) * 0.5 : 0.0);
  w.x += drift;
  float k = aKind < 0.5 ? step(aRank, uRingKeep) : (aKind < 1.5 ? uKind.x : uKind.y);
  vOp = aOp * k;
  vFade = smoothstep(1.5, 5.0, distance(w.xyz, cameraPosition));
  gl_Position = projectionMatrix * viewMatrix * w;
  if (vOp < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`,
    fragmentShader: /* glsl */ `uniform sampler2D uMap; uniform float uNight; uniform vec2 uSun;
varying vec2 vUv; varying float vFade; varying float vOp; varying vec2 vTile;
vec2 tileUv(vec2 uv){ return (floor(vTile + 0.5) + clamp(uv, 0.004, 0.996)) * 0.5; }
void main(){
  float a = texture2D(uMap, tileUv(vUv)).a;
  float a2 = texture2D(uMap, tileUv(vUv + uSun * 0.045)).a;
  float lit = clamp(0.56 + (a - a2) * 3.6, 0.0, 1.0);
  vec3 col = mix(vec3(0.74, 0.81, 0.93), vec3(1.0), lit);
  col = mix(col, col * vec3(0.42, 0.52, 0.80), uNight * 0.75);
  float alpha = smoothstep(0.03, 0.8, a) * vOp * vFade * (1.0 - uNight * 0.6);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
    transparent: true,
    depthWrite: false,
    // lật ngang bằng scale âm theo từng instance → mặt sau; vẽ cả hai mặt
    side: DoubleSide,
  });
  const mesh = new InstancedMesh(geometry, material, n);
  const m4 = new Matrix4();
  specs.forEach((c, i) => {
    m4.makeScale(c.s * c.flip, 1, c.s * c.depth).setPosition(c.x, c.y, c.z);
    mesh.setMatrixAt(i, m4);
  });
  mesh.renderOrder = 8;
  mesh.frustumCulled = false;

  return {
    mesh,
    texture: atlas,
    uniforms,
    counts: { ring: placed, wisp: wisps.length, fly: lite ? 0 : 5 },
  };
}
