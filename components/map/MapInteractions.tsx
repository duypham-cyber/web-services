'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import styles from './VietnamMap.module.css';

/** Nội dung thẻ của một tỉnh hoặc một quần đảo — chuỗi đã dịch và định dạng sẵn ở server. */
export type MapCard = {
  title: string;
  meta: string;
  region: { id: 'north' | 'central' | 'south'; name: string };
  stat?: { label: string; value: string };
  /** Điểm neo thẻ, tỉ lệ 0..1 của khung (tâm tỉnh; mép trái cụm đảo). */
  x: number;
  y: number;
};

type MapInteractionsProps = {
  /** Khóa = mã tỉnh ("48") hoặc id quần đảo ("hoang-sa"). */
  cards: Record<string, MapCard>;
  /** Dòng hướng dẫn dưới bản đồ khi chưa chọn tỉnh. */
  hint: string;
};

type Rect = { left: number; top: number; right: number; bottom: number };

const GAP = 14; // khoảng cách thẻ ↔ điểm neo (px)
const EDGE = 8; // lề trong khung (px)
const GUARD = 6; // vùng đệm quanh quần đảo + nhãn (px)
/** Khung hẹp hơn mức này (mobile): thông tin hiện ở dải dưới bản đồ thay cho thẻ nổi — không che bản đồ. */
const FLOATING_MIN_WIDTH = 440;

const SWATCH = {
  north: styles.swatchNorth,
  central: styles.swatchCentral,
  south: styles.swatchSouth,
} as const;

