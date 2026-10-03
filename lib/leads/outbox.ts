/**
 * Gửi thông báo và thử lại (outbox) — contracts/lead-b2b.md mục 3.5. CHỈ SERVER (route handler qua after(), và
 * scripts/leads-notify-retry.mjs mỗi 5 phút).
 *
 * Luật: lưu DB trước, gửi sau; gửi không bao giờ nằm trong transaction ghi lead và không bao giờ làm request lỗi.
 * - Nhận việc bằng lease: UPDATE … attempts+1, next_attempt_at = NOW()+10 phút … FOR UPDATE SKIP LOCKED → hai tiến trình
 *   chạy chồng nhau không nhận trùng dòng. Sập giữa chừng: lease hết hạn, dòng được nhận lại (ít nhất một lần; trùng thì
 *   người nhận nhận ra nhờ mã tham chiếu).
 * - Lịch thử tối đa 8 lần (~22 giờ): ngay · 1 phút · 5 phút · 15 phút · 1 giờ · 3 giờ · 6 giờ · 12 giờ. Hết lượt → dead,
 *   log error lead_notify_dead. Dòng pending cũ hơn 30 phút → log error lead_notify_backlog.
 * - Log chỉ có leadId, channel, target, attempts, errorCode — không nội dung lead, không địa chỉ nhận.
 */
import type { Db } from './db';
import type { LeadLogger } from './logger';
import { buildLeadEmail, type StoredLead } from './notify/email';
import { MailError, mailErrorCode, type MailTransport } from './notify/transport';
import { leadReference, type LeadType } from './rules';

export const MAX_ATTEMPTS = 8;
/** Phút chờ sau lần thử thứ n thất bại (n = 1…7). Lần 8 thất bại → dead. */
export const BACKOFF_MINUTES = [1, 5, 15, 60, 180, 360, 720] as const;
export const LEASE_MINUTES = 10;
export const BACKLOG_MINUTES = 30;

/** Rule 6: định tuyến theo type. Đích là KHÓA cấu hình, địa chỉ thật nằm trong biến môi trường. */
export const NOTIFY_ROUTES: Record<LeadType, readonly { channel: 'email'; target: 'b2b_sales' | 'technician_hr' }[]> = {
  lead_b2b: [{ channel: 'email', target: 'b2b_sales' }],
  lead_technician: [{ channel: 'email', target: 'technician_hr' }],
};

export type Recipients = Record<string, string | undefined>;

export function recipientsFromEnv(env: Record<string, string | undefined> = process.env): Recipients {
  return {
    b2b_sales: env.LEAD_NOTIFY_EMAIL_B2B?.trim() || undefined,
    technician_hr: env.LEAD_NOTIFY_EMAIL_TECHNICIAN?.trim() || undefined,
  };
}

export type OutboxContext = {
  db: Db;
  /** null = không có kênh gửi (production thiếu SMTP) → ghi lỗi, thử lại sau. */
  transport: MailTransport | null;
  recipients: Recipients;
  from: string;
  logger: LeadLogger;
};

type Claimed = { id: string; lead_id: string; channel: string; target: string; attempts: number };

const CLAIM_SQL = (byLead: boolean) => `
UPDATE lead_notifications
   SET attempts = attempts + 1, next_attempt_at = NOW() + make_interval(mins => ${LEASE_MINUTES})
 WHERE id IN (SELECT id FROM lead_notifications
               WHERE status = 'pending' AND next_attempt_at <= NOW() ${byLead ? 'AND lead_id = $2::uuid' : ''}
               ORDER BY next_attempt_at
               LIMIT $1
               FOR UPDATE SKIP LOCKED)
RETURNING id, lead_id, channel, target, attempts`;

export async function claimNotifications(db: Db, options: { limit?: number; leadId?: string } = {}): Promise<Claimed[]> {
  const params: unknown[] = [options.limit ?? 20];
  if (options.leadId) params.push(options.leadId);
  const { rows } = await db.query<Claimed>(CLAIM_SQL(Boolean(options.leadId)), params);
  return rows;
}

async function loadLead(db: Db, id: string): Promise<StoredLead | null> {
  const { rows } = await db.query<StoredLead>(
    `SELECT id, type, payload, payload_version, consent_version, consent_purposes, consent_at, utm, locale, page_path,
            film_tier, meta, created_at
       FROM leads WHERE id = $1::uuid`,
    [id],
  );
  return rows[0] ?? null;
}

export type DeliveryOutcome = 'sent' | 'retry' | 'dead' | 'skipped';

async function deliverOne(ctx: OutboxContext, row: Claimed): Promise<DeliveryOutcome> {
  const base = { leadId: row.lead_id, channel: row.channel, target: row.target, attempts: row.attempts };
  try {
    const lead = await loadLead(ctx.db, row.lead_id);
    if (!lead) return 'skipped'; // lead vừa bị xóa (yêu cầu chủ thể dữ liệu) → dòng outbox đã bị xóa theo cascade
    if (row.channel !== 'email') throw new MailError('CHANNEL_NOT_SUPPORTED');
    if (!ctx.transport) throw new MailError('MAIL_TRANSPORT_MISSING');
    const to = ctx.recipients[row.target];
    if (!to) throw new MailError('NO_RECIPIENT');
    const email = buildLeadEmail(lead);
    await ctx.transport.send(
      { from: ctx.from, to, replyTo: email.replyTo, subject: email.subject, text: email.text, html: email.html },
      `${leadReference(lead.id)}-${row.target}-a${row.attempts}`,
    );
    await ctx.db.query(
      `UPDATE lead_notifications SET status = 'sent', sent_at = NOW(), last_error_code = NULL
        WHERE id = $1::uuid AND status = 'pending'`,
      [row.id],
    );
    ctx.logger.info('lead_notify_sent', base);
    return 'sent';
  } catch (err) {
    return recordFailure(ctx, row, base, err instanceof MailError ? err.code : mailErrorCode(err, 'SMTP'));
  }
}

