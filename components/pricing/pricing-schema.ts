import { z } from 'zod';
import { AC_CAPACITIES_BTU, pricingTable, type AcCapacityBtu, type PricingTable } from '@/content/pricing';

/**
 * Schema Zod cho content/pricing.ts (contracts/site-shell-p0.md mục 3: giá số nguyên VNĐ, có VAT, có ngày hiệu lực).
 * CHỈ import ở server (kéo theo zod). Trang /bang-gia gọi assertPricingValid() khi render → dữ liệu sai làm
 * `next build` FAIL (giống content/validate.ts của nền móng).
 * Đề xuất nền móng: chuyển schema này vào content/schemas.ts và gọi trong validateContent() (xem báo cáo B2B).
 */
const localized = z.object({ vi: z.string().trim().min(1), en: z.string().trim().min(1) }).strict();

const priceVnd = z
  .number()
  .int('Giá VNĐ phải là số nguyên')
  .positive()
  .refine((v) => v % 1000 === 0, 'Giá VNĐ làm tròn tới nghìn (đúng như bảng nguồn)');

const priceItemSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    device: z.enum(['air-conditioner']),
    group: z.enum(['copper-pipe', 'cable-drain']),
    item: localized,
    sourceLabel: z.string().min(1),
    capacityBtu: z
      .custom<AcCapacityBtu>((v) => (AC_CAPACITIES_BTU as readonly unknown[]).includes(v), 'Công suất phải có trong AC_CAPACITIES_BTU')
      .nullable(),
    unit: z.literal('m'),
    prices: z.object({ HCM: priceVnd, HN: priceVnd, OTHER: priceVnd, SPECIAL: priceVnd }).strict(),
  })
  .strict();

export const pricingTableSchema = z
  .object({
    currency: z.literal('VND'),
    vatIncluded: z.boolean(),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày theo dạng YYYY-MM-DD').nullable(),
    sourceYear: z.number().int().min(2020).max(2100),
    status: z.enum(['draft', 'approved']),
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

let validated = false;

/** Gọi nhiều lần cũng chỉ kiểm một lần mỗi tiến trình. Ném lỗi (build fail) nếu content/pricing.ts sai. */
export function assertPricingValid(): void {
  if (validated) return;
  const r = pricingTableSchema.safeParse(pricingTable);
  if (!r.success) throw new Error(`content/pricing.ts không hợp lệ:\n${z.prettifyError(r.error)}`);
  validated = true;
}
