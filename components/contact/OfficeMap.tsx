import { ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type OfficeMapProps = {
  /** URL Google Maps dạng tìm kiếm (không API key, không nhúng Maps JS — AC-PERF-4). */
  mapsUrl: string;
  openLabel: string;
  newTabLabel: string;
  note: string;
};

/**
 * "Bản đồ facade" của /lien-he: sơ đồ phố minh họa bằng SVG + token (KHÔNG phải bản đồ thật, có chú thích),
 * nút "Mở Google Maps" mở thẻ mới. Không iframe, không tải gì từ Google trước khi người dùng bấm.
 * Không phải bản đồ Việt Nam nên không thuộc NFR-MAP-01.
 */
export function OfficeMap({ mapsUrl, openLabel, newTabLabel, note }: OfficeMapProps) {
  return (
    <figure className="min-w-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-blue-100 bg-blue-100 shadow-1">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
          {/* khối nhà */}
          <g className="fill-white">
            <rect x="-10" y="-10" width="120" height="90" rx="10" />
            <rect x="130" y="-10" width="110" height="90" rx="10" />
            <rect x="262" y="-10" width="150" height="90" rx="10" />
            <rect x="-10" y="104" width="120" height="86" rx="10" />
            <rect x="130" y="104" width="110" height="86" rx="10" />
            <rect x="262" y="104" width="150" height="86" rx="10" />
            <rect x="-10" y="214" width="120" height="96" rx="10" />
            <rect x="130" y="214" width="110" height="96" rx="10" />
            <rect x="262" y="214" width="150" height="96" rx="10" />
          </g>
          {/* đường lớn + đường ngang dọc */}
          <path d="M120 -20 L120 320" className="fill-none stroke-blue-300" strokeWidth="8" opacity="0.35" />
          <path d="M251 -20 L251 320" className="fill-none stroke-blue-300" strokeWidth="12" opacity="0.45" />
          <path
            d="M-20 196 C 90 182, 170 214, 250 196 S 360 176, 420 190"
            className="fill-none stroke-blue-300"
            strokeWidth="18"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M-20 196 C 90 182, 170 214, 250 196 S 360 176, 420 190"
            className="fill-none stroke-white"
            strokeWidth="2"
            strokeDasharray="10 10"
          />
          {/* công viên nhỏ */}
          <rect x="146" y="232" width="44" height="34" rx="8" className="fill-blue-300" opacity="0.4" />
        </svg>
        <div className="absolute left-[58%] top-[52%] -translate-x-1/2 -translate-y-full">
          <span className="relative flex flex-col items-center">
            <span className="inline-flex size-14 items-center justify-center rounded-pill border-2 border-navy-900 bg-orange-500 text-navy-900 shadow-3">
              <MapPin aria-hidden="true" size={28} strokeWidth={1.75} />
            </span>
            <span className="-mt-1 size-3 rotate-45 border-b-2 border-r-2 border-navy-900 bg-orange-500" />
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-start">
          <Button
            externalHref={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="blue"
            iconEnd={<ExternalLink aria-hidden="true" size={18} strokeWidth={1.75} />}
          >
            {openLabel}
            <span className="sr-only"> {newTabLabel}</span>
          </Button>
        </div>
      </div>
      <figcaption className="mt-3 text-small text-(--surface-muted)">{note}</figcaption>
    </figure>
  );
}
