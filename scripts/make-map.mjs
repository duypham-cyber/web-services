#!/usr/bin/env node
/**
 * make-map.mjs — bản đồ 34 tỉnh ĐÃ CHIẾU sẵn lúc build (docs/04 mục 6.3 P6, NFR-MAP-01).
 * Trình duyệt KHÔNG tải d3/topojson: component chỉ đọc chuỗi path và toạ độ đã tính ở đây.
 *
 *   node scripts/make-map.mjs           sinh lại 3 file đầu ra
 *   node scripts/make-map.mjs --check   chỉ kiểm: thoát mã 1 nếu file đã commit lệch với dữ liệu nguồn
 *
 * Nguồn:  public/data/vn34.topo.json (thanglequoc/vietnamese-provinces-database, MIT; object "vn34-all", 34 tỉnh,
 *         CÓ quần đảo Hoàng Sa trong TP. Đà Nẵng và quần đảo Trường Sa trong tỉnh Khánh Hòa)
 *         content/provinces.ts (mã tỉnh, vùng, nhãn hai quần đảo — Node 22.18+ tự bỏ kiểu TypeScript khi import)
 * Đầu ra: components/map/vn34-map.generated.ts  path + tâm tỉnh + khung hai quần đảo + vị trí nhãn (component dùng)
 *         public/data/vn34-map.svg, public/data/vn34-map.en.svg  ảnh SVG độc lập có nhãn (OG, poster, pháp chế xem)
 *
 * Phép chiếu Mercator (d3-geo), khung 600×800 (tỉ lệ 3:4 của VietnamMap). Toạ độ làm tròn 0,1 đơn vị, path viết
 * dạng tương đối. Script FAIL nếu khung không chứa trọn Hoàng Sa (Đà Nẵng, tới ~112,63°E) và Trường Sa (Khánh Hòa,
 * tới ~117,83°E) cùng nhãn của chúng.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { geoMercator } from 'd3-geo';
import { feature } from 'topojson-client';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

// Node in cảnh báo "MODULE_TYPELESS_PACKAGE_JSON" khi import file .ts — vô hại, tắt cho gọn log.
process.removeAllListeners('warning');
const { provinces, archipelagos } = await import(join(ROOT, 'content/provinces.ts'));
// Màu ảnh SVG độc lập lấy từ styles/tokens.css (nguồn token duy nhất) — không viết hex ở đây
const { readColorTokens } = await import(join(ROOT, 'lib/tokens.ts'));
const C = readColorTokens(ROOT);

// ---------------------------------------------------------------------------------------------
// Khung và bố cục (đơn vị viewBox). Tỉ lệ 3:4 khớp khung cố định của VietnamMap.
// ---------------------------------------------------------------------------------------------
const W = 600;
const H = 800;
const PAD_X = 22; // lề trái/phải của dữ liệu (Điện Biên ở mép trái, Trường Sa ở mép phải)
const TOP = 80; // khoảng trống phía trên điểm cực Bắc (chú giải nằm góc phải trên)
const ROUND = 10; // làm tròn 0,1 đơn vị

/** Ranh giới tách phần quần đảo khỏi phần đất liền của tỉnh cha (độ). */
const ARCH_RULES = {
  'hoang-sa': { parentCode: '48', isPart: (b) => b.minLon > 110 },
  'truong-sa': { parentCode: '56', isPart: (b) => b.minLon > 109.45 }, // bờ biển Khánh Hòa tới ~109,44°E
};
/** Giới hạn kinh độ phía đông phải có trong khung (docs/04 P6). */
const EXPECT_EAST = { 'hoang-sa': 112.6, 'truong-sa': 117.8 };

// ---------------------------------------------------------------------------------------------
// Đọc TopoJSON, giải mã arc (lượng tử + delta) sang kinh/vĩ độ
// ---------------------------------------------------------------------------------------------
const topo = JSON.parse(readFileSync(join(ROOT, 'public/data/vn34.topo.json'), 'utf8'));
const object = topo.objects['vn34-all'];
if (!object || object.geometries.length !== 34) throw new Error('vn34.topo.json: cần object "vn34-all" có 34 geometry');

const [sx, sy] = topo.transform.scale;
const [tx, ty] = topo.transform.translate;
const arcsLonLat = topo.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * sx + tx, y * sy + ty];
  });
});

