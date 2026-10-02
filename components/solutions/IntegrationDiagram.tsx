import { Building2, CornerDownLeft, House, Store, Wrench } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './IntegrationDiagram.module.css';

export type DiagramNode = { key: string; title: string; body: string };

type IntegrationDiagramProps = {
  /** Tên sơ đồ cho trình đọc màn hình (aria-label của danh sách các bước). */
  label: string;
  /** 4 nút theo thứ tự: sàn → Bluebolt → thợ → nhà khách. */
  nodes: [DiagramNode, DiagramNode, DiagramNode, DiagramNode];
  returnTitle: string;
  /** Ví dụ các mốc trạng thái trả về sàn. */
  statuses: string[];
  statusesNote: string;
  className?: string;
};

const ICONS = [Store, Building2, Wrench, House] as const;

/** Đường nối ngang (≥1024px): SVG co giãn theo khe giữa hai nút, mũi tên bằng marker, gói tin chạy theo transform. */
function WireRight({ i, id }: { i: number; id: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(styles.wire, 'absolute left-full top-1/2 h-4 w-12 -translate-y-1/2 overflow-visible text-blue-600')}
      style={{ '--i': i } as CSSProperties}
    >
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      <line x1="6" y1="50%" x2="88%" y2="50%" stroke="currentColor" strokeWidth="2" strokeLinecap="round" markerEnd={`url(#${id})`} />
      <circle cx="6" cy="50%" r="4" className={cn(styles.packet, styles.packetRight, 'fill-orange-500')} style={{ '--i': i } as CSSProperties} />
    </svg>
  );
}

/** Đường nối dọc (<1024px). */
function WireDown({ i, id }: { i: number; id: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(styles.wireDown, 'mx-auto block h-10 w-4 overflow-visible text-blue-600')}
      style={{ '--i': i } as CSSProperties}
    >
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      <line x1="50%" y1="4" x2="50%" y2="80%" stroke="currentColor" strokeWidth="2" strokeLinecap="round" markerEnd={`url(#${id})`} />
      <circle cx="50%" cy="4" r="4" className={cn(styles.packet, styles.packetDown, 'fill-orange-500')} style={{ '--i': i } as CSSProperties} />
    </svg>
  );
}

function StatusChips({ statuses }: { statuses: string[] }): ReactNode {
  return (
    <ol className="flex flex-wrap items-center justify-center gap-2">
      {statuses.map((s, i) => (
        <li key={s} className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-blue-100 bg-white px-3 py-1 text-small font-medium text-navy-900 shadow-1">
            <span aria-hidden="true" className={cn('size-2 rounded-pill', i === statuses.length - 1 ? 'bg-orange-500' : 'bg-blue-600')} />
            {s}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Sơ đồ tích hợp: đơn từ sàn → Bluebolt → thợ → nhà khách, trạng thái quay về sàn (docs/03 mục 13.5).
 * Nội dung là HTML thật (<ol> 4 bước + danh sách trạng thái) để đọc được khi tắt JS / trình đọc màn hình;
 * SVG chỉ là đường nối trang trí (aria-hidden). Chuyển động: IntegrationDiagram.module.css (một lần khi vào khung nhìn).
 * Mô tả luồng nghiệp vụ, KHÔNG khẳng định kênh kỹ thuật (API/webhook) — phần đó là claim nháp ở trang.
 */
export function IntegrationDiagram({ label, nodes, returnTitle, statuses, statusesNote, className }: IntegrationDiagramProps) {
  return (
    <div data-motion-item="diagram" className={cn(styles.diagram, 'relative', className)}>
      <ol aria-label={label} className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-12">
        {nodes.map((node, i) => {
          const Icon = ICONS[i] ?? Store;
          const isBluebolt = i === 1;
          return (
            <li key={node.key} className="relative">
              <div
                className={cn(
                  styles.node,
                  'relative flex h-full flex-col rounded-lg border p-5 shadow-1 md:p-6',
                  isBluebolt ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white',
                )}
                style={{ '--i': i } as CSSProperties}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex size-11 items-center justify-center rounded-md',
                    isBluebolt ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600',
                  )}
                >
                  <Icon size={22} strokeWidth={1.5} />
                </span>
                <h3 className={cn('mt-4 text-h3', isBluebolt ? 'text-white' : 'text-navy-900')}>{node.title}</h3>
                <p className={cn('mt-2 text-small', isBluebolt ? 'text-blue-50' : 'text-slate-600')}>{node.body}</p>
              </div>
              {i < nodes.length - 1 ? (
                <>
                  <div className="max-lg:hidden">
                    <WireRight i={i} id={`wire-r-${i}`} />
                  </div>
                  <div className="lg:hidden">
                    <WireDown i={i} id={`wire-d-${i}`} />
                  </div>
                </>
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Đường trạng thái quay về sàn (≥1024px): từ tâm nút cuối về tâm nút đầu (lưới 4 cột, khe 48px) */}
      <div className="mt-6 lg:mt-0">
        <div className="max-lg:hidden lg:px-[calc(12.5%-18px)]">
          <svg
            aria-hidden="true"
            className={cn(styles.wireLeft, 'block h-14 w-full overflow-visible text-orange-500')}
            style={{ '--i': 4 } as CSSProperties}
          >
            <defs>
              <marker id="wire-return" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M1 1 L9 5 L1 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 6">
              <line x1="100%" y1="2" x2="100%" y2="44" />
              <line x1="100%" y1="44" x2="0" y2="44" />
              <line x1="0" y1="44" x2="0" y2="10" markerEnd="url(#wire-return)" strokeDasharray="none" />
            </g>
            <circle cx="100%" cy="44" r="4.5" className={cn(styles.packet, styles.packetLeft, 'fill-orange-500')} />
          </svg>
        </div>
        <div className="mt-2 rounded-lg border border-dashed border-orange-700 bg-orange-50 p-5 text-center md:p-6 lg:mt-4">
          <p className="inline-flex items-center gap-2 text-body font-semibold text-navy-900">
            <CornerDownLeft aria-hidden="true" size={18} strokeWidth={1.75} className="text-orange-700" />
            {returnTitle}
          </p>
          <div className="mt-4">
            <StatusChips statuses={statuses} />
          </div>
          <p className="mt-4 text-small text-slate-600">{statusesNote}</p>
        </div>
      </div>
    </div>
  );
}
