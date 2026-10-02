import { describe, expect, it } from 'vitest';
import { contrastRatio, readColorTokens } from '@/lib/tokens';
import { CONTRAST_PAIRS, FORBIDDEN_PAIRS } from '@/styles/contrast-pairs';

// docs/03 mục 11.1 — mọi cặp ở cột "Cặp kiểm" phải khớp số trong tài liệu (±0,02) và đạt ngưỡng WCAG AA.
const tokens = readColorTokens();

const TABLE_11_1: Record<string, string> = {
  'blue-600': '#004AAD',
  'blue-700': '#003A8C',
  'navy-900': '#0A1F44',
  'blue-300': '#7FAAF0',
  'blue-100': '#E8F1FC',
  'blue-50': '#F2F8FC',
  'orange-500': '#EF8426',
  'orange-400': '#F59A4A',
  'orange-700': '#A94F00',
  'orange-200': '#FFB778',
  'orange-50': '#FFF4EA',
  'ink-900': '#0F172A',
  'slate-600': '#475569',
  'slate-500': '#64748B',
  'slate-300': '#CBD5E1',
  'danger-700': '#B3261E',
  'success-700': '#1F7A3A',
  'warning-text': '#8A5A00',
};

describe('styles/tokens.css', () => {
  it('chứa đúng và CHỈ các màu của bảng 11.1 (+ white)', () => {
    expect(tokens).toEqual({ ...TABLE_11_1, white: '#FFFFFF' });
  });
});

describe('tương phản WCAG 2.x (bảng 11.1, sai số ±0,02)', () => {
  it.each(CONTRAST_PAIRS.map((p) => [`${p.fg} trên ${p.bg}`, p] as const))('%s', (_name, pair) => {
    const fg = tokens[pair.fg];
    const bg = tokens[pair.bg];
    expect(fg, `thiếu token ${pair.fg}`).toBeDefined();
    expect(bg, `thiếu token ${pair.bg}`).toBeDefined();
    const ratio = contrastRatio(fg as string, bg as string);
    expect(Math.abs(ratio - pair.expected)).toBeLessThanOrEqual(0.02);
    expect(ratio).toBeGreaterThanOrEqual(pair.min);
  });

  it.each(FORBIDDEN_PAIRS.map((p) => [`${p.fg} trên ${p.bg}`, p] as const))('cặp CẤM %s vẫn dưới 4,5:1', (_name, pair) => {
    const ratio = contrastRatio(tokens[pair.fg] as string, tokens[pair.bg] as string);
    expect(Math.abs(ratio - pair.expected)).toBeLessThanOrEqual(0.02);
    expect(ratio).toBeLessThan(4.5);
  });
});
