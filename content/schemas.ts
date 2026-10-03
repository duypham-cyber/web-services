import { z } from 'zod';
import type { JobPosting } from './jobs';
import type { LegalDoc } from './legal';
import type { BrandPartner, MoneyFigure, PercentFigure } from './partners';
import { AC_CAPACITIES_BTU, type AcCapacityBtu, type PricingTable } from './pricing';

/**
 * Schema Zod cho mọi nội dung trong content/.
 * - Dữ liệu ở các file content/*.ts là dữ liệu thuần (không import zod) để client component đọc được
 *   mà không kéo zod vào bundle trình duyệt.
 * - content/validate.ts parse toàn bộ bằng các schema này. Root layout gọi nó khi render, nên dữ liệu sai
 *   làm `next build` FAIL; tests/unit/content.test.ts kiểm cùng điều đó trong CI.
 */

export const localeSchema = z.enum(['vi', 'en']);

/** Chuỗi có đủ 2 ngôn ngữ. Bản EN là nháp cho tới khi người bản ngữ duyệt (docs/03 mục 15 dòng 18). */
export const localizedTextSchema = z
  .object({
    vi: z.string().trim().min(1),
    en: z.string().trim().min(1),
  })
  .strict();
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày theo dạng YYYY-MM-DD');

/** draft = chưa có bằng chứng/chưa duyệt → KHÔNG hiển thị ở production. approved = đã duyệt. */
export const publishStatusSchema = z.enum(['draft', 'approved']);
export type PublishStatus = z.infer<typeof publishStatusSchema>;

export const prioritySchema = z.enum(['P0', 'P1', 'P2']);

// ---------------------------------------------------------------------------------------------
// site.ts — thông tin pháp nhân và liên hệ
// ---------------------------------------------------------------------------------------------
export const siteSchema = z
  .object({
    brandName: z.string().min(1),
    url: z.url().refine((u) => u.startsWith('https://') && !u.endsWith('/'), 'URL tuyệt đối https, không có "/" cuối'),
    legalName: z
      .object({
        upper: z.string().min(1),
        titleCase: z.string().min(1),
      })
      .strict(),
    taxCode: z.string().regex(/^\d{10}(-\d{3})?$/),
    address: z
      .object({
        text: localizedTextSchema,
        note: z.string().min(1),
      })
      .strict(),
    hotline: z
      .object({
        display: localizedTextSchema,
        tel: z.string().regex(/^\+84\d{9}$/),
      })
      .strict(),
    email: z.email(),
    zalo: z
      .object({
        url: z.url(),
        status: publishStatusSchema,
        note: z.string().min(1),
      })
      .strict(),
    /** Chỉ thêm khi có link thật (docs/03 mục 13.4 P9: bỏ icon MXH chưa có link). */
    socials: z.array(z.object({ name: z.string().min(1), url: z.url() }).strict()),
    sources: z.array(z.string().min(1)).min(1),
  })
  .strict();
export type Site = z.infer<typeof siteSchema>;

// ---------------------------------------------------------------------------------------------
// stats.ts — bộ KPI K1–K6 (docs/03 mục 14.2)
// ---------------------------------------------------------------------------------------------
export const statIdSchema = z.enum(['K1', 'K2', 'K3', 'K4', 'K5', 'K6']);
export type StatId = z.infer<typeof statIdSchema>;

/** Cách định dạng số KPI (lib/format.ts → formatStatValue). "minutes": mốc tính bằng phút (K6 "60 phút"). */
export const statFormatSchema = z.enum(['integer', 'of-34', 'percent', 'hours', 'minutes']);

/**
 * Bản chất của `value` (D-26, D-27):
 *   measured  — số ĐO THẬT theo `definition` (vd đơn nghiệm thu trong 12 tháng). Không kèm "+".
 *   published — số CÔNG BỐ hoặc mốc CAM KẾT đã được anh Duy duyệt (vd "500+ thợ", "xác nhận lịch trong vòng 60 phút").
 *               Không phải số đo: label/definition phải nói đúng bản chất (không gọi là "đang hoạt động", "trung bình").
 */
export const statBasisSchema = z.enum(['measured', 'published']);
export type StatBasis = z.infer<typeof statBasisSchema>;

/** Ba vùng điều phối (content/provinces.ts → regions). */
export const regionSchema = z.enum(['north', 'central', 'south']);

