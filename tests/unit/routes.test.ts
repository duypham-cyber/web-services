import { describe, expect, it } from 'vitest';
import { routing } from '@/i18n/routing';
import { absoluteUrl, findRoute, getRoute, localizePath, ROUTES } from '@/lib/routes';

describe('lib/routes.ts — nguồn route duy nhất', () => {
  it('mọi khóa pathnames đều có route cụ thể', () => {
    for (const pathname of Object.keys(routing.pathnames)) {
      expect(ROUTES.some((r) => r.pathname === pathname), pathname).toBe(true);
    }
  });

  it('khóa route và URL không trùng', () => {
    expect(new Set(ROUTES.map((r) => r.key)).size).toBe(ROUTES.length);
    expect(new Set(ROUTES.map((r) => r.paths.vi)).size).toBe(ROUTES.length);
    expect(new Set(ROUTES.map((r) => r.paths.en)).size).toBe(ROUTES.length);
  });

  it('VI không tiền tố, EN có /en; slug không dấu, không "/" cuối', () => {
    for (const r of ROUTES) {
      expect(r.paths.vi.startsWith('/en')).toBe(false);
      expect(r.paths.en === '/en' || r.paths.en.startsWith('/en/')).toBe(true);
      for (const p of [r.paths.vi, r.paths.en]) {
        expect(p).toMatch(/^\/[a-z0-9/-]*$/);
        if (p !== '/') expect(p.endsWith('/')).toBe(false);
      }
    }
  });

  it('ví dụ ánh xạ theo docs/03 mục 10.1', () => {
    expect(localizePath('/', 'vi')).toBe('/');
    expect(localizePath('/', 'en')).toBe('/en');
    expect(getRoute('partners').paths).toEqual({ vi: '/doi-tac-tho', en: '/en/technician-partners' });
    expect(getRoute('services.lap-dat-dieu-hoa').paths).toEqual({
      vi: '/dich-vu/lap-dat-dieu-hoa',
      en: '/en/services/air-conditioner-installation',
    });
    expect(getRoute('solutions.retail').paths.en).toBe('/en/solutions/marketplaces-retail');
  });

  it('findRoute tra đúng trang tương ứng cho nút VI|EN (slug khác nhau)', () => {
    const r = findRoute('/kien-thuc/[slug]', 'hvac-industry-outlook-2026', 'en');
    expect(r?.paths.vi).toBe('/kien-thuc/tuong-lai-nganh-dien-lanh-2026');
    expect(findRoute('/doi-tac-tho', undefined, 'vi')?.paths.en).toBe('/en/technician-partners');
  });

  it('URL tuyệt đối dùng https://lapdattoanquoc.vn', () => {
    expect(absoluteUrl('/en/pricing')).toBe('https://lapdattoanquoc.vn/en/pricing');
  });

  it('trang /dev/* không được index', () => {
    for (const r of ROUTES.filter((x) => x.key.startsWith('dev.'))) expect(r.indexable).toBe(false);
  });
});
