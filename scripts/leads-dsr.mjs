#!/usr/bin/env node
/**
 * leads-dsr.mjs — xử lý yêu cầu của chủ thể dữ liệu (truy cập / xóa), contracts/lead-b2b.md mục 6.4.
 * CHỈ quản trị kỹ thuật (do anh Duy chỉ định bằng văn bản) chạy, bằng role bb_ops (SELECT, DELETE trên leads).
 *
 *   node scripts/leads-dsr.mjs find --phone "0902 808 049"      # hoặc --email <địa chỉ> | --reference 0B9F3C2E
 *   node scripts/leads-dsr.mjs export --id <uuid> --out <tệp.json>
 *   node scripts/leads-dsr.mjs erase --id <uuid> --yes
 *   thêm --test để chạy trên database test (DATABASE_URL_TEST_OPS)
 *
 * - `find` chỉ in id, type, created_at (KHÔNG in nội dung). `export` ghi JSON ra tệp quyền 600 (không in ra màn hình).
 *   `erase` là DELETE thật; dòng lead_notifications bị xóa theo (ON DELETE CASCADE).
 * - Mỗi lần chạy ghi một dòng nhật ký KHÔNG PII vào logs/leads-ops.log (người chạy, thời điểm, lệnh, loại tìm, id, số dòng) —
 *   KHÔNG ghi số điện thoại/email đã tìm.
 * - Bản sao trong hộp thư nhận thông báo và trong bản sao lưu: xử lý theo hướng dẫn của pháp chế (PC-03, docs/LEADS-RUNBOOK.md).
 * - Chuỗi kết nối: DATABASE_URL_OPS (hoặc DATABASE_URL_TEST_OPS với --test); `.env.local` được nạp nếu có.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
import { appendOpsLog, importTs, loadLocalEnv } from '../lib/leads/script-runtime.mjs';

loadLocalEnv();
const args = process.argv.slice(2);
const command = args[0];
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  const v = i !== -1 ? args[i + 1] : undefined;
  return v !== undefined && !v.startsWith('--') ? v : undefined;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function usage(code = 1) {
  process.stdout.write(
    'Dùng:\n' +
      '  node scripts/leads-dsr.mjs find (--phone <số> | --email <địa chỉ> | --reference <8 hex>) [--test]\n' +
      '  node scripts/leads-dsr.mjs export --id <uuid> --out <tệp.json> [--test]\n' +
      '  node scripts/leads-dsr.mjs erase --id <uuid> --yes [--test]\n',
  );
  process.exit(code);
}
const fail = (msg) => {
  process.stderr.write(`[leads-dsr] LỖI: ${msg}\n`);
  process.exit(1);
};
if (!['find', 'export', 'erase'].includes(command)) usage(command === '--help' || command === '-h' ? 0 : 1);

const urlEnv = flag('--test') ? 'DATABASE_URL_TEST_OPS' : 'DATABASE_URL_OPS';
const connectionString = process.env[urlEnv];
if (!connectionString) fail(`thiếu biến ${urlEnv} (role bb_ops)`);

const client = new pg.Client({ connectionString, application_name: 'bluebolt-web-leads-dsr', connectionTimeoutMillis: 5000 });
let exitCode = 0;
try {
  await client.connect();

  if (command === 'find') {
    const { normalizePhoneVN } = await importTs('lib/leads/rules.ts');
    const phone = option('--phone');
    const email = option('--email');
    const reference = option('--reference');
    let by;
    let rows;
    if (phone !== undefined) {
      const e164 = normalizePhoneVN(phone);
      if (!e164) fail('số điện thoại không đúng định dạng di động Việt Nam');
      by = 'phone';
      ({ rows } = await client.query(
        `SELECT id, type, created_at FROM leads WHERE payload->>'phone' = $1 ORDER BY created_at`,
        [e164],
      ));
    } else if (email !== undefined) {
      by = 'email';
      ({ rows } = await client.query(
        `SELECT id, type, created_at FROM leads WHERE lower(payload->>'workEmail') = $1 ORDER BY created_at`,
        [email.trim().toLowerCase()],
      ));
    } else if (reference !== undefined) {
      if (!/^[0-9a-f]{8}$/i.test(reference)) fail('mã tham chiếu phải là 8 ký tự hex');
      by = 'reference';
      ({ rows } = await client.query(`SELECT id, type, created_at FROM leads WHERE id::text LIKE $1 ORDER BY created_at`, [
        `${reference.toLowerCase()}%`,
      ]));
    } else {
      usage();
    }
    for (const r of rows) process.stdout.write(`${r.id}  ${r.type}  ${r.created_at.toISOString()}\n`);
    process.stdout.write(`[leads-dsr] ${rows.length} lead\n`);
    appendOpsLog({ script: 'leads-dsr', command: 'find', by, ids: rows.map((r) => r.id), count: rows.length, db: urlEnv });
  }

  if (command === 'export') {
    const id = option('--id');
    const out = option('--out');
    if (!id || !UUID.test(id)) fail('--id phải là UUID');
    if (!out) fail('cần --out <tệp.json> (không in dữ liệu cá nhân ra màn hình)');
    const lead = (await client.query('SELECT * FROM leads WHERE id = $1::uuid', [id])).rows[0];
    if (!lead) fail(`không có lead ${id}`);
    const notifications = (
      await client.query(
        `SELECT channel, target, status, attempts, sent_at, created_at FROM lead_notifications WHERE lead_id = $1::uuid
          ORDER BY created_at`,
        [id],
      )
    ).rows;
    const file = resolve(process.cwd(), out);
    const doc = {
      exportedAt: new Date().toISOString(),
      note:
        'Dữ liệu Bluebolt Services lưu về một lần gửi biểu mẫu. ip_hash là mã băm một chiều của địa chỉ IP (không lưu IP). ' +
        'Câu chữ đồng ý đầy đủ theo consent_version nằm trong content/consent.ts.',
      lead,
      notifications,
    };
    writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`, { mode: 0o600 });
    process.stdout.write(`[leads-dsr] đã ghi ${file} (quyền 600). Gửi cho chủ thể dữ liệu qua kênh pháp chế quy định, rồi xóa tệp.\n`);
    appendOpsLog({ script: 'leads-dsr', command: 'export', ids: [id], count: 1, db: urlEnv });
  }

  if (command === 'erase') {
    const id = option('--id');
    if (!id || !UUID.test(id)) fail('--id phải là UUID');
    if (!flag('--yes')) fail('xóa thật, không hoàn tác được — thêm --yes để xác nhận');
    const { rowCount } = await client.query('DELETE FROM leads WHERE id = $1::uuid', [id]);
    process.stdout.write(`[leads-dsr] đã xóa ${rowCount ?? 0} lead (thông báo kèm theo bị xóa theo cascade)\n`);
    appendOpsLog({ script: 'leads-dsr', command: 'erase', ids: [id], count: rowCount ?? 0, db: urlEnv });
    if (!rowCount) exitCode = 2;
  }
} catch (err) {
  process.stderr.write(`[leads-dsr] LỖI: ${err instanceof Error ? err.message : String(err)}\n`);
  exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
process.exit(exitCode);
