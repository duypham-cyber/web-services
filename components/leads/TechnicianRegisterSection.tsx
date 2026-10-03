import { Check } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ContactButtons } from '@/components/partners/ContactButtons';
import { DraftNote } from '@/components/partners/DraftNote';
import { FinalCta } from '@/components/partners/FinalCta';
import { Button } from '@/components/ui/Button';
import { technicianApp } from '@/content/partners';
import { site } from '@/content/site';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { getLeadFormState } from '@/lib/leads/form-state';
import { LeadTechnicianBlock } from './LeadBlocks';

const FIELD_KEYS = ['name', 'phone', 'province', 'skill'] as const;

/**
 * /doi-tac-tho#dang-ky — khối CTA cuối DUY NHẤT của trang (AC-SH-7) với form thợ 4 ô (contracts/lead-technician.md,
 * APPROVED D-26). Thay components/partners/RegisterSection.tsx (bản chờ contract, khung form giả): giữ neo #dang-ky
 * (section) + neo phụ #register cho bản EN, nút Gọi/Zalo tuyển thợ, link tải app (chỉ khi có link thật).
 * Form tắt (production khi câu đồng ý chưa duyệt, AC-C10): KHÔNG form — Gọi · Zalo (khi đã duyệt) · email bộ phận tuyển
 * thợ + 4 thông tin cần chuẩn bị (như khối cũ), không có câu "điền form bên dưới".
 */
export async function TechnicianRegisterSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'partners' });
  const tl = await getTranslations({ locale, namespace: 'leads' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const tContact = await getTranslations({ locale, namespace: 'contact' });
  const hasAppLinks = technicianApp.androidUrl !== null || technicianApp.iosUrl !== null;
  const enabled = getLeadFormState('lead_technician', locale).enabled;

  return (
    <FinalCta
      id="dang-ky"
      eyebrow={t('register.eyebrow')}
      title={t('register.title')}
      body={
        <>
          {/* Neo phụ cho bản EN theo contracts/lead-technician.md (/en/technician-partners#register) */}
          {locale === 'en' ? <span id="register" className="block scroll-mt-32" aria-hidden="true" /> : null}
          {enabled ? (
            <p>{tl('technician.sectionLead')}</p>
          ) : (
            <>
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
          )}
        </>
      }
      actions={
        <div className="flex flex-col gap-4 lg:items-end">
          <ContactButtons
            tone="navy"
            callVariant={enabled ? undefined : 'primary'}
            size="lg"
            callLabel={tc('cta.callNumber', { phone: site.hotline.display[locale] })}
            zaloLabel={t('register.zalo')}
            email={
              enabled
                ? undefined
                : { label: tl('fallback.email'), subject: tl('fallback.emailSubject.technician'), style: 'link' }
            }
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
      {enabled ? (
        <>
          <LeadTechnicianBlock locale={locale} />
          {isDraftPreview() ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {hasAppLinks ? null : <DraftNote>{t('register.appPending')}</DraftNote>}
              <DraftNote>{t('register.testimonialsPending')}</DraftNote>
            </div>
          ) : null}
        </>
      ) : null}
    </FinalCta>
  );
}