const fc = feature(topo, object);
const projection = geoMercator().fitWidth(W - 2 * PAD_X, fc);
{
  // fitWidth đặt dữ liệu ở [0, W-2·PAD_X] × [0, …]; dời về lề trái PAD_X, đỉnh TOP
  const [t0, t1] = projection.translate();
  projection.translate([t0 + PAD_X, t1 + TOP]);
}

/** Toạ độ đã chiếu, làm tròn về số nguyên (đơn vị 1/ROUND) để path tương đối không cộng dồn sai số. */
const projectArc = (arc) => arc.map((p) => projection(p).map((v) => Math.round(v * ROUND)));
const arcsXY = arcsLonLat.map(projectArc);

function ringPoints(arcIndexes) {
  const pts = [];
  for (const index of arcIndexes) {
    const arc = index < 0 ? arcsXY[~index].slice().reverse() : arcsXY[index];
    // điểm đầu của arc trùng điểm cuối arc trước → bỏ
    pts.push(...(pts.length ? arc.slice(1) : arc));
  }
  return pts;
}

function ringLonLat(arcIndexes) {
  const pts = [];
  for (const index of arcIndexes) {
    const arc = index < 0 ? arcsLonLat[~index].slice().reverse() : arcsLonLat[index];
    pts.push(...(pts.length ? arc.slice(1) : arc));
  }
  return pts;
}

// ---------------------------------------------------------------------------------------------
// Viết path SVG gọn: M tuyệt đối rồi l tương đối, số 1 chữ số thập phân, bỏ số 0 thừa
// ---------------------------------------------------------------------------------------------
function num(v) {
  // v là số nguyên theo 1/ROUND
  const neg = v < 0;
  const a = Math.abs(v);
  const int = Math.floor(a / ROUND);
  const frac = a % ROUND;
  let s = frac === 0 ? String(int) : `${int === 0 ? '' : int}.${frac}`;
  if (neg && s !== '0') s = `-${s}`;
  return s;
}

function joinNums(values) {
  let out = '';
  let prev = '';
  for (const s of values) {
    if (out === '') out = s;
    else if (s.startsWith('-')) out += s;
    else if (s.startsWith('.') && prev.includes('.')) out += s;
    else out += ` ${s}`;
    prev = s;
  }
  return out;
}

function ringToPath(points) {
  // vòng khép kín: bỏ điểm cuối trùng điểm đầu
  const pts = points.slice();
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (pts.length > 1 && first[0] === last[0] && first[1] === last[1]) pts.pop();
  const deltas = [];
  let [px, py] = first;
  for (let i = 1; i < pts.length; i += 1) {
    const [x, y] = pts[i];
    const dx = x - px;
    const dy = y - py;
    if (dx === 0 && dy === 0) continue; // trùng điểm sau khi làm tròn
    deltas.push(num(dx), num(dy));
    px = x;
    py = y;
  }
  if (deltas.length < 4) return ''; // đa giác suy biến (< 3 điểm phân biệt)
  return `M${joinNums([num(first[0]), num(first[1])])}l${joinNums(deltas)}z`;
}

// ---------------------------------------------------------------------------------------------
// Hình học phẳng (đơn vị viewBox): diện tích, khung, điểm trong đa giác, polylabel
// ---------------------------------------------------------------------------------------------
const toUnits = (pts) => pts.map(([x, y]) => [x / ROUND, y / ROUND]);

function ringArea(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  return a / 2;
}

function bboxOf(rings) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  return [x0, y0, x1, y1];
}

function pointToSegmentDist(px, py, a, b) {
  let [x, y] = a;
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = px - x;
  dy = py - y;
  return Math.hypot(dx, dy);
}

/** Khoảng cách có dấu từ điểm tới viền đa giác một vòng (dương = bên trong). */
function signedDist(x, y, ring) {
  let inside = false;
  let min = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i];
    const b = ring[j];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    min = Math.min(min, pointToSegmentDist(x, y, a, b));
  }
  return (inside ? 1 : -1) * min;
}

