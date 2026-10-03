import { existsSync, readdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import pg from 'pg';

/**
 * E2E form lead trên dev server dùng chung (DRAFT_PREVIEW=1, .env.local có DB + khóa test Turnstile) —
 * contracts/lead-b2b.md mục 7 (HAPPY PATH, VALIDATION, CONSENT, FE/A11Y), lead-technician.md mục 7 (AC-T1, T2, T8, T9).
 *
 *   flock /tmp/bluebolt-web-browser.lock npx playwright test tests/leads --workers=1
 *
 * - Ca có ghi DB chỉ chạy ở MỘT project (B2B ở desktop-1440, thợ ở mobile-390) để không chạm rate-limit; mọi lead thử
 *   được xóa trong afterAll (bb_ops: DELETE, cascade sang lead_notifications) cùng tệp .eml của nó.
 * - Thiếu DATABASE_URL_OPS hoặc trang không có form (bản build production: form tắt) → ca gửi form tự bỏ qua; ca
 *   "form tắt" kiểm khối Gọi · Zalo · email thay thế.
 * - Turnstile dùng khóa test của Cloudflare (luôn qua) → cần mạng ra challenges.cloudflare.com.
 */
const envFile = join(process.cwd(), '.env.local');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const OPS_URL = process.env.DATABASE_URL_OPS ?? '';
const MAIL_DIR = process.env.LEAD_MAIL_DIR?.trim() || '.cache/lead-mail';
const API = '/api/v1/leads';

const created: string[] = [];
let pool: pg.Pool | null = null;
const db = () => (pool ??= new pg.Pool({ connectionString: OPS_URL, max: 2 }));

type LeadRow = {
  id: string;
  type: string;
  status: string;
  locale: string;
  payload: Record<string, unknown>;
  consent_purposes: string[];
  ip_hash: string;
};

async function leadByReference(reference: string): Promise<LeadRow | null> {
  const { rows } = await db().query<LeadRow>(
    `SELECT id::text, type, status, locale, payload, consent_purposes, ip_hash FROM leads WHERE upper(left(id::text, 8)) = $1`,
    [reference],
  );
  if (rows[0]) created.push(rows[0].id);
  return rows[0] ?? null;
}

async function notificationTargets(id: string): Promise<string[]> {
  const { rows } = await db().query<{ target: string }>('SELECT target FROM lead_notifications WHERE lead_id = $1', [id]);
  return rows.map((r) => r.target).sort();
}

async function countByName(fullName: string): Promise<number> {
  const { rows } = await db().query<{ n: number }>(`SELECT count(*)::int AS n FROM leads WHERE payload->>'fullName' = $1`, [
    fullName,
  ]);
  return rows[0]?.n ?? 0;
}

/** Đợi tệp .eml có mã tham chiếu (after() gửi sau response). */
async function emlFor(reference: string): Promise<string | null> {
  for (let i = 0; i < 40; i++) {
    if (existsSync(MAIL_DIR)) {
      for (const name of readdirSync(MAIL_DIR)) {
        if (!name.endsWith('.eml')) continue;
        const text = readFileSync(join(MAIL_DIR, name), 'utf8');
        if (text.includes(reference)) return join(MAIL_DIR, name);
      }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

/** Tên thử chỉ gồm chữ cái (PERSON_NAME), khác nhau mỗi lần chạy để đếm dòng DB theo tên. */
function sentinelName(prefix: string): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const tail = Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  return `Sentinel ${prefix} ${tail}`;
}

/** Ghi lại sự kiện Umami (window.umami.track) để kiểm AC-C12 mà không cần máy chủ Umami. */
async function stubUmami(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __events: [string, Record<string, unknown>][]; umami: unknown };
    w.__events = [];
    w.umami = { track: (e: string, d: Record<string, unknown>) => w.__events.push([e, d]) };
  });
}
const events = (page: Page) =>
  page.evaluate(() => (window as unknown as { __events: [string, Record<string, unknown>][] }).__events);

