import { Mail, MessageCircle, Phone } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import type { AppHref } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { services } from '@/content/services';
import { copyrightYear, site } from '@/content/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { Logo } from './Logo';

type Column = { title: string; links: { label: string; href: AppHref }[] };

const LINK = 'text-small text-slate-300 no-underline underline-offset-4 hover:text-white hover:underline';

/**
 * Footer navy-900 (docs/03 mục 13.4 P9): 4 cột Giải pháp · Dịch vụ · Công ty · Pháp lý, pháp nhân + MST + địa chỉ,
 * hotline, email, dòng © theo mục 1.4. KHÔNG STK ngân hàng, KHÔNG "Sẽ cập nhật sau", KHÔNG icon MXH chưa có link thật.
 * Zalo chỉ hiện khi site.zalo.status = "approved" (bản xem trước: hiện kèm nhãn Nháp).
 * Mobile: 2 cột × 2 hàng thay cho accordion (xem docs/DECISIONS.md).
 */
export async function Footer() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('common');
  const tLegal = await getTranslations('legal');
  const preview = isDraftPreview();
  const showZalo = (site.zalo.status as string) === 'approved' || preview;
  const zaloIsDraft = (site.zalo.status as string) !== 'approved';

  const columns: Column[] = [
    {
      title: t('footer.solutions'),
      links: [
        { label: t('nav.brands'), href: '/giai-phap/hang-dien-may' },
        { label: t('nav.retail'), href: '/giai-phap/san-tmdt-ban-le' },
        { label: t('nav.support'), href: '/ho-tro-khach-hang' },
        { label: t('nav.network'), href: '/mang-luoi' },
      ],
    },
    {
      title: t('footer.services'),
      links: [
        ...services.map((s) => ({
          label: s.title[locale],
          href: { pathname: '/dich-vu/[slug]' as const, params: { slug: s.slug[locale] } },
        })),
        { label: t('nav.pricing'), href: '/bang-gia' },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { label: t('nav.about'), href: '/ve-chung-toi' },
        { label: t('nav.partners'), href: '/doi-tac-tho' },
        { label: t('nav.knowledge'), href: '/kien-thuc' },
        { label: t('nav.contact'), href: '/lien-he' },
      ],
    },
    {
      title: t('footer.legal'),
      links: [
        { label: tLegal('privacy.title'), href: '/chinh-sach-bao-mat' },
        { label: tLegal('terms.title'), href: '/dieu-khoan-su-dung' },
        { label: tLegal('warranty.title'), href: '/chinh-sach-bao-hanh' },
      ],
    },
  ];

  const legalName = locale === 'vi' ? site.legalName.titleCase : site.legalName.upper;

  return (
    <footer data-tone="navy" className="bg-navy-900 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-16 md:pb-12 md:pt-20">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="flex flex-col gap-6">
            <Link href="/" aria-label={t('brand.homeLink')} className="inline-flex w-fit rounded-sm">
              <Logo height={40} />
            </Link>
            <address className="flex flex-col gap-3 not-italic">
              <p className="text-small font-semibold text-white" lang="vi">
                {site.legalName.upper}
              </p>
              <p className="text-small text-slate-300">
                {t('footer.taxCode')}: <span className="tabular">{site.taxCode}</span>
              </p>
              <p className="text-small text-slate-300">
                <span className="sr-only">{t('footer.address')}: </span>
                {site.address.text[locale]}
              </p>
              <ul className="mt-1 flex flex-col gap-2">
                <li>
                  <a href={`tel:${site.hotline.tel}`} className="inline-flex items-center gap-2 text-body font-semibold text-white no-underline tabular hover:underline">
                    <Phone aria-hidden="true" size={18} strokeWidth={1.75} className="text-orange-200" />
                    <span className="sr-only">{t('footer.hotline')}: </span>
                    {site.hotline.display[locale]}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 text-small text-slate-300 no-underline hover:text-white hover:underline">
                    <Mail aria-hidden="true" size={18} strokeWidth={1.75} className="text-orange-200" />
                    <span className="sr-only">{t('footer.email')}: </span>
                    {site.email}
                  </a>
                </li>
                {showZalo ? (
                  <li className="flex items-center gap-2">
                    <a
                      href={site.zalo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-small text-slate-300 no-underline hover:text-white hover:underline"
                    >
                      <MessageCircle aria-hidden="true" size={18} strokeWidth={1.75} className="text-orange-200" />
                      {t('footer.zalo')}
                    </a>
                    {zaloIsDraft ? <DraftBadge /> : null}
                  </li>
                ) : null}
              </ul>
            </address>
          </div>

          <nav aria-label={t('a11y.footerNav')} className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="eyebrow text-orange-200">{col.title}</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className={LINK}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 border-t border-(--surface-border) pt-6">
          <p className="text-small text-slate-300">{t('footer.copyright', { year: copyrightYear, legalName })}</p>
        </div>
      </Container>
    </footer>
  );
}
