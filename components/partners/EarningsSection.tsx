import { Banknote, Check, PackageOpen, Timer, WalletCards, type LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Card } from '@/components/ui/Card';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { KpiTile } from '@/components/ui/KpiTile';
import { Section } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import {
  hasEarningsFigure,
  hasPercentFigure,
  technicianEarnings,
  type MoneyFigure,
  type PercentFigure,
} from '@/content/partners';
import { statsWithValue } from '@/content/stats';
import type { Locale } from '@/i18n/routing';
import { claim, type ClaimText } from '@/lib/claims';
import { isDraftPreview } from '@/lib/env';
import { formatDate } from '@/lib/format';
import { DraftNote } from './DraftNote';
import { SectionHeader } from './SectionHeader';

const NUMBER_LOCALE: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US' };
const TOPIC_KEYS = ['t1', 't2', 't3'] as const;

type PayItem = { key: 'payout' | 'materials' | 'urgent' | 'wallet'; icon: LucideIcon; c: ClaimText | null };

/**
 * /doi-tac-tho#thu-nhap — thu nhập tham khảo (số thật hoặc ẩn), cách nhận tiền, phí, ví (docs/03 mục 13.5).
 * - Số tiền đọc từ content/partners.ts; null → production KHÔNG hiện ô, bản xem trước hiện ô "chờ số" kèm Nháp.
 * - Cách nhận tiền / vật tư / phụ phí / ví là câu khẳng định (content/claims/partner.ts, đang nháp).
 * - Production chưa có câu nào được duyệt → một đoạn trung tính + link khung giá vật tư (không bịa).
 */
export async function EarningsSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'partners' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  const preview = isDraftPreview();

  const items: PayItem[] = [
    { key: 'payout', icon: Banknote, c: claim('partner.payout-per-job', locale) },
    { key: 'materials', icon: PackageOpen, c: claim('partner.materials-paid-on-site', locale) },
    { key: 'urgent', icon: Timer, c: claim('partner.urgent-surcharge', locale) },
    { key: 'wallet', icon: WalletCards, c: claim('partner.topup-wallet', locale) },
  ];
  const visible = items.filter((item): item is PayItem & { c: ClaimText } => item.c !== null);

  const reference = technicianEarnings.monthlyReference;
  const fee = technicianEarnings.platformFee;
  const showReference = hasEarningsFigure(reference) || preview;
  const showFee = hasPercentFigure(fee) || preview;
  const k1 = statsWithValue(['K1']);
  const tileCount = Number(showReference) + Number(showFee) + k1.length;

  const header = (
    <SectionHeader id="thu-nhap-title" eyebrow={t('earnings.eyebrow')} title={t('earnings.title')} lead={t('earnings.lead')} />
  );
  const pricingLink = (
    <TextLink href="/bang-gia" variant="arrow" className="py-1">
      {t('earnings.pricingLink')}
    </TextLink>
  );

  // Production chưa có số và chưa có câu nào được duyệt → bố cục 2 cột gọn: đầu section | việc bộ phận tuyển thợ giải thích
  if (!showReference && !showFee && k1.length === 0 && visible.length === 0) {
    return (
      <Section id="thu-nhap" aria-labelledby="thu-nhap-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          {header}
          <div className="max-w-[62ch]">
            <p className="text-body text-(--surface-fg) md:text-lead md:font-normal">{t('earnings.fallback')}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {TOPIC_KEYS.map((key) => (
                <li key={key} className="flex gap-3 text-body text-(--surface-fg)">
                  <Check aria-hidden="true" size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-success-700" />
                  {t(`earnings.topics.${key}`)}
                </li>
              ))}
            </ul>
            <div className="mt-6">{pricingLink}</div>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section id="thu-nhap" aria-labelledby="thu-nhap-title">
      {header}

      {showReference || showFee || k1.length > 0 ? (
        <div className={`mt-10 grid gap-6 md:grid-cols-2 ${tileCount > 2 ? 'lg:grid-cols-3' : ''}`}>
          {showReference ? (
            <MoneyTile
              figure={reference}
              locale={locale}
              label={t('earnings.referenceLabel')}
              pending={t('earnings.referencePending')}
              unit={t('earnings.referenceUnit')}
              updatedLabel={(date) => t('earnings.updated', { date })}
            />
          ) : null}
          {showFee ? (
            <PercentTile
              figure={fee}
              locale={locale}
              label={t('earnings.platformFeeLabel')}
              pending={t('earnings.platformFeePending')}
              updatedLabel={(date) => t('earnings.updated', { date })}
            />
          ) : null}
          {k1.map((k) => (
            <Card key={k.id} tone="blue-50" padding="lg">
              <KpiTile
                value={k.value}
                format={k.format}
                locale={locale}
                unit={tc('units.hours')}
                label={k.label[locale]}
                note={k.updatedAt ? `${k.definition[locale]} · ${formatDate(k.updatedAt, locale)}` : k.definition[locale]}
              />
            </Card>
          ))}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <StaggerGrid as="ul" className="mt-10 grid gap-6 md:grid-cols-2">
          {visible.map(({ key, icon: Icon, c }) => (
            <Card key={key} padding="lg" className="flex h-full flex-col gap-5 sm:flex-row">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <h3 className="text-h3 text-(--surface-heading)">{t(`earnings.items.${key}`)}</h3>
                <p className="mt-2 text-body text-(--surface-muted)">
                  {c.text}
                  {c.draft ? (
                    <>
                      {' '}
                      <DraftBadge />
                    </>
                  ) : null}
                </p>
                {key === 'materials' ? <div className="mt-4">{pricingLink}</div> : null}
              </div>
            </Card>
          ))}
        </StaggerGrid>
      ) : (
        <div className="mt-8 max-w-[62ch]">
          <p className="text-body text-(--surface-fg)">{t('earnings.fallback')}</p>
          <div className="mt-4">{pricingLink}</div>
        </div>
      )}

      <DraftNote className="mt-8">{t('earnings.draftNote')}</DraftNote>
    </Section>
  );
}

