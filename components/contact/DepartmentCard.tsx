import { Check, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Heading } from '@/components/ui/Heading';
import { cn } from '@/lib/cn';

type DepartmentCardProps = {
  /** Neo trong trang: kinh-doanh | tuyen-tho | cskh (đích của QUOTE_HREF, link footer, trang hỗ trợ). */
  id: string;
  icon: LucideIcon;
  title: string;
  audience: string;
  handlesLabel: string;
  handles: readonly string[];
  /** Nút liên hệ (ContactButtons). */
  actions: ReactNode;
  /** Ghi chú / link phụ dưới nút. */
  footer?: ReactNode;
  /** Thẻ được nhấn (B2B — đích nút "Nhận báo giá" ở header). */
  featured?: boolean;
};

/**
 * Thẻ một bộ phận trên /lien-he (contracts/site-shell-p0.md T-CONTACT). Mỗi thẻ là một vùng có H2 riêng và id neo.
 * Hotline/email KHÔNG animate (không bọc Rise/StaggerGrid).
 */
export function DepartmentCard({ id, icon: Icon, title, audience, handlesLabel, handles, actions, footer, featured }: DepartmentCardProps) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      data-tone="light"
      className={cn(
        'flex h-full flex-col rounded-xl border bg-white p-6 shadow-1 md:p-8',
        featured ? 'border-blue-600 shadow-2' : 'border-slate-300',
      )}
    >
      <span
        className={cn(
          'inline-flex size-12 items-center justify-center rounded-md',
          featured ? 'bg-orange-500 text-navy-900' : 'bg-blue-100 text-blue-600',
        )}
      >
        <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
      </span>
      <Heading level={2} size="h3" id={titleId} className="mt-6">
        {title}
      </Heading>
      <p className="mt-2 text-body text-(--surface-muted)">{audience}</p>
      <p className="mt-6 text-small font-semibold text-(--surface-fg)">{handlesLabel}</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {handles.map((item) => (
          <li key={item} className="flex gap-2.5 text-body text-(--surface-fg)">
            <Check aria-hidden="true" size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-success-700" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-8">{actions}</div>
      {footer ? <div className="mt-5 flex flex-col gap-3">{footer}</div> : null}
    </section>
  );
}