/**
 * Form bật (data-lead-state="enabled") → cuộn tới khối để LazyLeadForm tải mã form, đợi form hiện. false = form tắt
 * (bản production khi câu đồng ý chưa duyệt).
 */
async function leadState(page: Page): Promise<string | null> {
  const block = page.locator('[data-lead-block]').first();
  return (await block.count()) > 0 ? block.getAttribute('data-lead-state') : null;
}

async function openForm(page: Page): Promise<boolean> {
  const block = page.locator('[data-lead-block]').first();
  if ((await leadState(page)) !== 'enabled') return false;
  await block.scrollIntoViewIfNeeded();
  await expect(block.locator('form')).toBeVisible();
  return true;
}

async function fillB2B(page: Page, fullName: string) {
  await page.locator('#lead-b2b-fullName').fill(fullName);
  await page.locator('#lead-b2b-company').fill('Cong ty Thu Nghiem');
  await page.locator('#lead-b2b-phone').fill('0902 808 049');
  await page.locator('#lead-b2b-workEmail').fill('sentinel@congty-thu.vn');
  await page.locator('#lead-b2b-customerType').selectOption('brand');
  await page.locator('#lead-b2b-monthlyVolume').selectOption('100_499');
  await page.locator('#lead-b2b-provinces-all').check();
  await page.locator('#lead-b2b-note').fill('[E2E-LEADS] SENTINEL-NOTE');
}

test.afterAll(async () => {
  if (!pool) return;
  for (const id of created) {
    const reference = id.slice(0, 8).toUpperCase();
    await db().query('DELETE FROM leads WHERE id = $1', [id]);
    const eml = await emlFor(reference).catch(() => null);
    if (eml) unlinkSync(eml);
  }
  await pool.end();
  pool = null;
});