/** Cực bất khả tiếp cận (thuật toán polylabel của Mapbox, bản rút gọn): điểm trong đa giác xa viền nhất. */
function polylabel(ring, precision = 0.5) {
  const [x0, y0, x1, y1] = bboxOf([ring]);
  const size = Math.min(x1 - x0, y1 - y0);
  if (size === 0) return [x0, y0];
  const cell = (x, y, h) => {
    const d = signedDist(x, y, ring);
    return { x, y, h, d, max: d + h * Math.SQRT2 };
  };
  const queue = [];
  let h = size / 2;
  for (let x = x0; x < x1; x += size) for (let y = y0; y < y1; y += size) queue.push(cell(x + h, y + h, h));
  // ô khởi đầu: trọng tâm diện tích
  let cx = 0;
  let cy = 0;
  let a2 = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    cx += (ring[j][0] + ring[i][0]) * f;
    cy += (ring[j][1] + ring[i][1]) * f;
    a2 += f;
  }
  let best = a2 !== 0 ? cell(cx / (3 * a2), cy / (3 * a2), 0) : cell(x0, y0, 0);
  const bboxCell = cell(x0 + (x1 - x0) / 2, y0 + (y1 - y0) / 2, 0);
  if (bboxCell.d > best.d) best = bboxCell;
  while (queue.length) {
    queue.sort((p, q) => q.max - p.max);
    const c = queue.shift();
    if (c.d > best.d) best = c;
    if (c.max - best.d <= precision) continue;
    h = c.h / 2;
    queue.push(cell(c.x - h, c.y - h, h), cell(c.x + h, c.y - h, h), cell(c.x - h, c.y + h, h), cell(c.x + h, c.y + h, h));
  }
  return [best.x, best.y];
}

const r1 = (v) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------------------------------------
// Dựng dữ liệu từng tỉnh: path đất liền, path quần đảo (tách riêng), tâm đặt ghim, thứ tự map-rise
// ---------------------------------------------------------------------------------------------
const byCode = new Map(provinces.map((p) => [p.code, p]));
const archByParent = new Map(Object.entries(ARCH_RULES).map(([id, rule]) => [rule.parentCode, { id, ...rule }]));

const rows = [];
const archRows = [];
for (const geom of object.geometries) {
  const code = geom.properties.code;
  const meta = byCode.get(code);
  if (!meta) throw new Error(`vn34.topo.json: mã ${code} không có trong content/provinces.ts`);
  const polygons = geom.type === 'Polygon' ? [geom.arcs] : geom.arcs;
  const arch = archByParent.get(code);

  const mainRings = [];
  const archRings = [];
  const archLonLat = [];
  for (const polygon of polygons) {
    if (polygon.length !== 1) throw new Error(`Tỉnh ${code}: đa giác có lỗ — script chưa hỗ trợ`);
    const lonLat = ringLonLat(polygon[0]);
    const lons = lonLat.map((p) => p[0]);
    const lats = lonLat.map((p) => p[1]);
    const b = { minLon: Math.min(...lons), maxLon: Math.max(...lons), minLat: Math.min(...lats), maxLat: Math.max(...lats) };
    const pts = ringPoints(polygon[0]);
    if (arch && arch.isPart(b)) {
      archRings.push(pts);
      archLonLat.push(b);
    } else {
      mainRings.push(pts);
    }
  }

  // Tâm: polylabel của mảnh đất liền lớn nhất (tránh tâm rơi ra biển ở tỉnh nhiều đảo)
  const largest = mainRings
    .map((r) => toUnits(r))
    .reduce((a, b) => (Math.abs(ringArea(b)) > Math.abs(ringArea(a)) ? b : a));
  const [cx, cy] = polylabel(largest, 0.25);
  const mainBox = bboxOf(mainRings.map(toUnits));

  rows.push({
    code,
    region: meta.region,
    d: mainRings.map(ringToPath).filter(Boolean).join(''),
    cx: r1(cx),
    cy: r1(cy),
    bbox: mainBox.map(r1),
  });

  if (arch) {
    if (archRings.length === 0) throw new Error(`Tỉnh ${code}: không tách được phần quần đảo ${arch.id}`);
    const box = bboxOf(archRings.map(toUnits));
    const maxLon = Math.max(...archLonLat.map((b) => b.maxLon));
    if (maxLon < EXPECT_EAST[arch.id]) {
      throw new Error(`${arch.id}: kinh độ đông nhất ${maxLon.toFixed(2)} < ${EXPECT_EAST[arch.id]} — dữ liệu thiếu đảo?`);
    }
    // Điểm vẽ chấm nhấn cho từng đảo (đảo thật chỉ 1–3 đơn vị, chấm giúp nhìn thấy ở mọi cỡ)
    const dots = archRings.map((r) => {
      const [x0, y0, x1, y1] = bboxOf([toUnits(r)]);
      return [r1((x0 + x1) / 2), r1((y0 + y1) / 2)];
    });
    archRows.push({
      id: arch.id,
      parentCode: code,
      d: archRings.map(ringToPath).filter(Boolean).join(''),
      dots,
      bbox: box.map(r1),
      parts: archRings.length,
      maxLon: +maxLon.toFixed(3),
    });
  }
}

