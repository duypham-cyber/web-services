import { Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LeadB2BBlock } from '@/components/leads/LeadBlocks';
import { Rise } from '@/components/motion/Rise';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section, type SectionTone } from '@/components/ui/Section';
import { site } from '@/content/site';
import type { Locale } from '@/i18n/routing';

/** Tia chớp + vòng tròn trang trí (thương hiệu Bluebolt), chỉ token màu, aria-hidden, nằm trong khung overflow-clip. */
function BoltArt() {
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute -bottom-32 -left-28 size-[26rem] max-lg:hidden xl:size-[28rem]"
    >
      <circle cx="200" cy="200" r="194" fill="none" stroke="var(--color-blue-300)" strokeOpacity="0.12" strokeWidth="2" />
      <circle cx="200" cy="200" r="142" fill="none" stroke="var(--color-blue-300)" strokeOpacity="0.12" strokeWidth="2" />
      <circle cx="200" cy="200" r="92" fill="var(--color-blue-600)" fillOpacity="0.22" />
      <path
        d="M224 70 L132 214 H196 L172 330 L270 172 H204 Z"
        fill="var(--color-blue-600)"
        fillOpacity="0.5"
        stroke="var(--color-blue-300)"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * P8 CTA CUỐI — MỘT khối duy nhất của trang (AC-SH-7) có form B2B (contracts/lead-b2b.md APPROVED D-26, SRS-LEADS mục 4):
 * cột trái tiêu đề + nút Gọi, cột phải form trong khung trắng (neo #bao-gia = QUOTE_HREF, #dat-lich-demo = DEMO_HREF).
 * Nút "Nhận báo giá" ở header/hero và "Đặt lịch demo" trỏ tới các neo này; form tự đổi intent quote/demo theo nút.
 * Form tắt (production khi câu đồng ý chưa duyệt) → khung trắng hiện khối Gọi · Zalo · email. Hotline KHÔNG animate.
 */
export async function FinalCta({ locale, tone }: { locale: Locale; tone: SectionTone }) {
  const t = await getTranslations('home');
  const phone = site.hotline.display[locale];

  return (
    <Section id="hop-tac" tone={tone} aria-labelledby="hop-tac-title">
      <div data-tone="navy" className="relative isolate overflow-clip rounded-xl bg-navy-900 px-4 py-10 sm:px-10 md:px-14 md:py-16 lg:p-16">
        <BoltArt />
        <div className="relative grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start lg:pt-8">
            <Rise>
              <Eyebrow>{t('cta.eyebrow')}</Eyebrow>
              <Heading level={2} id="hop-tac-title" className="mt-3">
                {t('cta.title')}
              </Heading>
              <p className="mt-5 max-w-[38rem] text-lead text-(--surface-muted)">{t('cta.lead')}</p>
            </Rise>
            <Button
              externalHref={`tel:${site.hotline.tel}`}
              variant="on-dark"
              size="lg"
              className="mt-8 w-full sm:w-auto"
              iconStart={<Phone aria-hidden="true" size={20} strokeWidth={1.75} />}
            >
              {t('cta.call', { phone })}
            </Button>
          </div>
          <LeadB2BBlock locale={locale} intents={['quote', 'demo']} className="lg:col-span-7" />
        </div>
      </div>
    </Section>
  );
}
