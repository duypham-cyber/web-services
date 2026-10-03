/**
 * POST /api/v1/leads — contracts/lead-b2b.md mục 3.1 (bảng thứ tự xử lý, bắt buộc giữ thứ tự) + lead-technician.md mục 3.
 * APPROVED 03/10/2026 (docs/DECISIONS.md D-26). CHỈ SERVER.
 *
 * Route Handler (app/api/v1/leads/route.ts) chỉ gọi `handleLeadPost(request, createLeadDeps({ schedule: after }))`.
 * Tách ra đây để test tích hợp gọi thẳng bằng `Request` với DB test thật (tests/leads/), không cần Next.
 *
 * Thứ tự: 0 form tắt → 1 correlationId → 2 Origin → 3 Content-Type + 16 KB → 4 rate-limit → 5 parse JSON
 *         (+ form của type này tắt) → 6 honeypot → 7 Idempotency-Key → 8 Zod → 9 consent → 10 (D-03 = nhận, không chặn)
 *         → 11 Turnstile → 12 transaction leads + lead_notifications → 13 trả 201 → 14 after(): gửi thông báo lần 1.
 */
import { randomUUID } from 'node:crypto';
import { activeConsentVersions, checkConsent, type ConsentContext } from './consent';
import { readLeadsConfig, type LeadsConfig } from './config';
import { findLeadByIdempotencyKey, getPool, insertLeadWithNotifications, isIdempotencyConflict, type Db } from './db';
import { clientIpFromHeaders, hashIp } from './ip';
import { createLeadLogger, errorInfo, type LeadLogger } from './logger';
import { createMailTransport, mailFrom, type MailTransport } from './notify/transport';
import { NOTIFY_ROUTES, deliverLeadNotifications, recipientsFromEnv, type OutboxContext } from './outbox';
import { createRateLimiter, type RateLimiter } from './rate-limit';
import {
  LEAD_TYPES,
  MAX_BODY_BYTES,
  isFreeEmailDomain,
  isLeadType,
  leadReference,
  type LeadErrorCode,
  type LeadErrorDetail,
  type LeadType,
} from './rules';
import { LeadRequest, detail, detailFields, issuesToDetails, sanitizeMeta } from './schema';
import { verifyTurnstile, type TurnstileOutcome } from './turnstile';

/** Shape của payload (contract mục 2.1). Đổi shape = tăng số này + CR. */
export const PAYLOAD_VERSION = 1;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** error.message viết cho developer (tiếng Anh). FE KHÔNG hiện message, chỉ ánh xạ code. */
const ERROR_MESSAGES: Record<LeadErrorCode, string> = {
  INVALID_JSON: 'Request body must be a JSON object sent with Content-Type: application/json',
  VALIDATION_ERROR: 'Request validation failed',
  FORBIDDEN_ORIGIN: 'Origin is not allowed',
  CAPTCHA_FAILED: 'Captcha verification failed',
  CONSENT_VERSION_OUTDATED: 'Consent version is no longer accepted, reload the page',
  PAYLOAD_TOO_LARGE: 'Payload too large',
  CONSENT_REQUIRED: 'A required consent purpose is missing',
  EMAIL_DOMAIN_NOT_ALLOWED: 'Email domain is not allowed',
  RATE_LIMITED: 'Too many requests',
  INTERNAL_ERROR: 'Internal error',
  LEADS_DISABLED: 'Lead intake is disabled',
};

type Env = Record<string, string | undefined>;

export type LeadHandlerDeps = {
  config: LeadsConfig;
  /** Lấy pool lúc cần (bước 7, 12) — request bị chặn sớm không mở kết nối DB. */
  db: () => Db;
  logger: LeadLogger;
  rateLimiter: RateLimiter;
  now: () => Date;
  /** Lúc tiến trình server khởi động (≈ lúc deploy): mốc cửa sổ 24 giờ của version đồng ý liền trước (Rule 2). */
  serverStartedAt: Date;
  turnstile: (input: { token: string | undefined; expectedAction: LeadType }) => Promise<TurnstileOutcome>;
  outbox: () => OutboxContext;
  /** Route: `after` của next/server. Test: chạy và chờ ngay. */
  schedule: (task: () => Promise<unknown>) => void;
};

const STARTED_KEY = Symbol.for('bluebolt-web.leads.server-started-at');
function serverStartedAt(): Date {
  const g = globalThis as unknown as Record<symbol, Date | undefined>;
  return (g[STARTED_KEY] ??= new Date());
}

