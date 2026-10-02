#!/usr/bin/env node
/**
 * check-no-draft.mjs — cổng "bản production không lộ nội dung nháp" (contracts/site-shell-p0.md AC-DATA-1…4, R-CLAIM,
 * docs/DECISIONS.md D-05). Dò MỌI file trang tĩnh của một bản build (HTML + payload RSC + body route handler) dưới
 * <distDir>/server/app và báo lỗi nếu còn:
 *   1. nhãn "Nháp"/"Draft" (DraftBadge), nhãn "Nháp · số site cũ" (KPI số site cũ — lib/stats.ts);
 *   2. thuộc tính data-draft-preview (dấu hiệu bản build có DRAFT_PREVIEW=1);
 *   3. chữ của câu khẳng định CHƯA DUYỆT (content/claims/*, cả VI và EN) và cột "đang ghi" của SLA chưa duyệt (content/sla.ts);
 *   4. nguồn số site cũ (content/stats.ts legacySource) và chữ của các khóa messages CHỈ dùng ở bản xem trước
 *      (ghi chú dựng trang common.dev.*, ghi chú duyệt nội dung — danh sách PREVIEW_ONLY_KEYS dưới đây).
 *
 *   node scripts/check-no-draft.mjs .next-check-12345      # thư mục build (mặc định: .next-check-* mới nhất)
 *   node scripts/check-no-draft.mjs .next-check-12345 --json
 * Exit 1 nếu có vi phạm. Build có DRAFT_PREVIEW=1 thì đương nhiên đỏ — chỉ chạy cho bản production.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadTs, ROOT } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const distArg = args.find((a) => !a.startsWith('--'));

function latestDist() {
  const dirs = readdirSync(ROOT)
    .filter((d) => d.startsWith('.next-') && statSync(join(ROOT, d)).isDirectory())
    .map((d) => ({ d, t: statSync(join(ROOT, d)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (dirs.length === 0) throw new Error('Không có thư mục build .next-* — chạy scripts/safe-build.sh trước');
  return dirs[0].d;
}

const DIST = distArg ?? latestDist();
const APP_DIR = join(ROOT, DIST, 'server', 'app');

// ---------------------------------------------------------------------------------------------
// Khóa messages CHỈ hiện ở bản xem trước (đã kiểm từng chỗ dùng: nằm sau isDraftPreview()/DraftLine/DraftNote/
// PendingPanel/PreviewNote). Thêm khóa preview mới thì thêm vào đây. "*" = cả nhánh.
// ---------------------------------------------------------------------------------------------
const PREVIEW_ONLY_KEYS = [
  'common.status.draft',
  'common.status.draftLegacy',
  'common.dev.*',
  'home.proof.draftLine',
  'home.media.photoPending',
  'home.cta.formPending',
  'home.process.pendingNote',
  'partners.media.photoPending',
  'partners.earnings.draftNote',
  'partners.jobs.draftNote',
  'partners.register.formPending',
  'partners.register.appPending',
  'partners.register.testimonialsPending',
  'solutions.kit.pendingTitle',
  'solutions.kit.pendingIntro',
  'solutions.kit.sla.draftCaption',
  'services.detail.warrantyTable.draftCaption',
  'network.map.draftPinsNote',
  'network.stats.hiddenNote',
  'network.sla.reviewTitle',
  'network.sla.reviewIntro',
  'network.review.*',
  'about.milestones.pending',
  'about.kpi.pending',
  'about.partners.pending',
  'legal.reviewNoteLabel',
];

const loadJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

function pick(tree, path) {
  const parts = path.split('.');
  let node = tree;
  for (const part of parts) {
    if (part === '*') break;
    node = node?.[part];
  }
  if (node === undefined) throw new Error(`check-no-draft: không có khóa messages "${path}"`);
  const out = [];
  const walk = (n) => (typeof n === 'string' ? out.push(n) : Object.values(n).forEach(walk));
  walk(node);
  return out;
}

/** Các đoạn chữ cần dò: bỏ biến ICU {x}, tách theo ký tự bị escape khác nhau giữa HTML/JSON, giữ đoạn đủ dài. */
function fragments(text, min = 14) {
  return text
    .split(/\{[^}]*\}|["'&<>\\]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= min);
}

const needles = []; // { kind, label, re?|text }
const add = (kind, label, text) => {
  for (const f of fragments(text)) needles.push({ kind, label, text: f });
};

// 1. Nhãn ngắn: chỉ khớp khi là cả một nút chữ (>Nháp< trong HTML, "Nháp" / \"Nháp\" trong payload RSC)
for (const locale of ['vi', 'en']) {
  const common = loadJson(`messages/${locale}/common.json`);
  for (const label of [common.status.draft, common.status.draftLegacy]) {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    needles.push({ kind: 'nhãn nháp', label: `common.status (${locale})`, re: new RegExp(`(?:>|\\\\?")${esc}(?:<|\\\\?")`) });
  }
}
needles.push({ kind: 'dấu bản xem trước', label: 'data-draft-preview', re: /data-draft-preview/ });

// 2. Khóa messages chỉ dùng ở bản xem trước
const NAMESPACE_CACHE = new Map();
for (const key of PREVIEW_ONLY_KEYS) {
  const [ns, ...rest] = key.split('.');
  for (const locale of ['vi', 'en']) {
    const id = `${locale}/${ns}`;
    if (!NAMESPACE_CACHE.has(id)) NAMESPACE_CACHE.set(id, loadJson(`messages/${locale}/${ns}.json`));
    for (const text of pick(NAMESPACE_CACHE.get(id), rest.join('.'))) add('messages chỉ bản xem trước', `${key} (${locale})`, text);
  }
}

// 3. Câu khẳng định chưa duyệt, SLA "đang ghi", nguồn số site cũ
const { ALL_CLAIMS } = await loadTs('content/claims/index.ts');
for (const c of ALL_CLAIMS) {
  if (c.status === 'approved') continue;
  add('claim nháp', `${c.id} (vi)`, c.text.vi);
  add('claim nháp', `${c.id} (en)`, c.text.en);
}
const { slaItems } = await loadTs('content/sla.ts');
for (const s of slaItems) {
  if (s.status === 'approved') continue;
  add('SLA đang ghi (chưa duyệt)', `${s.id} (vi)`, s.current.vi);
  add('SLA đang ghi (chưa duyệt)', `${s.id} (en)`, s.current.en);
}
const { stats } = await loadTs('content/stats.ts');
for (const s of stats) if (s.legacySource) add('nguồn số site cũ', `${s.id}.legacySource`, s.legacySource);

// ---------------------------------------------------------------------------------------------
// Dò file
// ---------------------------------------------------------------------------------------------
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(html|rsc|body)$/.test(name) ? [p] : [];
  });
}

