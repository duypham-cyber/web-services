import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Heading } from '@/components/ui/Heading';
import { cn } from '@/lib/cn';

type SectionHeaderProps = {
  /** id của H2 — dùng cho aria-labelledby của section. */
  id: string;
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  className?: string;
};

/** Đầu section: eyebrow (≤ 4 từ, viết hoa) → H2 → câu dẫn. Màu theo tông bề mặt (data-tone). */
export function SectionHeader({ id, eyebrow, title, lead, className }: SectionHeaderProps) {
  return (
    <div className={cn('max-w-[62ch]', className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Heading level={2} id={id} className={eyebrow ? 'mt-3' : undefined}>
        {title}
      </Heading>
      {lead ? <div className="mt-4 text-lead text-(--surface-muted)">{lead}</div> : null}
    </div>
  );
}
