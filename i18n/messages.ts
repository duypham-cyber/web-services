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
  'leads',
  'errors',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

/** Namespace được gửi xuống trình duyệt (client component). Các namespace khác chỉ dùng ở server. */
export const CLIENT_NAMESPACES = ['common', 'errors'] as const satisfies readonly Namespace[];

/**
 * Nhánh của `common` CHỈ dùng ở server — KHÔNG gửi xuống trình duyệt (pickClientMessages):
 *   status (nhãn "Nháp", "Minh họa"...), dev (ghi chú dựng trang), kpi (chữ của ô KPI), legacyBrowser (dòng nhắc trình duyệt
 *   quá cũ ở root layout).
 * Lý do: production không mang chữ "Nháp"/ghi chú dựng trang trong payload RSC của mọi trang (cổng kiểm
 * scripts/check-no-draft.mjs dò HTML bản build), và bớt byte. Client component cần các nhãn này thì nhận qua props
 * từ Server Component (vd MobileActionBar nhận draftLabel) — gọi useTranslations('common')('status.draft') ở client
 * sẽ lỗi thiếu message.
 */
export const SERVER_ONLY_COMMON_KEYS = ['status', 'dev', 'kpi', 'legacyBrowser'] as const satisfies readonly (keyof AppMessages['common'])[];

type ServerOnlyCommonKey = (typeof SERVER_ONLY_COMMON_KEYS)[number];

export type ClientMessages = {
  common: Omit<AppMessages['common'], ServerOnlyCommonKey>;
  errors: AppMessages['errors'];
};

/** Phần messages gửi cho NextIntlClientProvider (root layout). */
export function pickClientMessages(messages: AppMessages): ClientMessages {
  const common: Partial<AppMessages['common']> = { ...messages.common };
  for (const key of SERVER_ONLY_COMMON_KEYS) delete common[key];
  return { common: common as ClientMessages['common'], errors: messages.errors };
}

export async function loadMessages(locale: Locale) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = (await import(`../messages/${locale}/${ns}.json`)) as { default: unknown };
      return [ns, mod.default] as const;
    }),
  );
  return Object.fromEntries(entries) as AppMessages;
}