test.describe('form B2B', () => {
  test('AC-C2: không checkbox nào tick sẵn (HTML server và sau khi form tải); có link chính sách; mã form không tải lúc vào trang', async ({
    page,
    request,
  }) => {
    const html = await (await request.get('/bang-gia')).text();
    test.skip(!html.includes('data-lead-state="enabled"'), 'form đang tắt (bản production)');
    const boxes = [...html.matchAll(/<input[^>]*type="checkbox"[^>]*>/g)].map((m) => m[0]);
    expect(boxes.filter((b) => /\schecked(=|\s|>)/.test(b))).toEqual([]);
    // HTML server của khối form: tiêu đề + Gọi · email (bản không JS), chưa có ô nhập
    expect(html).toMatch(/data-lead-placeholder=""[\s\S]*?href="tel:\+84902808049"/);

    await page.goto('/bang-gia', { waitUntil: 'networkidle' });
    await expect(page.locator('[data-lead-root]')).toHaveAttribute('data-lead-root', 'placeholder');
    await expect(page.locator('[data-lead-block] form')).toHaveCount(0);
    expect(await openForm(page)).toBe(true);
    await expect(page.locator('[data-lead-root]')).toHaveAttribute('data-lead-root', 'ready');
    await expect(page.locator('[data-lead-block] input[type="checkbox"]')).not.toHaveCount(0);
    await expect(page.locator('[data-lead-block] input[type="checkbox"]:checked')).toHaveCount(0);
    await expect(page.locator('[data-lead-block] a[href="/chinh-sach-bao-mat"]')).toHaveCount(1);
  });

  test('Turnstile chỉ tải sau lần tương tác đầu; honeypot không lọt cây a11y', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('challenges.cloudflare.com')) hits.push(r.url());
    });
    await page.goto('/bang-gia', { waitUntil: 'networkidle' });
    test.skip(!(await openForm(page)), 'form đang tắt');
    await page.waitForTimeout(500);
    expect(hits).toEqual([]);
    const hp = page.locator('#lead-b2b-hp');
    await expect(hp).toHaveAttribute('tabindex', '-1');
    await expect(hp).toHaveAttribute('autocomplete', 'off');
    expect(await hp.evaluate((el) => el.closest('[aria-hidden="true"]') !== null)).toBe(true);
    await page.locator('#lead-b2b-fullName').focus();
    await expect.poll(() => hits.length, { timeout: 15_000 }).toBeGreaterThan(0);
  });

  test('AC-B4: SĐT "abc" báo lỗi inline khi rời ô; thiếu đồng ý → lỗi tại checkbox, không gửi request', async ({ page }) => {
    let apiCalls = 0;
    page.on('request', (r) => {
      if (r.url().includes(API)) apiCalls++;
    });
    await stubUmami(page);
    await page.goto('/bang-gia');
    test.skip(!(await openForm(page)), 'form đang tắt');

    const phone = page.locator('#lead-b2b-phone');
    await phone.fill('abc');
    await phone.press('Tab');
    await expect(phone).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#lead-b2b-phone-error')).toContainText('Số di động chưa đúng định dạng');

    await fillB2B(page, sentinelName('Validation'));
    await expect(phone).not.toHaveAttribute('aria-invalid', 'true');
    await page.locator('[data-lead-block] button[type="submit"]').click();
    const consent = page.locator('#lead-b2b-consent-b2b_sales_contact');
    await expect(consent).toHaveAttribute('aria-invalid', 'true');
    await expect(consent).toBeFocused();
    await expect(page.locator('#lead-b2b-consent-error')).toBeVisible();
    expect(apiCalls).toBe(0);
    expect(await events(page)).toContainEqual(['lead_error', { type: 'lead_b2b', code: 'CLIENT_VALIDATION' }]);
  });

  test('bấm Gửi khi trống → focus ô lỗi đầu tiên (Họ và tên)', async ({ page }) => {
    await page.goto('/giai-phap/hang-dien-may');
    test.skip(!(await openForm(page)), 'form đang tắt');
    await page.locator('[data-lead-block] button[type="submit"]').click();
    await expect(page.locator('#lead-b2b-fullName')).toBeFocused();
    await expect(page.locator('[data-lead-block] [aria-invalid="true"]')).not.toHaveCount(0);
  });

  test('AC-C1/AC-B1: gửi hợp lệ → cảm ơn tại chỗ + mã; DB 1 dòng đúng; thông báo b2b_sales; tệp .eml', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'ca ghi DB chỉ chạy ở desktop-1440');
    test.skip(!OPS_URL, 'thiếu DATABASE_URL_OPS');
    await stubUmami(page);
    await page.goto('/bang-gia');
    test.skip(!(await openForm(page)), 'form đang tắt');

    const name = sentinelName('Quote');
    await fillB2B(page, name);
    await page.locator('#lead-b2b-consent-b2b_sales_contact').check();
    const responsePromise = page.waitForResponse((r) => r.url().includes(API) && r.request().method() === 'POST');
    await page.locator('[data-lead-block] button[type="submit"]').click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);

    const thanks = page.locator('[data-lead-block] [role="status"]');
    await expect(thanks.locator('h3')).toHaveText('Bluebolt đã nhận yêu cầu của bạn');
    await expect(thanks.locator('h3')).toBeFocused();
    const reference = (await thanks.locator('strong').textContent())?.trim() ?? '';
    expect(reference).toMatch(/^[0-9A-F]{8}$/);

    const row = await leadByReference(reference);
    expect(row).not.toBeNull();
    expect(row?.type).toBe('lead_b2b');
    expect(row?.status).toBe('new');
    expect(row?.locale).toBe('vi');
    expect(row?.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row?.payload.intent).toBe('quote');
    expect(row?.payload.phone).toBe('+84902808049');
    expect((row?.payload.provinces as string[]).length).toBe(34);
    expect(row?.consent_purposes).toEqual(['b2b_sales_contact']);
    expect(await notificationTargets(row!.id)).toEqual(['b2b_sales']);
    expect(await emlFor(reference)).not.toBeNull();

    const ev = await events(page);
    expect(ev.filter(([e]) => e === 'lead_submit')).toHaveLength(1);
    const submit = ev.find(([e]) => e === 'lead_submit')?.[1] ?? {};
    expect(Object.keys(submit).sort()).toEqual(['filmTier', 'intent', 'locale', 'type']);
    expect(JSON.stringify(ev)).not.toMatch(/Sentinel|0902|sentinel@|SENTINEL/);
  });

  test('AC-C9: mạng rớt sau khi server đã ghi → gửi lại cùng Idempotency-Key, không trùng, không bắn lead_submit', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'ca ghi DB chỉ chạy ở desktop-1440');
    test.skip(!OPS_URL, 'thiếu DATABASE_URL_OPS');
    await stubUmami(page);
    const keys: string[] = [];
    let dropNext = true;
    await page.route(`**${API}`, async (route) => {
      keys.push(route.request().headers()['idempotency-key'] ?? '');
      if (dropNext) {
        dropNext = false;
        await route.fetch(); // server nhận và ghi lead
        await route.abort('failed'); // trình duyệt không nhận được phản hồi
        return;
      }
      await route.continue();
    });
    await page.goto('/giai-phap/hang-dien-may');
    test.skip(!(await openForm(page)), 'form đang tắt');

    const name = sentinelName('Replay');
    await fillB2B(page, name);
    await page.locator('#lead-b2b-consent-b2b_sales_contact').check();
    const submit = page.locator('[data-lead-block] button[type="submit"]');
    await submit.click();
    await expect(page.locator('[data-lead-block] [role="alert"]')).toContainText('Chưa gửi được do mất kết nối');
    // Dữ liệu vẫn còn
    await expect(page.locator('#lead-b2b-fullName')).toHaveValue(name);

    const replay = page.waitForResponse((r) => r.url().includes(API) && r.request().method() === 'POST');
    await submit.click();
    const res = await replay;
    expect(res.status()).toBe(201);
    expect(res.headers()['idempotent-replayed']).toBe('true');
    await expect(page.locator('[data-lead-block] [role="status"] h3')).toBeVisible();

    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(keys[1]).toBe(keys[0]);
    expect(await countByName(name)).toBe(1);
    const reference = (await page.locator('[data-lead-block] [role="status"] strong').textContent())?.trim() ?? '';
    await leadByReference(reference);

    const ev = await events(page);
    expect(ev).toContainEqual(['lead_error', { type: 'lead_b2b', code: 'NETWORK_ERROR' }]);
    expect(ev.filter(([e]) => e === 'lead_submit')).toHaveLength(0);
  });

  test('CTA "Đặt lịch demo" trong trang → intent demo; header "Nhận báo giá" cuộn tới form của trang, không đổi trang', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'header đầy đủ chỉ ở desktop');
    await page.goto('/giai-phap/hang-dien-may', { waitUntil: 'networkidle' });
    test.skip((await leadState(page)) !== 'enabled', 'form đang tắt');
    // Nút demo ở hero, lúc mã form CHƯA tải: chặn điều hướng, tải form, đặt intent demo, cuộn + focus ô đầu
    await expect(page.locator('[data-lead-root]')).toHaveAttribute('data-lead-root', 'placeholder');
    await page.locator('main a[href$="#dat-lich-demo"]').first().click();
    await expect(page.locator('#lead-b2b-title')).toContainText('Đặt lịch demo 30 phút');
    await expect(page.locator('#lead-b2b-fullName')).toBeFocused();
    // Header "Nhận báo giá" khi form đã tải: cuộn về form của trang này, intent quote
    await page.locator('header a[href$="#bao-gia"]').first().click();
    await expect(page.locator('#lead-b2b-title')).toContainText('Nhận báo giá cho doanh nghiệp');
    expect(new URL(page.url()).pathname).toBe('/giai-phap/hang-dien-may');
  });

  test('AC-C11: bản EN — nhãn, lỗi tiếng Anh, không chữ tiếng Việt trong form', async ({ page }) => {
    await page.goto('/en/solutions/marketplaces-retail');
    test.skip(!(await openForm(page)), 'form đang tắt');
    await expect(page.locator('#lead-b2b-title')).toContainText('Discuss an integration');
    const phone = page.locator('#lead-b2b-phone');
    await phone.fill('028 3812 3456');
    await phone.press('Tab');
    await expect(page.locator('#lead-b2b-phone-error')).toContainText('Vietnamese mobile number');
    // Câu đồng ý nháp viết tên pháp nhân tiếng Việt (không dịch) → bỏ vùng thông báo đồng ý khi dò
    const text = await page
      .locator('[data-lead-block] form')
      .evaluate((form) => {
        const clone = form.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('[role="region"]').forEach((n) => n.remove());
        clone.querySelectorAll('[id^="lead-b2b-provinces-"]').forEach((n) => n.closest('li')?.remove());
        return clone.innerText;
      });
    expect(text).not.toMatch(/[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i);
  });
});

