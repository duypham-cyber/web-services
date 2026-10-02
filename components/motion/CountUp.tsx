'use client';

import { useEffect, useRef } from 'react';
import type { Locale } from '@/i18n/routing';
import { formatStatValue, type StatFormat } from '@/lib/format';

type CountUpProps = {
  value: number;
  format: StatFormat;
  locale: Locale;
  unit?: string;
  durationMs?: number;
  className?: string;
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * `count-up` (docs/03 mục 12.2): giá trị CUỐI có sẵn trong HTML server render (SEO, no-JS, reduced-motion).
 * Khi vào khung nhìn lần đầu: chạy 0 → value trong 1.200 ms bằng rAF, ghi thẳng textContent
 * (KHÔNG setState mỗi frame — bài học FE-01). Trình đọc màn hình đọc bản sr-only (luôn là số cuối).
 */
export function CountUp({ value, format, locale, unit, durationMs = 1200, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const finalText = formatStatValue(value, format, locale, unit);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const motion = document.documentElement.dataset.motion;
    if (motion !== 'pending' && motion !== 'ready') return; // reduced-motion, Save-Data, không cho phép chuyển động
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          el.textContent = t < 1 ? formatStatValue(value * easeOut(t), format, locale, unit) : finalText;
          if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = finalText;
    };
  }, [value, format, locale, unit, durationMs, finalText]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true" className="tabular" style={{ display: 'inline-block', minWidth: `${finalText.length}ch` }}>
        {finalText}
      </span>
      <span className="sr-only">{finalText}</span>
    </span>
  );
}
