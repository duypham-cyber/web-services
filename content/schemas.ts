import { z } from 'zod';

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

export const statSchema = z
  .object({
    id: statIdSchema,
    label: localizedTextSchema,
    definition: localizedTextSchema,
    /** null = chưa có số thật → ô KPI bị ẩn. KHÔNG điền số ước. */
    value: z.number().nonnegative().nullable(),
    format: z.enum(['integer', 'of-34', 'percent', 'hours']),
    updatedAt: isoDateSchema.nullable(),
    source: z.string().min(1).nullable(),
    /** Khóa route (lib/routes.ts) nơi KPI được phép hiện. */
    showOn: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.value !== null && (s.updatedAt === null || s.source === null)) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: có value thì phải có updatedAt và source` });
    }
    if (s.value !== null && s.format === 'percent' && s.value > 100) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: phần trăm phải ≤ 100` });
    }
    if (s.value !== null && s.format === 'of-34' && s.value > 34) {
      ctx.addIssue({ code: 'custom', message: `${s.id}: số tỉnh phải ≤ 34` });
    }
  });
export type Stat = z.infer<typeof statSchema>;

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
// provinces.ts — 34 đơn vị hành chính cấp tỉnh (sau sắp xếp 2025)
// ---------------------------------------------------------------------------------------------
export const regionSchema = z.enum(['north', 'central', 'south']);
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
