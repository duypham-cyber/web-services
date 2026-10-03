/**
 * Handler POST /api/v1/leads — thứ tự xử lý (bảng 3.1), envelope lỗi, idempotency, honeypot. DB là bản giả TRONG BỘ NHỚ
 * (chỉ ở unit test này); test tích hợp với Postgres thật ở tests/leads/ (npm run test:leads).
 */
import { describe, expect, it, vi } from 'vitest';
import type { Db } from '../../lib/leads/db';
import { createLeadDeps, handleLeadPost, type LeadHandlerDeps } from '../../lib/leads/handler';
import { createLeadLogger } from '../../lib/leads/logger';
import { createRateLimiter } from '../../lib/leads/rate-limit';
import type { TurnstileOutcome } from '../../lib/leads/turnstile';
import { SENTINEL, b2bBody, baseEnv, leadRequest, techBody, uuid } from '../leads/fixtures';

type Row = { id: string; type: string; created_at: Date; idempotency_key: string | null };

/** Db giả: đủ cho INSERT/SELECT của handler; tùy chọn ném lỗi unique ở lần INSERT đầu. */
function fakeDb(options: { existing?: Row[]; conflictOnInsert?: Row } = {}) {
  const rows: Row[] = [...(options.existing ?? [])];
  const calls: string[] = [];
  let conflictPending = Boolean(options.conflictOnInsert);
  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    calls.push(sql.trim().split(/\s+/).slice(0, 2).join(' '));
    if (/^SELECT id, type, created_at FROM leads WHERE idempotency_key/.test(sql.trim())) {
      return { rows: rows.filter((r) => r.idempotency_key === params[0]), rowCount: 0 };
    }
    if (/^INSERT INTO leads/.test(sql.trim())) {
      if (conflictPending && options.conflictOnInsert) {
        conflictPending = false;
        rows.push(options.conflictOnInsert);
        throw Object.assign(new Error('duplicate key'), { code: '23505', constraint: 'uq_leads_idempotency_key' });
      }
      const row = { id: uuid(), type: String(params[0]), created_at: new Date(), idempotency_key: (params[11] as string) ?? null };
      rows.push(row);
      return { rows: [row], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  });
  const db = { query, connect: async () => ({ query, release: () => {} }) } as unknown as Db;
  return { db, rows, calls };
}

function deps(options: {
  env?: Record<string, string | undefined>;
  db?: Db;
  turnstile?: TurnstileOutcome;
  lines?: string[];
} = {}): LeadHandlerDeps & { turnstileSpy: ReturnType<typeof vi.fn>; scheduled: number } {
  const lines = options.lines ?? [];
  const d = createLeadDeps({
    env: baseEnv(options.env),
    schedule: () => {
      state.scheduled += 1;
    },
    logger: createLeadLogger((line) => lines.push(line)),
    rateLimiter: createRateLimiter(new Map()),
    transport: null,
  });
  const turnstileSpy = vi.fn(async () => options.turnstile ?? ({ result: 'passed' } as TurnstileOutcome));
  const state = {
    ...d,
    db: () => {
      if (!options.db) throw new Error('DB không được chạm ở ca này');
      return options.db;
    },
    turnstile: turnstileSpy,
    turnstileSpy,
    scheduled: 0,
  };
  return state;
}

async function json(res: Response) {
  return (await res.json()) as { success: boolean; data?: Record<string, string>; error?: Record<string, unknown> };
}