/**
 * Số thợ theo miền (chỉ K1). Tên miền giữ đúng như nguồn ghi (site cũ /system-map tách "Mekong" khỏi Miền Nam);
 * `region` = vùng tương ứng trên site mới để đặt đúng thẻ vùng ở /mang-luoi và cảnh vùng của hero bản đồ.
 * Dùng cho cả số đã duyệt (`byRegion`) lẫn số site cũ (`legacyByRegion`).
 */
export const statRegionCountSchema = z
  .object({
    region: regionSchema,
    label: localizedTextSchema,
    value: z.number().int().nonnegative(),
    /** Số kèm "+" (vd "120+ thợ"). */
    plus: z.boolean(),
  })
  .strict();
/** Tên cũ của statRegionCountSchema (giữ tương thích ngược). */
export const statLegacyRegionSchema = statRegionCountSchema;

export const statSchema = z
  .object({
    id: statIdSchema,
    label: localizedTextSchema,
    definition: localizedTextSchema,
    /**
     * Số hiển thị ở MỌI môi trường: số đo thật hoặc số công bố/mốc cam kết đã duyệt (xem `basis`).
     * null = chưa có số được duyệt → ô KPI bị ẩn ở production. KHÔNG điền số ước.
     */
    value: z.number().nonnegative().nullable(),
    format: statFormatSchema,
    /** Bản chất của `value`; bỏ trống = "measured". Chỉ dùng khi có value. */
    basis: statBasisSchema.optional(),
    /** `value` kèm dấu "+" ("500+"). Chỉ với basis "published" — số đo thật không có "+". */
    plus: z.boolean().optional(),
    /** Ngày đo / ngày duyệt (YYYY-MM-DD). Có value thì bắt buộc. */
    updatedAt: isoDateSchema.nullable(),
    /** Ai cấp hoặc ai duyệt, đo thế nào. Có value thì bắt buộc. */
    source: z.string().min(1).nullable(),
    /** Khóa route (lib/routes.ts) nơi KPI được phép hiện. */
    showOn: z.array(z.string().min(1)).min(1),
    /**
     * Số theo miền ĐÃ DUYỆT (chỉ K1) — hiện ở mọi môi trường qua lib/stats.ts regionCounts(), không kèm nhãn nháp.
     * Dùng chung updatedAt/source của KPI. Chỉ dùng khi có value.
     */
    byRegion: z.array(statRegionCountSchema).optional(),
    /**
     * Số ĐANG GHI trên site cũ (lapdattoanquoc.vn), để bản xem trước bớt ô trống. CHỈ hiện khi DRAFT_PREVIEW=1 và KPI
     * chưa có value, kèm nhãn "Nháp · số site cũ"; production KHÔNG BAO GIỜ hiện (cổng duy nhất: lib/stats.ts, có unit
     * test). Không phải số đo theo `definition`. null = site cũ không có số này.
     */
    legacyValue: z.number().nonnegative().nullable(),
    /** Site cũ ghi kèm dấu "+" (vd "500+"). */
    legacyPlus: z.boolean().optional(),
    /** Định dạng của số site cũ khi khác `format` (vd K6: site cũ ghi "60 phút" → "minutes"). Mặc định = `format`. */
    legacyFormat: statFormatSchema.optional(),
    /** Trang + câu nguyên văn trên site cũ + ngày crawl; ghi cả chỗ site cũ tự mâu thuẫn. Có legacyValue thì bắt buộc. */
    legacySource: z.string().min(1).nullable(),
    /** Số theo miền site cũ ghi (chỉ K1, trang /system-map). Cùng luật hiển thị với legacyValue. */
    legacyByRegion: z.array(statRegionCountSchema).optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.value !== null && (s.updatedAt === null || s.source === null)) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: có value thì phải có updatedAt và source` });
    }
    if (s.value === null && (s.basis !== undefined || s.plus !== undefined || s.byRegion !== undefined)) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: basis/plus/byRegion chỉ dùng khi có value (số đã duyệt)` });
    }
    if (s.plus === true && s.basis !== 'published') {
      ctx.addIssue({ code: 'custom', message: `${s.id}: dấu "+" chỉ dùng cho số công bố đã duyệt (basis "published")` });
    }
    if (s.byRegion?.some((r) => r.plus) && s.basis !== 'published') {
      ctx.addIssue({ code: 'custom', message: `${s.id}: số theo miền có "+" chỉ dùng với basis "published"` });
    }
    if (s.value !== null && s.format === 'percent' && s.value > 100) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: phần trăm phải ≤ 100` });
    }
    if (s.value !== null && s.format === 'of-34' && s.value > 34) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: số tỉnh phải ≤ 34` });
    }
    const hasLegacy = s.legacyValue !== null || (s.legacyByRegion?.length ?? 0) > 0;
    if (hasLegacy && s.legacySource === null) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: có số site cũ thì phải có legacySource (trang, câu nguyên văn, ngày crawl)` });
    }
    if (s.legacyValue === null && (s.legacyPlus !== undefined || s.legacyFormat !== undefined)) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: legacyPlus/legacyFormat chỉ dùng khi có legacyValue` });
    }
    const legacyFormat = s.legacyFormat ?? s.format;
    if (s.legacyValue !== null && legacyFormat === 'of-34' && s.legacyValue > 34) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: số tỉnh site cũ phải ≤ 34` });
    }
    if (s.legacyValue !== null && legacyFormat === 'percent' && s.legacyValue > 100) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: phần trăm site cũ phải ≤ 100` });
    }
  });
