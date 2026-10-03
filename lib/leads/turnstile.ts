/**
 * Cloudflare Turnstile — kiểm token ở server (contracts/lead-b2b.md bước 11, mục 6.5; D-09 đã duyệt ở D-26).
 *
 * - Gọi siteverify với URL cố định, timeout 3 s, KHÔNG gửi `remoteip` (không đưa IP ra ngoài).
 * - Kết quả: passed · test (khóa test chính thức) · failed (→ 403 CAPTCHA_FAILED) · unverified (lỗi mạng/timeout/5xx hoặc
 *   Cloudflare báo lỗi phía mình → vẫn nhận lead, meta.captcha='unverified', D-09).
 * - Khóa test (tra tài liệu Cloudflare 03/10/2026, developers.cloudflare.com/turnstile/troubleshooting/testing):
 *   sitekey luôn qua 1x00000000000000000000AA (hiện) / 1x00000000000000000000BB (ẩn), luôn trượt 2x00000000000000000000AB;
 *   secret luôn qua 1x0000000000000000000000000000000AA, luôn trượt 2x…AA, "token đã dùng" 3x…AA. Gọi thử siteverify thật
 *   cùng ngày: khóa test trả `hostname: "example.com"`, KHÔNG có `action`, có `metadata.result_with_testing_key: true`
 *   (tài liệu ghi "localhost"/"test" — thực tế khác). Vì vậy ở chế độ test KHÔNG kiểm hostname/action; production cấm khóa
 *   test (config.ts báo lỗi cấu hình → form tắt).
 * - Lớp thứ hai (review L5): kết quả "test" chỉ được coi là qua khi KHÔNG phải site thật. Site thật (NODE_ENV=production,
 *   không DRAFT_PREVIEW) mà siteverify trả kết quả khóa test → failed + misconfigured (403 CAPTCHA_FAILED, log error).
 *   Bản xem trước giữ nguyên hành vi (khóa test → 'test').
 */

export const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const TURNSTILE_TEST_SITEKEYS = {
  passVisible: '1x00000000000000000000AA',
  passInvisible: '1x00000000000000000000BB',
  failVisible: '2x00000000000000000000AB',
  failInvisible: '2x00000000000000000000BB',
  interactive: '3x00000000000000000000FF',
} as const;

export const TURNSTILE_TEST_SECRETS = {
  pass: '1x0000000000000000000000000000000AA',
  fail: '2x0000000000000000000000000000000AA',
  spent: '3x0000000000000000000000000000000AA',
} as const;

/** Token giả mà sitekey test sinh ra. */
export const TURNSTILE_DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

const TEST_SECRETS: ReadonlySet<string> = new Set(Object.values(TURNSTILE_TEST_SECRETS));

export function isTurnstileTestSecret(secret: string): boolean {
  return TEST_SECRETS.has(secret);
}

export type TurnstileOutcome =
  | { result: 'passed' }
  | { result: 'test' }
  | { result: 'failed'; reason: string; misconfigured?: boolean }
  | { result: 'unverified'; reason: string; misconfigured: boolean };

export type VerifyTurnstileInput = {
  token: string | undefined;
  secret: string;
  expectedAction: string;
  allowedHostnames: readonly string[];
  /** Site thật (NODE_ENV=production và không DRAFT_PREVIEW): kết quả khóa test bị coi là failed. Bắt buộc truyền. */
  liveProduction: boolean;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  url?: string;
};

type SiteverifyBody = {
  success?: unknown;
  hostname?: unknown;
  action?: unknown;
  'error-codes'?: unknown;
  metadata?: { result_with_testing_key?: unknown } | null;
};

/** Lỗi phía cấu hình của mình: không phạt người dùng thật, nhưng phải báo động (log error). */
const OUR_SIDE_ERRORS = new Set(['missing-input-secret', 'invalid-input-secret']);

export async function verifyTurnstile(input: VerifyTurnstileInput): Promise<TurnstileOutcome> {
  const token = input.token?.trim();
  if (!token) return { result: 'failed', reason: 'missing-input-response' };

  let res: Response;
  try {
    res = await (input.fetchImpl ?? fetch)(input.url ?? TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: input.secret, response: token }),
      signal: AbortSignal.timeout(input.timeoutMs ?? 3000),
      cache: 'no-store',
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    return { result: 'unverified', reason: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network', misconfigured: false };
  }
  if (res.status >= 500) return { result: 'unverified', reason: `http_${res.status}`, misconfigured: false };

  let data: SiteverifyBody;
  try {
    data = (await res.json()) as SiteverifyBody;
  } catch {
    return { result: 'unverified', reason: 'bad_response', misconfigured: false };
  }

  const errorCodes = Array.isArray(data['error-codes']) ? data['error-codes'].map(String) : [];
  if (data.success !== true) {
    const ours = errorCodes.find((c) => OUR_SIDE_ERRORS.has(c));
    if (ours) return { result: 'unverified', reason: ours, misconfigured: true };
    if (errorCodes.includes('internal-error')) return { result: 'unverified', reason: 'internal-error', misconfigured: false };
    return { result: 'failed', reason: errorCodes[0] ?? `http_${res.status}` };
  }

  const testMode = isTurnstileTestSecret(input.secret) || data.metadata?.result_with_testing_key === true;
  if (testMode) {
    return input.liveProduction ? { result: 'failed', reason: 'testing-key-on-production', misconfigured: true } : { result: 'test' };
  }

  const hostname = typeof data.hostname === 'string' ? data.hostname.toLowerCase() : '';
  if (!input.allowedHostnames.includes(hostname)) return { result: 'failed', reason: 'hostname-mismatch' };
  if (data.action !== input.expectedAction) return { result: 'failed', reason: 'action-mismatch' };
  return { result: 'passed' };
}
