import {
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  type IUniform,
} from 'three';
import { LAND_TOP } from './projection';
import type { ScenePalette } from './palette';
import type { DecodedHeroMap, MapTier } from './types';

export const PIN_Y = LAND_TOP + 0.002;
export const PIN_H = 0.13;
export const HQ_PIN_H = 0.26;

/** Ghim 34 tỉnh (văn phòng TP.HCM là ghim lớn) + vòng sóng phát nhịp + cột sáng văn phòng. */
export function buildPins(
  map: DecodedHeroMap,
  palette: ScenePalette,
  time: IUniform<number>,
  rand: () => number,
  tier: MapTier,
) {
  const lite = tier === 'lite';
  const pins = map.provinces.map((p) => ({ x: p.anchor[0], z: p.anchor[1], hq: p.code === '79' }));
  const m4 = new Matrix4();

  const stemG = new CylinderGeometry(0.0055, 0.0055, 1, 6);
  stemG.translate(0, 0.5, 0);
  const stems = new InstancedMesh(stemG, new MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), pins.length);
  const headG = lite ? new SphereGeometry(0.038, 10, 7) : new SphereGeometry(0.038, 14, 10);
  const heads = new InstancedMesh(
    headG,
    new MeshStandardMaterial({ color: palette.pin, emissive: 0xff6a00, emissiveIntensity: 0.32, roughness: 0.32 }),
    pins.length,
  );
  const baseG = new CircleGeometry(0.05, lite ? 16 : 24);
  baseG.rotateX(-Math.PI / 2);
  const bases = new InstancedMesh(
    baseG,
    new MeshBasicMaterial({ color: palette.pin, transparent: true, opacity: 0.35, depthWrite: false }),
    pins.length,
  );
  pins.forEach((p, i) => {
    const h = p.hq ? HQ_PIN_H : PIN_H;
    m4.makeScale(p.hq ? 1.8 : 1, h, p.hq ? 1.8 : 1).setPosition(p.x, PIN_Y, p.z);
    stems.setMatrixAt(i, m4);
    const s = p.hq ? 2.3 : 1;
    m4.makeScale(s, s, s).setPosition(p.x, PIN_Y + h, p.z);
    heads.setMatrixAt(i, m4);
    m4.makeScale(s, 1, s).setPosition(p.x, PIN_Y + 0.001, p.z);
    bases.setMatrixAt(i, m4);
  });
  stems.castShadow = !lite;
  heads.castShadow = !lite;
  for (const m of [stems, heads, bases]) m.computeBoundingSphere();

  // vòng sóng: mỗi ghim 2 vòng lệch pha, văn phòng thêm 3 vòng lớn
  const ringG = new PlaneGeometry(1, 1);
  ringG.rotateX(-Math.PI / 2);
  const per = 2;
  const extraHQ = 3;
  const count = pins.length * per + extraHQ;
  const aPhase = new Float32Array(count);
  const aScale = new Float32Array(count);
  const rings = new InstancedMesh(
    ringG,
    new ShaderMaterial({
      uniforms: { uTime: time, uColor: { value: palette.pin } },
      vertexShader: /* glsl */ `attribute float aPhase; attribute float aScale; uniform float uTime; varying vec2 vUv; varying float vT;
void main(){ vUv = uv; float t = fract(uTime * 0.38 + aPhase); vT = t;
  vec3 p = position * aScale * (0.18 + t);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.0); }`,
      fragmentShader: /* glsl */ `uniform vec3 uColor; varying vec2 vUv; varying float vT;
void main(){ float r = length(vUv - 0.5) * 2.0;
  float ring = smoothstep(0.70, 0.88, r) * (1.0 - smoothstep(0.88, 1.0, r));
  float a = ring * pow(1.0 - vT, 1.4) * 0.95;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}`,
      transparent: true,
      depthWrite: false,
    }),
    count,
  );
  let k = 0;
  const hq = pins.find((p) => p.hq) ?? pins[0]!;
  for (const p of pins) {
    const ph = rand();
    for (let j = 0; j < per; j += 1) {
      m4.makeTranslation(p.x, PIN_Y + 0.003, p.z);
      rings.setMatrixAt(k, m4);
      aPhase[k] = ph + j / per;
      aScale[k] = p.hq ? 0.9 : 0.42;
      k += 1;
    }
  }
  for (let j = 0; j < extraHQ; j += 1) {
    m4.makeTranslation(hq.x, PIN_Y + 0.004, hq.z);
    rings.setMatrixAt(k, m4);
    aPhase[k] = j / extraHQ + 0.17;
    aScale[k] = 1.7;
    k += 1;
  }
  ringG.setAttribute('aPhase', new InstancedBufferAttribute(aPhase, 1));
  ringG.setAttribute('aScale', new InstancedBufferAttribute(aScale, 1));
  rings.renderOrder = 3;
  rings.frustumCulled = false;

  // cột sáng văn phòng
  const beamG = new CylinderGeometry(0.05, 0.05, 1.5, lite ? 16 : 24, 1, true);
  beamG.translate(0, 0.75, 0);
  const beam = new Mesh(
    beamG,
    new ShaderMaterial({
      uniforms: { uTime: time },
      vertexShader: /* glsl */ `varying vec2 vUv; varying float vF;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vec3 n = normalize(normalMatrix * normal);
  vF = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `uniform float uTime; varying vec2 vUv; varying float vF;
void main(){ float a = pow(1.0 - vUv.y, 2.2) * 0.55 * pow(vF, 1.5);
  a *= 0.85 + 0.15 * sin(uTime * 3.0 - vUv.y * 12.0);
  vec3 col = mix(vec3(1.0, 0.56, 0.18), vec3(1.0, 0.86, 0.66), vUv.y);
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    }),
  );
  beam.position.set(hq.x, PIN_Y, hq.z);
  beam.renderOrder = 4;

  return { stems, heads, bases, rings, beam, hq: { x: hq.x, z: hq.z } };
}
