import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { Chip } from '@/components/ui/Chip';
import { processSteps } from '@/content/process';
import type { ProcessStep } from '@/content/schemas';
import type { Locale } from '@/i18n/routing';
import type { IllustrationKey } from './illustrations';
import { MediaFrame } from './MediaFrame';

/** Khung ảnh tĩnh cho từng bước — thay bằng ảnh tĩnh từ phim/ảnh thật khi chốt hướng hero (MediaFrame `src`). */
const STEP_STILL: Record<Exclude<ProcessStep['id'], '00'>, IllustrationKey> = {
  '01': 'step-intake',
  '02': 'step-dispatch',
  '03': 'step-confirm',
  '04': 'step-install',
  '05': 'step-reconcile',
};

type ProcessTimelineProps = {
  locale: Locale;
  /** "Bước {n}" đã format sẵn cho từng id, vd (id) => t('kit.process.step', { n: id }). */
  stepLabel: (id: string) => string;
  /** Nhãn cho bước 00 (sự kiện kích hoạt). */
  triggerLabel: string;
  /** detailed = dòng thời gian dọc có ảnh tĩnh (landing hãng) · compact = 5 cột gọn (trang dịch vụ). */
  variant?: 'detailed' | 'compact';
  /** Nhãn khung ảnh ở bản xem trước (null ở production). */
  stillLabel?: string | null;
};

/**
 * Quy trình vận hành 5 bước — MỘT nguồn: content/process.ts (docs/03 mục 14.1). <ol> server render, đọc được khi
 * tắt JS. Bước 00 "Khách mua hàng" hiển thị nhạt, không đếm là một bước.
 */
export function ProcessTimeline({ locale, stepLabel, triggerLabel, variant = 'detailed', stillLabel }: ProcessTimelineProps) {
  const trigger = processSteps.find((s) => s.isTrigger);
  const steps = processSteps.filter((s) => !s.isTrigger);

  const triggerLine = trigger ? (
    <p className="flex flex-wrap items-baseline gap-x-2 text-small text-(--surface-muted)">
      <span className="tabular font-semibold">{trigger.id}</span>
      <span className="font-semibold">{trigger.title[locale]}</span>
      <span aria-hidden="true">·</span>
      <span>
        {triggerLabel}: {trigger.description[locale]}
      </span>
    </p>
  ) : null;

  if (variant === 'compact') {
    return (
      <div>
        {triggerLine}
        <StaggerGrid as="ol" className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step) => (
            <div key={step.id} className="flex h-full flex-col border-t-2 border-blue-600 pt-5">
              <p className="tabular text-h2 font-semibold text-blue-600" aria-hidden="true">
                {step.id}
              </p>
              <h3 className="mt-3 text-h3 text-(--surface-heading)">
                <span className="sr-only">{stepLabel(step.id)}: </span>
                {step.title[locale]}
              </h3>
              <p className="mt-1 text-small font-medium text-(--surface-accent)">{step.actor[locale]}</p>
              <p className="mt-3 text-small text-(--surface-muted)">{step.description[locale]}</p>
            </div>
          ))}
        </StaggerGrid>
      </div>
    );
  }

  // detailed = "bảng phân cảnh": 5 khung ảnh tĩnh (thay bằng ảnh tĩnh từ phim khi chốt hướng hero) + chú thích
  return (
    <div>
      {triggerLine}
      <StaggerGrid as="ol" className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, i) => (
          <div key={step.id} className="flex h-full flex-col">
            <MediaFrame illustration={STEP_STILL[step.id as keyof typeof STEP_STILL]} ratio="4/3" previewLabel={stillLabel} />
            <div className="mt-5 flex items-center gap-3" aria-hidden="true">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill border-2 border-blue-600 bg-white text-small font-semibold text-blue-600 tabular">
                {step.id}
              </span>
              {i < steps.length - 1 ? <span className="h-0.5 flex-1 bg-blue-100 max-lg:hidden" /> : null}
            </div>
            <h3 className="mt-4 text-h3 text-(--surface-heading)">
              <span className="sr-only">{stepLabel(step.id)}: </span>
              {step.title[locale]}
            </h3>
            <Chip variant="orange" className="mt-2 self-start">
              {step.actor[locale]}
            </Chip>
            <p className="mt-3 text-small text-(--surface-muted)">{step.description[locale]}</p>
          </div>
        ))}
      </StaggerGrid>
    </div>
  );
}
