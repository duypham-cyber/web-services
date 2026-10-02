import type { ReactNode } from 'react';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { cn } from '@/lib/cn';

export type StepItem = { key: string; title: string; body: ReactNode; extra?: ReactNode };

type StepListProps = {
  steps: readonly StepItem[];
  /** "Bước {n}" cho trình đọc màn hình (số lớn chỉ để nhìn). */
  stepLabel: (n: number) => string;
  /** Lưới cột theo bề rộng, vd "sm:grid-cols-2 lg:grid-cols-4". */
  columnsClassName?: string;
  className?: string;
};

/**
 * Danh sách bước có số (<ol>), cùng ngôn ngữ hình ảnh với quy trình 5 bước của trang chủ (vạch xanh trên + số lớn).
 * Dùng cho lộ trình gia nhập 4 bước của thợ và các bước đăng ký bảo hành — KHÔNG gọi là "quy trình vận hành"
 * (docs/03 mục 14.1). Hiệu ứng: stagger-grid (tắt khi reduced-motion, nội dung luôn có trong HTML).
 */
export function StepList({ steps, stepLabel, columnsClassName = 'sm:grid-cols-2 lg:grid-cols-4', className }: StepListProps) {
  return (
    <StaggerGrid as="ol" className={cn('grid gap-x-6 gap-y-10', columnsClassName, className)}>
      {steps.map((step, i) => (
        <div key={step.key} className="flex h-full flex-col border-t-2 border-blue-600 pt-5">
          <p aria-hidden="true" className="font-display text-h2 tabular text-blue-600">
            {String(i + 1).padStart(2, '0')}
          </p>
          <h3 className="mt-3 text-h3 text-(--surface-heading)">
            <span className="sr-only">{stepLabel(i + 1)}: </span>
            {step.title}
          </h3>
          <div className="mt-2 text-body text-(--surface-muted)">{step.body}</div>
          {step.extra ? <div className="mt-4">{step.extra}</div> : null}
        </div>
      ))}
    </StaggerGrid>
  );
}
