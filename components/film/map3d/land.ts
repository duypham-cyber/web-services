import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  MeshStandardMaterial,
  ShapeUtils,
  Vector2,
  Vector4,
  type DataTexture,
  type IUniform,
} from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { ISLET_TOP, LAND_BASE, LAND_TOP } from './projection';
import { MASK_RECT } from './mask';
import { ringSignedArea } from './data';
import type { ScenePalette } from './palette';
import type { DecodedHeroMap } from './types';
import { NOISE_GLSL } from './util';

export type LandUniforms = {
  /** Trọng số tô sáng 3 miền (Bắc, Trung, Nam) theo cảnh tour. */
  uRegionW: IUniform<Vector4>;
  uTint: IUniform<Color>;
  uMask: IUniform<DataTexture>;
  uRect: IUniform<Vector4>;
};

/**
 * Khối đất liền: mặt trên tam giác hoá theo TỪNG TỈNH (thuộc tính aRegion để tô sáng miền đúng ranh giới tỉnh thật),
 * vách chỉ dựng dọc biên ngoài (bờ biển + biên giới) — ranh giới trong không có vách thừa.
 */
export function buildLand(map: DecodedHeroMap, palette: ScenePalette, mask: DataTexture, mobile: boolean) {
  const uniforms: LandUniforms = {
    uRegionW: { value: new Vector4(0, 0, 0, 0) },
    uTint: { value: palette.landTint.clone() },
    uMask: { value: mask },
    uRect: { value: new Vector4(MASK_RECT.x0, MASK_RECT.z0, MASK_RECT.w, MASK_RECT.w) },
  };

  // ---------------------------------------------------------------- mặt trên
  const topPos: number[] = [];
  const topRegion: number[] = [];
  for (const prov of map.provinces) {
    for (const ring of prov.rings) {
      const p = ring.pts;
      const y = ring.islet ? ISLET_TOP : LAND_TOP;
      const contour: Vector2[] = [];
      for (let i = 0; i < p.length; i += 2) contour.push(new Vector2(p[i], p[i + 1]));
      const faces = ShapeUtils.triangulateShape(contour, []);
      for (const [a, b, c] of faces as [number, number, number][]) {
        const A = contour[a]!;
        const B = contour[b]!;
        const C = contour[c]!;
        // pháp tuyến hướng lên (+y): (B−A)×(C−A) có thành phần y = (Bz−Az)(Cx−Ax) − (Bx−Ax)(Cz−Az) > 0
        const up = (B.y - A.y) * (C.x - A.x) - (B.x - A.x) * (C.y - A.y) > 0;
        const tri = up ? [A, B, C] : [A, C, B];
        for (const v of tri) {
          topPos.push(v.x, y, v.y);
          topRegion.push(prov.region);
        }
      }
    }
  }
  const topGeo = new BufferGeometry();
  topGeo.setAttribute('position', new BufferAttribute(new Float32Array(topPos), 3));
  const normals = new Float32Array(topPos.length);
  for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
  topGeo.setAttribute('normal', new BufferAttribute(normals, 3));
  topGeo.setAttribute('aRegion', new BufferAttribute(new Float32Array(topRegion), 1));

  const topMat = new MeshStandardMaterial({ color: palette.landTop, roughness: 0.9, metalness: 0 });
  topMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aRegion;\nvarying float vRegion;\nvarying vec3 vWP;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvRegion = aRegion;\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying float vRegion; varying vec3 vWP;
uniform vec4 uRegionW; uniform vec3 uTint; uniform sampler2D uMask; uniform vec4 uRect;
${NOISE_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
  float nn = vnoise(vWP.xz * 2.4) * 0.5 + vnoise(vWP.xz * 7.0) * 0.32 + vnoise(vWP.xz * 21.0) * 0.18;
  diffuseColor.rgb *= 0.97 + 0.045 * nn;
  float rimG = texture2D(uMask, (vWP.xz - uRect.xy) / uRect.zw).g;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), (1.0 - smoothstep(0.62, 0.97, rimG)) * 0.55 * step(0.1, vWP.y));
  vec3 oh = vec3(1.0 - step(0.5, vRegion), step(0.5, vRegion) * (1.0 - step(1.5, vRegion)), step(1.5, vRegion));
  float fz = dot(oh, uRegionW.xyz);
  diffuseColor.rgb *= 1.0 - 0.15 * uRegionW.w * (1.0 - fz);
  diffuseColor.rgb = mix(diffuseColor.rgb, uTint, fz * uRegionW.w * 0.55);`,
      );
  };
  const top = new Mesh(topGeo, topMat);
  top.receiveShadow = true;
  top.castShadow = true;

  // ---------------------------------------------------------------- vách (chỉ biên ngoài)
  const wallPos: number[] = [];
  const wallNrm: number[] = [];
  const COS_SMOOTH = Math.cos((50 * Math.PI) / 180);
  for (const prov of map.provinces) {
    for (const ring of prov.rings) {
      const p = ring.pts;
      const n = p.length / 2;
      const yTop = ring.islet ? ISLET_TOP : LAND_TOP;
      const s = ringSignedArea(p) > 0 ? 1 : -1;
      // pháp tuyến ngoài của từng cạnh i → i+1: s·(dz, −dx)
      const en: [number, number][] = [];
      for (let i = 0; i < n; i += 1) {
        const j = (i + 1) % n;
        const dx = p[j * 2]! - p[i * 2]!;
        const dz = p[j * 2 + 1]! - p[i * 2 + 1]!;
        const l = Math.hypot(dx, dz) || 1;
        en.push([(s * dz) / l, (-s * dx) / l]);
      }
      const vertexNormal = (edge: number, other: number): [number, number] => {
        const a = en[edge]!;
        const b = en[other]!;
        if (!ring.outer[other] || a[0] * b[0] + a[1] * b[1] < COS_SMOOTH) return a;
        const x = a[0] + b[0];
        const z = a[1] + b[1];
        const l = Math.hypot(x, z) || 1;
        return [x / l, z / l];
      };
      for (let i = 0; i < n; i += 1) {
        if (!ring.outer[i]) continue;
        const j = (i + 1) % n;
        const ax = p[i * 2]!;
        const az = p[i * 2 + 1]!;
        const bx = p[j * 2]!;
        const bz = p[j * 2 + 1]!;
        const na = vertexNormal(i, (i - 1 + n) % n);
        const nb = vertexNormal(i, j);
        // hai tam giác: (aTop, aBot, bBot), (aTop, bBot, bTop) — hướng ra ngoài
        const quad: [number, number, number, [number, number]][] = [
          [ax, yTop, az, na],
          [ax, LAND_BASE, az, na],
          [bx, LAND_BASE, bz, nb],
          [ax, yTop, az, na],
          [bx, LAND_BASE, bz, nb],
          [bx, yTop, bz, nb],
        ];
        // kiểm hướng mặt: pháp tuyến hình học của tam giác đầu phải cùng chiều pháp tuyến ngoài
        const gx = (az - bz) * (yTop - LAND_BASE);
        const gz = (bx - ax) * (yTop - LAND_BASE);
        const flip = gx * en[i]![0] + gz * en[i]![1] < 0;
        const order = flip ? [0, 2, 1, 3, 5, 4] : [0, 1, 2, 3, 4, 5];
        for (const k of order) {
          const [x, y, z, nn] = quad[k]!;
          wallPos.push(x, y, z);
          wallNrm.push(nn[0], 0, nn[1]);
        }
      }
    }
  }
  const wallGeo = new BufferGeometry();
  wallGeo.setAttribute('position', new BufferAttribute(new Float32Array(wallPos), 3));
  wallGeo.setAttribute('normal', new BufferAttribute(new Float32Array(wallNrm), 3));
  const sideMat = new MeshStandardMaterial({ color: palette.landSide, roughness: 0.86, metalness: 0 });
  const depth = LAND_TOP.toFixed(3);
  sideMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace(
      '#include <color_fragment>',
      `#include <color_fragment>
  float hh = clamp(vWP.y / ${depth}, 0.0, 1.0);
  diffuseColor.rgb *= mix(0.74, 1.0, smoothstep(0.0, 0.95, hh));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.70, 0.82, 0.97), (1.0 - hh) * 0.30);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), smoothstep(0.86, 1.0, hh) * 0.35);`,
    );
  };
  const walls = new Mesh(wallGeo, sideMat);
  walls.castShadow = true;
  walls.receiveShadow = true;

  // ---------------------------------------------------------------- viền xanh (biên ngoài) + ranh giới tỉnh
  const outerSeg: number[] = [];
  for (const prov of map.provinces) {
    for (const ring of prov.rings) {
      const p = ring.pts;
      const n = p.length / 2;
      const y = (ring.islet ? ISLET_TOP : LAND_TOP) + 0.004;
      for (let i = 0; i < n; i += 1) {
        if (!ring.outer[i]) continue;
        const j = (i + 1) % n;
        outerSeg.push(p[i * 2]!, y, p[i * 2 + 1]!, p[j * 2]!, y, p[j * 2 + 1]!);
      }
    }
  }
  const innerSeg: number[] = [];
  map.arcs.forEach((a, idx) => {
    if (map.outer[idx]) return;
    for (let i = 0; i + 3 < a.length; i += 2) innerSeg.push(a[i]!, LAND_TOP + 0.003, a[i + 1]!, a[i + 2]!, LAND_TOP + 0.003, a[i + 3]!);
  });
  const outline = makeLines(outerSeg, palette.outline, mobile ? 1.3 : 1.6, 1);
  const borders = makeLines(innerSeg, palette.border, mobile ? 0.7 : 0.9, 0.75);
  outline.renderOrder = 2;
  borders.renderOrder = 1;

  return { top, walls, outline, borders, uniforms, lineMaterials: [outline.material, borders.material] };
}

function makeLines(seg: number[], color: Color, width: number, opacity: number) {
  const g = new LineSegmentsGeometry();
  g.setPositions(seg);
  const m = new LineMaterial({ color: color.getHex(), linewidth: width, transparent: opacity < 1, opacity, depthWrite: false });
  return new LineSegments2(g, m);
}
