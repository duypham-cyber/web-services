import type { Province } from './schemas';

/**
 * 34 đơn vị hành chính cấp tỉnh sau sắp xếp 2025. Mã và tên lấy từ public/data/vn34.topo.json
 * (thanglequoc/vietnamese-provinces-database, MIT; copy từ prototype/public/data, 31,7 KB, có Hoàng Sa và Trường Sa).
 * Chủ sở hữu: agent bản đồ (thêm số thợ khi vận hành cung cấp, docs/03 mục 15 dòng 5).
 *
 * Giả định, chờ vận hành xác nhận:
 *   - `region` chia 3 miền theo cách phổ biến (Bắc 15 · Trung và Tây Nguyên 11 · Nam 8); cách chia vùng SLA thật
 *     do vận hành quyết (docs/03 mục 15 dòng 5).
 *   - Tên EN theo cách viết phổ thông, chờ người biên tập EN bản ngữ duyệt.
 * technicianCount = null và coverage = "unknown" cho tới khi có số thật. KHÔNG bịa số.
 */
type P = Omit<Province, 'technicianCount' | 'coverage' | 'updatedAt'>;

const base: readonly P[] = [
  { code: '01', name: { vi: 'Hà Nội', en: 'Hanoi' }, region: 'north', isCentralCity: true },
  { code: '04', name: { vi: 'Cao Bằng', en: 'Cao Bang' }, region: 'north', isCentralCity: false },
  { code: '08', name: { vi: 'Tuyên Quang', en: 'Tuyen Quang' }, region: 'north', isCentralCity: false },
  { code: '11', name: { vi: 'Điện Biên', en: 'Dien Bien' }, region: 'north', isCentralCity: false },
  { code: '12', name: { vi: 'Lai Châu', en: 'Lai Chau' }, region: 'north', isCentralCity: false },
  { code: '14', name: { vi: 'Sơn La', en: 'Son La' }, region: 'north', isCentralCity: false },
  { code: '15', name: { vi: 'Lào Cai', en: 'Lao Cai' }, region: 'north', isCentralCity: false },
  { code: '19', name: { vi: 'Thái Nguyên', en: 'Thai Nguyen' }, region: 'north', isCentralCity: false },
  { code: '20', name: { vi: 'Lạng Sơn', en: 'Lang Son' }, region: 'north', isCentralCity: false },
  { code: '22', name: { vi: 'Quảng Ninh', en: 'Quang Ninh' }, region: 'north', isCentralCity: false },
  { code: '24', name: { vi: 'Bắc Ninh', en: 'Bac Ninh' }, region: 'north', isCentralCity: false },
  { code: '25', name: { vi: 'Phú Thọ', en: 'Phu Tho' }, region: 'north', isCentralCity: false },
  { code: '31', name: { vi: 'Hải Phòng', en: 'Hai Phong' }, region: 'north', isCentralCity: true },
  { code: '33', name: { vi: 'Hưng Yên', en: 'Hung Yen' }, region: 'north', isCentralCity: false },
  { code: '37', name: { vi: 'Ninh Bình', en: 'Ninh Binh' }, region: 'north', isCentralCity: false },
  { code: '38', name: { vi: 'Thanh Hóa', en: 'Thanh Hoa' }, region: 'central', isCentralCity: false },
  { code: '40', name: { vi: 'Nghệ An', en: 'Nghe An' }, region: 'central', isCentralCity: false },
  { code: '42', name: { vi: 'Hà Tĩnh', en: 'Ha Tinh' }, region: 'central', isCentralCity: false },
  { code: '44', name: { vi: 'Quảng Trị', en: 'Quang Tri' }, region: 'central', isCentralCity: false },
  { code: '46', name: { vi: 'Huế', en: 'Hue' }, region: 'central', isCentralCity: true },
  { code: '48', name: { vi: 'Đà Nẵng', en: 'Da Nang' }, region: 'central', isCentralCity: true },
  { code: '51', name: { vi: 'Quảng Ngãi', en: 'Quang Ngai' }, region: 'central', isCentralCity: false },
  { code: '52', name: { vi: 'Gia Lai', en: 'Gia Lai' }, region: 'central', isCentralCity: false },
  { code: '56', name: { vi: 'Khánh Hòa', en: 'Khanh Hoa' }, region: 'central', isCentralCity: false },
  { code: '66', name: { vi: 'Đắk Lắk', en: 'Dak Lak' }, region: 'central', isCentralCity: false },
  { code: '68', name: { vi: 'Lâm Đồng', en: 'Lam Dong' }, region: 'central', isCentralCity: false },
  { code: '75', name: { vi: 'Đồng Nai', en: 'Dong Nai' }, region: 'south', isCentralCity: false },
  { code: '79', name: { vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City' }, region: 'south', isCentralCity: true },
  { code: '80', name: { vi: 'Tây Ninh', en: 'Tay Ninh' }, region: 'south', isCentralCity: false },
  { code: '82', name: { vi: 'Đồng Tháp', en: 'Dong Thap' }, region: 'south', isCentralCity: false },
  { code: '86', name: { vi: 'Vĩnh Long', en: 'Vinh Long' }, region: 'south', isCentralCity: false },
  { code: '91', name: { vi: 'An Giang', en: 'An Giang' }, region: 'south', isCentralCity: false },
  { code: '92', name: { vi: 'Cần Thơ', en: 'Can Tho' }, region: 'south', isCentralCity: true },
  { code: '96', name: { vi: 'Cà Mau', en: 'Ca Mau' }, region: 'south', isCentralCity: false },
];

export const provinces: readonly Province[] = base.map((p) => ({
  ...p,
  technicianCount: null,
  coverage: 'unknown',
  updatedAt: null,
}));

/**
 * Hai quần đảo PHẢI luôn nằm trong khung mọi biểu diễn bản đồ, có nhãn ≥ 11 px (docs/04 NFR-MAP-01).
 * Nhãn EN chờ pháp chế duyệt chữ (docs/04 mục 6.3 P6).
 */
export const archipelagos = [
  {
    id: 'hoang-sa',
    label: { vi: 'QĐ. Hoàng Sa', en: 'Hoang Sa (Paracel) Is.' },
    parentCode: '48',
    labelStatus: 'draft',
    note: 'Thuộc TP. Đà Nẵng. Nhãn EN chờ pháp chế duyệt.',
  },
  {
    id: 'truong-sa',
    label: { vi: 'QĐ. Trường Sa', en: 'Truong Sa (Spratly) Is.' },
    parentCode: '56',
    labelStatus: 'draft',
    note: 'Thuộc tỉnh Khánh Hòa. Nhãn EN chờ pháp chế duyệt.',
  },
] as const;

/** File TopoJSON phục vụ tĩnh (object "vn34-all", 34 geometry, properties {code, name, nameEn}). */
export const VN34_TOPOJSON_PATH = '/data/vn34.topo.json';
