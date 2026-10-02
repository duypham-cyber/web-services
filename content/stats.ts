import type { Stat, StatId } from './schemas';

/**
 * Bộ KPI DUY NHẤT của site (docs/03 mục 14.2). Mọi trang, cả VI và EN, đọc số từ đây — qua lib/stats.ts (statView),
 * không đọc trực tiếp trường legacy*.
 * Chủ sở hữu: tech lead nền móng; số thật do anh Duy + vận hành cung cấp (docs/03 mục 15 dòng 4).
 *
 * Quy tắc:
 *   - value = số ĐO THẬT theo `definition`. null → ô KPI KHÔNG render ở production. Không điền số ước, không "500+".
 *     Khi có số: điền value + updatedAt (YYYY-MM-DD) + source (ai cấp, cách đo). Schema bắt buộc đủ 3 trường.
 *   - legacyValue (+ legacyPlus, legacyFormat, legacySource, legacyByRegion) = số ĐANG GHI trên site cũ, lấy theo bộ đã
 *     thống nhất ở website-services-3d/noi-dung/NOI-DUNG.md mục 13 (crawl 02/10/2026). CHỈ bản xem trước
 *     (DRAFT_PREVIEW=1) hiện, kèm nhãn "Nháp · số site cũ", để anh Duy thấy chỗ số sẽ đứng và chốt số chính thức.
 *     Production KHÔNG BAO GIỜ hiện (lib/stats.ts + tests/unit/stats.test.ts). Site cũ không có số → null.
 *   - Có value thật thì value thắng, legacyValue bị bỏ qua ở mọi môi trường.
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
    legacyValue: 500,
    legacyPlus: true,
    legacySource:
      'lapdattoanquoc.vn (crawl 02/10/2026): trang chủ "500+ Thợ chuyên nghiệp", "hơn 500+ thợ kỹ thuật tay nghề cao" ' +
      '(cả /intro, /services). Site cũ tự mâu thuẫn: bộ đếm "1,500+" không nhãn, "3000k + Thợ trên toàn quốc", tổng theo ' +
      'miền ở /system-map = 460. NOI-DUNG.md mục 13 thống nhất "500+" — chờ anh Duy chốt số chính thức và cách đo (K1)',
    legacyByRegion: [
      { region: 'north', label: { vi: 'Miền Bắc', en: 'Northern region' }, value: 120, plus: true },
      { region: 'central', label: { vi: 'Miền Trung', en: 'Central region' }, value: 80, plus: true },
      { region: 'south', label: { vi: 'Miền Nam', en: 'Southern region' }, value: 200, plus: true },
      { region: 'south', label: { vi: 'Mekong', en: 'Mekong' }, value: 60, plus: true },
    ],
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
    legacyValue: 34,
    legacySource:
      'lapdattoanquoc.vn (crawl 02/10/2026): bộ đếm trang chủ "34 Tỉnh/ TP", "phủ sóng khắp 34 Tỉnh Thành"; chỗ khác vẫn ' +
      'ghi "63 tỉnh thành" (trang chủ, /intro, /services — số trước sắp xếp 01/07/2025). NOI-DUNG.md mục 13: giữ 34',
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
    legacyValue: null,
    legacySource: 'Site cũ không có số đơn: bộ đếm hiện "0k+" (NOI-DUNG.md mục 13 — chờ số liệu)',
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
    legacyValue: null,
    legacySource: 'Site cũ không có số Hãng/Sàn đối tác: bộ đếm hiện "0k+" (NOI-DUNG.md mục 13 — chờ số liệu)',
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
    legacyValue: null,
    legacySource: null,
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
    legacyValue: 60,
    legacyFormat: 'minutes',
    legacySource:
      'lapdattoanquoc.vn/services (crawl 02/10/2026): "CSKH liên hệ khách hàng trong vòng 60 phút để xác nhận thông tin và ' +
      'chốt lịch lắp đặt" — là mốc cam kết tối đa, không phải số đo trung bình; chính sách cũ lại ghi thợ liên hệ trong ' +
      'ngày (content/sla.ts). NOI-DUNG.md mục 13: "60 phút xác nhận lịch"',
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
