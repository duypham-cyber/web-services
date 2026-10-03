import { existsSync, readdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
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

async function formEnabled(page: Page): Promise<boolean> {
  return (await page.locator('[data-lead-block] form').count()) > 0;
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
  test('AC-C2: checkbox không tick sẵn ở HTML server và sau hydrate; có link chính sách', async ({ page, request }) => {
    const html = await (await request.get('/bang-gia')).text();
    test.skip(!html.includes('id="lead-b2b-fullName"'), 'form đang tắt (bản production)');
    const boxes = [...html.matchAll(/<input[^>]*type="checkbox"[^>]*>/g)].map((m) => m[0]);
    expect(boxes.length).toBeGreaterThan(30);
    expect(boxes.filter((b) => /\schecked(=|\s|>)/.test(b))).toEqual([]);
    expect(html).toContain('href="/chinh-sach-bao-mat"');

    await page.goto('/bang-gia');
    await expect(page.locator('[data-lead-block] form button[type="submit"]')).toBeEnabled();
    await expect(page.locator('[data-lead-block] input[type="checkbox"]:checked')).toHaveCount(0);
  });

  test('Turnstile chỉ tải sau lần tương tác đầu; honeypot không lọt cây a11y', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('challenges.cloudflare.com')) hits.push(r.url());
    });
    await page.goto('/bang-gia', { waitUntil: 'networkidle' });
    test.skip(!(await formEnabled(page)), 'form đang tắt');
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
    test.skip(!(await formEnabled(page)), 'form đang tắt');

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
    test.skip(!(await formEnabled(page)), 'form đang tắt');
    await page.locator('[data-lead-block] button[type="submit"]').click();
    await expect(page.locator('#lead-b2b-fullName')).toBeFocused();
    await expect(page.locator('[data-lead-block] [aria-invalid="true"]')).not.toHaveCount(0);
  });

  test('AC-C1/AC-B1: gửi hợp lệ → cảm ơn tại chỗ + mã; DB 1 dòng đúng; thông báo b2b_sales; tệp .eml', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'ca ghi DB chỉ chạy ở desktop-1440');
    test.skip(!OPS_URL, 'thiếu DATABASE_URL_OPS');
    await stubUmami(page);
    await page.goto('/bang-gia');
    test.skip(!(await formEnabled(page)), 'form đang tắt');

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
    test.skip(!(await formEnabled(page)), 'form đang tắt');

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
    await page.goto('/giai-phap/hang-dien-may');
    test.skip(!(await formEnabled(page)), 'form đang tắt');
    await page.locator('#cta-cuoi a[href$="#dat-lich-demo"]').first().click();
    await expect(page.locator('#lead-b2b-title')).toContainText('Đặt lịch demo 30 phút');
    await expect(page.locator('#lead-b2b-fullName')).toBeFocused();
    await page.locator('header a[href$="#bao-gia"]').first().click();
    await expect(page.locator('#lead-b2b-title')).toContainText('Nhận báo giá cho doanh nghiệp');
    expect(new URL(page.url()).pathname).toBe('/giai-phap/hang-dien-may');
  });

  test('AC-C11: bản EN — nhãn, lỗi tiếng Anh, không chữ tiếng Việt trong form', async ({ page }) => {
    await page.goto('/en/solutions/marketplaces-retail');
    test.skip(!(await formEnabled(page)), 'form đang tắt');
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
      test.skip(!(await formEnabled(page)), 'form đang tắt');
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
    await page.goto('/doi-tac-tho');
    test.skip(!(await formEnabled(page)), 'form đang tắt');
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
    test.skip(!(await formEnabled(page)), 'form đang tắt');

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

test.describe('form tắt (bản production khi câu đồng ý chưa duyệt)', () => {
  test('AC-C10: không có form, có khối Gọi · email thay thế', async ({ page }) => {
    await page.goto('/bang-gia');
    test.skip(await formEnabled(page), 'form đang bật (bản xem trước)');
    const block = page.locator('[data-lead-block]');
    await expect(block.locator('a[href^="tel:"]')).toHaveCount(1);
    await expect(block.locator('a[href^="mailto:"]')).toHaveCount(1);
    await expect(block.locator('form')).toHaveCount(0);
  });
});
