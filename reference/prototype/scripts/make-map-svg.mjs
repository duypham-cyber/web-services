// Sinh public/vn-map.svg + public/data/vn-centroids.json từ TopoJSON 34 tỉnh (chạy 1 lần lúc dựng asset)
import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoMercator, geoPath, geoCentroid, geoArea } from 'd3-geo';
const topo = JSON.parse(fs.readFileSync(new URL('../public/data/vn34.topo.json', import.meta.url)));
const fc = feature(topo, topo.objects['vn34-all']);
const W = 600, H = 1000;
const proj = geoMercator().fitExtent([[20, 20], [W - 20, H - 20]], fc);
const path = geoPath(proj);
const hs = proj([112.0, 16.5]), ts = proj([114.3, 9.4]);
const paths = fc.features.map(f => `<path d="${path(f)}"/>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g fill="#12305f" stroke="#2f5d9e" stroke-width="1.2" stroke-linejoin="round">${paths}</g><g fill="#7FAAF0" font-family="Be Vietnam Pro,Arial,sans-serif" font-size="15" text-anchor="middle"><text x="${hs[0]}" y="${hs[1]-22}">QĐ. Hoàng Sa</text><text x="${ts[0]}" y="${ts[1]+70}">QĐ. Trường Sa</text></g></svg>`;
fs.writeFileSync(new URL('../public/vn-map.svg', import.meta.url), svg);
// tâm theo đa giác lớn nhất (tránh tâm bị kéo ra biển bởi quần đảo)
const mainPart = (f) => f.geometry.type !== 'MultiPolygon' ? f : { type: 'Feature', geometry: { type: 'Polygon', coordinates: f.geometry.coordinates.reduce((a, c) => (geoArea({ type: 'Polygon', coordinates: c }) > geoArea({ type: 'Polygon', coordinates: a }) ? c : a)) } };
const cents = fc.features.map(f => { const [x, y] = proj(geoCentroid(mainPart(f))); return { code: f.properties.code, name: f.properties.name, x: +(x / W).toFixed(4), y: +(y / H).toFixed(4) }; });
fs.writeFileSync(new URL('../src/vn-centroids.json', import.meta.url), JSON.stringify(cents));
console.log('svg bytes', svg.length, 'provinces', cents.length);
