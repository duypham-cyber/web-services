/**
 * Khung giá VẬT TƯ tham khảo (thợ thu tại chỗ) cho /bang-gia — docs/03 mục 13.5, contracts/site-shell-p0.md mục 3.
 * Chủ sở hữu: agent trang B2B. Dữ liệu thuần, KHÔNG import zod (README rule 1). Schema Zod + ràng buộc nằm ở
 * components/pricing/pricing-schema.ts; trang /bang-gia gọi `assertPricingValid()` khi render → `next build` FAIL
 * nếu dữ liệu sai. (Đề xuất cho nền móng: chuyển schema vào content/schemas.ts + content/validate.ts.)
 *
 * NGUỒN DUY NHẤT — không thêm dòng/giá nào ngoài nguồn:
 *   Bảng "Bảng giá Vật Tư BLUEBOLT SERVICES 2026" trên lapdattoanquoc.vn/prices (crawl 01/10/2026), đã bấm "Xem thêm":
 *   research/agent-notes/content-cro/prices-interactive.json → "vatTuExpanded"; 3 dòng đầu cũng có ở research/raw/prices.txt.
 *   Tiêu đề cột trên trang cũ: "Lắp đặt (VND - chưa bao gồm VAT)"; 4 vùng "TP. HCM · TP. Hà Nội · Tỉnh/ TP Khác ·
 *   Khu vực đặc thù"; mỗi dòng "Đơn vị tính: Mét → /m". Tab "Bảng giá Dịch vụ" của trang cũ để trống → KHÔNG có giá công.
 *
 * Giả định, chờ anh Duy xác nhận (cũng ghi ở PREVIEW của trang):
 *   - effectiveFrom = null: nguồn chỉ ghi năm 2026, không có ngày hiệu lực. Theo site-shell-p0 mục 5 (EDGE CASES),
 *     bảng thiếu ngày hiệu lực hoặc VAT KHÔNG hiển thị ở production; bản xem trước hiện kèm nhãn "Nháp".
 *   - status = 'draft' cho tới khi anh Duy duyệt lại giá (approvedBy).
 *   - 4 giá mỗi dòng xếp theo đúng thứ tự cột vùng trên trang cũ.
 *   - Dòng "Ống đồng + gen máy" không ghi công suất → capacityBtu = null (trang ghi chú rõ, không đoán).
 *
 * Shape: gom theo hạng mục (dễ đọc, khớp bảng cũ). `priceRowsFlat()` trả đúng shape của contract
 * `{ item{vi,en}, unit, region, priceVnd, vatIncluded, effectiveFrom }` để sau này chuyển sang Payload.
 */

export const PRICE_REGIONS = ['HCM', 'HN', 'OTHER', 'SPECIAL'] as const;
export type PriceRegion = (typeof PRICE_REGIONS)[number];

/** Công suất máy lạnh có trong nguồn. null = nguồn không ghi. */
export const AC_CAPACITIES_BTU = [9000, 12000, 18000, 24000] as const;
export type AcCapacityBtu = (typeof AC_CAPACITIES_BTU)[number];

export type PriceItem = {
  /** kebab-case, duy nhất */
  id: string;
  /** Nhóm thiết bị — hiện chỉ có điều hòa (nguồn chỉ có vật tư đường ống máy lạnh). */
  device: 'air-conditioner';
  /** Nhóm vật tư */
  group: 'copper-pipe' | 'cable-drain';
  /** Tên hạng mục (viết lại từ nguồn, KHÔNG gồm công suất — công suất ở capacityBtu). */
  item: { vi: string; en: string };
  /** Tên nguyên văn trên bảng giá cũ — để đối chiếu, không render. */
  sourceLabel: string;
  capacityBtu: AcCapacityBtu | null;
  unit: 'm';
  /** Giá VNĐ, số nguyên, theo từng vùng. */
  prices: Record<PriceRegion, number>;
};

export type PricingTable = {
  currency: 'VND';
  /** false = giá chưa gồm VAT (nguồn: "VND - chưa bao gồm VAT"). */
  vatIncluded: boolean;
  /** Ngày hiệu lực YYYY-MM-DD. null = chưa rõ → production không hiện bảng. */
  effectiveFrom: string | null;
  /** Năm ghi trên bảng giá cũ (chỉ để hiện "nguồn" ở bản xem trước). */
  sourceYear: number;
  status: 'draft' | 'approved';
  approvedBy: string | null;
  source: string;
  items: readonly PriceItem[];
};

