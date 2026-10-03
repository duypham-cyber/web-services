/**
 * Test tích hợp POST /api/v1/leads với Postgres THẬT (bluebolt_web_test), gọi thẳng handler bằng Request.
 * Phủ AC-C1, C3–C11 (C2, C12 là FE — bước 2), AC-B1…B10, AC-T2…T6, outbox (mục 3.5), quyền DB (mục 2), AC-C8.
 * Contract: contracts/lead-b2b.md + contracts/lead-technician.md (APPROVED 03/10/2026, D-26).
 */
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getPool } from '../../lib/leads/db';
import { createLeadDeps, handleLeadPost } from '../../lib/leads/handler';
import { createLeadLogger } from '../../lib/leads/logger';
import { createMailTransport } from '../../lib/leads/notify/transport';
import { checkBacklog, recipientsFromEnv, runRetryPass, type OutboxContext } from '../../lib/leads/outbox';
import { createRateLimiter } from '../../lib/leads/rate-limit';
import { PROVINCE_CODES } from '../../lib/leads/rules';
import { SENTINEL, SENTINEL_NEEDLES, b2bBody, baseEnv, leadRequest, techBody, uuid } from './fixtures';
import { DB, HAS_DB, closeOwner, closedPort, countRows, headerOf, mailText, owner, startSiteverify, startSmtp, truncate } from './helpers';

const logLines: string[] = [];
const logger = createLeadLogger((line) => logLines.push(line));

type Siteverify = Awaited<ReturnType<typeof startSiteverify>>;
type Smtp = Awaited<ReturnType<typeof startSmtp>>;
let siteverify: Siteverify;
let smtp: Smtp;

/** Env của handler: DB test (role bb_app), siteverify giả, SMTP giả (mặc định đang chạy). */
function env(overrides: Record<string, string | undefined> = {}) {
  return baseEnv({
    DATABASE_URL: DB.app,
    TURNSTILE_SECRET_KEY: 'secret-that-looks-real',
    TURNSTILE_TIMEOUT_MS: '300',
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(smtp.port),
    ...overrides,
  });
}

type Run = { res: Response; body: { success: boolean; data?: Record<string, string>; error?: Record<string, unknown> }; ms: number };

/** Gọi handler; `deliver` = chờ lần gửi đầu (after()) chạy xong như trên server thật. */
async function post(
  body: unknown,
  options: { env?: Record<string, string | undefined>; headers?: Record<string, string | undefined>; ip?: string; raw?: string; deliver?: boolean; limiter?: ReturnType<typeof createRateLimiter> } = {},
): Promise<Run> {
  const tasks: Promise<unknown>[] = [];
  const deps = createLeadDeps({
    env: env(options.env),
    schedule: (task) => {
      if (options.deliver !== false) tasks.push(task());
    },
    logger,
    rateLimiter: options.limiter ?? createRateLimiter(new Map()),
    turnstileUrl: siteverify.url,
  });
  const t0 = performance.now();
  const res = await handleLeadPost(leadRequest(body, { headers: options.headers, ip: options.ip, raw: options.raw }), deps);
  const ms = performance.now() - t0;
  await Promise.all(tasks);
  const text = await res.text();
  return { res, body: JSON.parse(text), ms };
}

const withToken = <T extends Record<string, unknown>>(b: T, action = String(b.type)) => ({ ...b, turnstileToken: `ok:${action}` });

async function leadRow(id: string) {
  const { rows } = await owner().query('SELECT *, row_to_json(leads)::text AS json FROM leads WHERE id = $1', [id]);
  return rows[0] as Record<string, unknown> & { json: string; payload: Record<string, unknown>; meta: Record<string, unknown> };
}
async function notificationsOf(id: string) {
  const { rows } = await owner().query(
    'SELECT channel, target, status, attempts, last_error_code, next_attempt_at, sent_at FROM lead_notifications WHERE lead_id = $1 ORDER BY target',
    [id],
  );
  return rows as { channel: string; target: string; status: string; attempts: number; last_error_code: string | null; next_attempt_at: Date }[];
}

