import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { archipelagos } from '../../content/provinces';

/**
 * NFR-MAP-01 / AC-MAP-1 (docs/04 mục 7.2, contracts/site-shell-p0.md 1.4) — chủ quyền bản đồ. Chặn launch.
 * Ở 9 bề rộng × trang chủ và /mang-luoi × VI/EN, với MỌI bản đồ trên trang:
 *   (a) khung các đảo của Hoàng Sa, Trường Sa + nhãn nằm trọn trong khung SVG và trong viewport;
 *   (b) không phần tử nào nằm trên (che) vùng quần đảo + nhãn — dò bằng elementsFromPoint theo lưới 3 px, bật
 *       pointer-events cho mọi phần tử để bắt cả lớp trang trí; header dính và thanh đáy mobile cũng tính là che;
 *   (c) nhãn đúng chữ (content/provinces.ts), cỡ ≥ 11 CSS px, tương phản ≥ 4,5:1;
 *   (d) đảo tương phản ≥ 3:1 với nền biển;
 *   (e) thẻ thông tin khi rê chuột vào từng tỉnh/quần đảo không bao giờ giao vùng quần đảo + nhãn.
 * Chụp ảnh khung bản đồ ở 360 px và 1440 px (DPR 2) → .cache/shots/map/ (ảnh 360 px để pháp chế ký).
 * Spec tự quét 9 bề rộng nên chỉ chạy ở project desktop-1440. Chạy: npx playwright test tests/map
 */
const WIDTHS = [360, 390, 414, 768, 1024, 1280, 1366, 1440, 1920] as const;
const PAGES = [
  { key: 'home', locale: 'vi', path: '/' },
  { key: 'home', locale: 'en', path: '/en' },
  { key: 'network', locale: 'vi', path: '/mang-luoi' },
  { key: 'network', locale: 'en', path: '/en/network' },
] as const;
const SHOT_WIDTHS = new Set<number>([360, 1440]);
const SHOT_DIR = '.cache/shots/map';
/** Rê chuột qua từng tỉnh: mọi bề rộng ở /mang-luoi bản VI, 3 bề rộng ở các trang còn lại (thời gian chạy). */
const hoverWidths = (key: string, locale: string) =>
  key === 'network' && locale === 'vi' ? new Set<number>(WIDTHS) : new Set<number>([360, 768, 1440]);

const heightFor = (w: number) => (w < 768 ? 844 : w < 1280 ? 1024 : w === 1366 ? 768 : 900);

type Report = { problems: string[]; info: Record<string, unknown> };

/** Cuộn bản đồ thứ `index` sao cho vùng quần đảo + nhãn nằm giữa phần nhìn thấy (dưới header, trên thanh đáy). */
async function centerArchipelagos(page: Page, index: number) {
  await page.evaluate((i) => {
    const frame = document.querySelectorAll<HTMLElement>('[data-map-frame]')[i];
    if (!frame) return;
    const rects = Array.from(frame.querySelectorAll('[data-arch-visual], [data-arch-label]')).map((el) =>
      el.getBoundingClientRect(),
    );
    const top = Math.min(...rects.map((r) => r.top));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    let bandTop = 0;
    let bandBottom = window.innerHeight;
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('header, nav, div'))) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      const r = el.getBoundingClientRect();
      if (r.height === 0 || r.height > window.innerHeight / 3) continue;
      if (r.top <= 1) bandTop = Math.max(bandTop, r.bottom);
      else if (r.bottom >= window.innerHeight - 1) bandBottom = Math.min(bandBottom, r.top);
    }
    const delta = (top + bottom) / 2 - (bandTop + bandBottom) / 2;
    window.scrollTo(0, window.scrollY + delta);
  }, index);
  await page.waitForTimeout(120);
}

