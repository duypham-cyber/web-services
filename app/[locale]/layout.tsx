import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Be_Vietnam_Pro } from 'next/font/google';
import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { Footer } from '@/components/layout/Footer';
import { Header, QUOTE_HREF, TECHNICIAN_SIGNUP_HREF } from '@/components/layout/Header';
import { HeaderObserver } from '@/components/layout/HeaderObserver';
import { LogoSymbol } from '@/components/layout/Logo';
import { MobileActionBar } from '@/components/layout/MobileActionBar';
import { SkipLink } from '@/components/layout/SkipLink';
import { MotionRuntime } from '@/components/motion/MotionRuntime';
import { MotionBootScript } from '@/components/motion/MotionBootScript';
import { site } from '@/content/site';
import { assertContentValid } from '@/content/validate';
import { pickClientMessages } from '@/i18n/messages';
import { routing, type Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import '../globals.css';

/**
 * Be Vietnam Pro tự host lúc build (next/font, docs/03 mục 11.2). Hai lần gọi để CHỈ preload 1 file:
 *  - fontSans: 400/500/600/700, mọi subset, KHÔNG preload.
 *  - fontDisplay: chỉ 700, preload subset vietnamese → dùng cho display/h1/kpi/strong (token --font-display).
 */
const fontSans = Be_Vietnam_Pro({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-bvp',
});

const fontDisplay = Be_Vietnam_Pro({
  subsets: ['vietnamese'],
  weight: '700',
  display: 'swap',
  preload: true,
  variable: '--font-bvp-display',
});

/** Chỉ 'vi' và 'en'; mọi giá trị khác của [locale] → 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await rootParams.locale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    metadataBase: new URL(site.url),
    title: { default: site.brandName, template: `%s | ${site.brandName}` },
    description: t('meta.description'),
    applicationName: site.brandName,
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Dữ liệu content/ sai → build FAIL tại đây (Zod)
  assertContentValid();

  const messages = await getMessages();
  // Client chỉ nhận common (trừ nhánh chỉ-server: status, dev, kpi) + errors — i18n/messages.ts
  const clientMessages = pickClientMessages(messages);
  const t = await getTranslations('common');
  const preview = isDraftPreview();
  const zaloApproved = (site.zalo.status as string) === 'approved';

  return (
    <html
      lang={locale}
      className={`${fontSans.variable} ${fontDisplay.variable}`}
      // Dấu hiệu bản xem trước (DRAFT_PREVIEW=1 lúc build) để test biết server đang kiểm là bản nào. Trải có điều kiện để
      // production không mang cả TÊN thuộc tính trong payload RSC (scripts/check-no-draft.mjs dò chuỗi này)
      {...(preview ? { 'data-draft-preview': '' } : {})}
      suppressHydrationWarning
    >
      <head>
        <MotionBootScript />
      </head>
      <body>
        <div data-scroll-sentinel="" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px" />
        <LogoSymbol />
        <NextIntlClientProvider messages={clientMessages}>
          <SkipLink />
          <Header />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <MobileActionBar
            label={t('a11y.quickActions')}
            call={{ label: t('cta.call'), tel: site.hotline.tel }}
            zalo={
              zaloApproved || preview
                ? { label: t('cta.zalo'), url: site.zalo.url, draftLabel: zaloApproved ? undefined : t('status.draft') }
                : null
            }
            quote={{ label: t('cta.quote'), href: QUOTE_HREF }}
            register={{ label: t('cta.registerTechnicianShort'), href: TECHNICIAN_SIGNUP_HREF }}
          />
          <HeaderObserver />
          <MotionRuntime />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
