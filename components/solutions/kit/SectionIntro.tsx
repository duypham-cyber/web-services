import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { cn } from '@/lib/cn';

type SectionIntroProps = {
  eyebrow?: string;
  /** H2 của section. */
  title: string;
  /** id cho aria-labelledby của <Section>. */
  titleId: string;
  lead?: ReactNode;
  className?: string;
  /** Phần tử phụ bên dưới lead (vd link "Xem bảng giá →"). */
  children?: ReactNode;
};

/** Đầu section B2B thống nhất: eyebrow (≤ 4 từ) → H2 → câu dẫn. Màu tự theo tông bề mặt. */
export function SectionIntro({ eyebrow, title, titleId, lead, className, children }: SectionIntroProps) {
  return (
    <div className={cn('max-w-text', className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Heading level={2} id={titleId} className={eyebrow ? 'mt-3' : undefined}>
        {title}
      </Heading>
      {lead ? <p className="mt-4 text-lead text-(--surface-muted)">{lead}</p> : null}
      {children}
    </div>
  );
}
