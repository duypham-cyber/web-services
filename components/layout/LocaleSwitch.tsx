'use client';

import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { Fragment } from 'react';
import { usePathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { findRoute, localizePath } from '@/lib/routes';

type LocaleSwitchProps = {
  labels: { group: string } & Record<Locale, { short: string; name: string }>;
  className?: string;
};

/**
 * VI | EN — chuyển sang ĐÚNG trang tương ứng (slug VI ≠ slug EN, tra lib/routes.ts), không về trang chủ.
 * Dùng <a> thường (đổi ngôn ngữ = đổi root layout → tải lại trang là đúng hành vi).
 * Trang không có trong lib/routes (vd 404) → về trang chủ của ngôn ngữ kia.
 */
export function LocaleSwitch({ labels, className }: LocaleSwitchProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams<{ slug?: string | string[] }>();
  const slug = typeof params.slug === 'string' ? params.slug : undefined;
  const route = findRoute(pathname, slug, locale);
  const hrefFor = (target: Locale) => (route ? route.paths[target] : localizePath('/', target));

  return (
    <div role="group" aria-label={labels.group} className={cn('flex items-center gap-1 text-small font-semibold', className)}>
      {locales.map((l, i) => (
        <Fragment key={l}>
          {i > 0 ? (
            <span aria-hidden="true" className="opacity-50">
              |
            </span>
          ) : null}
          {l === locale ? (
            <span aria-current="true" lang={l} className="rounded-sm px-1.5 py-1 underline decoration-2 underline-offset-4">
              {labels[l].short}
              <span className="sr-only"> ({labels[l].name})</span>
            </span>
          ) : (
            <a
              href={hrefFor(l)}
              hrefLang={l}
              lang={l}
              className="rounded-sm px-1.5 py-1 no-underline opacity-80 transition-opacity duration-(--dur-fast) hover:opacity-100 hover:underline hover:underline-offset-4"
            >
              {labels[l].short}
              <span className="sr-only"> ({labels[l].name})</span>
            </a>
          )}
        </Fragment>
      ))}
    </div>
  );
}
