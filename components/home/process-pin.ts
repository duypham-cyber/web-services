/**
 * Điều kiện bật chế độ "dừng và đi từng bước" của section quy trình (D-34): màn hình, có chuột (docs/03 mục 12.3: cảm ứng
 * không pin), tuyến ngang ≥ 1280 px, khung nhìn ≥ 40rem, cho phép chuyển động. Dùng chung cho ProcessStepper (matchMedia)
 * và phải trùng NGUYÊN VĂN media query của chế độ ghim trong process-route.module.css (tests/unit/process-pin.test.ts kiểm).
 */
export const PIN_QUERY =
  'screen and (prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine) and (min-width: 80rem) and (min-height: 40rem)';
