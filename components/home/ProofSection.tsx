import { getTranslations } from 'next-intl/server';
import { DraftLine } from '@/components/ui/DraftLine';
import { Section, type SectionTone } from '@/components/ui/Section';
import { isDraftPreview } from '@/lib/env';

/**
 * P5 BẰNG CHỨNG (P1, docs/03 mục 13.4). Production: ẨN cho tới khi có ĐỦ hai thứ —
 *   (1) claim 'home.partner-video' / 'home.case-study' được duyệt (content/claims/home.ts: văn bản đồng ý của đối tác),
 *   (2) dữ liệu thật: nguồn video + ảnh bìa (facade: chỉ tải video khi bấm phát), số liệu và trích dẫn case study.
 * Khi có đủ: dựng nhánh production ở đây (facade + case study, dùng proof.eyebrow/title/lead) rồi mới cho
 * proofVisible() trả true ở production.
 * Bản xem trước (DRAFT_PREVIEW=1): MỘT dòng ghi chú kèm nhãn Nháp (không chiếm cả section) — page.tsx đặt dòng này
 * cùng tông với section liền trước (inheritTone) nên nhịp nền trắng / xanh nhạt giống hệt bản production.
 */
export function proofVisible(): boolean {
  return isDraftPreview();
}

export async function ProofSection({ tone }: { tone: SectionTone }) {
  const t = await getTranslations('home');
  return (
    <Section as="div" id="bang-chung" tone={tone} spacing="none" className="pb-12 md:pb-16">
      <DraftLine label={t('proof.eyebrow')}>{t('proof.draftLine')}</DraftLine>
    </Section>
  );
}
