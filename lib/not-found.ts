/**
 * Đích nội bộ của trang 404 (D-30): proxy.ts rewrite mọi đường dẫn không khớp route nào về "/<locale>/__404" kèm mã 404;
 * app/[locale]/[...rest]/page.tsx render NotFoundView cho đúng đích này.
 */
export const NOT_FOUND_MARKER = '__404';
