import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  Points,
  QuadraticBezierCurve3,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
  type Color,
  type IUniform,
} from 'three';
import { HQ_PIN_H, PIN_H, PIN_Y } from './pins';
import type { ScenePalette } from './palette';
import type { DecodedHeroMap, MapTier } from './types';
import { smoothstep } from './util';

/**
 * 33 đường cung điều phối từ văn phòng TP.HCM tới tâm 33 tỉnh còn lại (TRANG TRÍ — không phải dữ liệu đơn thật,
 * contracts/hero-map.md AC-HM-5). Gộp thành 2 mesh ống (lõi + quầng), shader vẽ "đuôi sao chổi" chạy theo uTime;
 * 66 chấm sáng (Points) chạy đúng vị trí đầu sao chổi.
 */
export type ArcUniforms = { uTime: IUniform<number>; uNight: IUniform<number> };

type Arc = { curve: QuadraticBezierCurve3; seed: number; speed: number };

/** Gộp các BufferGeometry có index và cùng tập thuộc tính (thay mergeGeometries của addon — chunk nhỏ hơn). */
function mergeIndexed(geos: BufferGeometry[], names: string[]): BufferGeometry {
  const out = new BufferGeometry();
  let vCount = 0;
  let iCount = 0;
  for (const g of geos) {
    vCount += g.getAttribute('position').count;
    iCount += g.getIndex()!.count;
  }
  for (const name of names) {
    const size = geos[0]!.getAttribute(name).itemSize;
    const arr = new Float32Array(vCount * size);
    let off = 0;
    for (const g of geos) {
      const a = g.getAttribute(name).array as Float32Array;
      arr.set(a, off);
      off += a.length;
    }
    out.setAttribute(name, new BufferAttribute(arr, size));
  }
  const index = vCount > 65535 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  let io = 0;
  let base = 0;
  for (const g of geos) {
    const idx = g.getIndex()!.array;
    for (let i = 0; i < idx.length; i += 1) index[io + i] = idx[i]! + base;
    io += idx.length;
    base += g.getAttribute('position').count;
  }
  out.setIndex(new BufferAttribute(index, 1));
  out.computeBoundingSphere();
  return out;
}

const ARC_VS = /* glsl */ `attribute float aSeed; attribute float aSpeed;
varying float vT; varying float vSeed; varying float vSpeed; varying float vF; varying float vD;
void main(){ vT = uv.x; vSeed = aSeed; vSpeed = aSpeed; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z;
  vec3 n = normalize(normalMatrix * normal); vF = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`;

