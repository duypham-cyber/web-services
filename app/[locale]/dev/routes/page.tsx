import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { devPagesEnabled } from '@/lib/env';
import { OWNERS, ROUTES } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/dev/routes'>): Promise<Metadata> {
  if (!devPagesEnabled()) notFound();
  const locale = await resolveLocale(params);
  return buildMetadata({
    routeKey: 'dev.routes',
    locale,
    title: 'Danh mục route (nội bộ)',
    description: 'Danh sách route VI ↔ EN, ưu tiên và khu vực phụ trách, sinh từ lib/routes.ts. Không index.',
  });
}

/**
 * Danh mục route sinh từ lib/routes.ts (nguồn duy nhất). scripts/shot.mjs đọc bảng này qua data-attribute
 * (data-route-key, data-path-vi, data-path-en) để biết cần chụp những trang nào.
 */
export default async function DevRoutesPage({ params }: PageProps<'/[locale]/dev/routes'>) {
  if (!devPagesEnabled()) notFound();
  await resolveLocale(params);
  return (
    <>
      <Section tone="blue-50" aria-labelledby="dev-routes-title">
        <Eyebrow>Nội bộ · noindex</Eyebrow>
        <Heading level={1} id="dev-routes-title" className="mt-3">
          Danh mục route
        </Heading>
        <p className="mt-5 max-w-text text-lead text-(--surface-muted)">
          {ROUTES.length} route × 2 ngôn ngữ, sinh từ lib/routes.ts và i18n/routing.ts. Bấm để mở từng trang.
        </p>
      </Section>
      <Section spacing="compact" aria-label="Bảng route">
        <div className="overflow-x-auto rounded-md border border-slate-300">
          <table className="w-full min-w-[56rem] border-collapse text-left text-small" data-routes-table="">
            <thead className="bg-blue-50 text-navy-900">
              <tr>
                <th className="p-3">Khóa</th>
                <th className="p-3">VI</th>
                <th className="p-3">EN</th>
                <th className="p-3">Ưu tiên</th>
                <th className="p-3">Phụ trách</th>
              </tr>
            </thead>
            <tbody>
              {ROUTES.map((r) => (
                <tr
                  key={r.key}
                  data-route-key={r.key}
                  data-path-vi={r.paths.vi}
                  data-path-en={r.paths.en}
                  data-priority={r.priority}
                  data-owner={r.owner}
                  className="border-t border-slate-300 align-top"
                >
                  <td className="p-3 font-semibold text-ink-900">{r.key}</td>
                  <td className="p-3">
                    <a href={r.paths.vi} className="text-blue-600 underline underline-offset-2">
                      {r.paths.vi}
                    </a>
                  </td>
                  <td className="p-3">
                    <a href={r.paths.en} className="text-blue-600 underline underline-offset-2">
                      {r.paths.en}
                    </a>
                  </td>
                  <td className="p-3">
                    <Badge variant={r.priority === 'P0' ? 'warranty' : 'info'}>{r.priority}</Badge>
                  </td>
                  <td className="p-3 text-slate-600">{OWNERS[r.owner].label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
