import { Phone } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Button, type AppHref } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { site } from '@/content/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { LocaleSwitch } from './LocaleSwitch';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { NavLink } from './NavLink';
import { SolutionsMenu } from './SolutionsMenu';

/** Đích của CTA "Nhận báo giá" cho tới khi form B2B có contract APPROVED (docs/DECISIONS.md). */
export const QUOTE_HREF: AppHref = { pathname: '/lien-he', hash: 'kinh-doanh' };
export const TECHNICIAN_SIGNUP_HREF: AppHref = { pathname: '/doi-tac-tho', hash: 'dang-ky' };

const NAV_LINK =
  'inline-flex min-h-11 items-center rounded-sm px-3 text-small font-medium no-underline decoration-2 underline-offset-8 ' +
  'hover:underline aria-[current=page]:underline';

/**
 * Header dùng chung (docs/03 mục 13.1). Server Component; chỉ các phần tương tác là client:
 * SolutionsMenu (mega menu), NavLink (aria-current), LocaleSwitch, MobileMenu. Tông màu theo vùng phim do
 * HeaderObserver + CSS lo (app/globals.css, .site-header) — trang có [data-film-zone] thì header trong suốt chữ trắng.
 *
 * ≥ 1280px: logo · Giải pháp ▾ · Dịch vụ · Bảng giá · Mạng lưới · Đối tác thợ · Kiến thức · VI|EN · ☎ · [Nhận báo giá]
 * < 1280px: logo · [Nhận báo giá] (≥ 768px) · ☎ · ☰ (sheet menu)
 */
export async function Header() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('common');
  const phone = site.hotline.display[locale];

  const localeLabels = {
    group: t('a11y.languageSwitch'),
    vi: { short: t('language.vi'), name: t('language.viName') },
    en: { short: t('language.en'), name: t('language.enName') },
  };

  const solutions = [
    { title: t('nav.brands'), description: t('nav.brandsDesc'), href: '/giai-phap/hang-dien-may' as const },
    { title: t('nav.retail'), description: t('nav.retailDesc'), href: '/giai-phap/san-tmdt-ban-le' as const },
    { title: t('nav.support'), description: t('nav.supportDesc'), href: '/ho-tro-khach-hang' as const },
  ];

  const links = [
    { label: t('nav.services'), href: '/dich-vu' as const },
    { label: t('nav.pricing'), href: '/bang-gia' as const },
    { label: t('nav.network'), href: '/mang-luoi' as const },
    { label: t('nav.partners'), href: '/doi-tac-tho' as const },
    { label: t('nav.knowledge'), href: '/kien-thuc' as const },
  ];

  return (
    <header data-site-header="" className="site-header sticky top-0 z-50">
      <Container className="flex h-(--header-h) items-center gap-2 xl:gap-4">
        <Link href="/" aria-label={t('brand.homeLink')} className="mr-2 inline-flex shrink-0 items-center rounded-sm py-1">
          <Logo height={34} className="h-8 w-auto xl:h-[34px]" />
        </Link>

        <nav aria-label={t('a11y.mainNav')} className="hidden xl:block">
          <ul className="flex items-center">
            <li>
              <SolutionsMenu
                label={t('nav.solutions')}
                menuLabel={t('a11y.solutionsMenu')}
                items={solutions}
                overview={{ label: t('nav.solutionsOverview'), href: '/giai-phap' }}
              />
            </li>
            {links.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} className={NAV_LINK}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 xl:gap-3">
          <LocaleSwitch labels={localeLabels} className="max-xl:hidden" />
          <a
            href={`tel:${site.hotline.tel}`}
            className="hidden min-h-11 items-center gap-2 rounded-sm px-2 text-small font-semibold no-underline tabular hover:underline xl:inline-flex"
          >
            <Phone aria-hidden="true" size={18} strokeWidth={1.75} />
            <span className="sr-only">{t('cta.call')}: </span>
            {phone}
          </a>
          <Button href={QUOTE_HREF} variant="primary" size="sm" className="max-md:hidden xl:min-h-11 xl:px-5">
            {t('cta.quote')}
          </Button>
          <a
            href={`tel:${site.hotline.tel}`}
            aria-label={t('cta.callNumber', { phone })}
            className="inline-flex size-11 items-center justify-center rounded-pill transition-colors duration-(--dur-base) hover:bg-blue-50 hover:text-navy-900 xl:hidden"
          >
            <Phone aria-hidden="true" size={22} strokeWidth={1.75} />
          </a>
          <div className="xl:hidden">
            <MobileMenu
              labels={{ open: t('a11y.openMenu'), close: t('a11y.closeMenu'), nav: t('a11y.mobileNav') }}
              logo={<Logo height={32} title={site.brandName} />}
              groups={[
                {
                  title: t('nav.solutions'),
                  items: [
                    ...solutions.map((s) => ({ label: s.title, href: s.href })),
                    { label: t('nav.solutionsOverview'), href: '/giai-phap' as const },
                  ],
                },
                {
                  items: [
                    ...links,
                    { label: t('nav.about'), href: '/ve-chung-toi' as const },
                    { label: t('nav.contact'), href: '/lien-he' as const },
                  ],
                },
              ]}
              localeSwitch={<LocaleSwitch labels={localeLabels} />}
              phone={{ label: t('cta.call'), display: phone, tel: site.hotline.tel }}
              cta={{ label: t('cta.quote'), href: QUOTE_HREF }}
            />
          </div>
        </div>
      </Container>
    </header>
  );
}