export type CreateLeadDepsOptions = {
  schedule: LeadHandlerDeps['schedule'];
  env?: Env;
  logger?: LeadLogger;
  now?: () => Date;
  rateLimiter?: RateLimiter;
  /** Ghi đè URL siteverify (test dựng máy chủ giả trên loopback). */
  turnstileUrl?: string;
  /** undefined = chọn theo env (SMTP / tệp .eml / không có). */
  transport?: MailTransport | null;
  /** Thư mục gốc cho LEAD_MAIL_DIR tương đối. Mặc định process.cwd() (gốc repo khi chạy next dev/start). */
  cwd?: string;
  serverStartedAt?: Date;
};

/** Phụ thuộc mặc định: đọc env của tiến trình lúc gọi (không đóng băng lúc build). */
export function createLeadDeps(options: CreateLeadDepsOptions): LeadHandlerDeps {
  const env = options.env ?? process.env;
  const config = readLeadsConfig(env);
  const logger = options.logger ?? createLeadLogger();
  const db = () =>
    getPool(config.databaseUrl ?? '', {
      onError: (err) => logger.error('lead_db_error', { error: errorInfo(err) }),
    });
  return {
    config,
    db,
    logger,
    rateLimiter: options.rateLimiter ?? createRateLimiter(),
    now: options.now ?? (() => new Date()),
    serverStartedAt: options.serverStartedAt ?? serverStartedAt(),
    turnstile: ({ token, expectedAction }) =>
      verifyTurnstile({
        token,
        expectedAction,
        secret: config.turnstileSecret ?? '',
        allowedHostnames: config.turnstileAllowedHostnames,
        timeoutMs: config.turnstileTimeoutMs,
        url: options.turnstileUrl,
      }),
    outbox: () => ({
      db: db(),
      transport: options.transport !== undefined ? options.transport : createMailTransport(env, options.cwd),
      recipients: recipientsFromEnv(env),
      from: mailFrom(env),
      logger,
    }),
    schedule: options.schedule,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Phản hồi
// ---------------------------------------------------------------------------------------------------------------------
function baseHeaders(correlationId: string, extra: Record<string, string> = {}): Headers {
  return new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-correlation-id': correlationId,
    ...extra,
  });
}

function errorResponse(
  status: number,
  code: LeadErrorCode,
  correlationId: string,
  details: LeadErrorDetail[] = [],
  extraHeaders: Record<string, string> = {},
): Response {
  const body = { success: false, error: { code, message: ERROR_MESSAGES[code], details, correlationId } };
  return new Response(JSON.stringify(body), { status, headers: baseHeaders(correlationId, extraHeaders) });
}

