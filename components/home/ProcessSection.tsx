import { getTranslations } from 'next-intl/server';
import { Rise } from '@/components/motion/Rise';
import { DraftLine } from '@/components/ui/DraftLine';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { Section, type SectionTone } from '@/components/ui/Section';
import { processSteps } from '@/content/process';
import type { Locale } from '@/i18n/routing';
import { ProcessRoute } from './process-route';

/**
 * QUY TRÌNH (docs/03 mục 14.1) — "tuyến đường các trạm" theo Mẫu 02 "Bản đồ sống" (D-26).
 * content/process.ts là nguồn duy nhất, chỉ đọc: bước 00 "Khách mua hàng" là điểm xuất phát (sự kiện kích hoạt, nhạt,
 * NGOÀI <ol>), các bước thật là các trạm trong <ol> — số trạm đếm từ dữ liệu. BẮT BUỘC có trên trang chủ: tắt JS /
 * Googlebot không cuộn vẫn đọc đủ các bước (NFR-A11Y-04) → toàn bộ server render, không JS phía client.
 * Đầu section theo Mẫu 02: tiêu đề bên trái, đoạn dẫn bên phải (≥ 1024px).
 * ≥ 1280px: đường cong ngang qua các trạm; nhỏ hơn: tuyến dọc. Chuyển động: process-route.module.css (CSS thuần).
 */
export async function ProcessSection({ locale, tone }: { locale: Locale; tone: SectionTone }) {
  const t = await getTranslations('home');
  const trigger = processSteps.find((s) => s.isTrigger);
  const steps = processSteps.filter((s) => !s.isTrigger);

  return (
    <Section id="quy-trinh" tone={tone} aria-labelledby="quy-trinh-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <Rise className="max-w-[40rem]">
          <Eyebrow>{t('process.eyebrow')}</Eyebrow>
          <Heading level={2} id="quy-trinh-title" className="mt-3">
            {t('process.title')}
          </Heading>
        </Rise>
        <Rise as="p" index={1} className="max-w-[30rem] text-lead text-(--surface-muted) lg:pb-1">
          {t('process.lead')}
        </Rise>
      </div>

      <div className="mt-12 lg:mt-16">
        <ProcessRoute
          locale={locale}
          tone={tone}
          trigger={trigger}
          steps={steps}
          stepLabel={(n) => t('process.stepLabel', { n })}
          triggerLabel={t('process.triggerLabel')}
        />
      </div>

      <DraftLine className="mt-12">{t('process.pendingNote')}</DraftLine>
    </Section>
  );
}
