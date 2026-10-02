import { Clock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Section, type SectionTone } from '@/components/ui/Section';
import { TextLink } from '@/components/ui/TextLink';
import type { ClaimId } from '@/content/claims';
import { slaItems } from '@/content/sla';
import type { Locale } from '@/i18n/routing';
import { isDraftPreview } from '@/lib/env';
import { ClaimList, visibleClaims } from './draft';
import { SectionIntro } from './SectionIntro';
import { SLA_MILESTONES, SLA_REGIONS, SlaRegionTable } from './SlaRegionTable';

/** Chú thích dưới bảng SLA (đều là claim nháp → production tự ẩn). */
const SLA_NOTE_CLAIMS = ['b2b.sla.special-areas-definition', 'b2b.sla.warranty-hours', 'b2b.sla.urgent-orders'] as const;

type SlaSectionProps = {
  locale: Locale;
  id?: string;
  tone?: SectionTone;
  eyebrow: string;
  title: string;
  lead: string;
  /** Claim riêng của trang (vd cam kết 24 giờ của sàn) hiện cùng chú thích. */
  extraClaims?: readonly ClaimId[];
};

/**
 * Section "SLA theo vùng" dùng chung cho /giai-phap/hang-dien-may và /giai-phap/san-tmdt-ban-le.
 * Bảng chỉ hiện ô đã duyệt (claim); chưa ô nào → đoạn "SLA ghi trong hợp đồng" (không để khoảng trống).
 * Giờ tiếp nhận đơn đọc content/sla.ts: production chỉ hiện khi approved; bản xem trước hiện "đang ghi" kèm Nháp.
 */
export async function SlaSection({ locale, id = 'sla', tone = 'blue-50', eyebrow, title, lead, extraClaims = [] }: SlaSectionProps) {
  const t = await getTranslations({ locale, namespace: 'solutions' });
  const titleId = `${id}-title`;
  const intake = slaItems.find((s) => s.id === 'order-intake-hours');
  const intakeText =
    intake && intake.status === 'approved' && intake.value
      ? { text: intake.value[locale], draft: false }
      : intake && isDraftPreview()
        ? { text: intake.current[locale], draft: true }
        : null;
  const noteIds = [...extraClaims, ...SLA_NOTE_CLAIMS];
  const hasNotes = visibleClaims(noteIds, locale).length > 0 || intakeText !== null;

  return (
    <Section id={id} tone={tone} aria-labelledby={titleId}>
      <SectionIntro eyebrow={eyebrow} title={title} titleId={titleId} lead={lead} />
      <SlaRegionTable
        className="mt-10"
        locale={locale}
        caption={t('kit.sla.caption')}
        milestoneLabel={t('kit.sla.milestone')}
        regions={Object.fromEntries(SLA_REGIONS.map((r) => [r, t(`kit.sla.regions.${r}`)])) as Record<(typeof SLA_REGIONS)[number], string>}
        milestones={
          Object.fromEntries(
            SLA_MILESTONES.map((m) => [m, { label: t(`kit.sla.milestones.${m}.label`), hint: t(`kit.sla.milestones.${m}.hint`) }]),
          ) as Record<(typeof SLA_MILESTONES)[number], { label: string; hint: string }>
        }
        emptyCell={t('kit.byContract')}
        draftCaption={t('kit.sla.draftCaption')}
        fallback={
          <div className="mt-10 flex max-w-text items-start gap-4 rounded-lg border border-slate-300 bg-white p-6 shadow-1">
            <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
              <Clock size={22} strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-body font-semibold text-navy-900">{t('kit.sla.fallbackTitle')}</p>
              <p className="mt-1 text-body text-slate-600">{t('kit.sla.fallback')}</p>
            </div>
          </div>
        }
      />
      {hasNotes ? (
        <div className="mt-8 max-w-text">
          <h3 className="text-body font-semibold text-(--surface-heading)">{t('kit.sla.notesTitle')}</h3>
          <ClaimList ids={noteIds} locale={locale} className="mt-3" />
          {intakeText ? (
            <p className="mt-2.5 flex flex-wrap items-center gap-2 pl-7 text-small text-(--surface-fg)">
              <span className="font-semibold">{t('kit.sla.intakeLabel')}:</span>
              <span>{intakeText.text}</span>
              {intakeText.draft ? <DraftBadge /> : null}
            </p>
          ) : null}
        </div>
      ) : null}
      <TextLink href="/mang-luoi" variant="arrow" className="mt-8">
        {t('kit.sla.networkLink')}
      </TextLink>
    </Section>
  );
}
