import { ArrowRight, Building2, House, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

type FlowCard = {
  title: string;
  payer: string;
  rows: { label: string; value: string }[];
};

type BillingSplitProps = {
  fee: FlowCard;
  materials: FlowCard;
  className?: string;
};

function FlowIcons({ kind }: { kind: 'fee' | 'materials' }) {
  const From = kind === 'fee' ? Building2 : House;
  const To = kind === 'fee' ? null : Wrench;
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-2 text-blue-600">
      <span className="inline-flex size-10 items-center justify-center rounded-md bg-blue-100">
        <From size={20} strokeWidth={1.5} />
      </span>
      <ArrowRight size={16} strokeWidth={1.75} className="text-slate-500" />
      <span
        className={cn(
          'inline-flex size-10 items-center justify-center rounded-md',
          To ? 'bg-blue-100' : 'bg-blue-600 text-white',
        )}
      >
        {To ? (
          <To size={20} strokeWidth={1.5} />
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round">
            <path d="M14 2 L5 13 H11 L10 22 L19 10 H13 Z" />
          </svg>
        )}
      </span>
    </span>
  );
}

/**
 * "Đối soát & VAT" — giải thích hai dòng tiền tách bạch của một đơn (docs/03 mục 13.5; chính sách cũ Phần 2
 * Điều khoản 2): phí dịch vụ (hãng ↔ Bluebolt, theo hợp đồng) và vật tư phát sinh (khách ↔ thợ, tại chỗ).
 * Chỉ mô tả mô hình; các cam kết hóa đơn/thuế là claim nháp, trang đặt dưới thẻ bằng ClaimList.
 */
export function BillingSplit({ fee, materials, className }: BillingSplitProps) {
  const cards = [
    { kind: 'fee' as const, data: fee },
    { kind: 'materials' as const, data: materials },
  ];
  return (
    <div className={cn('grid gap-6 lg:grid-cols-2', className)}>
      {cards.map(({ kind, data }) => (
        <Card key={kind} as="article" padding="lg" className="flex h-full flex-col">
          <FlowIcons kind={kind} />
          <h3 className="mt-5 text-h3 text-navy-900">{data.title}</h3>
          <p className="mt-1 text-small font-semibold text-orange-700">{data.payer}</p>
          <dl className="mt-6 grid gap-0 border-t border-slate-300">
            {data.rows.map((r) => (
              <div key={r.label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 border-b border-slate-300 py-3 last:border-b-0 max-sm:grid-cols-1 max-sm:gap-1">
                <dt className="text-small font-semibold text-slate-600">{r.label}</dt>
                <dd className="text-small text-ink-900 md:text-body">{r.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}
    </div>
  );
}
