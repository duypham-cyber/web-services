#!/usr/bin/env node
/**
 * db-dev-setup.mjs — Postgres cho form lead trên máy bbsw (dev 3091 + bản xem trước 9515). Chạy lại bao nhiêu lần cũng được.
 *
 *   node scripts/db-dev-setup.mjs
 *
 * Làm gì:
 *   1. Container Docker `bluebolt-web-db` (postgres:16-alpine), CHỈ bind 127.0.0.1:<cổng>, volume `bluebolt-web-db`,
 *      --restart unless-stopped, --memory 256m, shared_buffers nhỏ, log lỗi gọn (không in DETAIL/câu lệnh → không lộ dữ liệu).
 *   2. Ba role (contracts/lead-b2b.md mục 2, quyền DB):
 *        bb_owner — chủ schema, chạy migration (scripts/db-migrate.mjs)
 *        bb_app   — app + script retry: chỉ DML do migration cấp (INSERT/SELECT leads; INSERT/SELECT/UPDATE lead_notifications)
 *        bb_ops   — script DSR + dọn theo thời hạn lưu: SELECT/DELETE leads (do migration cấp)
 *      Superuser `postgres` bị xóa mật khẩu → không đăng nhập được qua TCP; quản trị bằng `docker exec ... psql -U postgres`.
 *   3. Hai database: `bluebolt_web` (dev + bản xem trước) và `bluebolt_web_test` (test tích hợp, `npm run test:leads`).
 *   4. Ghi khối biến môi trường vào `.env.local` (gitignore, chmod 600), GIỮ NGUYÊN các dòng khác. Mật khẩu ngẫu nhiên, sinh một
 *      lần rồi dùng lại; script KHÔNG in mật khẩu ra màn hình/log.
 *
 * Chỉ dành cho bbsw. Production: Postgres trong mạng nội bộ Docker, role/mật khẩu từ secret (docs/LEADS-RUNBOOK.md).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = join(ROOT, '.env.local');
const CONTAINER = 'bluebolt-web-db';
const VOLUME = 'bluebolt-web-db';
const IMAGE = 'postgres:16-alpine';
const PORT = Number(process.env.LEADS_DB_PORT || 5450);
const DB_MAIN = 'bluebolt_web';
const DB_TEST = 'bluebolt_web_test';
const BLOCK_START = '# >>> leads — scripts/db-dev-setup.mjs';
const BLOCK_END = '# <<< leads';

const say = (msg) => process.stdout.write(`[db-dev-setup] ${msg}\n`);
const die = (msg) => {
  process.stderr.write(`[db-dev-setup] LỖI: ${msg}\n`);
  process.exit(1);
};
/** Mọi đầu ra của psql/docker đều qua đây trước khi in: che mật khẩu nếu lỡ xuất hiện trong thông báo lỗi. */
const redact = (text) =>
  String(text)
    .replace(/PASSWORD\s+'[^']*'/gi, "PASSWORD '***'")
    .replace(/(postgres(?:ql)?:\/\/[^:\s]+:)[^@\s]+@/gi, '$1***@');

function docker(args, opts = {}) {
  const r = spawnSync('docker', args, { encoding: 'utf8', ...opts });
  return { code: r.status ?? 1, out: r.stdout ?? '', err: r.stderr ?? '' };
}

// --------------------------------------------------------------------------------------------------------------------
// 1) Đọc .env.local hiện có → lấy lại giá trị cũ của khối leads (nếu có)
// --------------------------------------------------------------------------------------------------------------------
const existingText = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
const current = {};
for (const line of existingText.split('\n')) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m) current[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
}
const pwFromUrl = (url, user) => {
  const m = url ? new RegExp(`^postgres://${user}:([^@]+)@`).exec(url) : null;
  return m ? m[1] : null;
};
const hex = (bytes) => randomBytes(bytes).toString('hex');
const pw = {
  bb_owner: pwFromUrl(current.DATABASE_URL_OWNER, 'bb_owner') ?? hex(24),
  bb_app: pwFromUrl(current.DATABASE_URL, 'bb_app') ?? hex(24),
  bb_ops: pwFromUrl(current.DATABASE_URL_OPS, 'bb_ops') ?? hex(24),
};
const ipHashSecret = current.LEAD_IP_HASH_SECRET && current.LEAD_IP_HASH_SECRET.length >= 64 ? current.LEAD_IP_HASH_SECRET : hex(32);

// --------------------------------------------------------------------------------------------------------------------
// 2) Container
// --------------------------------------------------------------------------------------------------------------------
if (docker(['image', 'inspect', IMAGE]).code !== 0) die(`chưa có image ${IMAGE} (docker pull ${IMAGE})`);

