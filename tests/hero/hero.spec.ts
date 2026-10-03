import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { archipelagos } from '../../content/provinces';

/**
 * Hero bản đồ Mẫu 02 trên trang chủ (contracts/hero-map.md, bước 2). Chạy: flock … npx playwright test tests/hero
 * Ép tầng bằng query (chỉ dev/bản xem trước): ?tier=full|lite|still · ?scene=0 (gắn .film-armed, không tải chunk 3D) ·
 * ?shot=1 (khung tất định) · ?fpsguard=0 (SwiftShader chậm, không để FPS guard hạ tầng).
 * Chromium của Playwright vẽ WebGL bằng SwiftShader → tầng tự chọn luôn là T-STILL (renderer phần mềm).
 */
const PATHS = [
  { locale: 'vi', path: '/' },
  { locale: 'en', path: '/en' },
] as const;
const WIDTHS = [360, 390, 414, 768, 1024, 1280, 1366, 1440, 1920] as const;
const heightFor = (w: number) => (w < 768 ? 844 : w < 1280 ? 1024 : w === 1366 ? 768 : 900);
const ROOT = '[data-hero-map]';

async function heroData(page: Page) {
  await page.waitForSelector(`${ROOT}[data-tier]`, { timeout: 60_000 });
  return page.evaluate((sel) => ({ ...(document.querySelector(sel) as HTMLElement).dataset }), ROOT);
}

