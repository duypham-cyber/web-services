#!/usr/bin/env node
/**
 * db-migrate.mjs — chạy migration Postgres của repo (db/migrations/<YYYYMMDDHHMMSS>-<tên>.mjs), dùng `pg`.
 *
 *   node scripts/db-migrate.mjs status            # đã chạy / chưa chạy
 *   node scripts/db-migrate.mjs up                # chạy mọi migration chưa chạy (mỗi file một transaction)
 *   node scripts/db-migrate.mjs down [--steps N]  # hoàn tác N migration mới nhất (mặc định 1)
 *   thêm --test                                   # database test (DATABASE_URL_TEST_OWNER)
 *   thêm --url-env TÊN_BIẾN                       # đọc chuỗi kết nối từ biến khác
 *   thêm --force                                  # cho phép `down` khi bảng còn dữ liệu (downGuard > 0) — KHÔNG dùng ở production
 *
 * Chuỗi kết nối: role chủ schema (bb_owner) — MIGRATION_DATABASE_URL hoặc DATABASE_URL_OWNER; `.env.local` được nạp nếu có.
 * Mỗi file migration export `up` (SQL), `down` (SQL), tùy chọn `downGuard` (SQL trả cột n) và `description`.
 * Bảng `schema_migrations` ghi version đã chạy; khóa advisory để hai tiến trình không chạy chồng nhau.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { loadLocalEnv, ROOT } from '../lib/leads/script-runtime.mjs';

const MIGRATIONS_DIR = join(ROOT, 'db', 'migrations');
const FILE_RE = /^(\d{14})-([a-z0-9-]+)\.mjs$/;
const LOCK_KEY = 'bluebolt-web:migrations';

const args = process.argv.slice(2);
const command = args[0];
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
};

function usage(code = 1) {
  process.stdout.write('Dùng: node scripts/db-migrate.mjs <status|up|down> [--test] [--steps N] [--url-env TÊN] [--force]\n');
  process.exit(code);
}
if (!['status', 'up', 'down'].includes(command)) usage(command === '--help' || command === '-h' ? 0 : 1);

loadLocalEnv();
const urlEnv = option('--url-env') ?? (flag('--test') ? 'DATABASE_URL_TEST_OWNER' : process.env.MIGRATION_DATABASE_URL ? 'MIGRATION_DATABASE_URL' : 'DATABASE_URL_OWNER');
const connectionString = process.env[urlEnv];
if (!connectionString) {
  process.stderr.write(`[db-migrate] thiếu biến ${urlEnv} (chuỗi kết nối role chủ schema). Dev: node scripts/db-dev-setup.mjs\n`);
  process.exit(1);
}
const where = (() => {
  const u = new URL(connectionString);
  return `${decodeURIComponent(u.username)}@${u.hostname}:${u.port || 5432}${u.pathname}`;
})();

const files = readdirSync(MIGRATIONS_DIR)
  .map((name) => ({ name, m: FILE_RE.exec(name) }))
  .filter((f) => f.m)
  .map((f) => ({ version: f.m[1], name: f.m[2], file: join(MIGRATIONS_DIR, f.name) }))
  .sort((a, b) => a.version.localeCompare(b.version));

const loadMigration = async (f) => {
  const mod = await import(pathToFileURL(f.file).href);
  if (typeof mod.up !== 'string' || typeof mod.down !== 'string') {
    throw new Error(`${f.version}-${f.name}: phải export chuỗi SQL "up" và "down"`);
  }
  return mod;
};

const client = new pg.Client({ connectionString, application_name: 'bluebolt-web-migrate', connectionTimeoutMillis: 5000 });
let exitCode = 0;
try {
  await client.connect();
  await client.query('SELECT pg_advisory_lock(hashtext($1))', [LOCK_KEY]);
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version    VARCHAR(14) PRIMARY KEY,
    name       TEXT        NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const applied = new Map(
    (await client.query('SELECT version, name, applied_at FROM schema_migrations ORDER BY version')).rows.map((r) => [r.version, r]),
  );
  process.stdout.write(`[db-migrate] ${where} — ${command}\n`);

  if (command === 'status') {
    for (const f of files) {
      const row = applied.get(f.version);
      process.stdout.write(`  ${row ? 'đã chạy ' : 'CHƯA    '} ${f.version}-${f.name}${row ? `  (${row.applied_at.toISOString()})` : ''}\n`);
    }
    for (const [version, row] of applied) {
      if (!files.some((f) => f.version === version)) process.stdout.write(`  MẤT FILE ${version}-${row.name}\n`);
    }
  }

  if (command === 'up') {
    const pending = files.filter((f) => !applied.has(f.version));
    if (pending.length === 0) process.stdout.write('  không có migration mới\n');
    for (const f of pending) {
      const mod = await loadMigration(f);
      await client.query('BEGIN');
      try {
        await client.query(mod.up);
        await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [f.version, f.name]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`${f.version}-${f.name} (up): ${err.message}`);
      }
      process.stdout.write(`  ↑ ${f.version}-${f.name}\n`);
    }
  }

  if (command === 'down') {
    const steps = Math.max(1, Number(option('--steps') ?? 1));
    const targets = [...applied.keys()].sort().reverse().slice(0, steps);
    if (targets.length === 0) process.stdout.write('  chưa có migration nào để hoàn tác\n');
    for (const version of targets) {
      const f = files.find((x) => x.version === version);
      if (!f) throw new Error(`không tìm thấy file cho version ${version} — không hoàn tác được`);
      const mod = await loadMigration(f);
      if (typeof mod.downGuard === 'string' && !flag('--force')) {
        const n = Number((await client.query(mod.downGuard)).rows[0]?.n ?? 0);
        if (n > 0) {
          throw new Error(`${f.version}-${f.name}: bảng còn ${n} dòng — từ chối "down" để không mất dữ liệu (thêm --force nếu chắc chắn, KHÔNG dùng ở production)`);
        }
      }
      await client.query('BEGIN');
      try {
        await client.query(mod.down);
        await client.query('DELETE FROM schema_migrations WHERE version = $1', [f.version]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`${f.version}-${f.name} (down): ${err.message}`);
      }
      process.stdout.write(`  ↓ ${f.version}-${f.name}\n`);
    }
  }
} catch (err) {
  process.stderr.write(`[db-migrate] LỖI: ${err.message}\n`);
  exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
process.exit(exitCode);
