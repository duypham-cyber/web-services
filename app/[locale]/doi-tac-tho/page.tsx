import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AppMockup } from '@/components/partners/AppMockup';
import { ContactButtons } from '@/components/partners/ContactButtons';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { EarningsSection } from '@/components/partners/EarningsSection';
import { FaqList, type FaqItem } from '@/components/partners/FaqList';
import { JobsSection } from '@/components/partners/JobsSection';
import { PageHero } from '@/components/partners/PageHero';
import { RegisterSection } from '@/components/partners/RegisterSection';
import { SectionHeader } from '@/components/partners/SectionHeader';
import { StandardsSection } from '@/components/partners/StandardsSection';
import { StepList, type StepItem } from '@/components/partners/StepList';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { site } from '@/content/site';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { claim, type ClaimText } from '@/lib/claims';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/doi-tac-tho'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'partners' });
  return buildMetadata({
    routeKey: 'partners',
    locale,
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

/** Câu trả lời ghép từ một hoặc nhiều câu khẳng định. null khi không câu nào được hiển thị (production + nháp). */
function claimAnswer(parts: (ClaimText | null)[]): { answer: ReactNode; draft: boolean } | null {
  const shown = parts.filter((c): c is ClaimText => c !== null);
  if (shown.length === 0) return null;
  return { answer: <p>{shown.map((c) => c.text).join(' ')}</p>, draft: shown.some((c) => c.draft) };
}

/**
 * /doi-tac-tho — T-PARTNER (contracts/site-shell-p0.md mục 1.3; docs/03 mục 13.5). GỘP /requirement + /worker-map
 * + phần thợ của /system-map (301 ở content/redirects.ts). Thứ tự: hero thợ → thu nhập, cách nhận tiền → lộ trình
 * 4 bước → tiêu chuẩn → việc đang tuyển → hỏi đáp → #dang-ky (CTA cuối duy nhất; form chờ contract lead-technician).
 * Thanh dính đáy mobile tự đổi nút phải thành "Đăng ký thợ" trên trang này (components/layout/MobileActionBar).
 */
export default async function PartnersPage({ params }: PageProps<'/[locale]/doi-tac-tho'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'partners' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const tContact = await getTranslations({ locale, namespace: 'contact' });
  const phone = site.hotline.display[locale];
  const ekyc = claim('technician.ekyc', locale);
  const training = claim('partner.training-brand-standard', locale);

  const steps: StepItem[] = [
    { key: 'register', title: t('onboarding.steps.register.title'), body: t('onboarding.steps.register.body') },
    {
      key: 'verify',
      title: t('onboarding.steps.verify.title'),
      body: t('onboarding.steps.verify.body'),
      extra: ekyc ? (
        <p className="text-small text-(--surface-fg)">
          {ekyc.text}
          {ekyc.draft ? (
            <>
              {' '}
              <DraftBadge />
            </>
          ) : null}
        </p>
      ) : undefined,
    },
    {
      key: 'training',
      title: t('onboarding.steps.training.title'),
      body: t('onboarding.steps.training.body'),
      extra: training ? (
        <p className="text-small text-(--surface-fg)">
          {training.text}
          {training.draft ? (
            <>
              {' '}
              <DraftBadge />
            </>
          ) : null}
        </p>
      ) : undefined,
    },
    { key: 'jobs', title: t('onboarding.steps.jobs.title'), body: t('onboarding.steps.jobs.body') },
  ];

  // Hỏi đáp: câu trả lời nào là câu khẳng định chưa duyệt thì production bỏ hẳn câu hỏi đó.
  const plain = (answer: string) => ({ answer: <p>{answer}</p>, draft: false });
  const faqCandidates: { id: string; question: string; content: { answer: ReactNode; draft: boolean } | null }[] = [
    { id: 'dang-ky', question: t('faq.items.howToRegister.q'), content: plain(t('faq.items.howToRegister.a', { phone })) },
    { id: 'chung-chi', question: t('faq.items.noCertificate.q'), content: plain(t('faq.items.noCertificate.a')) },
    { id: 'khu-vuc', question: t('faq.items.chooseArea.q'), content: plain(t('faq.items.chooseArea.a')) },
    { id: 'tien-cong', question: t('faq.items.whenPaid.q'), content: claimAnswer([claim('partner.payout-per-job', locale)]) },
    {
      id: 'vat-tu',
      question: t('faq.items.materials.q'),
      content: claimAnswer([claim('partner.materials-paid-on-site', locale)]),
    },
    {
      id: 'gio-thi-cong',
      question: t('faq.items.hours.q'),
      content: claimAnswer([claim('partner.onsite-hours', locale), claim('partner.job-duration', locale)]),
    },
    {
      id: 'don-gap',
      question: t('faq.items.urgent.q'),
      content: claimAnswer([claim('partner.urgent-orders', locale), claim('partner.urgent-surcharge', locale)]),
    },
    { id: 'vi-pham', question: t('faq.items.violations.q'), content: claimAnswer([claim('partner.violations', locale)]) },
    { id: 'dang-lam', question: t('faq.items.existing.q'), content: plain(t('faq.items.existing.a', { phone })) },
  ];
  const faq: FaqItem[] = faqCandidates.flatMap(({ id, question, content }) =>
    content ? [{ id, question, answer: content.answer, badge: content.draft ? <DraftBadge /> : undefined }] : [],
  );

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
        actions={
          <>
            <Button externalHref="#dang-ky" variant="primary" size="lg">
              {tc('cta.registerTechnician')}
            </Button>
            <ContactButtons
              callVariant="ghost"
              callLabel={t('hero.callRecruitment')}
              newTabLabel={tContact('office.newTab')}
              size="lg"
            />
          </>
        }
        footnote={<p>{t('hero.existingPartner', { phone })}</p>}
        aside={
          <AppMockup
            labels={{
              caption: t('mockup.caption'),
              badge: t('media.illustration'),
              appName: t('mockup.appName'),
              status: t('mockup.status'),
              eyebrow: t('mockup.eyebrow'),
              jobTitle: t('mockup.jobTitle'),
              jobArea: t('mockup.jobArea'),
              jobTime: t('mockup.jobTime'),
              chips: [t('mockup.chipPipe'), t('mockup.chipBracket'), t('mockup.chipVacuum')],
              accept: t('mockup.accept'),
              next: [t('mockup.nextTv'), t('mockup.nextService')],
              tabs: [t('mockup.tabJobs'), t('mockup.tabSchedule'), t('mockup.tabEarnings'), t('mockup.tabMe')],
            }}
          />
        }
      />

      <EarningsSection locale={locale} />

      <Section tone="blue-50" id="lo-trinh" aria-labelledby="lo-trinh-title">
        <SectionHeader id="lo-trinh-title" eyebrow={t('onboarding.eyebrow')} title={t('onboarding.title')} />
        <StepList className="mt-12" steps={steps} stepLabel={(n) => t('onboarding.stepLabel', { n })} />
      </Section>

      <StandardsSection locale={locale} />

      <JobsSection locale={locale} />

      <Section id="cau-hoi" aria-labelledby="cau-hoi-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <SectionHeader id="cau-hoi-title" eyebrow={t('faq.eyebrow')} title={t('faq.title')} />
          <FaqList items={faq} />
        </div>
      </Section>

      <RegisterSection locale={locale} />
    </>
  );
}
