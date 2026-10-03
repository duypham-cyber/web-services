/**
 * Đọc neo URL của form lead mà KHÔNG BAO GIỜ ném lỗi.
 *
 * Neo do người dùng gõ/dán có thể là percent-encoding hỏng (`/bang-gia#%E0%A4%A`, `/#%`, `/doi-tac-tho#%zz`):
 * `decodeURIComponent` ném URIError → lỗi trong effect/handler làm sập cả trang (error boundary). Lỗi → trả nguyên chuỗi
 * gốc: chuỗi đó không khớp neo nào nên form chỉ bỏ qua.
 *
 * File không import gì: LazyLeadForm nằm trong JS tải đầu của trang, không được kéo thêm module.
 */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Neo (bỏ dấu #) đã giải mã của `window.location` hoặc một `URL`. */
export function hashOf(target: { readonly hash: string }): string {
  return safeDecode(target.hash.slice(1));
}