function outboxCtx(port: number, pool: pg.Pool | ReturnType<typeof getPool> = getPool(DB.app)): OutboxContext {
  const e = env({ SMTP_PORT: String(port) });
  return { db: pool, transport: createMailTransport(e), recipients: recipientsFromEnv(e), from: 'Bluebolt <no-reply@lapdattoanquoc.test>', logger };
}

describe.skipIf(!HAS_DB)('POST /api/v1/leads — Postgres thật', () => {
  beforeAll(async () => {
    siteverify = await startSiteverify();
    smtp = await startSmtp();
  });
  afterAll(async () => {
    await truncate();
    await siteverify?.close();
    await smtp?.close();
    await getPool(DB.app).end();
    await closeOwner();
  });
  beforeEach(async () => {
    await truncate();
    smtp.messages.length = 0;
  });

  describe('happy path', () => {
    it('AC-C1 + AC-B1: 201, đúng 1 dòng leads đã chuẩn hóa, outbox b2b_sales đã gửi, không IP thô ở mọi cột', async () => {
      const { res, body } = await post(withToken(b2bBody({ fields: { phone: '0987.654.321', provinces: ['79', '01', '79'] } })));
      expect(res.status).toBe(201);
      expect(body.data?.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(body.data?.reference).toMatch(/^[0-9A-F]{8}$/);
      expect(body.data?.reference).toBe(body.data?.id?.slice(0, 8).toUpperCase());
      expect(await countRows()).toEqual({ leads: 1, notifications: 1 });

      const row = await leadRow(String(body.data?.id));
      expect(row).toMatchObject({
        type: 'lead_b2b',
        status: 'new',
        payload_version: 1,
        consent_version: 'b2b-2026-10-v1',
        consent_purposes: ['b2b_sales_contact'],
        locale: 'vi',
        page_path: '/lien-he',
        film_tier: 'T-FULL',
        utm: { source: 'zalo', campaign: 'thu-nghiem' },
        meta: { captcha: 'passed', emailFreeDomain: false, sanitized: [] },
        correlation_id: res.headers.get('x-correlation-id'),
      });
      expect(row.payload).toEqual({
        intent: 'quote',
        fullName: SENTINEL.fullName,
        company: SENTINEL.company,
        jobTitle: SENTINEL.jobTitle,
        phone: SENTINEL.phoneE164,
        workEmail: SENTINEL.workEmail,
        customerType: 'brand',
        monthlyVolume: '500_1999',
        provinces: ['01', '79'],
        note: SENTINEL.note,
      });
      expect(row.consent_at).toBeInstanceOf(Date);
      expect(String(row.ip_hash)).toMatch(/^[0-9a-f]{64}$/);
      expect(row.json).not.toContain(SENTINEL.ip);
      expect(row.json).not.toContain('198.51.100.9');

      const [n] = await notificationsOf(String(body.data?.id));
      expect(n).toMatchObject({ channel: 'email', target: 'b2b_sales', status: 'sent', attempts: 1, last_error_code: null });
      expect(smtp.messages).toHaveLength(1);
      const mail = smtp.messages[0]?.data ?? '';
      expect(smtp.messages[0]?.to.join()).toContain('kinh-doanh@congty-nhan.test');
      const subject = headerOf(mail, 'Subject');
      expect(subject).toBe(`[Lead B2B][Báo giá] ${body.data?.reference} · Hãng · 500–1.999 đơn/tháng · 2 tỉnh`);
      for (const needle of SENTINEL_NEEDLES) expect(subject).not.toContain(needle);
      expect(headerOf(mail, 'Reply-To')).toBe(SENTINEL.workEmail);
      // ghi chú có HTML: phần HTML escape, không bao giờ là thẻ thật
      expect(mailText(mail, 'html')).toContain('SENTINEL-NOTE &lt;img src=x onerror=alert(1)&gt;');
      expect(mailText(mail, 'html')).not.toContain('<img src=x');
    });

    it('AC-B2, AC-B3: intent demo / integration lưu đúng', async () => {
      for (const intent of ['demo', 'integration']) {
        const { res, body } = await post(withToken(b2bBody({ fields: { intent } })));
        expect(res.status).toBe(201);
        expect((await leadRow(String(body.data?.id))).payload.intent).toBe(intent);
      }
    });

    it('AC-B5: ba cách viết SĐT → cùng +84902808049; email hiện 0902 808 049', async () => {
      for (const phone of ['0902 808 049', '0902.808.049', '+84 902 808 049']) {
        const { body } = await post(withToken(b2bBody({ fields: { phone } })));
        expect((await leadRow(String(body.data?.id))).payload.phone).toBe('+84902808049');
      }
      expect(smtp.messages).toHaveLength(3);
      expect(smtp.messages.every((m) => mailText(m.data).includes('Số di động: 0902 808 049'))).toBe(true);
    });

    it('AC-B8: gmail → nhận, meta.emailFreeDomain=true, email gắn nhãn "Email cá nhân"', async () => {
      const { res, body } = await post(withToken(b2bBody({ fields: { workEmail: 'Ai.Do@Gmail.com' } })));
      expect(res.status).toBe(201);
      const row = await leadRow(String(body.data?.id));
      expect(row.payload.workEmail).toBe('ai.do@gmail.com');
      expect(row.meta.emailFreeDomain).toBe(true);
      expect(mailText(smtp.messages[0]?.data ?? '')).toContain('Email cá nhân');
    });

    it('AC-B9: "Toàn quốc" → 34 mã; thông báo ghi "Toàn quốc (34/34)"', async () => {
      const { body } = await post(withToken(b2bBody({ fields: { provinces: [...PROVINCE_CODES] } })));
      expect((await leadRow(String(body.data?.id))).payload.provinces).toHaveLength(34);
      expect(headerOf(smtp.messages[0]?.data ?? '', 'Subject')).toContain('Toàn quốc (34/34)');
    });

    it('AC-B10: bỏ trống chức danh và ghi chú → null', async () => {
      const { body } = await post(withToken(b2bBody({ fields: { jobTitle: '', note: '   ' } })));
      const row = await leadRow(String(body.data?.id));
      expect([row.payload.jobTitle, row.payload.note]).toEqual([null, null]);
    });

    it('AC-C11: locale en → DB locale=en, cùng mã enum/tỉnh', async () => {
      const { body } = await post(withToken(b2bBody({ locale: 'en', pagePath: '/en/contact' })));
      const row = await leadRow(String(body.data?.id));
      expect([row.locale, row.page_path, row.payload.customerType]).toEqual(['en', '/en/contact', 'brand']);
    });

    it('AC-T2/T5: lead thợ → payload đúng 4 khóa, chỉ một dòng technician_hr, không có Reply-To', async () => {
      const { res, body } = await post(withToken(techBody({ fields: { primarySkill: 'other' } })));
      expect(res.status).toBe(201);
      const row = await leadRow(String(body.data?.id));
      expect(row.payload).toEqual({ fullName: SENTINEL.fullName, phone: SENTINEL.phoneE164, province: '79', primarySkill: 'other' });
      expect(row.meta).toEqual({ captcha: 'passed', sanitized: [] });
      expect((await notificationsOf(String(body.data?.id))).map((n) => n.target)).toEqual(['technician_hr']);
      expect(smtp.messages[0]?.to.join()).toContain('tuyen-tho@congty-nhan.test');
      expect(smtp.messages[0]?.to.join()).not.toContain('kinh-doanh@');
      expect(headerOf(smtp.messages[0]?.data ?? '', 'Reply-To')).toBe('');
      expect(headerOf(smtp.messages[0]?.data ?? '', 'Subject')).toBe(`[Đối tác thợ] ${body.data?.reference} · Khác · TP. Hồ Chí Minh`);
    });

    it('form thợ: chỉ đồng ý bắt buộc → 201; email hiện "Không đồng ý nhận tin việc mới"', async () => {
      await post(withToken(techBody()));
      const text = mailText(smtp.messages[0]?.data ?? '');
      expect(text).toContain('Không đồng ý nhận tin việc mới');
      expect(text).toContain('https://zalo.me/0987654321');
      expect(text).toContain('Số di động (Zalo): 0987 654 321');
    });

    it('Rule 5: siêu dữ liệu sai được sửa, vẫn 201, meta.sanitized liệt kê đủ', async () => {
      const { res, body } = await post(
        withToken(b2bBody({ utm: { source: 's'.repeat(500), foo: 'x' }, pagePath: 'https://evil.example', filmTier: 'X', locale: 'fr' })),
      );
      expect(res.status).toBe(201);
      const row = await leadRow(String(body.data?.id));
      expect([row.page_path, row.film_tier, row.locale]).toEqual(['/', null, 'vi']);
      expect((row.utm as Record<string, string>).source).toHaveLength(100);
      expect(row.meta.sanitized).toEqual(expect.arrayContaining(['utm.unknown_keys', 'utm.source', 'pagePath', 'filmTier', 'locale']));
    });
  });

  describe('validation (không ghi DB)', () => {
    it('AC-B4/AC-T3: SĐT abc → 400 details[0] = {fields.phone, invalid_phone}', async () => {
      for (const b of [b2bBody({ fields: { phone: 'abc' } }), techBody({ fields: { phone: 'abc' } })]) {
        const { res, body } = await post(withToken(b));
        expect(res.status).toBe(400);
        expect(body.error).toMatchObject({ code: 'VALIDATION_ERROR', details: [{ field: 'fields.phone', code: 'invalid_phone' }] });
      }
      expect(await countRows()).toEqual({ leads: 0, notifications: 0 });
    });
    it('AC-B6, AC-B7: số bàn / +1 / 11 số / email sai → 400', async () => {
      for (const fields of [{ phone: '028 3823 4567' }, { phone: '+1 415 555 0100' }, { phone: '09876543210' }, { workEmail: 'sai@' }]) {
        const { res, body } = await post(withToken(b2bBody({ fields })));
        expect(res.status, JSON.stringify(fields)).toBe(400);
        expect((body.error?.details as { code: string }[])[0]?.code).toMatch(/invalid_phone|invalid_email/);
      }
      expect((await countRows()).leads).toBe(0);
    });
    it('AC-T4, AC-T6: tỉnh thiếu/lạ/mảng; trường thứ 5 → 400', async () => {
      const missing = techBody();
      delete (missing.fields as Record<string, unknown>).province;
      const cases: [unknown, string, string][] = [
        [missing, 'fields.province', 'required'],
        [techBody({ fields: { province: '99' } }), 'fields.province', 'invalid_option'],
        [techBody({ fields: { province: ['79', '01'] } }), 'fields.province', 'invalid_format'],
        [techBody({ fields: { email: 'a@b.vn' } }), 'fields.email', 'unknown_field'],
        [techBody({ fields: { dateOfBirth: '1990-01-01' } }), 'fields.dateOfBirth', 'unknown_field'],
        [techBody({ fields: { address: 'x' } }), 'fields.address', 'unknown_field'],
        [techBody({ fields: { idNumber: '0790' } }), 'fields.idNumber', 'unknown_field'],
      ];
      for (const [b, field, code] of cases) {
        const { res, body } = await post(withToken(b as Record<string, unknown>));
        expect(res.status, field).toBe(400);
        expect(body.error?.details).toContainEqual(expect.objectContaining({ field, code }));
      }
      expect((await countRows()).leads).toBe(0);
    });
    it('mục 6.2: client gửi id/status/ipHash → 400 unknown_field', async () => {
      for (const extra of [{ id: uuid() }, { status: 'qualified' }, { ipHash: 'a'.repeat(64) }]) {
        const { res } = await post(withToken(b2bBody(extra)));
        expect(res.status).toBe(400);
      }
      expect((await countRows()).leads).toBe(0);
    });
    it('text/plain → 400 INVALID_JSON; 17 KB → 413', async () => {
      expect((await post(withToken(b2bBody()), { headers: { 'content-type': 'text/plain' } })).res.status).toBe(400);
      const big = await post(null, { raw: JSON.stringify({ ...withToken(b2bBody()), pad: 'x'.repeat(17 * 1024) }) });
      expect([big.res.status, big.body.error?.code]).toEqual([413, 'PAYLOAD_TOO_LARGE']);
    });
  });

  describe('consent', () => {
    it('AC-C3: thiếu mục đích bắt buộc → 422 CONSENT_REQUIRED, không ghi DB; mục đích lạ → 400 unknown_purpose', async () => {
      const r1 = await post(withToken(b2bBody({ consent: { version: 'b2b-2026-10-v1', purposes: ['b2b_marketing'] } })));
      expect([r1.res.status, r1.body.error?.code]).toEqual([422, 'CONSENT_REQUIRED']);
      const r2 = await post(withToken(b2bBody({ consent: { version: 'b2b-2026-10-v1', purposes: ['b2b_sales_contact', 'x_y'] } })));
      expect(r2.res.status).toBe(400);
      expect(r2.body.error?.details).toEqual([expect.objectContaining({ field: 'consent.purposes', code: 'unknown_purpose' })]);
      expect((await countRows()).leads).toBe(0);
    });
    it('version không còn hiệu lực → 409', async () => {
      const r = await post(withToken(b2bBody({ consent: { version: 'b2b-2025-01-v1', purposes: ['b2b_sales_contact'] } })));
      expect([r.res.status, r.body.error?.code]).toEqual([409, 'CONSENT_VERSION_OUTDATED']);
    });
    it('đồng ý cả mục tùy chọn → lưu đủ, theo thứ tự của version', async () => {
      const { body } = await post(withToken(b2bBody({ consent: { version: 'b2b-2026-10-v1', purposes: ['b2b_marketing', 'b2b_sales_contact'] } })));
      expect((await leadRow(String(body.data?.id))).consent_purposes).toEqual(['b2b_sales_contact', 'b2b_marketing']);
    });
    it('AC-C10: LEADS_FORM_ENABLED=false hoặc production chưa duyệt câu đồng ý → 503; bản xem trước → 201', async () => {
      for (const e of [{ LEADS_FORM_ENABLED: 'false' }, { NODE_ENV: 'production' }]) {
        const r = await post(withToken(b2bBody()), { env: e });
        expect([r.res.status, r.body.error?.code]).toEqual([503, 'LEADS_DISABLED']);
      }
      expect((await countRows()).leads).toBe(0);
      const preview = await post(withToken(b2bBody()), { env: { NODE_ENV: 'production', DRAFT_PREVIEW: '1' } });
      expect(preview.res.status).toBe(201);
    });
  });

  describe('chống spam', () => {
    it('AC-C4: honeypot → 201 giả; leads và SMTP không đổi; log lead_honeypot', async () => {
      const before = logLines.length;
      const { res, body } = await post(withToken(b2bBody({ hp: 'http://spam.example' })));
      expect(res.status).toBe(201);
      expect(body.data?.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(await countRows()).toEqual({ leads: 0, notifications: 0 });
      expect(smtp.messages).toHaveLength(0);
      expect(logLines.slice(before).some((l) => l.includes('"lead_honeypot"') && l.includes('correlationId'))).toBe(true);
    });
    it('AC-C5: lần 6 trong 10 phút cùng IP → 429 + Retry-After; IP khác vẫn gửi được', async () => {
      const limiter = createRateLimiter(new Map());
      for (let i = 0; i < 5; i += 1) {
        expect((await post(withToken(b2bBody()), { limiter, deliver: false })).res.status).toBe(201);
      }
      const sixth = await post(withToken(b2bBody()), { limiter });
      expect([sixth.res.status, sixth.body.error?.code]).toEqual([429, 'RATE_LIMITED']);
      expect(Number(sixth.res.headers.get('retry-after'))).toBeGreaterThan(500);
      expect((await post(withToken(b2bBody()), { limiter, ip: '198.51.100.77', deliver: false })).res.status).toBe(201);
      // X-Forwarded-For tự chế ở ĐẦU chuỗi không né được (app lấy phần tử cuối do proxy thêm)
      const spoof = await post(withToken(b2bBody()), { limiter, headers: { 'x-forwarded-for': `1.2.3.4, ${SENTINEL.ip}` } });
      expect(spoof.res.status).toBe(429);
      expect((await countRows()).leads).toBe(6);
    });
    it('AC-C6: thiếu token / token sai / token đã dùng / sai hostname / sai action → 403; không ghi DB', async () => {
      const tokens = [undefined, 'bad', 'spent', 'host:lead_b2b', 'ok:lead_technician'];
      for (const turnstileToken of tokens) {
        const r = await post({ ...b2bBody(), turnstileToken });
        expect([r.res.status, r.body.error?.code], String(turnstileToken)).toEqual([403, 'CAPTCHA_FAILED']);
      }
      expect((await countRows()).leads).toBe(0);
      // siteverify KHÔNG nhận IP
      expect(siteverify.bodies.every((b) => !('remoteip' in b))).toBe(true);
    });
    it('D-09: siteverify timeout / 5xx / không kết nối được → vẫn 201, meta.captcha=unverified, email cảnh báo', async () => {
      const port = await closedPort();
      const r1 = await post({ ...b2bBody(), turnstileToken: 'slow' });
      const r2 = await post({ ...b2bBody(), turnstileToken: '500' });
      for (const r of [r1, r2]) {
        expect(r.res.status).toBe(201);
        expect((await leadRow(String(r.body.data?.id))).meta.captcha).toBe('unverified');
      }
      // trỏ siteverify tới cổng đóng
      const tasks: Promise<unknown>[] = [];
      const deps = createLeadDeps({
        env: env(),
        schedule: (t) => tasks.push(t()),
        logger,
        rateLimiter: createRateLimiter(new Map()),
        turnstileUrl: `http://127.0.0.1:${port}/siteverify`,
      });
      const res = await handleLeadPost(leadRequest(withToken(b2bBody())), deps);
      await Promise.all(tasks);
      const id = String(((await res.json()) as { data: { id: string } }).data.id);
      expect(res.status).toBe(201);
      expect((await leadRow(id)).meta.captcha).toBe('unverified');
      expect(smtp.messages.length).toBeGreaterThanOrEqual(3);
      expect(smtp.messages.every((m) => mailText(m.data).includes('Chưa xác minh captcha'))).toBe(true);
    });
    it('Origin lạ → 403 FORBIDDEN_ORIGIN; không Origin (curl) + Turnstile hợp lệ → 201', async () => {
      const bad = await post(withToken(b2bBody()), { headers: { origin: 'https://evil.example' } });
      expect([bad.res.status, bad.body.error?.code]).toEqual([403, 'FORBIDDEN_ORIGIN']);
      expect((await post(withToken(b2bBody()), { headers: { origin: undefined } })).res.status).toBe(201);
    });
  });

  describe('độ tin cậy (outbox, mục 3.5)', () => {
    it('AC-C7: SMTP sập → vẫn 201 trong ≤ 500 ms, lead trong DB, backoff 1 phút; SMTP sống lại + retry → sent', async () => {
      const down = await closedPort();
      const { res, body, ms } = await post(withToken(b2bBody()), { env: { SMTP_PORT: String(down) } });
      expect(res.status).toBe(201);
      expect(ms).toBeLessThan(500);
      const id = String(body.data?.id);
      const [n] = await notificationsOf(id);
      expect(n).toMatchObject({ status: 'pending', attempts: 1 });
      expect(n?.last_error_code).toMatch(/^SMTP_[A-Z0-9_]+$/);
      const waitSec = (new Date(n?.next_attempt_at ?? 0).getTime() - Date.now()) / 1000;
      expect(waitSec).toBeGreaterThan(30);
      expect(waitSec).toBeLessThan(70);

      // chưa tới hạn → lượt retry không nhận
      expect((await runRetryPass(outboxCtx(smtp.port))).claimed).toBe(0);
      await owner().query(`UPDATE lead_notifications SET next_attempt_at = NOW() - interval '1 second' WHERE lead_id = $1`, [id]);
      const pass = await runRetryPass(outboxCtx(smtp.port));
      expect(pass).toMatchObject({ claimed: 1, sent: 1 });
      expect(await notificationsOf(id)).toEqual([expect.objectContaining({ status: 'sent', attempts: 2, last_error_code: null })]);
      expect(smtp.messages).toHaveLength(1);
    });

    it('hai tiến trình retry chạy song song trên 20 dòng pending → mỗi dòng gửi đúng 1 lần', async () => {
      const limiter = createRateLimiter(new Map());
      const ids: string[] = [];
      for (let i = 0; i < 20; i += 1) {
        const r = await post(withToken(b2bBody()), { limiter, deliver: false, env: { LEAD_RATE_LIMIT_MAX: '100' } });
        ids.push(String(r.body.data?.id));
      }
      const second = new pg.Pool({ connectionString: DB.app, max: 2 });
      try {
        const [a, b] = await Promise.all([
          runRetryPass(outboxCtx(smtp.port), { batchSize: 5 }),
          runRetryPass(outboxCtx(smtp.port, second), { batchSize: 5 }),
        ]);
        expect(a.sent + b.sent).toBe(20);
      } finally {
        await second.end();
      }
      expect(smtp.messages).toHaveLength(20);
      const refs = smtp.messages.map((m) => /\] ([0-9A-F]{8}) ·/.exec(headerOf(m.data, 'Subject'))?.[1]);
      expect(refs.every(Boolean)).toBe(true);
      expect(new Set(refs).size).toBe(20);
      const { rows } = await owner().query(`SELECT count(*)::int AS n FROM lead_notifications WHERE status = 'sent' AND attempts = 1`);
      expect(rows[0]?.n).toBe(20);
    });

    it('hết 8 lần → dead, log lead_notify_dead (không PII); --requeue-dead đưa về pending', async () => {
      const { body } = await post(withToken(b2bBody()), { deliver: false });
      const id = String(body.data?.id);
      await owner().query(`UPDATE lead_notifications SET attempts = 7, next_attempt_at = NOW() WHERE lead_id = $1`, [id]);
      const before = logLines.length;
      const pass = await runRetryPass(outboxCtx(await closedPort()));
      expect(pass).toMatchObject({ claimed: 1, dead: 1 });
      expect(await notificationsOf(id)).toEqual([expect.objectContaining({ status: 'dead', attempts: 8 })]);
      const dead = logLines.slice(before).find((l) => l.includes('"lead_notify_dead"'));
      expect(dead && JSON.parse(dead)).toMatchObject({ level: 'error', leadId: id, channel: 'email', target: 'b2b_sales', attempts: 8 });
    });

    it('địa chỉ nhận còn là giữ chỗ …@invalid → không gửi SMTP, lỗi cấu hình RECIPIENT_PLACEHOLDER', async () => {
      const { body } = await post(withToken(b2bBody()), { env: { LEAD_NOTIFY_EMAIL_B2B: 'chua-co-dia-chi@invalid' } });
      expect(await notificationsOf(String(body.data?.id))).toEqual([
        expect.objectContaining({ status: 'pending', last_error_code: 'RECIPIENT_PLACEHOLDER' }),
      ]);
      expect(smtp.messages).toHaveLength(0);
    });

    it('dòng pending cũ hơn 30 phút → log error lead_notify_backlog', async () => {
      const { body } = await post(withToken(b2bBody()), { deliver: false });
      await owner().query(`UPDATE lead_notifications SET created_at = NOW() - interval '31 minutes' WHERE lead_id = $1`, [body.data?.id]);
      const before = logLines.length;
      expect(await checkBacklog(getPool(DB.app), logger)).toBe(1);
      expect(logLines.slice(before).some((l) => l.includes('"lead_notify_backlog"') && l.includes('"level":"error"'))).toBe(true);
    });

    it('AC-C9: gửi lại cùng Idempotency-Key → 201 cùng id, Idempotent-Replayed, không thêm dòng/thông báo; song song → 1 dòng', async () => {
      const key = uuid();
      const first = await post(withToken(b2bBody()), { headers: { 'idempotency-key': key } });
      const again = await post(withToken(b2bBody()), { headers: { 'idempotency-key': key } });
      expect(again.res.status).toBe(201);
      expect(again.res.headers.get('idempotent-replayed')).toBe('true');
      expect(again.body.data?.id).toBe(first.body.data?.id);
      expect(await countRows()).toEqual({ leads: 1, notifications: 1 });
      expect(smtp.messages).toHaveLength(1);

      const key2 = uuid();
      const parallel = await Promise.all([1, 2, 3].map(() => post(withToken(b2bBody()), { headers: { 'idempotency-key': key2 } })));
      expect(new Set(parallel.map((p) => p.body.data?.id)).size).toBe(1);
      expect(parallel.every((p) => p.res.status === 201)).toBe(true);
      expect((await countRows()).leads).toBe(2);
    });

    it('DB không kết nối được → 500 INTERNAL_ERROR có correlationId, không stack trace', async () => {
      const port = await closedPort();
      const r = await post(withToken(b2bBody()), { env: { DATABASE_URL: `postgres://bb_app:x@127.0.0.1:${port}/none` } });
      expect(r.res.status).toBe(500);
      expect(r.body.error).toMatchObject({ code: 'INTERNAL_ERROR', details: [], correlationId: r.res.headers.get('x-correlation-id') });
      expect(JSON.stringify(r.body)).not.toMatch(/ECONNREFUSED|stack|\.ts:/);
      await getPool(`postgres://bb_app:x@127.0.0.1:${port}/none`).end();
    });
  });

  describe('quyền DB (contract mục 2: bb_app chỉ DML cần thiết)', () => {
    it('bb_app không UPDATE/DELETE leads, không DDL', async () => {
      const app = getPool(DB.app);
      await expect(app.query(`UPDATE leads SET status = 'spam'`)).rejects.toThrow(/permission denied/);
      await expect(app.query('DELETE FROM leads')).rejects.toThrow(/permission denied/);
      await expect(app.query('CREATE TABLE x_test (id int)')).rejects.toThrow(/permission denied/);
      await expect(app.query('DELETE FROM lead_notifications')).rejects.toThrow(/permission denied/);
    });
  });

  it('AC-C8: log của toàn bộ bộ test không chứa giá trị đánh dấu hay IP thô', () => {
    expect(logLines.length).toBeGreaterThan(20);
    const all = logLines.join('\n');
    for (const needle of SENTINEL_NEEDLES) expect(all, needle).not.toContain(needle);
    expect(all).not.toContain('198.51.100.9');
    expect(all).not.toContain('kinh-doanh@congty-nhan.test');
    expect(all).not.toContain('ok:lead_b2b');
  });
});