const arcFS = (glow: boolean) => /* glsl */ `uniform float uTime, uNight; uniform vec3 uA, uB, uHead;
varying float vT; varying float vSeed; varying float vSpeed; varying float vF; varying float vD;
void main(){
  float h1 = fract(uTime * vSpeed + vSeed), h2 = fract(uTime * vSpeed + vSeed + 0.5);
  float d1 = fract(h1 - vT + 1.0), d2 = fract(h2 - vT + 1.0);
  float tail = clamp(exp(-d1 * 16.0) + exp(-d2 * 16.0), 0.0, 1.0);
  vec3 col = mix(uA, uB, smoothstep(0.0, 1.0, vT));
  col = mix(col, uHead, tail * 0.9);
  float ends = smoothstep(0.0, 0.025, vT) * smoothstep(1.0, 0.975, vT);
  ${
    glow
      ? 'float a = pow(vF, 2.0) * (0.11 + 0.55 * tail) * (1.0 + uNight * 0.8) * smoothstep(3.0, 10.0, vD) * mix(0.8, 1.6, smoothstep(14.0, 32.0, vD));'
      : 'float a = (0.62 + 0.38 * tail) * smoothstep(0.0, 0.4, vF) * mix(0.4, 1.0, smoothstep(2.5, 9.0, vD));'
  }
  a *= ends;
  if (a < 0.003) discard;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function arcMaterial(glow: boolean, u: ArcUniforms, a: Color, b: Color, head: Color) {
  return new ShaderMaterial({
    uniforms: { uTime: u.uTime, uNight: u.uNight, uA: { value: a }, uB: { value: b }, uHead: { value: head } },
    vertexShader: ARC_VS,
    fragmentShader: arcFS(glow),
    transparent: true,
    depthWrite: false,
  });
}

export function buildArcs(
  map: DecodedHeroMap,
  palette: ScenePalette,
  u: ArcUniforms,
  rand: () => number,
  opts: { tier: MapTier; mobile: boolean },
) {
  const lite = opts.tier === 'lite';
  const hqProv = map.provinces.find((p) => p.code === '79');
  if (!hqProv) throw new Error('hero-map: thiếu TP.HCM (79)');
  const hqTop = new Vector3(map.hq[0], PIN_Y + HQ_PIN_H, map.hq[1]);
  const arcs: Arc[] = [];
  const cores: TubeGeometry[] = [];
  const glows: TubeGeometry[] = [];
  for (const p of map.provinces) {
    if (p.code === '79') continue;
    const a = hqTop.clone();
    const b = new Vector3(p.anchor[0], PIN_Y + PIN_H, p.anchor[1]);
    const dist = Math.hypot(b.x - a.x, b.z - a.z);
    const h = (0.2 + dist * 0.13) * (0.8 + rand() * 0.45);
    const c = a.clone().lerp(b, 0.5);
    c.y += h * 2;
    const side = new Vector3(-(b.z - a.z), 0, b.x - a.x).normalize();
    c.addScaledVector(side, (rand() - 0.5) * dist * 0.34);
    const curve = new QuadraticBezierCurve3(a, c, b);
    const seed = rand();
    const speed = 0.36 / (0.8 + dist) + 0.03;
    arcs.push({ curve, seed, speed });
    const seg = Math.max(lite ? 20 : 28, Math.round((lite ? 20 : 30) + dist * (lite ? 5 : 7)));
    const specs: [TubeGeometry[], number, number][] = [
      [cores, opts.mobile ? 0.012 : 0.0095, lite ? 3 : 4],
      [glows, 0.042, lite ? 4 : 5],
    ];
    for (const [arr, rad, rs] of specs) {
      const tg = new TubeGeometry(curve, seg, rad, rs, false);
      const n = tg.getAttribute('position').count;
      tg.setAttribute('aSeed', new BufferAttribute(new Float32Array(n).fill(seed), 1));
      tg.setAttribute('aSpeed', new BufferAttribute(new Float32Array(n).fill(speed), 1));
      arr.push(tg);
    }
  }
  const names = ['position', 'normal', 'uv', 'aSeed', 'aSpeed'];
  const glowMesh = new Mesh(mergeIndexed(glows, names), arcMaterial(true, u, palette.arcA, palette.arcB, palette.arcHead));
  const coreMesh = new Mesh(mergeIndexed(cores, names), arcMaterial(false, u, palette.arcA, palette.arcB, palette.arcHead));
  glows.concat(cores).forEach((g) => g.dispose());
  glowMesh.renderOrder = 5;
  coreMesh.renderOrder = 6;

  // chấm sáng chạy dọc đường cung
  const dotPos = new Float32Array(arcs.length * 2 * 3);
  const dotVis = new Float32Array(arcs.length * 2);
  const dotsGeo = new BufferGeometry();
  dotsGeo.setAttribute('position', new BufferAttribute(dotPos, 3));
  dotsGeo.setAttribute('aVis', new BufferAttribute(dotVis, 1));
  const dotsMat = new ShaderMaterial({
    uniforms: { uPR: { value: 1 }, uK: { value: opts.mobile ? 220 : 300 } },
    vertexShader: /* glsl */ `uniform float uPR, uK; attribute float aVis; varying float vVis;
void main(){ vVis = aVis; vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = clamp(uK / -mv.z, 7.0, 26.0) * uPR; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `varying float vVis;
void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0;
  float core = 1.0 - smoothstep(0.12, 0.3, d); float halo = 1.0 - smoothstep(0.2, 1.0, d);
  vec3 col = mix(vec3(1.0, 0.55, 0.15), vec3(1.0, 0.98, 0.94), core);
  float a = max(core, halo * halo * 0.6) * vVis;
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`,
    transparent: true,
    depthWrite: false,
  });
  const dots = new Points(dotsGeo, dotsMat);
  dots.renderOrder = 7;
  dots.frustumCulled = false;
  const tmp = new Vector3();

  /** Đặt 66 chấm theo thời gian t (giây) — cùng công thức đầu sao chổi trong shader. */
  function update(t: number) {
    arcs.forEach((a, i) => {
      for (let j = 0; j < 2; j += 1) {
        const h = (((t * a.speed + a.seed + j * 0.5) % 1) + 1) % 1;
        a.curve.getPoint(h, tmp);
        dotPos[(i * 2 + j) * 3] = tmp.x;
        dotPos[(i * 2 + j) * 3 + 1] = tmp.y;
        dotPos[(i * 2 + j) * 3 + 2] = tmp.z;
        dotVis[i * 2 + j] = smoothstep(0, 0.04, h) * (1 - smoothstep(0.96, 1, h));
      }
    });
    dotsGeo.getAttribute('position').needsUpdate = true;
    dotsGeo.getAttribute('aVis').needsUpdate = true;
  }

  return { glow: glowMesh, core: coreMesh, dots, dotsMaterial: dotsMat, update, count: arcs.length };
}