/** (a)–(d) cho bản đồ thứ `index`. Chạy hoàn toàn trong trình duyệt, trả danh sách lỗi. */
async function auditMap(page: Page, index: number, labels: Record<string, string>): Promise<Report> {
  return page.evaluate(
    ({ i, expected }) => {
      const problems: string[] = [];
      const info: Record<string, unknown> = {};
      const frame = document.querySelectorAll<HTMLElement>('[data-map-frame]')[i];
      if (!frame) return { problems: [`không thấy [data-map-frame] #${i}`], info };
      const svg = frame.querySelector<SVGSVGElement>('[data-map-svg]');
      if (!svg) return { problems: ['không thấy [data-map-svg]'], info };

      const toBox = (r: DOMRect) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      const union = (boxes: { left: number; top: number; right: number; bottom: number }[]) => ({
        left: Math.min(...boxes.map((b) => b.left)),
        top: Math.min(...boxes.map((b) => b.top)),
        right: Math.max(...boxes.map((b) => b.right)),
        bottom: Math.max(...boxes.map((b) => b.bottom)),
      });
      const inside = (a: { left: number; top: number; right: number; bottom: number }, b: typeof a, tol = 0.5) =>
        a.left >= b.left - tol && a.top >= b.top - tol && a.right <= b.right + tol && a.bottom <= b.bottom + tol;
      const fmt = (b: { left: number; top: number; right: number; bottom: number }) =>
        `[${Math.round(b.left)},${Math.round(b.top)} → ${Math.round(b.right)},${Math.round(b.bottom)}]`;

      // Màu → độ chói WCAG
      const parseRgb = (c: string) => {
        const m = c.match(/rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?/);
        if (!m) return null;
        return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
      };
      const lum = (c: { r: number; g: number; b: number }) => {
        const ch = (v: number) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
      };
      const contrast = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) => {
        const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
        return (hi + 0.05) / (lo + 0.05);
      };

      const svgBox = toBox(svg.getBoundingClientRect());
      const frameBox = toBox(frame.getBoundingClientRect());
      const viewport = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      info.frame = fmt(frameBox);
      if (!inside(svgBox, frameBox, 1.5)) problems.push(`SVG ${fmt(svgBox)} lệch khỏi khung ${fmt(frameBox)}`);

      const seaColor = parseRgb(getComputedStyle(frame).backgroundColor);
      const white = { r: 255, g: 255, b: 255 };
      const protectedZones: { name: string; box: ReturnType<typeof toBox>; owner: Element }[] = [];

      for (const [id, text] of Object.entries(expected)) {
        const group = frame.querySelector(`[data-arch="${id}"]`);
        const parts = Array.from(frame.querySelectorAll(`[data-arch="${id}"] [data-arch-visual]`));
        const label = frame.querySelector<HTMLElement>(`[data-arch-label="${id}"]`);
        if (!group || parts.length === 0) {
          problems.push(`${id}: KHÔNG có đảo trên bản đồ`);
          continue;
        }
        if (!label) {
          problems.push(`${id}: KHÔNG có nhãn`);
          continue;
        }
        const islands = union(parts.map((p) => toBox(p.getBoundingClientRect())));
        const labelBox = toBox(label.getBoundingClientRect());
        const islandsW = islands.right - islands.left;
        const islandsH = islands.bottom - islands.top;
        if (islandsW < 2 || islandsH < 2) problems.push(`${id}: khung đảo suy biến ${fmt(islands)}`);

        // (a) trong khung SVG + trong viewport
        if (!inside(islands, svgBox)) problems.push(`${id}: đảo ${fmt(islands)} ra ngoài khung SVG ${fmt(svgBox)}`);
        if (!inside(labelBox, svgBox)) problems.push(`${id}: nhãn ${fmt(labelBox)} ra ngoài khung SVG ${fmt(svgBox)}`);
        if (!inside(islands, viewport)) problems.push(`${id}: đảo ${fmt(islands)} ra ngoài viewport`);
        if (!inside(labelBox, viewport)) problems.push(`${id}: nhãn ${fmt(labelBox)} ra ngoài viewport`);

        // (c) chữ, cỡ, tương phản nhãn
        const cs = getComputedStyle(label);
        if (label.textContent?.trim() !== text) problems.push(`${id}: nhãn "${label.textContent?.trim()}" ≠ "${text}"`);
        const size = parseFloat(cs.fontSize);
        if (!(size >= 11)) problems.push(`${id}: cỡ chữ nhãn ${size}px < 11px`);
        if (cs.visibility !== 'visible' || Number(cs.opacity) < 0.99 || cs.display === 'none') {
          problems.push(`${id}: nhãn không hiện (visibility ${cs.visibility}, opacity ${cs.opacity})`);
        }
        const fg = parseRgb(cs.color);
        const bg = parseRgb(cs.backgroundColor);
        if (!fg || !bg || bg.a < 0.99) problems.push(`${id}: nhãn cần nền đặc để đo tương phản (bg ${cs.backgroundColor})`);
        else {
          const ratio = contrast(fg, bg);
          if (ratio < 4.5) problems.push(`${id}: tương phản nhãn ${ratio.toFixed(2)} < 4,5`);
          info[`${id}.labelContrast`] = +ratio.toFixed(2);
        }
        info[`${id}.labelPx`] = size;

        // (d) đảo ≥ 3:1 với nền biển (nền khung và trắng của vùng sáng giữa khung)
        const dot = parts.find((p) => p.tagName.toLowerCase() === 'circle') ?? parts[0];
        const fill = dot ? parseRgb(getComputedStyle(dot).fill) : null;
        if (!fill) problems.push(`${id}: không đọc được màu đảo`);
        else {
          const ratio = Math.min(contrast(fill, white), seaColor ? contrast(fill, seaColor) : Infinity);
          if (ratio < 3) problems.push(`${id}: tương phản đảo ${ratio.toFixed(2)} < 3`);
          info[`${id}.islandContrast`] = +ratio.toFixed(2);
        }
        info[`${id}.islands`] = fmt(islands);

        protectedZones.push({ name: `${id} (đảo)`, box: islands, owner: group });
        protectedZones.push({ name: `${id} (nhãn)`, box: labelBox, owner: label });
      }

      // (b) không phần tử nào che vùng quần đảo + nhãn
      const style = document.createElement('style');
      style.textContent = '*, *::before, *::after { pointer-events: auto !important; }';
      document.head.appendChild(style);
      const shownCache = new Map<Element, boolean>();
      const shown = (el: Element): boolean => {
        const cached = shownCache.get(el);
        if (cached !== undefined) return cached;
        const s = getComputedStyle(el);
        const self = !(s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0);
        const result = self && (el.parentElement ? shown(el.parentElement) : true);
        shownCache.set(el, result);
        return result;
      };
      const describe = (el: Element) => {
        const data = Array.from(el.attributes)
          .filter((a) => a.name.startsWith('data-'))
          .map((a) => a.name)
          .slice(0, 2)
          .join(',');
        return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${data ? `[${data}]` : ''}`;
      };
      const labelOf = (el: Element) => el.closest('[data-arch-label]');
      try {
        for (const zone of protectedZones) {
          const offenders = new Set<string>();
          const b = zone.box;
          for (let y = b.top + 1; y <= b.bottom - 1; y += 3) {
            for (let x = b.left + 1; x <= b.right - 1; x += 3) {
              if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) continue;
              const top = document.elementsFromPoint(x, y).find(shown);
              if (!top) continue;
              const okSvg = svg.contains(top) || top === svg;
              const okLabel = labelOf(top) !== null;
              const okFrame = top === frame;
              const forbidden = top.closest('[data-map-card], [data-map-legend]');
              if (forbidden || !(okSvg || okLabel || okFrame)) offenders.add(describe(top));
              // nhãn của quần đảo này không được bị nhãn khác/phần tử khác đè
              if (zone.owner.hasAttribute('data-arch-label') && okLabel && labelOf(top) !== zone.owner) {
                offenders.add(`nhãn khác: ${describe(top)}`);
              }
            }
          }
          if (offenders.size) problems.push(`${zone.name} bị che bởi: ${[...offenders].slice(0, 5).join(' · ')}`);
        }
      } finally {
        style.remove();
      }
      return { problems, info };
    },
    { i: index, expected: labels },
  );
}

/** (e) Rê chuột lần lượt vào 34 tỉnh + 2 quần đảo: thẻ thông tin không giao vùng quần đảo + nhãn, nằm trong khung. */
async function auditHoverCards(page: Page, index: number): Promise<string[]> {
  return page.evaluate(async (i) => {
    const problems: string[] = [];
    const root = document.querySelectorAll<HTMLElement>('[data-map-root]')[i];
    const frame = root?.querySelector<HTMLElement>('[data-map-frame]');
    const card = root?.querySelector<HTMLElement>('[data-map-card]');
    const strip = root?.querySelector<HTMLElement>('[data-map-strip]');
    if (!frame || !card || !strip) return ['không thấy khung, thẻ hoặc dải thông tin'];
    if (!frame.hasAttribute('data-map-interactive')) return ['bản đồ chưa gắn tương tác (chưa hydrate?)'];
    const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    const box = (el: Element) => el.getBoundingClientRect();
    const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    // Vùng cấm = khung bao các đảo nhìn thấy của từng quần đảo + khung nhãn (đúng định nghĩa NFR-MAP-01)
    const zones: DOMRect[] = [
      ...Array.from(frame.querySelectorAll('[data-arch]')).map((group) => {
        const parts = Array.from(group.querySelectorAll('[data-arch-visual]')).map(box);
        const left = Math.min(...parts.map((r) => r.left));
        const top = Math.min(...parts.map((r) => r.top));
        return new DOMRect(left, top, Math.max(...parts.map((r) => r.right)) - left, Math.max(...parts.map((r) => r.bottom)) - top);
      }),
      ...Array.from(frame.querySelectorAll('[data-arch-label]')).map(box),
    ];
    const targets = new Map<string, Element>();
    frame.querySelectorAll('[data-card-key]').forEach((el) => {
      const key = el.getAttribute('data-card-key') ?? '';
      if (!targets.has(key)) targets.set(key, el);
    });
    let opened = 0;
    for (const [key, el] of targets) {
      el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
      await nextFrame();
      await new Promise((r) => setTimeout(r, 30));
      if (card.hasAttribute('data-open')) {
        opened += 1;
        const c = box(card);
        const f = box(frame);
        if (c.left < f.left - 0.5 || c.top < f.top - 0.5 || c.right > f.right + 0.5 || c.bottom > f.bottom + 0.5) {
          problems.push(`thẻ "${key}" ra ngoài khung`);
        }
        const bad = zones.filter((z) => hit(c, z));
        if (bad.length) problems.push(`thẻ "${key}" đè vùng quần đảo/nhãn`);
        if (strip.hasAttribute('data-active')) problems.push(`thẻ "${key}" hiện cả thẻ nổi lẫn dải`);
      } else if (strip.hasAttribute('data-active')) {
        opened += 1; // khung hẹp: thông tin ở dải dưới bản đồ (ngoài khung)
        const s = box(strip);
        if (zones.some((z) => hit(s, z))) problems.push(`dải thông tin "${key}" đè vùng quần đảo/nhãn`);
      }
      frame.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false, pointerType: 'mouse' }));
      await nextFrame();
    }
    if (opened < targets.size * 0.8) problems.push(`chỉ mở được thẻ ở ${opened}/${targets.size} vị trí`);
    return problems;
  }, index);
}

test.describe('NFR-MAP-01 — chủ quyền bản đồ', () => {
  for (const p of PAGES) {
    for (const width of WIDTHS) {
      test(`${p.key} [${p.locale}] ${p.path} @${width}`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-1440', 'spec tự quét 9 bề rộng — chỉ chạy ở desktop-1440');
        const labels = Object.fromEntries(archipelagos.map((a) => [a.id, a.label[p.locale]]));
        await page.setViewportSize({ width, height: heightFor(width) });
        const res = await page.goto(p.path, { waitUntil: 'networkidle' });
        expect(res?.status(), `HTTP ${p.path}`).toBe(200);

        const maps = await page.locator('[data-map-frame]').count();
        expect(maps, `${p.path} phải có bản đồ (VietnamMap)`).toBeGreaterThan(0);

        const problems: string[] = [];
        for (let i = 0; i < maps; i += 1) {
          await centerArchipelagos(page, i);
          const report = await auditMap(page, i, labels);
          problems.push(...report.problems.map((m) => `bản đồ #${i}: ${m}`));
          testInfo.annotations.push({ type: `map#${i}@${width}`, description: JSON.stringify(report.info) });

          if (hoverWidths(p.key, p.locale).has(width)) {
            await page.locator('[data-map-frame][data-map-interactive]').nth(i).waitFor({ state: 'attached' });
            problems.push(...(await auditHoverCards(page, i)).map((m) => `bản đồ #${i} (rê chuột): ${m}`));
          }

        }
        expect(problems, problems.join('\n')).toEqual([]);
      });
    }
  }
});

