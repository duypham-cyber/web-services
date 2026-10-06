import { Mail, MessageCircle, Phone } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Fragment } from 'react';
import type { AppHref } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { services } from '@/content/services';
import { copyrightYear, site } from '@/content/site';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { keepCompounds } from '@/lib/vn-wrap';
import { Logo } from './Logo';

type Column = { title: string; links: { label: string; href: AppHref }[] };

/** Link cột: 16 px blue-100 (link trên dải tối, D-32); inline-block → vùng bấm cao đúng 24 px, cách nhau 12 px. */
const LINK = 'inline-block text-blue-100 no-underline underline-offset-4 hover:text-white hover:underline';
const CONTACT = 'inline-flex items-center gap-3 text-body text-blue-100 no-underline hover:text-white hover:underline';
const ICON = 'shrink-0 text-orange-200';

/**
 * Footer nền blue-600 (docs/03 mục 13.4 P9, D-32, bố cục D-33): 4 cột Giải pháp · Dịch vụ · Công ty · Pháp lý, pháp nhân +
 * MST + địa chỉ, hotline, email, dòng © theo mục 1.4. KHÔNG STK ngân hàng, KHÔNG "Sẽ cập nhật sau", KHÔNG icon MXH chưa có
 * link thật. Zalo chỉ hiện khi site.zalo.status = "approved" (bản xem trước: hiện kèm nhãn Nháp).
 * - Chữ một bậc lớn hơn phần thân trang (link, MST, địa chỉ 16 px; tiêu đề cột 14 px; hotline text-h3) và khoảng đệm gọn
 *   (48/48, từ md 64/56) để nền không lấn chữ trên màn rộng; dòng © nằm trong dải blue-700 làm chân.
 * - Thương hiệu và cột link đứng cạnh nhau từ xl (cùng mốc với menu desktop của header); nhỏ hơn: xếp chồng, 4 cột link từ md,
 *   2 × 2 trên điện thoại (thay accordion, xem docs/DECISIONS.md).
 * - Căn cột: gap-6 của khối địa chỉ = gap-x-6 của danh sách liên hệ = gap-x-6 của cột link, nên ở md/lg cột liên hệ bắt đầu
 *   đúng cột link thứ 3. Đổi một khoảng phải đổi cả ba.
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

  const addressParts = site.address.text[locale].split(', ');

  return (
    <footer data-tone="navy" className="bg-blue-600">
      <Container className="py-12 md:pt-16 md:pb-14">
        <div className="grid gap-10 md:gap-12 xl:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
          <div className="flex flex-col gap-6">
            <Link href="/" aria-label={t('brand.homeLink')} className="inline-flex w-fit rounded-sm">
              <Logo height={44} className="h-10 w-auto md:h-11" />
            </Link>
            <address className="grid gap-6 not-italic lg:grid-cols-2 xl:grid-cols-1">
              <div className="flex flex-col gap-1">
                <p className="text-small font-semibold text-balance text-white" lang="vi">
                  {keepCompounds(site.legalName.upper)}
                </p>
                <p className="mt-1 text-body text-slate-300">
                  {t('footer.taxCode')}: <span className="tabular">{site.taxCode}</span>
                </p>
                <p className="text-body text-slate-300">
                  <span className="sr-only">{t('footer.address')}: </span>
                  {/* Chỉ xuống dòng ở dấu phẩy: không tách "Phường Gò Vấp" hay "TP. Hồ Chí Minh" */}
                  {addressParts.map((part, i) => (
                    <Fragment key={part}>
                      {i > 0 ? ' ' : null}
                      <span className="inline-block">
                        {part}
                        {i < addressParts.length - 1 ? ',' : ''}
                      </span>
                    </Fragment>
                  ))}
                </p>
              </div>
              <ul className="grid content-start gap-2 md:grid-cols-2 md:items-baseline md:gap-x-6 lg:grid-cols-1">
                <li className="flex">
                  <a
                    href={`tel:${site.hotline.tel}`}
                    className="inline-flex items-center gap-3 text-h3 text-white no-underline tabular hover:underline"
                  >
                    <Phone aria-hidden="true" size={20} strokeWidth={1.75} className={ICON} />
                    <span className="sr-only">{t('footer.hotline')}: </span>
                    {site.hotline.display[locale]}
                  </a>
                </li>
                <li className="flex">
                  <a href={`mailto:${site.email}`} className={CONTACT}>
                    <Mail aria-hidden="true" size={20} strokeWidth={1.75} className={ICON} />
                    <span className="sr-only">{t('footer.email')}: </span>
                    {site.email}
                  </a>
                </li>
                {showZalo ? (
                  <li className="flex items-center gap-2">
                    <a href={site.zalo.url} target="_blank" rel="noopener noreferrer" className={CONTACT}>
                      <MessageCircle aria-hidden="true" size={20} strokeWidth={1.75} className={ICON} />
                      {t('footer.zalo')}
                    </a>
                    {zaloIsDraft ? <DraftBadge /> : null}
                  </li>
                ) : null}
              </ul>
            </address>
          </div>

          <nav aria-label={t('a11y.footerNav')} className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                {/* eyebrow (viết hoa, tracking) ở cỡ 14 px: ghi đè biến cỡ chữ của chính eyebrow, không phụ thuộc thứ tự CSS */}
                <h2 className="eyebrow text-orange-200 [--text-eyebrow--line-height:var(--text-small--line-height)] [--text-eyebrow:var(--text-small)]">
                  {col.title}
                </h2>
                <ul className="mt-4 flex flex-col gap-3 text-body leading-normal">
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
      </Container>

      {/* Dải chân blue-700. Trên điện thoại dải này chừa chỗ cho thanh Gọi/Báo giá cố định (6rem + safe-area). */}
      <div className="bg-blue-700 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-5">
        <Container>
          <p className="text-small text-slate-300">{t('footer.copyright', { year: copyrightYear, legalName })}</p>
        </Container>
      </div>
    </footer>
  );
}
