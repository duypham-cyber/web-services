import {
  Color,
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  ShadowMaterial,
  Vector2,
  Vector4,
  type DataTexture,
  type IUniform,
} from 'three';
import { MASK_RECT } from './mask';
import type { ScenePalette } from './palette';
import { KX, LAT0, LON0 } from './projection';
import type { DecodedHeroMap, MapTier } from './types';
import { NOISE_GLSL } from './util';

/** Tâm và bán kính sương biển (đơn vị cảnh) — giữ của bản mẫu, đủ rộng để Trường Sa không chìm trong sương. */
export const MAP_CENTER = new Vector2(1.2, 0.9);
const MIST_R = new Vector2(9.6, 18);

export type SeaUniforms = {
  uTime: IUniform<number>;
  uNight: IUniform<number>;
  uHaze: IUniform<Vector2>;
  /** Tỉ lệ điểm ảnh của renderer: nét elip + lưới tính theo px CSS (không mảnh đi trên màn DPR 2). */
  uPx: IUniform<number>;
};

/**
 * Mặt biển: một mặt phẳng ShaderMaterial (nước sâu → nông theo mặt nạ khoảng cách bờ, bọt sóng sát vách, quầng san hô
 * quanh hai quần đảo, elip nét đứt, lưới kinh vĩ 2°, bóng mây, sương theo bán kính + khoảng cách máy, chuyển đêm).
 * T-LITE: bỏ lưới kinh vĩ, bóng mây và nhiễu bọt động (define SEA_LITE) — phần tốn nhất trên GPU điện thoại.
 */
