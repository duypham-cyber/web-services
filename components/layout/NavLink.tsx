'use client';

import type { ComponentProps } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

type NavLinkProps = Omit<ComponentProps<typeof Link>, 'className'> & {
  className?: string;
  /** exact: chỉ đúng trang · prefix: cả trang con (vd /dich-vu và /dich-vu/[slug]) */
  match?: 'exact' | 'prefix';
};

/** Link điều hướng có aria-current="page" khi đang ở trang đó (so theo pathname nội bộ của next-intl). */
export function NavLink({ href, match = 'prefix', className, children, ...rest }: NavLinkProps) {
  const pathname = usePathname();
  const target = typeof href === 'string' ? href : href.pathname;
  const active = match === 'exact' ? pathname === target : pathname === target || pathname.startsWith(`${target}/`);
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={cn(className)} {...rest}>
      {children}
    </Link>
  );
}
