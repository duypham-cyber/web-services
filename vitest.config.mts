import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit test (Vitest 5, chạy trên Node): tokens, content, messages, routes, claims, leads; tests/hero: dữ liệu + camera hero bản đồ.
// Test trình duyệt (Playwright) nằm ở tests/*.spec.ts, không chạy ở đây.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/hero/**/*.test.ts'],
    environment: 'node',
    pool: 'threads',
    maxWorkers: 2,
  },
});