describe('envelope + thứ tự xử lý', () => {
  it('201: data {id, reference, type, receivedAt}, x-correlation-id; after() được hẹn; Turnstile kiểm đúng action', async () => {
    const { db, rows } = fakeDb();
    const d = deps({ db });
    const res = await handleLeadPost(leadRequest(b2bBody()), d);
    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.success).toBe(true);
    expect(body.data?.reference).toBe(body.data?.id?.slice(0, 8).toUpperCase());
    expect(body.data?.type).toBe('lead_b2b');
    expect(res.headers.get('x-correlation-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(rows).toHaveLength(1);
    expect(d.scheduled).toBe(1);
    expect(d.turnstileSpy).toHaveBeenCalledWith({ token: expect.any(String), expectedAction: 'lead_b2b' });
  });
  it('giữ x-correlation-id hợp lệ của client', async () => {
    const cid = uuid();
    const res = await handleLeadPost(leadRequest(b2bBody(), { headers: { 'x-correlation-id': cid } }), deps({ db: fakeDb().db }));
    expect(res.headers.get('x-correlation-id')).toBe(cid);
  });
  it('bước 0: công tắc tắt / thiếu cấu hình / production chưa duyệt câu đồng ý → 503 LEADS_DISABLED (AC-C10)', async () => {
    for (const env of [
      { LEADS_FORM_ENABLED: 'false' },
      { DATABASE_URL: undefined },
      { NODE_ENV: 'production' },
    ]) {
      const res = await handleLeadPost(leadRequest(b2bBody()), deps({ env }));
      const body = await json(res);
      expect(res.status, JSON.stringify(env)).toBe(503);
      expect(body.error).toMatchObject({ code: 'LEADS_DISABLED', details: [], correlationId: expect.any(String) });
    }
    // bản xem trước (production + DRAFT_PREVIEW=1) vẫn nhận với câu đồng ý nháp
    const preview = await handleLeadPost(leadRequest(b2bBody()), deps({ env: { NODE_ENV: 'production', DRAFT_PREVIEW: '1' }, db: fakeDb().db }));
    expect(preview.status).toBe(201);
  });
  it('bước 2: Origin lạ → 403; không có Origin → đi tiếp', async () => {
    const bad = await handleLeadPost(leadRequest(b2bBody(), { headers: { origin: 'https://evil.example' } }), deps());
    expect([bad.status, (await json(bad)).error?.code]).toEqual([403, 'FORBIDDEN_ORIGIN']);
    const none = await handleLeadPost(leadRequest(b2bBody(), { headers: { origin: undefined } }), deps({ db: fakeDb().db }));
    expect(none.status).toBe(201);
  });
  it('bước 3: text/plain → 400 INVALID_JSON; body > 16 KB → 413', async () => {
    const plain = await handleLeadPost(leadRequest(b2bBody(), { headers: { 'content-type': 'text/plain' } }), deps());
    expect([plain.status, (await json(plain)).error?.code]).toEqual([400, 'INVALID_JSON']);
    const big = await handleLeadPost(leadRequest(null, { raw: JSON.stringify({ ...b2bBody(), pad: 'x'.repeat(17 * 1024) }) }), deps());
    expect([big.status, (await json(big)).error?.code]).toEqual([413, 'PAYLOAD_TOO_LARGE']);
  });
  it('bước 4: lần 6 trong 10 phút → 429 + Retry-After; IP khác vẫn qua', async () => {
    const d = deps({ db: fakeDb().db });
    for (let i = 0; i < 5; i += 1) expect((await handleLeadPost(leadRequest(b2bBody()), d)).status).toBe(201);
    const sixth = await handleLeadPost(leadRequest(b2bBody()), d);
    expect([sixth.status, (await json(sixth)).error?.code]).toEqual([429, 'RATE_LIMITED']);
    expect(Number(sixth.headers.get('retry-after'))).toBeGreaterThan(0);
    expect((await handleLeadPost(leadRequest(b2bBody(), { ip: '198.51.100.200' }), d)).status).toBe(201);
  });
  it('bước 5: JSON hỏng / không phải object → 400 INVALID_JSON', async () => {
    for (const raw of ['{', '[]', '"x"', 'null']) {
      const res = await handleLeadPost(leadRequest(null, { raw }), deps());
      expect(res.status, raw).toBe(400);
    }
  });
  it('bước 6: honeypot → 201 giả, không chạm DB, không Turnstile, không thông báo (AC-C4)', async () => {
    const lines: string[] = [];
    for (const hp of ['x', 1, null]) {
      const d = deps({ lines });
      const res = await handleLeadPost(leadRequest(b2bBody({ hp })), d);
      const body = await json(res);
      expect(res.status).toBe(201);
      expect(body.data?.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(d.turnstileSpy).not.toHaveBeenCalled();
      expect(d.scheduled).toBe(0);
    }
    expect(lines.filter((l) => l.includes('"lead_honeypot"'))).toHaveLength(3);
    // hp chỉ có khoảng trắng = người thật để trống
    expect((await handleLeadPost(leadRequest(b2bBody({ hp: '   ' })), deps({ db: fakeDb().db }))).status).toBe(201);
  });
  it('bước 8 → 9 → 11: lỗi nhập liệu và consent KHÔNG đốt token Turnstile', async () => {
    const d1 = deps({ db: fakeDb().db });
    const bad = await handleLeadPost(leadRequest(b2bBody({ fields: { phone: 'abc' } })), d1);
    expect(bad.status).toBe(400);
    expect((await json(bad)).error).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [{ field: 'fields.phone', code: 'invalid_phone' }],
    });
    expect(d1.turnstileSpy).not.toHaveBeenCalled();

    const d2 = deps({ db: fakeDb().db });
    const consent = await handleLeadPost(leadRequest(b2bBody({ consent: { version: 'b2b-2026-10-v1', purposes: [] } })), d2);
    expect([consent.status, (await json(consent)).error?.code]).toEqual([422, 'CONSENT_REQUIRED']);
    const old = await handleLeadPost(leadRequest(b2bBody({ consent: { version: 'b2b-2025-01-v1', purposes: ['b2b_sales_contact'] } })), d2);
    expect([old.status, (await json(old)).error?.code]).toEqual([409, 'CONSENT_VERSION_OUTDATED']);
    expect(d2.turnstileSpy).not.toHaveBeenCalled();
  });
  it('bước 11: captcha failed → 403; unverified → vẫn 201 (D-09)', async () => {
    const failed = await handleLeadPost(leadRequest(techBody()), deps({ db: fakeDb().db, turnstile: { result: 'failed', reason: 'x' } }));
    expect([failed.status, (await json(failed)).error?.code]).toEqual([403, 'CAPTCHA_FAILED']);
    const lines: string[] = [];
    const unverified = await handleLeadPost(
      leadRequest(techBody()),
      deps({ db: fakeDb().db, lines, turnstile: { result: 'unverified', reason: 'timeout', misconfigured: false } }),
    );
    expect(unverified.status).toBe(201);
    expect(lines.some((l) => l.includes('"lead_captcha_unverified"'))).toBe(true);
  });
  it('DB lỗi → 500 INTERNAL_ERROR có correlationId, không stack trace', async () => {
    const db = { query: async () => Promise.reject(new Error('connect ECONNREFUSED')), connect: async () => Promise.reject(new Error('connect ECONNREFUSED')) } as unknown as Db;
    const res = await handleLeadPost(leadRequest(b2bBody()), deps({ db }));
    const text = await res.text();
    expect(res.status).toBe(500);
    expect(JSON.parse(text).error).toMatchObject({ code: 'INTERNAL_ERROR', correlationId: expect.any(String) });
    expect(text).not.toMatch(/ECONNREFUSED|at .*\.ts/);
  });
});

