/**
 * Test tích hợp các script vận hành form lead với Postgres test THẬT: retry (mục 3.5), DSR find/export/erase và dọn theo
 * thời hạn lưu (mục 6.4). Chạy script bằng `node` như quản trị kỹ thuật chạy thật.
 */
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getPool } from '../../lib/leads/db';
import { createLeadDeps, handleLeadPost } from '../../lib/leads/handler';
import { createLeadLogger } from '../../lib/leads/logger';
import { createRateLimiter } from '../../lib/leads/rate-limit';
import { SENTINEL, SENTINEL_NEEDLES, b2bBody, baseEnv, leadRequest, techBody } from './fixtures';
import { DB, HAS_DB, closeOwner, countRows, owner, startSiteverify, startSmtp, truncate } from './helpers';

const run = promisify(execFile);
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
let tmp = '';
let opsLog = '';
let smtp: Awaited<ReturnType<typeof startSmtp>>;
let siteverify: Awaited<ReturnType<typeof startSiteverify>>;
const outputs: string[] = [];

async function script(file: string, args: string[], env: Record<string, string> = {}) {
  try {
    const r = await run(process.execPath, [join('scripts', file), ...args], {
      cwd: ROOT,
      env: { ...process.env, LEAD_OPS_LOG: opsLog, ...env },
      timeout: 30_000,
    });
    outputs.push(r.stdout, r.stderr);
    return { code: 0, stdout: r.stdout, stderr: r.stderr };
  } catch (err) {
    const e = err as { code?: number; stdout?: string; stderr?: string };
    outputs.push(e.stdout ?? '', e.stderr ?? '');
    return { code: e.code ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

async function createLead(body: Record<string, unknown>): Promise<string> {
  const deps = createLeadDeps({
    env: baseEnv({ DATABASE_URL: DB.app, TURNSTILE_SECRET_KEY: 'secret-that-looks-real' }),
    schedule: () => {}, // không gửi lần đầu: để script retry xử lý
    logger: createLeadLogger(() => {}),
    rateLimiter: createRateLimiter(new Map()),
    turnstileUrl: siteverify.url,
  });
  const res = await handleLeadPost(leadRequest({ ...body, turnstileToken: `ok:${String(body.type)}` }), deps);
  expect(res.status).toBe(201);
  return ((await res.json()) as { data: { id: string } }).data.id;
}

describe.skipIf(!HAS_DB)('script vận hành form lead — Postgres thật', () => {
  beforeAll(async () => {
    tmp = mkdtempSync(join(tmpdir(), 'bb-leads-'));
    opsLog = join(tmp, 'leads-ops.log');
    smtp = await startSmtp();
    siteverify = await startSiteverify();
  });
  afterAll(async () => {
    await truncate();
    await smtp?.close();
    await siteverify?.close();
    await getPool(DB.app).end();
    await closeOwner();
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  });
  beforeEach(async () => {
    await truncate();
    smtp.messages.length = 0;
  });

  it('leads-notify-retry.mjs: gửi dòng tới hạn qua SMTP, log JSON không PII', async () => {
    const a = await createLead(b2bBody());
    const b = await createLead(techBody());
    const r = await script('leads-notify-retry.mjs', [], {
      DATABASE_URL: DB.app,
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(smtp.port),
      LEAD_NOTIFY_EMAIL_B2B: 'kinh-doanh@congty-nhan.test',
      LEAD_NOTIFY_EMAIL_TECHNICIAN: 'tuyen-tho@congty-nhan.test',
    });
    expect(r.code).toBe(0);
    const run = r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((o) => o.event === 'lead_notify_run');
    expect(run).toMatchObject({ claimed: 2, sent: 2, failed: 0, dead: 0, reason: 'smtp' });
    expect(smtp.messages).toHaveLength(2);
    const { rows } = await owner().query(`SELECT lead_id, status FROM lead_notifications ORDER BY target`);
    expect(rows.map((x) => [x.lead_id, x.status])).toEqual([
      [a, 'sent'],
      [b, 'sent'],
    ]);
  });

  it('DSR: find (SĐT/email/mã) → export (tệp 600) → erase; ops log không PII', async () => {
    const id = await createLead(b2bBody());
    await createLead(techBody({ fields: { phone: '0912 345 678' } }));

    const byPhone = await script('leads-dsr.mjs', ['find', '--phone', '0987 654 321', '--test']);
    expect(byPhone.code).toBe(0);
    expect(byPhone.stdout).toContain(id);
    expect(byPhone.stdout).toContain('1 lead');
    expect((await script('leads-dsr.mjs', ['find', '--email', 'SENTINEL@congty-thu.vn', '--test'])).stdout).toContain(id);
    expect((await script('leads-dsr.mjs', ['find', '--reference', id.slice(0, 8).toUpperCase(), '--test'])).stdout).toContain(id);

    const out = join(tmp, 'export.json');
    const exp = await script('leads-dsr.mjs', ['export', '--id', id, '--out', out, '--test']);
    expect(exp.code).toBe(0);
    expect(exp.stdout).not.toContain(SENTINEL.fullName);
    expect(statSync(out).mode & 0o777).toBe(0o600);
    const doc = JSON.parse(readFileSync(out, 'utf8'));
    expect(doc.lead).toMatchObject({ id, payload: { phone: SENTINEL.phoneE164, fullName: SENTINEL.fullName } });
    expect(doc.notifications).toHaveLength(1);

    expect((await script('leads-dsr.mjs', ['erase', '--id', id, '--test'])).code).toBe(1); // thiếu --yes
    const erase = await script('leads-dsr.mjs', ['erase', '--id', id, '--yes', '--test']);
    expect(erase.code).toBe(0);
    const { rows } = await owner().query('SELECT (SELECT count(*)::int FROM leads WHERE id = $1) AS l, (SELECT count(*)::int FROM lead_notifications WHERE lead_id = $1) AS n', [id]);
    expect(rows[0]).toEqual({ l: 0, n: 0 });
    expect((await countRows()).leads).toBe(1);

    const log = readFileSync(opsLog, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(log.map((l) => [l.script, l.command])).toEqual([
      ['leads-dsr', 'find'],
      ['leads-dsr', 'find'],
      ['leads-dsr', 'find'],
      ['leads-dsr', 'export'],
      ['leads-dsr', 'erase'],
    ]);
    expect(log.every((l) => l.user && l.time)).toBe(true);
    const raw = readFileSync(opsLog, 'utf8');
    for (const needle of SENTINEL_NEEDLES) expect(raw, needle).not.toContain(needle);
    expect(raw).not.toContain('sentinel@');
  });

  it('leads-cleanup.mjs: tắt khi LEAD_RETENTION_DAYS trống; xóa lead quá hạn khi có số', async () => {
    const old = await createLead(b2bBody());
    const fresh = await createLead(techBody());
    await owner().query(`UPDATE leads SET created_at = NOW() - interval '40 days' WHERE id = $1`, [old]);

    const off = await script('leads-cleanup.mjs', ['--test'], { LEAD_RETENTION_DAYS: '' });
    expect(off.code).toBe(0);
    expect(off.stdout).toMatch(/tắt/);
    expect((await countRows()).leads).toBe(2);

    const dry = await script('leads-cleanup.mjs', ['--test', '--dry-run'], { LEAD_RETENTION_DAYS: '30' });
    expect(dry.stdout).toContain('1 lead');
    expect((await countRows()).leads).toBe(2);

    const del = await script('leads-cleanup.mjs', ['--test'], { LEAD_RETENTION_DAYS: '30' });
    expect(del.code).toBe(0);
    const { rows } = await owner().query('SELECT id FROM leads');
    expect(rows.map((r) => r.id)).toEqual([fresh]);
  });

  it('AC-C8: đầu ra của mọi script không chứa giá trị đánh dấu', () => {
    const all = outputs.join('\n');
    expect(all.length).toBeGreaterThan(0);
    for (const needle of SENTINEL_NEEDLES) expect(all, needle).not.toContain(needle);
    expect(all).not.toContain('kinh-doanh@congty-nhan.test');
  });
});
