import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit test của hero bản đồ (contracts/hero-map.md mục 5). Chạy: npx vitest run -c tests/hero/vitest.config.ts
// (vitest.config.ts gốc chỉ quét tests/unit — đề nghị tech lead thêm 'tests/hero/**/*.test.ts' vào include).
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('../../', import.meta.url)) },
  },
  test: {
    root: fileURLToPath(new URL('../../', import.meta.url)),
    include: ['tests/hero/**/*.test.ts'],
    environment: 'node',
    pool: 'threads',
    maxWorkers: 2,
  },
});
