'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { AppHref } from '@/components/ui/Button';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export type MenuItem = { title: string; description: string; href: AppHref };

type SolutionsMenuProps = {
  label: string;
  menuLabel: string;
  items: MenuItem[];
  overview: { label: string; href: AppHref };
};

/**
 * Mega menu "Giải pháp ▾" (docs/03 mục 13.1): nút mở/đóng (disclosure) — bấm hoặc Enter/Space.
 * Đóng khi: Esc (trả focus về nút), bấm ra ngoài, focus rời menu, đổi trang. State chỉ đổi khi mở/đóng.
 */
export function SolutionsMenu({ label, menuLabel, items, overview }: SolutionsMenuProps) {
  const pathname = usePathname();
  // Lưu pathname lúc mở: đổi trang → tự đóng mà không cần setState trong effect
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof value === 'function' ? value(open) : value;
    setOpenOn(next ? pathname : null);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const active = pathname === '/giai-phap' || pathname.startsWith('/giai-phap/') || pathname === '/ho-tro-khach-hang';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenOn(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenOn(null);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex min-h-11 items-center gap-1 rounded-sm px-3 text-small font-medium',
          'decoration-2 underline-offset-8 hover:underline',
          active && 'underline',
        )}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          size={16}
          strokeWidth={1.75}
          className={cn('transition-transform duration-(--dur-base) ease-standard', open && 'rotate-180')}
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        data-tone="light"
        className="absolute left-0 top-full z-50 mt-2 w-[min(36rem,calc(100vw-2rem))] rounded-lg border border-slate-300 bg-white p-3 shadow-3"
      >
        <p className="sr-only">{menuLabel}</p>
        <ul className="grid gap-1">
          {items.map((item) => (
            <li key={item.title}>
              <Link
                href={item.href}
                className="block rounded-md px-4 py-3 no-underline transition-colors duration-(--dur-fast) hover:bg-blue-50"
              >
                <span className="block text-body font-semibold text-navy-900">{item.title}</span>
                <span className="mt-0.5 block text-small text-slate-600">{item.description}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-slate-300 px-4 pb-1 pt-3">
          <Link href={overview.href} className="text-small font-semibold text-blue-600 underline-offset-4 hover:underline">
            {overview.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
