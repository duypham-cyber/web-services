import { ArrowRight } from 'lucide-react';
import type { AnchorHTMLAttributes, ComponentProps, ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import type { AppHref } from './Button';

type CommonProps = {
  /** inline = gạch chân (trong đoạn văn) · arrow = "Xem chi tiết →" (đứng riêng, gạch chân khi hover) */
  variant?: 'inline' | 'arrow';
  className?: string;
  children: ReactNode;
};

type InternalProps = CommonProps &
  Omit<ComponentProps<typeof Link>, 'href' | 'className' | 'children'> & { href: AppHref; externalHref?: never };
type ExternalProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'> & { externalHref: string; href?: never };

const VARIANT = {
  inline:
    'text-(--surface-link) underline decoration-1 underline-offset-[3px] hover:text-(--surface-link-hover) hover:decoration-2',
  arrow:
    'inline-flex items-center gap-1.5 font-semibold text-(--surface-link) no-underline underline-offset-[3px] hover:underline hover:text-(--surface-link-hover)',
} as const;

/** Link chữ. Màu theo tông bề mặt (blue-600 trên nền sáng, blue-100 trên dải tối blue-600 — D-32). */
export function TextLink(props: InternalProps | ExternalProps) {
  const { variant = 'inline', className, children } = props;
  const classes = cn(VARIANT[variant], className);
  const body = (
    <>
      {children}
      {variant === 'arrow' ? <ArrowRight aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0" /> : null}
    </>
  );
  if ('externalHref' in props && props.externalHref !== undefined) {
    const { variant: _v, className: _c, children: _ch, externalHref, ...rest } = props as ExternalProps;
    return (
      <a href={externalHref} className={classes} {...rest}>
        {body}
      </a>
    );
  }
  const { variant: _v, className: _c, children: _ch, href, ...rest } = props as InternalProps;
  return (
    <Link href={href} className={classes} {...rest}>
      {body}
    </Link>
  );
}
