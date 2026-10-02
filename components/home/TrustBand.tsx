import { getTranslations } from 'next-intl/server';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { partnersWithConsent } from '@/content/partners';
import type { StatId } from '@/content/schemas';
import type { Locale } from '@/i18n/routing';
import { claim } from '@/lib/claims';
import { isDraftPreview } from '@/lib/env';
import { hasVisibleKpis, KpiGroup } from './Kpis';

const TRUST_KPIS: readonly StatId[] = ['K1', 'K2', 'K3', 'K4'];

/**
 * Logo hãng/sàn: nguồn DUY NHẤT là content/partners.ts (agent partner) — chỉ đối tác có văn bản đồng ý
 * (partnersWithConsent(), AC-DATA-4). Dải logo trên trang chủ còn cần claim 'home.partner-logos' được duyệt.
 */
/** Số ô giữ chỗ logo ở bản xem trước. */
const LOGO_SLOTS = 5;

function logosState(locale: Locale): 'show' | 'draft' | 'hidden' {
  const c = claim('home.partner-logos', locale);
  if (c && !c.draft && partnersWithConsent().length > 0) return 'show';
  return isDraftPreview() ? 'draft' : 'hidden';
}

/** Dải tin cậy chỉ hiện khi có ít nhất một KPI thật hoặc logo đã duyệt (bản xem trước: luôn hiện ô nháp). */
export function trustBandVisible(locale: Locale): boolean {
  return hasVisibleKpis(TRUST_KPIS) || logosState(locale) !== 'hidden';
}

/**
 * P2 DẢI TIN CẬY (docs/03 mục 13.4): KPI K1–K4 (count-up; ô thiếu số thì ẩn) + logo đối tác (chỉ khi có phép).
 * Nền navy cố định. Không có số, không có logo → cả dải ẩn (page.tsx gọi trustBandVisible()).
 */
export async function TrustBand({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');
  const logos = logosState(locale);

  return (
    <Section id="so-lieu" tone="navy" spacing="compact" aria-labelledby="so-lieu-title" className="lg:py-20">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <Heading level={2} id="so-lieu-title" size="h3">
          {t('trust.title')}
        </Heading>
        <p className="max-w-[36rem] text-small text-(--surface-muted)">{t('trust.lead')}</p>
      </div>

      <KpiGroup
        locale={locale}
        ids={TRUST_KPIS}
        className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
        tileClassName="border-l border-(--surface-border) pl-5"
      />

      {logos !== 'hidden' ? (
        <div className="mt-12 border-t border-(--surface-border) pt-8">
          <p className="flex flex-wrap items-center gap-2 text-small font-semibold text-(--surface-fg)">
            <span>{t('trust.logosTitle')}</span>
            {logos === 'draft' ? <DraftBadge /> : null}
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {logos === 'show'
              ? partnersWithConsent().map((partner) => (
                  <li key={partner.name} className="flex h-16 items-center justify-center rounded-md bg-white px-4">
                    {/* eslint-disable-next-line @next/next/no-img-element -- logo SVG/AVIF nhỏ, khung cao cố định */}
                    <img src={partner.logo} alt={partner.name} width={160} height={40} className="h-10 w-auto max-w-full object-contain" />
                  </li>
                ))
              : Array.from({ length: LOGO_SLOTS }, (_, i) => (
                  <li
                    key={i}
                    className="flex h-16 items-center justify-center rounded-md border border-dashed border-(--surface-border) px-3 text-center text-small text-(--surface-muted)"
                  >
                    {t('trust.logoSlot')}
                  </li>
                ))}
          </ul>
          {logos === 'draft' ? <p className="mt-4 text-small text-(--surface-muted)">{t('trust.logosNote')}</p> : null}
        </div>
      ) : null}
    </Section>
  );
}
