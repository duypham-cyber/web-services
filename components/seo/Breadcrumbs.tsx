import { ChevronRight } from 'lucide-react';
import type { ComponentProps } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { breadcrumbListJsonLd } from '@/lib/jsonld';
import type { RouteKey } from '@/lib/routes';
import { breadcrumbTrail } from '@/lib/seo';
import { JsonLd } from './JsonLd';

type BreadcrumbsProps = {
  routeKey: RouteKey;
  locale: Locale;
  className?: string;
  /** Mặc định true: kèm JSON-LD BreadcrumbList (AC-LD-1). Tắt khi trang đã tự gắn. */
  jsonLd?: boolean;
};

/**
 * Breadcrumb hiển thị + JSON-LD BreadcrumbList từ cùng một nguồn (lib/seo.ts breadcrumbTrail, nhãn ở content/seo.ts).
 * Server Component. Màu theo tông bề mặt (đặt trong <Section tone="...">). Link là <Link> của next-intl với đường dẫn
 * nội bộ (tự đúng ngôn ngữ và slug).
 *
 *   <Breadcrumbs routeKey="pricing" locale={locale} />
 */
export async function Breadcrumbs({ routeKey, locale, className, jsonLd = true }: BreadcrumbsProps) {
  const t = await getTranslations({ locale, namespace: 'knowledge' });
  const trail = breadcrumbTrail(routeKey, locale);
  return (
    <>
      <nav aria-label={t('breadcrumb.label')} className={cn('text-small', className)}>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-(--surface-muted)">
          {trail.map((crumb, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={crumb.path} className="inline-flex min-w-0 items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="line-clamp-1 font-medium text-(--surface-fg)">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={crumb.href as ComponentProps<typeof Link>['href']}
                      className="inline-flex min-h-11 items-center rounded-sm text-(--surface-link) underline-offset-[3px] hover:underline"
                    >
                      {crumb.name}
                    </Link>
                    <ChevronRight aria-hidden="true" size={16} strokeWidth={1.5} className="shrink-0 opacity-70" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {jsonLd ? <JsonLd data={breadcrumbListJsonLd(trail)} /> : null}
    </>
  );
}
