import type { Stat, StatId } from './schemas';

/**
 * Bộ KPI DUY NHẤT của site (docs/03 mục 14.2). Mọi trang, cả VI và EN, đọc số từ đây.
 * Chủ sở hữu: tech lead nền móng; số thật do anh Duy + vận hành cung cấp (docs/03 mục 15 dòng 4).
 *
 * Quy tắc: value = null → ô KPI KHÔNG render (KpiTile tự ẩn). Không điền số ước, không "500+".
 * Khi có số: điền value + updatedAt (YYYY-MM-DD) + source (ai cấp, cách đo). Schema bắt buộc đủ 3 trường.
 */
export const stats: readonly Stat[] = [
  {
    id: 'K1',
    label: { vi: 'Thợ đang hoạt động', en: 'Active technicians' },
    definition: {
      vi: 'Thợ có ít nhất 1 đơn hoàn thành trong 90 ngày gần nhất',
      en: 'Technicians with at least one completed job in the last 90 days',
    },
    value: null,
    format: 'integer',
    updatedAt: null,
    source: null,
    showOn: ['home', 'network', 'partners'],
  },
  {
    id: 'K2',
    label: { vi: 'Tỉnh/thành có thợ', en: 'Provinces covered' },
    definition: {
      vi: 'Số đơn vị hành chính cấp tỉnh (trên 34) có ít nhất 1 thợ đang hoạt động (K1)',
      en: 'Provinces (out of 34) with at least one active technician (K1)',
    },
    value: null,
    format: 'of-34',
    updatedAt: null,
    source: null,
    showOn: ['home', 'network'],
  },
  {
    id: 'K3',
    label: { vi: 'Đơn hoàn thành 12 tháng', en: 'Jobs completed (12 months)' },
    definition: {
      vi: 'Đơn đã nghiệm thu trong 12 tháng gần nhất',
      en: 'Jobs signed off in the last 12 months',
    },
    value: null,
    format: 'integer',
    updatedAt: null,
    source: null,
    showOn: ['home', 'solutions.brands', 'solutions.retail'],
  },
  {
    id: 'K4',
    label: { vi: 'Hãng & Sàn đang hợp tác', en: 'Brand and retail partners' },
    definition: {
      vi: 'Đối tác có hợp đồng còn hiệu lực (logo chỉ hiện khi có văn bản đồng ý)',
      en: 'Partners with an active contract (logos shown only with written permission)',
    },
    value: null,
    format: 'integer',
    updatedAt: null,
    source: null,
    showOn: ['home', 'about'],
  },
  {
    id: 'K5',
    label: { vi: 'Tỷ lệ đúng hẹn', en: 'On-time rate' },
    definition: {
      vi: 'Phần trăm đơn thợ đến trong khung giờ đã xác nhận (chỉ hiện khi đo được)',
      en: 'Share of jobs where the technician arrived within the confirmed window (shown only when measured)',
    },
    value: null,
    format: 'percent',
    updatedAt: null,
    source: null,
    showOn: ['solutions.brands', 'solutions.retail'],
  },
  {
    id: 'K6',
    label: { vi: 'Thời gian xác nhận lịch trung bình', en: 'Average time to confirm' },
    definition: {
      vi: 'Từ lúc nhận đơn tới khi thợ xác nhận lịch hẹn (chỉ hiện khi đo được)',
      en: 'From order intake to the technician confirming the appointment (shown only when measured)',
    },
    value: null,
    format: 'hours',
    updatedAt: null,
    source: null,
    showOn: ['solutions.brands', 'solutions.retail'],
  },
];

export function getStat(id: StatId): Stat {
  const found = stats.find((s) => s.id === id);
  if (!found) throw new Error(`content/stats.ts: không có KPI ${id}`);
  return found;
}

/** KPI có số thật, theo thứ tự yêu cầu. Trang chủ tối đa K1–K4. */
export function statsWithValue(ids: readonly StatId[]): Stat[] {
  return ids.map(getStat).filter((s) => s.value !== null);
}
