import type { Locale } from './routing';
import type { AppMessages } from './types';

/**
 * Messages tách theo namespace = tên file, để nhiều agent sửa song song không đè nhau.
 *   messages/<locale>/<namespace>.json  →  t = useTranslations('<namespace>')
 *
 * Chủ sở hữu từng namespace: xem CLAUDE.md mục "i18n và nội dung".
 * Thêm namespace mới: thêm tên vào NAMESPACES + tạo file cho CẢ vi và en + thêm kiểu ở i18n/types.ts.
 */
export const NAMESPACES = [
  'common',
  'home',
  'film',
  'solutions',
  'services',
  'pricing',
  'network',
  'partners',
  'about',
  'knowledge',
  'contact',
  'support',
  'legal',
  'errors',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

/** Namespace được gửi xuống trình duyệt (client component). Các namespace khác chỉ dùng ở server. */
export const CLIENT_NAMESPACES = ['common', 'errors'] as const satisfies readonly Namespace[];

export async function loadMessages(locale: Locale) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = (await import(`../messages/${locale}/${ns}.json`)) as { default: unknown };
      return [ns, mod.default] as const;
    }),
  );
  return Object.fromEntries(entries) as AppMessages;
}
