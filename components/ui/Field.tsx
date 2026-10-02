import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * CHỈ PHẦN TRÌNH BÀY của trường nhập liệu. Form gửi lead (B2B, thợ, bảo hành) là phần động:
 * KHÔNG code logic gửi/validate/API khi contracts/<feature>.md chưa có STATUS: APPROVED (CLAUDE.md).
 *
 *   <Field id="phone" label="Số điện thoại" hint="Ví dụ 0902 808 049" error={err} required requiredLabel="bắt buộc">
 *     {(control) => <TextInput type="tel" autoComplete="tel" {...control} />}
 *   </Field>
 */
export type FieldControlProps = {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  required?: boolean;
};

type FieldProps = {
  id: string;
  /** Nhãn thật (<label for>), không dùng placeholder thay nhãn. */
  label: string;
  hint?: string;
  /** Có lỗi → viền đỏ + dòng lỗi (role="alert" chỉ khi lỗi xuất hiện sau tương tác). */
  error?: string;
  required?: boolean;
  /** Chữ nhỏ cạnh nhãn, vd "bắt buộc" / "required" (từ messages). */
  requiredLabel?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

export function Field({ id, label, hint, error, required, requiredLabel, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-small font-semibold text-(--surface-heading)">
        {label}
        {required && requiredLabel ? <span className="ml-1 font-normal text-(--surface-muted)">({requiredLabel})</span> : null}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
      {hint ? (
        <p id={hintId} className="text-small text-(--surface-muted)">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-small font-medium text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL =
  'w-full rounded-sm border border-slate-500 bg-white px-3 text-body text-ink-900 placeholder:text-slate-500 ' +
  'transition-[border-color,box-shadow] duration-(--dur-fast) ease-glide hover:border-slate-600 ' +
  'aria-invalid:border-danger-700 aria-invalid:border-2 disabled:bg-blue-50 disabled:text-slate-600';

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, 'min-h-11 py-2', className)} {...rest} />;
}

export function TextArea({ className, rows = 4, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(CONTROL, 'py-2.5', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, 'min-h-11 py-2', className)} {...rest}>
      {children}
    </select>
  );
}
