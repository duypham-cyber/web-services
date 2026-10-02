import { routing } from './routing';

/**
 * Sinh trang tĩnh cho CẢ HAI ngôn ngữ. Mọi page.tsx không có tham số động phải có:
 *   export const generateStaticParams = localeStaticParams;
 * (Root layout cũng khai báo; với dynamicParams = false, route nào không được sinh sẵn sẽ trả 404.)
 * Route động (/dich-vu/[slug], /kien-thuc/[slug]) tự sinh { locale, slug } cho từng ngôn ngữ (slug VI ≠ EN).
 */
export function localeStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
