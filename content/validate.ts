import { z } from 'zod';
import { articles } from './articles';
import { validateArticles } from './articles/schema';
import { claims } from './claims';
import { jobPostings } from './jobs';
import { legalDocs } from './legal';
import { brandPartners, technicianApp, technicianEarnings } from './partners';
import { pricingTable } from './pricing';
import { processSteps } from './process';
import { archipelagos, formerNames, provinces, regions } from './provinces';
import { legacyRedirects } from './redirects';
import {
  archipelagoSchema,
  articleSchema,
  brandPartnerSchema,
  claimSchema,
  formerNamesSchema,
  jobPostingSchema,
  legalDocSchema,
  pricingTableSchema,
  processStepSchema,
  provinceSchema,
  redirectRowSchema,
  regionInfoSchema,
  serviceSchema,
  siteSchema,
  slaItemSchema,
  statSchema,
  technicianAppSchema,
  technicianEarningsSchema,
} from './schemas';
import { services } from './services';
import { site } from './site';
import { slaItems } from './sla';
import { stats } from './stats';

/**
 * Kiểm toàn bộ content/ bằng Zod + các ràng buộc chéo. Gọi từ root layout (server) → dữ liệu sai làm
 * `next build` FAIL ngay; dev server hiện lỗi đỏ. tests/unit/content.test.ts gọi cùng hàm này.
 * Chỉ import ở phía server (kéo theo zod).
 */
export function validateContent(): void {
  const problems: string[] = [];
  const check = <T>(name: string, schema: z.ZodType<T>, data: unknown) => {
    const r = schema.safeParse(data);
    if (!r.success) problems.push(`${name}: ${z.prettifyError(r.error)}`);
  };

  check('site.ts', siteSchema, site);
  check('stats.ts', z.array(statSchema).length(6), stats);
  check('claims/', z.array(claimSchema).min(1), claims);
  check('process.ts', z.array(processStepSchema).length(6), processSteps);
  check('sla.ts', z.array(slaItemSchema).min(1), slaItems);
  check('provinces.ts', z.array(provinceSchema).length(34), provinces);
  check('provinces.ts (archipelagos)', z.array(archipelagoSchema).length(2), archipelagos);
  check('redirects.ts', z.array(redirectRowSchema).length(34), legacyRedirects);
  check('services.ts', z.array(serviceSchema).length(4), services);
  check('articles.ts', z.array(articleSchema).min(1), articles);
  check('provinces.ts (regions)', z.array(regionInfoSchema).length(3), regions);
  check('provinces.ts (formerNames)', formerNamesSchema, formerNames);
  check('pricing.ts', pricingTableSchema, pricingTable);
  check('jobs.ts', z.array(jobPostingSchema), jobPostings);
  check('legal.ts', z.array(legalDocSchema).length(3), Object.values(legalDocs));
  check('partners.ts (brandPartners)', z.array(brandPartnerSchema), brandPartners);
  check('partners.ts (technicianEarnings)', technicianEarningsSchema, technicianEarnings);
  check('partners.ts (technicianApp)', technicianAppSchema, technicianApp);

  // --- Ràng buộc chéo ---
  const dup = <T>(name: string, values: readonly T[]) => {
    const seen = new Set<T>();
    for (const v of values) {
      if (seen.has(v)) problems.push(`${name}: trùng "${String(v)}"`);
      seen.add(v);
    }
  };
  dup('stats.ts id', stats.map((s) => s.id));
  dup('claims id', claims.map((c) => c.id));
  dup('provinces code', provinces.map((p) => p.code));
  dup('redirects n', legacyRedirects.map((r) => r.n));
  dup('redirects from', legacyRedirects.map((r) => r.from));
  dup('services slug vi', services.map((s) => s.slug.vi));
  dup('services slug en', services.map((s) => s.slug.en));
  dup('articles slug vi', articles.map((a) => a.slug.vi));
  dup('articles slug en', articles.map((a) => a.slug.en));
  dup('regions id', regions.map((r) => r.id));
  dup('jobs id', jobPostings.map((j) => j.id));
  dup('brandPartners name', brandPartners.map((p) => p.name));

  // Mã tỉnh tham chiếu phải có trong provinces.ts; mỗi vùng có ít nhất 1 tỉnh
  const provinceCodes = new Set(provinces.map((p) => p.code));
  for (const code of Object.keys(formerNames)) {
    if (!provinceCodes.has(code)) problems.push(`provinces.ts formerNames: mã tỉnh "${code}" không có trong provinces`);
  }
  for (const j of jobPostings) {
    if (!provinceCodes.has(j.provinceCode)) problems.push(`jobs.ts ${j.id}: mã tỉnh "${j.provinceCode}" không có trong provinces`);
  }
  for (const r of regions) {
    if (!provinces.some((p) => p.region === r.id)) problems.push(`provinces.ts: vùng "${r.id}" không có tỉnh nào`);
  }
  for (const [key, doc] of Object.entries(legalDocs)) {
    if (doc.key !== key) problems.push(`legal.ts: legalDocs.${key}.key = "${doc.key}"`);
  }

  // Mỗi URL cũ của bài viết phải trỏ về đúng bài mới trong redirects.ts
  for (const a of articles) {
    for (const legacy of a.legacyPaths) {
      const row = legacyRedirects.find((r) => r.from === legacy);
      const expected = legacy.startsWith('/en/') ? `/en/knowledge/${a.slug.en}` : `/kien-thuc/${a.slug.vi}`;
      if (!row) problems.push(`articles.ts: "${legacy}" chưa có trong redirects.ts`);
      else if (row.to !== expected) problems.push(`redirects.ts #${row.n}: "${legacy}" phải về "${expected}", đang là "${row.to}"`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Nội dung trong content/ không hợp lệ:\n- ${problems.join('\n- ')}`);
  }

  // Thân 6 bài Kiến thức (Zod + luật giọng văn) — content/articles/schema.ts (agent SEO); ném lỗi riêng nếu sai
  validateArticles();
}

let validated = false;

/** Gọi nhiều lần cũng chỉ kiểm 1 lần mỗi tiến trình. */
export function assertContentValid(): void {
  if (validated) return;
  validateContent();
  validated = true;
}
