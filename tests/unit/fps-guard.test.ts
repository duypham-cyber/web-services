import { describe, expect, it } from 'vitest';
import { guardVerdict } from '@/components/film/runtime/fps-guard';

/** ~2 s khoảng rAF: `n` khung đều `ms`, cứ mỗi `every` khung thì một khung trễ thành `slow` ms. */
function cadence(ms: number, opts: { every?: number; slow?: number; seconds?: number } = {}) {
  const out: number[] = [];
  const total = (opts.seconds ?? 2) * 1000;
  for (let t = 0, i = 1; t < total; i += 1) {
    const dt = opts.every && i % opts.every === 0 ? (opts.slow ?? ms * 2) : ms;
    out.push(dt);
    t += dt;
  }
  return out;
}

// D-35: MacBook Air ở Low Power Mode (Safari) hoặc Energy Saver (Chrome) khoá rAF ở 30 hình/s — trước đây guard coi là máy
// chậm, hạ hết bậc rồi thay bản đồ 3D bằng poster sau ~6–7 s cuộn.
describe('components/film/runtime/fps-guard.ts', () => {
  it('60 hình/s và 120 hình/s → giữ nguyên', () => {
    expect(guardVerdict(cadence(16.7))).toBe('ok');
    expect(guardVerdict(cadence(8.3))).toBe('ok');
    expect(guardVerdict(cadence(16.7, { every: 25, slow: 33.3 }))).toBe('ok'); // 4% khung trễ
  });

  it('trình duyệt khoá 30 hình/s (khung đều ~33 ms) → không hạ', () => {
    expect(guardVerdict(cadence(33.3))).toBe('ok');
    expect(guardVerdict(cadence(33.4, { every: 30, slow: 66.7 }))).toBe('ok'); // khoá 30 + thỉnh thoảng trễ một nhịp
  });

  it('khoá 30 hình/s mà GPU không theo kịp (trễ ≥ 10% khung) → hạ bậc', () => {
    expect(guardVerdict(cadence(33.3, { every: 5, slow: 66.7 }))).toBe('slow');
  });

  it('60 Hz nhưng ≥ 10% khung trễ một nhịp → hạ bậc, chưa tới mức về poster', () => {
    expect(guardVerdict(cadence(16.7, { every: 8, slow: 33.3 }))).toBe('degrade');
  });

  it('≤ 20 hình/s → "slow" (hết bậc thì về T-STILL)', () => {
    expect(guardVerdict(cadence(55))).toBe('slow');
    expect(guardVerdict(cadence(16.7, { every: 2, slow: 120 }))).toBe('slow');
  });

  it('hơi chậm nhưng trên 20 hình/s, nhịp không đều → hạ bậc, không về poster', () => {
    expect(guardVerdict(cadence(22, { every: 4, slow: 45 }))).toBe('degrade');
  });
});
