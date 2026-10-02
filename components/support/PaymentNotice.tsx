import { ShieldAlert } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { SectionHeader } from '@/components/partners/SectionHeader';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import { site } from '@/content/site';
import type { Locale } from '@/i18n/routing';
import { claim } from '@/lib/claims';

/**
 * /ho-tro-khach-hang#luu-y-thanh-toan — cảnh báo chuyển khoản (docs/03 mục 13.5).
 * "Bluebolt không yêu cầu chuyển khoản cá nhân cho thợ" là câu khẳng định (nháp) → chỉ hiện ở bản xem trước.
 * Lời khuyên "gọi hotline để xác minh" không khẳng định chính sách nào nên luôn hiện.
 */
export async function PaymentNotice({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'support' });
  const noTransfer = claim('support.no-personal-transfer', locale);
  const materials = claim('partner.materials-paid-on-site', locale);

  return (
    <Section tone="blue-50" id="luu-y-thanh-toan" aria-labelledby="luu-y-thanh-toan-title">
      <div className="grid gap-8 rounded-xl border border-warning-text bg-white p-6 shadow-1 md:grid-cols-[auto_minmax(0,1fr)] md:p-10" data-tone="light">
        <span className="inline-flex size-14 items-center justify-center rounded-pill bg-orange-50 text-warning-text">
          <ShieldAlert aria-hidden="true" size={28} strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <SectionHeader id="luu-y-thanh-toan-title" eyebrow={t('payment.eyebrow')} title={t('payment.title')} />
          {noTransfer ? (
            <p className="mt-5 max-w-[62ch] text-lead font-semibold text-ink-900">
              {noTransfer.text}
              {noTransfer.draft ? (
                <>
                  {' '}
                  <DraftBadge />
                </>
              ) : null}
            </p>
          ) : null}
          <p className="mt-4 max-w-[62ch] text-body text-ink-900">
            {t('payment.tip', { phone: site.hotline.display[locale] })}
          </p>
          {materials ? (
            <p className="mt-4 max-w-[62ch] text-body text-slate-600">
              {materials.text}
              {materials.draft ? (
                <>
                  {' '}
                  <DraftBadge />
                </>
              ) : null}
            </p>
          ) : null}
          <TextLink href="/bang-gia" variant="arrow" className="mt-5 py-1">
            {t('payment.materialsLink')}
          </TextLink>
        </div>
      </div>
    </Section>
  );
}
