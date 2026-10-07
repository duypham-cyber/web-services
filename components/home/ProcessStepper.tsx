'use client';

import { useEffect, useRef } from 'react';
import { PIN_QUERY } from './process-pin';

/**
 * Điều khiển "dừng và đi từng bước" của section quy trình (D-34), nằm trong ProcessPin (process-route.tsx).
 * - CSS quyết định bố cục ghim (sticky + đường băng, process-route.module.css). File này chỉ đọc vị trí cuộn và ghi trạng
 *   thái vào DOM khi giá trị đổi: track[data-pin|data-step], trạm[data-state=done|current|todo], --route-offset của nét cam,
 *   --pin-top (khối nằm giữa phần khung nhìn dưới header). Không React state, không bắt wheel/touch/phím (không chiếm cuộn);
 *   chỉ nghe scroll khi PIN_QUERY khớp (desktop có chuột) và khối cách khung nhìn ≤ một màn (không đo bố cục mỗi khung khi
 *   người xem đang ở hero bản đồ — D-35).
 * - Khối không vừa khung nhìn → data-pin=off: CSS bỏ ghim, xoá trạng thái, tuyến quay về hoạt ảnh cũ (vẽ theo cuộn, hoặc vẽ
 *   một lần khi chưa có animation-timeline). Bỏ ghim lúc đang ở giữa đường băng thì cuộn bù để người đọc vẫn ở khối này.
 * - Chạy cả khi html[data-motion] đã thành "off" (JS tới trễ hơn 4 s): CSS ghim theo data-pin="on" do file này ghi, nên JS
 *   tới trễ vẫn đi từng bước được; JS không chạy thì không ghim (D-35).
 * PIN_QUERY (process-pin.ts) trùng media query chế độ ghim trong process-route.module.css (tests/unit/process-pin.test.ts kiểm).
 */

/** Thẻ nền bước hiện tại tràn 1,25rem + bóng shadow-2 xuống dưới khối: chừa chỗ khi kiểm "vừa khung nhìn". */
const CARD_OVERFLOW = 32;

export function ProcessStepper({ hold }: { hold: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const track = ref.current?.closest<HTMLElement>('[data-step-track]');
    const stage = track?.querySelector<HTMLElement>('[data-step-stage]');
    const runway = track?.querySelector<HTMLElement>('[data-step-runway]');
    // Không có thuộc tính data-motion = reduced-motion / Save-Data: không ghim, không làm gì
    if (!track || !stage || !runway || !html.hasAttribute('data-motion')) return;
    const stations = Array.from(track.querySelectorAll<HTMLElement>('[data-step-k]'));
    if (stations.length < 2) {
      track.dataset.pin = 'off';
      return () => {
        delete track.dataset.pin;
      };
    }

    const n = stations.length;
    const trailStart = Number(track.dataset.trailStart ?? 0);
    const mq = window.matchMedia(PIN_QUERY);
    const readHeader = () => parseFloat(getComputedStyle(html).getPropertyValue('--header-h')) || 0;
    let header = readHeader();
    let frame = 0;
    let shown = -2;
    let pinTop = 0; // 0 = đang không ghim
    let near = false;

    const show = (s: number) => {
      if (s === shown) return;
      shown = s;
      if (s < 0) {
        delete track.dataset.step;
        stations.forEach((el) => delete el.dataset.state);
        track.style.removeProperty('--route-offset');
        return;
      }
      track.dataset.step = String(s);
      stations.forEach((el, k) => {
        el.dataset.state = k < s ? 'done' : k === s ? 'current' : 'todo';
      });
      const span = n - 1 - trailStart;
      const progress = span > 0 ? Math.min(1, Math.max(0, (s - trailStart) / span)) : 1;
      // Độ dài px sẵn (CSS không phải tính calc() trên <number>); pathLength=1 nên 1px = cả tuyến
      track.style.setProperty('--route-offset', `${1 - progress}px`);
    };

    const unpin = () => {
      if (pinTop) {
        // Đang ở giữa đường băng: đường băng biến mất → cuộn bù để người đọc vẫn đứng ở khối quy trình
        const scrolled = pinTop - track.getBoundingClientRect().top;
        const back = Math.min(Math.max(scrolled, 0), runway.offsetHeight);
        pinTop = 0;
        track.dataset.pin = 'off';
        track.style.removeProperty('--pin-top');
        if (back > 0) window.scrollBy(0, -back);
      } else if (track.dataset.pin !== 'off') {
        track.dataset.pin = 'off';
        track.style.removeProperty('--pin-top');
      }
      show(-1);
    };

    const measure = () => {
      frame = 0;
      const base = header + 24;
      const stageH = stage.offsetHeight;
      if (!mq.matches || stageH + CARD_OVERFLOW > window.innerHeight - base) {
        unpin();
        return;
      }
      const top = Math.max(base, Math.round((window.innerHeight + header - stageH) / 2));
      if (track.dataset.pin !== 'on') track.dataset.pin = 'on';
      if (top !== pinTop) {
        pinTop = top;
        track.style.setProperty('--pin-top', `${top}px`);
      }
      const runwayH = runway.offsetHeight;
      if (runwayH === 0) {
        // CSS không ghim dù JS cho phép (lệch điều kiện): đừng để một trạm "current" giữa bố cục tĩnh
        unpin();
        return;
      }
      // Mỗi trạng thái (00 → trạm cuối) giữ đúng một đoạn bước kể từ lúc ghim; trạm cuối giữ `hold` đoạn rồi nhả.
      const stepPx = runwayH / (n - 1 + hold);
      const scrolled = pinTop - track.getBoundingClientRect().top;
      show(Math.min(n - 1, Math.max(0, Math.floor(scrolled / stepPx))));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const onResize = () => {
      header = readHeader();
      schedule();
    };
    // Chỉ nghe cuộn khi có thể ghim (điện thoại, máy tính bảng, cửa sổ hẹp không chạy gì mỗi khung hình) và khối ở gần
    const listen = () => {
      window.removeEventListener('scroll', schedule);
      if (mq.matches && near) window.addEventListener('scroll', schedule, { passive: true });
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        near = entry?.isIntersecting ?? true;
        listen();
        if (near) schedule();
      },
      { rootMargin: '100% 0px' },
    );
    const onQuery = () => {
      listen();
      onResize();
    };

    measure();
    io.observe(track);
    window.addEventListener('resize', onResize);
    mq.addEventListener('change', onQuery);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      mq.removeEventListener('change', onQuery);
      delete track.dataset.pin;
      track.style.removeProperty('--pin-top');
      show(-1);
    };
  }, [hold]);

  return <span ref={ref} hidden />;
}