export type Stat = z.infer<typeof statSchema>;
export type StatRegionCount = z.infer<typeof statRegionCountSchema>;
/** Tên cũ của StatRegionCount (giữ tương thích ngược). */
export type StatLegacyRegion = StatRegionCount;

// ---------------------------------------------------------------------------------------------
// claims/ — câu khẳng định cần bằng chứng (docs/04 R17, Q19)
// ---------------------------------------------------------------------------------------------
export const claimSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(\.[a-z0-9-]+)+$/, 'id dạng "nhom.ten-khang-dinh"'),
    text: localizedTextSchema,
    status: publishStatusSchema,
    /** Mô tả bằng chứng + đường dẫn (hợp đồng, báo cáo vận hành, chính sách...). */
    evidence: z.string().min(1).nullable(),
    approvedBy: z.string().min(1).nullable(),
    approvedAt: isoDateSchema.nullable(),
    note: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (c.status === 'approved' && (c.evidence === null || c.approvedBy === null || c.approvedAt === null)) {
      ctx.addIssue({ code: 'custom', message: `${c.id}: approved thì phải có evidence, approvedBy, approvedAt` });
    }
  });
export type Claim = z.infer<typeof claimSchema>;

// ---------------------------------------------------------------------------------------------
// process.ts — quy trình vận hành 5 bước + bước 00 (docs/03 mục 14.1)
// ---------------------------------------------------------------------------------------------
export const processStepSchema = z
  .object({
    id: z.enum(['00', '01', '02', '03', '04', '05']),
    title: localizedTextSchema,
    actor: localizedTextSchema,
    description: localizedTextSchema,
    /** Bước 00 "Khách mua hàng" là sự kiện kích hoạt: hiển thị nhạt, không đếm là một bước. */
    isTrigger: z.boolean(),
  })
  .strict();
export type ProcessStep = z.infer<typeof processStepSchema>;

