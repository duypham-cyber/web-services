import { ArrowDown, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QUOTE_HREF } from '@/components/layout/Header';
import { ProvinceTable } from '@/components/map/ProvinceTable';
import { VietnamMap } from '@/components/map/VietnamMap';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { KpiTile } from '@/components/ui/KpiTile';
import { Section } from '@/components/ui/Section';
import { TableScroll } from '@/components/ui/TableScroll';
import { provinces, regions } from '@/content/provinces';
import { site } from '@/content/site';
import { slaItems } from '@/content/sla';
import { statsWithValue } from '@/content/stats';
import { resolveLocale } from '@/i18n/params';
import { localeStaticParams } from '@/i18n/static-params';
import { claim } from '@/lib/claims';
import { isDraftPreview } from '@/lib/env';
import { formatDate } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps<'/[locale]/mang-luoi'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'network' });
  return buildMetadata({
    routeKey: 'network',
    locale,
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

/** Hạng mục SLA liên quan tới phục vụ theo vùng (content/sla.ts — chủ sở hữu: agent B2B; ở đây chỉ đọc). */
const SLA_IDS = ['order-intake-hours', 'completion-time', 'fix-response-time'] as const;

/**
 * /mang-luoi (T-NETWORK, contracts/site-shell-p0.md 1.3): H1 → bản đồ 34 tỉnh SVG → bảng 34 tỉnh có ô tìm (SSR)
 * → thời gian phục vụ theo vùng → CTA "Triển khai tại tỉnh của bạn" (→ /lien-he#kinh-doanh, chưa có form).
 * Số liệu chỉ từ content/stats.ts + provinces.ts (null → ẩn / "chưa có số"); khẳng định chỉ qua claim().
 */
export default async function NetworkPage({ params }: PageProps<'/[locale]/mang-luoi'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'network' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const preview = isDraftPreview();
  const coverage = claim('coverage.provinces-34', locale);
  const kpis = statsWithValue(['K1', 'K2']);
  const sla = SLA_IDS.map((id) => slaItems.find((s) => s.id === id)).filter((s) => s !== undefined);
  const approvedSla = sla.filter((s) => (s.status as string) === 'approved' && s.value !== null);
  const phone = site.hotline.display[locale];

  return (
    <>
      {/* HERO + BẢN ĐỒ — H1 duy nhất của trang */}
      <Section aria-labelledby="page-title" spacing="compact" className="overflow-clip">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,35rem)] lg:gap-16">
          <div>
            <Eyebrow>{t('eyebrow')}</Eyebrow>
            <Heading level={1} id="page-title" className="mt-3 max-w-[22ch]">
              {t('title')}
            </Heading>
            <p className="mt-5 max-w-text text-lead text-(--surface-muted)">{t('lead')}</p>
            {coverage ? (
              <p className="mt-6 flex flex-wrap items-center gap-2 text-body font-semibold text-(--surface-heading)">
                {coverage.text}
                {coverage.draft ? <DraftBadge /> : null}
              </p>
            ) : null}
            {kpis.length > 0 ? (
              <div className="mt-8 grid grid-cols-2 gap-6">
                {kpis.map((k) => (
                  <KpiTile
                    key={k.id}
                    value={k.value}
                    format={k.format}
                    locale={locale}
                    label={k.label[locale]}
                    note={k.updatedAt ? `${k.definition[locale]} · ${formatDate(k.updatedAt, locale)}` : k.definition[locale]}
                    animate
                  />
                ))}
              </div>
            ) : preview ? (
              <p className="mt-6 flex max-w-text flex-wrap items-center gap-2 text-small text-(--surface-muted)">
                <DraftBadge /> {t('stats.hiddenNote')}
              </p>
            ) : null}
            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {[
                { href: '#tra-cuu', label: t('table.title') },
                { href: '#thoi-gian-phuc-vu', label: t('sla.title') },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-(--surface-link) no-underline underline-offset-[3px] hover:text-(--surface-link-hover) hover:underline"
                  >
                    {link.label}
                    <ArrowDown aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <VietnamMap locale={locale} variant="network" title={t('mapTitle')} />
        </div>
      </Section>

      {/* BẢNG 34 TỈNH — đủ trong HTML, lọc ở client */}
      <Section tone="blue-50" id="tra-cuu" aria-labelledby="tra-cuu-title">
        <Eyebrow>{t('table.eyebrow')}</Eyebrow>
        <Heading level={2} id="tra-cuu-title" className="mt-3">
          {t('table.title')}
        </Heading>
        <p className="mt-4 max-w-text text-body text-(--surface-muted)">{t('table.intro')}</p>
        <div className="mt-8">
          <ProvinceTable locale={locale} />
        </div>
      </Section>

      {/* THỜI GIAN PHỤC VỤ THEO VÙNG — chỉ hiện cam kết đã duyệt (content/sla.ts); chưa duyệt → không số */}
      <Section id="thoi-gian-phuc-vu" aria-labelledby="sla-title">
        <Eyebrow>{t('sla.eyebrow')}</Eyebrow>
        <Heading level={2} id="sla-title" className="mt-3">
          {t('sla.title')}
        </Heading>
        <p className="mt-4 max-w-text text-body text-(--surface-muted)">{t('sla.intro')}</p>

        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {regions.map((region) => {
            const count = provinces.filter((p) => p.region === region.id).length;
            return (
              <Card as="li" key={region.id} padding="lg" className="flex flex-col">
                <span
                  aria-hidden="true"
                  className={
                    region.id === 'north'
                      ? 'h-1.5 w-12 rounded-pill bg-blue-600'
                      : region.id === 'central'
                        ? 'h-1.5 w-12 rounded-pill bg-blue-300'
                        : 'h-1.5 w-12 rounded-pill bg-navy-900'
                  }
                />
                <Heading level={3} className="mt-5">
                  {region.name[locale]}
                </Heading>
                <p className="mt-2 text-body text-(--surface-muted)">{region.scope[locale]}</p>
                <p className="mt-4 text-small font-semibold text-(--surface-heading)">
                  {t('regions.provinceCount', { count })}
                </p>
              </Card>
            );
          })}
        </ul>

        {approvedSla.length > 0 ? (
          <TableScroll label={t('sla.title')} className="mt-10 bg-white">
            <table className="w-full min-w-[20rem] border-collapse text-left text-small">
              <thead>
                <tr className="border-b border-slate-300 bg-blue-50">
                  <th scope="col" className="px-4 py-3 font-semibold text-navy-900">
                    {t('sla.colItem')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-navy-900">
                    {t('sla.colValue')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {approvedSla.map((s) => (
                  <tr key={s.id} className="border-b border-slate-300 last:border-b-0">
                    <th scope="row" className="px-4 py-3 align-top font-semibold text-ink-900">
                      {s.label[locale]}
                    </th>
                    <td className="px-4 py-3 align-top text-ink-900">{s.value?.[locale]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        ) : (
          <p className="mt-8 max-w-text text-body font-medium text-(--surface-heading)">{t('sla.pending')}</p>
        )}

        {preview && approvedSla.length < sla.length ? (
          <div className="mt-10 rounded-lg border-2 border-dashed border-slate-500 bg-white p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Heading level={3} size="h3">
                {t('sla.reviewTitle')}
              </Heading>
              <DraftBadge />
            </div>
            <p className="mt-2 max-w-text text-small text-slate-600">{t('sla.reviewIntro')}</p>
            <dl className="mt-5 grid gap-4">
              {sla
                .filter((s) => (s.status as string) !== 'approved')
                .map((s) => (
                  <div key={s.id} className="grid gap-1 border-t border-slate-300 pt-4 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-6">
                    <dt className="text-small font-semibold text-ink-900">{s.label[locale]}</dt>
                    <dd className="text-small text-slate-600">
                      <Badge variant="illustration" className="mr-2">
                        {t('sla.reviewCurrent')}
                      </Badge>
                      {s.current[locale]}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        ) : null}
      </Section>

      {preview ? (
        <Section spacing="compact" aria-labelledby="review-title">
          <div className="rounded-lg border-2 border-dashed border-slate-500 bg-white p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="review-title" className="text-h3 text-navy-900">
                {t('review.title')}
              </h2>
              <Badge variant="draft">{tc('status.draft')}</Badge>
            </div>
            <ul className="mt-4 grid max-w-text list-disc gap-2 pl-5 text-small text-ink-900 marker:text-blue-600">
              <li>{t('review.regions')}</li>
              <li>{t('review.counts')}</li>
              <li>{t('review.labels')}</li>
              <li>{t('map.draftPinsNote')}</li>
            </ul>
          </div>
        </Section>
      ) : null}

      {/* CTA CUỐI — một khối duy nhất của trang (UX-32); form B2B chờ contract → /lien-he#kinh-doanh */}
      <Section tone="navy" aria-labelledby="cta-title">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <Heading level={2} id="cta-title" className="max-w-[24ch]">
              {t('cta.title')}
            </Heading>
            <p className="mt-4 max-w-text text-lead text-(--surface-muted)">{t('cta.body')}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button href={QUOTE_HREF} variant="primary" size="lg">
              {t('cta.primary')}
            </Button>
            <Button
              externalHref={`tel:${site.hotline.tel}`}
              variant="on-dark"
              size="lg"
              iconStart={<Phone aria-hidden="true" size={18} strokeWidth={1.75} />}
            >
              {t('cta.call', { phone })}
            </Button>
          </div>
        </div>
      </Section>

    </>
  );
}
