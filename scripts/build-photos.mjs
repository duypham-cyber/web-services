#!/usr/bin/env node
/**
 * build-photos.mjs — xuất ảnh minh họa / ảnh thật của content/photos.ts (D-31, docs/PHOTOS.md).
 *
 *   node scripts/build-photos.mjs           # xuất lại mọi ảnh
 *   node scripts/build-photos.mjs --check   # chỉ kiểm: đủ file, đúng kích thước, dưới ngân sách (không ghi)
 *
 * Từ bản gốc assets/photos/<master>:
 *  - public/images/photos/<id>-<w>.avif + .webp ở photoWidths() (640, 1024, bề rộng gốc) cho <picture> (components/media/Photo.tsx);
 *  - bản JPEG 16:9 `wide` (nếu có) cho ảnh đầu bài Kiến thức (next/image tự xuất AVIF/WebP).
 * Ngân sách (budgets.json QA-IMG): bản 1024 px là bản điện thoại tải (412 px × DPR 1,75) → AVIF ≤ 90 KB; bản gốc ≤ 150 KB.
 */
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { loadTs, ROOT } from './lib/load-ts.mjs';

const CHECK = process.argv.includes('--check');
const { PHOTOS, photoWidths, photoSrc } = await loadTs('content/photos.ts');
const OUT = join(ROOT, 'public', 'images', 'photos');
const LIMIT_KB = { 1024: 90, max: 150 };
const pub = (p) => join(ROOT, 'public', p.replace(/^\//, ''));

let failed = false;
const fail = (msg) => {
  console.error(`[photos] LỖI ${msg}`);
  failed = true;
};
const kb = (file) => statSync(file).size / 1024;

if (!CHECK) mkdirSync(OUT, { recursive: true });

for (const photo of Object.values(PHOTOS)) {
  const master = join(ROOT, 'assets', 'photos', photo.master);
  if (!existsSync(master)) {
    fail(`${photo.id}: thiếu bản gốc assets/photos/${photo.master}`);
    continue;
  }
  const meta = await sharp(master).metadata();
  if (meta.width !== photo.width || meta.height !== photo.height) {
    fail(`${photo.id}: content/photos.ts ghi ${photo.width}×${photo.height}, bản gốc là ${meta.width}×${meta.height}`);
    continue;
  }

  const widths = photoWidths(photo);
  for (const w of widths) {
    for (const ext of ['avif', 'webp']) {
      const file = pub(photoSrc(photo, w, ext));
      if (!CHECK) {
        const img = sharp(master).resize({ width: w, withoutEnlargement: true });
        await (ext === 'avif'
          ? img.avif({ quality: 60, effort: 6, chromaSubsampling: '4:2:0' })
          : img.webp({ quality: 78, effort: 6, smartSubsample: true })
        ).toFile(file);
      }
      if (!existsSync(file)) {
        fail(`${photo.id}: thiếu ${photoSrc(photo, w, ext)}`);
        continue;
      }
      const limit = w === 1024 ? LIMIT_KB[1024] : w === photo.width ? LIMIT_KB.max : Infinity;
      const size = kb(file);
      if (ext === 'avif' && size > limit) fail(`${photo.id}-${w}.avif ${size.toFixed(0)} KB > ${limit} KB`);
    }
  }
  const sizes = widths.map((w) => `${w}:${kb(pub(photoSrc(photo, w, 'avif'))).toFixed(0)}KB`).join(' ');

  let wideNote = '';
  if (photo.wide) {
    // Cắt 16:9 lớn nhất trong bản gốc, dịch theo focusY (0 = sát mép trên, 1 = sát mép dưới).
    const ratio = 16 / 9;
    const cw = photo.width / photo.height > ratio ? Math.round(photo.height * ratio) : photo.width;
    const ch = Math.round(cw / ratio);
    if (cw !== photo.wide.width || ch !== photo.wide.height) {
      fail(`${photo.id}: wide ghi ${photo.wide.width}×${photo.wide.height}, cắt 16:9 ra ${cw}×${ch}`);
    } else {
      const file = pub(photo.wide.src);
      if (!CHECK) {
        const left = Math.round((photo.width - cw) / 2);
        const top = Math.round((photo.height - ch) * (photo.wide.focusY ?? 0.5));
        await sharp(master).extract({ left, top, width: cw, height: ch }).jpeg({ quality: 86, mozjpeg: true }).toFile(file);
      }
      if (!existsSync(file)) fail(`${photo.id}: thiếu ${photo.wide.src}`);
      else wideNote = ` · 16:9 ${kb(file).toFixed(0)} KB`;
    }
  }
  console.log(`[photos] ${photo.id} AVIF ${sizes}${wideNote}`);
}

if (failed) process.exit(1);
console.log(CHECK ? '[photos] kiểm xong: đủ file, đúng kích thước, dưới ngân sách' : '[photos] xuất xong');
