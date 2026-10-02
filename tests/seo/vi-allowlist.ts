import { site } from '../../content/site';

/**
 * Chuỗi tiếng Việt CÓ DẤU được phép xuất hiện trên trang /en (AC-I18N-1): tên pháp nhân (không dịch) và địa chỉ
 * đường phố. Phần tử nằm trong [lang="vi"] (vd nút đổi ngôn ngữ "Tiếng Việt") được bỏ qua ở bước quét.
 */
export const VI_ALLOWLIST: readonly string[] = [
  site.legalName.upper,
  site.legalName.titleCase,
  site.address.text.vi,
];

/** Ký tự tiếng Việt có dấu (chữ thường + hoa). */
export const VI_DIACRITICS =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

/** Bỏ các chuỗi được phép rồi trả về true nếu vẫn còn ký tự tiếng Việt có dấu. */
export function hasVietnamese(text: string): boolean {
  let rest = text;
  for (const allowed of VI_ALLOWLIST) rest = rest.split(allowed).join(' ');
  return VI_DIACRITICS.test(rest);
}
