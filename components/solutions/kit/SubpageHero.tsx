import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { cn } from '@/lib/cn';

type SubpageHeroProps = {
  /**
   * Breadcrumb: <Breadcrumb label items /> của kit (hiện tại). Khi components/seo/Breadcrumbs (agent SEO, kèm
   * JSON-LD BreadcrumbList) ổn định, trang chỉ cần truyền <Breadcrumbs routeKey locale /> vào đây.
   */
  breadcrumb: ReactNode;
  eyebrow: string;
  /** H1 DUY NHẤT của trang. */
  title: string;
  lead: string;
  /** Nút hành động (Button) — tối đa 1 nút cam mỗi màn hình. */
  actions?: ReactNode;
  /** Câu khẳng định ngắn (ClaimList) — tự ẩn ở production khi chưa duyệt. */
  highlights?: ReactNode;
  /** Khung ảnh/minh họa bên phải (MediaFrame). Không có → hero một cột gọn (vd /bang-gia). */
  media?: ReactNode;
  /** Nội dung phụ dưới khối chữ (vd dải thông số của bảng giá). */
  footer?: ReactNode;
  className?: string;
};

/**
 * Hero trang con B2B (T-SOLUTION, T-HUB, T-SERVICE, T-PRICING): breadcrumb → eyebrow → H1 → lead → CTA.
 * KHÔNG motion (nội dung màn đầu của trang con, CLAUDE.md "Motion ngoài phim"). H1 là phần tử LCP, hiện ngay.
 * Nền blue-50 tách khỏi header trắng; minh họa nằm trong khung cố định tỉ lệ nên không gây CLS.
 */
export function SubpageHero({
  breadcrumb,
  eyebrow,
  title,
  lead,
  actions,
  highlights,
  media,
  footer,
  className,
}: SubpageHeroProps) {
  return (
    <Section tone="blue-50" spacing="none" aria-labelledby="page-title" className={cn('pb-16 pt-4 md:pb-20 lg:pb-24 lg:pt-6', className)}>
      {breadcrumb}
      <div
        className={cn(
          'mt-8 grid gap-10 lg:mt-12 lg:items-center lg:gap-16',
          media ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]' : '',
        )}
      >
        <div className="min-w-0">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading level={1} id="page-title" className="mt-3 max-w-[22ch]">
            {title}
          </Heading>
          <p className="mt-5 max-w-[58ch] text-lead text-(--surface-muted)">{lead}</p>
          {actions ? <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div> : null}
          {highlights ? <div className="mt-8">{highlights}</div> : null}
        </div>
        {media ? <div className="min-w-0">{media}</div> : null}
      </div>
      {footer ? <div className="mt-10">{footer}</div> : null}
    </Section>
  );
}
