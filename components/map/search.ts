/**
 * Chuẩn hóa chuỗi cho ô tìm tỉnh: bỏ dấu tiếng Việt (kể cả đ → d), chữ thường, bỏ dấu câu, gộp khoảng trắng.
 * Dùng chung server (dựng chuỗi tra cứu cho từng dòng) và client (chuẩn hóa từ khóa) để hai bên khớp nhau.
 *   foldVietnamese('TP. Hồ Chí Minh') === 'tp ho chi minh'
 */
export function foldVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Bỏ dấu nhưng giữ chữ hoa và dấu câu — tên tỉnh cũ trên bản EN ("Bà Rịa – Vũng Tàu" → "Ba Ria – Vung Tau"). */
export function stripVietnameseMarks(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFC');
}

/** Từ khóa (đã chuẩn hóa) có nằm trong chuỗi tra cứu (đã chuẩn hóa) không — so cả bản bỏ khoảng trắng ("danang"). */
export function matchesQuery(haystack: string, foldedQuery: string): boolean {
  if (!foldedQuery) return true;
  if (haystack.includes(foldedQuery)) return true;
  return haystack.replace(/ /g, '').includes(foldedQuery.replace(/ /g, ''));
}