const files = walk(APP_DIR);
const violations = [];
for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  for (const n of needles) {
    const hit = n.re ? n.re.exec(raw) : raw.includes(n.text) ? { index: raw.indexOf(n.text) } : null;
    if (!hit) continue;
    const at = hit.index;
    violations.push({
      file: relative(ROOT, file),
      kind: n.kind,
      label: n.label,
      context: raw.slice(Math.max(0, at - 60), at + 80).replace(/\s+/g, ' '),
    });
  }
}

const summary = {
  dist: DIST,
  files: files.length,
  html: files.filter((f) => f.endsWith('.html')).length,
  needles: needles.length,
  violations: violations.length,
};
if (JSON_OUT) {
  console.log(JSON.stringify({ ...summary, violations }, null, 2));
} else {
  console.log(
    `[check-no-draft] ${DIST}: ${summary.files} file (${summary.html} HTML), ${summary.needles} mẫu dò → ${summary.violations} vi phạm`,
  );
  const seen = new Set();
  for (const v of violations) {
    const k = `${v.kind}|${v.label}`;
    const count = violations.filter((x) => `${x.kind}|${x.label}` === k).length;
    if (seen.has(k)) continue;
    seen.add(k);
    console.log(`  ✗ [${v.kind}] ${v.label} — ${count} file, vd ${v.file}\n      …${v.context}…`);
  }
}
process.exit(violations.length > 0 ? 1 : 0);
