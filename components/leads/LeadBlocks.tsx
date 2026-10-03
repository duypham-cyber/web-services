import { getMessages, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { ContactButtons } from '@/components/partners/ContactButtons';
import { DraftLine } from '@/components/ui/DraftLine';
import { provinces } from '@/content/provinces';
import { site } from '@/content/site';
import { slaItems } from '@/content/sla';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { isDraftPreview } from '@/lib/env';
import { getLeadFormState } from '@/lib/leads/form-state';
import type { B2BIntent, LeadType } from '@/lib/leads/rules';
import { fmt } from './client-utils';
import { LeadFormB2B } from './LeadFormB2B';
import { LeadFormTechnician } from './LeadFormTechnician';
import type { LeadContact, LeadFormBaseProps, LeadFormCopy, ProvinceOption } from './types';

/**
 * Khối form lead (Server Component) — contracts/lead-b2b.md, lead-technician.md (APPROVED, D-26); docs/SRS-LEADS.md mục 4–7.
 *
 * Trạng thái form chốt LÚC BUILD (getLeadFormState, trang tĩnh):
 * - tắt (LEADS_FORM_ENABLED khác true, câu đồng ý chưa duyệt ở production, cấu hình thiếu) → khối Gọi · Zalo · email bộ
 *   phận thay form (AC-C10, A7). Bản xem trước có thêm một dòng ghi chú lý do.
 * - bật → form client + <noscript> khối liên hệ (A11). API vẫn kiểm lại mỗi request: 503 lúc chạy → form tự thay bằng khối
 *   liên hệ (prop `fallback`).
 * Chữ của form đi qua props (client chỉ có namespace common/errors). Không có chữ "Nháp" nào trong props ở production.
 */

/** SLA gọi lại (D-12) — content/sla.ts chưa có mục này thì production ẩn câu, bản xem trước hiện kèm Nháp. */
const CALLBACK_SLA_IDS = { lead_b2b: 'lead-callback-b2b', lead_technician: 'lead-callback-technician' } as const;

type Leads = Awaited<ReturnType<typeof getMessages>>['leads'];

function callbackLine(type: LeadType, template: string, locale: Locale, pendingValue: string) {
  const item = slaItems.find((s) => s.id === CALLBACK_SLA_IDS[type]);
  if (item?.status === 'approved' && item.value) return { text: fmt(template, { time: item.value[locale] }), draft: false };
  if (isDraftPreview()) return { text: fmt(template, { time: pendingValue }), draft: true };
  return null;
}

export function callbackSlaApproved(type: LeadType): boolean {
  const item = slaItems.find((s) => s.id === CALLBACK_SLA_IDS[type]);
  return item?.status === 'approved' && item.value !== null;
}

function provinceOptions(locale: Locale): ProvinceOption[] {
  return provinces.map((p) => ({ code: p.code, name: p.name[locale], region: p.region }));
}

async function contactInfo(locale: Locale): Promise<LeadContact> {
  const tc = await getTranslations({ locale, namespace: 'common' });
  const zaloApproved = (site.zalo.status as string) === 'approved';
  return {
    phoneDisplay: site.hotline.display[locale],
    tel: site.hotline.tel,
    zalo: zaloApproved ? { url: site.zalo.url, draftLabel: null } : isDraftPreview() ? { url: site.zalo.url, draftLabel: tc('status.draft') } : null,
  };
}

function pickCopy(leads: Leads): LeadFormCopy {
  return { form: leads.form, consent: leads.consent, errors: leads.errors, fieldErrors: leads.fieldErrors, thanks: leads.thanks };
}

/** Khung trắng chứa form (đặt được trên nền navy, blue-50 hay trắng). */
function FormCard({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <div
      id={id}
      data-tone="light"
      data-lead-block=""
      className={cn('relative min-w-0 rounded-lg border border-slate-300 bg-white p-4 text-ink-900 shadow-2 sm:p-8', className)}
    >
      {children}
    </div>
  );
}

/**
 * Khối Gọi · Zalo · email bộ phận (thay form khi form tắt, trong <noscript>, và khi API trả 503 lúc chạy).
 * Zalo: chỉ khi link đã duyệt; bản xem trước hiện kèm Nháp (D-06, ContactButtons).
 */
export async function LeadContactFallback({ locale, type }: { locale: Locale; type: LeadType }) {
  const t = await getTranslations({ locale, namespace: 'leads' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const key = type === 'lead_b2b' ? 'b2b' : 'technician';
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-h3 text-(--surface-heading)">{t(`fallback.title.${key}`)}</p>
        <p className="mt-2 text-body text-(--surface-muted)">{t(`fallback.body.${key}`)}</p>
      </div>
      <ContactButtons
        callVariant="blue"
        callLabel={tc('cta.callNumber', { phone: site.hotline.display[locale] })}
        zaloLabel={t('form.zalo')}
        email={{ label: t('fallback.email'), subject: t(`fallback.emailSubject.${key}`), style: 'link' }}
        newTabLabel={t('form.newTab')}
      />
    </div>
  );
}

async function baseProps(type: LeadType, locale: Locale) {
  const state = getLeadFormState(type, locale);
  const messages = await getMessages({ locale });
  const leads = messages.leads;
  const tc = await getTranslations({ locale, namespace: 'common' });
  return { state, leads, draftWord: tc('status.draft') };
}

/** Ghi chú cho người duyệt khi form tắt ở bản xem trước (production: null). */
async function DisabledNote({ locale, reason }: { locale: Locale; reason: string }) {
  const t = await getTranslations({ locale, namespace: 'leads' });
  return <DraftLine className="mt-4">{t('preview.disabled', { reason })}</DraftLine>;
}

/**
 * Form B2B. `intents`: intent cho phép trên trang, phần tử đầu là mặc định — trang chủ và /giai-phap/hang-dien-may
 * ['quote','demo'], /bang-gia ['quote'], /giai-phap/san-tmdt-ban-le ['integration'] (D-15).
 * Neo: id="bao-gia" (đích QUOTE_HREF) + #dat-lich-demo (đích DEMO_HREF) khi có intent demo.
 */
export async function LeadB2BBlock({
  locale,
  intents,
  id = 'bao-gia',
  className,
}: {
  locale: Locale;
  intents: B2BIntent[];
  id?: string;
  className?: string;
}) {
  const { state, leads, draftWord } = await baseProps('lead_b2b', locale);
  const demoAnchor = intents.includes('demo') ? <span id="dat-lich-demo" aria-hidden="true" className="absolute top-0" /> : null;

  if (!state.enabled) {
    return (
      <FormCard id={id} className={className}>
        {demoAnchor}
        <LeadContactFallback locale={locale} type="lead_b2b" />
        <DisabledNote locale={locale} reason={state.reason} />
      </FormCard>
    );
  }

  const base: LeadFormBaseProps = {
    locale,
    endpoint: state.endpoint,
    consent: state.consent,
    turnstileSiteKey: state.turnstileSiteKey,
    copy: pickCopy(leads),
    contact: await contactInfo(locale),
    draftLabel: state.draft || isDraftPreview() ? draftWord : null,
    consentDraftNote: state.consent.draft ? leads.preview.consentDraft : null,
    callback: callbackLine('lead_b2b', leads.thanks.callback.b2b, locale, leads.preview.callbackPendingValue),
    fallback: <LeadContactFallback locale={locale} type="lead_b2b" />,
  };

  return (
    <FormCard id={id} className={className}>
      {demoAnchor}
      <noscript>
        <p className="mb-4 text-body text-ink-900">{leads.form.noscript}</p>
        <LeadContactFallback locale={locale} type="lead_b2b" />
      </noscript>
      <LeadFormB2B
        {...base}
        b2b={leads.b2b}
        provinces={provinceOptions(locale)}
        intents={intents}
        callbackDemo={callbackLine('lead_b2b', leads.thanks.callback.demo, locale, leads.preview.callbackPendingValue)}
        blockId={id}
      />
      {callbackSlaApproved('lead_b2b') ? null : <DraftLine className="mt-6">{leads.preview.callbackPending}</DraftLine>}
    </FormCard>
  );
}

/**
 * Form thợ (đúng 4 ô) cho /doi-tac-tho#dang-ky. Neo #dang-ky nằm ở section bao ngoài (TechnicianRegisterSection).
 */
export async function LeadTechnicianBlock({ locale, className }: { locale: Locale; className?: string }) {
  const { state, leads, draftWord } = await baseProps('lead_technician', locale);

  if (!state.enabled) {
    return (
      <FormCard className={className}>
        <LeadContactFallback locale={locale} type="lead_technician" />
        <DisabledNote locale={locale} reason={state.reason} />
      </FormCard>
    );
  }

  const tp = await getTranslations({ locale, namespace: 'partners' });
  const base: LeadFormBaseProps = {
    locale,
    endpoint: state.endpoint,
    consent: state.consent,
    turnstileSiteKey: state.turnstileSiteKey,
    copy: pickCopy(leads),
    contact: await contactInfo(locale),
    draftLabel: state.draft || isDraftPreview() ? draftWord : null,
    consentDraftNote: state.consent.draft ? leads.preview.consentDraft : null,
    callback: callbackLine('lead_technician', leads.thanks.callback.technician, locale, leads.preview.callbackPendingValue),
    fallback: <LeadContactFallback locale={locale} type="lead_technician" />,
  };

  return (
    <FormCard className={className}>
      <noscript>
        <p className="mb-4 text-body text-ink-900">{leads.form.noscript}</p>
        <LeadContactFallback locale={locale} type="lead_technician" />
      </noscript>
      <LeadFormTechnician
        {...base}
        technician={leads.technician}
        provinces={provinceOptions(locale)}
        steps={[
          tp('onboarding.steps.register.title'),
          tp('onboarding.steps.verify.title'),
          tp('onboarding.steps.training.title'),
          tp('onboarding.steps.jobs.title'),
        ]}
      />
      {callbackSlaApproved('lead_technician') ? null : <DraftLine className="mt-6">{leads.preview.callbackPending}</DraftLine>}
    </FormCard>
  );
}
