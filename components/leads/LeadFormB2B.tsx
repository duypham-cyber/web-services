'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Field, Select, TextArea, TextInput } from '@/components/ui/Field';
import { CUSTOMER_TYPES, LIMITS, MONTHLY_VOLUMES, type B2BIntent } from '@/lib/leads/rules';
import { ConsentFieldset, FormNoticeBox, Honeypot, NoticeExtra, SubmitButton, ThankYou, TurnstileSlot, fieldErrorText } from './parts';
import { ProvincePicker } from './ProvincePicker';
import type { LeadB2BProps } from './types';
import { useLeadForm } from './useLeadForm';
import {
  B2B_FIELD_ORDER,
  EMPTY_B2B,
  b2bPayloadFields,
  validateB2BField,
  type B2BField,
  type B2BValues,
} from './validation';

const P = 'lead-b2b';

function restoreB2B(saved: Record<string, unknown>): Partial<B2BValues> {
  const out: Partial<B2BValues> = {};
  for (const key of B2B_FIELD_ORDER) {
    const v = saved[key];
    if (key === 'provinces') {
      if (Array.isArray(v)) out.provinces = v.filter((x): x is string => typeof x === 'string');
    } else if (typeof v === 'string') {
      out[key] = v;
    }
  }
  return out;
}

/**
 * Form B2B "Nhận báo giá / Đặt lịch demo 30 phút / Thảo luận tích hợp" — contracts/lead-b2b.md (APPROVED, D-26).
 * 9 ô (7 bắt buộc; chức danh và ghi chú tùy chọn, D-05). `intent` là ô ẩn do CTA đặt: link tới #bao-gia → quote,
 * #dat-lich-demo → demo (chỉ khi trang cho phép), trang sàn TMĐT → integration (D-15).
 */
