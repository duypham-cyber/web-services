/**
 * Form lead — ip_hash, IP tin cậy, rate-limit, Turnstile, cấu hình, email thông báo (escape, tiêu đề không PII), kênh gửi.
 * Không cần DB/mạng (siteverify dùng fetch giả).
 */
import { describe, expect, it, vi } from 'vitest';
import { readLeadsConfig } from '../../lib/leads/config';
import { clientIpFromHeaders, hashIp, normalizeIp } from '../../lib/leads/ip';
import { buildLeadEmail, escapeHtml, formatVnTime, type StoredLead } from '../../lib/leads/notify/email';
import { createMailTransport, isPlaceholderAddress, mailErrorCode } from '../../lib/leads/notify/transport';
import { BACKOFF_MINUTES, MAX_ATTEMPTS, NOTIFY_ROUTES } from '../../lib/leads/outbox';
import { createRateLimiter } from '../../lib/leads/rate-limit';
import { PROVINCE_CODES } from '../../lib/leads/rules';
import { TURNSTILE_TEST_SECRETS, verifyTurnstile } from '../../lib/leads/turnstile';
import { SENTINEL, baseEnv } from '../leads/fixtures';

describe('ip_hash = HMAC-SHA256(IP, secret)', () => {
  it('64 hex, ổn định, đổi theo secret, không chứa IP', () => {
    const a = hashIp(SENTINEL.ip, 'secret-a-0123456789abcdef0123456789');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIp(SENTINEL.ip, 'secret-a-0123456789abcdef0123456789')).toBe(a);
    expect(hashIp(SENTINEL.ip, 'secret-b-0123456789abcdef0123456789')).not.toBe(a);
    expect(a).not.toContain('203');
  });
  it('chuẩn hóa địa chỉ', () => {
    expect(normalizeIp('::ffff:203.0.113.77')).toBe('203.0.113.77');
    expect(normalizeIp('203.0.113.77:51234')).toBe('203.0.113.77');
    expect(normalizeIp('[2001:db8::1]:443')).toBe('2001:db8::1');
    expect(normalizeIp('không phải ip')).toBeNull();
  });
  it('xff-last: lấy phần tử CUỐI (do proxy loopback thêm), bỏ phần client tự khai', () => {
    const h = new Headers({ 'x-forwarded-for': '1.1.1.1, 10.0.0.1, 203.0.113.77', 'x-real-ip': '9.9.9.9' });
    expect(clientIpFromHeaders(h, 'xff-last')).toBe('203.0.113.77');
    expect(clientIpFromHeaders(h, 'x-real-ip')).toBe('9.9.9.9');
    expect(clientIpFromHeaders(new Headers(), 'xff-last')).toBe('unknown');
  });
});

describe('rate-limit cửa sổ trượt (bước 4, AC-C5)', () => {
  const W = 600_000;
  it('5 lần qua, lần 6 bị chặn với Retry-After, hết cửa sổ thì qua lại', () => {
    const rl = createRateLimiter(new Map());
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i += 1) expect(rl.hit('ip-a', t0 + i * 1000, 5, W).allowed).toBe(true);
    const sixth = rl.hit('ip-a', t0 + 10_000, 5, W);
    expect(sixth).toEqual({ allowed: false, retryAfterSec: 590 });
    expect(rl.hit('ip-b', t0 + 10_000, 5, W).allowed).toBe(true);
    // request bị 429 không được tính thêm → đúng 600 s sau lần đầu là qua
    expect(rl.hit('ip-a', t0 + W + 1, 5, W).allowed).toBe(true);
  });
});

