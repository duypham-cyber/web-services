import { FileText, Play } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Rise } from '@/components/motion/Rise';
import { DraftBadge } from '@/components/ui/DraftBadge';
import { Heading } from '@/components/ui/Heading';
import { Section, type SectionTone } from '@/components/ui/Section';
import { isDraftPreview } from '@/lib/env';
import { SectionHeader } from './SectionHeader';

/**
 * P5 BẰNG CHỨNG (P1, docs/03 mục 13.4). Production: ẨN cho tới khi có ĐỦ hai thứ —
 *   (1) claim 'home.partner-video' / 'home.case-study' được duyệt (content/claims/home.ts: văn bản đồng ý của đối tác),
 *   (2) dữ liệu thật: nguồn video + ảnh bìa (facade: chỉ tải video khi bấm phát), số liệu và trích dẫn case study.
 * Khi có đủ: dựng nhánh production ở đây (facade + case study) rồi mới cho proofVisible() trả true ở production.
 * Bản xem trước (DRAFT_PREVIEW=1): hiện ô giữ chỗ kèm nhãn Nháp để anh Duy thấy chỗ sẽ đặt bằng chứng.
 */
export function proofVisible(): boolean {
  return isDraftPreview();
}

/**
 * Hiện tại chỉ có nhánh BẢN XEM TRƯỚC: hai ô giữ chỗ (video Bluebolt × Panasonic dạng facade, case study) kèm nhãn
 * Nháp và điều kiện để bật. Không có logo, tên đối tác hay số liệu bịa.
 */
export async function ProofSection({ tone }: { tone: SectionTone }) {
  const t = await getTranslations('home');

  return (
    <Section id="bang-chung" tone={tone} aria-labelledby="bang-chung-title">
      <SectionHeader id="bang-chung-title" eyebrow={t('proof.eyebrow')} title={t('proof.title')} lead={t('proof.lead')} />
      <div className="mt-12 grid gap-6 lg:grid-cols-12">
        <Rise className="lg:col-span-7">
          <div className="relative flex aspect-video flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border-2 border-dashed border-slate-500 bg-white p-6 text-center">
            <span className="inline-flex size-16 items-center justify-center rounded-pill bg-navy-900 text-white">
              <Play aria-hidden="true" size={28} strokeWidth={1.75} className="translate-x-0.5" />
            </span>
            <Heading level={3} className="flex flex-wrap items-center justify-center gap-2">
              <span>{t('proof.videoSlot')}</span>
              <DraftBadge />
            </Heading>
            <p className="max-w-[30rem] text-small text-slate-600">{t('proof.videoNote')}</p>
          </div>
        </Rise>
        <Rise className="lg:col-span-5" index={1}>
          <div className="flex h-full flex-col justify-center gap-4 rounded-lg border-2 border-dashed border-slate-500 bg-white p-6 md:p-8">
            <span className="inline-flex size-12 items-center justify-center rounded-md bg-blue-100 text-blue-600">
              <FileText aria-hidden="true" size={24} strokeWidth={1.5} />
            </span>
            <Heading level={3} className="flex flex-wrap items-center gap-2">
              <span>{t('proof.caseSlot')}</span>
              <DraftBadge />
            </Heading>
            <p className="text-small text-slate-600">{t('proof.caseNote')}</p>
          </div>
        </Rise>
      </div>
    </Section>
  );
}