/** Cuộn tới cuối track hero (desktop: hết track dính; mobile: panel cuối vào cửa sổ đọc). */
async function scrollToTrackEnd(page: Page) {
  await page.evaluate((sel) => {
    const root = document.querySelector(sel) as HTMLElement;
    const last = root.querySelector('[data-scene="network"]') as HTMLElement;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const sticky = getComputedStyle(root.firstElementChild as HTMLElement).position === 'sticky';
    const y = sticky
      ? top + root.offsetHeight - window.innerHeight - 2
      : last.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
    window.scrollTo(0, y);
  }, ROOT);
  await page.waitForTimeout(400);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

for (const { locale, path } of PATHS) {
  test.describe(`hero ${locale}`, () => {
    test('H1 có trong HTML server, không inline opacity/visibility; 4 panel H2 server render', async ({ request }) => {
      const html = await (await request.get(path)).text();
      const start = html.indexOf('data-hero-map');
      expect(start, 'có track hero').toBeGreaterThan(0);
      const hero = html.slice(html.lastIndexOf('<section', start), html.indexOf('</section>', start));
      expect(hero).toMatch(/<h1[^>]*id="hero-title"/);
      expect(hero, 'không inline opacity:0 / visibility:hidden trong HTML server').not.toMatch(/style="[^"]*(opacity|visibility)/);
      expect(hero.match(/<h2[^>]*id="tour-/g)?.length, '4 panel tour là H2').toBe(4);
      expect(hero, 'poster <picture> có width/height').toMatch(/<img[^>]*width="1920"[^>]*height="1200"/);
      expect(html.match(/<h1[\s>]/g)?.length, 'đúng một H1').toBe(1);
    });

    test('link bỏ qua là phần tử focus đầu tiên trong main, hiển thị dưới CTA; #ba-cua-vao là H2 kế tiếp', async ({ page }) => {
      await page.goto(path);
      await heroData(page);
      const info = await page.evaluate(() => {
        const main = document.querySelector('main')!;
        const focusables = Array.from(
          main.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        ).filter((el) => {
          const cs = getComputedStyle(el);
          return cs.visibility !== 'hidden' && cs.display !== 'none' && el.getClientRects().length > 0;
        });
        const first = focusables[0] as HTMLAnchorElement | undefined;
        const cta = document.querySelector<HTMLElement>('[data-hero-copy] a[href]:not([href^="#"])');
        const headings = Array.from(main.querySelectorAll('h1, h2')).map((h) => h.tagName + (h.id ? `#${h.id}` : ''));
        const target = document.getElementById('ba-cua-vao');
        return {
          href: first?.getAttribute('href'),
          firstY: first?.getBoundingClientRect().top ?? 0,
          ctaY: cta?.getBoundingClientRect().top ?? 0,
          headings,
          targetTag: target?.tagName,
          targetHeading: target?.querySelector('h2') ? 'H2' : target?.tagName,
        };
      });
      expect(info.href).toBe('#ba-cua-vao');
      expect(info.firstY, 'link bỏ qua hiển thị dưới CTA').toBeGreaterThan(info.ctaY);
      expect(info.headings[0]).toBe('H1#hero-title');
      expect(info.headings.slice(1, 5).every((h) => h.startsWith('H2#tour-')), `panel tour là H2: ${info.headings.join(',')}`).toBe(true);
      expect(info.targetHeading).toBe('H2');
    });

    test('không JS: poster + chữ + 4 panel đọc được, không track trống', async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(path);
      await expect(page.locator('#hero-title')).toBeVisible();
      const poster = page.locator(`${ROOT} picture img`);
      await expect(poster).toBeVisible();
      await expect.poll(() => poster.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      const state = await page.evaluate((sel) => {
        const root = document.querySelector(sel) as HTMLElement;
        const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-tour] [data-scene]'));
        return {
          armed: root.classList.contains('film-armed'),
          height: root.offsetHeight,
          panels: panels.map((p) => ({ op: getComputedStyle(p).opacity, vis: getComputedStyle(p).visibility, h: p.offsetHeight })),
        };
      }, ROOT);
      expect(state.armed).toBe(false);
      expect(state.panels).toHaveLength(4);
      for (const p of state.panels) expect(p).toMatchObject({ op: '1', vis: 'visible' });
      expect(state.height, 'track = màn đầu + panel theo dòng chảy (không 320vh trống)').toBeLessThan(900 * 2.6);
      await ctx.close();
    });

    test('reduced-motion → T-STILL, không pin, không tải dữ liệu 3D', async ({ browser }) => {
      const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const requests: string[] = [];
      page.on('request', (r) => requests.push(r.url()));
      await page.goto(path);
      const d = await heroData(page);
      expect(d.tier).toBe('still');
      expect(d.tierReason).toBe('reduced-motion');
      const pos = await page.evaluate((sel) => {
        const root = document.querySelector(sel) as HTMLElement;
        return { armed: root.classList.contains('film-armed'), frame: getComputedStyle(root.firstElementChild as HTMLElement).position };
      }, ROOT);
      expect(pos).toEqual({ armed: false, frame: 'relative' });
      await page.mouse.move(400, 400);
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(2500);
      expect(requests.filter((u) => u.includes('/data/hero-map.json'))).toHaveLength(0);
      await ctx.close();
    });

    test('không WebGL → T-STILL, không tải chunk/dữ liệu 3D', async ({ page }) => {
      await page.addInitScript(() => {
        const proto = HTMLCanvasElement.prototype as unknown as { getContext: (this: HTMLCanvasElement, ...a: unknown[]) => unknown };
        const orig = proto.getContext;
        // giả lập trình duyệt không có WebGL
        proto.getContext = function (this: HTMLCanvasElement, ...args: unknown[]) {
          if (/webgl/i.test(String(args[0]))) return null;
          return orig.apply(this, args);
        };
      });
      const requests: string[] = [];
      page.on('request', (r) => requests.push(r.url()));
      await page.goto(path);
      const d = await heroData(page);
      expect(d.tier).toBe('still');
      expect(d.tierReason).toBe('no-webgl2');
      await page.mouse.move(300, 300);
      await page.waitForTimeout(2500);
      expect(requests.filter((u) => u.includes('/data/hero-map.json'))).toHaveLength(0);
    });

    test('Chromium phần mềm (SwiftShader) tự chọn T-STILL', async ({ page }) => {
      await page.goto(path);
      const d = await heroData(page);
      expect(d.tier).toBe('still');
      expect(['software-renderer', 'no-webgl2', 'no-fit']).toContain(d.tierReason);
    });

    test('tầng lite (ép): .film-armed, cuộn hết track → panel cuối + link /mang-luoi bấm được', async ({ page }) => {
      await page.goto(`${path}?tier=lite&scene=0`);
      const d = await heroData(page);
      test.skip(d.tierReason !== 'query', 'bản production không nhận ?tier= (chỉ dev/bản xem trước)');
      expect(d.tier).toBe('lite');
      expect(await page.locator(`${ROOT}.film-armed`).count()).toBe(1);
      await scrollToTrackEnd(page);
      const last = page.locator(`${ROOT} [data-scene="network"]`);
      await expect(last).toBeVisible();
      await expect.poll(() => last.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.95);
      const link = last.locator('a[href$="/mang-luoi"], a[href$="/network"]');
      await expect(link).toBeVisible();
      const topIsLink = await link.evaluate((a) => {
        const r = a.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!hit && (hit === a || a.contains(hit));
      });
      expect(topIsLink, 'link /mang-luoi không bị phần tử khác che').toBe(true);
      // ở desktop: cảnh cuối là đêm → header chữ trắng
      if ((page.viewportSize()?.width ?? 0) > (page.viewportSize()?.height ?? 0)) {
        expect(await page.locator(`${ROOT}[data-night]`).count()).toBe(1);
      }
    });

    test('canvas aria-hidden khi cảnh 3D sống (lite, SwiftShader)', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-1440', 'một bố cục là đủ (SwiftShader chậm)');
      test.setTimeout(300_000);
      await page.goto(`${path}?tier=lite&shot=1&fpsguard=0`);
      test.skip((await heroData(page)).tierReason !== 'query', 'bản production không nhận ?tier=');
      await page.mouse.move(500, 400);
      await page.waitForSelector(`${ROOT}[data-live]`, { timeout: 240_000 });
      const canvas = page.locator(`${ROOT} canvas`);
      await expect(canvas).toHaveCount(1);
      await expect(canvas).toHaveAttribute('aria-hidden', 'true');
      expect(await canvas.evaluate((c) => c.tabIndex)).toBe(-1);
    });
  });
}