function createdResponse(
  data: { id: string; type: LeadType; receivedAt: Date },
  correlationId: string,
  replayed = false,
): Response {
  const body = {
    success: true,
    data: { id: data.id, reference: leadReference(data.id), type: data.type, receivedAt: data.receivedAt.toISOString() },
  };
  return new Response(JSON.stringify(body), {
    status: 201,
    headers: baseHeaders(correlationId, replayed ? { 'idempotent-replayed': 'true' } : {}),
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// Đọc body có giới hạn 16 KB (không đọc hết một body khổng lồ vào bộ nhớ)
// ---------------------------------------------------------------------------------------------------------------------
type BodyRead = { ok: true; text: string } | { ok: false; tooLarge: true };

async function readBodyLimited(request: Request, max: number): Promise<BodyRead> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > max) return { ok: false, tooLarge: true };
  if (!request.body) return { ok: true, text: '' };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return { ok: false, tooLarge: true };
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return { ok: true, text: new TextDecoder('utf-8', { fatal: false }).decode(all) };
}

function isJsonContentType(value: string | null): boolean {
  if (!value) return false;
  const mime = value.split(';')[0]?.trim().toLowerCase();
  return mime === 'application/json';
}

// ---------------------------------------------------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------------------------------------------------
export async function handleLeadPost(request: Request, deps: LeadHandlerDeps): Promise<Response> {
  // Bước 1: correlationId — nhận từ client nếu là UUID, không thì sinh mới
  const incomingCid = request.headers.get('x-correlation-id')?.trim() ?? '';
  const correlationId = UUID.test(incomingCid) ? incomingCid.toLowerCase() : randomUUID();
  const { config, logger } = deps;
  let type: LeadType | null = null;

  try {
    const now = deps.now();
    const consentCtx: ConsentContext = {
      now,
      // Câu đồng ý nháp dùng được ở mọi nơi TRỪ site thật (production không DRAFT_PREVIEW) — AC-C10
      draftPreview: !config.liveProduction,
      serverStartedAt: deps.serverStartedAt,
    };

    // Bước 0: form tắt (công tắc, cấu hình thiếu, hoặc không type nào có câu đồng ý dùng được)
    if (!config.formEnabled) {
      logger.info('lead_disabled', { correlationId, reason: 'switch_off' });
      return errorResponse(503, 'LEADS_DISABLED', correlationId);
    }
    if (config.problems.length > 0) {
      logger.error('lead_config_error', { correlationId, missing: config.problems });
      return errorResponse(503, 'LEADS_DISABLED', correlationId);
    }
    if (LEAD_TYPES.every((t) => activeConsentVersions(t, consentCtx).length === 0)) {
      logger.info('lead_disabled', { correlationId, reason: 'consent_unapproved' });
      return errorResponse(503, 'LEADS_DISABLED', correlationId);
    }

    // Bước 2: Origin có mặt mà không thuộc danh sách → 403 (request không có Origin, vd curl, vẫn đi tiếp)
    const origin = request.headers.get('origin');
    if (origin !== null && !config.allowedOrigins.includes(origin)) {
      logger.warn('lead_rejected', { correlationId, code: 'FORBIDDEN_ORIGIN' });
      return errorResponse(403, 'FORBIDDEN_ORIGIN', correlationId);
    }

    // Bước 3: Content-Type JSON + body ≤ 16 KB
    if (!isJsonContentType(request.headers.get('content-type'))) {
      logger.warn('lead_rejected', { correlationId, code: 'INVALID_JSON', reason: 'content_type' });
      return errorResponse(400, 'INVALID_JSON', correlationId);
    }
    const body = await readBodyLimited(request, MAX_BODY_BYTES);
    if (!body.ok) {
      logger.warn('lead_rejected', { correlationId, code: 'PAYLOAD_TOO_LARGE' });
      return errorResponse(413, 'PAYLOAD_TOO_LARGE', correlationId);
    }

    // Bước 4: rate-limit trong app theo ip_hash (IP thô chỉ sống trong biến cục bộ này)
    const ipHash = hashIp(clientIpFromHeaders(request.headers, config.clientIpSource), config.ipHashSecret ?? '');
    const limit = deps.rateLimiter.hit(ipHash, now.getTime(), config.rateLimitMax, config.rateLimitWindowSec * 1000);
    if (!limit.allowed) {
      logger.warn('lead_rate_limited', { correlationId });
      return errorResponse(429, 'RATE_LIMITED', correlationId, [], { 'retry-after': String(limit.retryAfterSec) });
    }

    // Bước 5: parse JSON — phải là object
    let parsed: unknown;
    try {
      parsed = JSON.parse(body.text);
    } catch {
      parsed = undefined;
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      logger.warn('lead_rejected', { correlationId, code: 'INVALID_JSON' });
      return errorResponse(400, 'INVALID_JSON', correlationId);
    }
    const raw = parsed as Record<string, unknown>;
    type = isLeadType(raw.type) ? raw.type : null;

    // (bước 0 theo type) Câu đồng ý của type này chưa dùng được ở môi trường này → form type này tắt
    if (type !== null && activeConsentVersions(type, consentCtx).length === 0) {
      logger.info('lead_disabled', { correlationId, type, reason: 'consent_unapproved' });
      return errorResponse(503, 'LEADS_DISABLED', correlationId);
    }

    // Bước 6: honeypot — `hp` không phải chuỗi, hoặc có ký tự khác khoảng trắng → 201 giả, không DB, không thông báo
    if (raw.hp !== undefined && (typeof raw.hp !== 'string' || raw.hp.trim() !== '')) {
      logger.warn('lead_honeypot', { correlationId, type });
      return createdResponse({ id: randomUUID(), type: type ?? 'lead_b2b', receivedAt: now }, correlationId);
    }

    // Bước 7: Idempotency-Key đã có → replay cùng data
    const keyHeader = request.headers.get('idempotency-key');
    let idempotencyKey: string | null = null;
    if (keyHeader !== null) {
      if (!UUID.test(keyHeader.trim())) {
        const details = [detail('headers.Idempotency-Key', 'invalid_format')];
        logger.warn('lead_rejected', { correlationId, type, code: 'VALIDATION_ERROR', fields: detailFields(details) });
        return errorResponse(400, 'VALIDATION_ERROR', correlationId, details);
      }
      idempotencyKey = keyHeader.trim().toLowerCase();
      const existing = await findLeadByIdempotencyKey(deps.db(), idempotencyKey);
      if (existing) {
        logger.info('lead_replayed', { correlationId, type: existing.type, leadId: existing.id });
        return createdResponse({ id: existing.id, type: existing.type, receivedAt: existing.createdAt }, correlationId, true);
      }
    }

    // Bước 8: Zod (strict cho fields/consent; siêu dữ liệu lỏng đi qua sanitizeMeta)
    const result = LeadRequest.safeParse(raw);
    if (!result.success) {
      const details = issuesToDetails(result.error.issues, raw);
      logger.warn('lead_rejected', { correlationId, type, code: 'VALIDATION_ERROR', fields: detailFields(details) });
      return errorResponse(400, 'VALIDATION_ERROR', correlationId, details);
    }
    const data = result.data;
    type = data.type;

    // Bước 9: consent — version còn hiệu lực (409) → mục đích lạ (400) → thiếu mục đích bắt buộc (422)
    const consent = checkConsent(data.type, data.consent, consentCtx);
    if (!consent.ok) {
      const details = consent.code === 'CONSENT_VERSION_OUTDATED' ? [] : consent.details;
      logger.warn('lead_rejected', { correlationId, type, code: consent.code, fields: detailFields(details) });
      return errorResponse(consent.status, consent.code, correlationId, details);
    }

    // Bước 10: D-03 = nhận email tên miền miễn phí (anh Duy duyệt mặc định, D-26) → chỉ gắn cờ, không chặn
    const emailFreeDomain = data.type === 'lead_b2b' ? isFreeEmailDomain(data.fields.workEmail) : undefined;

    // Bước 11: Turnstile (sau Zod + consent để lỗi nhập liệu không đốt token dùng một lần)
    const captcha = await deps.turnstile({ token: data.turnstileToken, expectedAction: data.type });
    if (captcha.result === 'failed') {
      logger.warn('lead_rejected', { correlationId, type, code: 'CAPTCHA_FAILED', turnstileError: captcha.reason });
      return errorResponse(403, 'CAPTCHA_FAILED', correlationId);
    }
    if (captcha.result === 'unverified') {
      // D-09: lỗi mạng/timeout/5xx → vẫn nhận lead, gắn cờ; lỗi khóa của mình → báo động
      logger.warn('lead_captcha_unverified', { correlationId, type, turnstileError: captcha.reason });
      if (captcha.misconfigured) logger.error('lead_captcha_misconfigured', { correlationId, type, turnstileError: captcha.reason });
    }

    // Bước 12: một transaction ghi lead + outbox
    const metaIn = sanitizeMeta(raw);
    const meta: Record<string, unknown> = {
      captcha: captcha.result,
      ...(emailFreeDomain !== undefined ? { emailFreeDomain } : {}),
      sanitized: metaIn.sanitized,
    };
    let stored: { id: string; type: LeadType; createdAt: Date };
    try {
      stored = await insertLeadWithNotifications(
        deps.db(),
        {
          type: data.type,
          payload: data.fields as Record<string, unknown>,
          payloadVersion: PAYLOAD_VERSION,
          consentVersion: consent.version.version,
          consentPurposes: consent.accepted,
          ipHash,
          utm: metaIn.utm,
          locale: metaIn.locale,
          pagePath: metaIn.pagePath,
          filmTier: metaIn.filmTier,
          meta,
          idempotencyKey,
          correlationId,
        },
        NOTIFY_ROUTES[data.type],
      );
    } catch (err) {
      if (idempotencyKey !== null && isIdempotencyConflict(err)) {
        // Hai request cùng khóa chạy song song: dòng kia đã thắng → trả replay
        const existing = await findLeadByIdempotencyKey(deps.db(), idempotencyKey);
        if (existing) {
          logger.info('lead_replayed', { correlationId, type: existing.type, leadId: existing.id });
          return createdResponse({ id: existing.id, type: existing.type, receivedAt: existing.createdAt }, correlationId, true);
        }
      }
      throw err;
    }

    // Bước 13 + 14
    logger.info('lead_received', {
      correlationId,
      leadId: stored.id,
      type: stored.type,
      ...(data.type === 'lead_b2b' ? { intent: data.fields.intent } : {}),
      locale: metaIn.locale,
      filmTier: metaIn.filmTier,
      utmSource: metaIn.utm.source ?? null,
      captcha: captcha.result,
    });
    const leadId = stored.id;
    deps.schedule(async () => {
      await deliverLeadNotifications(deps.outbox(), leadId);
    });
    return createdResponse({ id: stored.id, type: stored.type, receivedAt: stored.createdAt }, correlationId);
  } catch (err) {
    // DB lỗi hoặc lỗi không lường trước: log đầy đủ ở server, response không có stack trace
    logger.error('lead_db_error', { correlationId, type, error: errorInfo(err) });
    return errorResponse(500, 'INTERNAL_ERROR', correlationId);
  }
}
