import { MapPinned } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { VietnamMap } from '@/components/map/VietnamMap';
import { Rise } from '@/components/motion/Rise';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Section, type SectionTone } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import type { Locale } from '@/i18n/routing';
import { claim } from '@/lib/claims';
import { hasVisibleKpis, KpiGroup } from './Kpis';
import { SectionHeader } from './SectionHeader';

/**
 * Section BẢN ĐỒ 34 TỈNH (phương án A+: bản đồ là section HTML 2.5D sau phim, KHÔNG WebGL trên trang chủ).
 * Bản đồ = <VietnamMap variant="home"> của agent bản đồ (giữ props, không sửa ở đây) — NFR-MAP-01 do component đó
 * bảo đảm (Hoàng Sa, Trường Sa luôn trong khung, có nhãn). KPI K1–K2 từ content/stats.ts (null → ẩn ô).
 * Phạm vi "34 tỉnh" chỉ hiện qua claim('coverage.provinces-34').
 * Bố cục: ≥1024 chữ + KPI bên trái, bản đồ bên phải; nhỏ hơn: chữ → bản đồ → KPI + link (bản đồ không bị đẩy xuống cuối).
 */
export async function NetworkSection({ locale, tone }: { locale: Locale; tone: SectionTone }) {
  const t = await getTranslations('home');
  const tn = await getTranslations('network');
  const coverage = claim('coverage.provinces-34', locale);
  const kpis = hasVisibleKpis(['K1', 'K2']);

  return (
    <Section id="mang-luoi" tone={tone} aria-labelledby="mang-luoi-title">
      <div className="grid gap-10 lg:grid-cols-12 lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-x-16 lg:gap-y-0">
        <div className="lg:col-span-5 lg:row-start-2">
          <SectionHeader id="mang-luoi-title" eyebrow={t('network.eyebrow')} title={t('network.title')} lead={t('network.lead')} />
          {coverage ? (
            <Rise as="p" className="mt-8 flex items-start gap-3 text-lead font-semibold text-(--surface-heading)">
              <MapPinned aria-hidden="true" size={26} strokeWidth={1.5} className="mt-0.5 shrink-0 text-(--surface-link)" />
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{coverage.text}</span>
                {coverage.draft ? <DraftBadge /> : null}
              </span>
            </Rise>
          ) : null}
        </div>

        <div className="lg:col-span-7 lg:col-start-6 lg:row-span-4 lg:row-start-1 lg:self-center">
          <div className="mx-auto w-full max-w-[30rem]">
            <VietnamMap locale={locale} variant="home" title={tn('mapTitle')} />
          </div>
        </div>

        <div className="lg:col-span-5 lg:row-start-3">
          <KpiGroup
            locale={locale}
            ids={['K1', 'K2']}
            className="grid grid-cols-2 gap-x-5 gap-y-8 lg:mt-10"
            tileClassName="border-l-2 border-blue-600 pl-4 md:pl-5"
          />
          <TextLink href="/mang-luoi" variant="arrow" className={kpis ? 'mt-8 lg:mt-10' : 'lg:mt-10'}>
            {t('network.cta')}
          </TextLink>
        </div>
      </div>
    </Section>
  );
}
