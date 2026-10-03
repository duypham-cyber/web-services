/**
 * Nhãn HTML bám cảnh 3D (chunk cảnh — không nằm trong JS tải đầu). DOM nhãn do FilmHero render sẵn ở server
 * ([data-hero-labels] [data-label]); file này chỉ chiếu vị trí từ scene.project() mỗi khung vẽ và chống chồng nhãn.
 *
 * Luật (contracts/hero-map.md AC-MAP-1/2/6):
 *   - Hai quần đảo: ưu tiên cao nhất, KHÔNG bao giờ bị ẩn vì chống chồng; nhãn được kéo vào trong khung (dưới header).
 *     Chỉ ẩn khi mọi chấm đảo đã ra khỏi khung — khi đó minimap (desktop) vẽ đủ hai quần đảo có tên.
 *   - Không nhãn nào đè vùng chấm đảo; nhãn tỉnh né khối chữ, panel tour, thẻ đơn minh hoạ, minimap và dải header.
 *   - Toạ độ làm tròn px (translate3d), chỉ ghi DOM khi đổi.
 */
import type { ProjectedFrame } from '@/components/film/map3d';

type Box = [number, number, number, number];
type Kind = 'arch' | 'hq' | 'sea' | 'chip' | 'city';
type Region = 'north' | 'central' | 'south';
type Item = {
  id: string;
  el: HTMLElement;
  box: HTMLElement;
  kind: Kind;
  code?: string;
  region?: Region;
  major: boolean;
  /** Khung chữ so với điểm neo (px). */
  ox: number;
  oy: number;
  w: number;
  h: number;
  x: number;
  y: number;
  op: number;
};

const REGION_INDEX: Region[] = ['north', 'central', 'south'];
/** Tỉnh có nhãn ở cảnh toàn quốc/toàn mạng lưới (như bản mẫu): Hà Nội, Đà Nẵng; mobile chỉ Hà Nội. */
const NATIONAL = { desktop: new Set(['01', '48']), mobile: new Set(['01']) };
const PRIO: Record<Kind, number> = { arch: 100, hq: 90, chip: 80, city: 30, sea: 40 };

/** Chồng nhau (chừa 4 px giữa hai nhãn). */
const hit = (a: Box, b: Box) => a[0] < b[0] + b[2] + 4 && a[0] + a[2] + 4 > b[0] && a[1] < b[1] + b[3] + 4 && a[1] + a[3] + 4 > b[1];

