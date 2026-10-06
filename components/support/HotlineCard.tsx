import { Clock, Mail, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ContactButtons } from '@/components/partners/ContactButtons';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { site } from '@/content/site';
import { slaItems } from '@/content/sla';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';

/**
 * Thẻ hotline chăm sóc khách hàng (cột phải hero /ho-tro-khach-hang): số lớn, nút Gọi (CTA chính) + Zalo, giờ hỗ trợ,
 * email. Số và email từ content/site.ts.
 * Giờ hỗ trợ đọc content/sla.ts "hotline-hours": đã duyệt → hiện giá trị; nháp → bản xem trước hiện điều site cũ
 * đang ghi kèm nhãn Nháp, production ghi "đang cập nhật" (site cũ tự mâu thuẫn 24/7 và 9–18h). KHÔNG animate hotline.
 */
export async function HotlineCard({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'support' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const tContact = await getTranslations({ locale, namespace: 'contact' });
  const hours = slaItems.find((s) => s.id === 'hotline-hours');
  const approved = hours?.status === 'approved' && hours.value !== null;
  const preview = isDraftPreview();

  return (
    <div data-tone="navy" className="relative overflow-clip rounded-xl bg-blue-600 p-6 text-white shadow-3 md:p-8">
      <p className="eyebrow text-orange-200">{t('hotlineCard.title')}</p>
      <p className="mt-4 flex items-center gap-3 whitespace-nowrap font-display text-h2 tabular text-white">
        <Phone aria-hidden="true" size={32} strokeWidth={1.5} className="shrink-0 text-orange-200" />
        <span>{site.hotline.display[locale]}</span>
      </p>

      <ContactButtons
        tone="navy"
        callVariant="primary"
        size="lg"
        className="mt-6"
        callLabel={t('hotlineCard.callNow')}
        zaloLabel={tc('cta.zalo')}
        newTabLabel={tContact('office.newTab')}
      />

      <div className="mt-8 flex gap-3 border-t border-(--surface-border) pt-5 text-small">
        <Clock aria-hidden="true" size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-blue-300" />
        <div>
          <p className="font-semibold text-white">{t('hotlineCard.hoursLabel')}</p>
          {approved && hours?.value ? (
            <p className="mt-1 text-slate-300">{hours.value[locale]}</p>
          ) : preview && hours ? (
            <p className="mt-1 text-slate-300">
              {t('hotlineCard.hoursCurrent', { value: hours.current[locale] })} <DraftBadge />
            </p>
          ) : (
            <p className="mt-1 text-slate-300">{t('hotlineCard.hoursPending')}</p>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-3 text-small">
        <Mail aria-hidden="true" size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-blue-300" />
        <div>
          <p className="font-semibold text-white">{t('hotlineCard.emailLabel')}</p>
          <a href={`mailto:${site.email}`} className="mt-1 inline-block text-blue-100 hover:text-white hover:underline">
            {site.email}
          </a>
        </div>
      </div>
    </div>
  );
}