test.describe('NFR-MAP-01: Hoàng Sa, Trường Sa thấy được ở 9 bề rộng', () => {
  for (const { locale, path } of PATHS) {
    for (const mode of ['still', 'armed'] as const) {
      test(`${locale} · ${mode}`, async ({ browser }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-1440', 'spec tự quét 9 bề rộng');
        test.setTimeout(240_000);
        const names: Record<string, string> = Object.fromEntries(archipelagos.map((a) => [a.id, a.label[locale] as string]));
        const problems: string[] = [];
        for (const width of WIDTHS) {
          const ctx = await browser.newContext({ viewport: { width, height: heightFor(width) }, isMobile: width < 768, hasTouch: width < 768 });
          const page = await ctx.newPage();
          await page.goto(mode === 'still' ? `${path}?tier=still` : `${path}?tier=lite&scene=0`);
          const d = await heroData(page);
          if (mode === 'armed' && d.tierReason !== 'query') {
            await ctx.close();
            test.skip(true, 'bản production không nhận ?tier=');
          }
          // nhãn/lớp trang trí có pointer-events: none — bật lại để elementFromPoint thấy MỌI phần tử đè lên (như tests/map)
          await page.addStyleTag({ content: '* { pointer-events: auto !important; }' });
          const r = await page.evaluate(
            ({ sel, expected }) => {
              const out: string[] = [];
              const root = document.querySelector(sel) as HTMLElement;
              const layer = Array.from(root.querySelectorAll<HTMLElement>('[data-layout]')).find((l) => getComputedStyle(l).display !== 'none');
              if (!layer) return ['không có lớp nhãn tĩnh hiển thị'];
              const labels = Array.from(layer.querySelectorAll<HTMLElement>('[data-kind="arch"]'));
              if (labels.length !== 2) out.push(`có ${labels.length} nhãn quần đảo`);
              const W = window.innerWidth;
              const H = window.innerHeight;
              const header = document.querySelector('[data-site-header]')?.getBoundingClientRect().bottom ?? 0;
              for (const l of labels) {
                const pill = l.firstElementChild as HTMLElement;
                const b = pill.getBoundingClientRect();
                const text = pill.textContent?.trim() ?? '';
                if (!Object.values(expected).includes(text)) out.push(`nhãn lạ "${text}"`);
                const fs = parseFloat(getComputedStyle(pill).fontSize);
                if (fs < 11) out.push(`${text}: chữ ${fs}px < 11`);
                if (getComputedStyle(pill).visibility !== 'visible') out.push(`${text}: bị ẩn`);
                if (b.left < 0 || b.right > W || b.top < header || b.bottom > H) {
                  out.push(`${text}: ngoài khung [${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)}] W=${W} H=${H} header=${Math.round(header)}`);
                }
                const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
                if (!hit || !(hit === pill || pill.contains(hit))) out.push(`${text}: bị che bởi ${hit?.tagName}.${(hit as HTMLElement)?.className}`);
              }
              return out;
            },
            { sel: ROOT, expected: names },
          );
          problems.push(...r.map((m) => `@${width}: ${m}`));
          await ctx.close();
        }
        expect(problems, problems.join('\n')).toEqual([]);
      });
    }
  }
});

