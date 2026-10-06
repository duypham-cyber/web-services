import {
  BatteryFull,
  BriefcaseBusiness,
  Calendar,
  Camera,
  ChartColumn,
  Circle,
  CircleCheck,
  CircleUserRound,
  ClipboardCheck,
  Clock,
  FileSpreadsheet,
  LayoutDashboard,
  ListChecks,
  MapPin,
  PenLine,
  Signal,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/cn';

/**
 * GIAO DIỆN MINH HỌA (HTML/CSS, không phải ảnh chụp app thật) cho section Công nghệ — docs/03 mục 5, NOI-DUNG mục 9.
 * - aria-hidden: nội dung đã được nói bằng chữ ở danh sách tính năng; khung được gắn nhãn "Giao diện minh họa".
 * - Dữ liệu là ví dụ: tên đối tác dạng [Hãng A], không số liệu tổng hợp (số đơn, doanh thu, thu nhập) để không bị
 *   hiểu nhầm là số thật; tỉnh dùng tên sau sắp xếp 2025; bản EN không dấu tiếng Việt.
 * - Co giãn theo bề rộng khung bằng container query (@container) chứ không theo viewport.
 * - Chữ tối thiểu 12px; mọi cặp màu chữ/nền là cặp đã kiểm tương phản trong bảng token 11.1.
 */

const XS = 'text-eyebrow tracking-normal';

type RowKey = 'r1' | 'r2' | 'r3' | 'r4';
type StatusKey = 'done' | 'installing' | 'confirmed' | 'pending';

const ROWS: readonly { key: RowKey; status: StatusKey }[] = [
  { key: 'r1', status: 'done' },
  { key: 'r2', status: 'installing' },
  { key: 'r3', status: 'confirmed' },
  { key: 'r4', status: 'pending' },
];

const STATUS_CLASS: Record<StatusKey, string> = {
  done: 'bg-white text-success-700 ring-1 ring-success-700',
  installing: 'bg-blue-100 text-blue-600',
  confirmed: 'bg-white text-slate-600 ring-1 ring-slate-500',
  pending: 'bg-orange-50 text-orange-700',
};

const NAV = [
  { key: 'overview', icon: LayoutDashboard },
  { key: 'jobs', icon: ClipboardCheck, active: true },
  { key: 'signoff', icon: Camera },
  { key: 'reconcile', icon: FileSpreadsheet },
  { key: 'reports', icon: ChartColumn },
] as const;

const FILTERS = ['all', 'pending', 'installing', 'done'] as const;

const PHOTOS = [
  { key: 'before', icon: Camera },
  { key: 'after', icon: Camera },
  { key: 'signed', icon: PenLine },
] as const;

/** Bảng điều phối của Hãng/Sàn: danh sách đơn hôm nay, ảnh nghiệm thu, đối soát. */
export async function DashboardMockup({ className, reserveEnd }: { className?: string; reserveEnd?: string }) {
  const t = await getTranslations('home');

  // Cột bảng theo bề rộng khung chính (container query): hẹp → Thiết bị + Trạng thái; vừa → thêm Mã đơn; rộng → đủ 5 cột
  // Cột Trạng thái rộng cố định (không `auto`) để hàng tiêu đề và các hàng dữ liệu thẳng cột với nhau
  const grid =
    'grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-x-3 @sm:grid-cols-[4.75rem_minmax(0,1fr)_8rem] ' +
    '@xl:grid-cols-[4.75rem_minmax(0,1.5fr)_minmax(0,1fr)_5.75rem_8rem]';

  return (
    <div
      aria-hidden="true"
      className={cn('@container overflow-hidden rounded-lg bg-white text-ink-900 shadow-3 ring-1 ring-slate-300', className)}
    >
      {/* Thanh cửa sổ */}
      <div className="flex items-center gap-3 border-b border-slate-300 bg-blue-50 px-4 py-2.5">
        <span className="flex shrink-0 gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2.5 rounded-pill bg-slate-300" />
          ))}
        </span>
        <span className={cn(XS, 'truncate font-semibold text-slate-600')}>{t('technology.mock.windowTitle')}</span>
      </div>

      <div className="flex">
        {/* Thanh điều hướng trái (chỉ khi khung đủ rộng) */}
        <div className="hidden w-44 shrink-0 flex-col gap-1 border-r border-slate-300 p-3 @2xl:flex">
          <div className="mb-3 flex items-center gap-2 px-2 pt-1">
            <span className="inline-flex size-7 items-center justify-center rounded-sm bg-blue-600 text-white">
              <Zap size={15} strokeWidth={2} />
            </span>
            <span className="h-2 w-16 rounded-pill bg-slate-300" />
          </div>
          {NAV.map(({ key, icon: Icon, ...rest }) => {
            const active = 'active' in rest;
            return (
              <span
                key={key}
                className={cn(
                  XS,
                  'flex items-center gap-2 rounded-sm px-2 py-2',
                  active ? 'bg-blue-100 font-semibold text-blue-600' : 'font-medium text-slate-600',
                )}
              >
                <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                {t(`technology.mock.nav.${key}`)}
              </span>
            );
          })}
        </div>

        {/* Khung chính */}
        <div className="@container min-w-0 flex-1 p-4 @lg:p-5">
          <p className="text-small font-semibold text-navy-900">{t('technology.mock.heading')}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTERS.map((f, i) => (
              <span
                key={f}
                className={cn(
                  XS,
                  'rounded-pill px-2.5 py-1 font-medium',
                  i === 0 ? 'bg-blue-600 text-white' : 'bg-blue-50 text-slate-600 ring-1 ring-slate-300',
                )}
              >
                {t(`technology.mock.filters.${f}`)}
              </span>
            ))}
          </div>

          <div className="mt-3 overflow-hidden rounded-md border border-slate-300">
            <div className={cn(grid, XS, 'bg-blue-50 px-3 py-2 font-semibold text-slate-600')}>
              <span className="hidden @sm:block">{t('technology.mock.cols.id')}</span>
              <span>{t('technology.mock.cols.device')}</span>
              <span className="hidden @xl:block">{t('technology.mock.cols.area')}</span>
              <span className="hidden @xl:block">{t('technology.mock.cols.slot')}</span>
              <span className="text-right">{t('technology.mock.cols.status')}</span>
            </div>
            {ROWS.map((row) => (
              <div key={row.key} className={cn(grid, XS, 'border-t border-slate-300 px-3 py-2.5 font-normal')}>
                <span className="hidden font-semibold tabular text-navy-900 @sm:block">{t(`technology.mock.rows.${row.key}.id`)}</span>
                <span className="min-w-0 text-ink-900">{t(`technology.mock.rows.${row.key}.device`)}</span>
                <span className="hidden truncate text-slate-600 @xl:block">{t(`technology.mock.rows.${row.key}.area`)}</span>
                <span className="hidden tabular text-slate-600 @xl:block">{t(`technology.mock.rows.${row.key}.slot`)}</span>
                <span className={cn('justify-self-end whitespace-nowrap rounded-pill px-2 py-0.5 font-semibold', STATUS_CLASS[row.status])}>
                  {t(`technology.mock.status.${row.status}`)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 @xl:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="rounded-md border border-slate-300 p-3">
              <p className={cn(XS, 'font-semibold text-navy-900')}>{t('technology.mock.photos.title')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PHOTOS.map(({ key, icon: Icon }) => (
                  <span key={key} className="flex w-20 flex-col gap-1">
                    <span className="flex aspect-[4/3] items-center justify-center rounded-sm bg-blue-100 text-blue-600">
                      <Icon size={16} strokeWidth={1.75} />
                    </span>
                    <span className={cn(XS, 'font-medium text-slate-600')}>{t(`technology.mock.photos.${key}`)}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-between gap-3 rounded-md bg-blue-600 p-3 text-white">
              <div>
                <p className={cn(XS, 'font-semibold text-white')}>{t('technology.mock.reconcile.title')}</p>
                <p className={cn(XS, 'mt-1 font-medium text-blue-100')}>{t('technology.mock.reconcile.ready')}</p>
              </div>
              <span className={cn(XS, 'inline-flex w-fit items-center gap-1.5 rounded-pill bg-white px-3 py-1 font-semibold text-navy-900')}>
                <FileSpreadsheet size={14} strokeWidth={1.75} />
                {t('technology.mock.reconcile.export')}
              </span>
            </div>
          </div>
        </div>
        {/* Dải trống bên phải: chỗ điện thoại đè lên mà không che cột Trạng thái */}
        {reserveEnd ? <div className={cn('shrink-0', reserveEnd)} /> : null}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'jobs', icon: BriefcaseBusiness, active: true },
  { key: 'schedule', icon: Calendar },
  { key: 'earnings', icon: Wallet },
  { key: 'account', icon: CircleUserRound },
] as const;

/** App thợ: đơn gợi ý theo khu vực/kỹ năng/lịch trống, nghiệm thu bằng ảnh. Không hiện số tiền (không bịa thu nhập). */
export async function PhoneMockup({ className }: { className?: string }) {
  const t = await getTranslations('home');

  return (
    <div aria-hidden="true" className={cn('rounded-xl bg-ink-900 p-2 shadow-3 ring-1 ring-blue-300/40', className)}>
      <div className="overflow-hidden rounded-lg bg-white text-ink-900">
        <div className={cn(XS, 'flex items-center justify-between px-4 pb-1 pt-2.5 font-semibold text-ink-900')}>
          <span className="tabular">{t('technology.mock.phone.time')}</span>
          <span className="flex items-center gap-1">
            <Signal size={13} strokeWidth={2} />
            <Wifi size={13} strokeWidth={2} />
            <BatteryFull size={15} strokeWidth={2} />
          </span>
        </div>

        <div className="flex items-end justify-between gap-2 px-4 pt-2">
          <div>
            <p className={cn(XS, 'font-medium text-slate-600')}>{t('technology.mock.phone.today')}</p>
            <p className="text-small font-semibold text-navy-900">{t('technology.mock.phone.greeting')}</p>
          </div>
          <span className="inline-flex size-8 items-center justify-center rounded-pill bg-blue-100 text-blue-600">
            <CircleUserRound size={18} strokeWidth={1.75} />
          </span>
        </div>

        <div className="mx-3 mt-3 rounded-md border border-blue-100 bg-blue-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(XS, 'rounded-pill bg-orange-50 px-2 py-0.5 font-semibold text-orange-700 ring-1 ring-orange-700/30')}>
              {t('technology.mock.phone.badge')}
            </span>
            <span className={cn(XS, 'inline-flex items-center gap-1 font-medium text-slate-600')}>
              <MapPin size={13} strokeWidth={1.75} />
              {t('technology.mock.phone.distance')}
            </span>
          </div>
          <p className="mt-2 text-small font-semibold leading-snug text-navy-900">{t('technology.mock.phone.jobTitle')}</p>
          <p className={cn(XS, 'mt-1 font-normal text-slate-600')}>{t('technology.mock.phone.jobMeta')}</p>
          <p className={cn(XS, 'mt-1 inline-flex items-center gap-1 font-normal text-slate-600')}>
            <Clock size={13} strokeWidth={1.75} />
            {t('technology.mock.phone.jobSlot')}
          </p>
          <div className="mt-3 flex gap-2">
            <span className={cn(XS, 'flex-1 rounded-pill border border-orange-700 bg-orange-500 py-1.5 text-center font-semibold text-navy-900')}>
              {t('technology.mock.phone.accept')}
            </span>
            <span className={cn(XS, 'flex-1 rounded-pill border border-slate-300 bg-white py-1.5 text-center font-semibold text-slate-600')}>
              {t('technology.mock.phone.later')}
            </span>
          </div>
        </div>

        <div className="mx-3 mt-3 rounded-md border border-slate-300 p-3">
          <p className={cn(XS, 'inline-flex items-center gap-1.5 font-semibold text-navy-900')}>
            <ListChecks size={14} strokeWidth={1.75} className="text-blue-600" />
            {t('technology.mock.phone.checklist')}
          </p>
          <ul className={cn(XS, 'mt-2 space-y-1.5 font-normal')}>
            <li className="flex items-center gap-1.5 text-ink-900">
              <CircleCheck size={14} strokeWidth={2} className="shrink-0 text-success-700" />
              {t('technology.mock.phone.before')}
            </li>
            <li className="flex items-center gap-1.5 text-ink-900">
              <CircleCheck size={14} strokeWidth={2} className="shrink-0 text-success-700" />
              {t('technology.mock.phone.after')}
            </li>
            <li className="flex items-center gap-1.5 text-slate-600">
              <Circle size={14} strokeWidth={2} className="shrink-0 text-slate-500" />
              {t('technology.mock.phone.confirm')}
            </li>
          </ul>
        </div>

        <div className="mt-3 grid grid-cols-4 border-t border-slate-300 px-1 pb-2.5 pt-2">
          {TABS.map(({ key, icon: Icon, ...rest }) => {
            const active = 'active' in rest;
            return (
              <span
                key={key}
                className={cn(XS, 'flex flex-col items-center gap-0.5 font-medium', active ? 'text-blue-600' : 'text-slate-600')}
              >
                <Icon size={16} strokeWidth={1.75} />
                {t(`technology.mock.phone.tabs.${key}`)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