describe('Turnstile siteverify (bước 11, D-09)', () => {
  const okBody = { success: true, hostname: 'lapdattoanquoc.vn', action: 'lead_b2b', 'error-codes': [] };
  const fakeFetch = (status: number, body: unknown) =>
    vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
  const base = { secret: 'real-secret', expectedAction: 'lead_b2b', allowedHostnames: ['lapdattoanquoc.vn'], token: 'tok' };

  it('qua khi success + hostname + action đúng; KHÔNG gửi remoteip', async () => {
    const f = fakeFetch(200, okBody);
    expect(await verifyTurnstile({ ...base, fetchImpl: f as unknown as typeof fetch })).toEqual({ result: 'passed' });
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(String(init.body))).toEqual({ secret: 'real-secret', response: 'tok' });
  });
  it('sai hostname / sai action / success=false / token đã dùng / thiếu token → failed', async () => {
    const run = (body: unknown) => verifyTurnstile({ ...base, fetchImpl: fakeFetch(200, body) as unknown as typeof fetch });
    expect(await run({ ...okBody, hostname: 'evil.example' })).toMatchObject({ result: 'failed', reason: 'hostname-mismatch' });
    expect(await run({ ...okBody, action: 'lead_technician' })).toMatchObject({ result: 'failed', reason: 'action-mismatch' });
    expect(await run({ success: false, 'error-codes': ['invalid-input-response'] })).toMatchObject({ result: 'failed' });
    expect(await run({ success: false, 'error-codes': ['timeout-or-duplicate'] })).toMatchObject({ result: 'failed' });
    const f = fakeFetch(200, okBody);
    expect(await verifyTurnstile({ ...base, token: '  ', fetchImpl: f as unknown as typeof fetch })).toMatchObject({ result: 'failed' });
    expect(f).not.toHaveBeenCalled();
  });
  it('5xx / lỗi mạng / timeout → unverified (nhận lead, gắn cờ)', async () => {
    expect(await verifyTurnstile({ ...base, fetchImpl: fakeFetch(503, {}) as unknown as typeof fetch })).toMatchObject({
      result: 'unverified',
      misconfigured: false,
    });
    const boom = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    expect(await verifyTurnstile({ ...base, fetchImpl: boom as unknown as typeof fetch })).toMatchObject({ result: 'unverified', reason: 'network' });
    const slow = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );
    expect(await verifyTurnstile({ ...base, timeoutMs: 20, fetchImpl: slow as unknown as typeof fetch })).toMatchObject({
      result: 'unverified',
      reason: 'timeout',
    });
  });
  it('secret của mình sai → unverified + misconfigured (báo động, không phạt người dùng)', async () => {
    const r = await verifyTurnstile({
      ...base,
      fetchImpl: fakeFetch(200, { success: false, 'error-codes': ['invalid-input-secret'] }) as unknown as typeof fetch,
    });
    expect(r).toEqual({ result: 'unverified', reason: 'invalid-input-secret', misconfigured: true });
  });
  it('khóa test chính thức: bỏ kiểm hostname/action (siteverify test trả hostname khác)', async () => {
    const r = await verifyTurnstile({
      ...base,
      secret: TURNSTILE_TEST_SECRETS.pass,
      fetchImpl: fakeFetch(200, { success: true, hostname: 'example.com' }) as unknown as typeof fetch,
    });
    expect(r).toEqual({ result: 'test' });
  });
});

describe('readLeadsConfig', () => {
  it('mặc định 5 lần/600 s; đủ biến → không lỗi', () => {
    const c = readLeadsConfig(baseEnv());
    expect([c.rateLimitMax, c.rateLimitWindowSec, c.problems]).toEqual([5, 600, []]);
    expect(c.formEnabled).toBe(true);
  });
  it('thiếu biến → problems (chỉ tên biến); khóa test trên site thật → lỗi', () => {
    const c = readLeadsConfig(baseEnv({ DATABASE_URL: '', LEAD_IP_HASH_SECRET: 'ngan', LEAD_ALLOWED_ORIGINS: '' }));
    expect(c.problems).toEqual(['DATABASE_URL', 'LEAD_IP_HASH_SECRET', 'LEAD_ALLOWED_ORIGINS']);
    const prod = readLeadsConfig(baseEnv({ NODE_ENV: 'production', TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRETS.pass }));
    expect(prod.problems.join()).toMatch(/test key on production/);
    const preview = readLeadsConfig(
      baseEnv({ NODE_ENV: 'production', DRAFT_PREVIEW: '1', TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRETS.pass }),
    );
    expect(preview.problems).toEqual([]);
    expect(readLeadsConfig(baseEnv({ LEADS_FORM_ENABLED: 'false' })).formEnabled).toBe(false);
    expect(readLeadsConfig(baseEnv({ LEADS_FORM_ENABLED: undefined })).formEnabled).toBe(false);
  });
});

describe('outbox: định tuyến + lịch thử', () => {
  it('B2B → b2b_sales, thợ → technician_hr (Rule 6, T4)', () => {
    expect(NOTIFY_ROUTES.lead_b2b).toEqual([{ channel: 'email', target: 'b2b_sales' }]);
    expect(NOTIFY_ROUTES.lead_technician).toEqual([{ channel: 'email', target: 'technician_hr' }]);
  });
  it('8 lần: ngay · 1 · 5 · 15 phút · 1 · 3 · 6 · 12 giờ (~22 giờ)', () => {
    expect(MAX_ATTEMPTS).toBe(8);
    expect([...BACKOFF_MINUTES]).toEqual([1, 5, 15, 60, 180, 360, 720]);
    expect(BACKOFF_MINUTES.reduce((a, b) => a + b, 0) / 60).toBeCloseTo(22.35, 2);
  });
});

function storedLead(overrides: Partial<StoredLead> = {}): StoredLead {
  return {
    id: '0b9f3c2e-6d1a-4c55-9a7e-2f4d8b1c9e01',
    type: 'lead_b2b',
    payload: {
      intent: 'demo',
      fullName: SENTINEL.fullName,
      company: SENTINEL.company,
      jobTitle: null,
      phone: SENTINEL.phoneE164,
      workEmail: SENTINEL.workEmail,
      customerType: 'marketplace',
      monthlyVolume: 'gte_2000',
      provinces: ['01', '79'],
      note: SENTINEL.note,
    },
    payload_version: 1,
    consent_version: 'b2b-2026-10-v1',
    consent_purposes: ['b2b_sales_contact'],
    consent_at: new Date('2026-10-03T14:15:03Z'),
    utm: { source: 'zalo' },
    locale: 'vi',
    page_path: '/giai-phap/san-tmdt-ban-le',
    film_tier: null,
    meta: { captcha: 'passed', emailFreeDomain: false, sanitized: [] },
    created_at: new Date('2026-10-03T14:15:03Z'),
    ...overrides,
  };
}

