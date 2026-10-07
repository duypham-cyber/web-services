/**
 * Phán quyết của FPS guard (contracts/hero-map.md AC-T-2), tách khỏi stage.ts để kiểm bằng unit test.
 * Đầu vào: khoảng giữa các lần rAF liên tiếp trong ~2 s ĐANG cuộn (ms).
 *   - 'ok'      p90 ≤ 25 ms, hoặc nhịp đều quanh 33 ms: trình duyệt khoá 30 hình/s (Low Power Mode của macOS, Energy Saver
 *               của Chrome, màn 30 Hz). Hạ bậc không làm khung nhanh hơn nhịp khoá, nên không hạ (D-35).
 *   - 'degrade' khung chậm thật: hạ một bậc chất lượng.
 *   - 'slow'    như 'degrade' và p90 > 50 ms (≤ 20 hình/s): chỉ mức này mới được về T-STILL khi đã hết bậc.
 */
export const GUARD_P90_MS = 25;
export const GUARD_STILL_P90_MS = 50;

export type GuardVerdict = 'ok' | 'degrade' | 'slow';

export function guardVerdict(intervals: number[]): GuardVerdict {
  const sorted = [...intervals].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.floor(sorted.length * q)] ?? 0;
  const p50 = at(0.5);
  const p90 = at(0.9);
  if (p90 <= GUARD_P90_MS) return 'ok';
  // khoá 30 hình/s: trung vị 28–40 ms và p90 sát trung vị (khung đều, không giật)
  if (p50 >= 28 && p50 <= 40 && p90 - p50 <= 6) return 'ok';
  return p90 > GUARD_STILL_P90_MS ? 'slow' : 'degrade';
}