test.describe('form thợ', () => {
  test('AC-T1: đúng 4 ô nhập liệu nhìn thấy được (VI #dang-ky và EN #register)', async ({ page }) => {
    for (const path of ['/doi-tac-tho', '/en/technician-partners']) {
      await page.goto(path);
      test.skip(!(await openForm(page)), 'form đang tắt');
      const count = await page.locator('#dang-ky form').evaluate(
        (form) =>
          [...form.querySelectorAll('input, select, textarea')].filter((el) => {
            const input = el as HTMLInputElement;
            if (input.type === 'checkbox' || input.type === 'hidden') return false;
            if (el.closest('[aria-hidden="true"]')) return false;
            const r = el.getBoundingClientRect();
            return r.width > 2 && r.height > 2;
          }).length,
      );
      expect(count, path).toBe(4);
      await expect(page.locator('#lead-tech-phone')).toHaveAttribute('type', 'tel');
      await expect(page.locator('#lead-tech-phone')).toHaveAttribute('inputmode', 'tel');
      await expect(page.locator('#lead-tech-phone')).toHaveAttribute('autocomplete', 'tel');
      await expect(page.locator('#lead-tech-fullName')).toHaveAttribute('autocomplete', 'name');
      if (path.startsWith('/en')) await expect(page.locator('#register')).toHaveCount(1);
    }
  });

  test('AC-T9: nút "Đăng ký thợ" ở thanh dính đáy → focus "Họ và tên" (reduced-motion)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390', 'thanh dính đáy chỉ dưới 768px');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/doi-tac-tho', { waitUntil: 'networkidle' });
    test.skip((await leadState(page)) !== 'enabled', 'form đang tắt');
    await expect(page.locator('[data-lead-root]')).toHaveAttribute('data-lead-root', 'placeholder');
    await page.locator('nav.fixed a[href$="#dang-ky"]').click();
    await expect(page.locator('#lead-tech-fullName')).toBeFocused();
    expect(new URL(page.url()).pathname).toBe('/doi-tac-tho');
  });

  test('AC-T2/AC-T8: gửi hợp lệ trên điện thoại → cảm ơn + 4 bước; payload đúng 4 khóa; chỉ thông báo technician_hr', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390', 'ca ghi DB của form thợ chỉ chạy ở mobile-390');
    test.skip(!OPS_URL, 'thiếu DATABASE_URL_OPS');
    await stubUmami(page);
    await page.goto('/doi-tac-tho');
    test.skip(!(await openForm(page)), 'form đang tắt');

    await page.locator('#lead-tech-fullName').fill(sentinelName('Tho'));
    await page.locator('#lead-tech-phone').fill('0912.345.678');
    await page.locator('#lead-tech-province').selectOption('79');
    await page.locator('#lead-tech-primarySkill').selectOption('other');
    await page.locator('#lead-tech-consent-tech_partner_contact').check();
    const submit = page.locator('#dang-ky form button[type="submit"]');
    // Nút gửi không bị thanh dính đáy che khi đã cuộn tới
    await submit.scrollIntoViewIfNeeded();
    await submit.click();

    const thanks = page.locator('#dang-ky [role="status"]');
    await expect(thanks.locator('h3')).toHaveText('Bluebolt đã nhận đăng ký của bạn');
    await expect(thanks.locator('ol li')).toHaveCount(4);
    const reference = (await thanks.locator('strong').textContent())?.trim() ?? '';
    const row = await leadByReference(reference);
    expect(row?.type).toBe('lead_technician');
    expect(Object.keys(row?.payload ?? {}).sort()).toEqual(['fullName', 'phone', 'primarySkill', 'province']);
    expect(row?.payload.phone).toBe('+84912345678');
    expect(await notificationTargets(row!.id)).toEqual(['technician_hr']);
    const ev = await events(page);
    const submitEvent = ev.find(([e]) => e === 'lead_submit')?.[1] ?? {};
    expect(submitEvent).not.toHaveProperty('intent');
  });
});

