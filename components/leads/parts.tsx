'use client';

import { CircleAlert, CircleCheck, Info, MessageCircle, Phone } from 'lucide-react';
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { PublicConsent } from '@/lib/leads/consent';
import { fmt } from './client-utils';
import type { LeadContact, LeadFormCopy } from './types';
import type { FieldError } from './validation';
import type { TurnstileStatus } from './useTurnstile';

/** Câu lỗi của một ô theo khóa leads.fieldErrors (+ tham số {min} {max}). */
export function fieldErrorText(copy: LeadFormCopy, e: FieldError | undefined): string | undefined {
  return e ? fmt(copy.fieldErrors[e.key], e.params) : undefined;
}

const CHECKBOX = 'mt-0.5 size-5 shrink-0 cursor-pointer accent-blue-600';

/**
 * Ô bẫy `hp` (contract mục 6.5): input text ngoài màn hình, tabindex -1, autocomplete off, cả khối aria-hidden
 * → không lọt cây a11y, người thật không thấy, không tab tới. Không kiểm soát bằng state (đọc qua ref lúc gửi).
 */
export function Honeypot({ id, label, inputRef }: { id: string; label: string; inputRef: RefObject<HTMLInputElement | null> }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
      <label htmlFor={id}>{label}</label>
      <input ref={inputRef} id={id} name="hp" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

/** Ô đánh dấu một dòng (dùng cho đồng ý và tỉnh/thành). Chữ ≥ 16px để iOS không tự phóng to khi chạm. */
export function CheckboxRow({
  id,
  checked,
  onChange,
  children,
  invalid,
  describedBy,
  inputRef,
  className,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
}) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3 text-body text-ink-900', className)}>
      <input
        ref={inputRef}
        id={id}
        type="checkbox"
        className={CHECKBOX}
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
      />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

/**
 * Đồng ý theo mục đích (Rule 3, AC-C2): mỗi mục đích một checkbox, KHÔNG tick sẵn (state khởi tạo rỗng ở cả server lẫn
 * client), có link chính sách bảo mật. Thông báo xử lý dữ liệu nằm trong vùng cuộn được (focus được bằng bàn phím).
 */
export function ConsentFieldset({
  idPrefix,
  consent,
  copy,
  checked,
  onToggle,
  error,
  draftLabel,
  draftNote,
}: {
  idPrefix: string;
  consent: PublicConsent;
  copy: LeadFormCopy;
  checked: Record<string, boolean>;
  onToggle: (code: string, value: boolean) => void;
  error?: FieldError;
  draftLabel: string | null;
  draftNote: string | null;
}) {
  const errorId = `${idPrefix}-consent-error`;
  const firstRequired = consent.purposes.find((p) => p.required)?.code;
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-3 flex flex-wrap items-center gap-2 text-small font-semibold text-(--surface-heading)">
        {copy.consent.legend}
        {consent.draft && draftLabel ? <Badge variant="draft">{draftLabel}</Badge> : null}
      </legend>
      {consent.draft && draftNote ? <p className="text-small text-slate-600">{draftNote}</p> : null}
      <div
        role="region"
        aria-label={copy.consent.legend}
        tabIndex={0}
        className="max-h-36 overflow-y-auto rounded-sm border border-slate-300 bg-blue-50 px-3 py-2.5 text-small text-slate-600"
      >
        <p>{consent.notice}</p>
      </div>
      <a
        href={consent.policyUrl}
        target="_blank"
        rel="noopener"
        className="self-start text-small font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700"
      >
        {copy.consent.policy}
        <span className="sr-only"> {copy.form.newTab}</span>
      </a>
      {consent.purposes.map((p) => (
        <CheckboxRow
          key={p.code}
          id={`${idPrefix}-consent-${p.code}`}
          checked={checked[p.code] === true}
          onChange={(v) => onToggle(p.code, v)}
          invalid={Boolean(error) && p.code === firstRequired}
          describedBy={error && p.required ? errorId : undefined}
        >
          {p.text}{' '}
          <span className="text-small text-slate-600">({p.required ? copy.consent.requiredTag : copy.consent.optionalTag})</span>
        </CheckboxRow>
      ))}
      {error ? (
        <p id={errorId} className="text-small font-medium text-danger-700">
          {fieldErrorText(copy, error)}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Khung Turnstile có chiều cao đặt sẵn (không CLS): 140px dưới 640px (widget compact), 65px từ 640px (flexible). */
export function TurnstileSlot({
  containerRef,
  status,
  label,
  placeholder,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  status: TurnstileStatus;
  label: string;
  placeholder: string;
}) {
  return (
    <div role="group" aria-label={label} className="relative min-h-[140px] sm:min-h-[65px]">
      {status === 'idle' || status === 'loading' ? (
        <p className="absolute inset-0 flex items-center rounded-sm border border-dashed border-slate-300 px-3 text-small text-slate-600">
          {placeholder}
        </p>
      ) : null}
      <div ref={containerRef} className="relative" />
    </div>
  );
}

export type FormNotice = { tone: 'error' | 'info'; text: string; extra?: ReactNode };

/** Thông báo cấp form (lỗi API, lỗi mạng, điều khoản vừa đổi). Lỗi: role="alert"; thông tin: role="status". */
export function FormNoticeBox({ notice, boxRef }: { notice: FormNotice | null; boxRef: RefObject<HTMLDivElement | null> }) {
  if (!notice) return null;
  const Icon = notice.tone === 'error' ? CircleAlert : Info;
  return (
    <div
      ref={boxRef}
      tabIndex={-1}
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-md border px-4 py-3 text-small text-ink-900 outline-none',
        notice.tone === 'error' ? 'border-danger-700 bg-white' : 'border-blue-600 bg-blue-50',
      )}
    >
      <Icon
        aria-hidden="true"
        size={20}
        strokeWidth={1.75}
        className={cn('mt-0.5 shrink-0', notice.tone === 'error' ? 'text-danger-700' : 'text-blue-600')}
      />
      <div className="min-w-0 flex-1">
        <p>{notice.text}</p>
        {notice.extra}
      </div>
    </div>
  );
}

/**
 * Nút gửi. Trước khi hydrate: `disabled` (không JS thì Enter trong ô không gửi form gốc — tránh lộ dữ liệu lên URL).
 * Đang gửi: aria-disabled + aria-busy (giữ focus trên nút, chặn bấm lại trong handler).
 */
export function SubmitButton({ hydrated, busy, label, busyLabel }: { hydrated: boolean; busy: boolean; label: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={!hydrated}
      aria-disabled={busy ? true : undefined}
      aria-busy={busy ? true : undefined}
      className={buttonClasses({ variant: 'primary', size: 'lg', className: 'w-full sm:w-auto sm:self-start' })}
    >
      {busy ? busyLabel : label}
    </button>
  );
}

/** Gọi · Zalo dưới thông báo lỗi 429/500/mạng (Zalo chỉ khi link đã duyệt hoặc ở bản xem trước). */
export function ContactLinks({ contact, copy, className }: { contact: LeadContact; copy: LeadFormCopy; className?: string }) {
  return (
    <p className={cn('mt-2 flex flex-wrap gap-x-5 gap-y-1', className)}>
      <a href={`tel:${contact.tel}`} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-blue-600 tabular">
        <Phone aria-hidden="true" size={16} strokeWidth={1.75} />
        {fmt(copy.form.callNow, { phone: contact.phoneDisplay })}
      </a>
      {contact.zalo ? (
        <a
          href={contact.zalo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-blue-600"
        >
          <MessageCircle aria-hidden="true" size={16} strokeWidth={1.75} />
          {copy.form.zalo}
          <span className="sr-only"> {copy.form.newTab}</span>
          {contact.zalo.draftLabel ? <Badge variant="draft">{contact.zalo.draftLabel}</Badge> : null}
        </a>
      ) : null}
    </p>
  );
}

/** Phần thêm dưới thông báo lỗi: kênh Gọi/Zalo khi 429/500/mạng/captcha; gợi ý mở trình duyệt khi ở webview Zalo/FB. */
export function NoticeExtra({
  notice,
  contact,
  copy,
}: {
  notice: { code: string; webview?: boolean };
  contact: LeadContact;
  copy: LeadFormCopy;
}) {
  const withContact = ['RATE_LIMITED', 'INTERNAL_ERROR', 'NETWORK_ERROR', 'CAPTCHA_PENDING', 'CAPTCHA_FAILED'].includes(notice.code);
  if (!withContact) return null;
  return (
    <>
      {notice.webview ? (
        <p className="mt-2">
          {copy.form.webviewHint}{' '}
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener"
            className="font-semibold text-blue-600 underline underline-offset-4"
          >
            {copy.form.webviewOpen}
            <span className="sr-only"> {copy.form.newTab}</span>
          </a>
        </p>
      ) : null}
      <ContactLinks contact={contact} copy={copy} />
    </>
  );
}

/**
 * Màn hình cảm ơn thay form TẠI CHỖ (Rule 11): role="status", focus tiêu đề, không animate. Khối giữ chiều cao của form
 * (minHeight do form truyền) để CLS không tăng. Thời gian gọi lại chỉ có khi server truyền xuống (SLA đã duyệt, hoặc bản
 * xem trước kèm nhãn Nháp).
 */
export function ThankYou({
  title,
  reference,
  copy,
  callback,
  steps,
  contact,
  draftLabel,
  minHeight,
}: {
  title: string;
  reference: string;
  copy: LeadFormCopy;
  callback: { text: string; draft: boolean } | null;
  steps: string[] | null;
  contact: LeadContact;
  draftLabel: string | null;
  minHeight: number | null;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <div role="status" className="flex flex-col gap-5" style={minHeight ? { minHeight } : undefined}>
      <div className="flex items-start gap-3">
        <CircleCheck aria-hidden="true" size={32} strokeWidth={1.75} className="mt-0.5 shrink-0 text-success-700" />
        <h3 ref={headingRef} tabIndex={-1} className="text-h3 text-(--surface-heading) outline-none">
          {title}
        </h3>
      </div>
      <div>
        <p className="text-body text-ink-900">
          {copy.thanks.reference}:{' '}
          <strong className="font-display text-h3 tracking-wide tabular text-navy-900">{reference}</strong>
        </p>
        <p className="mt-1 text-small text-slate-600">{copy.thanks.referenceHint}</p>
      </div>
      {callback ? (
        <p className="text-body text-ink-900">
          {callback.text} {callback.draft && draftLabel ? <Badge variant="draft">{draftLabel}</Badge> : null}
        </p>
      ) : null}
      {steps && steps.length > 0 ? (
        <div>
          <p className="text-small font-semibold text-(--surface-heading)">{copy.thanks.stepsTitle}</p>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-body text-ink-900">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill bg-blue-50 text-small font-semibold tabular text-blue-600">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <div className="border-t border-slate-300 pt-4 text-small text-slate-600">
        <p>{fmt(copy.thanks.urgent, { phone: contact.phoneDisplay })}</p>
        <ContactLinks contact={contact} copy={copy} className="mt-1" />
      </div>
    </div>
  );
}
