import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Test tích hợp form lead với Postgres THẬT (database bluebolt_web_test): `npm run test:leads`.
// Tách khỏi `npm run test` (vitest.config.mts chỉ chạy tests/unit) để máy không có DB không bị đỏ.
// Thiếu DATABASE_URL_TEST* → các bộ test tự bỏ qua (describe.skipIf) và in một dòng nhắc ở đây.
const envFile = fileURLToPath(new URL('./.env.local', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile); // không ghi đè biến đã có trong môi trường
if (!process.env.DATABASE_URL_TEST || !process.env.DATABASE_URL_TEST_OWNER || !process.env.DATABASE_URL_TEST_OPS) {
  console.warn(
    '[test:leads] Bỏ qua test tích hợp: thiếu DATABASE_URL_TEST / DATABASE_URL_TEST_OWNER / DATABASE_URL_TEST_OPS ' +
      '(máy bbsw: node scripts/db-dev-setup.mjs && node scripts/db-migrate.mjs up --test).',
  );
}

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    include: ['tests/leads/**/*.test.ts'],
    setupFiles: ['tests/leads/setup.ts'],
    environment: 'node',
    // Một database dùng chung: chạy tuần tự, không song song file
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
