import { expect, test } from '@playwright/test';
import { legacyAssets, legacyRedirects } from '../../content/redirects';
import { absoluteUrl, INDEXABLE_ROUTES, locales } from '../../lib/routes';
import { isIndexable, isTranslated, lastModified } from '../../lib/seo';

/**
 * AC-SEO-5 (sitemap.xml, robots.txt) · AC-301-2 (301/410 ở tầng Next) — chạy trên dev server hoặc BASE_URL.
 * Kiểm đủ 4 biến thể http/https × www/apex + "/" cuối (1 hop qua openresty): scripts/check-redirects.mjs.
 */
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'kiểm HTTP: chỉ chạy một lần');
});

test('robots.txt chuẩn: có Sitemap tuyệt đối, không có Host:', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toMatch(/User-Agent: \*/i);
  expect(text).not.toMatch(/^Host:/im);
  if (process.env.STAGING === '1') {
    expect(text).toMatch(/Disallow: \/\s*$/m);
  } else {
    expect(text).toContain('Sitemap: https://lapdattoanquoc.vn/sitemap.xml');
    expect(text).not.toMatch(/Disallow: \/\s*$/m);
  }
});

test('sitemap.xml: đúng tập URL indexable VI/EN, lastmod thật, alternate vi/en/x-default', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).not.toMatch(/localhost|127\.0\.0\.1/);
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
    const block = m[1] ?? '';
    return {
      loc: /<loc>([^<]+)<\/loc>/.exec(block)?.[1] ?? '',
      lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(block)?.[1] ?? '',
      alternates: Object.fromEntries(
        [...block.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((a) => [a[1] ?? '', a[2] ?? '']),
      ),
    };
  });

  const expected = INDEXABLE_ROUTES.filter((r) => isIndexable(r.key)).flatMap((route) =>
    locales
      .filter((l) => isTranslated(route.key, l))
      .map((l) => ({ route, loc: absoluteUrl(route.paths[l]) })),
  );
  expect(urls.map((u) => u.loc).sort()).toEqual(expected.map((e) => e.loc).sort());

  for (const { route, loc } of expected) {
    const u = urls.find((x) => x.loc === loc);
    expect(u?.lastmod, `${loc} lastmod`).toBe(lastModified(route.key));
    expect(u?.alternates, `${loc} alternates`).toEqual({
      vi: absoluteUrl(route.paths.vi),
      en: absoluteUrl(route.paths.en),
      'x-default': absoluteUrl(route.paths.vi),
    });
  }
});

test('URL cũ: 301 một bước tới đích đúng (giữ query) và đích trả 200', async ({ request }) => {
  const rows = legacyRedirects.filter((r) => r.kind === 'redirect');
  const problems: string[] = [];
  for (const row of rows) {
    const res = await request.get(`${row.from}?utm_source=seo-test`, { maxRedirects: 0 });
    const location = res.headers().location ?? '';
    const path = location ? new URL(location, 'http://x').pathname + new URL(location, 'http://x').search : '';
    if (res.status() !== 301 || path !== `${row.to}?utm_source=seo-test`) {
      problems.push(`#${row.n} ${row.from}: ${res.status()} → ${location}`);
      continue;
    }
    const target = await request.get(row.to ?? '/', { maxRedirects: 0 });
    if (target.status() !== 200) problems.push(`#${row.n} đích ${row.to}: ${target.status()}`);
  }
  expect(problems, problems.join('\n')).toEqual([]);
});

test('bài AI đã gỡ trả 410 + noindex (VI và EN)', async ({ request }) => {
  for (const row of legacyRedirects.filter((r) => r.kind === 'gone')) {
    const res = await request.get(row.from, { maxRedirects: 0 });
    expect(res.status(), row.from).toBe(410);
    expect(res.headers()['x-robots-tag'] ?? '', row.from).toContain('noindex');
  }
});

test('ảnh og:image cũ: giữ (200) hoặc 301 sang ảnh mới (AC-301-3)', async ({ request }) => {
  const problems: string[] = [];
  for (const asset of legacyAssets) {
    const res = await request.get(asset.from, { maxRedirects: 0 });
    if (asset.kind === 'keep' && (res.status() !== 200 || !/^image\//.test(res.headers()['content-type'] ?? ''))) {
      problems.push(`${asset.from}: ${res.status()} ${res.headers()['content-type']}`);
    }
    if (asset.kind === 'redirect') {
      const location = res.headers().location ?? '';
      if (res.status() !== 301 || new URL(location, 'http://x').pathname !== asset.to) {
        problems.push(`${asset.from}: ${res.status()} → ${location} (cần 301 → ${asset.to})`);
      }
    }
    if (asset.kind === 'gone' && res.status() !== 410) problems.push(`${asset.from}: ${res.status()} (cần 410)`);
  }
  expect(problems, problems.join('\n')).toEqual([]);
});
