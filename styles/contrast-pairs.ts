/**
 * Bảng "Cặp kiểm" tương phản WCAG 2.x của docs/03 mục 11.1 — nguồn cho tests/unit/contrast.test.ts và trang /dev/ui.
 * expected = tỉ lệ ghi trong tài liệu (2 chữ số thập phân); test cho phép sai số ±0,02.
 * min = ngưỡng phải đạt: 4.5 chữ thường · 3 chữ lớn/UI · 0 = chỉ trang trí (slate-300).
 */
export type ContrastPair = {
  fg: string;
  bg: string;
  expected: number;
  min: 0 | 3 | 4.5;
  usage: string;
};

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { fg: 'blue-600', bg: 'white', expected: 8.13, min: 4.5, usage: 'link, heading nhấn trên trắng' },
  { fg: 'blue-600', bg: 'blue-50', expected: 7.59, min: 4.5, usage: 'link trên nền xanh nhạt' },
  { fg: 'white', bg: 'blue-600', expected: 8.13, min: 4.5, usage: 'chữ trắng trên nút xanh' },
  { fg: 'white', bg: 'blue-700', expected: 10.59, min: 4.5, usage: 'nút xanh khi hover' },
  { fg: 'white', bg: 'navy-900', expected: 16.25, min: 4.5, usage: 'chữ trên dải tối, footer' },
  { fg: 'blue-300', bg: 'navy-900', expected: 6.89, min: 4.5, usage: 'link, icon trên navy' },
  { fg: 'blue-600', bg: 'blue-100', expected: 7.13, min: 4.5, usage: 'chip, nền thẻ' },
  { fg: 'navy-900', bg: 'blue-50', expected: 15.17, min: 4.5, usage: 'chữ navy trên nền sáng' },
  { fg: 'navy-900', bg: 'orange-500', expected: 6.19, min: 4.5, usage: 'chữ trên nút cam (CTA)' },
  { fg: 'navy-900', bg: 'orange-400', expected: 7.43, min: 4.5, usage: 'nút cam khi hover' },
  { fg: 'orange-700', bg: 'white', expected: 5.52, min: 4.5, usage: 'chữ cam (eyebrow) trên trắng' },
  { fg: 'orange-700', bg: 'blue-50', expected: 5.15, min: 4.5, usage: 'chữ cam trên nền xanh nhạt' },
  { fg: 'orange-200', bg: 'navy-900', expected: 9.51, min: 4.5, usage: 'chữ cam trên navy' },
  { fg: 'orange-700', bg: 'orange-50', expected: 5.09, min: 4.5, usage: 'badge "Bảo hành"' },
  { fg: 'ink-900', bg: 'white', expected: 17.85, min: 4.5, usage: 'chữ chính' },
  { fg: 'slate-600', bg: 'white', expected: 7.58, min: 4.5, usage: 'chữ phụ' },
  { fg: 'slate-600', bg: 'blue-50', expected: 7.08, min: 4.5, usage: 'chữ phụ trên nền xanh nhạt' },
  { fg: 'slate-500', bg: 'white', expected: 4.76, min: 4.5, usage: 'viền input, caption (CHỈ trên trắng)' },
  { fg: 'slate-300', bg: 'white', expected: 1.48, min: 0, usage: 'đường kẻ trang trí' },
  { fg: 'danger-700', bg: 'white', expected: 6.54, min: 4.5, usage: 'lỗi form' },
  { fg: 'success-700', bg: 'white', expected: 5.38, min: 4.5, usage: 'thành công' },
  { fg: 'warning-text', bg: 'white', expected: 5.93, min: 4.5, usage: 'chữ cảnh báo' },
];

/** Các cặp BỊ CẤM (docs/03 mục 11.1): kiểm để không ai "sửa" token thành dùng được. */
export const FORBIDDEN_PAIRS = [
  { fg: 'white', bg: 'orange-500', expected: 2.63, reason: 'chữ trắng trên cam: trượt cả ngưỡng 3:1' },
  { fg: 'orange-500', bg: 'blue-600', expected: 3.1, reason: 'chữ cam trên xanh brand: chỉ ≥ 24px, nên tránh hẳn' },
] as const;
