/**
 * Môi trường chạy cho script Node của form lead (scripts/leads-*.mjs, scripts/db-*.mjs). KHÔNG import từ app Next.
 *
 * 1. `loadLocalEnv()` — nạp `.env.local` ở gốc repo nếu có. Biến đã có trong môi trường (systemd, CI, dòng lệnh) được GIỮ
 *    NGUYÊN (process.loadEnvFile không ghi đè).
 * 2. `importTs(path)` — import một module TypeScript của repo (vd `lib/leads/outbox.ts`) bằng type stripping có sẵn của Node
 *    (≥ 22.18; máy bbsw: 22.22). Hook resolve thêm đuôi `.ts` cho import tương đối không đuôi (cách viết của Next/TS); hook
 *    load báo trước định dạng ESM để Node không phải dò cú pháp. Không cần `typescript`, `tsx` hay bước build.
 *    Điều kiện cho file .ts được nạp: chỉ cú pháp xóa được (không enum/namespace/parameter property), import kiểu viết
 *    `import type`, import tương đối (không alias `@/`), không import `next/*`.
 */
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Nạp `.env.local` (hoặc tệp khác) nếu tồn tại. Trả về true nếu đã nạp. */
export function loadLocalEnv(file = '.env.local') {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) return false;
  process.loadEnvFile(path);
  return true;
}

let hooksRegistered = false;
const NOT_FOUND = new Set(['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT']);

function registerTsHooks() {
  if (hooksRegistered) return;
  hooksRegistered = true;
  registerHooks({
    resolve(specifier, context, nextResolve) {
      try {
        return nextResolve(specifier, context);
      } catch (err) {
        const relative = specifier.startsWith('./') || specifier.startsWith('../');
        if (!relative || !NOT_FOUND.has(err?.code)) throw err;
        for (const suffix of ['.ts', '/index.ts']) {
          try {
            return nextResolve(specifier + suffix, context);
          } catch {
            // thử đuôi kế tiếp
          }
        }
        throw err;
      }
    },
    load(url, context, nextLoad) {
      if (url.startsWith('file:') && url.endsWith('.ts') && !url.includes('/node_modules/')) {
        return nextLoad(url, { ...context, format: 'module-typescript' });
      }
      return nextLoad(url, context);
    },
  });
}

/** Import module .ts của repo theo đường dẫn tính từ gốc repo, vd `importTs('lib/leads/outbox.ts')`. */
export async function importTs(relativePath) {
  registerTsHooks();
  return import(pathToFileURL(resolve(ROOT, relativePath)).href);
}
