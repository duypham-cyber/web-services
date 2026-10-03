import { getTranslations } from 'next-intl/server';
import { ContactButtons } from '@/components/partners/ContactButtons';
import { DraftNote } from '@/components/partners/DraftNote';
import { FinalCta } from '@/components/partners/FinalCta';
import { Button } from '@/components/ui/Button';
import { technicianApp } from '@/content/partners';
import { site } from '@/content/site';
import { isDraftPreview } from '@/lib/env';
import type { Locale } from '@/i18n/routing';
import { LeadTechnicianBlock } from './LeadBlocks';

/**
 * /doi-tac-tho#dang-ky — khối CTA cuối DUY NHẤT của trang (AC-SH-7) với form thợ 4 ô (contracts/lead-technician.md,
 * APPROVED D-26). Thay khung form giả của components/partners/RegisterSection.tsx (bản chờ contract): giữ nguyên neo
 * #dang-ky (section) + neo phụ #register cho bản EN, nút Gọi/Zalo tuyển thợ và link tải app (chỉ khi có link thật).
 */
export async function TechnicianRegisterSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'partners' });
  const tl = await getTranslations({ locale, namespace: 'leads' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const tContact = await getTranslations({ locale, namespace: 'contact' });
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
          <p>{tl('technician.sectionLead')}</p>
        </>
      }
      actions={
        <div className="flex flex-col gap-4 lg:items-end">
          <ContactButtons
            tone="navy"
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
      <LeadTechnicianBlock locale={locale} />
      {isDraftPreview() ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {hasAppLinks ? null : <DraftNote>{t('register.appPending')}</DraftNote>}
          <DraftNote>{t('register.testimonialsPending')}</DraftNote>
        </div>
      ) : null}
    </FinalCta>
  );
}