/** Trả lời giả của API (không ghi DB) để kiểm cách FE xử lý từng mã lỗi. */
async function fakeApi(page: Page, status: number, code: string, headers: Record<string, string> = {}) {
  await page.route(`**${API}`, (route) =>
    route.fulfill({
      status,
      headers: { 'content-type': 'application/json', 'x-correlation-id': '0b9f3c2e-1111-4222-8333-444455556666', ...headers },
      body: JSON.stringify({
        success: false,
        error: { code, message: 'developer message that must not be shown', details: [], correlationId: '0b9f3c2e-1111-4222-8333-444455556666' },
      }),
    }),
  );
}

async function fillAndSend(page: Page) {
  await fillB2B(page, sentinelName('Fake'));
  await page.locator('#lead-b2b-consent-b2b_sales_contact').check();
  await page.locator('[data-lead-block] button[type="submit"]').click();
}

test.describe('xử lý mã lỗi của API (phản hồi giả, không ghi DB)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'kiểm logic FE: một project là đủ');
  });

  test('429 RATE_LIMITED: báo số phút theo Retry-After + hotline, giữ dữ liệu, không hiện message của API', async ({ page }) => {
    await fakeApi(page, 429, 'RATE_LIMITED', { 'retry-after': '125' });
    await page.goto('/bang-gia');
    test.skip(!(await openForm(page)), 'form đang tắt');
    await fillAndSend(page);
    const alert = page.locator('[data-lead-block] [role="alert"]');
    await expect(alert).toContainText('thử lại sau 3 phút');
    await expect(alert.locator('a[href^="tel:"]')).toHaveCount(1);
    await expect(alert).not.toContainText('developer message');
    await expect(page.locator('#lead-b2b-company')).toHaveValue('Cong ty Thu Nghiem');
    await expect(alert).toBeFocused();
  });

  test('500 INTERNAL_ERROR: mã lỗi 8 ký tự từ correlationId + hotline', async ({ page }) => {
    await fakeApi(page, 500, 'INTERNAL_ERROR');
    await page.goto('/bang-gia');
    test.skip(!(await openForm(page)), 'form đang tắt');
    await fillAndSend(page);
    await expect(page.locator('[data-lead-block] [role="alert"]')).toContainText('Mã lỗi: 0B9F3C2E');
  });

  test('503 LEADS_DISABLED lúc chạy: form được thay bằng khối Gọi · email', async ({ page }) => {
    await fakeApi(page, 503, 'LEADS_DISABLED');
    await page.goto('/bang-gia');
    test.skip(!(await openForm(page)), 'form đang tắt');
    await fillAndSend(page);
    const block = page.locator('[data-lead-block]');
    await expect(block.locator('form')).toHaveCount(0);
    await expect(block.locator('a[href^="tel:"]').first()).toBeVisible();
    await expect(block.locator('a[href^="mailto:"]')).toHaveCount(1);
  });

  test('409 CONSENT_VERSION_OUTDATED: tải lại, điền lại dữ liệu, đồng ý phải tick lại', async ({ page }) => {
    await fakeApi(page, 409, 'CONSENT_VERSION_OUTDATED');
    await page.goto('/bang-gia');
    test.skip(!(await openForm(page)), 'form đang tắt');
    await fillAndSend(page);
    await expect(page.locator('[data-lead-block] [role="status"]')).toContainText('Điều khoản vừa cập nhật');
    await page.waitForEvent('load');
    await openForm(page);
    await expect(page.locator('#lead-b2b-company')).toHaveValue('Cong ty Thu Nghiem');
    await expect(page.locator('#lead-b2b-provinces-all')).toBeChecked();
    await expect(page.locator('#lead-b2b-consent-b2b_sales_contact')).not.toBeChecked();
    await expect(page.locator('[data-lead-block] [role="status"]')).toContainText('đã được điền lại');
  });

  test('Rule 7: sửa dữ liệu sau lỗi 4xx → Idempotency-Key mới; gửi lại sau 500 không sửa → giữ key', async ({ page }) => {
    const keys: string[] = [];
    let status = 500;
    await page.route(`**${API}`, (route) => {
      keys.push(route.request().headers()['idempotency-key'] ?? '');
      return route.fulfill({
        status,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ success: false, error: { code: status === 500 ? 'INTERNAL_ERROR' : 'CAPTCHA_FAILED', details: [] } }),
      });
    });
    await page.goto('/bang-gia');
    test.skip(!(await openForm(page)), 'form đang tắt');
    await fillAndSend(page);
    const submit = page.locator('[data-lead-block] button[type="submit"]');
    await expect(page.locator('[data-lead-block] [role="alert"]')).toBeVisible();
    status = 403;
    await submit.click(); // gửi lại sau 500, không sửa gì → cùng key
    await expect.poll(() => keys.length).toBe(2);
    await page.locator('#lead-b2b-jobTitle').fill('Giam doc'); // sửa sau lỗi 4xx → key mới
    await submit.click();
    await expect.poll(() => keys.length).toBe(3);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[1]);
  });
});

