/**
 * Phép chiếu của hero bản đồ (Mẫu 02 "Bản đồ sống", D-26). DÙNG CHUNG cho scripts/make-hero-map.mjs (Node nạp thẳng
 * file .ts) và cảnh three.js — vì vậy file này chỉ có hằng số + hàm thuần, không import gì.
 *
 * Chiếu trụ đều góc với vĩ tuyến chuẩn 16°B (giữ nguyên cách chiếu của bản mẫu để dùng lại khung máy):
 *   x = (lon − 108,4) · cos 16°      (đông → x dương)
 *   z = −(lat − 15,6)                (bắc → z âm; máy nhìn từ phía nam nên bắc nằm "trên" màn hình)
 * 1 đơn vị cảnh ≈ 1° vĩ độ ≈ 111 km. Mặt biển ở y = 0, mặt đất ở y = LAND_TOP.
 */
export const LON0 = 108.4;
export const LAT0 = 15.6;
export const KX = Math.cos((16 * Math.PI) / 180);

/** Dữ liệu hero-map.json lưu toạ độ nguyên theo 1/QUANT đơn vị cảnh (≈ 111 m). */
export const QUANT = 1000;

/** Mặt đất nổi cao LAND_TOP trên mặt biển, đáy khối ở LAND_BASE (chìm dưới nước cho vách không hở). */
export const LAND_TOP = 0.34;
export const LAND_BASE = -0.16;
/** Đảo nhỏ ven bờ (diện tích < ISLET_AREA đơn vị²) nổi thấp hơn để không thành "cột". */
export const ISLET_TOP = 0.12;
export const ISLET_AREA = 0.012;

export function toXZ(lon: number, lat: number): [number, number] {
  return [(lon - LON0) * KX, -(lat - LAT0)];
}

export function toLonLat(x: number, z: number): [number, number] {
  return [x / KX + LON0, LAT0 - z];
}
