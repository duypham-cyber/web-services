import type { Stat, StatId } from './schemas';

/** Nguồn chung của các số anh Duy duyệt ngày 03/10/2026 (docs/DECISIONS.md D-26 mục 2, bảng D-27). */
const APPROVED_D26 = 'Anh Duy duyệt 03/10/2026 (D-26) — số đang công bố trên lapdattoanquoc.vn, bộ NOI-DUNG.md mục 13';

/**
 * Bộ KPI DUY NHẤT của site (docs/03 mục 14.2). Mọi trang, cả VI và EN, đọc số từ đây — qua lib/stats.ts (statView,
 * regionCounts), không đọc trực tiếp trường legacy*.
 * Chủ sở hữu: tech lead nền móng; số do anh Duy + vận hành cung cấp và duyệt (docs/03 mục 15 dòng 4).
 *
 * Quy tắc (D-26, D-27):
 *   - value = số hiển thị ở MỌI môi trường, kèm updatedAt (YYYY-MM-DD) + source (ai cấp/duyệt, cách đo) — schema bắt buộc.
 *     Hai loại, phân biệt bằng `basis`:
 *       · "measured" (mặc định) — số ĐO THẬT theo `definition` (vd đơn nghiệm thu 12 tháng). Không kèm "+".
 *       · "published" — số CÔNG BỐ hoặc mốc CAM KẾT anh Duy đã duyệt: K1 "500+" (quy mô mạng lưới, KHÔNG phải số thợ
 *         hoạt động trong 90 ngày), K2 "34/34", K6 "60 phút" (mốc tối đa để xác nhận lịch, KHÔNG phải số trung bình).
 *         Được kèm "+" (`plus`) khi số duyệt có "+". label/definition phải nói đúng bản chất đó.
 *   - Chưa có số được duyệt → value null → ô KPI KHÔNG render ở production. Không tự điền số ước, không tự thêm "+",
 *     không tự chọn một con số khi các nguồn tự mâu thuẫn — chỉ số đã được duyệt mới vào value.
 *   - byRegion = số thợ theo miền ĐÃ DUYỆT (K1: Bắc 120+ · Trung 80+ · Nam 200+ · Mekong 60+, trang /system-map của site
 *     cũ, NOI-DUNG.md mục 10), hiện ở mọi môi trường qua regionCounts().
 *   - legacyValue (+ legacyPlus, legacyFormat, legacySource, legacyByRegion) = số ĐANG GHI trên site cũ (crawl
 *     02/10/2026, NOI-DUNG.md mục 13), chỉ để đối chiếu. CHỈ bản xem trước (DRAFT_PREVIEW=1) hiện, kèm nhãn
 *     "Nháp · số site cũ", và chỉ khi KPI chưa có value. Production KHÔNG BAO GIỜ hiện (lib/stats.ts +
 *     tests/unit/stats.test.ts). Có value thì value thắng ở mọi môi trường.
 */
export const stats: readonly Stat[] = [
  {
    id: 'K1',
    label: { vi: 'Thợ trong mạng lưới', en: 'Technicians in the network' },
    definition: {
      vi: 'Quy mô mạng lưới thợ kỹ thuật trên toàn quốc',
      en: 'Size of the nationwide technician network',
    },
    value: 500,
    format: 'integer',
    basis: 'published',
    plus: true,
    updatedAt: '2026-10-03',
    source: APPROVED_D26,
    showOn: ['home', 'network', 'partners'],
    byRegion: [
      { region: 'north', label: { vi: 'Miền Bắc', en: 'Northern region' }, value: 120, plus: true },
      { region: 'central', label: { vi: 'Miền Trung', en: 'Central region' }, value: 80, plus: true },
      { region: 'south', label: { vi: 'Miền Nam', en: 'Southern region' }, value: 200, plus: true },
      { region: 'south', label: { vi: 'Mekong', en: 'Mekong Delta' }, value: 60, plus: true },
    ],
    legacyValue: 500,
    legacyPlus: true,
    legacySource:
      'lapdattoanquoc.vn (crawl 02/10/2026): trang chủ "500+ Thợ chuyên nghiệp", "hơn 500+ thợ kỹ thuật tay nghề cao" ' +
      '(cả /intro, /services). Site cũ tự mâu thuẫn: bộ đếm "1,500+" không nhãn, "3000k + Thợ trên toàn quốc", tổng theo ' +
      'miền ở /system-map = 460. NOI-DUNG.md mục 13 thống nhất "500+" — anh Duy duyệt 03/10/2026 (D-26), nay ở value',
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
      vi: 'Số đơn vị hành chính cấp tỉnh (trên 34) có thợ trong mạng lưới',
      en: 'Provinces and cities (out of 34) where the network has technicians',
    },
    value: 34,
    format: 'of-34',
    basis: 'published',
    updatedAt: '2026-10-03',
    source: APPROVED_D26,
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
    // Mốc cam kết, KHÔNG phải số trung bình. Không nêu ai liên hệ: site cũ ghi CSKH, chính sách cũ và content/process.ts
    // (bước 03) ghi thợ — chờ anh Duy chốt (D-27). Cùng mốc với content/sla.ts "confirm-time" và claim b2b.sla.confirm-60-minutes.
    label: { vi: 'Xác nhận lịch trong vòng', en: 'Appointment confirmed within' },
    definition: {
      vi: 'Cam kết tối đa, tính từ lúc nhận đơn tới khi liên hệ khách xác nhận lịch lắp đặt',
      en: 'Maximum committed time from receiving an order to contacting the customer to confirm the installation slot',
    },
    value: 60,
    format: 'minutes',
    basis: 'published',
    updatedAt: '2026-10-03',
    source: APPROVED_D26,
    showOn: ['solutions.brands', 'solutions.retail'],
    legacyValue: 60,
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
