#!/usr/bin/env node
/**
 * make-hero-map.mjs — dữ liệu cảnh 3D của hero bản đồ (Mẫu 02 "Bản đồ sống", D-26, contracts/hero-map.md).
 * Trình duyệt KHÔNG tải topojson/d3: cảnh đọc đúng một file JSON nhỏ, toạ độ đã chiếu sẵn.
 *
 *   node scripts/make-hero-map.mjs           sinh lại public/data/hero-map.json
 *   node scripts/make-hero-map.mjs --check   chỉ kiểm: thoát mã 1 nếu file đã commit lệch nguồn hoặc vi phạm NFR-MAP-01
 *
 * Nguồn:  public/data/vn34.topo.json (thanglequoc/vietnamese-provinces-database, MIT; object "vn34-all", 34 tỉnh sau
 *         01/07/2025, CÓ quần đảo Hoàng Sa trong TP. Đà Nẵng và quần đảo Trường Sa trong tỉnh Khánh Hòa)
 *         content/provinces.ts (mã tỉnh, miền north/central/south) · components/film/map3d/projection.ts (phép chiếu)
 * Đầu ra: public/data/hero-map.json — xem kiểu HeroMapData ở components/film/map3d/types.ts:
 *   - arcs: đường biên dạng topology (biên chung giữa hai tỉnh là MỘT arc → không hở viền), đã rút gọn
 *     Douglas–Peucker từng arc (giữ hai đầu mút = điểm nối), toạ độ nguyên 1/1000 đơn vị cảnh, mã hoá delta;
 *   - outer: arc dùng bởi đúng một tỉnh (bờ biển + biên giới quốc gia) → dựng vách và viền xanh;
 *   - provinces: mã, miền, vòng (chỉ số arc, ~i = đảo chiều), cờ đảo nhỏ, điểm neo nhãn (polylabel);
 *   - hq: văn phòng TP.HCM (100 Nguyễn Văn Lượng, Gò Vấp — làm tròn 0,01°) · sea: điểm đặt nhãn Biển Đông;
 *   - archipelagos: chấm từng đảo (tâm đa giác, gộp chấm gần nhau), elip nhóm, điểm neo nhãn;
 *   - minimap: SVG 200×250 (3 miền + chấm đảo + elip) cho khung zoom từng miền trên desktop.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeArcs } from 'topojson-client';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const OUT = join(ROOT, 'public/data/hero-map.json');

process.removeAllListeners('warning'); // cảnh báo MODULE_TYPELESS_PACKAGE_JSON khi import .ts — vô hại
const { provinces, archipelagos } = await import(join(ROOT, 'content/provinces.ts'));
const P = await import(join(ROOT, 'components/film/map3d/projection.ts'));

// ---------------------------------------------------------------------------------------------
// Tham số
// ---------------------------------------------------------------------------------------------
const SIMPLIFY_EPS = 0.004; // đơn vị cảnh (~450 m): rút gọn nhẹ, giữ dáng bờ ở cảnh zoom từng miền
const DOT_MERGE = 0.05; // gộp chấm đảo gần hơn ~5,5 km (tránh hai trụ chồng nhau)
const RING_MARGIN = [0.38, 0.34]; // lề elip quanh chấm (theo trục chính, trục phụ)
const HQ_LONLAT = [106.68, 10.84]; // văn phòng Bluebolt, Gò Vấp (content/site.ts) — làm tròn 0,01°
const SEA_LONLAT = [112.6, 13.4]; // nhãn "Biển Đông": giữa hai quần đảo, ngoài khơi Nam Trung Bộ
/** Tách phần quần đảo khỏi tỉnh cha (giống scripts/make-map.mjs). */
const ARCH_RULES = {
  'hoang-sa': { parentCode: '48', isPart: (b) => b.minLon > 110 },
  'truong-sa': { parentCode: '56', isPart: (b) => b.minLon > 109.45 },
};
/**
 * Elip Trường Sa chỉ bao cụm đảo chính (≥ 111°E). Các chấm DK1/Tư Chính (109,5–110,7°E) trong cùng MultiPolygon của
 * Khánh Hòa vẫn vẽ chấm nhưng nằm ngoài elip — cách thể hiện chờ pháp chế (DECISIONS D-25).
 */
