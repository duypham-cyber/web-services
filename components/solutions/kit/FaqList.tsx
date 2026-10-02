import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type FaqEntry = {
  id: string;
  question: string;
  answer: ReactNode;
};

/**
 * Câu hỏi thường gặp dạng <details>/<summary>: mở/đóng không cần JS, bàn phím (Enter/Space) có sẵn, nội dung luôn
 * nằm trong HTML (Googlebot, không JS). Agent SEO chỉ phát FAQPage JSON-LD cho trang có khối này (AC-LD-2).
 * Câu hỏi nào chỉ dựa trên claim chưa duyệt thì trang tự bỏ khỏi `items` ở production.
 */
export function FaqList({ items, className }: { items: FaqEntry[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div className={cn('border-y border-slate-300', className)}>
      {items.map((item) => (
        <details key={item.id} className="group border-b border-slate-300 last:border-b-0">
          <summary
            className={cn(
              'flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-5',
              'text-body font-semibold text-(--surface-heading) [&::-webkit-details-marker]:hidden',
            )}
          >
            <span>{item.question}</span>
            <span
              aria-hidden="true"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill border border-blue-600 text-blue-600 transition-transform duration-(--dur-base) ease-standard group-open:rotate-45"
            >
              <Plus size={16} strokeWidth={2} />
            </span>
          </summary>
          <div className="max-w-text pb-6 pr-2 text-body text-(--surface-muted) md:pr-14">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
