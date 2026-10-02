// ESLint flat config (Next 16 bỏ `next lint`, chạy thẳng `eslint .`)
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Không dùng console trong code chạy ở trình duyệt/server (rules/logging.md); script và test được phép.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['scripts/**', 'tests/**', '*.config.*'],
    rules: { 'no-console': 'off' },
  },
  globalIgnores([
    '.next/**',
    '.next-*/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'reference/**',
    '.cache/**',
    'test-results/**',
    'playwright-report/**',
    'coverage/**',
    'public/**',
  ]),
]);
