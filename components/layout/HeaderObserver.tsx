'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';

/**
 * Không có giao diện. Gắn hai IntersectionObserver và chỉ ghi data-attribute lên <header data-site-header>:
 *   data-scrolled="true"   khi đã cuộn khỏi đầu trang → header có bóng shadow-1
 *   data-past-film="true"  khi đã cuộn qua vùng [data-film-zone] → header hết trong suốt (CSS ở app/globals.css)
 * Không lắng nghe scroll, không setState (docs/03 mục 13.1). Chạy lại khi đổi trang.
 *
 * Agent phim: đặt `data-film-zone` lên PHẦN TỬ BAO TOÀN BỘ đoạn phim (track cuộn), không chỉ màn đầu.
 */
export function HeaderObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    if (!header) return;
    const observers: IntersectionObserver[] = [];

    const sentinel = document.querySelector('[data-scroll-sentinel]');
    if (sentinel) {
      const io = new IntersectionObserver(([entry]) => {
        header.dataset.scrolled = entry && !entry.isIntersecting ? 'true' : 'false';
      });
      io.observe(sentinel);
      observers.push(io);
    }

    const zone = document.querySelector('[data-film-zone]');
    if (zone) {
      const io = new IntersectionObserver(
        ([entry]) => {
          header.dataset.pastFilm = entry && !entry.isIntersecting ? 'true' : 'false';
        },
        { rootMargin: `-${Math.round(header.offsetHeight)}px 0px 0px 0px` },
      );
      io.observe(zone);
      observers.push(io);
    } else {
      delete header.dataset.pastFilm;
    }

    return () => observers.forEach((io) => io.disconnect());
  }, [pathname]);

  return null;
}
