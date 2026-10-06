import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'ghost' | 'on-dark' | 'solid';

type CommonProps = {
  /** BẮT BUỘC: tên đọc cho trình đọc màn hình (nút chỉ có icon). */
  label: string;
  variant?: Variant;
  className?: string;
  /** Icon lucide-react, nét 1.5px, cỡ 20–24 (docs/03 mục 11.3). */
  children: ReactNode;
};

type AsButton = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'aria-label'> & {
  externalHref?: never;
};
type AsAnchor = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'aria-label' | 'href'> & {
  /** tel:, mailto:, https:// */
  externalHref: string;
};

const BASE =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-pill border transition-[background-color,color,border-color] ' +
  'duration-(--dur-base) ease-glide';

const VARIANT: Record<Variant, string> = {
  ghost: 'border-transparent bg-transparent text-(--surface-link) hover:bg-blue-50',
  'on-dark': 'border-transparent bg-transparent text-white hover:bg-white hover:text-blue-600',
  solid: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
};

/** Nút vuông 44×44 (vùng chạm tối thiểu) chỉ có icon. */
export function IconButton(props: AsButton | AsAnchor) {
  const { label, variant = 'ghost', className, children } = props;
  const classes = cn(BASE, VARIANT[variant], className);
  if ('externalHref' in props && props.externalHref !== undefined) {
    const { label: _l, variant: _v, className: _c, children: _ch, externalHref, ...rest } = props as AsAnchor;
    return (
      <a href={externalHref} aria-label={label} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  const { label: _l, variant: _v, className: _c, children: _ch, type = 'button', ...rest } = props as AsButton;
  return (
    <button type={type} aria-label={label} className={classes} {...rest}>
      {children}
    </button>
  );
}