const RING_MIN_LON = { 'hoang-sa': 110, 'truong-sa': 111 };
const EXPECT_EAST = { 'hoang-sa': 112.6, 'truong-sa': 117.8 };
const REGION_INDEX = { north: 0, central: 1, south: 2 };
const MINI = { w: 200, h: 250, pad: 6, eps: 0.03 };

const q = (v) => Math.round(v * P.QUANT);
const r3 = (v) => Math.round(v * 1000) / 1000;
const r1 = (v) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------------------------------------
// Đọc TopoJSON → arc kinh/vĩ độ → arc đã chiếu (đơn vị cảnh)
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
const arcsXZ = arcsLonLat.map((arc) => arc.map(([lon, lat]) => P.toXZ(lon, lat)));

const ringLonLat = (refs) => {
  const pts = [];
  for (const i of refs) {
    const a = i < 0 ? arcsLonLat[~i].slice().reverse() : arcsLonLat[i];
    pts.push(...(pts.length ? a.slice(1) : a));
  }
  return pts;
};

// ---------------------------------------------------------------------------------------------
// Hình học phẳng
// ---------------------------------------------------------------------------------------------
function segDist(px, py, a, b) {
  let [x, y] = a;
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) [x, y] = b;
    else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = px - x;
  dy = py - y;
  return Math.hypot(dx, dy);
}

/** Douglas–Peucker cho polyline mở, giữ hai đầu. */
function rdpOpen(pts, eps) {
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let md = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i += 1) {
      const d = segDist(pts[i][0], pts[i][1], pts[a], pts[b]);
      if (d > md) {
        md = d;
        idx = i;
      }
    }
    if (md > eps && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Arc khép kín (đảo một arc): tách tại điểm xa đầu mút nhất rồi rút gọn hai nửa; giữ tối thiểu 4 điểm (3 + điểm lặp). */
function simplifyArc(pts, eps) {
  const n = pts.length;
  const closed = n > 3 && pts[0][0] === pts[n - 1][0] && pts[0][1] === pts[n - 1][1];
  if (!closed) return rdpOpen(pts, eps);
  let far = 1;
  let fd = -1;
  for (let i = 1; i < n - 1; i += 1) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > fd) {
      fd = d;
      far = i;
    }
  }
  const out = [...rdpOpen(pts.slice(0, far + 1), eps).slice(0, -1), ...rdpOpen(pts.slice(far), eps)];
  if (out.length >= 4) return out;
  return n <= 5 ? pts : [pts[0], pts[Math.floor(n / 3)], pts[Math.floor((2 * n) / 3)], pts[0]];
}

function ringArea(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  return a / 2;
}

function bboxOf(points) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of points) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

function signedDist(x, y, ring) {
  let inside = false;
  let min = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i];
    const b = ring[j];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    min = Math.min(min, segDist(x, y, a, b));
  }
  return (inside ? 1 : -1) * min;
}

/** Cực bất khả tiếp cận (polylabel rút gọn): điểm trong đa giác xa viền nhất — chỗ đặt ghim + nhãn tỉnh. */
function polylabel(ring, precision = 0.005) {
  const [x0, y0, x1, y1] = bboxOf(ring);
  const size = Math.min(x1 - x0, y1 - y0);
  if (size === 0) return [x0, y0];
  const cell = (x, y, h) => {
    const d = signedDist(x, y, ring);
    return { x, y, h, d, max: d + h * Math.SQRT2 };
  };
  const queue = [];
  let h = size / 2;
  for (let x = x0; x < x1; x += size) for (let y = y0; y < y1; y += size) queue.push(cell(x + h, y + h, h));
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
    queue.sort((p, s) => s.max - p.max);
    const c = queue.shift();
    if (c.d > best.d) best = c;
    if (c.max - best.d <= precision) continue;
    h = c.h / 2;
    queue.push(cell(c.x - h, c.y - h, h), cell(c.x + h, c.y - h, h), cell(c.x - h, c.y + h, h), cell(c.x + h, c.y + h, h));
  }
  return [best.x, best.y];
}