// Thứ tự map-rise Bắc → Nam: theo tung độ tâm (nhỏ = phía Bắc)
const order = rows.slice().sort((a, b) => a.cy - b.cy);
order.forEach((row, i) => {
  row.rise = i;
});
rows.sort((a, b) => a.code.localeCompare(b.code));
archRows.sort((a, b) => a.id.localeCompare(b.id));

// ---------------------------------------------------------------------------------------------
// Nhãn quần đảo: neo ngay trên (Hoàng Sa) / ngay dưới (Trường Sa) cụm đảo, căn giữa theo cụm
// ---------------------------------------------------------------------------------------------
const LABEL_GAP = 10;
const labels = {};
for (const a of archRows) {
  const [x0, y0, x1, y1] = a.bbox;
  labels[a.id] =
    a.id === 'hoang-sa'
      ? { x: r1((x0 + x1) / 2), y: r1(y0 - LABEL_GAP), place: 'above' }
      : { x: r1((x0 + x1) / 2), y: r1(y1 + LABEL_GAP), place: 'below' };
}

// ---------------------------------------------------------------------------------------------
// Lưới kinh vĩ 2° (trang trí) — Mercator: kinh tuyến thẳng đứng, vĩ tuyến nằm ngang
// ---------------------------------------------------------------------------------------------
const graticule = { lon: [], lat: [] };
for (let lon = 100; lon <= 120; lon += 2) {
  const [x] = projection([lon, 15]);
  if (x > 0 && x < W) graticule.lon.push(r1(x));
}
for (let lat = 4; lat <= 26; lat += 2) {
  const [, y] = projection([105, lat]);
  if (y > 0 && y < H) graticule.lat.push(r1(y));
}

