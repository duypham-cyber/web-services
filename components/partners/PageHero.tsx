import type { ReactNode } from 'react';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { cn } from '@/lib/cn';

type PageHeroProps = {
  /**
   * Breadcrumb hiển thị + JSON-LD BreadcrumbList: <Breadcrumbs routeKey locale /> của agent SEO
   * (components/seo/Breadcrumbs.tsx, nhãn ở content/seo.ts) — cùng vị trí với hero trang con B2B.
   */
  breadcrumb?: ReactNode;
  eyebrow: string;
  /** H1 DUY NHẤT của trang. */
  title: string;
  lead: string;
  /** Nút hành động (Button), xếp hàng ngang, tự xuống dòng. */
  actions?: ReactNode;
  /** Dòng phụ dưới nút (chữ nhỏ). */
  footnote?: ReactNode;
  /** Cột phải từ 1024px (ảnh, minh họa, thẻ hotline). Mobile: nằm dưới chữ. */
  aside?: ReactNode;
  /** Chữ hẹp (trang pháp lý) hay rộng. */
  titleClassName?: string;
  children?: ReactNode;
};

/**
 * Hero trang con khu vực partner (docs/03 mục 13.5): nền blue-50, breadcrumb → eyebrow → H1 → lead → nút, cột phải là hình.
 * Không animate (nội dung màn đầu của trang con, CLAUDE.md "Motion ngoài phim"). Tia chớp trang trí nằm trong
 * wrapper overflow-clip nên không gây tràn ngang.
 */
export function PageHero({ breadcrumb, eyebrow, title, lead, actions, footnote, aside, titleClassName, children }: PageHeroProps) {
  return (
    <section data-tone="blue-50" aria-labelledby="page-title" className="relative overflow-clip bg-blue-50">
      <BoltMark />
      <Container className="relative pb-14 pt-4 md:pb-20 lg:pb-24 lg:pt-6">
        {breadcrumb}
        <div
          className={cn(
            'mt-8 lg:mt-12',
            aside ? 'grid items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16' : undefined,
          )}
        >
          <div className="min-w-0">
            <Eyebrow>{eyebrow}</Eyebrow>
            <Heading level={1} id="page-title" className={cn('mt-3 max-w-[22ch]', titleClassName)}>
              {title}
            </Heading>
            <p className="mt-5 max-w-[62ch] text-lead text-(--surface-muted)">{lead}</p>
            {actions ? <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div> : null}
            {footnote ? <div className="mt-6 max-w-[62ch] text-small text-(--surface-muted)">{footnote}</div> : null}
            {children}
          </div>
          {aside ? <div className="min-w-0">{aside}</div> : null}
        </div>
      </Container>
    </section>
  );
}

/** Tia chớp nét mảnh (thương hiệu "Tia Chớp Xanh"), trang trí, aria-hidden. */
function BoltMark() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 240 400"
      className="pointer-events-none absolute -right-24 -top-10 h-[130%] w-auto text-blue-100 md:-right-10 lg:right-[4%]"
    >
      <path
        d="M150 4 L34 228 H112 L82 396 L214 150 H132 L176 4 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <path d="M150 4 L34 228 H112 L82 396 L214 150 H132 L176 4 Z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}