function pointInRing(x, y, ring) {
  return signedDist(x, y, ring) > 0;
}

// ---------------------------------------------------------------------------------------------
// Tách tỉnh / quần đảo, đếm số lần dùng mỗi arc (chỉ tính phần đất liền + đảo ven bờ)
// ---------------------------------------------------------------------------------------------
const byCode = new Map(provinces.map((p) => [p.code, p]));
const archByParent = new Map(Object.entries(ARCH_RULES).map(([id, rule]) => [rule.parentCode, { id, ...rule }]));
const use = new Array(arcsXZ.length).fill(0);
const provRows = [];
const archParts = { 'hoang-sa': [], 'truong-sa': [] };

for (const geom of object.geometries) {
  const code = geom.properties.code;
  const meta = byCode.get(code);
  if (!meta) throw new Error(`vn34.topo.json: mã ${code} không có trong content/provinces.ts`);
  const polygons = geom.type === 'Polygon' ? [geom.arcs] : geom.arcs;
  const arch = archByParent.get(code);
  const rings = [];
  for (const polygon of polygons) {
    if (polygon.length !== 1) throw new Error(`Tỉnh ${code}: đa giác có lỗ — script chưa hỗ trợ`);
    const refs = polygon[0];
    const ll = ringLonLat(refs);
    const lons = ll.map((p) => p[0]);
    const b = { minLon: Math.min(...lons), maxLon: Math.max(...lons) };
    if (arch && arch.isPart(b)) {
      archParts[arch.id].push({ ll, maxLon: b.maxLon });
      continue;
    }
    for (const i of refs) use[i < 0 ? ~i : i] += 1;
    rings.push(refs);
  }
  provRows.push({ code, region: meta.region, rings });
}

// ---------------------------------------------------------------------------------------------
// Rút gọn arc (chỉ arc thuộc đất liền), lượng tử hoá, đánh lại chỉ số
// ---------------------------------------------------------------------------------------------
const remap = new Map();
const arcsOut = [];
const outerFlags = [];
let ptsBefore = 0;
let ptsAfter = 0;
arcsXZ.forEach((arc, i) => {
  if (use[i] === 0) return; // arc của quần đảo (vẽ bằng chấm) hoặc arc thừa
  const simp = simplifyArc(arc, SIMPLIFY_EPS);
  // lượng tử hoá + bỏ điểm trùng sau làm tròn (giữ đầu mút)
  const qd = [];
  for (const [x, z] of simp) {
    const p = [q(x), q(z)];
    const last = qd[qd.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) qd.push(p);
  }
  ptsBefore += arc.length;
  ptsAfter += qd.length;
  remap.set(i, arcsOut.length);
  arcsOut.push(qd);
  outerFlags.push(use[i] === 1 ? 1 : 0);
});
const refOut = (i) => (i < 0 ? ~remap.get(~i) : remap.get(i));

/** Vòng đã lượng tử (đơn vị cảnh) từ danh sách arc mới. */
function ringXZ(refs) {
  const pts = [];
  for (const i of refs) {
    const a = i < 0 ? arcsOut[~i].slice().reverse() : arcsOut[i];
    pts.push(...(pts.length ? a.slice(1) : a));
  }
  if (pts.length > 1) {
    const f = pts[0];
    const l = pts[pts.length - 1];
    if (f[0] === l[0] && f[1] === l[1]) pts.pop();
  }
  return pts.map(([x, z]) => [x / P.QUANT, z / P.QUANT]);
}