function MoneyTile({
  figure,
  locale,
  label,
  pending,
  unit,
  updatedLabel,
}: {
  figure: MoneyFigure;
  locale: Locale;
  label: string;
  pending: string;
  unit: string;
  updatedLabel: (date: string) => string;
}) {
  const nf = new Intl.NumberFormat(NUMBER_LOCALE[locale]);
  if (hasEarningsFigure(figure)) {
    const value = figure.min === figure.max ? nf.format(figure.min) : `${nf.format(figure.min)}–${nf.format(figure.max)}`;
    return (
      <Card tone="blue-50" padding="lg">
        <p className="text-small font-semibold text-(--surface-fg)">{label}</p>
        <p className="mt-3 font-display text-h2 tabular text-(--surface-heading)">
          {value} <span className="text-body font-semibold">{unit}</span>
        </p>
        <p className="mt-3 text-small text-(--surface-muted)">
          {figure.definition[locale]} · {updatedLabel(formatDate(figure.updatedAt, locale))}
        </p>
      </Card>
    );
  }
  return <PendingTile label={label} pending={pending} definition={figure.definition[locale]} />;
}

function PercentTile({
  figure,
  locale,
  label,
  pending,
  updatedLabel,
}: {
  figure: PercentFigure;
  locale: Locale;
  label: string;
  pending: string;
  updatedLabel: (date: string) => string;
}) {
  if (hasPercentFigure(figure)) {
    const nf = new Intl.NumberFormat(NUMBER_LOCALE[locale], { maximumFractionDigits: 1 });
    return (
      <Card tone="blue-50" padding="lg">
        <p className="text-small font-semibold text-(--surface-fg)">{label}</p>
        <p className="mt-3 font-display text-h2 tabular text-(--surface-heading)">{nf.format(figure.value)}%</p>
        <p className="mt-3 text-small text-(--surface-muted)">
          {figure.definition[locale]} · {updatedLabel(formatDate(figure.updatedAt, locale))}
        </p>
      </Card>
    );
  }
  return <PendingTile label={label} pending={pending} definition={figure.definition[locale]} />;
}

/** Ô giữ chỗ (chỉ bản xem trước): nhãn + "chờ số" + định nghĩa đề xuất. */
function PendingTile({ label, pending, definition }: { label: string; pending: string; definition: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-500 bg-white p-6 md:p-8">
      <p className="flex flex-wrap items-center gap-2 text-small font-semibold text-ink-900">
        {label} <DraftBadge />
      </p>
      <p className="mt-3 font-display text-h3 text-slate-600">{pending}</p>
      <p className="mt-3 text-small text-slate-600">{definition}</p>
    </div>
  );
}
