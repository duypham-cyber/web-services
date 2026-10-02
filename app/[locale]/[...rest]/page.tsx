import { notFound } from 'next/navigation';

/**
 * Mọi đường dẫn không khớp route nào bên trong [locale] → not-found.tsx của [locale] (có header/footer, đúng ngôn ngữ).
 * Docs next-intl: environments/error-files.
 * dynamicParams = true: ghi đè `false` của root layout cho riêng route này, để Next render trang (và not-found
 * trong layout) thay vì trả trang lỗi trống không có H1.
 */
export const dynamicParams = true;

export default function CatchAllPage() {
  notFound();
}