// ---------------------------------------------------------------------------------------------
// Tỉnh: vòng, cờ đảo nhỏ, điểm neo (polylabel của mảnh lớn nhất; TP.HCM neo tại văn phòng)
// ---------------------------------------------------------------------------------------------
const [hqX, hqZ] = P.toXZ(HQ_LONLAT[0], HQ_LONLAT[1]);
const provincesOut = provRows
  .map((row) => {
    const rings = row.rings.map((refs) => refs.map(refOut));
    const xz = rings.map(ringXZ);
    const areas = xz.map((r) => Math.abs(ringArea(r)));
    const islet = areas.map((a) => (a < P.ISLET_AREA ? 1 : 0));
    const largest = xz[areas.indexOf(Math.max(...areas))];
    let anchor = polylabel(largest);
    if (row.code === '79') {
      if (!pointInRing(hqX, hqZ, largest)) throw new Error('Toạ độ văn phòng TP.HCM nằm ngoài đa giác TP.HCM');
      anchor = [hqX, hqZ];
    }
    return {
      code: row.code,
      region: REGION_INDEX[row.region],
      anchor: [q(anchor[0]), q(anchor[1])],
      rings,
      ...(islet.some(Boolean) ? { islet } : {}),
    };
  })
  .sort((a, b) => a.code.localeCompare(b.code));

// ---------------------------------------------------------------------------------------------
// Quần đảo: chấm (tâm từng đảo, gộp chấm gần), elip nhóm (PCA + bao trọn), neo nhãn trên đỉnh elip
// ---------------------------------------------------------------------------------------------
function centroidXZ(ll) {
  const xz = ll.map(([lon, lat]) => P.toXZ(lon, lat));
  const [x0, y0, x1, y1] = bboxOf(xz);
  return { x: (x0 + x1) / 2, z: (y0 + y1) / 2, lon: (Math.min(...ll.map((p) => p[0])) + Math.max(...ll.map((p) => p[0]))) / 2 };
}

function mergeDots(dots) {
  const out = [];
  for (const d of dots) {
    const near = out.find((o) => Math.hypot(o.x - d.x, o.z - d.z) < DOT_MERGE);
    if (near) {
      near.x = (near.x * near.n + d.x) / (near.n + 1);
      near.z = (near.z * near.n + d.z) / (near.n + 1);
      near.lon = Math.max(near.lon, d.lon);
      near.n += 1;
    } else out.push({ ...d, n: 1 });
  }
  return out;
}

/** Elip bao trọn các điểm: trục theo PCA, bán kính = nửa bề rộng × hệ số bao + lề. Trả [cx, cz, rx, rz, gócRad]. */
function fitEllipse(points) {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p[0], 0) / n;
  const mz = points.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0;
  let szz = 0;
  let sxz = 0;
  for (const [x, z] of points) {
    sxx += (x - mx) ** 2;
    szz += (z - mz) ** 2;
    sxz += (x - mx) * (z - mz);
  }
  const theta = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const loc = points.map(([x, z]) => [(x - mx) * c + (z - mz) * s, -(x - mx) * s + (z - mz) * c]);
  const [u0, v0, u1, v1] = bboxOf(loc);
  const cu = (u0 + u1) / 2;
  const cv = (v0 + v1) / 2;
  const hu = Math.max((u1 - u0) / 2, 0.12);
  const hv = Math.max((v1 - v0) / 2, 0.12);
  let k = 0;
  for (const [u, v] of loc) k = Math.max(k, Math.hypot((u - cu) / hu, (v - cv) / hv));
  const cx = mx + cu * c - cv * s;
  const cz = mz + cu * s + cv * c;
  return [cx, cz, hu * k + RING_MARGIN[0], hv * k + RING_MARGIN[1], theta];
}

/** Điểm trên elip ở phía bắc nhất (z nhỏ nhất) — neo nhãn quần đảo ngay trên vòng. */
function ellipseTop([cx, cz, rx, rz, th]) {
  let best = [cx, cz];
  for (let i = 0; i < 360; i += 1) {
    const t = (i * Math.PI) / 180;
    const x = cx + rx * Math.cos(t) * Math.cos(th) - rz * Math.sin(t) * Math.sin(th);
    const z = cz + rx * Math.cos(t) * Math.sin(th) + rz * Math.sin(t) * Math.cos(th);
    if (z < best[1]) best = [x, z];
  }
  return best;
}