// ---------------------------------------------------------------------------------------------
// sla.ts — SLA và bảo hành (placeholder; cột "đang ghi" lấy từ site/chính sách cũ)
// ---------------------------------------------------------------------------------------------
export const slaItemSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    label: localizedTextSchema,
    /** Điều site cũ/chính sách hiện hành đang ghi (có thể tự mâu thuẫn) — để anh Duy đối chiếu. */
    current: localizedTextSchema,
    currentSource: z.string().min(1),
    /** Giá trị chuẩn sau khi anh Duy + pháp chế chốt. null = chưa chốt → không hiển thị cam kết. */
    value: localizedTextSchema.nullable(),
    status: publishStatusSchema,
    approvedBy: z.string().min(1).nullable(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.status === 'approved' && (s.value === null || s.approvedBy === null)) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: approved thì phải có value và approvedBy` });
    }
  });
export type SlaItem = z.infer<typeof slaItemSchema>;

// ---------------------------------------------------------------------------------------------
// provinces.ts — 34 đơn vị hành chính cấp tỉnh (sau sắp xếp 2025). regionSchema khai báo ở mục stats (dùng chung).
// ---------------------------------------------------------------------------------------------
export const provinceSchema = z
  .object({
    code: z.string().regex(/^\d{2}$/),
    name: localizedTextSchema,
    region: regionSchema,
    /** Thành phố trực thuộc trung ương. */
    isCentralCity: z.boolean(),
    /** Số thợ K1 của tỉnh. null = chưa có số (hiển thị "chưa có số", KHÔNG bịa). */
    technicianCount: z.number().int().nonnegative().nullable(),
    /** unknown = chưa xác nhận; confirmed = có thợ (dùng cho JSON-LD areaServed); none = chưa có thợ. */
    coverage: z.enum(['unknown', 'confirmed', 'none']),
    updatedAt: isoDateSchema.nullable(),
  })
  .strict();
export type Province = z.infer<typeof provinceSchema>;

export const archipelagoSchema = z
  .object({
    id: z.enum(['hoang-sa', 'truong-sa']),
    label: localizedTextSchema,
    parentCode: z.string().regex(/^\d{2}$/),
    labelStatus: publishStatusSchema,
    note: z.string().min(1),
  })
  .strict();

/** Ba vùng điều phối (provinces.ts → regions): tên + phạm vi theo cách Bluebolt tự mô tả trên site cũ. */
export const regionInfoSchema = z
  .object({
    id: regionSchema,
    name: localizedTextSchema,
    scope: localizedTextSchema,
  })
  .strict();

/** Tên tỉnh cũ đã nhập vào tỉnh mới (provinces.ts → formerNames): khóa = mã tỉnh mới. */
export const formerNamesSchema = z.record(z.string().regex(/^\d{2}$/), z.array(z.string().trim().min(1)).min(1));

// ---------------------------------------------------------------------------------------------
// redirects.ts — 34 URL cũ trong sitemap (docs/03 mục 10.3)
// ---------------------------------------------------------------------------------------------
export const legacyPathSchema = z
  .string()
  .regex(/^\/[^\s?#]*$/, 'Đường dẫn bắt đầu bằng "/", không có query/hash')
  .refine((p) => p === '/' || !p.endsWith('/'), 'Không có "/" cuối (biến thể "/" cuối xử lý ở openresty, docs/04 mục 2.7)');

export const redirectRowSchema = z
  .object({
    n: z.number().int().min(1),
    from: legacyPathSchema,
    to: legacyPathSchema.nullable(),
    kind: z.enum(['keep', 'redirect', 'gone']),
    note: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((r, ctx) => {
    if (r.kind === 'keep' && r.to !== r.from) ctx.addIssue({ code: 'custom', message: `#${r.n}: "keep" thì to === from` });
    if (r.kind === 'redirect' && (r.to === null || r.to === r.from)) {
      ctx.addIssue({ code: 'custom', message: `#${r.n}: "redirect" cần đích khác nguồn` });
    }
    if (r.kind === 'gone' && r.to !== null) ctx.addIssue({ code: 'custom', message: `#${r.n}: "gone" (410) thì to = null` });
  });
export type RedirectRow = z.infer<typeof redirectRowSchema>;

// ---------------------------------------------------------------------------------------------
// services.ts / articles.ts — tham số cho route động /dich-vu/[slug], /kien-thuc/[slug]
// ---------------------------------------------------------------------------------------------
const slugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug không dấu, kebab-case');
export const localizedSlugSchema = z.object({ vi: slugSchema, en: slugSchema }).strict();

export const serviceSchema = z
  .object({
    key: slugSchema,
    slug: localizedSlugSchema,
    title: localizedTextSchema,
    priority: prioritySchema,
  })
  .strict()
  .refine((s) => s.key === s.slug.vi, 'key = slug VI');
export type Service = z.infer<typeof serviceSchema>;

export const articleSchema = z
  .object({
    key: slugSchema,
    slug: localizedSlugSchema,
    title: localizedTextSchema,
    category: z.enum(['installation-guide', 'technical-knowledge', 'b2b']),
    /** URL cũ gộp về bài này (để đối chiếu với redirects.ts). */
    legacyPaths: z.array(legacyPathSchema).min(1),
    status: z.enum(['to-migrate', 'migrated']),
  })
  .strict()
  .refine((a) => a.key === a.slug.vi, 'key = slug VI');
export type Article = z.infer<typeof articleSchema>;