export function LeadFormB2B(props: LeadB2BProps & { activation?: { hash: string } | null }) {
  const { copy, b2b, intents, contact, draftLabel, blockId } = props;
  const [intent, setIntent] = useState<B2BIntent>(intents[0] ?? 'quote');
  const canSwitch = intents.includes('quote') && intents.includes('demo');

  const {
    values,
    setValue,
    onBlurField,
    errors,
    purposes,
    togglePurpose,
    status,
    notice,
    noticeText,
    reference,
    hydrated,
    doneHeight,
    onFirstInteraction,
    onSubmit,
    blockRef,
    formRef,
    noticeRef,
    hpRef,
    turnstileRef,
    turnstileStatus,
  } = useLeadForm({
    type: 'lead_b2b',
    base: props,
    empty: EMPTY_B2B,
    order: B2B_FIELD_ORDER,
    validateField: validateB2BField,
    buildFields: (v) => b2bPayloadFields(v, intent),
    restore: restoreB2B,
    analytics: () => ({ intent }),
    anchors: {
      [blockId]: intents.includes('quote') ? () => setIntent('quote') : null,
      'dat-lich-demo': intents.includes('demo') ? () => setIntent('demo') : null,
    },
    firstFieldId: `${P}-fullName`,
    activation: props.activation,
  });

  const fields = b2b.fields;
  const err = (k: B2BField) => fieldErrorText(copy, errors[k]);
  const text = (k: B2BField) => ({
    value: values[k] as string,
    onChange: (e: { currentTarget: { value: string } }) => setValue(k, e.currentTarget.value),
    onBlur: () => onBlurField(k),
  });
  const req = { required: true, requiredLabel: copy.form.requiredMark };

  if (status === 'disabled') {
    return (
      <div ref={blockRef} className="flex flex-col gap-5">
        <p role="status" className="text-body text-ink-900">
          {copy.errors.LEADS_DISABLED}
        </p>
        {props.fallback}
      </div>
    );
  }

  if (status === 'done' && reference) {
    return (
      <div ref={blockRef}>
        <ThankYou
          title={intent === 'demo' ? copy.thanks.title.demo : copy.thanks.title.quote}
          reference={reference}
          copy={copy}
          callback={intent === 'demo' ? props.callbackDemo : props.callback}
          steps={null}
          contact={contact}
          draftLabel={draftLabel}
          minHeight={doneHeight}
        />
      </div>
    );
  }

  const titleId = `${P}-title`;
  return (
    <div ref={blockRef}>
      <form
        ref={formRef}
        method="post"
        action={props.endpoint}
        noValidate
        aria-labelledby={titleId}
        onSubmit={onSubmit}
        onFocusCapture={onFirstInteraction}
        onPointerDownCapture={onFirstInteraction}
        className="relative flex flex-col gap-6"
      >
        <div>
          <h3 id={titleId} tabIndex={-1} className="flex flex-wrap items-center gap-2 text-h3 text-(--surface-heading) outline-none">
            {b2b.title[intent]}
            {props.consent.draft && draftLabel ? <Badge variant="draft">{draftLabel}</Badge> : null}
          </h3>
          <p className="mt-2 text-body text-(--surface-muted)">{b2b.lead[intent]}</p>
          {canSwitch ? (
            <button
              type="button"
              onClick={() => setIntent(intent === 'demo' ? 'quote' : 'demo')}
              className="mt-2 inline-flex min-h-11 items-center text-left text-small font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700"
            >
              {intent === 'demo' ? b2b.switchToQuote : b2b.switchToDemo}
            </button>
          ) : null}
        </div>

        <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
          <Field id={`${P}-fullName`} label={fields.fullName.label} error={err('fullName')} {...req}>
            {(c) => <TextInput {...c} {...text('fullName')} name="fullName" autoComplete="name" maxLength={LIMITS.fullName.max * 2} />}
          </Field>
          <Field id={`${P}-company`} label={fields.company.label} error={err('company')} {...req}>
            {(c) => (
              <TextInput {...c} {...text('company')} name="company" autoComplete="organization" maxLength={LIMITS.company.max * 2} />
            )}
          </Field>
          <Field
            id={`${P}-jobTitle`}
            label={`${fields.jobTitle.label} (${copy.form.optionalMark})`}
            error={err('jobTitle')}
          >
            {(c) => (
              <TextInput {...c} {...text('jobTitle')} name="jobTitle" autoComplete="organization-title" maxLength={LIMITS.jobTitle.max * 2} />
            )}
          </Field>
          <Field id={`${P}-phone`} label={fields.phone.label} hint={fields.phone.hint} error={err('phone')} {...req}>
            {(c) => (
              <TextInput
                {...c}
                {...text('phone')}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={LIMITS.phoneInput}
              />
            )}
          </Field>
          <Field id={`${P}-workEmail`} label={fields.workEmail.label} error={err('workEmail')} {...req}>
            {(c) => (
              <TextInput
                {...c}
                {...text('workEmail')}
                name="workEmail"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={LIMITS.email}
              />
            )}
          </Field>
          <Field id={`${P}-customerType`} label={fields.customerType.label} error={err('customerType')} {...req}>
            {(c) => (
              <Select {...c} {...text('customerType')} name="customerType">
                <option value="">{fields.customerType.placeholder}</option>
                {CUSTOMER_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {fields.customerType.options[v]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id={`${P}-monthlyVolume`} label={fields.monthlyVolume.label} error={err('monthlyVolume')} {...req}>
            {(c) => (
              <Select {...c} {...text('monthlyVolume')} name="monthlyVolume">
                <option value="">{fields.monthlyVolume.placeholder}</option>
                {MONTHLY_VOLUMES.map((v) => (
                  <option key={v} value={v}>
                    {fields.monthlyVolume.options[v]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="md:col-span-2">
            <ProvincePicker
              idPrefix={`${P}-provinces`}
              options={props.provinces}
              value={values.provinces}
              onChange={(next) => setValue('provinces', next)}
              onBlur={() => onBlurField('provinces')}
              copy={fields.provinces}
              requiredMark={copy.form.requiredMark}
              error={err('provinces')}
            />
          </div>
          <Field
            id={`${P}-note`}
            label={`${fields.note.label} (${copy.form.optionalMark})`}
            hint={fields.note.hint}
            error={err('note')}
            className="md:col-span-2"
          >
            {(c) => <TextArea {...c} {...text('note')} name="note" rows={3} maxLength={LIMITS.note} />}
          </Field>
        </div>

        <Honeypot id={`${P}-hp`} label={copy.form.honeypot} inputRef={hpRef} />

        <ConsentFieldset
          idPrefix={P}
          consent={props.consent}
          copy={copy}
          checked={purposes}
          onToggle={togglePurpose}
          error={errors.consent}
          draftLabel={draftLabel}
          draftNote={props.consentDraftNote}
        />

        <TurnstileSlot
          containerRef={turnstileRef}
          status={turnstileStatus}
          label={copy.form.verifyLabel}
          placeholder={copy.form.verifyPlaceholder}
        />

        <FormNoticeBox
          boxRef={noticeRef}
          notice={notice ? { tone: notice.tone, text: noticeText(notice), extra: <NoticeExtra notice={notice} contact={contact} copy={copy} /> } : null}
        />

        <SubmitButton
          hydrated={hydrated}
          busy={status === 'submitting'}
          label={b2b.submit[intent]}
          busyLabel={copy.form.submitting}
        />
      </form>
    </div>
  );
}
