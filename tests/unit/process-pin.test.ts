import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PIN_QUERY } from '@/components/home/process-pin';

// D-34: ProcessStepper (matchMedia) và CSS phải bật chế độ ghim ở CÙNG điều kiện, nếu lệch sẽ có sticky mà không đi bước
// hoặc đi bước mà không sticky.
describe('components/home/process-pin.ts', () => {
  it('PIN_QUERY trùng nguyên văn media query chế độ ghim trong process-route.module.css', () => {
    const css = readFileSync('components/home/process-route.module.css', 'utf8');
    expect(css).toContain(`@media ${PIN_QUERY} {`);
  });

  it('chế độ ghim chỉ cho màn hình có chuột và cho phép chuyển động', () => {
    for (const part of ['screen', '(prefers-reduced-motion: no-preference)', '(hover: hover)', '(pointer: fine)']) {
      expect(PIN_QUERY).toContain(part);
    }
  });
});
