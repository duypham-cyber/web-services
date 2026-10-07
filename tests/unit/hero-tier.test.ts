import { describe, expect, it } from 'vitest';
import { MASKED_APPLE, STRONG, WEAK } from '@/components/film/runtime/boot';

// Chuỗi UNMASKED_RENDERER_WEBGL thật theo trình duyệt (D-35). Chrome trên Mac đi qua ANGLE Metal, tên Intel có "(R)".
const R = {
  chromeM1: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)',
  chromeM3Pro: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)',
  chromeIntelHd4000Mac: 'ANGLE (Intel, ANGLE Metal Renderer: Intel(R) HD Graphics 4000, Unspecified Version)',
  chromeIntelHd6000Mac: 'ANGLE (Intel, ANGLE Metal Renderer: Intel(R) HD Graphics 6000, Unspecified Version)',
  chromeIntelUhd617Mac: 'ANGLE (Intel, ANGLE Metal Renderer: Intel(R) UHD Graphics 617, Unspecified Version)',
  chromeIrisPlusMac: 'ANGLE (Intel, ANGLE Metal Renderer: Intel(R) Iris(TM) Plus Graphics, Unspecified Version)',
  winHd4000: 'ANGLE (Intel, Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  winUhd620: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  winIrisXe: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
  winArc: 'ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
  winRtx: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  legacyMac: 'Intel HD Graphics 4000 OpenGL Engine',
  safari: 'Apple GPU',
};

describe('components/film/runtime/boot.ts — nhận diện GPU', () => {
  it('GPU Intel đời cũ (HD 2000–4000) → yếu, kể cả tên có "(R)"', () => {
    for (const r of [R.chromeIntelHd4000Mac, R.winHd4000, R.legacyMac]) expect(WEAK.test(r), r).toBe(true);
  });

  it('Intel đời sau (HD 6000, UHD 6xx, Iris Plus) không yếu, không mạnh → T-LITE', () => {
    for (const r of [R.chromeIntelHd6000Mac, R.chromeIntelUhd617Mac, R.chromeIrisPlusMac, R.winUhd620]) {
      expect(WEAK.test(r), r).toBe(false);
      expect(STRONG.test(r), r).toBe(false);
    }
  });

  it('GPU mạnh: Apple M*, Iris Xe, Arc, NVIDIA', () => {
    for (const r of [R.chromeM1, R.chromeM3Pro, R.winIrisXe, R.winArc, R.winRtx]) expect(STRONG.test(r), r).toBe(true);
  });

  it('Safari che tên ("Apple GPU"): không tự coi là mạnh — boot.ts xét thêm ASTC', () => {
    expect(STRONG.test(R.safari)).toBe(false);
    expect(WEAK.test(R.safari)).toBe(false);
    expect(MASKED_APPLE.test(R.safari)).toBe(true);
    expect(MASKED_APPLE.test(R.chromeM1)).toBe(false);
  });
});