const archOut = [];
const problems = [];
for (const meta of archipelagos) {
  const parts = archParts[meta.id];
  if (!parts.length) throw new Error(`${meta.id}: không tách được phần quần đảo`);
  const maxLon = Math.max(...parts.map((p) => p.maxLon));
  if (maxLon < EXPECT_EAST[meta.id]) problems.push(`${meta.id}: kinh độ đông nhất ${maxLon.toFixed(2)} < ${EXPECT_EAST[meta.id]}`);
  const dots = mergeDots(parts.map((p) => centroidXZ(p.ll))).sort((a, b) => a.z - b.z || a.x - b.x);
  const ringPts = dots.filter((d) => d.lon >= RING_MIN_LON[meta.id]).map((d) => [d.x, d.z]);
  const ring = fitEllipse(ringPts);
  const top = ellipseTop(ring);
  archOut.push({
    id: meta.id,
    parent: meta.parentCode,
    dots: dots.map((d) => [q(d.x), q(d.z)]),
    inRing: dots.map((d) => (d.lon >= RING_MIN_LON[meta.id] ? 1 : 0)),
    ring: [q(ring[0]), q(ring[1]), q(ring[2]), q(ring[3]), r3(ring[4])],
    label: [q(top[0]), q(top[1])],
    parts: parts.length,
  });
}

// ---------------------------------------------------------------------------------------------
// Minimap 200×250: ba miền (gộp arc theo miền, topojson mergeArcs), chấm đảo, elip, văn phòng
// ---------------------------------------------------------------------------------------------
const allXZ = [
  ...provincesOut.flatMap((p) => p.rings.flatMap(ringXZ)),
  ...archOut.flatMap((a) => a.dots.map(([x, z]) => [x / P.QUANT, z / P.QUANT])),
];
const [bx0, bz0, bx1, bz1] = bboxOf(allXZ);
const ms = Math.min((MINI.w - 2 * MINI.pad) / (bx1 - bx0), (MINI.h - 2 * MINI.pad) / (bz1 - bz0));
const mx = (x) => r1(MINI.pad + (x - bx0) * ms);
const my = (z) => r1(MINI.pad + (z - bz0) * ms);

function svgPath(rings) {
  return rings
    .map((ring) => {
      const pts = ring.map(([x, z]) => [mx(x), my(z)]);
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i += 1) d += `L${pts[i][0]} ${pts[i][1]}`;
      return `${d}Z`;
    })
    .join('');
}

const minimapRegions = {};
for (const region of Object.keys(REGION_INDEX)) {
  const geoms = object.geometries.filter((g) => byCode.get(g.properties.code).region === region);
  const merged = mergeArcs(topo, geoms); // MultiPolygon theo arc gốc
  const rings = [];
  for (const polygon of merged.arcs) {
    const ll = ringLonLat(polygon[0]);
    const lons = ll.map((p) => p[0]);
    if (Math.min(...lons) > 109.45 && region !== 'north') continue; // phần quần đảo vẽ bằng chấm
    const xz = rdpOpen(ll.map(([lon, lat]) => P.toXZ(lon, lat)), MINI.eps);
    if (xz.length >= 4 && Math.abs(ringArea(xz)) * ms * ms > 2) rings.push(xz);
  }
  minimapRegions[region] = svgPath(rings);
}
const minimap = {
  w: MINI.w,
  h: MINI.h,
  regions: minimapRegions,
  dots: archOut.flatMap((a) => a.dots.map(([x, z]) => [mx(x / P.QUANT), my(z / P.QUANT)])),
  rings: archOut.map((a) => [mx(a.ring[0] / P.QUANT), my(a.ring[1] / P.QUANT), r1((a.ring[2] / P.QUANT) * ms), r1((a.ring[3] / P.QUANT) * ms), a.ring[4]]),
  labels: Object.fromEntries(archOut.map((a) => [a.id, [mx(a.label[0] / P.QUANT), my(a.label[1] / P.QUANT)]])),
  hq: [mx(hqX), my(hqZ)],
};

