import { DataTexture, LinearFilter, RGBAFormat, UnsignedByteType } from 'three';
import type { DecodedHeroMap } from './types';
import { yieldToMain } from './util';

/**
 * Mặt nạ khoảng cách tới bờ cho shader biển (nước nông, bọt sóng, quầng san hô) và viền sáng mép đất.
 * Bản mẫu vẽ canvas với ctx.filter = blur() (Safari cũ không có) — ở đây tính biến đổi khoảng cách Euclid chính xác
 * (Felzenszwalb–Huttenlocher) rồi đổi ra 4 kênh "như làm mờ Gauss" σ = 1,2 / 5 / 15 / 44 px@1024:
 *   r: mép bờ sắc · g: dải bọt sóng + viền sáng mép đất · b: nước nông · a: nước vừa.
 * Chấm đảo hai quần đảo cộng thêm quầng (kênh b, a rộng hơn) → vòng nước nông quanh từng đảo.
 */
export const MASK_RECT = { x0: -14, z0: -14, w: 30 } as const;
const SIGMA_WORLD = [1.2, 5, 15, 44].map((s) => (s * MASK_RECT.w) / 1024);
const DOT_RADIUS_WORLD = [2.6, 2.6, 13, 15].map((r) => (r * MASK_RECT.w) / 1024);

export type SeaMask = {
  texture: DataTexture;
  n: number;
  /** Giá trị kênh ch (0..1) tại toạ độ cảnh — dùng khi đặt mây tránh đất liền. */
  at(x: number, z: number, ch: 0 | 1 | 2 | 3): number;
};

const INF = 1e20;

/** Biến đổi khoảng cách bình phương 1D (Felzenszwalb–Huttenlocher), O(n). */
function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q += 1) {
    let vk = v[k]!;
    let s = (f[q]! + q * q - (f[vk]! + vk * vk)) / (2 * q - 2 * vk);
    while (s <= z[k]!) {
      k -= 1;
      vk = v[k]!;
      s = (f[q]! + q * q - (f[vk]! + vk * vk)) / (2 * q - 2 * vk);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1]! < q) k += 1;
    const vk = v[k]!;
    d[q] = (q - vk) * (q - vk) + f[vk]!;
  }
}

/** Khoảng cách Euclid (px) từ mỗi ô tới ô "nguồn" gần nhất (grid: 1 = nguồn). */
function edt2d(src: Uint8Array, n: number): Float32Array {
  const g = new Float64Array(n * n);
  for (let i = 0; i < n * n; i += 1) g[i] = src[i] ? 0 : INF;
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < n; x += 1) {
    for (let y = 0; y < n; y += 1) f[y] = g[y * n + x]!;
    edt1d(f, n, d, v, z);
    for (let y = 0; y < n; y += 1) g[y * n + x] = d[y]!;
  }
  const out = new Float32Array(n * n);
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) f[x] = g[y * n + x]!;
    edt1d(f, n, d, v, z);
    for (let x = 0; x < n; x += 1) out[y * n + x] = Math.sqrt(d[x]!);
  }
  return out;
}

/** Φ(−x) ≈ 1/(1 + e^(1,702x)) — phần còn lại của Gauss, đủ cho hiệu ứng nước. */
const gaussTail = (x: number) => (x > 8 ? 0 : x < -8 ? 1 : 1 / (1 + Math.exp(1.702 * x)));

export async function buildSeaMask(map: DecodedHeroMap, n: number, signal?: AbortSignal): Promise<SeaMask> {
  const { x0, z0, w } = MASK_RECT;
  const px = n / w;
  // 1) tô đất liền + đảo ven bờ (canvas 2D, không dùng filter)
  const canvas = document.createElement('canvas');
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('hero-map: không có canvas 2D');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, n, n);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  for (const prov of map.provinces) {
    for (const ring of prov.rings) {
      const p = ring.pts;
      for (let i = 0; i < p.length; i += 2) {
        const X = (p[i]! - x0) * px;
        const Y = (p[i + 1]! - z0) * px;
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      }
      ctx.closePath();
    }
  }
  ctx.fill('nonzero');
  const img = ctx.getImageData(0, 0, n, n).data;
  const land = new Uint8Array(n * n);
  const water = new Uint8Array(n * n);
  for (let i = 0; i < n * n; i += 1) {
    const on = img[i * 4]! > 127 ? 1 : 0;
    land[i] = on;
    water[i] = on ? 0 : 1;
  }
  canvas.width = 1; // giải phóng bộ nhớ canvas
  await yieldToMain(signal);

  // 2) khoảng cách có dấu tới bờ (dương ngoài biển) + khoảng cách tới tâm chấm đảo
  const dOut = edt2d(land, n);
  await yieldToMain(signal);
  const dIn = edt2d(water, n);
  await yieldToMain(signal);
  const dots = new Uint8Array(n * n);
  for (const a of map.archipelagos) {
    for (const [x, z] of a.dots) {
      const i = Math.floor((x - x0) * px);
      const j = Math.floor((z - z0) * px);
      if (i >= 0 && j >= 0 && i < n && j < n) dots[j * n + i] = 1;
    }
  }
  const dDot = edt2d(dots, n);
  await yieldToMain(signal);

  // 3) 4 kênh
  const sig = SIGMA_WORLD.map((s) => s * px);
  const rad = DOT_RADIUS_WORLD.map((r) => r * px);
  const data = new Uint8Array(n * n * 4);
  for (let i = 0; i < n * n; i += 1) {
    const d = land[i] ? -(dIn[i]! - 0.5) : dOut[i]! - 0.5;
    const dd = dDot[i]!;
    for (let ch = 0; ch < 4; ch += 1) {
      const s = sig[ch]!;
      const v = Math.max(gaussTail(d / s), gaussTail((dd - rad[ch]!) / s));
      data[i * 4 + ch] = Math.round(v * 255);
    }
  }

  const texture = new DataTexture(data, n, n, RGBAFormat, UnsignedByteType);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return {
    texture,
    n,
    at(x, z, ch) {
      const i = Math.floor((x - x0) * px);
      const j = Math.floor((z - z0) * px);
      if (i < 0 || j < 0 || i >= n || j >= n) return 0;
      return data[(j * n + i) * 4 + ch]! / 255;
    },
  };
}
