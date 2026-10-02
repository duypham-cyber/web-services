import { CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { DraftBadge } from '@/components/ui/DraftBadge';
import type { ClaimId } from '@/content/claims';
import type { Locale } from '@/i18n/routing';
import { claim } from '@/lib/claims';
import { cn } from '@/lib/cn';
import { isDraftPreview } from '@/lib/env';

/**
 * Hiển thị nội dung CHƯA DUYỆT theo luật R-CLAIM (contracts/film-home.md mục 5, site-shell-p0 AC-DATA-2):
 *   - production: claim nháp → null, phần chứa tự thu gọn (không để khoảng trống);
 *   - DRAFT_PREVIEW=1: hiện kèm nhãn "Nháp".
 */

/** Các claim đang được phép hiện (đã duyệt, hoặc nháp ở bản xem trước). */
export function visibleClaims(ids: readonly ClaimId[], locale: Locale) {
  return ids.flatMap((id) => {
    const c = claim(id, locale);
    return c ? [{ id, ...c }] : [];
  });
}

/** Một câu khẳng định nội tuyến (vd câu bổ sung trong câu trả lời FAQ). null khi không được hiện. */
export function ClaimText({ id, locale, className }: { id: ClaimId; locale: Locale; className?: string }) {
  const c = claim(id, locale);
  if (!c) return null;
  return (
    <span className={cn('inline', className)}>
      {c.text}
      {c.draft ? <DraftBadge className="ml-2" /> : null}
    </span>
  );
}

type ClaimListProps = {
  ids: readonly ClaimId[];
  locale: Locale;
  className?: string;
  /** light = trên nền sáng · navy = trên nền tối */
  tone?: 'light' | 'navy';
  /** Kiểu chữ: small cho hero, body cho danh sách trong thân trang. */
  size?: 'small' | 'body';
};

/** Danh sách câu khẳng định có dấu check. Không còn câu nào được hiện → không render gì. */
export function ClaimList({ ids, locale, className, tone = 'light', size = 'small' }: ClaimListProps) {
  const items = visibleClaims(ids, locale);
  if (items.length === 0) return null;
  return (
    <ul className={cn('flex flex-col gap-2.5', className)}>
      {items.map((c) => (
        <li key={c.id} className={cn('flex items-start gap-2.5', size === 'small' ? 'text-small' : 'text-body')}>
          <CircleCheck
            aria-hidden="true"
            size={size === 'small' ? 18 : 20}
            strokeWidth={1.75}
            className={cn('mt-0.5 shrink-0', tone === 'navy' ? 'text-orange-200' : 'text-blue-600')}
          />
          <span className="text-(--surface-fg)">
            {c.text}
            {c.draft ? <DraftBadge className="ml-2" /> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Nhóm câu khẳng định có tiêu đề nhỏ (H3). Không còn câu nào được hiện → không render (kể cả tiêu đề). */
export function ClaimGroup({
  title,
  ids,
  locale,
  tone = 'light',
  className,
}: {
  title: string;
  ids: readonly ClaimId[];
  locale: Locale;
  tone?: 'light' | 'navy';
  className?: string;
}) {
  if (visibleClaims(ids, locale).length === 0) return null;
  return (
    <div className={cn('max-w-text', className)}>
      <h3 className="text-body font-semibold text-(--surface-heading)">{title}</h3>
      <ClaimList ids={ids} locale={locale} tone={tone} size="body" className="mt-3" />
    </div>
  );
}

/** Ghi chú một dòng CHỈ ở bản xem trước (kèm nhãn Nháp). Production: null. */
export function PreviewNote({ children, className }: { children: ReactNode; className?: string }) {
  if (!isDraftPreview()) return null;
  return (
    <p className={cn('flex flex-wrap items-center gap-2 text-small text-(--surface-muted)', className)}>
      <DraftBadge />
      <span>{children}</span>
    </p>
  );
}

type PendingPanelProps = {
  title: string;
  intro: string;
  items: string[];
  className?: string;
};

/**
 * Khung "Nội dung chờ xác nhận" cuối trang — CHỈ ở bản xem trước, để anh Duy thấy chỗ còn giả định.
 * Chữ lấy từ messages theo ngôn ngữ (bản /en không lẫn tiếng Việt). Production: null.
 */
export function PendingPanel({ title, intro, items, className }: PendingPanelProps) {
  if (!isDraftPreview() || items.length === 0) return null;
  return (
    <aside
      aria-label={title}
      data-tone="light"
      className={cn('rounded-lg border-2 border-dashed border-warning-text bg-orange-50 p-6 md:p-8', className)}
    >
      <p className="flex flex-wrap items-center gap-3 text-h3 font-semibold text-navy-900">
        {title}
        <DraftBadge />
      </p>
      <p className="mt-2 text-small text-slate-600">{intro}</p>
      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-small text-ink-900 marker:text-warning-text">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