test.describe('a11y trạng thái lỗi', () => {
  for (const path of ['/bang-gia', '/en/technician-partners']) {
    test(`axe 0 lỗi serious/critical khi form đang báo lỗi: ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      test.skip(!(await openForm(page)), 'form đang tắt');
      await page.locator('[data-lead-block] button[type="submit"]').click();
      await expect(page.locator('[data-lead-block] [role="alert"]')).toBeVisible();
      const results = await new AxeBuilder({ page })
        .include('[data-lead-block]')
        .exclude('[data-turnstile-slot]') // iframe Cloudflare, không phải mã của site
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blocking = results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical' || v.id === 'color-contrast')
        .map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
  }
});

test.describe('form tắt (bản production khi câu đồng ý chưa duyệt)', () => {
  test('AC-C10: không có form, có khối Gọi · email thay thế', async ({ page }) => {
    await page.goto('/bang-gia');
    const block = page.locator('[data-lead-block]');
    test.skip((await leadState(page)) === 'enabled', 'form đang bật (bản xem trước)');
    await block.scrollIntoViewIfNeeded();
    await expect(block.locator('a[href^="tel:"]')).toHaveCount(1);
    await expect(block.locator('a[href^="mailto:"]')).toHaveCount(1);
    await expect(block.locator('form')).toHaveCount(0);
  });

  test('AC-C10 form thợ: #dang-ky không có form, có Gọi · email tuyển thợ', async ({ page }) => {
    await page.goto('/doi-tac-tho');
    test.skip((await page.locator('#dang-ky [data-lead-block][data-lead-state="enabled"]').count()) > 0, 'form đang bật');
    const section = page.locator('#dang-ky');
    await expect(section.locator('form')).toHaveCount(0);
    await expect(section.locator('a[href^="tel:"]')).toHaveCount(1);
    await expect(section.locator('a[href^="mailto:"]')).toHaveCount(1);
  });

  test('nút "Nhận báo giá" trong trang cuộn tới khối liên hệ của chính trang, không sang trang chủ', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'một project là đủ');
    await page.goto('/bang-gia', { waitUntil: 'networkidle' });
    const block = page.locator('[data-lead-block]');
    test.skip((await leadState(page)) === 'enabled', 'form đang bật (bản xem trước)');
    await page.locator('#gia-hop-dong a[href$="#bao-gia"]').first().click();
    await expect(block.locator('a[href^="tel:"]').first()).toBeFocused();
    expect(new URL(page.url()).pathname).toBe('/bang-gia');
  });
});
