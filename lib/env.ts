/**
 * Cờ môi trường dùng chung. Đọc ở SERVER (Server Component, generateMetadata, next.config).
 * Trang tĩnh được prerender lúc build → cờ phải có mặt LÚC BUILD (vd `DRAFT_PREVIEW=1 scripts/safe-build.sh`).
 * Client component không đọc process.env trực tiếp: nhận giá trị qua props từ server.
 */

/** Bản xem trước: hiện nội dung "draft" (claim, Zalo, KPI ghi chú...) kèm nhãn "Nháp". */
export function isDraftPreview(): boolean {
  return process.env.DRAFT_PREVIEW === '1';
}

/** Trang nội bộ /dev/*: luôn bật khi dev; ở production chỉ bật khi DEV_PAGES=1. */
export function devPagesEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.DEV_PAGES === '1';
}

/** Staging: thêm X-Robots-Tag noindex (next.config.ts). */
export function isStaging(): boolean {
  return process.env.STAGING === '1';
}