export function buildSea(map: DecodedHeroMap, palette: ScenePalette, mask: DataTexture, tier: MapTier, shared: SeaUniforms) {
  const arch = map.archipelagos.map((a) => new Vector4(a.ring.cx, a.ring.cz, a.ring.rx, a.ring.rz));
  const archRot = map.archipelagos.map((a) => new Vector2(Math.cos(a.ring.rot), Math.sin(a.ring.rot)));
  const material = new ShaderMaterial({
    defines: tier === 'lite' ? { SEA_LITE: 1 } : {},
    uniforms: {
      uMask: { value: mask },
      uRect: { value: new Vector4(MASK_RECT.x0, MASK_RECT.z0, MASK_RECT.w, MASK_RECT.w) },
      uTime: shared.uTime,
      uNight: shared.uNight,
      uHaze: shared.uHaze,
      uPx: shared.uPx,
      uDeep: { value: palette.seaDeep },
      uMid: { value: palette.seaMid },
      uShallow: { value: palette.seaShallow },
      uMist: { value: palette.seaMist },
      uDeepN: { value: palette.seaDeepNight },
      uMidN: { value: palette.seaMidNight },
      uMistN: { value: palette.seaMistNight },
      uRing: { value: new Color(0xffffff) },
      uC: { value: MAP_CENTER },
      uMistR: { value: MIST_R },
      uArch: { value: arch },
      uArchRot: { value: archRot },
      uKX: { value: KX },
      uLL0: { value: new Vector2(LON0, LAT0) },
    },
    vertexShader: /* glsl */ `varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
uniform sampler2D uMask; uniform vec4 uRect; uniform float uTime, uNight, uKX, uPx;
uniform vec3 uDeep, uMid, uShallow, uMist, uDeepN, uMidN, uMistN, uRing;
uniform vec2 uC, uMistR, uLL0, uHaze; uniform vec4 uArch[2]; uniform vec2 uArchRot[2];
varying vec3 vW;
${NOISE_GLSL}
float dashedEllipse(vec2 p, vec4 e, vec2 cs){
  vec2 d0 = p - e.xy;
  vec2 q = vec2(d0.x * cs.x + d0.y * cs.y, -d0.x * cs.y + d0.y * cs.x) / e.zw;
  float d = length(q);
  if (abs(d - 1.0) > 0.08) return 0.0;
  float w = fwidth(d) * uPx;
  float ring = 1.0 - smoothstep(0.0, w * 1.5, abs(d - 1.0));
  float a = atan(q.y, q.x);
  return ring * step(0.45, fract(a * 9.0));
}
void main(){
  vec2 p = vW.xz;
  vec4 m = texture2D(uMask, (p - uRect.xy) / uRect.zw);
  float t = uTime;
  vec3 deep = mix(uDeep, uDeepN, uNight);
  vec3 mid = mix(uMid, uMidN, uNight);
  vec3 shallow = mix(uShallow, vec3(0.20, 0.50, 0.86), uNight * 0.7);
  vec3 col = mix(deep, mid, smoothstep(0.0, 0.42, m.a));
  col = mix(col, shallow, smoothstep(0.06, 0.55, m.b) * 0.92);
  vec2 pr = mat2(0.866, 0.5, -0.5, 0.866) * p;
  float n1 = vnoise(pr * 1.3 + vec2(t * 0.05, t * 0.03));
#ifdef SEA_LITE
  col *= 0.955 + 0.07 * n1;
  float foam = smoothstep(0.05, 0.36, m.g) * (1.0 - smoothstep(0.32, 0.62, m.r));
  col = mix(col, vec3(1.0), foam * 0.72 * (1.0 - uNight * 0.45));
#else
  float n2 = vnoise(pr * 3.7 - vec2(t * 0.08, -t * 0.05));
  col *= 0.95 + 0.06 * n1 + 0.03 * n2;
  float foam = smoothstep(0.05, 0.36, m.g) * (1.0 - smoothstep(0.32, 0.62, m.r));
  float fn = foam > 0.01 ? vnoise(p * 19.0 + vec2(t * 0.22, 0.0)) : 0.0;
  col = mix(col, vec3(1.0), foam * (0.55 + 0.45 * fn) * (1.0 - uNight * 0.45));
  float cs = smoothstep(0.5, 0.85, vnoise(p * 0.32 + vec2(t * 0.012, 0.0)));
  col *= 1.0 - cs * 0.10 * (1.0 - uNight);
#endif
  col += vec3(0.05, 0.06, 0.05) * (1.0 - smoothstep(1.0, 9.0, length(p - uC))) * (1.0 - uNight);
  float r = length((p - uC) * vec2(1.0, 0.8));
  float mist = smoothstep(uMistR.x, uMistR.y, r);
  float haze = smoothstep(uHaze.x, uHaze.y, distance(cameraPosition, vW)) * 0.6;
  mist = max(mist, haze);
#ifndef SEA_LITE
  vec2 ll = vec2(p.x / uKX + uLL0.x, -p.y + uLL0.y) / 2.0;
  vec2 gd = abs(fract(ll - 0.5) - 0.5) / max(fwidth(ll) * uPx, vec2(1e-4));
  float line = 1.0 - min(min(gd.x, gd.y), 1.0);
  col = mix(col, vec3(1.0), line * 0.045 * (1.0 - mist));
#endif
  float arch = max(dashedEllipse(p, uArch[0], uArchRot[0]), dashedEllipse(p, uArch[1], uArchRot[1]));
  col = mix(col, uRing, arch * 0.85 * (1.0 - mist * 0.6));
  col = mix(col, mix(uMist, uMistN, uNight), mist);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  const geometry = new PlaneGeometry(320, 320);
  geometry.rotateX(-Math.PI / 2);
  const sea = new Mesh(geometry, material);
  sea.renderOrder = -2;
  sea.frustumCulled = false;
  return sea;
}

/** Hứng bóng đổ dưới vách bờ (chỉ T-FULL). */
export function buildShadowCatcher(palette: ScenePalette) {
  const geometry = new PlaneGeometry(30, 30);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new Mesh(geometry, new ShadowMaterial({ color: palette.shadow, opacity: 0.3, depthWrite: false }));
  mesh.position.set(0.5, 0.004, 0);
  mesh.receiveShadow = true;
  mesh.renderOrder = -1;
  return mesh;
}

/** Chấm đảo Hoàng Sa · Trường Sa: trụ sứ thấp + vòng xanh blue-600 trên đỉnh (InstancedMesh, 2 draw call). */
export function buildIslands(map: DecodedHeroMap, palette: ScenePalette, rand: () => number, tier: MapTier) {
  const dots = map.archipelagos.flatMap((a) => a.dots);
  const seg = tier === 'lite' ? 10 : 14;
  const bodyGeo = new CylinderGeometry(0.045, 0.062, 0.2, seg);
  const body = new InstancedMesh(
    bodyGeo,
    new MeshStandardMaterial({ color: palette.landTop, roughness: 0.9, metalness: 0 }),
    dots.length,
  );
  const capGeo = new RingGeometry(0.03, 0.048, seg + 6);
  capGeo.rotateX(-Math.PI / 2);
  const caps = new InstancedMesh(capGeo, new MeshBasicMaterial({ color: palette.outline }), dots.length);
  const m4 = new Matrix4();
  dots.forEach(([x, z], i) => {
    const s = 0.85 + rand() * 0.4;
    m4.makeScale(s, 1, s).setPosition(x, 0, z);
    body.setMatrixAt(i, m4);
    m4.makeScale(s, 1, s).setPosition(x, 0.102, z);
    caps.setMatrixAt(i, m4);
  });
  body.castShadow = tier === 'full';
  body.computeBoundingSphere();
  caps.computeBoundingSphere();
  return { body, caps };
}