async function recordFailure(
  ctx: OutboxContext,
  row: Claimed,
  base: { leadId: string; channel: string; target: string; attempts: number },
  errorCode: string,
): Promise<DeliveryOutcome> {
  const dead = row.attempts >= MAX_ATTEMPTS;
  const waitMinutes = BACKOFF_MINUTES[Math.min(row.attempts, BACKOFF_MINUTES.length) - 1] ?? BACKOFF_MINUTES[BACKOFF_MINUTES.length - 1];
  try {
    await ctx.db.query(
      dead
        ? `UPDATE lead_notifications SET status = 'dead', last_error_code = $2 WHERE id = $1::uuid AND status = 'pending'`
        : `UPDATE lead_notifications SET last_error_code = $2, next_attempt_at = NOW() + make_interval(mins => $3::int)
            WHERE id = $1::uuid AND status = 'pending'`,
      dead ? [row.id, errorCode] : [row.id, errorCode, waitMinutes],
    );
  } catch (dbErr) {
    // Không ghi được trạng thái: lease 10 phút hết hạn thì dòng được nhận lại
    ctx.logger.error('lead_notify_error', { ...base, errorCode: mailErrorCode(dbErr, 'SMTP') });
  }
  // Thiếu kênh/địa chỉ là lỗi cấu hình → mức error ngay từ lần đầu
  const configError = errorCode === 'MAIL_TRANSPORT_MISSING' || errorCode === 'NO_RECIPIENT' || errorCode === 'RECIPIENT_PLACEHOLDER';
  if (dead) ctx.logger.error('lead_notify_dead', { ...base, errorCode });
  else if (configError) ctx.logger.error('lead_notify_failed', { ...base, errorCode });
  else ctx.logger.warn('lead_notify_failed', { ...base, errorCode });
  return dead ? 'dead' : 'retry';
}

export type PassResult = { claimed: number; sent: number; failed: number; dead: number };

async function deliverRows(ctx: OutboxContext, rows: Claimed[], acc: PassResult) {
  for (const row of rows) {
    acc.claimed += 1;
    const outcome = await deliverOne(ctx, row);
    if (outcome === 'sent') acc.sent += 1;
    else if (outcome === 'dead') acc.dead += 1;
    else if (outcome === 'retry') acc.failed += 1;
  }
}

/** Lần gửi đầu ngay sau khi trả 201 (gọi trong after() của route). Không bao giờ ném lỗi. */
export async function deliverLeadNotifications(ctx: OutboxContext, leadId: string): Promise<PassResult> {
  const acc: PassResult = { claimed: 0, sent: 0, failed: 0, dead: 0 };
  try {
    await deliverRows(ctx, await claimNotifications(ctx.db, { leadId, limit: 10 }), acc);
  } catch (err) {
    ctx.logger.error('lead_notify_error', { leadId, errorCode: mailErrorCode(err, 'SMTP') });
  }
  return acc;
}

/** Một lượt của script retry: nhận từng lô 20 dòng tới hạn cho tới khi hết (tối đa maxBatches lô). */
export async function runRetryPass(ctx: OutboxContext, options: { batchSize?: number; maxBatches?: number } = {}): Promise<PassResult> {
  const acc: PassResult = { claimed: 0, sent: 0, failed: 0, dead: 0 };
  for (let i = 0; i < (options.maxBatches ?? 10); i += 1) {
    const rows = await claimNotifications(ctx.db, { limit: options.batchSize ?? 20 });
    if (rows.length === 0) break;
    await deliverRows(ctx, rows, acc);
  }
  return acc;
}

/** Giám sát: dòng pending cũ hơn 30 phút → log error lead_notify_backlog. Trả số dòng tồn. */
export async function checkBacklog(db: Db, logger: LeadLogger, olderThanMinutes = BACKLOG_MINUTES): Promise<number> {
  const { rows } = await db.query<{ n: number; oldest: number | null }>(
    `SELECT count(*)::int AS n, floor(extract(epoch FROM NOW() - min(created_at)) / 60)::int AS oldest
       FROM lead_notifications
      WHERE status = 'pending' AND created_at < NOW() - make_interval(mins => $1::int)`,
    [olderThanMinutes],
  );
  const n = rows[0]?.n ?? 0;
  if (n > 0) logger.error('lead_notify_backlog', { count: n, oldestMinutes: rows[0]?.oldest ?? undefined });
  return n;
}

/** Runbook (dead letter): sau khi sửa kênh gửi, đưa dòng dead về pending để thử lại từ đầu. */
export async function requeueDead(db: Db, leadId?: string): Promise<number> {
  const { rowCount } = await db.query(
    `UPDATE lead_notifications SET status = 'pending', attempts = 0, next_attempt_at = NOW(), last_error_code = NULL
      WHERE status = 'dead' ${leadId ? 'AND lead_id = $1::uuid' : ''}`,
    leadId ? [leadId] : [],
  );
  return rowCount ?? 0;
}
