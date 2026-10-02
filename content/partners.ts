import type { LocalizedText } from './schemas';

/**
 * Dữ liệu khu vực "partner" (agent trang thợ & công ty):
 *   1. brandPartners — logo hãng/sàn đối tác (contracts/site-shell-p0.md mục 3, AC-DATA-4): CHỈ hiển thị khi có
 *      văn bản đồng ý (`consentDoc`). Hiện chưa có văn bản nào → danh sách rỗng, section "Đối tác" ẩn hẳn.
 *   2. technicianEarnings — số tiền của thợ (thu nhập tham khảo, phí nền tảng). null = chưa có số thật → KHÔNG hiển thị
 *      ở production; bản xem trước hiện ô giữ chỗ "chờ số" kèm nhãn Nháp. KHÔNG điền số ước.
 *   3. technicianApp — link tải app thợ. null = chưa có link thật → không hiện nút tải.
 *
 * Không có STK ngân hàng, không có logo/kiểu dáng hãng khi chưa có phép (CLAUDE.md, docs/03 mục 11.4).
 */

// ------------------------------------------------------------------------------------------------ 1. Đối tác
export type BrandPartner = {
  name: string;
  /** Đường dẫn logo trong /public (SVG/AVIF), nền trong suốt. */
  logo: string;
  kind: 'brand' | 'marketplace' | 'retail';
  /** Văn bản đồng ý dùng logo (số/ngày văn bản + nơi lưu). null → không hiển thị. */
  consentDoc: string | null;
  consentDate: string | null;
};

export const brandPartners: readonly BrandPartner[] = [];

/** Đối tác được phép hiển thị (đã có văn bản đồng ý). */
export function partnersWithConsent(): BrandPartner[] {
  return brandPartners.filter((p) => p.consentDoc !== null && p.consentDate !== null);
}

// ------------------------------------------------------------------------------------------------ 2. Thu nhập, phí
export type MoneyFigure = {
  /** VND. Khoảng [min, max]; một giá trị thì min = max. null = chưa có số thật. */
  min: number | null;
  max: number | null;
  definition: LocalizedText;
  /** YYYY-MM-DD */
  updatedAt: string | null;
  /** Ai cấp số, đo thế nào. */
  source: string | null;
};

export type PercentFigure = {
  /** Phần trăm trên tiền công mỗi đơn. null = chưa công bố. */
  value: number | null;
  definition: LocalizedText;
  updatedAt: string | null;
  source: string | null;
};

export const technicianEarnings: { monthlyReference: MoneyFigure; platformFee: PercentFigure } = {
  monthlyReference: {
    min: null,
    max: null,
    definition: {
      vi: 'Thu nhập mỗi tháng của thợ chính có ít nhất 1 đơn mỗi tuần trong 90 ngày gần nhất (đề xuất, chờ vận hành chốt cách đo)',
      en: 'Monthly earnings of lead technicians with at least one job a week over the last 90 days (proposed definition, pending operations)',
    },
    updatedAt: null,
    source: null,
  },
  platformFee: {
    value: null,
    definition: {
      vi: 'Phần Bluebolt giữ lại trên tiền công mỗi đơn (chính sách cũ chưa công bố mức phí)',
      en: "Bluebolt's share of the pay for each job (the old policy does not state a rate)",
    },
    updatedAt: null,
    source: null,
  },
};

/** Có số thu nhập tham khảo thật (đủ min, max, ngày, nguồn) hay chưa. */
export function hasEarningsFigure(f: MoneyFigure): f is MoneyFigure & { min: number; max: number; updatedAt: string } {
  return f.min !== null && f.max !== null && f.updatedAt !== null && f.source !== null;
}

/** Có mức phí nền tảng thật hay chưa. */
export function hasPercentFigure(f: PercentFigure): f is PercentFigure & { value: number; updatedAt: string } {
  return f.value !== null && f.updatedAt !== null && f.source !== null;
}

// ------------------------------------------------------------------------------------------------ 3. App thợ
export const technicianApp: { androidUrl: string | null; iosUrl: string | null; note: string } = {
  androidUrl: null,
  iosUrl: null,
  note: 'Site cũ không có link tải app thợ. Chờ link Google Play / App Store thật (contracts/lead-technician.md AC-T8).',
};
