import { getTranslations } from 'next-intl/server';

/** Phần tử focus ĐẦU TIÊN của mọi trang: nhảy tới <main id="main">. Ẩn cho tới khi được focus. */
export async function SkipLink() {
  const t = await getTranslations('common');
  return (
    <a
      href="#main"
      className="sr-only rounded-md bg-white px-4 py-3 text-body font-semibold text-blue-600 shadow-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]"
    >
      {t('a11y.skipToContent')}
    </a>
  );
}