describe('Idempotency-Key (AC-C9, bước 7 + 12)', () => {
  it('khóa không phải UUID → 400 invalid_format, không chạm DB', async () => {
    const res = await handleLeadPost(leadRequest(b2bBody(), { headers: { 'idempotency-key': 'abc' } }), deps());
    expect((await json(res)).error).toMatchObject({ code: 'VALIDATION_ERROR', details: [{ field: 'headers.Idempotency-Key', code: 'invalid_format' }] });
  });
  it('khóa đã có → 201 replay cùng id, Idempotent-Replayed: true, không INSERT', async () => {
    const key = uuid();
    const existing = { id: uuid(), type: 'lead_b2b', created_at: new Date('2026-10-03T01:02:03Z'), idempotency_key: key };
    const f = fakeDb({ existing: [existing] });
    const d = deps({ db: f.db });
    const res = await handleLeadPost(leadRequest(b2bBody(), { headers: { 'idempotency-key': key.toUpperCase() } }), d);
    const body = await json(res);
    expect(res.status).toBe(201);
    expect(res.headers.get('idempotent-replayed')).toBe('true');
    expect(body.data).toMatchObject({ id: existing.id, receivedAt: '2026-10-03T01:02:03.000Z' });
    expect(f.calls.some((c) => c.startsWith('INSERT'))).toBe(false);
    expect(d.scheduled).toBe(0);
  });
  it('hai request cùng khóa chạy song song: unique index chặn dòng thứ hai → đọc lại, replay', async () => {
    const key = uuid();
    const winner = { id: uuid(), type: 'lead_b2b', created_at: new Date(), idempotency_key: key };
    const f = fakeDb({ conflictOnInsert: winner });
    const res = await handleLeadPost(leadRequest(b2bBody(), { headers: { 'idempotency-key': key } }), deps({ db: f.db }));
    expect(res.status).toBe(201);
    expect(res.headers.get('idempotent-replayed')).toBe('true');
    expect((await json(res)).data?.id).toBe(winner.id);
  });
});

describe('log không có dữ liệu cá nhân (AC-C8, mức unit)', () => {
  it('mọi đường đi đều không log giá trị đánh dấu hay IP', async () => {
    const lines: string[] = [];
    const db = fakeDb().db;
    await handleLeadPost(leadRequest(b2bBody()), deps({ db, lines }));
    await handleLeadPost(leadRequest(b2bBody({ fields: { phone: 'abc' } })), deps({ db, lines }));
    await handleLeadPost(leadRequest(b2bBody({ hp: SENTINEL.fullName })), deps({ db, lines }));
    await handleLeadPost(leadRequest(b2bBody({ status: SENTINEL.workEmail })), deps({ db, lines }));
    expect(lines.length).toBeGreaterThanOrEqual(4);
    const all = lines.join('\n');
    for (const needle of ['Sentinel', '0987654321', '987654321', 'sentinel@', 'SENTINEL-NOTE', SENTINEL.ip]) {
      expect(all, needle).not.toContain(needle);
    }
  });
});
