import { expect, test, type Page } from '@playwright/test';

/**
 * D-34: section quy trình trang chủ dừng ở bước 00 và đi từng bước khi cuộn, xong bước cuối mới trôi tiếp.
 * Chế độ ghim chỉ có ở desktop có chuột (project desktop-1440); mobile-390 và reduced-motion phải không ghim.
 */
const read = (page: Page) =>
  page.evaluate(() => {
    const track = document.querySelector<HTMLElement>('[data-step-track]')!;
    const stage = track.querySelector<HTMLElement>('[data-step-stage]')!;
    const runway = track.querySelector<HTMLElement>('[data-step-runway]')!;
    return {
      step: track.dataset.step ?? null,
      pin: track.dataset.pin ?? null,
      top: Math.round(stage.getBoundingClientRect().top),
      trackTop: Math.round(track.getBoundingClientRect().top + window.scrollY),
      runway: runway.offsetHeight,
    };
  });

const motionReady = (page: Page) =>
  expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion ?? null)).toBe('ready');

test.describe('quy trình trang chủ: dừng và đi từng bước (D-34)', () => {
  for (const path of ['/', '/en']) {
    test(`ghim ở 00, đi đủ từng bước, nhả sau bước cuối ${path}`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop-1440', 'chế độ ghim chỉ có ở desktop có chuột');
      await page.goto(path, { waitUntil: 'networkidle' });
      await motionReady(page);
      const start = await read(page);
      expect(start.pin, 'data-pin').toBe('on');
      expect(start.runway, 'đường băng').toBeGreaterThan(0);

      const seen: string[] = [];
      const pinnedTops = new Set<number>();
      for (let y = start.trackTop - 700; y <= start.trackTop + start.runway + 400; y += 40) {
        await page.evaluate((target) => window.scrollTo(0, target), y);
        await page.waitForTimeout(50);
        const s = await read(page);
        if (s.step !== null && seen.at(-1) !== s.step) seen.push(s.step);
        if (s.step !== null && s.step !== '0' && s.step !== '5') pinnedTops.add(s.top);
      }
      expect(seen, 'thứ tự bước khi cuộn xuống').toEqual(['0', '1', '2', '3', '4', '5']);
      expect([...pinnedTops].length, `khối đứng yên một chỗ khi ghim (${[...pinnedTops].join(', ')})`).toBe(1);
      const end = await read(page);
      expect(end.top, 'khối đã trôi lên sau bước cuối').toBeLessThan(0);
    });
  }

  test('điện thoại: không ghim, không đường băng', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile-390', 'chỉ kiểm ở mobile');
    await page.goto('/', { waitUntil: 'networkidle' });
    await motionReady(page);
    const s = await read(page);
    expect(s.runway).toBe(0);
    expect(s.step).toBeNull();
  });
});

test.describe('quy trình trang chủ khi giảm chuyển động (D-34)', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('không ghim, mọi bước hiện đủ', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const s = await read(page);
    expect(s.runway).toBe(0);
    expect(s.step).toBeNull();
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-motion'))).toBe(false);
  });
});

test.describe('quy trình trang chủ khi JavaScript không chạy được (D-35)', () => {
  test('bundle lỗi cú pháp → nội dung hiện ngay, không ghim', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'chế độ ghim chỉ có ở desktop có chuột');
    // Như Safari cũ không đọc được bundle: mọi chunk JS lỗi cú pháp ngay ký tự đầu
    await page.route(/\/_next\/static\/chunks\/.+\.js(\?.*)?$/, async (route) => {
      const resp = await route.fetch();
      const headers = { ...resp.headers() };
      delete headers['content-encoding'];
      delete headers['content-length'];
      await route.fulfill({ status: resp.status(), headers, body: `@@;${await resp.text()}` });
    });
    await page.goto('/', { waitUntil: 'load' });
    // script đầu trang thấy SyntaxError → "off" ngay, không chờ mốc 4 s
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion ?? null), { timeout: 2500 }).toBe('off');
    const s = await read(page);
    expect(s.runway, 'không có đường băng ghim').toBe(0);
    expect(s.pin).toBeNull();
    const hidden = await page.evaluate(
      () => Array.from(document.querySelectorAll('[data-motion-item="rise"]')).filter((el) => getComputedStyle(el).opacity === '0').length,
    );
    expect(hidden, 'phần tử rise còn ẩn').toBe(0);
  });
});
