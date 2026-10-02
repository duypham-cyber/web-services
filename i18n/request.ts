import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { loadMessages } from './messages';
import { routing } from './routing';

/**
 * Cấu hình next-intl cho mỗi request (Server Components).
 * Next 16.3+: locale đọc từ root param `[locale]` qua `next/root-params`, nên trang vẫn render tĩnh
 * mà không cần gọi setRequestLocale() ở từng page (docs next-intl: with-i18n-routing).
 */
export default getRequestConfig(async ({ locale }) => {
  let resolved = locale;
  if (!resolved) {
    const paramValue = await rootParams.locale();
    if (!hasLocale(routing.locales, paramValue)) notFound();
    resolved = paramValue;
  }
  if (!hasLocale(routing.locales, resolved)) notFound();

  return {
    locale: resolved,
    messages: await loadMessages(resolved),
    timeZone: 'Asia/Ho_Chi_Minh',
  };
});
