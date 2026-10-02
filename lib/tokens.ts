import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Đọc màu token trực tiếp từ styles/tokens.css (CHỈ dùng ở server/test: trang /dev/ui, tests/unit/contrast.test.ts).
 * Không nhân bản bảng màu sang TS — tokens.css là nguồn duy nhất.
 */
export function readColorTokens(root: string = process.cwd()): Record<string, string> {
  const css = readFileSync(join(root, 'styles/tokens.css'), 'utf8');
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    const [, name, hex] = m;
    if (name && hex) out[name] = hex.toUpperCase();
  }
  return out;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Độ chói tương đối WCAG 2.x. */
export function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Tỉ lệ tương phản WCAG 2.x (1..21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
