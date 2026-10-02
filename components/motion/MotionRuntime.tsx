'use client';

import { useEffect } from 'react';

const SELECTOR = '[data-motion-item]:not([data-inview])';

/**
 * Bộ máy motion ngoài phim — MỘT IntersectionObserver cho cả trang (docs/03 mục 12.3, tầng Lite/Full).
 * Không import GSAP (GSAP chỉ nằm trong chunk phim). Không setState. Gắn một lần ở root layout.
 *
 * Trạng thái html[data-motion]: (không có) = không chuyển động · pending = script đầu trang cho phép, chờ JS
 * · ready = đang chạy · off = hết 4 s chưa sẵn sàng → hiện hết (script trong components/motion/motion-script.ts).
 */
export function MotionRuntime() {
  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.motion !== 'pending' && html.dataset.motion !== 'ready') return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.inview = '';
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    const observeWithin = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => io.observe(el));
    };
    observeWithin(document);
    html.dataset.motion = 'ready';

    // Trang mới sau điều hướng phía client: quan sát phần tử vừa được thêm
    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(SELECTOR)) io.observe(node);
          observeWithin(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
