import { ChevronRight } from 'lucide-react';
import type { AppHref } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export type Crumb = {
  label: string;
  /** Trang hiện tại (mục cuối) không có href. */
  href?: AppHref;
};

type BreadcrumbProps = {
  /** Tên vùng điều hướng cho trình đọc màn hình, vd "Đường dẫn" / "Breadcrumb". */
  label: string;
  items: Crumb[];
  className?: string;
};

/**
 * Breadcrumb hiển thị cho trang con B2B (contracts/site-shell-p0.md mục 1.3: T-SOLUTION, T-HUB, T-SERVICE, T-PRICING).
 * <nav> + <ol>, mục cuối aria-current="page". Màu theo tông bề mặt (link blue-600 trên nền sáng).
 * JSON-LD BreadcrumbList KHÔNG sinh ở đây (khu vực agent SEO) — tránh trùng lặp.
 */
export function Breadcrumb({ label, items, className }: BreadcrumbProps) {
  return (
    <nav aria-label={label} className={cn('text-small', className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-(--surface-muted)">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${item.label}`} className="inline-flex min-w-0 items-center gap-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="inline-flex min-h-8 items-center rounded-sm px-0.5 font-medium text-(--surface-link) underline-offset-4 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="inline-flex min-h-8 items-center px-0.5 text-(--surface-fg)">
                  {item.label}
                </span>
              )}
              {!last ? <ChevronRight aria-hidden="true" size={14} strokeWidth={1.75} className="shrink-0 opacity-70" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
