import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { articles } from '../../content/articles';
import { ARTICLE_CONTENT, imageVisible, type Block, type ImageAsset } from '../../content/articles/all';
import { validateArticles } from '../../content/articles/schema';
import { legacyAssets, legacyRedirects } from '../../content/redirects';
import { DEFAULT_OG_IMAGE } from '../../content/seo';
import { locales, ROUTES } from '../../lib/routes';
import { seoFor } from '../../lib/seo';
import { hasVietnamese } from './vi-allowlist';

/**
 * Kiểm TĨNH (không trình duyệt) phần SEO + nội dung bài viết — agent nội dung & SEO.
 * Chạy: npx playwright test tests/seo/seo-content.spec.ts --project=desktop-1440
 * NFR-SEO-02 (title/description riêng), AC-SEO-1, AC-SEO-4 (ảnh OG), AC-301-1 (bảng 10.3), AC-I18N-1 (metadata EN).
 */
const ROOT = process.cwd();
const pub = (p: string) => join(ROOT, 'public', p.replace(/^\//, ''));

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'kiểm tĩnh: chỉ chạy một lần');
});

test('mọi route VI/EN có title ≤ 60, description 70–155, không trùng, EN không có tiếng Việt', () => {
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const problems: string[] = [];
  for (const route of ROUTES) {
    for (const locale of locales) {
      const seo = seoFor(route.key, locale);
      const id = `${route.key} [${locale}]`;
      if (!seo) {
        problems.push(`${id}: chưa có mục SEO (content/seo.ts)`);
        continue;
      }
      if (seo.title.length > 60) problems.push(`${id}: title ${seo.title.length} ký tự`);
      if (seo.description.length < 70 || seo.description.length > 155) {
        problems.push(`${id}: description ${seo.description.length} ký tự`);
      }
      if (/localhost|127\.0\.0\.1/.test(seo.title + seo.description)) problems.push(`${id}: có localhost`);
      if (locale === 'en' && (hasVietnamese(seo.title) || hasVietnamese(seo.description) || hasVietnamese(seo.label))) {
        problems.push(`${id}: metadata EN có tiếng Việt`);
      }
      const dupT = titles.get(seo.title);
      if (dupT) problems.push(`${id}: title trùng ${dupT}`);
      titles.set(seo.title, id);
      const dupD = descriptions.get(seo.description);
      if (dupD) problems.push(`${id}: description trùng ${dupD}`);
      descriptions.set(seo.description, id);
    }
  }
  expect(problems, problems.join('\n')).toEqual([]);
});

test('thân bài hợp lệ (Zod + giọng văn 11.5) và mọi ảnh tồn tại trong public/', async () => {
  expect(() => validateArticles()).not.toThrow();

  const missing: string[] = [];
  const collect = (blocks: readonly Block[], out: ImageAsset[]) => {
    for (const b of blocks) {
      if (b.type === 'figure') out.push(b.image);
      if (b.type === 'gallery') out.push(...b.items.map((i) => i.image));
      if (b.type === 'steps') for (const s of b.items) collect(s.blocks, out);
    }
  };
  for (const [key, content] of Object.entries(ARTICLE_CONTENT)) {
    const images: ImageAsset[] = content.hero ? [content.hero] : [];
    collect(content.intro, images);
    for (const s of content.sections) collect(s.blocks, images);
    for (const img of images) {
      if (!existsSync(pub(img.src))) {
        missing.push(`${key}: ${img.src}`);
        continue;
      }
      const meta = await sharp(pub(img.src)).metadata();
      if (meta.width !== img.width || meta.height !== img.height) {
        missing.push(`${key}: ${img.src} khai ${img.width}×${img.height}, thật ${meta.width}×${meta.height}`);
      }
    }
    // Bản EN không được có ảnh nào chỉ dành cho VI ở vị trí ảnh đầu bài
    if (content.hero && !imageVisible(content.hero, 'en')) missing.push(`${key}: ảnh đầu bài chỉ có bản VI`);
  }
  expect(missing, missing.join('\n')).toEqual([]);
});

test('ảnh Open Graph: 1200×630, JPG/PNG, ≤ 300 KB (AC-SEO-4)', async () => {
  const files = [
    ...Object.values(DEFAULT_OG_IMAGE).map((o) => o.src),
    ...Object.values(ARTICLE_CONTENT).flatMap((c) => (c.ogImage ? [c.ogImage.src] : [])),
  ];
  const problems: string[] = [];
  for (const src of files) {
    const file = pub(src);
    if (!existsSync(file)) {
      problems.push(`${src}: không có file`);
      continue;
    }
    const meta = await sharp(file).metadata();
    if (meta.width !== 1200 || meta.height !== 630) problems.push(`${src}: ${meta.width}×${meta.height}`);
    if (!['jpeg', 'png'].includes(meta.format ?? '')) problems.push(`${src}: định dạng ${meta.format}`);
    if (statSync(file).size > 300 * 1024) problems.push(`${src}: ${(statSync(file).size / 1024).toFixed(0)} KB`);
  }
  expect(problems, problems.join('\n')).toEqual([]);
});

test('34 dòng chuyển URL khớp bảng docs/03 mục 10.3; mọi bài cũ có đích; ảnh og:image cũ còn file', () => {
  const doc = readFileSync(join(ROOT, 'docs/03-DINH-HUONG-THIET-KE-3D.md'), 'utf8');
  const section = doc.slice(doc.indexOf('### 10.3'), doc.indexOf('## 11.'));
  const rows = section
    .split('\n')
    .filter((line) => /^\| \d+ \|/.test(line))
    .map((line) => {
      const cells = line.split('|').map((c) => c.trim());
      const n = Number(cells[1]);
      const from = /`([^`]+)`/.exec(cells[2] ?? '')?.[1] ?? '';
      const target = cells[3] ?? '';
      const gone = /^\**410/.test(target);
      const to = gone ? null : (/`([^`]+)`/.exec(target)?.[1] ?? null);
      return { n, from, to };
    });
  expect(rows).toHaveLength(34);
  for (const row of rows) {
    const mine = legacyRedirects.find((r) => r.n === row.n);
    expect(mine, `dòng ${row.n}`).toBeTruthy();
    expect(mine?.from, `dòng ${row.n} from`).toBe(row.from);
    expect(mine?.to ?? null, `dòng ${row.n} to`).toBe(row.to);
  }
  // Bài cũ (/news/<slug>, /en/news/<slug>) → đúng bài mới; bài AI → gone
  for (const a of articles) {
    for (const legacy of a.legacyPaths) {
      const row = legacyRedirects.find((r) => r.from === legacy);
      const expected = legacy.startsWith('/en/') ? `/en/knowledge/${a.slug.en}` : `/kien-thuc/${a.slug.vi}`;
      expect(row?.to, legacy).toBe(expected);
    }
  }
  // Ảnh og:image cũ: keep → file còn đúng đường dẫn; redirect → file đích tồn tại
  for (const asset of legacyAssets) {
    if (asset.kind === 'keep') expect(existsSync(pub(asset.from)), asset.from).toBe(true);
    if (asset.kind === 'redirect') expect(existsSync(pub(asset.to ?? '')), `${asset.from} → ${asset.to}`).toBe(true);
    if (asset.kind === 'gone') expect(existsSync(pub(asset.from)), `${asset.from} phải không còn`).toBe(false);
  }
});

test('deploy/openresty/lapdattoanquoc.conf và redirect-inventory.csv khớp content/redirects.ts', () => {
  const out = execFileSync(process.execPath, ['scripts/gen-openresty-map.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
  expect(out).toContain('khớp');
});
