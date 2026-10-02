import type { LocalizedText, Province } from './schemas';

/**
 * 34 đơn vị hành chính cấp tỉnh sau sắp xếp 2025. Mã và tên lấy từ public/data/vn34.topo.json
 * (thanglequoc/vietnamese-provinces-database, MIT; copy từ prototype/public/data, 31,7 KB, có Hoàng Sa và Trường Sa).
 * Chủ sở hữu: agent bản đồ (thêm số thợ khi vận hành cung cấp, docs/03 mục 15 dòng 5).
 * Bản đồ đã chiếu (components/map/vn34-map.generated.ts) sinh từ file này + TopoJSON: `node scripts/make-map.mjs`.
 *
 * Vùng: theo cách Bluebolt tự chia trên site cũ (trang /worker-map, crawl 02/10/2026 — website-services-3d/noi-dung):
 *   Miền Bắc 18 = từ Hà Tĩnh trở ra · Miền Trung 4 = từ Quảng Trị (mới) tới Quảng Ngãi (mới) · Miền Nam 12 = từ
 *   Gia Lai (mới) trở vào. Thay cho cách chia "phổ biến" 15/11/8 của bản nền móng (D-06). Cách chia vùng SLA thật
 *   vẫn do vận hành chốt — giả định, chờ anh Duy.
 * Tên EN theo cách viết phổ thông, chờ người biên tập EN bản ngữ duyệt.
 * technicianCount = null và coverage = "unknown" cho tới khi có số thật. KHÔNG bịa số.
 */
type P = Omit<Province, 'technicianCount' | 'coverage' | 'updatedAt'>;

const base: readonly P[] = [
  // Miền Bắc — từ Hà Tĩnh trở ra
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
  { code: '38', name: { vi: 'Thanh Hóa', en: 'Thanh Hoa' }, region: 'north', isCentralCity: false },
  { code: '40', name: { vi: 'Nghệ An', en: 'Nghe An' }, region: 'north', isCentralCity: false },
  { code: '42', name: { vi: 'Hà Tĩnh', en: 'Ha Tinh' }, region: 'north', isCentralCity: false },
  // Miền Trung — từ Quảng Trị (mới) tới Quảng Ngãi (mới)
  { code: '44', name: { vi: 'Quảng Trị', en: 'Quang Tri' }, region: 'central', isCentralCity: false },
  { code: '46', name: { vi: 'Huế', en: 'Hue' }, region: 'central', isCentralCity: true },
  { code: '48', name: { vi: 'Đà Nẵng', en: 'Da Nang' }, region: 'central', isCentralCity: true },
  { code: '51', name: { vi: 'Quảng Ngãi', en: 'Quang Ngai' }, region: 'central', isCentralCity: false },
  // Miền Nam — từ Gia Lai (mới) trở vào
  { code: '52', name: { vi: 'Gia Lai', en: 'Gia Lai' }, region: 'south', isCentralCity: false },
  { code: '56', name: { vi: 'Khánh Hòa', en: 'Khanh Hoa' }, region: 'south', isCentralCity: false },
  { code: '66', name: { vi: 'Đắk Lắk', en: 'Dak Lak' }, region: 'south', isCentralCity: false },
  { code: '68', name: { vi: 'Lâm Đồng', en: 'Lam Dong' }, region: 'south', isCentralCity: false },
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
 * Tên tỉnh cũ đã nhập vào tỉnh mới từ 01/07/2025 (Nghị quyết 202/2025/QH15). Bảng tra cứu hiện dòng "gồm … cũ" và ô
 * tìm kiếm nhận tên cũ (khách vẫn quen gọi "Bình Dương", "Quảng Nam"...). Chỉ ghi tỉnh có sáp nhập. Bản EN bỏ dấu.
 */
export const formerNames: Readonly<Record<string, readonly string[]>> = {
  '08': ['Hà Giang'],
  '15': ['Yên Bái'],
  '19': ['Bắc Kạn'],
  '24': ['Bắc Giang'],
  '25': ['Vĩnh Phúc', 'Hòa Bình'],
  '31': ['Hải Dương'],
  '33': ['Thái Bình'],
  '37': ['Hà Nam', 'Nam Định'],
  '44': ['Quảng Bình'],
  '48': ['Quảng Nam'],
  '51': ['Kon Tum'],
  '52': ['Bình Định'],
  '56': ['Ninh Thuận'],
  '66': ['Phú Yên'],
  '68': ['Đắk Nông', 'Bình Thuận'],
  '75': ['Bình Phước'],
  '79': ['Bình Dương', 'Bà Rịa – Vũng Tàu'],
  '80': ['Long An'],
  '82': ['Tiền Giang'],
  '86': ['Bến Tre', 'Trà Vinh'],
  '91': ['Kiên Giang'],
  '92': ['Sóc Trăng', 'Hậu Giang'],
  '96': ['Bạc Liêu'],
};

/** Tên gọi khác CHỈ dùng cho ô tìm kiếm (không hiển thị). */
export const searchAliases: Readonly<Record<string, readonly string[]>> = {
  '46': ['Thừa Thiên Huế'],
  '79': ['Sài Gòn', 'Saigon', 'HCM', 'TPHCM', 'HCMC'],
};

export type RegionId = Province['region'];

export type RegionInfo = {
  id: RegionId;
  name: LocalizedText;
  /** Phạm vi vùng theo cách Bluebolt tự mô tả (site cũ /worker-map, /en/worker-map), viết lại theo giọng văn 03 mục 11.5. */
  scope: LocalizedText;
};

/** Ba vùng điều phối, theo thứ tự Bắc → Nam. Giả định theo site cũ, chờ vận hành xác nhận cách chia vùng SLA. */
export const regions: readonly RegionInfo[] = [
  {
    id: 'north',
    name: { vi: 'Miền Bắc', en: 'Northern region' },
    scope: { vi: 'Từ Hà Tĩnh trở ra phía Bắc', en: 'Ha Tinh and every province to the north' },
  },
  {
    id: 'central',
    name: { vi: 'Miền Trung', en: 'Central region' },
    scope: { vi: 'Từ Quảng Trị đến Quảng Ngãi', en: 'From Quang Tri to Quang Ngai' },
  },
  {
    id: 'south',
    name: { vi: 'Miền Nam', en: 'Southern region' },
    scope: { vi: 'Từ Gia Lai trở vào phía Nam', en: 'Gia Lai and every province to the south' },
  },
];

export function getRegion(id: RegionId): RegionInfo {
  const found = regions.find((r) => r.id === id);
  if (!found) throw new Error(`content/provinces.ts: không có vùng ${id}`);
  return found;
}

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
