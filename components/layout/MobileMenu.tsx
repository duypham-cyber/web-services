'use client';

import { Menu, Phone, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Button, type AppHref } from '@/components/ui/Button';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export type MobileNavGroup = {
  /** Tiêu đề nhóm (vd "Giải pháp"); bỏ trống = danh sách link thường. */
  title?: string;
  items: { label: string; href: AppHref }[];
};

type MobileMenuProps = {
  labels: { open: string; close: string; nav: string };
  groups: MobileNavGroup[];
  localeSwitch: ReactNode;
  logo: ReactNode;
  phone: { label: string; display: string; tel: string };
  cta: { label: string; href: AppHref };
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Menu mobile dạng sheet (< 1280px): <dialog> modal → nền phía sau bị khóa (inert), Esc đóng,
 * Tab/Shift+Tab vòng trong menu (focus trap), đóng xong trả focus về nút ☰. Đổi trang → tự đóng.
 */
export function MobileMenu({ labels, groups, localeSwitch, logo, phone, cta }: MobileMenuProps) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Đồng bộ state → <dialog> (chỉ gọi API DOM, không setState)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== 'Tab') return;
    const nodes = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={labels.open}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpenOn(pathname)}
        className="inline-flex size-11 items-center justify-center rounded-pill transition-colors duration-(--dur-base) hover:bg-blue-50 hover:text-navy-900"
      >
        <Menu aria-hidden="true" size={24} strokeWidth={1.75} />
      </button>

      <dialog
        ref={dialogRef}
        data-mobile-menu=""
        data-tone="light"
        aria-label={labels.nav}
        onClose={() => {
          setOpenOn(null);
          triggerRef.current?.focus();
        }}
        onKeyDown={onKeyDown}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpenOn(null); // bấm vào nền mờ
        }}
        className={cn(
          'sheet-enter fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-[min(100vw,26rem)] max-w-none',
          'overflow-hidden bg-white p-0 text-ink-900 shadow-3 backdrop:bg-navy-900/60',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-(--header-h) shrink-0 items-center justify-between border-b border-slate-300 px-gutter">
            {logo}
            <button
              type="button"
              aria-label={labels.close}
              onClick={() => setOpenOn(null)}
              className="inline-flex size-11 items-center justify-center rounded-pill text-navy-900 hover:bg-blue-50"
            >
              <X aria-hidden="true" size={24} strokeWidth={1.75} />
            </button>
          </div>

          <nav aria-label={labels.nav} className="flex-1 overflow-y-auto px-gutter py-4">
            {groups.map((group, gi) => (
              <div key={group.title ?? `g${gi}`} className={cn(gi > 0 && 'mt-4 border-t border-slate-300 pt-4')}>
                {group.title ? <p className="eyebrow mb-1 text-orange-700">{group.title}</p> : null}
                <ul>
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="flex min-h-12 items-center rounded-sm text-body font-medium text-navy-900 no-underline hover:text-blue-600"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="shrink-0 border-t border-slate-300 px-gutter pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              {localeSwitch}
              <a
                href={`tel:${phone.tel}`}
                className="inline-flex min-h-11 items-center gap-2 text-body font-semibold text-blue-600 no-underline tabular"
              >
                <Phone aria-hidden="true" size={18} strokeWidth={1.75} />
                <span className="sr-only">{phone.label}: </span>
                {phone.display}
              </a>
            </div>
            <Button href={cta.href} variant="primary" size="lg" fullWidth>
              {cta.label}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
