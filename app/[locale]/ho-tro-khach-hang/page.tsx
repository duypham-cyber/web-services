import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClaimLine, DraftNote } from '@/components/partners/DraftNote';
import { FinalCta } from '@/components/partners/FinalCta';
import { PageHero } from '@/components/partners/PageHero';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { SectionHeader } from '@/components/partners/SectionHeader';
import { StepList } from '@/components/partners/StepList';
import { HotlineCard } from '@/components/support/HotlineCard';
import { PaymentNotice } from '@/components/support/PaymentNotice';
import { WarrantyTerms } from '@/components/support/WarrantyTerms';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { site } from '@/content/site';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { claim } from '@/lib/claims';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/ho-tro-khach-hang'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'support' });
  return buildMetadata({
    routeKey: 'support',
    locale,
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

/**
 * /ho-tro-khach-hang — T-SUPPORT, khách lẻ nhánh A (docs/DECISIONS.md D-02; docs/03 mục 13.5): Gọi/Zalo → đăng ký
 * bảo hành (hướng dẫn; form P1 chờ contract riêng) → thời hạn bảo hành (content/sla.ts, đang mâu thuẫn → nháp)
 * → lưu ý thanh toán ("không yêu cầu chuyển khoản cá nhân cho thợ" là claim nháp) → CTA cuối.
 */
export default async function SupportPage({ params }: PageProps<'/[locale]/ho-tro-khach-hang'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'support' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const phone = site.hotline.display[locale];
  const registerWindow = claim('warranty.register-within-7-days', locale);
  const responseTime = claim('support.warranty-response-time', locale);

  return (
    <>
      <PageHero
        breadcrumb={<Breadcrumbs routeKey="support" locale={locale} />}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        aside={<HotlineCard locale={locale} />}
      />

      <Section id="dang-ky-bao-hanh" aria-labelledby="dang-ky-bao-hanh-title">
        <SectionHeader
          id="dang-ky-bao-hanh-title"
          eyebrow={t('register.eyebrow')}
          title={t('register.title')}
          lead={
            <>
              <p>{t('register.lead')}</p>
              <ClaimLine c={registerWindow} className="mt-2 text-body font-semibold text-(--surface-fg)" />
            </>
          }
        />
        <StepList
          className="mt-12"
          columnsClassName="md:grid-cols-3"
          stepLabel={(n) => t('register.stepLabel', { n })}
          steps={[
            { key: 'prepare', title: t('register.steps.prepare.title'), body: t('register.steps.prepare.body') },
            { key: 'contact', title: t('register.steps.contact.title'), body: t('register.steps.contact.body', { phone }) },
            {
              key: 'confirm',
              title: t('register.steps.confirm.title'),
              body: t('register.steps.confirm.body'),
              extra: <ClaimLine c={responseTime} className="text-small text-(--surface-fg)" />,
            },
          ]}
        />
        <DraftNote className="mt-10">{t('register.formPending')}</DraftNote>
      </Section>

      <WarrantyTerms locale={locale} />

      <PaymentNotice locale={locale} />

      <FinalCta
        id="ho-tro-them"
        eyebrow={t('final.eyebrow')}
        title={t('final.title')}
        body={t('final.body')}
        actions={
          <>
            <Button externalHref={`tel:${site.hotline.tel}`} variant="primary" size="lg">
              <span className="tabular">{tc('cta.callNumber', { phone })}</span>
            </Button>
            <Button href={{ pathname: '/lien-he', hash: 'cskh' }} variant="on-dark" size="lg">
              {t('final.contactLink')}
            </Button>
          </>
        }
      />
    </>
  );
}
