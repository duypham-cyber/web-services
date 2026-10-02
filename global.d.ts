import type { Locale } from './i18n/routing';
import type { AppMessages } from './i18n/types';

// next-intl: khóa messages và locale có kiểu chặt → gõ sai khóa là typecheck báo lỗi.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: AppMessages;
  }
}