// ---------------------------------------------------------------------------------------------
// Kiểm chủ quyền + dung lượng
// ---------------------------------------------------------------------------------------------
for (const a of archOut) {
  if (a.dots.length < (a.id === 'hoang-sa' ? 5 : 20)) problems.push(`${a.id}: chỉ có ${a.dots.length} chấm đảo`);
  const [cx, cz, rx, rz, th] = a.ring.map((v, i) => (i < 4 ? v / P.QUANT : v));
  a.dots.forEach(([x, z], i) => {
    if (!a.inRing[i]) return;
    const dx = x / P.QUANT - cx;
    const dz = z / P.QUANT - cz;
    const u = dx * Math.cos(th) + dz * Math.sin(th);
    const v = -dx * Math.sin(th) + dz * Math.cos(th);
    if (Math.hypot(u / rx, v / rz) > 1.0001) problems.push(`${a.id}: chấm #${i} nằm ngoài elip`);
  });
}
if (provincesOut.length !== 34) problems.push(`cần 34 tỉnh, có ${provincesOut.length}`);
for (const [id, d] of Object.entries(minimapRegions)) if (!d) problems.push(`minimap: miền ${id} rỗng`);

const data = {
  v: 1,
  source: 'public/data/vn34.topo.json — thanglequoc/vietnamese-provinces-database (MIT), 34 tỉnh sau 01/07/2025',
  license: 'MIT (dữ liệu ranh giới). Bản đồ minh hoạ, có Quần đảo Hoàng Sa và Quần đảo Trường Sa của Việt Nam.',
  generator: 'scripts/make-hero-map.mjs — KHÔNG sửa tay',
  projection: { lon0: P.LON0, lat0: P.LAT0, kx: r3(P.KX), note: 'x = (lon − lon0)·cos16°, z = −(lat − lat0); 1 đơn vị ≈ 111 km' },
  quant: P.QUANT,
  arcs: arcsOut.map((arc) => {
    const flat = [arc[0][0], arc[0][1]];
    for (let i = 1; i < arc.length; i += 1) flat.push(arc[i][0] - arc[i - 1][0], arc[i][1] - arc[i - 1][1]);
    return flat;
  }),
  outer: outerFlags.join(''),
  provinces: provincesOut,
  hq: [q(hqX), q(hqZ)],
  sea: P.toXZ(SEA_LONLAT[0], SEA_LONLAT[1]).map(q),
  archipelagos: archOut.map(({ parts: _parts, ...rest }) => rest),
  bbox: [q(bx0), q(bz0), q(bx1), q(bz1)],
  minimap,
};

const json = `${JSON.stringify(data)}\n`;
const { gzipSync } = await import('node:zlib');
const gz = gzipSync(json, { level: 9 }).length;
if (gz > 60 * 1024) problems.push(`hero-map.json ${(gz / 1024).toFixed(1)} KB gz > 60 KB`);

if (problems.length) {
  console.error(`[make-hero-map] LỖI:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

if (CHECK) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    /* chưa có file */
  }
  if (current !== json) {
    console.error(`[make-hero-map] LỆCH: ${OUT} — chạy node scripts/make-hero-map.mjs`);
    process.exit(1);
  }
} else {
  writeFileSync(OUT, json);
}

console.log(
  `[make-hero-map] 34 tỉnh · ${arcsOut.length} arc (${outerFlags.filter(Boolean).length} biên ngoài) · ` +
    `điểm ${ptsBefore} → ${ptsAfter} · ` +
    archOut.map((a) => `${a.id} ${a.parts} đảo → ${a.dots.length} chấm`).join(' · ') +
    ` · ${(json.length / 1024).toFixed(1)} KB, ${(gz / 1024).toFixed(1)} KB gz${CHECK ? ' · --check: khớp nguồn' : ''}`,
);
