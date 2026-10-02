import { Check } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/Button';
import { technicianApp } from '@/content/partners';
import { site } from '@/content/site';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { ContactButtons } from './ContactButtons';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { DraftNote } from './DraftNote';
import { FinalCta } from './FinalCta';

const FIELD_KEYS = ['name', 'phone', 'province', 'skill'] as const;

/**
 * /doi-tac-tho#dang-ky — khối CTA cuối DUY NHẤT của trang (AC-SH-7). Đích của nút "Đăng ký thợ" ở thanh dính đáy
 * và CTA phụ trang chủ (TECHNICIAN_SIGNUP_HREF).
 * CHƯA có form: form 4 trường chờ contracts/lead-technician.md APPROVED (CLAUDE.md "Phần động"). Trong lúc chờ:
 * gọi hotline / Zalo tuyển thợ + danh sách 4 thông tin cần chuẩn bị (đúng 4 trường của form tương lai).
 */
export async function RegisterSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'partners' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const tContact = await getTranslations({ locale, namespace: 'contact' });
  const preview = isDraftPreview();
  const hasAppLinks = technicianApp.androidUrl !== null || technicianApp.iosUrl !== null;

  return (
    <FinalCta
      id="dang-ky"
      eyebrow={t('register.eyebrow')}
      title={t('register.title')}
      body={
        <>
          {/* Neo phụ cho bản EN theo contracts/lead-technician.md (/en/technician-partners#register) */}
          {locale === 'en' ? <span id="register" className="block scroll-mt-32" aria-hidden="true" /> : null}
          <p>{t('register.body')}</p>
          <ul className="mt-5 grid gap-x-8 gap-y-2 text-body text-white sm:grid-cols-2">
            {FIELD_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-2.5">
                <Check aria-hidden="true" size={20} strokeWidth={2} className="shrink-0 text-orange-200" />
                {t(`register.fields.${key}`)}
              </li>
            ))}
          </ul>
        </>
      }
      actions={
        <div className="flex flex-col gap-4 lg:items-end">
          <ContactButtons
            tone="navy"
            callVariant="primary"
            size="lg"
            callLabel={tc('cta.callNumber', { phone: site.hotline.display[locale] })}
            zaloLabel={t('register.zalo')}
            newTabLabel={tContact('office.newTab')}
          />
          {hasAppLinks ? (
            <div className="flex flex-wrap gap-3">
              {technicianApp.androidUrl ? (
                <Button externalHref={technicianApp.androidUrl} target="_blank" rel="noopener noreferrer" variant="on-dark">
                  {t('register.appAndroid')}
                  <span className="sr-only"> {tContact('office.newTab')}</span>
                </Button>
              ) : null}
              {technicianApp.iosUrl ? (
                <Button externalHref={technicianApp.iosUrl} target="_blank" rel="noopener noreferrer" variant="on-dark">
                  {t('register.appIos')}
                  <span className="sr-only"> {tContact('office.newTab')}</span>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      }
    >
      {preview ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          {/* Khung form tương lai — CHỈ bản xem trước, không phải form thật (không input, không submit). */}
          <div className="rounded-lg border-2 border-dashed border-slate-500 bg-white p-6 text-ink-900 md:p-8" data-tone="light">
            <p className="flex flex-wrap items-center gap-2 text-body font-semibold">
              {t('register.formFrameTitle')} <DraftBadge />
            </p>
            <div aria-hidden="true" className="mt-5 grid gap-4 sm:grid-cols-2">
              {FIELD_KEYS.map((key) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <span className="text-small font-semibold text-slate-600">{t(`register.fields.${key}`)}</span>
                  <span className="block h-11 rounded-sm border border-slate-300 bg-blue-50" />
                </div>
              ))}
            </div>
            <span
              aria-hidden="true"
              className="mt-5 inline-flex min-h-11 items-center rounded-pill border border-slate-300 bg-blue-50 px-6 text-body font-semibold text-slate-600"
            >
              {t('register.formFrameSubmit')}
            </span>
            <p className="mt-5 text-small text-slate-600">{t('register.formPending')}</p>
          </div>
          <div className="flex flex-col gap-4">
            {hasAppLinks ? null : <DraftNote>{t('register.appPending')}</DraftNote>}
            <DraftNote>{t('register.testimonialsPending')}</DraftNote>
          </div>
        </div>
      ) : null}
    </FinalCta>
  );
}