describe('email thông báo (mục 3.6)', () => {
  it('escapeHtml', () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')">&`)).toBe('&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;');
  });
  it('giờ Việt Nam', () => {
    expect(formatVnTime(new Date('2026-10-03T14:15:03Z'))).toBe('21:15:03 03/10/2026 (giờ Việt Nam)');
  });
  it('B2B: tiêu đề chỉ mã + enum; ghi chú escape; Reply-To = email; SĐT dạng 0987 654 321', () => {
    const m = buildLeadEmail(storedLead());
    expect(m.subject).toBe('[Lead B2B][Demo 30 phút] 0B9F3C2E · Sàn TMĐT · Từ 2.000 đơn/tháng · 2 tỉnh');
    for (const needle of ['Sentinel', '0987', 'sentinel@', 'SENTINEL']) expect(m.subject).not.toContain(needle);
    expect(m.html).not.toContain('<img src=x');
    expect(m.html).toContain('SENTINEL-NOTE &lt;img src=x onerror=alert(1)&gt;');
    expect(m.text).toContain('Số di động: 0987 654 321');
    expect(m.html).toContain('href="tel:+84987654321"');
    expect(m.replyTo).toBe(SENTINEL.workEmail);
    expect(m.text).toContain('Không đồng ý nhận tin tiếp thị');
    expect(m.text).toContain('Phiên bản điều khoản: b2b-2026-10-v1 · lúc 21:15:03 03/10/2026 (giờ Việt Nam)');
  });
  it('AC-B8/B9 + D-09: Toàn quốc (34/34), nhãn Email cá nhân, cảnh báo captcha chưa xác minh', () => {
    const m = buildLeadEmail(
      storedLead({
        payload: { ...storedLead().payload, provinces: [...PROVINCE_CODES], workEmail: 'ai@gmail.com' },
        meta: { captcha: 'unverified', emailFreeDomain: true, sanitized: [] },
      }),
    );
    expect(m.subject).toContain('Toàn quốc (34/34)');
    expect(m.text).toContain('Tỉnh/thành triển khai: Toàn quốc (34/34)');
    expect(m.text).toContain('Email cá nhân');
    expect(m.text).toContain('Chưa xác minh captcha');
  });
  it('form thợ: tiêu đề mã · kỹ năng · tỉnh; link Zalo; không Reply-To; ghi rõ không đồng ý tin việc mới', () => {
    const m = buildLeadEmail(
      storedLead({
        type: 'lead_technician',
        payload: { fullName: SENTINEL.fullName, phone: SENTINEL.phoneE164, province: '79', primarySkill: 'air_conditioner' },
        consent_version: 'tech-2026-10-v1',
        consent_purposes: ['tech_partner_contact'],
        meta: { captcha: 'passed', sanitized: [] },
      }),
    );
    expect(m.subject).toBe('[Đối tác thợ] 0B9F3C2E · Điều hòa · TP. Hồ Chí Minh');
    expect(m.replyTo).toBeUndefined();
    expect(m.html).toContain('https://zalo.me/0987654321');
    expect(m.text).toContain('Không đồng ý nhận tin việc mới');
  });
});

describe('kênh gửi email', () => {
  it('địa chỉ giữ chỗ …@invalid không gửi qua SMTP', () => {
    expect(isPlaceholderAddress('chua-co-dia-chi@invalid')).toBe(true);
    expect(isPlaceholderAddress('a@lapdattoanquoc.invalid')).toBe(true);
    expect(isPlaceholderAddress('kinh-doanh@bluebolt.services')).toBe(false);
  });
  it('SMTP_HOST → smtp; dev + LEAD_MAIL_TRANSPORT=file → tệp; site thật thiếu SMTP → null (không đánh dấu sent)', () => {
    expect(createMailTransport({ SMTP_HOST: '127.0.0.1' })?.kind).toBe('smtp');
    expect(createMailTransport({ LEAD_MAIL_TRANSPORT: 'file' }, '/tmp')?.kind).toBe('file');
    expect(createMailTransport({ NODE_ENV: 'production', DRAFT_PREVIEW: '1', LEAD_MAIL_TRANSPORT: 'file' }, '/tmp')?.kind).toBe('file');
    expect(createMailTransport({ NODE_ENV: 'production', LEAD_MAIL_TRANSPORT: 'file' })).toBeNull();
    expect(createMailTransport({})).toBeNull();
  });
  it('mã lỗi kỹ thuật chỉ [A-Z0-9_], không mang nội dung', () => {
    expect(mailErrorCode({ code: 'ECONNREFUSED' }, 'SMTP')).toBe('SMTP_ECONNREFUSED');
    expect(mailErrorCode({ responseCode: 550 }, 'SMTP')).toBe('SMTP_550');
    expect(mailErrorCode(new Error('x'), 'FILE')).toBe('FILE_ERROR');
  });
});
