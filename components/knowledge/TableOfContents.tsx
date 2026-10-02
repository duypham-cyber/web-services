import { ChevronDown } from 'lucide-react';
import type { OutlineSection } from '@/content/articles/all';
import { cn } from '@/lib/cn';

type TocProps = {
  outline: OutlineSection[];
  /** Nhãn của <nav> cho trình đọc màn hình. */
  label: string;
  /** Tiêu đề hiển thị (sidebar) hoặc chữ trên nút mở (inline). */
  title: string;
  className?: string;
};

function TocList({ outline, compact }: { outline: OutlineSection[]; compact?: boolean }) {
  return (
    <ol className={cn('space-y-0.5 border-l border-slate-300', compact && 'mt-1')}>
      {outline.map((entry) => (
        <li key={entry.id}>
          <a
            href={`#${entry.id}`}
            className="-ml-px block border-l-2 border-transparent py-2 pl-4 text-small font-medium text-(--surface-fg) no-underline hover:border-blue-600 hover:text-blue-600"
          >
            {entry.title}
          </a>
          {entry.steps.length > 0 ? (
            <ol className="mb-2 space-y-0.5">
              {entry.steps.map((step, i) => (
                <li key={step.id}>
                  <a
                    href={`#${step.id}`}
                    className="-ml-px flex gap-2 border-l-2 border-transparent py-1.5 pl-6 text-small text-slate-600 no-underline hover:border-blue-600 hover:text-blue-600"
                  >
                    <span aria-hidden="true" className="tabular text-blue-600">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{step.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/**
 * Mục lục dính bên trái (≥ 1024px). Chỉ HTML + CSS (sticky), không JS. Danh sách dài thì cuộn trong khung.
 * Đặt trong cột <aside> của lưới bài viết; cột phải cao bằng thân bài để sticky hoạt động.
 */
export function TocSidebar({ outline, label, title, className }: TocProps) {
  if (outline.length === 0) return null;
  return (
    <nav
      aria-label={label}
      className={cn(
        'sticky top-[calc(var(--header-h)+2rem)] max-h-[calc(100svh-var(--header-h)-4rem)] overflow-y-auto pb-4',
        className,
      )}
    >
      <p className="eyebrow text-(--surface-accent)">{title}</p>
      <div className="mt-4">
        <TocList outline={outline} />
      </div>
    </nav>
  );
}

/** Mục lục gập (< 1024px): <details> gốc của trình duyệt, không JS, đóng mặc định. */
export function TocInline({ outline, label, title, className }: TocProps) {
  if (outline.length === 0) return null;
  return (
    <details className={cn('group rounded-lg border border-slate-300 bg-white', className)}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 font-semibold text-(--surface-heading) [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          aria-hidden="true"
          size={20}
          strokeWidth={1.75}
          className="shrink-0 text-blue-600 transition-transform duration-(--dur-fast) group-open:rotate-180"
        />
      </summary>
      <nav aria-label={label} className="border-t border-slate-300 px-4 py-3">
        <TocList outline={outline} compact />
      </nav>
    </details>
  );
}
