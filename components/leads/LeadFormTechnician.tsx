'use client';

import { Badge } from '@/components/ui/Badge';
import { Field, Select, TextInput } from '@/components/ui/Field';
import { LIMITS, PRIMARY_SKILLS } from '@/lib/leads/rules';
import { fmt } from './client-utils';
import { ConsentFieldset, FormNoticeBox, Honeypot, NoticeExtra, SubmitButton, ThankYou, TurnstileSlot, fieldErrorText } from './parts';
import type { LeadTechnicianProps } from './types';
import { useLeadForm } from './useLeadForm';
import {
  EMPTY_TECHNICIAN,
  TECHNICIAN_FIELD_ORDER,
  technicianPayloadFields,
  validateTechnicianField,
  type TechnicianField,
  type TechnicianValues,
} from './validation';

const P = 'lead-tech';

function restoreTechnician(saved: Record<string, unknown>): Partial<TechnicianValues> {
  const out: Partial<TechnicianValues> = {};
  for (const key of TECHNICIAN_FIELD_ORDER) {
    const v = saved[key];
    if (typeof v === 'string') out[key] = v;
  }
  return out;
}

/**
 * Form "Đăng ký làm đối tác thợ" — contracts/lead-technician.md (APPROVED, D-26). ĐÚNG 4 ô (AC-T1, Rule T1):
 * họ và tên, số di động (Zalo), một tỉnh/thành, một kỹ năng chính. Tỉnh và kỹ năng là <select> gốc (AC-T7).
 * Neo: /doi-tac-tho#dang-ky (EN /en/technician-partners#register) — nút "Đăng ký thợ" ở thanh dính đáy cuộn tới form
 * và focus ô "Họ và tên" (AC-T9).
 */
export function LeadFormTechnician(props: LeadTechnicianProps) {
  const { copy, technician, contact, draftLabel } = props;

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
    type: 'lead_technician',
    base: props,
    empty: EMPTY_TECHNICIAN,
    order: TECHNICIAN_FIELD_ORDER,
    validateField: validateTechnicianField,
    buildFields: technicianPayloadFields,
    restore: restoreTechnician,
    analytics: () => ({}),
    anchors: { 'dang-ky': null, register: null },
    firstFieldId: `${P}-fullName`,
  });

  const fields = technician.fields;
  const err = (k: TechnicianField) => fieldErrorText(copy, errors[k]);
  const control = (k: TechnicianField) => ({
    value: values[k],
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
          title={copy.thanks.title.technician}
          reference={reference}
          copy={copy}
          callback={props.callback}
          steps={props.steps}
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
            {technician.title}
            {props.consent.draft && draftLabel ? <Badge variant="draft">{draftLabel}</Badge> : null}
          </h3>
          <p className="mt-2 text-body text-(--surface-muted)">{technician.lead}</p>
          <p className="mt-2 text-small text-(--surface-muted)">
            {fmt(technician.customerHint, { phone: contact.phoneDisplay })}
          </p>
        </div>

        <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
          <Field id={`${P}-fullName`} label={fields.fullName.label} error={err('fullName')} {...req}>
            {(c) => <TextInput {...c} {...control('fullName')} name="fullName" autoComplete="name" maxLength={LIMITS.fullName.max * 2} />}
          </Field>
          <Field id={`${P}-phone`} label={fields.phone.label} hint={fields.phone.hint} error={err('phone')} {...req}>
            {(c) => (
              <TextInput
                {...c}
                {...control('phone')}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={LIMITS.phoneInput}
              />
            )}
          </Field>
          <Field id={`${P}-province`} label={fields.province.label} error={err('province')} {...req}>
            {(c) => (
              <Select {...c} {...control('province')} name="province">
                <option value="">{fields.province.placeholder}</option>
                {props.provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id={`${P}-primarySkill`} label={fields.primarySkill.label} error={err('primarySkill')} {...req}>
            {(c) => (
              <Select {...c} {...control('primarySkill')} name="primarySkill">
                <option value="">{fields.primarySkill.placeholder}</option>
                {PRIMARY_SKILLS.map((v) => (
                  <option key={v} value={v}>
                    {fields.primarySkill.options[v]}
                  </option>
                ))}
              </Select>
            )}
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

        <SubmitButton hydrated={hydrated} busy={status === 'submitting'} label={technician.submit} busyLabel={copy.form.submitting} />
      </form>
    </div>
  );
}
