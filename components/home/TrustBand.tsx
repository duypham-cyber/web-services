import { getTranslations } from 'next-intl/server';
import { DraftLine } from '@/components/ui/DraftLine';
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
function logosState(locale: Locale): 'show' | 'draft' | 'hidden' {
  const c = claim('home.partner-logos', locale);
  if (c && !c.draft && partnersWithConsent().length > 0) return 'show';
  return isDraftPreview() ? 'draft' : 'hidden';
}

/**
 * Dải tin cậy chỉ hiện khi có ít nhất một ô KPI (số đo thật; bản xem trước: cả số site cũ) hoặc logo đã duyệt.
 * Logo chưa có phép KHÔNG đủ để hiện cả dải — ở bản xem trước nó chỉ là một dòng ghi chú bên trong dải.
 */
export function trustBandVisible(locale: Locale): boolean {
  return hasVisibleKpis(TRUST_KPIS) || logosState(locale) === 'show';
}

/**
 * P2 DẢI TIN CẬY (docs/03 mục 13.4): KPI K1–K4 (count-up; ô thiếu số thì ẩn) + logo đối tác (chỉ khi có phép).
 * Nền navy cố định. Không có số, không có logo → cả dải ẩn (page.tsx gọi trustBandVisible()).
 * Chỉ có logo mà chưa có số → tiêu đề H2 của dải là tiêu đề dải logo.
 * Bản xem trước: ô số site cũ kèm "Nháp · số site cũ"; KPI chưa có số và logo chưa có phép mỗi thứ MỘT dòng ghi chú.
 */
export async function TrustBand({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');
  const kpis = hasVisibleKpis(TRUST_KPIS);
  const logos = logosState(locale);

  return (
    <Section id="so-lieu" tone="navy" spacing="compact" aria-labelledby="so-lieu-title" className="lg:py-20">
      {kpis ? (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
            <Heading level={2} id="so-lieu-title" size="h3">
              {t('trust.title')}
            </Heading>
            <p className="max-w-[36rem] text-small text-(--surface-muted)">{t('trust.lead')}</p>
          </div>
          <KpiGroup
            locale={locale}
            ids={TRUST_KPIS}
            className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-6"
            tileClassName="border-l border-(--surface-border) pl-4 md:pl-5"
          />
        </>
      ) : null}

      {logos === 'show' ? (
        <div className={kpis ? 'mt-12 border-t border-(--surface-border) pt-8' : undefined}>
          {kpis ? (
            <p className="text-small font-semibold text-(--surface-fg)">{t('trust.logosTitle')}</p>
          ) : (
            <Heading level={2} id="so-lieu-title" size="h3">
              {t('trust.logosTitle')}
            </Heading>
          )}
          <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {partnersWithConsent().map((partner) => (
              <li key={partner.name} className="flex h-16 items-center justify-center rounded-md bg-white px-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- logo SVG/AVIF nhỏ, khung cao cố định */}
                <img src={partner.logo} alt={partner.name} width={160} height={40} className="h-10 w-auto max-w-full object-contain" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Bản xem trước: logo chưa có phép = MỘT dòng ghi chú (không còn 6 ô giữ chỗ nét đứt) */}
      {logos === 'draft' ? <DraftLine className="mt-6" label={t('trust.logosTitle')}>{t('trust.logosNote')}</DraftLine> : null}
    </Section>
  );
}
