import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TOKEN_FALLBACK } from '@/components/film/map3d/palette';

describe('components/film/map3d/palette.ts', () => {
  it('màu dự phòng = đúng token trong styles/tokens.css', () => {
    const css = readFileSync('styles/tokens.css', 'utf8');
    for (const [name, hex] of Object.entries(TOKEN_FALLBACK)) {
      const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
      expect(m, name).not.toBeNull();
      expect(m![1]!.toLowerCase()).toBe(hex);
    }
  });
});
