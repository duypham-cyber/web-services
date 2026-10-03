#!/usr/bin/env node
/**
 * leads-cleanup.mjs — xóa lead quá thời hạn lưu, contracts/lead-b2b.md mục 2.2 + 6.4 (contract gọi là leads-purge.mjs).
 *
 *   node scripts/leads-cleanup.mjs              # xóa lead có created_at cũ hơn LEAD_RETENTION_DAYS ngày
 *   node scripts/leads-cleanup.mjs --dry-run    # chỉ đếm, không xóa
 *   thêm --test để chạy trên database test (DATABASE_URL_TEST_OPS)
 *
 * - TẮT khi LEAD_RETENTION_DAYS trống: thời hạn lưu chờ pháp chế (PC-03). Không tự đặt số.
 * - DELETE thật (role bb_ops); dòng lead_notifications bị xóa theo cascade. Bản sao trong hộp thư/sao lưu: theo pháp chế.
 * - Ghi một dòng nhật ký KHÔNG PII vào logs/leads-ops.log (số dòng, số ngày, người chạy).
 */
import pg from 'pg';
import { appendOpsLog, loadLocalEnv } from '../lib/leads/script-runtime.mjs';

loadLocalEnv();
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const urlEnv = args.includes('--test') ? 'DATABASE_URL_TEST_OPS' : 'DATABASE_URL_OPS';
const say = (msg) => process.stdout.write(`[leads-cleanup] ${msg}\n`);

const rawDays = (process.env.LEAD_RETENTION_DAYS ?? '').trim();
if (rawDays === '') {
  say('LEAD_RETENTION_DAYS trống → tắt (chờ pháp chế chốt thời hạn lưu, PC-03). Không xóa gì.');
  process.exit(0);
}
const days = Number(rawDays);
if (!Number.isInteger(days) || days < 1) {
  process.stderr.write('[leads-cleanup] LỖI: LEAD_RETENTION_DAYS phải là số nguyên ≥ 1\n');
  process.exit(1);
}
const connectionString = process.env[urlEnv];
if (!connectionString) {
  process.stderr.write(`[leads-cleanup] LỖI: thiếu biến ${urlEnv} (role bb_ops)\n`);
  process.exit(1);
}

const client = new pg.Client({ connectionString, application_name: 'bluebolt-web-leads-cleanup', connectionTimeoutMillis: 5000 });
let exitCode = 0;
try {
  await client.connect();
  const where = `created_at < NOW() - make_interval(days => $1::int)`;
  if (dryRun) {
    const n = (await client.query(`SELECT count(*)::int AS n FROM leads WHERE ${where}`, [days])).rows[0]?.n ?? 0;
    say(`(thử) ${n} lead cũ hơn ${days} ngày sẽ bị xóa`);
    appendOpsLog({ script: 'leads-cleanup', command: 'dry-run', retentionDays: days, count: n, db: urlEnv });
  } else {
    const { rowCount } = await client.query(`DELETE FROM leads WHERE ${where}`, [days]);
    say(`đã xóa ${rowCount ?? 0} lead cũ hơn ${days} ngày`);
    appendOpsLog({ script: 'leads-cleanup', command: 'delete', retentionDays: days, count: rowCount ?? 0, db: urlEnv });
  }
} catch (err) {
  process.stderr.write(`[leads-cleanup] LỖI: ${err instanceof Error ? err.message : String(err)}\n`);
  exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
process.exit(exitCode);
