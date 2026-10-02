import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type FaqItem = {
  id: string;
  question: string;
  answer: ReactNode;
  /** Nhãn cạnh câu hỏi, vd <DraftBadge/> khi câu trả lời là nội dung nháp (để người duyệt thấy mà không cần mở). */
  badge?: ReactNode;
};

/**
 * Hỏi đáp bằng <details>/<summary> gốc: chạy không cần JS, bàn phím (Enter/Space) mở được, nội dung có sẵn trong HTML
 * (Googlebot đọc được). Không đặt heading trong <summary> (vai trò nút làm mất ngữ nghĩa heading ở một số trình đọc).
 * JSON-LD FAQPage (nếu dùng) do agent SEO sinh từ cùng danh sách, chỉ khi FAQ hiển thị trên trang (AC-LD-2).
 */
export function FaqList({ items, className }: { items: readonly FaqItem[]; className?: string }) {
  return (
    <div className={cn('divide-y divide-slate-300 border-y border-slate-300', className)}>
      {items.map((item) => (
        <details key={item.id} id={`hoi-dap-${item.id}`} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-4 text-body font-semibold text-(--surface-heading) md:text-lead md:font-semibold [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              {item.question}
              {item.badge ? <> {item.badge}</> : null}
            </span>
            <span
              aria-hidden="true"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill border border-slate-300 text-blue-600 transition-transform duration-(--dur-base) ease-standard group-open:rotate-180"
            >
              <ChevronDown size={18} strokeWidth={1.75} />
            </span>
          </summary>
          <div className="max-w-[68ch] pb-6 pr-2 text-body text-(--surface-muted) md:pr-14">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
