/**
 * Nạp `.env.local` (máy bbsw: khối leads do scripts/db-dev-setup.mjs ghi) trong tiến trình test mà KHÔNG ghi đè biến đã
 * có. vitest.leads.config.mts đã nạp ở tiến trình chính và in dòng nhắc khi thiếu chuỗi kết nối test.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('../../.env.local', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