// ---------------------------------------------------------------------------------------------
// pricing.ts — khung giá VẬT TƯ tham khảo /bang-gia (chủ sở hữu dữ liệu: agent B2B). Chuyển từ
// components/pricing/pricing-schema.ts về đây (đề xuất B1 của agent B2B): validateContent() kiểm cùng mọi file khác.
// ---------------------------------------------------------------------------------------------
const priceVndSchema = z
  .number()
  .int('Giá VNĐ phải là số nguyên')
  .positive()
  .refine((v) => v % 1000 === 0, 'Giá VNĐ làm tròn tới nghìn (đúng như bảng nguồn)');

const priceItemSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    device: z.enum(['air-conditioner']),
    group: z.enum(['copper-pipe', 'cable-drain']),
    item: localizedTextSchema,
    sourceLabel: z.string().min(1),
    capacityBtu: z
      .custom<AcCapacityBtu>((v) => (AC_CAPACITIES_BTU as readonly unknown[]).includes(v), 'Công suất phải có trong AC_CAPACITIES_BTU')
      .nullable(),
    unit: z.literal('m'),
    prices: z.object({ HCM: priceVndSchema, HN: priceVndSchema, OTHER: priceVndSchema, SPECIAL: priceVndSchema }).strict(),
  })
  .strict();

export const pricingTableSchema = z
  .object({
    currency: z.literal('VND'),
    vatIncluded: z.boolean(),
    effectiveFrom: isoDateSchema.nullable(),
    sourceYear: z.number().int().min(2020).max(2100),
    status: publishStatusSchema,
    approvedBy: z.string().min(1).nullable(),
    source: z.string().min(1),
    items: z.array(priceItemSchema).min(1),
  })
  .strict()
  .superRefine((t, ctx) => {
    if (t.status === 'approved' && (t.effectiveFrom === null || t.approvedBy === null)) {
      ctx.addIssue({ code: 'custom', message: 'pricing: approved thì phải có effectiveFrom và approvedBy' });
    }
    const ids = new Set<string>();
    for (const it of t.items) {
      if (ids.has(it.id)) ctx.addIssue({ code: 'custom', message: `pricing: trùng id "${it.id}"` });
      ids.add(it.id);
    }
  }) satisfies z.ZodType<PricingTable>;

// ---------------------------------------------------------------------------------------------
// jobs.ts — tin tuyển thợ /doi-tac-tho#viec-dang-tuyen (chủ sở hữu: agent partner; đề xuất P3)
// ---------------------------------------------------------------------------------------------
export const jobPostingSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    title: localizedTextSchema,
    provinceCode: z.string().regex(/^\d{2}$/),
    employment: z.literal('collaborator'),
    openings: z.number().int().positive().nullable(),
    status: publishStatusSchema,
    postedAt: isoDateSchema.nullable(),
    validThrough: isoDateSchema.nullable(),
    code: z.string().min(1).nullable(),
    source: z.string().min(1),
    note: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((j, ctx) => {
    // Tin được hiện ở production phải đủ trường của JobPosting (Google): ngày đăng + hạn nộp
    if (j.status === 'approved' && (j.postedAt === null || j.validThrough === null)) {
      ctx.addIssue({ code: 'custom', message: `${j.id}: approved thì phải có postedAt và validThrough` });
    }
    if (j.postedAt !== null && j.validThrough !== null && j.validThrough < j.postedAt) {
      ctx.addIssue({ code: 'custom', message: `${j.id}: validThrough phải ≥ postedAt` });
    }
  }) satisfies z.ZodType<JobPosting>;

// ---------------------------------------------------------------------------------------------
// legal.ts — 3 văn bản pháp lý (chủ sở hữu: agent partner; người viết nội dung: pháp chế; đề xuất P3)
// ---------------------------------------------------------------------------------------------
const anchorIdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'neo ASCII kebab-case');

const legalBlockSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('p'), text: localizedTextSchema }).strict(),
  z.object({ kind: z.literal('list'), items: z.array(localizedTextSchema).min(1) }).strict(),
  z
    .object({
      kind: z.literal('table'),
      caption: localizedTextSchema,
      head: z.array(localizedTextSchema).min(1),
      rows: z.array(z.array(localizedTextSchema).min(1)).min(1),
    })
    .strict(),
]);

const legalSubsectionSchema = z
  .object({
    id: anchorIdSchema,
    title: localizedTextSchema,
    blocks: z.array(legalBlockSchema),
    reviewNote: localizedTextSchema.optional(),
  })
  .strict();

