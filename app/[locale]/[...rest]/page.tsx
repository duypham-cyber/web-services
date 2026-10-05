import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { NotFoundView } from '@/components/layout/NotFoundView';
import { NOT_FOUND_MARKER } from '@/lib/not-found';

/**
 * Đường dẫn không khớp route nào bên trong [locale]:
 *   - proxy.ts nhận ra và rewrite về "/<locale>/__404" kèm mã 404 → trang này render NotFoundView như một trang bình thường
 *     (HTML đầy đủ, router ở client có cây trang thật). Lý do: notFound() trả "vỏ lỗi" rồi mới vẽ ở client (D-10); trên vỏ
 *     lỗi đó router Next 16.3.8 prefetch lặp không dừng các link /en/* (khoảng 250 request/giây — D-30).
 *   - đường lọt qua proxy (không nên có) → notFound() như cũ.
 * dynamicParams = true: ghi đè `false` của root layout cho riêng route này.
 */
export const dynamicParams = true;

export function generateStaticParams() {
  return [{ rest: [NOT_FOUND_MARKER] }];
}

export async function generateMetadata({ params }: PageProps<'/[locale]/[...rest]'>): Promise<Metadata> {
  const { rest } = await params;
  if (rest.length !== 1 || rest[0] !== NOT_FOUND_MARKER) return {};
  const t = await getTranslations('errors.notFound');
  return { title: t('title'), robots: { index: false, follow: true } };
}

export default async function CatchAllPage({ params }: PageProps<'/[locale]/[...rest]'>) {
  const { rest } = await params;
  if (rest.length === 1 && rest[0] === NOT_FOUND_MARKER) return <NotFoundView />;
  notFound();
}
