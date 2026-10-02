import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 1.62.0 dùng Chromium rev 1234 CÓ SẴN trên máy (không tải trình duyệt):
 *   CHROMIUM_PATH   mặc định bản đầy đủ trên bbsw (xem CLAUDE.local.md)
 *   LD_LIBRARY_PATH thư viện hệ thống cho Chromium trên bbsw (không có sudo)
 *   BASE_URL        mặc định dev server dùng chung http://127.0.0.1:3091 (preview build: http://127.0.0.1:3092)
 * Máy dùng chung RAM: tối đa 2 worker (PW_WORKERS để đổi). Kết quả: test-results/, playwright-report/ (gitignore).
 */
const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? '/home/bbsw/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH ?? '/home/bbsw/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu';

export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.ts',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: Number(process.env.PW_WORKERS ?? 2),
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3091',
    navigationTimeout: 120_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: CHROMIUM_PATH,
      env: { ...process.env, LD_LIBRARY_PATH },
    },
  },
  projects: [
    {
      name: 'desktop-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-390',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
      // overflow.spec tự quét 9 bề rộng → chỉ chạy ở desktop-1440
      testIgnore: /overflow\.spec\.ts$/,
    },
  ],
});
