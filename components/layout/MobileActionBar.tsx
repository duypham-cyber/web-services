'use client';

import { MessageCircle, Phone, UserPlus, FileText } from 'lucide-react';
import { useEffect } from 'react';
import { captureUtm } from '@/components/leads/utm';
import { Link, usePathname } from '@/i18n/navigation';
import type { AppHref } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type MobileActionBarProps = {
  label: string;
  call: { label: string; tel: string };
  /** null = ẩn nút Zalo (link chưa duyệt ở production). draftLabel có giá trị = đang ở bản xem trước. */
  zalo: { label: string; url: string; draftLabel?: string } | null;
  quote: { label: string; href: AppHref };
  register: { label: string; href: AppHref };
};

const ITEM =
  'flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 text-center text-small font-semibold leading-tight no-underline';

/**
 * Thanh hành động dính đáy, chỉ dưới 768px, có safe-area (docs/03 mục 13.1):
 *   Gọi | Zalo | Nhận báo giá — trên /doi-tac-tho nút phải thành "Đăng ký thợ".
 * Root layout chừa sẵn khoảng trống cuối trang để thanh không che footer.
 * Nút phải trỏ tới neo form (#bao-gia / #dang-ky): trang có form thì form tự chặn click và cuộn tới form của trang đó.
 * Thanh có mặt ở MỌI trang nên cũng là nơi ghi utm_* lúc vào site (form lead gửi kèm, contracts/lead-b2b.md mục 3.1).
 */
export function MobileActionBar({ label, call, zalo, quote, register }: MobileActionBarProps) {
  const pathname = usePathname();
  useEffect(() => {
    captureUtm();
  }, []);
  const onPartners = pathname === '/doi-tac-tho';
  const primary = onPartners ? register : quote;

  return (
    <nav
      aria-label={label}
      data-tone="light"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-white pb-[env(safe-area-inset-bottom)] shadow-2 md:hidden"
    >
      <ul className={cn('grid', zalo ? 'grid-cols-3' : 'grid-cols-2')}>
        <li>
          <a href={`tel:${call.tel}`} className={cn(ITEM, 'text-blue-600')}>
            <Phone aria-hidden="true" size={20} strokeWidth={1.75} />
            {call.label}
          </a>
        </li>
        {zalo ? (
          <li className="border-l border-slate-300">
            <a href={zalo.url} target="_blank" rel="noopener noreferrer" className={cn(ITEM, 'text-blue-600')}>
              <MessageCircle aria-hidden="true" size={20} strokeWidth={1.75} />
              <span>
                {zalo.label}
                {zalo.draftLabel ? (
                  <span className="ml-1 rounded-pill border border-dashed border-warning-text bg-orange-50 px-1 text-eyebrow text-warning-text">
                    {zalo.draftLabel}
                  </span>
                ) : null}
              </span>
            </a>
          </li>
        ) : null}
        <li className="p-1.5">
          <Link
            href={primary.href}
            className={cn(ITEM, 'h-full rounded-md border border-orange-700 bg-orange-500 text-navy-900 hover:bg-orange-400')}
          >
            {onPartners ? (
              <UserPlus aria-hidden="true" size={20} strokeWidth={1.75} />
            ) : (
              <FileText aria-hidden="true" size={20} strokeWidth={1.75} />
            )}
            {primary.label}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
