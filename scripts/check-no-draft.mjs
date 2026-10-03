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
 * Số và câu ĐÃ DUYỆT (claim "approved", SLA "approved", KPI có value — vd "500+", "34/34", "60 phút", D-26/D-27) không bị
 * dò: chúng hiện ở production mà không có nhãn nháp. Một đoạn chữ của mục 3–4 mà trùng y nguyên một đoạn của nội dung đã
 * duyệt được bỏ qua (in số lượng ở dòng tổng kết) để cổng không báo nhầm; mọi đoạn khác của câu nháp vẫn bị dò.
 * Unit test: tests/unit/claims.test.ts (buildNeedles, findViolations).
 *
 *   node scripts/check-no-draft.mjs .next-check-12345      # thư mục build (mặc định: .next-check-* mới nhất)
 *   node scripts/check-no-draft.mjs .next-check-12345 --json
 * Exit 1 nếu có vi phạm. Build có DRAFT_PREVIEW=1 thì đương nhiên đỏ — chỉ chạy cho bản production.
 */
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTs, ROOT } from './lib/load-ts.mjs';

// ---------------------------------------------------------------------------------------------
// Khóa messages CHỈ hiện ở bản xem trước (đã kiểm từng chỗ dùng: nằm sau isDraftPreview()/DraftLine/DraftNote/
// PendingPanel/PreviewNote). Thêm khóa preview mới thì thêm vào đây. "*" = cả nhánh.
// ---------------------------------------------------------------------------------------------
export const PREVIEW_ONLY_KEYS = [
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

const LOCALES = ['vi', 'en'];

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
export function fragments(text, min = 14) {
  return text
    .split(/\{[^}]*\}|["'&<>\\]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= min);
}

/**
 * Chữ của nội dung ĐÃ DUYỆT, được phép hiện ở production: claim "approved", SLA "approved" (nhãn + giá trị), KPI có value
 * (nhãn + định nghĩa) và số theo miền đã duyệt (nhãn).
 */
export function approvedTexts({ claims, slaItems, stats }) {
  const out = [];
  for (const c of claims) if (c.status === 'approved') out.push(c.text.vi, c.text.en);
  for (const s of slaItems) {
    if (s.status === 'approved' && s.value) out.push(s.label.vi, s.label.en, s.value.vi, s.value.en);
  }
  for (const s of stats) {
    if (s.value === null) continue;
    out.push(s.label.vi, s.label.en, s.definition.vi, s.definition.en);
    for (const r of s.byRegion ?? []) out.push(r.label.vi, r.label.en);
  }
  return out;
}

/**
 * Dựng danh sách mẫu dò (hàm thuần — unit test gọi với dữ liệu thật hoặc dữ liệu giả).
 * @param {{ loadMessages: (locale: string, namespace: string) => object, claims: object[], slaItems: object[], stats: object[] }} input
 * @returns {{ needles: { kind: string, label: string, text?: string, re?: RegExp }[], skipped: { kind: string, label: string, text: string }[] }}
 */
export function buildNeedles({ loadMessages, claims, slaItems, stats }) {
  const needles = [];
  const skipped = [];
  const approved = approvedTexts({ claims, slaItems, stats });
  const addStrict = (kind, label, text) => {
    for (const f of fragments(text)) needles.push({ kind, label, text: f });
  };
  // Mục 3–4 (nội dung chưa duyệt): đoạn trùng y nguyên chữ đã duyệt thì bỏ qua — nó hiện vì nội dung đã duyệt.
  const addContent = (kind, label, text) => {
    for (const f of fragments(text)) {
      if (approved.some((a) => a.includes(f))) skipped.push({ kind, label, text: f });
      else needles.push({ kind, label, text: f });
    }
  };

  // 1. Nhãn ngắn: chỉ khớp khi là cả một nút chữ (>Nháp< trong HTML, "Nháp" / \"Nháp\" trong payload RSC)
  for (const locale of LOCALES) {
    const common = loadMessages(locale, 'common');
    for (const label of [common.status.draft, common.status.draftLegacy]) {
      const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      needles.push({ kind: 'nhãn nháp', label: `common.status (${locale})`, re: new RegExp(`(?:>|\\\\?")${esc}(?:<|\\\\?")`) });
    }
  }
  needles.push({ kind: 'dấu bản xem trước', label: 'data-draft-preview', re: /data-draft-preview/ });

  // 2. Khóa messages chỉ dùng ở bản xem trước (không miễn trừ)
  for (const key of PREVIEW_ONLY_KEYS) {
    const [ns, ...rest] = key.split('.');
    for (const locale of LOCALES) {
      for (const text of pick(loadMessages(locale, ns), rest.join('.'))) addStrict('messages chỉ bản xem trước', `${key} (${locale})`, text);
    }
  }

  // 3. Câu khẳng định chưa duyệt, SLA "đang ghi" chưa duyệt
  for (const c of claims) {
    if (c.status === 'approved') continue;
    addContent('claim nháp', `${c.id} (vi)`, c.text.vi);
    addContent('claim nháp', `${c.id} (en)`, c.text.en);
  }
  for (const s of slaItems) {
    if (s.status === 'approved') continue;
    addContent('SLA đang ghi (chưa duyệt)', `${s.id} (vi)`, s.current.vi);
    addContent('SLA đang ghi (chưa duyệt)', `${s.id} (en)`, s.current.en);
  }
  // 4. Nguồn số site cũ — ghi chú nội bộ, không bao giờ được render (kể cả khi KPI đã có số duyệt)
  for (const s of stats) if (s.legacySource) addContent('nguồn số site cũ', `${s.id}.legacySource`, s.legacySource);

  return { needles, skipped };
}

/** Dò một file đã đọc; trả mọi mẫu khớp (kèm vị trí đầu tiên). */
export function findViolations(raw, needles) {
  const hits = [];
  for (const n of needles) {
    const at = n.re ? (n.re.exec(raw)?.index ?? -1) : raw.indexOf(n.text);
    if (at >= 0) hits.push({ needle: n, at });
  }
  return hits;
}

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------
function latestDist() {
  const dirs = readdirSync(ROOT)
    .filter((d) => d.startsWith('.next-') && statSync(join(ROOT, d)).isDirectory())
    .map((d) => ({ d, t: statSync(join(ROOT, d)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (dirs.length === 0) throw new Error('Không có thư mục build .next-* — chạy scripts/safe-build.sh trước');
  return dirs[0].d;
}

function walkDist(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walkDist(p);
    return /\.(html|rsc|body)$/.test(name) ? [p] : [];
  });
}

async function main() {
  const args = process.argv.slice(2);
  const JSON_OUT = args.includes('--json');
  const distArg = args.find((a) => !a.startsWith('--'));
  const DIST = distArg ?? latestDist();
  const APP_DIR = join(ROOT, DIST, 'server', 'app');

  const cache = new Map();
  const loadMessages = (locale, ns) => {
    const id = `${locale}/${ns}`;
    if (!cache.has(id)) cache.set(id, JSON.parse(readFileSync(join(ROOT, `messages/${id}.json`), 'utf8')));
    return cache.get(id);
  };
  const { ALL_CLAIMS } = await loadTs('content/claims/index.ts');
  const { slaItems } = await loadTs('content/sla.ts');
  const { stats } = await loadTs('content/stats.ts');
  const { needles, skipped } = buildNeedles({ loadMessages, claims: ALL_CLAIMS, slaItems, stats });

  const files = walkDist(APP_DIR);
  const violations = [];
  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    for (const { needle, at } of findViolations(raw, needles)) {
      violations.push({
        file: relative(ROOT, file),
        kind: needle.kind,
        label: needle.label,
        context: raw.slice(Math.max(0, at - 60), at + 80).replace(/\s+/g, ' '),
      });
    }
  }

  const summary = {
    dist: DIST,
    files: files.length,
    html: files.filter((f) => f.endsWith('.html')).length,
    needles: needles.length,
    skippedApproved: skipped.length,
    violations: violations.length,
  };
  if (JSON_OUT) {
    console.log(JSON.stringify({ ...summary, skipped, violations }, null, 2));
  } else {
    console.log(
      `[check-no-draft] ${DIST}: ${summary.files} file (${summary.html} HTML), ${summary.needles} mẫu dò ` +
        `(bỏ qua ${summary.skippedApproved} đoạn trùng nội dung đã duyệt) → ${summary.violations} vi phạm`,
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
}

// Chạy CLI chỉ khi gọi trực tiếp (node scripts/check-no-draft.mjs); import từ unit test thì không. So realpath để gọi qua
// symlink vẫn chạy (không bao giờ thoát im lặng với mã 0 mà chưa dò).
const invokedDirectly = (() => {
  try {
    return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (invokedDirectly) await main();