test.describe('ảnh bản đồ 360 px và 1440 px (pháp chế ký ảnh 360 px)', () => {
  for (const p of PAGES) {
    test(`${p.key} [${p.locale}] ${p.path}`, async ({ browser }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-1440', 'chạy một lần');
      mkdirSync(SHOT_DIR, { recursive: true });
      for (const width of SHOT_WIDTHS) {
        const ctx = await browser.newContext({ viewport: { width, height: heightFor(width) }, deviceScaleFactor: 2 });
        try {
          const page = await ctx.newPage();
          await page.goto(p.path, { waitUntil: 'networkidle' });
          const count = await page.locator('[data-map-root]').count();
          for (let i = 0; i < count; i += 1) {
            await centerArchipelagos(page, i);
            await page.waitForTimeout(1900); // map-rise ≈ 1,6 s
            const file = `${SHOT_DIR}/${p.key}-${p.locale}--${width}${i ? `--${i}` : ''}.png`;
            await page.locator('[data-map-root]').nth(i).screenshot({ path: file });
            await testInfo.attach(`map-${p.key}-${p.locale}-${width}`, { path: file, contentType: 'image/png' });
          }
        } finally {
          await ctx.close();
        }
      }
    });
  }
});

test.describe('bản đồ khi không chuyển động / không JavaScript', () => {
  test('reduced-motion: tỉnh hiện ngay, không ẩn chờ map-rise (AC-RM-1)', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'chạy một lần');
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    try {
      const page = await ctx.newPage();
      await page.goto('/mang-luoi', { waitUntil: 'networkidle' });
      const hidden = await page.evaluate(
        () =>
          Array.from(document.querySelectorAll('[data-map-frame] path[data-code]')).filter(
            (el) => Number(getComputedStyle(el).opacity) < 0.99,
          ).length,
      );
      expect(hidden, 'số tỉnh còn mờ khi reduced-motion').toBe(0);
    } finally {
      await ctx.close();
    }
  });

  test('không JS: bản đồ, hai quần đảo, nhãn và bảng 34 tỉnh có trong HTML', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'chạy một lần');
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 844 } });
    try {
      const page = await ctx.newPage();
      for (const [path, locale] of [
        ['/mang-luoi', 'vi'],
        ['/en/network', 'en'],
      ] as const) {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        for (const a of archipelagos) {
          await expect(page.locator(`[data-arch-label="${a.id}"]`).first()).toHaveText(a.label[locale]);
          await expect(page.locator(`[data-arch-label="${a.id}"]`).first()).toBeVisible();
          expect(await page.locator(`[data-arch="${a.id}"] [data-arch-visual]`).count()).toBeGreaterThan(0);
        }
        await expect(page.locator('[data-province-row]')).toHaveCount(34);
        const hiddenProvinces = await page.evaluate(
          () =>
            Array.from(document.querySelectorAll('[data-map-frame] path[data-code]')).filter(
              (el) => Number(getComputedStyle(el).opacity) < 0.99,
            ).length,
        );
        expect(hiddenProvinces).toBe(0);
      }
    } finally {
      await ctx.close();
    }
  });
});