const legalSectionSchema = z
  .object({
    id: anchorIdSchema,
    title: localizedTextSchema,
    blocks: z.array(legalBlockSchema).nullable(),
    subsections: z.array(legalSubsectionSchema).optional(),
    reviewNote: localizedTextSchema.optional(),
  })
  .strict();

export const legalDocSchema = z
  .object({
    key: z.enum(['privacy', 'terms', 'warranty']),
    status: publishStatusSchema,
    origin: z.enum(['legacy-site', 'outline', 'legal-team']),
    version: z.string().min(1).nullable(),
    effectiveFrom: isoDateSchema.nullable(),
    approvedBy: z.string().min(1).nullable(),
    approvedAt: isoDateSchema.nullable(),
    source: z.string().min(1),
    sections: z.array(legalSectionSchema).min(1),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.status === 'approved' && (d.version === null || d.effectiveFrom === null || d.approvedBy === null || d.approvedAt === null)) {
      ctx.addIssue({ code: 'custom', message: `${d.key}: approved thì phải có version, effectiveFrom, approvedBy, approvedAt` });
    }
    // Neo trong trang phải duy nhất (mục lục dính trỏ theo id)
    const ids = new Set<string>();
    for (const s of d.sections) {
      for (const id of [s.id, ...(s.subsections ?? []).map((x) => x.id)]) {
        if (ids.has(id)) ctx.addIssue({ code: 'custom', message: `${d.key}: trùng neo "${id}"` });
        ids.add(id);
      }
      for (const b of [...(s.blocks ?? []), ...(s.subsections ?? []).flatMap((x) => x.blocks)]) {
        if (b.kind === 'table' && b.rows.some((r) => r.length !== b.head.length)) {
          ctx.addIssue({ code: 'custom', message: `${d.key}#${s.id}: hàng bảng phải có ${b.head.length} ô như tiêu đề` });
        }
      }
    }
  }) satisfies z.ZodType<LegalDoc>;

// ---------------------------------------------------------------------------------------------
// partners.ts — logo đối tác (cần văn bản đồng ý), số tiền của thợ, link app (chủ sở hữu: agent partner; đề xuất P3)
// ---------------------------------------------------------------------------------------------
export const brandPartnerSchema = z
  .object({
    name: z.string().min(1),
    logo: z.string().regex(/^\/[^\s]+\.(svg|avif|webp|png)$/, 'Logo là file trong /public (svg, avif, webp, png)'),
    kind: z.enum(['brand', 'marketplace', 'retail']),
    consentDoc: z.string().min(1).nullable(),
    consentDate: isoDateSchema.nullable(),
  })
  .strict()
  .refine((p) => (p.consentDoc === null) === (p.consentDate === null), 'consentDoc và consentDate đi cùng nhau') satisfies z.ZodType<BrandPartner>;

const moneyFigureSchema = z
  .object({
    min: z.number().int().nonnegative().nullable(),
    max: z.number().int().nonnegative().nullable(),
    definition: localizedTextSchema,
    updatedAt: isoDateSchema.nullable(),
    source: z.string().min(1).nullable(),
  })
  .strict()
  .superRefine((f, ctx) => {
    if ((f.min === null) !== (f.max === null)) ctx.addIssue({ code: 'custom', message: 'min và max cùng có hoặc cùng null' });
    if (f.min !== null && f.max !== null && f.min > f.max) ctx.addIssue({ code: 'custom', message: 'min phải ≤ max' });
    if (f.min !== null && (f.updatedAt === null || f.source === null)) {
      ctx.addIssue({ code: 'custom', message: 'có số thì phải có updatedAt và source' });
    }
  }) satisfies z.ZodType<MoneyFigure>;

const percentFigureSchema = z
  .object({
    value: z.number().min(0).max(100).nullable(),
    definition: localizedTextSchema,
    updatedAt: isoDateSchema.nullable(),
    source: z.string().min(1).nullable(),
  })
  .strict()
  .refine((f) => f.value === null || (f.updatedAt !== null && f.source !== null), 'có số thì phải có updatedAt và source') satisfies z.ZodType<PercentFigure>;

export const technicianEarningsSchema = z
  .object({ monthlyReference: moneyFigureSchema, platformFee: percentFigureSchema })
  .strict();

export const technicianAppSchema = z
  .object({
    androidUrl: z.url().nullable(),
    iosUrl: z.url().nullable(),
    note: z.string().min(1),
  })
  .strict();
