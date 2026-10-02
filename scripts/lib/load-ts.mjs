/**
 * load-ts.mjs — nạp một module TypeScript của repo (vd content/redirects.ts) từ script Node .mjs, không cần tsx/jiti.
 * Dùng `typescript` (devDependency đã ghim) để transpile file + mọi import TƯƠNG ĐỐI của nó sang .mjs trong thư mục
 * tạm, rồi import(). Import chỉ dùng làm kiểu bị TypeScript bỏ đi. KHÔNG hỗ trợ alias "@/..." (file content/ không dùng).
 *
 *   import { loadTs } from './lib/load-ts.mjs';
 *   const { legacyRedirects } = await loadTs('content/redirects.ts');
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function resolveSpecifier(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), base]) {
    if (existsSync(candidate) && /\.(ts|tsx)$/.test(candidate)) return candidate;
  }
  throw new Error(`load-ts: không tìm thấy "${spec}" (import từ ${relative(ROOT, fromFile)})`);
}

/** @param {string} entry đường dẫn tương đối từ gốc repo hoặc tuyệt đối */
export async function loadTs(entry) {
  const outRoot = mkdtempSync(join(tmpdir(), 'bb-load-ts-'));
  const done = new Map();
  const outPath = (file) => join(outRoot, relative(ROOT, file)).replace(/\.tsx?$/, '.mjs');

  const visit = (file) => {
    if (done.has(file)) return done.get(file);
    const target = outPath(file);
    done.set(file, target);
    const source = readFileSync(file, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        isolatedModules: true,
      },
    });
    const rewritten = outputText.replace(/(from\s+|import\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (_m, lead, q, spec) => {
      const dep = resolveSpecifier(file, spec);
      const depOut = visit(dep);
      let rel = relative(dirname(target), depOut);
      if (!rel.startsWith('.')) rel = `./${rel}`;
      return `${lead}${q}${rel}${q}`;
    });
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, rewritten);
    return target;
  };

  const abs = resolve(ROOT, entry);
  try {
    const out = visit(abs);
    return await import(pathToFileURL(out).href);
  } finally {
    rmSync(outRoot, { recursive: true, force: true });
  }
}

export { ROOT };
