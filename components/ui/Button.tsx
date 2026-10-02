import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

/** href nội bộ có kiểu chặt theo i18n/routing.ts: '/doi-tac-tho' hoặc { pathname: '/dich-vu/[slug]', params: { slug } } */
export type AppHref = ComponentProps<typeof Link>['href'];

export type ButtonVariant = 'primary' | 'blue' | 'ghost' | 'on-dark';
export type ButtonSize = 'sm' | 'md' | 'lg';

type CommonProps = {
  /**
   * primary = nền orange-500, chữ navy-900, viền 1px orange-700 (CTA chính, tối đa 1 mỗi màn hình)
   * blue    = nền blue-600, chữ trắng
   * ghost   = trong suốt, chữ + viền blue-600 (nền sáng)
   * on-dark = trong suốt, chữ + viền trắng (nền navy / vùng phim)
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type AsInternalLink = CommonProps &
  Omit<ComponentProps<typeof Link>, 'href' | 'className' | 'children'> & {
    /** Link nội bộ qua next-intl (tự đúng ngôn ngữ và slug). */
    href: AppHref;
    externalHref?: never;
  };

type AsExternalLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'> & {
    /** tel:, mailto:, https://..., hoặc neo trong trang "#id". */
    externalHref: string;
    href?: never;
  };

type AsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: never;
    externalHref?: never;
  };

export type ButtonProps = AsInternalLink | AsExternalLink | AsButton;

const BASE =
  'inline-flex items-center justify-center rounded-pill border text-center font-semibold leading-tight ' +
  'select-none no-underline transition-[background-color,border-color,color,transform] duration-(--dur-base) ease-glide ' +
  'active:scale-[0.98] aria-disabled:pointer-events-none aria-disabled:opacity-50 disabled:pointer-events-none disabled:opacity-50';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'border-orange-700 bg-orange-500 text-navy-900 hover:bg-orange-400',
  blue: 'border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700',
  ghost: 'border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50',
  'on-dark': 'border-white bg-transparent text-white hover:bg-white hover:text-navy-900',
};

// min-h thay cho h cố định: nhãn dài được xuống dòng thay vì tràn ngang trên màn hẹp
const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-9 gap-1.5 px-4 py-1.5 text-small',
  md: 'min-h-11 gap-2 px-5 py-2.5 text-body',
  lg: 'min-h-13 gap-2.5 px-7 py-3 text-body',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: Pick<CommonProps, 'variant' | 'size' | 'fullWidth' | 'className'>): string {
  return cn(BASE, VARIANT[variant], SIZE[size], fullWidth && 'w-full', className);
}

/**
 * Nút/Link dạng nút. Ba cách dùng:
 *   <Button href="/doi-tac-tho">Đăng ký làm đối tác thợ</Button>              (link nội bộ, next-intl)
 *   <Button externalHref="tel:+84902808049" variant="blue">Gọi</Button>        (tel/mailto/https/#id)
 *   <Button type="submit" variant="blue">Gửi</Button>                          (button thật)
 */
export function Button(props: ButtonProps) {
  const { variant, size, iconStart, iconEnd, fullWidth, className, children } = props;
  const classes = buttonClasses({ variant, size, fullWidth, className });
  const content = (
    <>
      {iconStart}
      <span>{children}</span>
      {iconEnd}
    </>
  );

  if ('href' in props && props.href !== undefined) {
    const { variant: _v, size: _s, iconStart: _is, iconEnd: _ie, fullWidth: _f, className: _c, children: _ch, href, ...rest } =
      props as AsInternalLink;
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if ('externalHref' in props && props.externalHref !== undefined) {
    const {
      variant: _v,
      size: _s,
      iconStart: _is,
      iconEnd: _ie,
      fullWidth: _f,
      className: _c,
      children: _ch,
      externalHref,
      ...rest
    } = props as AsExternalLink;
    return (
      <a href={externalHref} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  const {
    variant: _v,
    size: _s,
    iconStart: _is,
    iconEnd: _ie,
    fullWidth: _f,
    className: _c,
    children: _ch,
    type = 'button',
    ...rest
  } = props as AsButton;
  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