const inspect = docker(['inspect', '-f', '{{.State.Status}}', CONTAINER]);
if (inspect.code !== 0) {
  const busy = execFileSync('ss', ['-ltnH'], { encoding: 'utf8' })
    .split('\n')
    .some((l) => new RegExp(`[:.]${PORT}\\s`).test(l + ' '));
  if (busy) die(`cổng ${PORT} đang bận — đặt LEADS_DB_PORT=<cổng trống> rồi chạy lại`);
  say(`tạo container ${CONTAINER} (127.0.0.1:${PORT} → 5432, volume ${VOLUME})`);
  const run = docker(
    [
      'run', '-d',
      '--name', CONTAINER,
      '--restart', 'unless-stopped',
      '--memory', '256m',
      '--log-opt', 'max-size=10m', '--log-opt', 'max-file=3',
      '-p', `127.0.0.1:${PORT}:5432`,
      '-v', `${VOLUME}:/var/lib/postgresql/data`,
      // Giá trị lấy từ môi trường của tiến trình này (không nằm trên dòng lệnh). Chỉ dùng lúc khởi tạo volume, sau đó bị xóa.
      '-e', 'POSTGRES_PASSWORD',
      '--health-cmd', 'pg_isready -U postgres -h 127.0.0.1 -q',
      '--health-interval', '30s', '--health-timeout', '5s', '--health-retries', '5', '--health-start-period', '20s',
      IMAGE,
      '-c', 'shared_buffers=32MB',
      '-c', 'max_connections=30',
      '-c', 'work_mem=2MB',
      '-c', 'maintenance_work_mem=16MB',
      '-c', 'effective_cache_size=96MB',
      '-c', 'wal_buffers=1MB',
      '-c', 'max_wal_size=256MB',
      '-c', 'autovacuum_max_workers=2',
      // Không ghi DETAIL ("Failing row contains ...") và câu lệnh lỗi vào log server: tránh lộ dữ liệu cá nhân/mật khẩu
      '-c', 'log_error_verbosity=terse',
      '-c', 'log_min_error_statement=panic',
      '-c', 'timezone=UTC',
    ],
    { env: { ...process.env, POSTGRES_PASSWORD: hex(24) } },
  );
  if (run.code !== 0) die(redact(run.err || run.out));
} else if (inspect.out.trim() !== 'running') {
  say(`container ${CONTAINER} đang ${inspect.out.trim()} → docker start`);
  const st = docker(['start', CONTAINER]);
  if (st.code !== 0) die(redact(st.err));
} else {
  say(`container ${CONTAINER} đang chạy`);
}

// Chờ Postgres nhận kết nối (lần đầu initdb mất vài giây)
let ready = false;
for (let i = 0; i < 60; i += 1) {
  if (docker(['exec', CONTAINER, 'pg_isready', '-U', 'postgres', '-q']).code === 0) {
    // initdb chạy postgres tạm rồi khởi động lại: thử một truy vấn thật cho chắc
    if (docker(['exec', CONTAINER, 'psql', '-U', 'postgres', '-tAc', 'select 1']).out.trim() === '1') {
      ready = true;
      break;
    }
  }
  spawnSync('sleep', ['1']);
}
if (!ready) die('Postgres không lên sau 60 giây — xem `docker logs bluebolt-web-db`');

// --------------------------------------------------------------------------------------------------------------------
// 3) Role, database, quyền mức database/schema (quyền mức bảng: trong migration)
// --------------------------------------------------------------------------------------------------------------------
const sqlRoles = `
\\set ON_ERROR_STOP on
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bb_owner') THEN CREATE ROLE bb_owner LOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bb_app')   THEN CREATE ROLE bb_app LOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bb_ops')   THEN CREATE ROLE bb_ops LOGIN; END IF;
END $$;
ALTER ROLE bb_owner WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${pw.bb_owner}';
ALTER ROLE bb_app   WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 20 PASSWORD '${pw.bb_app}';
ALTER ROLE bb_ops   WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 5 PASSWORD '${pw.bb_ops}';
ALTER ROLE postgres WITH PASSWORD NULL;
SELECT 'CREATE DATABASE ${DB_MAIN} OWNER bb_owner' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_MAIN}')\\gexec
SELECT 'CREATE DATABASE ${DB_TEST} OWNER bb_owner' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_TEST}')\\gexec
${[DB_MAIN, DB_TEST]
  .map(
    (db) => `
REVOKE ALL ON DATABASE ${db} FROM PUBLIC;
GRANT CONNECT ON DATABASE ${db} TO bb_app, bb_ops;
\\connect ${db}
ALTER SCHEMA public OWNER TO bb_owner;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO bb_app, bb_ops;
\\connect postgres
`,
  )
  .join('')}
`;
const psql = spawnSync('docker', ['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-q', '-X'], {
  input: sqlRoles,
  encoding: 'utf8',
});
if (psql.status !== 0) die(`psql: ${redact(psql.stderr || psql.stdout)}`);
say(`role bb_owner/bb_app/bb_ops + database ${DB_MAIN}, ${DB_TEST}: OK`);

