import type { ReactNode } from 'react';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from './SectionHeader';

type FinalCtaProps = {
  id: string;
  eyebrow?: string;
  title: string;
  body: ReactNode;
  actions: ReactNode;
  /** Khối phụ dưới nút (ghi chú nháp, danh sách thông tin cần chuẩn bị...). */
  children?: ReactNode;
};

/**
 * Khối CTA cuối trang: tấm navy-900 bo `xl` đặt trên nền trắng, tách rõ khỏi footer navy.
 * MỖI TRANG CHỈ MỘT khối này (AC-SH-7, UX-32). `id` đặt lên section để làm neo (vd /doi-tac-tho#dang-ky).
 * Tia chớp trang trí nằm trong tấm có overflow-clip (không gây tràn ngang).
 */
export function FinalCta({ id, eyebrow, title, body, actions, children }: FinalCtaProps) {
  const titleId = `${id}-title`;
  return (
    <Section id={id} aria-labelledby={titleId} spacing="compact">
      <div data-tone="navy" className="relative overflow-clip rounded-xl bg-blue-600 px-6 py-12 shadow-3 md:px-12 md:py-16 lg:px-16">
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 240 400"
          className="pointer-events-none absolute -bottom-16 -right-24 h-[115%] w-auto text-blue-700 md:-right-20"
        >
          <path d="M150 4 L34 228 H112 L82 396 L214 150 H132 L176 4 Z" fill="currentColor" opacity="0.5" />
        </svg>
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
          <SectionHeader id={titleId} eyebrow={eyebrow} title={title} lead={body} />
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">{actions}</div>
        </div>
        {children ? <div className="relative mt-10">{children}</div> : null}
      </div>
    </Section>
  );
}
