import { Briefcase, CalendarDays, Clock, MapPin, UserRound, Wallet, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export type AppMockupLabels = {
  caption: string;
  badge: string;
  appName: string;
  status: string;
  eyebrow: string;
  jobTitle: string;
  jobArea: string;
  jobTime: string;
  chips: [string, string, string];
  accept: string;
  next: [string, string];
  tabs: [string, string, string, string];
};

/**
 * Minh họa giao diện app thợ dựng bằng HTML + token (dịch được, không có chữ trong ảnh — docs/03 mục 11.4).
 * KHÔNG phải ảnh chụp màn hình thật: luôn có nhãn "Minh họa giao diện". Không số liệu, không tiền, không logo hãng.
 * Toàn bộ phần điện thoại là trang trí (aria-hidden); chú thích cho trình đọc màn hình nằm ở figcaption.
 * Thay bằng ảnh/video thật của thợ cầm app khi có (docs/03 mục 13.5).
 */
export function AppMockup({ labels }: { labels: AppMockupLabels }) {
  const tabIcons = [Briefcase, CalendarDays, Wallet, UserRound] as const;
  return (
    <figure className="relative mx-auto w-full max-w-[19rem]">
      <div className="relative max-md:max-h-[25rem] max-md:overflow-hidden">
        <div
          aria-hidden="true"
          className="relative flex aspect-[9/17.5] flex-col overflow-hidden rounded-xl border-[10px] border-navy-900 bg-blue-50 shadow-3"
        >
          <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-pill bg-navy-900" />
          <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-10">
            <span className="flex items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-md bg-blue-600 text-orange-400">
                <Zap size={18} strokeWidth={2} fill="currentColor" />
              </span>
              <span className="whitespace-nowrap text-small font-semibold text-navy-900">{labels.appName}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill bg-white px-2.5 py-1 text-eyebrow font-semibold tracking-normal text-success-700">
              <span className="size-1.5 rounded-pill bg-success-700" />
              {labels.status}
            </span>
          </div>
          <p className="eyebrow px-4 text-orange-700">{labels.eyebrow}</p>
          <div className="mx-3 mt-2 rounded-lg bg-white p-4 shadow-2">
            <p className="text-body font-semibold leading-snug text-navy-900">{labels.jobTitle}</p>
            <p className="mt-2 flex items-center gap-1.5 text-small text-slate-600">
              <MapPin size={14} strokeWidth={1.75} className="shrink-0 text-blue-600" />
              {labels.jobArea}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-small text-slate-600">
              <Clock size={14} strokeWidth={1.75} className="shrink-0 text-blue-600" />
              {labels.jobTime}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {labels.chips.map((chip) => (
                <span key={chip} className="rounded-sm bg-blue-100 px-2 py-0.5 text-eyebrow font-medium tracking-normal text-blue-600">
                  {chip}
                </span>
              ))}
            </div>
            <span className="mt-4 flex min-h-10 items-center justify-center rounded-md border border-orange-700 bg-orange-500 text-small font-semibold text-navy-900">
              {labels.accept}
            </span>
          </div>
          <div className="mx-3 mt-3 flex flex-col gap-2">
            {labels.next.map((item) => (
              <span key={item} className="rounded-md bg-white px-3 py-2.5 text-small text-slate-600 shadow-1">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-auto grid grid-cols-4 border-t border-slate-300 bg-white px-1 pb-3 pt-2">
            {labels.tabs.map((tab, i) => {
              const Icon = tabIcons[i] ?? Briefcase;
              return (
                <span
                  key={tab}
                  className={`flex flex-col items-center gap-0.5 text-eyebrow tracking-normal ${i === 0 ? 'font-semibold text-blue-600' : 'text-slate-600'}`}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {tab}
                </span>
              );
            })}
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-blue-50 md:hidden" />
      </div>
      <figcaption className="mt-4 flex justify-center">
        <Badge variant="illustration">{labels.badge}</Badge>
        <span className="sr-only">{labels.caption}</span>
      </figcaption>
    </figure>
  );
}