export const pricingTable = {
  currency: 'VND',
  vatIncluded: false,
  effectiveFrom: null,
  sourceYear: 2026,
  status: 'draft',
  approvedBy: null,
  source:
    'lapdattoanquoc.vn/prices, bảng "Bảng giá Vật Tư BLUEBOLT SERVICES 2026" (crawl 01/10/2026): research/agent-notes/content-cro/prices-interactive.json (vatTuExpanded), research/raw/prices.txt',
  items: [
    {
      id: 'copper-pipe-unspecified',
      device: 'air-conditioner',
      group: 'copper-pipe',
      item: { vi: 'Ống đồng và gen cách nhiệt', en: 'Copper pipe with insulation' },
      sourceLabel: 'Ống đồng + gen máy',
      capacityBtu: null,
      unit: 'm',
      prices: { HCM: 180_000, HN: 200_000, OTHER: 220_000, SPECIAL: 230_000 },
    },
    {
      id: 'copper-pipe-18000',
      device: 'air-conditioner',
      group: 'copper-pipe',
      item: { vi: 'Ống đồng và gen cách nhiệt', en: 'Copper pipe with insulation' },
      sourceLabel: 'Ống đồng + gen máy 18000BTU',
      capacityBtu: 18000,
      unit: 'm',
      prices: { HCM: 210_000, HN: 240_000, OTHER: 250_000, SPECIAL: 260_000 },
    },
    {
      id: 'copper-pipe-24000',
      device: 'air-conditioner',
      group: 'copper-pipe',
      item: { vi: 'Ống đồng và gen cách nhiệt', en: 'Copper pipe with insulation' },
      sourceLabel: 'Ống đồng + gen máy 24000BTU',
      capacityBtu: 24000,
      unit: 'm',
      prices: { HCM: 250_000, HN: 260_000, OTHER: 280_000, SPECIAL: 290_000 },
    },
    {
      id: 'cable-drain-9000',
      device: 'air-conditioner',
      group: 'cable-drain',
      item: { vi: 'Dây điện và ống thoát nước', en: 'Power cable and drain pipe' },
      sourceLabel: 'Dây điện + ống nước 9000BTU',
      capacityBtu: 9000,
      unit: 'm',
      prices: { HCM: 80_000, HN: 90_000, OTHER: 100_000, SPECIAL: 110_000 },
    },
    {
      id: 'cable-drain-12000',
      device: 'air-conditioner',
      group: 'cable-drain',
      item: { vi: 'Dây điện và ống thoát nước', en: 'Power cable and drain pipe' },
      sourceLabel: 'Dây điện + ống nước 12000BTU',
      capacityBtu: 12000,
      unit: 'm',
      prices: { HCM: 90_000, HN: 100_000, OTHER: 110_000, SPECIAL: 120_000 },
    },
    {
      id: 'cable-drain-18000',
      device: 'air-conditioner',
      group: 'cable-drain',
      item: { vi: 'Dây điện và ống thoát nước', en: 'Power cable and drain pipe' },
      sourceLabel: 'Dây điện + ống nước 18000BTU',
      capacityBtu: 18000,
      unit: 'm',
      prices: { HCM: 100_000, HN: 110_000, OTHER: 120_000, SPECIAL: 130_000 },
    },
  ],
} as const satisfies PricingTable;

/** Bảng có đủ điều kiện hiển thị ở production không (có ngày hiệu lực + đã duyệt). */
export function pricingPublishable(table: PricingTable = pricingTable): boolean {
  return table.effectiveFrom !== null && table.status === 'approved';
}

/** Dòng giá phẳng đúng shape contract site-shell-p0 mục 3 (một dòng mỗi hạng mục × vùng). */
export function priceRowsFlat(table: PricingTable = pricingTable) {
  return table.items.flatMap((it) =>
    PRICE_REGIONS.map((region) => ({
      id: `${it.id}.${region}`,
      item: it.item,
      capacityBtu: it.capacityBtu,
      unit: it.unit,
      region,
      priceVnd: it.prices[region],
      vatIncluded: table.vatIncluded,
      effectiveFrom: table.effectiveFrom,
    })),
  );
}