const intersects = (a: Rect, b: Rect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

function CardBody({ data }: { data: MapCard }) {
  return (
    <>
      <p className={styles.cardTitle}>{data.title}</p>
      <p className={styles.cardMeta}>{data.meta}</p>
      <p className={styles.cardRegion}>
        <span className={cn(styles.swatch, SWATCH[data.region.id])} />
        {data.region.name}
      </p>
      {data.stat ? (
        <p className={styles.cardStat}>
          <span className={styles.cardStatLabel}>{data.stat.label}</span>
          <span className={styles.cardStatValue}>{data.stat.value}</span>
        </p>
      ) : null}
    </>
  );
}

/**
 * Tương tác bản đồ (đảo client nhỏ, không kéo d3): rê chuột (desktop) hoặc chạm (mobile) vào tỉnh/quần đảo →
 * tên, loại, vùng, số thợ hoặc "chưa có số".
 *   - Khung ≥ 440px: thẻ nổi cạnh tỉnh. Thẻ KHÔNG BAO GIỜ đè hai quần đảo và nhãn (NFR-MAP-01 b): thử các vị trí
 *     quanh điểm neo, bỏ vị trí giao vùng cấm, chọn vị trí gần nhất; hết chỗ thì chuyển xuống dải dưới bản đồ.
 *   - Khung hẹp (mobile): thông tin hiện ở dải dưới bản đồ (ngoài khung), bản đồ không bị che.
 * Thẻ/dải aria-hidden: thông tin đầy đủ nằm ở bảng 34 tỉnh (/mang-luoi). Chỉ setState khi rê/chạm, không khi cuộn.
 */
export function MapInteractions({ cards, hint }: MapInteractionsProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const activeElRef = useRef<Element | null>(null);
  const pointerTypeRef = useRef<string>('mouse');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [inStrip, setInStrip] = useState(false);

  const partsOf = () => {
    const root = cardRef.current?.closest<HTMLElement>('[data-map-root]') ?? null;
    const frame = root?.querySelector<HTMLElement>('[data-map-frame]') ?? null;
    return { root, frame };
  };

  const markActive = useCallback((el: Element | null) => {
    activeElRef.current?.removeAttribute('data-active');
    activeElRef.current = el;
    el?.setAttribute('data-active', '');
  }, []);

  const close = useCallback(() => {
    markActive(null);
    setActiveKey(null);
  }, [markActive]);

  // Gắn sự kiện một lần trên khung bản đồ (event delegation, không gắn từng path)
  useEffect(() => {
    const { root, frame } = partsOf();
    if (!root || !frame) return;
    frame.dataset.mapInteractive = '';

    const targetOf = (event: Event) => (event.target as Element | null)?.closest?.('[data-card-key]') ?? null;
    const highlightOf = (el: Element) => el.closest('[data-arch]') ?? el;

    const open = (el: Element) => {
      const key = el.getAttribute('data-card-key');
      if (!key || !(key in cards)) return;
      markActive(highlightOf(el));
      setActiveKey(key);
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return; // chạm: xử lý ở click
      const el = targetOf(event);
      if (el) open(el);
      else close();
    };
    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') close();
    };
    const onClick = (event: MouseEvent) => {
      const el = targetOf(event);
      if (!el) return close();
      if (pointerTypeRef.current === 'touch' && activeElRef.current === highlightOf(el)) return close(); // chạm lại → đóng
      open(el);
    };
    const onDocPointerDown = (event: PointerEvent) => {
      pointerTypeRef.current = event.pointerType || 'mouse';
      if (!root.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    frame.addEventListener('pointerover', onPointerOver);
    frame.addEventListener('pointerleave', onPointerLeave);
    frame.addEventListener('click', onClick);
    document.addEventListener('pointerdown', onDocPointerDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    return () => {
      frame.removeEventListener('pointerover', onPointerOver);
      frame.removeEventListener('pointerleave', onPointerLeave);
      frame.removeEventListener('click', onClick);
      document.removeEventListener('pointerdown', onDocPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      delete frame.dataset.mapInteractive;
    };
  }, [cards, close, markActive]);

  // Đặt thẻ nổi trước khi vẽ: đo khung, thẻ, vùng cấm rồi chọn vị trí hợp lệ gần điểm neo nhất
  useLayoutEffect(() => {
    const card = cardRef.current;
    const { root, frame } = partsOf();
    if (!card || !root || !frame) return;
    const legend = frame.querySelector('[data-map-legend]');
    const hide = (strip: boolean) => {
      card.removeAttribute('data-open');
      legend?.removeAttribute('data-covered');
      setInStrip(strip);
    };
    const data = activeKey ? cards[activeKey] : undefined;
    if (!data) return hide(false);

    // Toạ độ theo khung chứa của thẻ (root). Khung bản đồ là con đầu tiên của root.
    const rr = root.getBoundingClientRect();
    const fr = frame.getBoundingClientRect();
    const fx = fr.left - rr.left + frame.clientLeft;
    const fy = fr.top - rr.top + frame.clientTop;
    const fw = frame.clientWidth;
    const fh = frame.clientHeight;
    if (fw < FLOATING_MIN_WIDTH) return hide(true);

    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const ax = fx + data.x * fw;
    const ay = fy + data.y * fh;
    const rectsOf = (selector: string, pad: number): Rect[] =>
      Array.from(frame.querySelectorAll(selector)).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          left: r.left - rr.left - pad,
          top: r.top - rr.top - pad,
          right: r.right - rr.left + pad,
          bottom: r.bottom - rr.top + pad,
        };
      });
    // NFR-MAP-01: cấm tuyệt đối khung bao các đảo nhìn thấy của từng quần đảo + nhãn, cộng vùng đệm
    const protectedRects = [
      ...Array.from(frame.querySelectorAll('[data-arch]')).map((group) => {
        const parts = Array.from(group.querySelectorAll('[data-arch-visual]')).map((el) => el.getBoundingClientRect());
        return {
          left: Math.min(...parts.map((r) => r.left)) - rr.left - GUARD,
          top: Math.min(...parts.map((r) => r.top)) - rr.top - GUARD,
          right: Math.max(...parts.map((r) => r.right)) - rr.left + GUARD,
          bottom: Math.max(...parts.map((r) => r.bottom)) - rr.top + GUARD,
        };
      }),
      ...rectsOf('[data-arch-label]', GUARD),
    ];
    const softRects = rectsOf('[data-map-legend]', 4); // chú giải: tránh nếu được

    const minX = fx + EDGE;
    const minY = fy + EDGE;
    const maxX = fx + fw - w - EDGE;
    const maxY = fy + fh - h - EDGE;
    if (maxX < minX || maxY < minY) return hide(true); // thẻ lớn hơn khung
    const clampX = (x: number) => Math.min(Math.max(x, minX), maxX);
    const clampY = (y: number) => Math.min(Math.max(y, minY), maxY);
    const options: [number, number][] = [];
    for (const y of [ay - h / 2, ay - 18, ay - h + 18]) options.push([ax - GAP - w, y], [ax + GAP, y]); // trái, phải
    for (const x of [ax - w / 2, ax - 18, ax - w + 18, minX]) options.push([x, ay - GAP - h], [x, ay + GAP]); // trên, dưới
    options.push([minX, maxY], [minX, minY]); // hai góc trái

    const place = (avoid: Rect[]): [number, number] | null => {
      let best: [number, number] | null = null;
      let bestDistance = Infinity;
      for (const [x0, y0] of options) {
        const x = clampX(x0);
        const y = clampY(y0);
        const box = { left: x, top: y, right: x + w, bottom: y + h };
        if (ax > box.left - 4 && ax < box.right + 4 && ay > box.top - 4 && ay < box.bottom + 4) continue; // che điểm neo
        if (avoid.some((a) => intersects(box, a))) continue;
        const distance = Math.hypot(x + w / 2 - ax, y + h / 2 - ay);
        if (distance < bestDistance) {
          best = [x, y];
          bestDistance = distance;
        }
      }
      return best;
    };

    const spot = place([...protectedRects, ...softRects]) ?? place(protectedRects);
    if (!spot) return hide(true); // hết chỗ an toàn trong khung → dải dưới bản đồ
    setInStrip(false);
    card.style.transform = `translate(${Math.round(spot[0])}px, ${Math.round(spot[1])}px)`;
    card.setAttribute('data-open', '');
    const box = { left: spot[0], top: spot[1], right: spot[0] + w, bottom: spot[1] + h };
    if (softRects.some((a) => intersects(box, a))) legend?.setAttribute('data-covered', '');
    else legend?.removeAttribute('data-covered');
  }, [activeKey, cards]);

  const data = activeKey ? cards[activeKey] : undefined;
  return (
    <>
      <div ref={cardRef} className={styles.card} data-map-card="" aria-hidden="true">
        {data ? <CardBody data={data} /> : null}
      </div>
      <div className={styles.strip} data-map-strip="" data-active={data && inStrip ? '' : undefined} aria-hidden="true">
        {data && inStrip ? (
          <div className={styles.stripCard}>
            <CardBody data={data} />
          </div>
        ) : (
          <p className={styles.hint}>{hint}</p>
        )}
      </div>
    </>
  );
}
