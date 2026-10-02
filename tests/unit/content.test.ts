import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { articles } from '@/content/articles';
import { claims } from '@/content/claims';
import { provinces } from '@/content/provinces';
import { buildNextRedirects, GONE_PATHS, legacyAssets, legacyRedirects } from '@/content/redirects';
import { claimSchema, statSchema } from '@/content/schemas';
import { services } from '@/content/services';
import { site } from '@/content/site';
import { stats } from '@/content/stats';
import { validateContent } from '@/content/validate';
import { ROUTES } from '@/lib/routes';

describe('content/ — Zod + ràng buộc chéo (cùng hàm root layout gọi lúc build)', () => {
  it('validateContent() không lỗi', () => {
    expect(() => validateContent()).not.toThrow();
  });
});

describe('site.ts', () => {
  it('pháp nhân, MST, hotline hai định dạng (docs/03 mục 11.5)', () => {
    expect(site.legalName.upper).toBe('CÔNG TY CỔ PHẦN CÔNG NGHỆ TIA CHỚP XANH');
    expect(site.taxCode).toBe('0316875706');
    expect(site.hotline.display.vi).toBe('0902 808 049');
    expect(site.hotline.display.en).toBe('+84 902 808 049');
    expect(site.url).toBe('https://lapdattoanquoc.vn');
  });
  it('không có link mạng xã hội giả', () => {
    expect(site.socials).toEqual([]);
  });
});

describe('stats.ts — không bịa số', () => {
  it('đủ K1–K6, có định nghĩa VI/EN', () => {
    expect(stats.map((s) => s.id)).toEqual(['K1', 'K2', 'K3', 'K4', 'K5', 'K6']);
  });
  it('schema từ chối số thiếu ngày/nguồn', () => {
    const bad = { ...stats[0], value: 500 };
    expect(statSchema.safeParse(bad).success).toBe(false);
  });
});

describe('claims/', () => {
  it('schema từ chối "approved" thiếu bằng chứng/người duyệt', () => {
    const c = claims[0];
    expect(claimSchema.safeParse({ ...c, status: 'approved', evidence: null, approvedBy: null, approvedAt: null }).success).toBe(false);
  });
});

describe('provinces.ts ↔ public/data/vn34.topo.json', () => {
  const topo = JSON.parse(readFileSync('public/data/vn34.topo.json', 'utf8')) as {
    objects: Record<string, { geometries: { properties: { code: string } }[] }>;
  };
  const geoms = Object.values(topo.objects)[0]?.geometries ?? [];
  it('34 mã tỉnh khớp TopoJSON', () => {
    expect(geoms).toHaveLength(34);
    expect(new Set(geoms.map((g) => g.properties.code))).toEqual(new Set(provinces.map((p) => p.code)));
  });
  it('chưa có số thợ thì để null, không bịa', () => {
    for (const p of provinces) {
      if (p.technicianCount !== null) expect(p.updatedAt).not.toBeNull();
    }
  });
});

describe('redirects.ts (docs/03 mục 10.3)', () => {
  const livePaths = new Set(ROUTES.flatMap((r) => [r.paths.vi, r.paths.en]));
  it('đủ 34 dòng sitemap cũ', () => {
    expect(legacyRedirects).toHaveLength(34);
  });
  it('mọi đích 301 là route đang sống', () => {
    for (const r of buildNextRedirects()) expect(livePaths, `${r.source} → ${r.destination}`).toContain(r.destination);
  });
  it('301 dùng statusCode 301, không permanent (308)', () => {
    for (const r of buildNextRedirects()) {
      expect(r.statusCode).toBe(301);
      expect(r).not.toHaveProperty('permanent');
    }
  });
  it('URL cũ không đè lên route mới (trừ dòng "keep")', () => {
    for (const r of legacyRedirects.filter((x) => x.kind !== 'keep')) expect(livePaths).not.toContain(r.from);
  });
  it('dòng "keep" là route đang sống', () => {
    for (const r of legacyRedirects.filter((x) => x.kind === 'keep')) expect(livePaths).toContain(r.from);
  });
  it('ảnh og:image cũ: đích "keep"/301 là file có thật trong public/ (AC-301-3)', () => {
    for (const a of legacyAssets.filter((x) => x.kind !== 'gone')) {
      expect(existsSync(`public${a.to ?? ''}`), `${a.from} → ${a.to}`).toBe(true);
    }
  });
  it('410: bài AI (giả định Q10), cả VI và EN', () => {
    expect([...GONE_PATHS].sort()).toEqual([
      '/en/news/ky-nguyen-ai-nhung-nganh-bi-anh-huong',
      '/news/ky-nguyen-ai-nhung-nganh-bi-anh-huong',
    ]);
  });
});

describe('services.ts / articles.ts', () => {
  it('4 dịch vụ, slug VI ≠ EN, không dấu', () => {
    expect(services).toHaveLength(4);
    for (const s of services) {
      expect(s.slug.vi).not.toBe(s.slug.en);
      expect(s.slug.vi).toMatch(/^[a-z0-9-]+$/);
    }
  });
  it('6 bài sau khi gộp robot và gỡ bài AI', () => {
    expect(articles).toHaveLength(6);
  });
});