// --------------------------------------------------------------------------------------------------------------------
// 4) Khối biến môi trường trong .env.local
// --------------------------------------------------------------------------------------------------------------------
const url = (user, db) => `postgres://${user}:${pw[user]}@127.0.0.1:${PORT}/${db}`;
const keep = (key, fallback) => (current[key] !== undefined ? current[key] : fallback);
const block = [
  BLOCK_START + ' (CHỈ máy bbsw: dev 3091 + bản xem trước 9515). KHÔNG commit, KHÔNG chép ra ngoài.',
  '# Form + API. Production tắt form khi câu đồng ý chưa có approvedBy (AC-C10); bản xem trước (DRAFT_PREVIEW=1) vẫn chạy.',
  `LEADS_FORM_ENABLED=${keep('LEADS_FORM_ENABLED', 'true')}`,
  `DATABASE_URL=${url('bb_app', DB_MAIN)}`,
  `DATABASE_URL_OWNER=${url('bb_owner', DB_MAIN)}`,
  `DATABASE_URL_OPS=${url('bb_ops', DB_MAIN)}`,
  `DATABASE_URL_TEST=${url('bb_app', DB_TEST)}`,
  `DATABASE_URL_TEST_OWNER=${url('bb_owner', DB_TEST)}`,
  `DATABASE_URL_TEST_OPS=${url('bb_ops', DB_TEST)}`,
  `LEAD_IP_HASH_SECRET=${ipHashSecret}`,
  '# App chỉ bind localhost; proxy 9515 (deploy/preview/proxy.mjs) nối IP trình duyệt vào CUỐI X-Forwarded-For → xff-last',
  `LEAD_CLIENT_IP_SOURCE=${keep('LEAD_CLIENT_IP_SOURCE', 'xff-last')}`,
  `LEAD_ALLOWED_ORIGINS=${keep('LEAD_ALLOWED_ORIGINS', 'http://127.0.0.1:3091,http://localhost:3091,http://<IP Tailscale của máy chủ>:9515,http://<IP LAN của máy chủ>:9515')}`,
  '# Nới cho anh Duy thử nhiều lần trên bản xem trước. Production: bỏ trống → 5 lần/600 giây (contract, D-14)',
  `LEAD_RATE_LIMIT_MAX=${keep('LEAD_RATE_LIMIT_MAX', '20')}`,
  `LEAD_RATE_LIMIT_WINDOW_SEC=${keep('LEAD_RATE_LIMIT_WINDOW_SEC', '600')}`,
  '# Khóa TEST chính thức của Cloudflare (luôn qua). siteverify trả hostname "example.com" → app bỏ kiểm hostname/action khi dùng khóa test',
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY=${keep('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '1x00000000000000000000AA')}`,
  `TURNSTILE_SECRET_KEY=${keep('TURNSTILE_SECRET_KEY', '1x0000000000000000000000000000000AA')}`,
  `TURNSTILE_ALLOWED_HOSTNAMES=${keep('TURNSTILE_ALLOWED_HOSTNAMES', 'localhost,127.0.0.1,<IP Tailscale của máy chủ>,<IP LAN của máy chủ>')}`,
  '# Không có SMTP: email thông báo ghi thành tệp .eml (chỉ dev/bản xem trước). Địa chỉ thật: chờ anh Duy (D-02)',
  `LEAD_MAIL_TRANSPORT=${keep('LEAD_MAIL_TRANSPORT', 'file')}`,
  `LEAD_MAIL_DIR=${keep('LEAD_MAIL_DIR', '.cache/lead-mail')}`,
  `LEAD_NOTIFY_EMAIL_B2B=${keep('LEAD_NOTIFY_EMAIL_B2B', 'chua-co-dia-chi@invalid')}`,
  `LEAD_NOTIFY_EMAIL_TECHNICIAN=${keep('LEAD_NOTIFY_EMAIL_TECHNICIAN', 'chua-co-dia-chi@invalid')}`,
  `SMTP_FROM="${keep('SMTP_FROM', 'Bluebolt Website (ban xem truoc) <leads@lapdattoanquoc.invalid>')}"`,
  '# Trống = script dọn theo thời hạn lưu tắt (chờ pháp chế, PC-03)',
  `LEAD_RETENTION_DAYS=${keep('LEAD_RETENTION_DAYS', '')}`,
  BLOCK_END,
].join('\n');

let next;
const startIdx = existingText.indexOf(BLOCK_START);
const endIdx = existingText.indexOf(BLOCK_END);
if (startIdx !== -1 && endIdx > startIdx) {
  next = existingText.slice(0, startIdx) + block + existingText.slice(endIdx + BLOCK_END.length);
} else {
  next = (existingText && !existingText.endsWith('\n') ? existingText + '\n' : existingText) + block + '\n';
}
writeFileSync(ENV_FILE, next, { mode: 0o600 });
chmodSync(ENV_FILE, 0o600);
say(`đã ghi khối leads vào .env.local (quyền 600). Mật khẩu không in ra.`);

const ignored = spawnSync('git', ['check-ignore', '-q', '.env.local'], { cwd: ROOT });
if (ignored.status !== 0) die('.env.local KHÔNG được gitignore — dừng lại, kiểm .gitignore');
say(`xong. Tiếp theo: node scripts/db-migrate.mjs up && node scripts/db-migrate.mjs up --test`);