// ---------------------------------------------------------------------------------------------
// Kiểm chủ quyền (NFR-MAP-01): khung chứa trọn hai quần đảo + vùng nhãn ước lượng
// ---------------------------------------------------------------------------------------------
const all = bboxOf(rows.flatMap((r) => [[r.bbox[0], r.bbox[1]], [r.bbox[2], r.bbox[3]]]).map((p) => [p]));
const problems = [];
for (const a of archRows) {
  const [x0, y0, x1, y1] = a.bbox;
  if (x0 < 0 || y0 < 0 || x1 > W || y1 > H) problems.push(`${a.id}: khung đảo [${a.bbox}] ra ngoài 0..${W}×0..${H}`);
  const l = labels[a.id];
  // nhãn rộng tối đa ~160 đơn vị, cao ~44 đơn vị ở khung hẹp nhất (328 px) — chỉ là kiểm thô, test trình duyệt đo thật
  const lx0 = l.x - 80;
  const lx1 = l.x + 80;
  const ly0 = l.place === 'above' ? l.y - 44 : l.y;
  const ly1 = l.place === 'above' ? l.y : l.y + 44;
  if (lx0 < 0 || lx1 > W || ly0 < 0 || ly1 > H) problems.push(`${a.id}: vùng nhãn [${lx0},${ly0},${lx1},${ly1}] chạm mép khung`);
}
if (all[1] < 0 || all[3] > H) problems.push(`đất liền ra ngoài khung dọc: ${all}`);
if (problems.length) {
  console.error(`[make-map] VI PHẠM NFR-MAP-01:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------------------------
// Ghi file
// ---------------------------------------------------------------------------------------------
const HEADER = `// FILE SINH TỰ ĐỘNG bởi scripts/make-map.mjs từ public/data/vn34.topo.json — KHÔNG sửa tay.
// Sinh lại: node scripts/make-map.mjs · Kiểm đồng bộ: node scripts/make-map.mjs --check
// Mercator (d3-geo), khung ${W}×${H} (3:4). Toạ độ theo đơn vị viewBox, làm tròn 0,1.
`;

const ts = `${HEADER}
export const MAP_VIEWBOX = { width: ${W}, height: ${H} } as const;

export type MapProvinceShape = {
  code: string;
  region: 'north' | 'central' | 'south';
  /** Path phần đất liền (và đảo ven bờ); phần quần đảo tách riêng ở MAP_ARCHIPELAGOS. */
  d: string;
  /** Điểm đặt ghim/thẻ: điểm trong tỉnh xa viền nhất (polylabel). */
  cx: number;
  cy: number;
  bbox: readonly [number, number, number, number];
  /** Thứ tự map-rise Bắc → Nam (0 = cực Bắc). */
  rise: number;
};

export type MapArchipelagoShape = {
  id: 'hoang-sa' | 'truong-sa';
  parentCode: string;
  d: string;
  /** Tâm từng đảo (vẽ chấm nhấn để luôn nhìn thấy). */
  dots: readonly (readonly [number, number])[];
  bbox: readonly [number, number, number, number];
  /** Neo nhãn: "above" = đáy nhãn tại (x, y); "below" = đỉnh nhãn tại (x, y). */
  label: { x: number; y: number; place: 'above' | 'below' };
};

export const MAP_PROVINCES: readonly MapProvinceShape[] = ${JSON.stringify(
  rows.map(({ code, region, d, cx, cy, bbox, rise }) => ({ code, region, d, cx, cy, bbox, rise })),
  null,
  1,
)};

export const MAP_ARCHIPELAGOS: readonly MapArchipelagoShape[] = ${JSON.stringify(
  archRows.map(({ id, parentCode, d, dots, bbox }) => ({ id, parentCode, d, dots, bbox, label: labels[id] })),
  null,
  1,
)};

/** Lưới kinh vĩ 2° (trang trí): toạ độ x của kinh tuyến, y của vĩ tuyến. */
export const MAP_GRATICULE = ${JSON.stringify(graticule)} as const;
`;

function svgDoc(locale) {
  const label = (id) => archipelagos.find((a) => a.id === id).label[locale];
  const fills = { north: C['blue-600'], central: C['blue-300'], south: C['navy-900'] };
  const paths = rows.map((r) => `<path fill="${fills[r.region]}" d="${r.d}"/>`).join('');
  const island = C['navy-900'];
  const archs = archRows
    .map(
      (a) =>
        `<path fill="${island}" stroke="${island}" stroke-width="1.2" d="${a.d}"/>` +
        a.dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${island}" stroke="${C.white}"/>`).join(''),
    )
    .join('');
  const texts = archRows
    .map((a) => {
      const l = labels[a.id];
      const y = l.place === 'above' ? l.y - 6 : l.y + 20;
      return `<text x="${l.x}" y="${y}" text-anchor="middle">${label(a.id)}</text>`;
    })
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<title>${locale === 'vi' ? 'Bản đồ Việt Nam 34 tỉnh, thành phố, gồm quần đảo Hoàng Sa và quần đảo Trường Sa' : 'Map of Vietnam, 34 provinces, including the Hoang Sa (Paracel) and Truong Sa (Spratly) archipelagos'}</title>` +
    `<rect width="${W}" height="${H}" fill="${C['blue-50']}"/>` +
    `<g stroke="${C.white}" stroke-width="0.8" stroke-linejoin="round">${paths}</g>${archs}` +
    `<g font-family="Be Vietnam Pro, Arial, sans-serif" font-size="18" font-weight="600" fill="${C['navy-900']}">${texts}</g></svg>\n`
  );
}

const outputs = [
  [join(ROOT, 'components/map/vn34-map.generated.ts'), ts],
  [join(ROOT, 'public/data/vn34-map.svg'), svgDoc('vi')],
  [join(ROOT, 'public/data/vn34-map.en.svg'), svgDoc('en')],
];

let stale = 0;
for (const [file, content] of outputs) {
  if (CHECK) {
    let current = '';
    try {
      current = readFileSync(file, 'utf8');
    } catch {
      /* chưa có file */
    }
    if (current !== content) {
      stale += 1;
      console.error(`[make-map] LỆCH: ${file} — chạy node scripts/make-map.mjs`);
    }
  } else {
    writeFileSync(file, content);
  }
}

const pathBytes = rows.reduce((s, r) => s + r.d.length, 0) + archRows.reduce((s, a) => s + a.d.length, 0);
console.log(
  `[make-map] ${rows.length} tỉnh · path ${(pathBytes / 1024).toFixed(1)} KB · ` +
    archRows.map((a) => `${a.id} ${a.parts} đảo, khung [${a.bbox.join(', ')}], tới ${a.maxLon}°E`).join(' · '),
);
if (CHECK) {
  if (stale) process.exit(1);
  console.log('[make-map] --check: các file sinh ra khớp nguồn');
}
