#!/usr/bin/env node
/**
 * check-legacy-syntax.mjs — dò cú pháp JS mà Safari 15.4 (sàn browserslist trong package.json, D-35) không đọc được trong
 * chunk của một bản build. Một lỗi cú pháp làm hỏng CẢ file: trước D-35, hai chunk tải đầu có class static block
 * (`static{…}`, Safari ≥ 16.4) nên Safari cũ không chạy được JavaScript nào (menu chết, bản đồ 3D không chạy).
 *
 *   node scripts/check-legacy-syntax.mjs <distDir>     (scripts/safe-build.sh tự gọi sau mỗi build)
 *
 * Dò: class static block · regex lookbehind (?<= (?<! · regex cờ v · import attributes. Phân tích bằng acorn (có sẵn qua
 * eslint → espree, không cài thêm). Thoát 1 nếu thấy.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';

const dist = process.argv[2];
if (!dist) {
  console.error('Dùng: node scripts/check-legacy-syntax.mjs <distDir>');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const acorn = require('acorn');

const root = join(dist, 'static', 'chunks');
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.js')) files.push(p);
  }
})(root);

const problems = [];
for (const file of files) {
  const code = readFileSync(file, 'utf8');
  let ast;
  for (const sourceType of ['script', 'module']) {
    try {
      ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType, allowHashBang: true });
      break;
    } catch (e) {
      if (sourceType === 'module') problems.push(`${relative(dist, file)}: không phân tích được (${e.message})`);
    }
  }
  if (!ast) continue;
  const stack = [ast];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n.type !== 'string') continue;
    let why = '';
    if (n.type === 'StaticBlock') why = 'class static block (Safari ≥ 16.4)';
    else if (n.regex && /\(\?<[=!]/.test(n.regex.pattern)) why = 'regex lookbehind (Safari ≥ 16.4)';
    else if (n.regex && n.regex.flags.includes('v')) why = 'regex cờ v (Safari ≥ 17)';
    else if (n.attributes && n.attributes.length) why = 'import attributes (Safari ≥ 17.2)';
    if (why) problems.push(`${relative(dist, file)} @${n.start}: ${why}`);
    for (const k in n) {
      const c = n[k];
      if (Array.isArray(c)) for (const x of c) stack.push(x);
      else if (c && typeof c.type === 'string') stack.push(c);
    }
  }
}

if (problems.length) {
  console.error(`[legacy-syntax] ${problems.length} chỗ Safari 15.4 không đọc được (browserslist trong package.json chưa hạ được):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`[legacy-syntax] ${files.length} chunk — không có cú pháp vượt Safari 15.4`);