export function createLabels(layer: HTMLElement, mobile: boolean) {
  const items: Item[] = Array.from(layer.querySelectorAll<HTMLElement>('[data-label]')).map((el) => {
    const id = el.dataset.label!;
    const kind = el.dataset.kind as Kind;
    return {
      id,
      el,
      box: (kind === 'chip' ? el.querySelector<HTMLElement>('[data-side]') : (el.firstElementChild as HTMLElement | null)) ?? el,
      kind,
      code: id.startsWith('p:') || id.startsWith('chip:') ? id.split(':')[1] : undefined,
      region: el.dataset.region as Region | undefined,
      major: el.dataset.major !== undefined,
      ox: 0,
      oy: 0,
      w: 0,
      h: 0,
      x: NaN,
      y: NaN,
      op: -1,
    };
  });
  // nhãn ưu tiên cao xếp chỗ trước; cùng ưu tiên thì TP trực thuộc TW trước
  items.sort((a, b) => PRIO[b.kind] + (b.major ? 30 : 0) - (PRIO[a.kind] + (a.major ? 30 : 0)));

  function measure() {
    for (const it of items) {
      it.el.style.transform = 'translate3d(0px, 0px, 0)';
      const a = it.el.getBoundingClientRect();
      const r = it.box.getBoundingClientRect();
      it.ox = r.left - a.left;
      it.oy = r.top - a.top;
      it.w = r.width;
      it.h = r.height;
      it.x = NaN;
    }
  }

  function write(it: Item, x: number, y: number, op: number) {
    if (op > 0.01 && (Math.round(x) !== it.x || Math.round(y) !== it.y)) {
      it.x = Math.round(x);
      it.y = Math.round(y);
      it.el.style.transform = `translate3d(${it.x}px, ${it.y}px, 0)`;
    }
    if (Math.abs(op - it.op) > 0.004) {
      it.op = op;
      it.el.style.opacity = op.toFixed(3);
      it.el.style.visibility = op > 0.01 ? 'visible' : 'hidden';
    }
  }

  /**
   * Đặt nhãn cho khung `f`. `avoid` = các khung không được đè (khối chữ, panel, thẻ đơn, minimap), toạ độ của lớp nhãn.
   * Trả khung của hai nhãn quần đảo (để test/minimap biết).
   */
  function place(f: ProjectedFrame, avoid: Box[], topInset: number) {
    const W = f.width;
    const H = f.height;
    const w = f.weights;
    const placed: Box[] = avoid.slice();
    for (const a of f.archipelagos) placed.push([a.box.left - 10, a.box.top - 10, a.box.right - a.box.left + 20, a.box.bottom - a.box.top + 20]);
    const national = Math.max(w.national, w.network);
    const nat = NATIONAL[mobile ? 'mobile' : 'desktop'];
    const prov = new Map(f.provinces.map((p) => [p.code, p]));

    for (const it of items) {
      let px = 0;
      let py = 0;
      let vis = false;
      let weight = 0;
      if (it.kind === 'arch') {
        const a = f.archipelagos.find((q) => `arch:${q.id}` === it.id);
        if (a) {
          px = a.x;
          py = a.y;
          vis = a.box.right >= 0 && a.box.left <= W && a.box.bottom >= 0 && a.box.top <= H;
          weight = 1;
        }
      } else if (it.kind === 'hq') {
        ({ x: px, y: py, visible: vis } = f.hq);
        weight = Math.max(w.national, w.south, w.network);
      } else if (it.kind === 'sea') {
        ({ x: px, y: py, visible: vis } = f.sea);
        weight = Math.max(w.national, w.central, w.network);
      } else {
        const p = it.code ? prov.get(it.code) : undefined;
        if (p) {
          px = p.x;
          py = p.y;
          vis = p.visible;
          if (it.kind === 'chip') weight = mobile ? 0 : national;
          else {
            const regionW = w[REGION_INDEX[p.region]!];
            weight = Math.max(regionW, nat.has(p.code) ? national : 0);
          }
        }
      }
      let op = vis ? weight : 0;
      if (op <= 0.01) {
        write(it, px, py, 0);
        continue;
      }
      const lw = it.w;
      const lh = it.h;
      const at = (bx: number, by: number): Box => [bx, by, lw, lh];
      const base = at(px + it.ox, py + it.oy);
      const cands: Box[] =
        it.kind === 'city'
          ? [base, at(px - lw / 2, py + 14)]
          : it.kind === 'hq'
            ? // thứ tự giống nhãn tĩnh trên poster (desktop trái-dưới, mobile giữa-dưới) để khỏi nhảy khi canvas hiện
              mobile
              ? [at(px - lw / 2, py + 12), base, at(px - 14 - lw, py + 10)]
              : [at(px - 14 - lw, py + 10), base, at(px + 14, py - 10 - lh)]
            : [base];
      const clampX = (b: Box): Box => [Math.min(Math.max(b[0], 8), W - 8 - lw), b[1], lw, lh];
      let box = it.kind === 'chip' ? base : clampX(base);
      if (it.kind === 'arch') {
        // kéo vào trong khung, dưới dải header; không bao giờ ẩn vì chồng nhãn
        box = [box[0], Math.min(Math.max(box[1], topInset + 4), H - 8 - lh), lw, lh];
      } else {
        const ok = (b: Box) => b[1] >= topInset && b[1] + b[3] <= H - 4 && !placed.some((q) => hit(b, q));
        const free = cands.map((b) => (it.kind === 'chip' ? b : clampX(b))).find(ok);
        if (free) box = free;
        else op = 0;
      }
      if (op > 0.01) placed.push(box);
      write(it, box[0] - it.ox, box[1] - it.oy, op);
    }
  }

  function hide() {
    for (const it of items) write(it, it.x, it.y, 0);
  }

  return { measure, place, hide };
}
