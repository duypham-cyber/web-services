import { Building2, Headset, MapPin, Wrench } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DepartmentCard } from '@/components/contact/DepartmentCard';
import { HoursTable } from '@/components/contact/HoursTable';
import { OfficeMap } from '@/components/contact/OfficeMap';
import { ContactButtons } from '@/components/partners/ContactButtons';
import { DraftNote } from '@/components/partners/DraftNote';
import { PageHero } from '@/components/partners/PageHero';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { SectionHeader } from '@/components/partners/SectionHeader';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { site } from '@/content/site';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/lien-he'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'contact' });
  return buildMetadata({
    routeKey: 'contact',
    locale,
    title: t('meta.title'),
    description: t('meta.description', { phone: site.hotline.display[locale] }),
  });
}

const JUMPS = [
  { id: 'kinh-doanh', key: 'sales' },
  { id: 'tuyen-tho', key: 'recruitment' },
  { id: 'cskh', key: 'care' },
] as const;

/**
 * /lien-he — T-CONTACT (contracts/site-shell-p0.md mục 1.3; docs/03 mục 13.5): 3 kênh theo bộ phận
 * (#kinh-doanh = đích nút "Nhận báo giá" ở header, #tuyen-tho, #cskh) → địa chỉ chữ + bản đồ facade (không nhúng
 * Google Maps, AC-PERF-4) → bảng giờ hoạt động (đang mâu thuẫn → nháp). KHÔNG có form: form B2B chờ
 * contracts/lead-b2b.md APPROVED. Trang này là đích CTA nên không thêm khối CTA cuối.
 */
export default async function ContactPage({ params }: PageProps<'/[locale]/lien-he'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'contact' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const phone = site.hotline.display[locale];
  const callLabel = tc('cta.callNumber', { phone });
  const newTab = t('office.newTab');
  // Tìm theo địa chỉ tiếng Việt có dấu cho kết quả chính xác (URL công khai của Google Maps, không cần API key)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address.text.vi)}`;

  return (
    <>
      <PageHero
        breadcrumb={<Breadcrumbs routeKey="contact" locale={locale} />}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      >
        <nav aria-label={t('jumpLabel')} className="mt-8">
          <ul className="flex flex-wrap gap-3">
            {JUMPS.map((jump) => (
              <li key={jump.id}>
                <a
                  href={`#${jump.id}`}
                  className="inline-flex min-h-11 items-center rounded-pill border border-blue-600 bg-white px-5 text-small font-semibold text-blue-600 no-underline transition-colors duration-(--dur-base) ease-glide hover:bg-blue-100"
                >
                  {t(`departments.${jump.key}.title`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <Section as="div" spacing="compact" className="md:pt-20">
        <div className="grid gap-6 lg:grid-cols-3">
          <DepartmentCard
            id="kinh-doanh"
            featured
            icon={Building2}
            title={t('departments.sales.title')}
            audience={t('departments.sales.audience')}
            handlesLabel={t('departments.handles')}
            handles={[t('departments.sales.i1'), t('departments.sales.i2'), t('departments.sales.i3')]}
            actions={
              <>
                <p className="mb-4 text-small text-(--surface-muted)">{t('departments.sales.prepare')}</p>
                <ContactButtons
                  callVariant="primary"
                  callLabel={callLabel}
                  email={{ label: t('departments.email'), subject: t('departments.sales.emailSubject'), style: 'link' }}
                  newTabLabel={newTab}
                />
              </>
            }
            footer={
              <>
                <TextLink href="/giai-phap/hang-dien-may" variant="arrow" className="py-1">
                  {t('departments.sales.link')}
                </TextLink>
                <DraftNote>{t('departments.formPending')}</DraftNote>
              </>
            }
          />
          <DepartmentCard
            id="tuyen-tho"
            icon={Wrench}
            title={t('departments.recruitment.title')}
            audience={t('departments.recruitment.audience')}
            handlesLabel={t('departments.handles')}
            handles={[t('departments.recruitment.i1'), t('departments.recruitment.i2'), t('departments.recruitment.i3')]}
            actions={
              <ContactButtons
                callLabel={callLabel}
                zaloLabel={t('departments.zalo')}
                email={{ label: t('departments.email'), subject: t('departments.recruitment.emailSubject'), style: 'link' }}
                newTabLabel={newTab}
              />
            }
            footer={
              <TextLink href="/doi-tac-tho" variant="arrow" className="py-1">
                {t('departments.recruitment.link')}
              </TextLink>
            }
          />
          <DepartmentCard
            id="cskh"
            icon={Headset}
            title={t('departments.care.title')}
            audience={t('departments.care.audience')}
            handlesLabel={t('departments.handles')}
            handles={[t('departments.care.i1'), t('departments.care.i2'), t('departments.care.i3')]}
            actions={
              <ContactButtons
                callLabel={callLabel}
                zaloLabel={t('departments.zalo')}
                email={{ label: t('departments.email'), subject: t('departments.care.emailSubject'), style: 'link' }}
                newTabLabel={newTab}
              />
            }
            footer={
              <TextLink href="/ho-tro-khach-hang" variant="arrow" className="py-1">
                {t('departments.care.link')}
              </TextLink>
            }
          />
        </div>
        <DraftNote className="mt-8">{t('departments.sharedNote')}</DraftNote>
      </Section>

      <Section tone="blue-50" id="van-phong" aria-labelledby="van-phong-title">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
          <div className="min-w-0">
            <SectionHeader id="van-phong-title" eyebrow={t('office.eyebrow')} title={t('office.title')} />
            <address className="mt-8 flex flex-col gap-5 not-italic">
              <p className="flex gap-3 text-lead text-(--surface-fg)">
                <MapPin aria-hidden="true" size={24} strokeWidth={1.5} className="mt-1 shrink-0 text-blue-600" />
                <span>
                  <span className="sr-only">{t('office.addressLabel')}: </span>
                  {site.address.text[locale]}
                </span>
              </p>
              <p lang="vi" className="text-small font-semibold text-(--surface-fg)">
                {site.legalName.upper}
              </p>
            </address>
            <DraftNote className="mt-6">{t('office.addressNote')}</DraftNote>
          </div>
          <OfficeMap mapsUrl={mapsUrl} openLabel={t('office.openMaps')} newTabLabel={newTab} note={t('office.mapNote')} />
        </div>
      </Section>

      <HoursTable locale={locale} />
    </>
  );
}