test.describe('NFR-MAP-01 khi cảnh 3D sống (lite, SwiftShader)', () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ] as const) {
    test(`${width}×${height}: mọi tiến độ có quần đảo trong khung hoặc minimap đủ hai tên`, async ({ browser }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-1440', 'spec tự chọn khung');
      test.setTimeout(420_000);
      const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768 });
      const page = await ctx.newPage();
      await page.goto('/?tier=lite&shot=1&fpsguard=0');
      test.skip((await heroData(page)).tierReason !== 'query', 'bản production không nhận ?tier=');
      await page.mouse.move(width / 2, height / 3);
      await page.waitForSelector(`${ROOT}[data-live]`, { timeout: 240_000 });
      const problems: string[] = [];
      for (const target of [0, 0.14, 0.3, 0.45, 0.56, 0.7, 0.82, 0.95, 1]) {
        const before = await page.evaluate((sel) => (document.querySelector(sel) as HTMLElement).dataset.heroFrame ?? '0', ROOT);
        await page.evaluate(async ({ sel, t }) => {
          const root = document.querySelector(sel) as HTMLElement;
          const top = root.getBoundingClientRect().top + window.scrollY;
          const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          let lo = top;
          let hi = top + root.offsetHeight;
          for (let i = 0; i < 22 && hi - lo > 1; i += 1) {
            const mid = Math.round((lo + hi) / 2);
            window.scrollTo(0, mid);
            await frames();
            if (Number(root.dataset.p ?? 0) < t - 1e-4) lo = mid;
            else hi = mid;
          }
          window.scrollTo(0, t <= 0 ? top : hi);
          await frames();
        }, { sel: ROOT, t: target });
        await page
          .waitForFunction(({ sel, b }) => ((document.querySelector(sel) as HTMLElement).dataset.heroFrame ?? '0') !== b, { sel: ROOT, b: before }, { timeout: 60_000 })
          .catch(() => {});
        await page.waitForTimeout(300);
        const r = await page.evaluate((sel) => {
          const w = window as Window & { __heroMap?: { frame(): { archipelagos: { id: string; inView: boolean }[] } | null } };
          const f = w.__heroMap?.frame();
          if (!f) return ['không có frame()'];
          const fig = document.querySelector<HTMLElement>(`${sel} [data-hero-minimap]`)!;
          const mmOn = fig.dataset.on !== undefined && getComputedStyle(fig).visibility === 'visible';
          const texts = Array.from(fig.querySelectorAll('svg text')).map((t) => t.textContent);
          const out: string[] = [];
          for (const a of f.archipelagos) {
            if (a.inView) {
              const lbl = document.querySelector<HTMLElement>(`${sel} [data-label="arch:${a.id}"]`)!;
              if (getComputedStyle(lbl).visibility !== 'visible') out.push(`${a.id} trong khung nhưng nhãn ẩn`);
            } else if (!mmOn || texts.length < 2 || texts.some((t) => !t)) {
              out.push(`${a.id} ngoài khung mà không có minimap đủ tên (minimap ${mmOn ? 'bật' : 'tắt'})`);
            }
          }
          return out;
        }, ROOT);
        // mobile không có minimap: mọi khung mobile phải chứa trọn hai quần đảo (máy giữ cả nước)
        problems.push(...r.map((m) => `p=${target}: ${m}`));
      }
      expect(problems, problems.join('\n')).toEqual([]);
      await ctx.close();
    });
  }
});

test.describe('tương phản header + chữ hero ở hai trạng thái (sáng p=0, đêm p=1)', () => {
  for (const { locale, path } of PATHS) {
    test(`${locale}`, async ({ page }) => {
      await page.goto(`${path}?tier=lite&scene=0`);
      const forced = (await heroData(page)).tierReason === 'query';
      const run = async (label: string) => {
        const res = await new AxeBuilder({ page }).include('[data-site-header]').include(ROOT).withRules(['color-contrast']).analyze();
        return res.violations.flatMap((v) => v.nodes.map((n) => `${label}: ${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1] ?? ''}`));
      };
      const problems = await run('p=0');
      // trạng thái đêm chỉ có khi track được gắn (.film-armed) — bản production trên SwiftShader là T-STILL
      if (forced) {
        await scrollToTrackEnd(page);
        problems.push(...(await run('p=1')));
      }
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }
});
