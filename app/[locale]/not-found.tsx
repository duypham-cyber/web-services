import { NotFoundView } from '@/components/layout/NotFoundView';

/**
 * 404 trong layout [locale] khi một trang thật gọi notFound() (vd slug không tồn tại). Next tự thêm robots noindex.
 * Đường dẫn không khớp route nào đi đường khác: proxy.ts → app/[locale]/[...rest] đích "__404" (HTML đầy đủ, mã 404, D-30).
 */
export default function NotFound() {
  return <NotFoundView />;
}
